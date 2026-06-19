'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import Sidebar from '@/components/layout/Sidebar'
import { useAuth } from '@/lib/useAuth'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'

interface Part {
  id: string
  sku: string
  name: string
  category: string
  quantity: number
  reorder_level: number
  unit_price: number
}

export default function InventoryPage() {
  const { user, loading: authLoading } = useAuth()
  const [parts, setParts] = useState<Part[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) fetchParts()
  }, [user])

  const fetchParts = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('parts')
        .select('*')
        .order('name')

      if (error) throw error
      setParts(data || [])
    } catch (error: any) {
      toast.error('Failed to load inventory', { description: error.message })
    } finally {
      setLoading(false)
    }
  }

  const filteredParts = parts.filter(part =>
    part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    part.sku.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (authLoading) return <div className="flex min-h-screen items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-blue-600"></div></div>
  if (!user) return null

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-64 p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-slate-800">Inventory Management</h1>
          <Link href="/inventory/new">
            <Button>Add New Part</Button>
          </Link>
        </div>

        {/* Low Stock Alerts */}
        {parts.filter(p => p.quantity <= p.reorder_level).length > 0 && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <div>
                <h3 className="font-bold text-red-800">Low Stock Alert!</h3>
                <p className="text-sm text-red-700">
                  {parts.filter(p => p.quantity <= p.reorder_level).length} part(s) are below their reorder level.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Parts Catalog</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Input
                placeholder="Search by name or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {loading ? (
              <p className="text-center py-4">Loading...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-slate-50">
                      <th className="text-left p-3">SKU</th>
                      <th className="text-left p-3">Name</th>
                      <th className="text-left p-3">Category</th>
                      <th className="text-left p-3">Stock</th>
                      <th className="text-left p-3">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredParts.map((part) => {
                      const isLowStock = part.quantity <= part.reorder_level
                      return (
                        <tr key={part.id} className={`border-b ${isLowStock ? 'bg-red-50' : 'hover:bg-slate-50'}`}>
                          <td className="p-3 font-mono font-semibold">{part.sku}</td>
                          <td className="p-3 font-medium">{part.name}</td>
                          <td className="p-3 text-slate-600">{part.category || '-'}</td>
                          <td className="p-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                              isLowStock ? 'bg-red-200 text-red-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {part.quantity} {isLowStock && '(Low)'}
                            </span>
                          </td>
                          <td className="p-3">Rs. {part.unit_price.toFixed(2)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                {filteredParts.length === 0 && <p className="text-center py-4 text-slate-500">No parts found.</p>}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}