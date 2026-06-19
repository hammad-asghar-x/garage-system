'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Sidebar from '@/components/layout/Sidebar'
import { useAuth } from '@/lib/useAuth'
import { toast } from 'sonner'
import { ShoppingCart } from 'lucide-react'

interface Part {
  id: string
  sku: string
  name: string
  quantity: number
  unit_price: number
}

interface PartRequest {
  id: string
  part_id: string
  quantity: number
  status: string
  parts: { name: string; sku: string }
}

export default function RequestPartsPage() {
  const { user, loading: authLoading } = useAuth()
  const params = useParams()
  const router = useRouter()
  const woId = Array.isArray(params.id) ? params.id[0] : params.id

  const [parts, setParts] = useState<Part[]>([])
  const [requests, setRequests] = useState<PartRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedPart, setSelectedPart] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (user && woId) {
      fetchParts()
      fetchRequests()
    }
  }, [user, woId])

  const fetchParts = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('parts')
        .select('*')
        .gt('quantity', 0)
        .order('name')

      if (error) throw error
      setParts((data as any) || [])
    } catch (error: any) {
      toast.error('Failed to load parts', { description: error.message })
    } finally {
      setLoading(false)
    }
  }

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('part_requests')
        .select(`
          id, part_id, quantity, status,
          parts (name, sku)
        `)
        .eq('work_order_id', woId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setRequests((data as any) || [])
    } catch (error: any) {
      console.error('Error fetching requests:', error)
    }
  }

  const handleRequestPart = async () => {
    if (!selectedPart || !quantity) {
      toast.error('Missing Information', { description: 'Please select a part and quantity.' })
      return
    }

    setSubmitting(true)
    try {
      const { error } = await supabase
        .from('part_requests')
        .insert([{
          work_order_id: woId,
          part_id: selectedPart,
          quantity: parseInt(quantity),
          status: 'PENDING',
          requested_by: user?.id
        }])

      if (error) throw error

      toast.success('Part Requested!', { description: 'Request sent to inventory clerk.' })
      setSelectedPart('')
      setQuantity('1')
      fetchRequests()
    } catch (error: any) {
      toast.error('Failed to request part', { description: error.message })
    } finally {
      setSubmitting(false)
    }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-blue-600"></div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-64 p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-800">Request Parts</h1>
          <p className="text-slate-600 mt-1">Work Order: {woId}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" /> Request New Part
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Select Part</Label>
                <select
                  value={selectedPart}
                  onChange={(e) => setSelectedPart(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="">Choose a part...</option>
                  {parts.map((part) => (
                    <option key={part.id} value={part.id}>
                      {part.name} ({part.sku}) - Stock: {part.quantity}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Quantity</Label>
                <Input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>

              <Button 
                onClick={handleRequestPart} 
                disabled={submitting}
                className="w-full"
              >
                {submitting ? 'Requesting...' : 'Submit Request'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Part Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {requests.length === 0 ? (
                <p className="text-center py-8 text-slate-500">No part requests yet.</p>
              ) : (
                <div className="space-y-3">
                  {requests.map((req) => (
                    <div key={req.id} className="border rounded-lg p-3 bg-slate-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold">{req.parts?.name}</p>
                          <p className="text-sm text-slate-500">{req.parts?.sku}</p>
                          <p className="text-sm mt-1">Quantity: {req.quantity}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          req.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          req.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {req.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mt-6">
          <Button variant="outline" onClick={() => router.push('/technician')}>
            Back to Workbench
          </Button>
        </div>
      </div>
    </div>
  )
}