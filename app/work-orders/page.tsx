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

interface WorkOrder {
  id: string
  wo_number: string
  complaint: string
  mileage: number
  status: string
  priority: string
  created_at: string
  customers: {
    full_name: string
    phone: string
  }
  vehicles: {
    license_plate: string
    make: string
    model: string
    year: number | null
  }
}

const statusColors: { [key: string]: string } = {
  'PENDING_MANAGER_APPROVAL': 'bg-yellow-100 text-yellow-800',
  'AWAITING_INSPECTION': 'bg-blue-100 text-blue-800',
  'INSPECTION_IN_PROGRESS': 'bg-blue-200 text-blue-900',
  'INSPECTION_COMPLETE': 'bg-purple-100 text-purple-800',
  'PARTS_REQUESTED': 'bg-orange-100 text-orange-800',
  'PARTS_READY': 'bg-green-100 text-green-800',
  'IN_PROGRESS': 'bg-indigo-100 text-indigo-800',
  'REPAIRS_COMPLETED': 'bg-teal-100 text-teal-800',
  'QA_IN_PROGRESS': 'bg-cyan-100 text-cyan-800',
  'REWORK_NEEDED': 'bg-red-100 text-red-800',
  'QA_APPROVED': 'bg-emerald-100 text-emerald-800',
  'READY_FOR_BILLING': 'bg-lime-100 text-lime-800',
  'COMPLETED': 'bg-green-200 text-green-900',
  'CANCELLED': 'bg-gray-200 text-gray-800'
}

const priorityColors: { [key: string]: string } = {
  'LOW': 'bg-gray-100 text-gray-700',
  'NORMAL': 'bg-blue-100 text-blue-700',
  'HIGH': 'bg-orange-100 text-orange-700',
  'URGENT': 'bg-red-100 text-red-700'
}

export default function WorkOrdersPage() {
  const { user, loading: authLoading } = useAuth()
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      fetchWorkOrders()
    }
  }, [user])

  const fetchWorkOrders = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('work_orders')
        .select(`
          *,
          customers (full_name, phone),
          vehicles (license_plate, make, model, year)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setWorkOrders(data || [])
    } catch (error: any) {
      toast.error('Failed to load work orders', {
        description: error.message || 'Please check your internet connection.'
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredWorkOrders = workOrders.filter(wo => {
    const matchesSearch = 
      wo.wo_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wo.vehicles.license_plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wo.customers.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wo.complaint.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter ? wo.status === statusFilter : true
    
    return matchesSearch && matchesStatus
  })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-PK', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-blue-600"></div>
          <p className="mt-2 text-slate-600">Checking authentication...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 ml-64 p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-slate-800">Work Order Management</h1>
          <Link href="/work-orders/new">
            <Button>Create New Work Order</Button>
          </Link>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="search">Search</Label>
                <Input
                  id="search"
                  placeholder="Search by WO#, plate, customer, or complaint..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="status">Status Filter</Label>
                <select
                  id="status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="">All Statuses</option>
                  <option value="PENDING_MANAGER_APPROVAL">Pending Manager Approval</option>
                  <option value="AWAITING_INSPECTION">Awaiting Inspection</option>
                  <option value="INSPECTION_IN_PROGRESS">Inspection In Progress</option>
                  <option value="INSPECTION_COMPLETE">Inspection Complete</option>
                  <option value="PARTS_REQUESTED">Parts Requested</option>
                  <option value="PARTS_READY">Parts Ready</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="REPAIRS_COMPLETED">Repairs Completed</option>
                  <option value="QA_IN_PROGRESS">QA In Progress</option>
                  <option value="REWORK_NEEDED">Rework Needed</option>
                  <option value="QA_APPROVED">QA Approved</option>
                  <option value="READY_FOR_BILLING">Ready for Billing</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Work Orders ({filteredWorkOrders.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-blue-600"></div>
                <p className="mt-2 text-slate-600">Loading work orders...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-slate-50">
                      <th className="text-left p-3 font-semibold">WO #</th>
                      <th className="text-left p-3 font-semibold">Customer</th>
                      <th className="text-left p-3 font-semibold">Vehicle</th>
                      <th className="text-left p-3 font-semibold">Complaint</th>
                      <th className="text-left p-3 font-semibold">Status</th>
                      <th className="text-left p-3 font-semibold">Priority</th>
                      <th className="text-left p-3 font-semibold">Created</th>
                      <th className="text-left p-3 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredWorkOrders.map((wo) => (
                      <tr key={wo.id} className="border-b hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-mono font-semibold text-blue-600">{wo.wo_number}</td>
                        <td className="p-3">
                          <div className="font-medium">{wo.customers.full_name}</div>
                          <div className="text-sm text-slate-500">{wo.customers.phone}</div>
                        </td>
                        <td className="p-3">
                          <div className="font-medium">{wo.vehicles.license_plate}</div>
                          <div className="text-sm text-slate-500">
                            {wo.vehicles.year} {wo.vehicles.make} {wo.vehicles.model}
                          </div>
                        </td>
                        <td className="p-3 max-w-xs truncate">{wo.complaint}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[wo.status] || 'bg-gray-100'}`}>
                            {wo.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${priorityColors[wo.priority] || 'bg-gray-100'}`}>
                            {wo.priority}
                          </span>
                        </td>
                        <td className="p-3 text-sm text-slate-600">{formatDate(wo.created_at)}</td>
                        <td className="p-3">
                          <Link href={`/work-orders/${wo.id}`}>
                            <Button variant="outline" size="sm">View Details</Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredWorkOrders.length === 0 && !loading && (
                  <div className="text-center py-8">
                    <p className="text-slate-500">No work orders found</p>
                    <p className="text-sm text-slate-400 mt-1">Click "Create New Work Order" to get started</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}