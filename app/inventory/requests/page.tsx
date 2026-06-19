'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import Sidebar from '@/components/layout/Sidebar'
import { useAuth } from '@/lib/useAuth'

interface PartRequest {
  id: string
  quantity: number
  status: string
  created_at: string
  work_orders: { wo_number: string }
  parts: { name: string; sku: string }
}

export default function PartRequestsPage() {
  const { user, loading: authLoading } = useAuth()
  const [requests, setRequests] = useState<PartRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    if (user) fetchRequests()
  }, [user])

  const fetchRequests = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('part_requests')
        .select(`
          id, quantity, status, created_at,
          work_orders (wo_number),
          parts (name, sku)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
    setRequests((data as any) || [])    } catch (error: any) {
      toast.error('Failed to load requests', { description: error.message })
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (reqId: string) => {
    setProcessing(reqId)
    try {
      // Call the magic SQL function we created in Step 1!
      const { error } = await supabase.rpc('approve_part_request', { req_id: reqId })
      
      if (error) throw error

      toast.success('Part Approved & Stock Deducted!', { 
        description: 'Inventory updated and transaction logged.' 
      })
      fetchRequests()
    } catch (error: any) {
      toast.error('Failed to approve', { 
        description: error.message || 'Check stock levels.' 
      })
    } finally {
      setProcessing(null)
    }
  }

  const handleReject = async (reqId: string) => {
    setProcessing(reqId)
    try {
      const { error } = await supabase
        .from('part_requests')
        .update({ status: 'REJECTED', approved_by: user?.id, approved_at: new Date().toISOString() })
        .eq('id', reqId)

      if (error) throw error
      toast.success('Request Rejected')
      fetchRequests()
    } catch (error: any) {
      toast.error('Failed to reject', { description: error.message })
    } finally {
      setProcessing(null)
    }
  }

  if (authLoading) return <div className="flex min-h-screen items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-blue-600"></div></div>
  if (!user) return null

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-64 p-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-6">Part Requests</h1>
        
        <Card>
          <CardHeader><CardTitle>Pending & Processed Requests</CardTitle></CardHeader>
          <CardContent>
            {loading ? <p className="text-center py-4">Loading...</p> : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-slate-50">
                      <th className="text-left p-3">WO #</th>
                      <th className="text-left p-3">Part</th>
                      <th className="text-left p-3">Qty</th>
                      <th className="text-left p-3">Status</th>
                      <th className="text-left p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((req) => (
                      <tr key={req.id} className="border-b hover:bg-slate-50">
                        <td className="p-3 font-mono font-semibold text-blue-600">{req.work_orders?.wo_number || 'N/A'}</td>
                        <td className="p-3">
                          <div className="font-medium">{req.parts?.name}</div>
                          <div className="text-xs text-slate-500">{req.parts?.sku}</div>
                        </td>
                        <td className="p-3 font-bold">{req.quantity}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            req.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                            req.status === 'APPROVED' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>{req.status}</span>
                        </td>
                        <td className="p-3">
                          {req.status === 'PENDING' && (
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                onClick={() => handleApprove(req.id)} 
                                disabled={processing === req.id}
                              >
                                {processing === req.id ? 'Processing...' : 'Approve'}
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive" 
                                onClick={() => handleReject(req.id)} 
                                disabled={processing === req.id}
                              >
                                Reject
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {requests.length === 0 && <p className="text-center py-4 text-slate-500">No part requests yet.</p>}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}