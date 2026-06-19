'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Sidebar from '@/components/layout/Sidebar'
import { useAuth } from '@/lib/useAuth'
import Link from 'next/link'
import { toast } from 'sonner'
import { ClipboardList } from 'lucide-react'

interface WorkOrder {
  id: string
  wo_number: string
  complaint: string
  customers: { full_name: string }
  vehicles: { license_plate: string; make: string; model: string; year: number | null }
}

export default function InspectionDashboard() {
  const { user, loading: authLoading } = useAuth()
  const [wos, setWos] = useState<WorkOrder[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) fetchInspections()
  }, [user])

  const fetchInspections = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('work_orders')
        .select(`
          id, wo_number, complaint,
          customers (full_name),
          vehicles (license_plate, make, model, year)
        `)
        .in('status', ['AWAITING_INSPECTION', 'INSPECTION_IN_PROGRESS'])
        .order('created_at', { ascending: false })

      if (error) throw error
      setWos((data as any) || [])
    } catch (error: any) {
      toast.error('Failed to load inspections', { description: error.message })
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
        <h1 className="text-3xl font-bold text-slate-800 mb-6">Inspection Dashboard</h1>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" /> Vehicles Awaiting Inspection
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <p className="text-center py-4">Loading...</p> : (
              <div className="space-y-4">
                {wos.map((wo) => (
                  <div key={wo.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                    <div>
                      <p className="font-bold text-blue-600 text-lg">{wo.wo_number}</p>
                      <p className="text-slate-700 font-medium">{wo.vehicles.year} {wo.vehicles.make} {wo.vehicles.model} ({wo.vehicles.license_plate})</p>
                      <p className="text-sm text-slate-500">Customer: {wo.customers.full_name}</p>
                      <p className="text-sm text-slate-500 mt-1 italic">Complaint: {wo.complaint}</p>
                    </div>
                    <Link href={`/inspection/${wo.id}`}>
                      <Button>Start Inspection</Button>
                    </Link>
                  </div>
                ))}
                {wos.length === 0 && <p className="text-center py-8 text-slate-500">No vehicles awaiting inspection.</p>}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}