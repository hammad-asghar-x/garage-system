'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Sidebar from '@/components/layout/Sidebar'
import { useAuth } from '@/lib/useAuth'
import { toast } from 'sonner'
import { Car, Plus, Search } from 'lucide-react'
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
  }
}

export default function VehiclesPage() {
  const { user, loading: authLoading } = useAuth()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (user) fetchVehicles()
  }, [user])

  const fetchVehicles = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select(`
          *,
          customers (full_name, phone)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setVehicles((data as any) || [])
    } catch (error: any) {
      toast.error('Failed to load vehicles', { description: error.message })
    } finally {
      setLoading(false)
    }
  }

  const filteredVehicles = vehicles.filter(vehicle =>
    vehicle.license_plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.customers?.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Vehicle Management</h1>
            <p className="text-slate-600 mt-1">Manage all registered vehicles and their owners</p>
          </div>
          <Link href="/vehicles/new">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Add New Vehicle
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" /> Vehicle List ({filteredVehicles.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  placeholder="Search by plate, make, model, or owner..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-slate-50">
                    <th className="text-left p-3 font-semibold">License Plate</th>
                    <th className="text-left p-3 font-semibold">Make/Model</th>
                    <th className="text-left p-3 font-semibold">Year</th>
                    <th className="text-left p-3 font-semibold">Owner</th>
                    <th className="text-left p-3 font-semibold">Mileage</th>
                    <th className="text-left p-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVehicles.map((vehicle) => (
                    <tr key={vehicle.id} className="border-b hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-mono font-semibold text-blue-600">{vehicle.license_plate}</td>
                      <td className="p-3">
                        <div className="font-medium">{vehicle.make} {vehicle.model}</div>
                        {vehicle.color && <div className="text-xs text-slate-500 capitalize">{vehicle.color}</div>}
                      </td>
                      <td className="p-3">{vehicle.year}</td>
                      <td className="p-3">
                        <div className="font-medium">{vehicle.customers?.full_name || 'Unknown'}</div>
                        <div className="text-xs text-slate-500">{vehicle.customers?.phone || ''}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-mono">{vehicle.mileage?.toLocaleString() || 0} km</div>
                      </td>
                      <td className="p-3">
                        <Link href={`/vehicles/${vehicle.id}`}>
                          <Button size="sm" variant="outline">View Details</Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredVehicles.length === 0 && (
                <div className="text-center py-12">
                  <Car className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">No vehicles found</p>
                  <p className="text-sm text-slate-400 mt-1">Add a new vehicle or adjust your search</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}