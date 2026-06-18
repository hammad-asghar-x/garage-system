'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Customer {
  id: string
  full_name: string
  phone: string
}

interface Vehicle {
  id: string
  customer_id: string
  license_plate: string
  make: string
  model: string
  year: number | null
  color: string | null
  vin: string | null
  current_mileage: number
  created_at: string
  customers?: {
    full_name: string
    phone: string
  }
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    customer_id: '',
    license_plate: '',
    make: '',
    model: '',
    year: '',
    color: '',
    vin: '',
    current_mileage: ''
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchVehicles()
    fetchCustomers()
  }, [])

  const fetchVehicles = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('vehicles')
      .select(`
        *,
        customers (
          full_name,
          phone
        )
      `)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching vehicles:', error)
    } else {
      setVehicles(data || [])
    }
    setLoading(false)
  }

  const fetchCustomers = async () => {
    const { data, error } = await supabase
      .from('customers')
      .select('id, full_name, phone')
      .order('full_name')
    
    if (error) {
      console.error('Error fetching customers:', error)
    } else {
      setCustomers(data || [])
    }
  }

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const { error } = await supabase
      .from('vehicles')
      .insert([{
        ...formData,
        year: formData.year ? parseInt(formData.year) : null,
        current_mileage: formData.current_mileage ? parseInt(formData.current_mileage) : 0
      }])
    
    if (error) {
      alert('Error adding vehicle: ' + error.message)
    } else {
      alert('Vehicle added successfully!')
      setShowAddForm(false)
      setFormData({
        customer_id: '',
        license_plate: '',
        make: '',
        model: '',
        year: '',
        color: '',
        vin: '',
        current_mileage: ''
      })
      fetchVehicles()
    }
  }

  const filteredVehicles = vehicles.filter(vehicle =>
    vehicle.license_plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (vehicle.customers?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || false)
  )

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Vehicle Management</h1>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? 'Cancel' : 'Add New Vehicle'}
        </Button>
      </div>

      {showAddForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Add New Vehicle</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddVehicle} className="space-y-4">
              <div>
                <Label htmlFor="customer_id">Customer *</Label>
                <select
                  id="customer_id"
                  value={formData.customer_id}
                  onChange={(e) => setFormData({...formData, customer_id: e.target.value})}
                  required
                  className="w-full p-2 border rounded"
                >
                  <option value="">Select Customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.full_name} ({customer.phone})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="license_plate">License Plate *</Label>
                <Input
                  id="license_plate"
                  value={formData.license_plate}
                  onChange={(e) => setFormData({...formData, license_plate: e.target.value})}
                  required
                  placeholder="e.g., LEA-1234"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="make">Make *</Label>
                  <Input
                    id="make"
                    value={formData.make}
                    onChange={(e) => setFormData({...formData, make: e.target.value})}
                    required
                    placeholder="e.g., Honda"
                  />
                </div>
                <div>
                  <Label htmlFor="model">Model *</Label>
                  <Input
                    id="model"
                    value={formData.model}
                    onChange={(e) => setFormData({...formData, model: e.target.value})}
                    required
                    placeholder="e.g., Civic"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="year">Year</Label>
                  <Input
                    id="year"
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({...formData, year: e.target.value})}
                    placeholder="e.g., 2021"
                  />
                </div>
                <div>
                  <Label htmlFor="color">Color</Label>
                  <Input
                    id="color"
                    value={formData.color}
                    onChange={(e) => setFormData({...formData, color: e.target.value})}
                    placeholder="e.g., White"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="vin">VIN (Chassis Number)</Label>
                <Input
                  id="vin"
                  value={formData.vin}
                  onChange={(e) => setFormData({...formData, vin: e.target.value})}
                  placeholder="Vehicle Identification Number"
                />
              </div>
              <div>
                <Label htmlFor="current_mileage">Current Mileage (km)</Label>
                <Input
                  id="current_mileage"
                  type="number"
                  value={formData.current_mileage}
                  onChange={(e) => setFormData({...formData, current_mileage: e.target.value})}
                  placeholder="e.g., 45000"
                />
              </div>
              <Button type="submit">Save Vehicle</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Vehicle List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Search by plate, make, model, or owner..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {loading ? (
            <p>Loading...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">License Plate</th>
                    <th className="text-left p-3">Make/Model</th>
                    <th className="text-left p-3">Year</th>
                    <th className="text-left p-3">Owner</th>
                    <th className="text-left p-3">Mileage</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVehicles.map((vehicle) => (
                    <tr key={vehicle.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-semibold">{vehicle.license_plate}</td>
                      <td className="p-3">{vehicle.make} {vehicle.model}</td>
                      <td className="p-3">{vehicle.year || '-'}</td>
                      <td className="p-3">
                        {vehicle.customers?.full_name || 'Unknown'}
                        <div className="text-sm text-gray-500">
                          {vehicle.customers?.phone}
                        </div>
                      </td>
                      <td className="p-3">{vehicle.current_mileage.toLocaleString()} km</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredVehicles.length === 0 && (
                <p className="text-center py-4 text-gray-500">No vehicles found</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}