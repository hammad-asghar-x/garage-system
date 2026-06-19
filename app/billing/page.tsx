'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Sidebar from '@/components/layout/Sidebar'
import { useAuth } from '@/lib/useAuth'
import { toast } from 'sonner'
import Link from 'next/link'
import { FileText, DollarSign } from 'lucide-react'

interface WorkOrder {
  id: string
  wo_number: string
  complaint: string
  status: string
  customers: { full_name: string }
  vehicles: { license_plate: string; make: string; model: string; year: number | null }
}

export default function BillingDashboard() {
  const { user, loading: authLoading } = useAuth()
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) fetchBillingJobs()
  }, [user])

  const fetchBillingJobs = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('work_orders')
        .select(`
          id, wo_number, complaint, status,
          customers (full_name),
          vehicles (license_plate, make, model, year)
        `)
        .eq('status', 'QA_APPROVED')
        .order('created_at', { ascending: false })

      if (error) throw error
      setWorkOrders((data as any) || [])
    } catch (error: any) {
      toast.error('Failed to load billing jobs', { description: error.message })
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) return <div className="flex min-h-screen items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-blue-600"></div></div>
  if (!user) return null

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-64 p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-800">Billing & Invoicing</h1>
          <p className="text-slate-600 mt-1">Generate invoices and collect payments</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" /> Jobs Ready for Billing ({workOrders.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <p className="text-center py-8">Loading...</p> : (
              <div className="space-y-4">
                {workOrders.map((wo) => (
                  <div key={wo.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                    <div>
                      <p className="font-bold text-blue-600 text-lg">{wo.wo_number}</p>
                      <p className="text-slate-700 font-medium">{wo.vehicles.year} {wo.vehicles.make} {wo.vehicles.model} ({wo.vehicles.license_plate})</p>
                      <p className="text-sm text-slate-500">Customer: {wo.customers.full_name}</p>
                    </div>
                    <Link href={`/billing/${wo.id}`}>
                      <Button className="bg-green-600 hover:bg-green-700">
                        <FileText className="h-4 w-4 mr-2" />
                        Generate Invoice
                      </Button>
                    </Link>
                  </div>
                ))}
                {workOrders.length === 0 && <p className="text-center py-8 text-slate-500">No jobs currently ready for billing.</p>}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}