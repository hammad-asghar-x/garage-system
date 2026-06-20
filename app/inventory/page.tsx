'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Sidebar from '@/components/layout/Sidebar'
import { useAuth } from '@/lib/useAuth'
import { toast } from 'sonner'
import { Package, CheckCircle, XCircle, Search, Clock, Plus, X } from 'lucide-react'

export default function InventoryPage() {
  const { user } = useAuth()
  const [parts, setParts] = useState<any[]>([])
  const [pendingRequests, setPendingRequests] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddPart, setShowAddPart] = useState(false)
  const [newPart, setNewPart] = useState({
    sku: '',
    name: '',
    category: '',
    quantity: 0,
    reorder_level: 5,
    unit_price: 0
  })

  useEffect(() => { 
    if (user) { 
      fetchParts()
      fetchRequests()
    } 
  }, [user])

  const fetchParts = async () => {
    const { data } = await supabase
      .from('parts')
      .select('*')
      .order('name')
    setParts((data as any) || [])
  }

  const fetchRequests = async () => {
    const { data, error } = await supabase
      .from('part_requests')
      .select(`
        id, quantity, status, created_at, part_id, work_order_id,
        parts (name, sku),
        work_orders (wo_number)
      `)
      .eq('status', 'PENDING')
      .order('created_at', { ascending: false })

    if (error) console.error('Error fetching requests:', error)
    setPendingRequests((data as any) || [])
  }

  const handleAddPart = async () => {
  if (!newPart.sku || !newPart.name) {
    toast.error('Missing Information', { description: 'Please fill in SKU and Name.' })
    return
  }

  try {
    // 1. Check if part with this SKU already exists (Select * to get all fields)
    const { data: existingPart } = await supabase
      .from('parts')
      .select('*') 
      .eq('sku', newPart.sku)
      .single()

    if (existingPart) {
      // 2. If exists, update the stock (add to existing quantity)
      const newQuantity = existingPart.quantity + newPart.quantity
      
      const { error: updateError } = await supabase
        .from('parts')
        .update({ 
          quantity: newQuantity,
          name: newPart.name || existingPart.name,
          unit_price: newPart.unit_price || existingPart.unit_price,
          category: newPart.category || existingPart.category
        })
        .eq('id', existingPart.id)

      if (updateError) throw updateError

      toast.success('Stock Updated!', { 
        description: `${existingPart.name} stock increased by ${newPart.quantity} (Total: ${newQuantity})` 
      })
    } else {
      // 3. If doesn't exist, create new part
      const { error: insertError } = await supabase.from('parts').insert([newPart])
      if (insertError) throw insertError

      toast.success('Part Added!', { description: `${newPart.name} added to inventory.` })
    }

    setShowAddPart(false)
    setNewPart({ sku: '', name: '', category: '', quantity: 0, reorder_level: 5, unit_price: 0 })
    fetchParts()
  } catch (error: any) {
    toast.error('Failed to add part', { description: error.message })
  }
}

  const handleApprove = async (reqId: string, partId: string, qty: number, woId: string) => {
    try {
      const { data: partData } = await supabase.from('parts').select('quantity').eq('id', partId).single()
      if (!partData || partData.quantity < qty) {
        return toast.error('Insufficient Stock!', { description: `Only ${partData?.quantity || 0} items left.` })
      }

      await supabase.from('parts').update({ quantity: partData.quantity - qty }).eq('id', partId)
      await supabase.from('part_requests').update({ status: 'APPROVED' }).eq('id', reqId)

      if (woId) {
        await supabase.from('work_orders').update({ status: 'PARTS_READY' }).eq('id', woId)
      }

      toast.success('Part Approved & Stock Deducted!', { description: 'Technician has been notified.' })
      fetchParts()
      fetchRequests()
    } catch (e: any) { 
      toast.error('Error', { description: e.message }) 
    }
  }

  const handleReject = async (reqId: string) => {
    await supabase.from('part_requests').update({ status: 'REJECTED' }).eq('id', reqId)
    toast.info('Request Rejected')
    fetchRequests()
  }

  const filteredParts = parts.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-64 p-8">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Inventory Management</h1>
            <p className="text-slate-600 mt-1">Manage parts stock and approve technician requests</p>
          </div>
          <Button onClick={() => setShowAddPart(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" /> Add New Part
          </Button>
        </div>

        {/* Pending Requests */}
        <Card className="mb-8 border-l-4 border-l-yellow-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-700">
              <Clock className="h-5 w-5" /> Pending Requests ({pendingRequests.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingRequests.length === 0 ? (
              <p className="text-slate-500 py-4">No pending requests at this time.</p>
            ) : (
              <div className="space-y-3">
                {pendingRequests.map((req) => (
                  <div key={req.id} className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div>
                      <p className="font-bold text-slate-800">
                        {req.parts?.name || 'Unknown Part'} 
                        <span className="text-slate-500 font-normal ml-2">({req.parts?.sku || 'N/A'})</span>
                      </p>
                      <p className="text-sm text-slate-600">
                        WO: <span className="font-mono font-bold text-blue-600">{req.work_orders?.wo_number || 'N/A'}</span>
                        {' • '}Qty: <span className="font-bold">{req.quantity}</span>
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => handleApprove(req.id, req.part_id, req.quantity, req.work_order_id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" /> Approve
                      </Button>
                      <Button 
                        onClick={() => handleReject(req.id)}
                        variant="destructive"
                      >
                        <XCircle className="h-4 w-4 mr-1" /> Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Current Stock */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" /> Current Stock ({filteredParts.length})
              </CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input 
                  placeholder="Search parts..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left p-3">SKU</th>
                    <th className="text-left p-3">Name</th>
                    <th className="text-left p-3">Category</th>
                    <th className="text-left p-3">Stock</th>
                    <th className="text-left p-3">Reorder Level</th>
                    <th className="text-right p-3">Price</th>
                    <th className="text-center p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredParts.map((part) => (
                    <tr key={part.id} className="border-t hover:bg-slate-50">
                      <td className="p-3 font-mono text-xs">{part.sku}</td>
                      <td className="p-3 font-medium">{part.name}</td>
                      <td className="p-3 text-slate-600">{part.category || 'N/A'}</td>
                      <td className="p-3 font-bold">{part.quantity}</td>
                      <td className="p-3 text-slate-600">{part.reorder_level}</td>
                      <td className="p-3 text-right">Rs. {part.unit_price}</td>
                      <td className="p-3 text-center">
                        {part.quantity === 0 ? (
                          <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold">Out of Stock</span>
                        ) : part.quantity <= part.reorder_level ? (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold">Low Stock</span>
                        ) : (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">In Stock</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredParts.length === 0 && (
                <p className="text-center text-slate-500 py-8">No parts found</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Add Part Modal */}
        {showAddPart && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" /> Add New Part
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setShowAddPart(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>SKU *</Label>
                  <Input 
                    value={newPart.sku} 
                    onChange={(e) => setNewPart({...newPart, sku: e.target.value})}
                    placeholder="e.g., OIL-001"
                  />
                </div>
                <div>
                  <Label>Part Name *</Label>
                  <Input 
                    value={newPart.name} 
                    onChange={(e) => setNewPart({...newPart, name: e.target.value})}
                    placeholder="e.g., Engine Oil 5W-30"
                  />
                </div>
                <div>
                  <Label>Category</Label>
                  <Input 
                    value={newPart.category} 
                    onChange={(e) => setNewPart({...newPart, category: e.target.value})}
                    placeholder="e.g., Engine"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Quantity</Label>
                    <Input 
                      type="number"
                      value={newPart.quantity} 
                      onChange={(e) => setNewPart({...newPart, quantity: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div>
                    <Label>Reorder Level</Label>
                    <Input 
                      type="number"
                      value={newPart.reorder_level} 
                      onChange={(e) => setNewPart({...newPart, reorder_level: parseInt(e.target.value) || 5})}
                    />
                  </div>
                </div>
                <div>
                  <Label>Unit Price (Rs.)</Label>
                  <Input 
                    type="number"
                    value={newPart.unit_price} 
                    onChange={(e) => setNewPart({...newPart, unit_price: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <Button onClick={handleAddPart} className="w-full">
                  <Plus className="h-4 w-4 mr-2" /> Add Part to Inventory
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}