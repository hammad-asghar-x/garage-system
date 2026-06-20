'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Sidebar from '@/components/layout/Sidebar'
import { useAuth } from '@/lib/useAuth'
import { toast } from 'sonner'
import { Calendar, Clock, CheckCircle, XCircle, Car, Phone, User } from 'lucide-react'

interface Appointment {
  id: string
  customer_name: string
  customer_phone: string
  customer_email: string
  vehicle_make: string
  vehicle_model: string
  vehicle_year: number
  license_plate: string
  service_type: string
  preferred_date: string
  preferred_time: string
  description: string
  status: string
  created_at: string
  wo_number: string
}

export default function AppointmentsPage() {
  const { user, loading: authLoading } = useAuth()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('PENDING')

  useEffect(() => {
    if (user) fetchAppointments()
  }, [user, filter])

  const fetchAppointments = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('status', filter)
        .order('created_at', { ascending: false })

      if (error) throw error
      setAppointments((data as any) || [])
    } catch (error: any) {
      toast.error('Failed to load appointments', { description: error.message })
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async (appointmentId: string, appointment: Appointment) => {
    try {
      const woNumber = `WO-${Date.now().toString().slice(-6)}`
      
      const { data: customerData } = await supabase
        .from('customers')
        .insert([{
          full_name: appointment.customer_name,
          phone: appointment.customer_phone,
          email: appointment.customer_email || null
        }])
        .select()
        .single()

      const { data: vehicleData } = await supabase
        .from('vehicles')
        .insert([{
          customer_id: customerData.id,
          license_plate: appointment.license_plate || 'N/A',
          make: appointment.vehicle_make,
          model: appointment.vehicle_model,
          year: appointment.vehicle_year || null
        }])
        .select()
        .single()

      await supabase
        .from('work_orders')
        .insert([{
          wo_number: woNumber,
          customer_id: customerData.id,
          vehicle_id: vehicleData.id,
          complaint: appointment.description || appointment.service_type,
          status: 'PENDING_MANAGER_APPROVAL'
        }])

      await supabase
        .from('appointments')
        .update({ 
          status: 'CONFIRMED',
          wo_number: woNumber
        })
        .eq('id', appointmentId)

      toast.success('Appointment Confirmed!', { 
        description: `Work Order ${woNumber} created.` 
      })
      fetchAppointments()
    } catch (error: any) {
      toast.error('Failed to confirm', { description: error.message })
    }
  }

  const handleCancel = async (appointmentId: string) => {
    try {
      await supabase
        .from('appointments')
        .update({ status: 'CANCELLED' })
        .eq('id', appointmentId)

      toast.info('Appointment Cancelled')
      fetchAppointments()
    } catch (error: any) {
      toast.error('Failed to cancel', { description: error.message })
    }
  }

  if (authLoading) {
    return <div className="flex min-h-screen items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-blue-600"></div></div>
  }
  if (!user) return null

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-64 p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-800">Online Appointments</h1>
          <p className="text-slate-600 mt-1">Manage customer appointment requests</p>
        </div>

        <div className="flex gap-2 mb-6">
          {['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map((status) => (
            <Button
              key={status}
              onClick={() => setFilter(status)}
              variant={filter === status ? 'default' : 'outline'}
              className={filter === status ? 'bg-blue-600' : ''}
            >
              {status}
            </Button>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{filter} Appointments ({appointments.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center py-8">Loading...</p>
            ) : appointments.length === 0 ? (
              <p className="text-center py-8 text-slate-500">No {filter.toLowerCase()} appointments.</p>
            ) : (
              <div className="space-y-4">
                {appointments.map((apt) => (
                  <div key={apt.id} className="border rounded-lg p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-lg text-slate-800">{apt.customer_name}</h3>
                        <p className="text-slate-600">{apt.vehicle_year} {apt.vehicle_make} {apt.vehicle_model} {apt.license_plate && `(${apt.license_plate})`}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        apt.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        apt.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                        apt.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {apt.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3 text-sm">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(apt.preferred_date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Clock className="h-4 w-4" />
                        <span>{apt.preferred_time}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Phone className="h-4 w-4" />
                        <span>{apt.customer_phone}</span>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-3 rounded mb-3">
                      <p className="text-sm"><span className="font-semibold">Service:</span> {apt.service_type}</p>
                      {apt.description && <p className="text-sm text-slate-600 mt-1"><span className="font-semibold">Issue:</span> {apt.description}</p>}
                    </div>

                    {apt.status === 'PENDING' && (
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => handleConfirm(apt.id, apt)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" /> Confirm & Create WO
                        </Button>
                        <Button 
                          onClick={() => handleCancel(apt.id)}
                          variant="destructive"
                        >
                          <XCircle className="h-4 w-4 mr-2" /> Cancel
                        </Button>
                      </div>
                    )}

                    {apt.wo_number && (
                      <p className="text-sm text-blue-600 font-semibold mt-2">
                        Work Order: {apt.wo_number}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}