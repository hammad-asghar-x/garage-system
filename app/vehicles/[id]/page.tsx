'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Sidebar from '@/components/layout/Sidebar'
import { useAuth } from '@/lib/useAuth'
import { toast } from 'sonner'
import { Car, User, Calendar, Gauge, ArrowLeft, FileText, Wrench } from 'lucide-react'
import Link from 'next/link'

interface Vehicle {
  id: string
  license_plate: string
  make: string
  model: string
  year: number
  color: string
  vin: string
  mileage: number
  customers: {
    full_name: string
    phone: string
    cnic: string
    email: string
    address: string
  }
}

interface WorkOrder {
  id: string
  wo_number: string
  complaint: string
  status: string
  created_at: string
  mileage_at_service: number
}

export default function VehicleDetailPage() {
  const { user, loading: authLoading } = useAuth()
  const params = useParams()
  const router = useRouter()
  const vehicleId = Array.isArray(params.id) ? params.id[0] : params.id

  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user && vehicleId) fetchData()
  }, [user, vehicleId])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch vehicle details
      const { data: vehicleData, error: vehicleError } = await supabase
        .from('vehicles')
        .select(`
          *,
          customers (full_name, phone, cnic, email, address)
        `)
        .eq('id', vehicleId)
        .single()

      if (vehicleError) throw vehicleError
      setVehicle(vehicleData as any)

      // Fetch work orders for this vehicle
      const { data: woData, error: woError } = await supabase
        .from('work_orders')
        .select('id, wo_number, complaint, status, created_at, mileage_at_service')
        .eq('vehicle_id', vehicleId)
        .order('created_at', { ascending: false })

      if (woError) throw woError
      setWorkOrders(woData as any || [])
    } catch (error: any) {
      toast.error('Failed to load vehicle details', { description: error.message })
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-blue-600"></div>
      </div>
    )
  }

  if (!user) return null
  if (!vehicle) return <div className="p-8 text-center text-red-500">Vehicle not found.</div>

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-64 p-8">
        {/* Back Button & Header */}
        <div className="mb-6">
          <Button variant="outline" onClick={() => router.back()} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Vehicles
          </Button>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">{vehicle.year} {vehicle.make} {vehicle.model}</h1>
              <p className="text-slate-600 mt-1 flex items-center gap-2">
                <span className="font-mono bg-blue-100 px-2 py-1 rounded text-blue-800">{vehicle.license_plate}</span>
                {vehicle.color && <span className="text-slate-500">• {vehicle.color}</span>}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Vehicle & Owner Info */}
          <div className="space-y-6">
            {/* Vehicle Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-5 w-5" /> Vehicle Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-slate-500">License Plate</span>
                  <span className="font-mono font-semibold">{vehicle.license_plate}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-slate-500">Make/Model</span>
                  <span>{vehicle.make} {vehicle.model}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-slate-500">Year</span>
                  <span>{vehicle.year}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-slate-500">Color</span>
                  <span className="capitalize">{vehicle.color || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-slate-500">VIN</span>
                  <span className="font-mono text-xs">{vehicle.vin || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-500">Current Mileage</span>
                  <span className="font-mono font-semibold text-blue-600">
                    {vehicle.mileage?.toLocaleString() || 0} km
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Owner Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" /> Owner Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-slate-500">Full Name</p>
                  <p className="font-semibold">{vehicle.customers?.full_name || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Phone</p>
                  <p className="font-mono">{vehicle.customers?.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">CNIC</p>
                  <p className="font-mono">{vehicle.customers?.cnic || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Email</p>
                  <p>{vehicle.customers?.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Address</p>
                  <p className="text-sm">{vehicle.customers?.address || 'N/A'}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Service History */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" /> Service History ({workOrders.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {workOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <Wrench className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">No service records yet</p>
                    <p className="text-sm text-slate-400 mt-1">This vehicle hasn't been serviced at our garage</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {workOrders.map((wo) => (
                      <div key={wo.id} className="border rounded-lg p-4 hover:bg-slate-50 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-bold text-blue-600">{wo.wo_number}</p>
                            <p className="text-sm text-slate-600 mt-1">{wo.complaint}</p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            wo.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                            wo.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                            wo.status === 'PENDING_MANAGER_APPROVAL' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-slate-100 text-slate-800'
                          }`}>
                            {wo.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div className="flex gap-4 text-xs text-slate-500 mt-2">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(wo.created_at).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <Gauge className="h-3 w-3" />
                            {wo.mileage_at_service?.toLocaleString() || 'N/A'} km
                          </div>
                        </div>
                        <div className="mt-3">
                          <Link href={`/work-orders/${wo.id}`}>
                            <Button size="sm" variant="outline">View Work Order</Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}