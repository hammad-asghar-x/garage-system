'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import Sidebar from '@/components/layout/Sidebar'
import { useAuth } from '@/lib/useAuth'
import { Clock, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react'

// Define valid status transitions
const statusTransitions: { [key: string]: string[] } = {
  'PENDING_MANAGER_APPROVAL': ['AWAITING_INSPECTION', 'CANCELLED'],
  'AWAITING_INSPECTION': ['INSPECTION_IN_PROGRESS'],
  'INSPECTION_IN_PROGRESS': ['INSPECTION_COMPLETE'],
  'INSPECTION_COMPLETE': ['PARTS_REQUESTED', 'IN_PROGRESS'],
  'PARTS_REQUESTED': ['PARTS_READY'],
  'PARTS_READY': ['IN_PROGRESS'],
  'IN_PROGRESS': ['REPAIRS_COMPLETED'],
  'REPAIRS_COMPLETED': ['QA_IN_PROGRESS'],
  'QA_IN_PROGRESS': ['QA_APPROVED', 'REWORK_NEEDED'],
  'REWORK_NEEDED': ['IN_PROGRESS'],
  'QA_APPROVED': ['READY_FOR_BILLING'],
  'READY_FOR_BILLING': ['COMPLETED'],
  'COMPLETED': [],
  'CANCELLED': []
}

const statusColors: { [key: string]: string } = {
  'PENDING_MANAGER_APPROVAL': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'AWAITING_INSPECTION': 'bg-blue-100 text-blue-800 border-blue-200',
  'INSPECTION_IN_PROGRESS': 'bg-blue-200 text-blue-900 border-blue-300',
  'INSPECTION_COMPLETE': 'bg-purple-100 text-purple-800 border-purple-200',
  'PARTS_REQUESTED': 'bg-orange-100 text-orange-800 border-orange-200',
  'PARTS_READY': 'bg-green-100 text-green-800 border-green-200',
  'IN_PROGRESS': 'bg-indigo-100 text-indigo-800 border-indigo-200',
  'REPAIRS_COMPLETED': 'bg-teal-100 text-teal-800 border-teal-200',
  'QA_IN_PROGRESS': 'bg-cyan-100 text-cyan-800 border-cyan-200',
  'REWORK_NEEDED': 'bg-red-100 text-red-800 border-red-200',
  'QA_APPROVED': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'READY_FOR_BILLING': 'bg-lime-100 text-lime-800 border-lime-200',
  'COMPLETED': 'bg-green-200 text-green-900 border-green-300',
  'CANCELLED': 'bg-gray-200 text-gray-800 border-gray-300'
}

interface WorkOrder {
  id: string
  wo_number: string
  complaint: string
  mileage: number
  status: string
  priority: string
  created_at: string
  customers: { full_name: string; phone: string; email: string | null }
  vehicles: { license_plate: string; make: string; model: string; year: number | null; color: string | null }
}

interface StatusHistory {
  id: string
  old_status: string | null
  new_status: string
  created_at: string
}

export default function WorkOrderDetailPage() {
  const { user, loading: authLoading } = useAuth()
  const params = useParams()
  const router = useRouter()
  const woId = params.id as string

  const [wo, setWo] = useState<WorkOrder | null>(null)
  const [history, setHistory] = useState<StatusHistory[]>([])
  const [loading, setLoading] = useState(false)
  const [updating, setUpdating] = useState(false)

  // 1. ALL HOOKS AT THE TOP
  useEffect(() => {
    if (user && woId) {
      fetchWorkOrder()
      fetchHistory()
    }
  }, [user, woId])

  const fetchWorkOrder = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('work_orders')
        .select(`
          *,
          customers (full_name, phone, email),
          vehicles (license_plate, make, model, year, color)
        `)
        .eq('id', woId)
        .single()

      if (error) throw error
      setWo(data)
    } catch (error: any) {
      toast.error('Failed to load Work Order', { description: error.message })
    } finally {
      setLoading(false)
    }
  }

  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('work_order_status_history')
        .select('*')
        .eq('work_order_id', woId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setHistory(data || [])
    } catch (error: any) {
      console.error('History error:', error)
    }
  }

  const handleStatusUpdate = async (newStatus: string) => {
    if (!wo) return
    
    setUpdating(true)
    try {
      const { error } = await supabase
        .from('work_orders')
        .update({ status: newStatus })
        .eq('id', woId)

      if (error) throw error

      toast.success('Status Updated!', {
        description: `Work Order moved to ${newStatus.replace(/_/g, ' ')}`
      })

      // Refresh data
      fetchWorkOrder()
      fetchHistory()
    } catch (error: any) {
      toast.error('Failed to update status', { description: error.message })
    } finally {
      setUpdating(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-PK', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  // 2. CONDITIONAL RETURNS AFTER HOOKS
  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-blue-600"></div>
          <p className="mt-2 text-slate-600">Loading Work Order...</p>
        </div>
      </div>
    )
  }

  if (!user) return null
  if (!wo) return <div className="p-8 text-center">Work Order not found.</div>

  const nextStatuses = statusTransitions[wo.status] || []

  // 3. MAIN UI
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 ml-64 p-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Work Order {wo.wo_number}</h1>
            <p className="text-slate-600 mt-1">Created on {formatDate(wo.created_at)}</p>
          </div>
          <Button variant="outline" onClick={() => router.push('/work-orders')}>
            Back to List
          </Button>
        </div>

        {/* Status Banner */}
        <Card className={`mb-6 border-2 ${statusColors[wo.status] || 'bg-gray-100'}`}>
          <CardContent className="p-6 flex justify-between items-center">
            <div>
              <p className="text-sm font-semibold uppercase opacity-75">Current Status</p>
              <h2 className="text-2xl font-bold">{wo.status.replace(/_/g, ' ')}</h2>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold uppercase opacity-75">Priority</p>
              <h2 className="text-xl font-bold">{wo.priority}</h2>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Actions & Timeline */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Action Buttons */}
            {nextStatuses.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ArrowRight className="h-5 w-5" /> Next Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-3">
                  {nextStatuses.map((status) => (
                    <Button
                      key={status}
                      onClick={() => handleStatusUpdate(status)}
                      disabled={updating}
                      variant={status === 'CANCELLED' ? 'destructive' : 'default'}
                    >
                      {updating ? 'Updating...' : `Move to ${status.replace(/_/g, ' ')}`}
                    </Button>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Status Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" /> Status History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {history.length === 0 ? (
                  <p className="text-slate-500 text-center py-4">No status changes recorded yet.</p>
                ) : (
                  <div className="relative pl-6 space-y-6">
                    {/* Vertical Line */}
                    <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-slate-200"></div>
                    
                    {history.map((item, index) => (
                      <div key={item.id} className="relative">
                        {/* Dot */}
                        <div className={`absolute -left-4 top-1 h-4 w-4 rounded-full border-2 border-white ${
                          index === history.length - 1 ? 'bg-blue-600' : 'bg-slate-400'
                        }`}></div>
                        
                        <div className="bg-slate-50 p-3 rounded-lg border">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-semibold text-slate-800">
                              {item.old_status ? `${item.old_status.replace(/_/g, ' ')} → ${item.new_status.replace(/_/g, ' ')}` : `Created as ${item.new_status.replace(/_/g, ' ')}`}
                            </span>
                            <span className="text-xs text-slate-500">{formatDate(item.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Info Cards */}
          <div className="space-y-6">
            {/* Customer Info */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-xs text-slate-500 uppercase">Name</p>
                  <p className="font-semibold">{wo.customers.full_name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase">Phone</p>
                  <p>{wo.customers.phone}</p>
                </div>
                {wo.customers.email && (
                  <div>
                    <p className="text-xs text-slate-500 uppercase">Email</p>
                    <p>{wo.customers.email}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Vehicle Info */}
            <Card>
              <CardHeader>
                <CardTitle>Vehicle Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-xs text-slate-500 uppercase">License Plate</p>
                  <p className="font-mono font-bold text-lg">{wo.vehicles.license_plate}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase">Make / Model</p>
                  <p>{wo.vehicles.year} {wo.vehicles.make} {wo.vehicles.model}</p>
                </div>
                {wo.vehicles.color && (
                  <div>
                    <p className="text-xs text-slate-500 uppercase">Color</p>
                    <p>{wo.vehicles.color}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-slate-500 uppercase">Mileage at Check-in</p>
                  <p>{wo.mileage.toLocaleString()} km</p>
                </div>
              </CardContent>
            </Card>

            {/* Complaint */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Complaint</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-700 leading-relaxed">{wo.complaint}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}