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
import { useRouter } from 'next/navigation'

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
}

export default function NewWorkOrderPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  
  const [customers, setCustomers] = useState<Customer[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([])
  
  const [formData, setFormData] = useState({
    customer_id: '',
    vehicle_id: '',
    complaint: '',
    mileage: '',
    priority: 'NORMAL'
  })
  
  const [errors, setErrors] = useState<{[key: string]: string}>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user) {
      fetchCustomers()
      fetchVehicles()
    }
  }, [user])

  useEffect(() => {
    if (formData.customer_id) {
      const filtered = vehicles.filter(v => v.customer_id === formData.customer_id)
      setFilteredVehicles(filtered)
      setFormData(prev => ({ ...prev, vehicle_id: '' }))
    } else {
      setFilteredVehicles([])
    }
  }, [formData.customer_id, vehicles])

  const fetchCustomers = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, full_name, phone')
        .order('full_name')

      if (error) throw error
      setCustomers(data || [])
    } catch (error: any) {
      toast.error('Failed to load customers', {
        description: error.message
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('id, customer_id, license_plate, make, model, year')
        .order('license_plate')

      if (error) throw error
      setVehicles(data || [])
    } catch (error: any) {
      toast.error('Failed to load vehicles', {
        description: error.message
      })
    }
  }

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {}
    let isValid = true

    if (!formData.customer_id) {
      newErrors.customer_id = 'Please select a customer'
      isValid = false
    }

    if (!formData.vehicle_id) {
      newErrors.vehicle_id = 'Please select a vehicle'
      isValid = false
    }

    if (!formData.complaint.trim()) {
      newErrors.complaint = 'Complaint description is required'
      isValid = false
    } else if (formData.complaint.trim().length < 10) {
      newErrors.complaint = 'Complaint must be at least 10 characters'
      isValid = false
    }

    if (formData.mileage && (isNaN(Number(formData.mileage)) || Number(formData.mileage) < 0)) {
      newErrors.mileage = 'Mileage must be a positive number'
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error('Validation Error', {
        description: 'Please fix the errors in the form.'
      })
      return
    }

    setSaving(true)
    try {
      // Generate WO number using the database function
      const { data: woNumberData, error: woNumberError } = await supabase
        .rpc('generate_wo_number')

      if (woNumberError) throw woNumberError

      const wo_number = woNumberData

      // Insert the work order
      const { data, error } = await supabase
        .from('work_orders')
        .insert([{
          wo_number,
          customer_id: formData.customer_id,
          vehicle_id: formData.vehicle_id,
          complaint: formData.complaint.trim(),
          mileage: formData.mileage ? parseInt(formData.mileage) : 0,
          priority: formData.priority,
          created_by: user?.id,
          status: 'PENDING_MANAGER_APPROVAL'
        }])
        .select()
        .single()

      if (error) throw error

      toast.success('Work Order Created!', {
        description: `${wo_number} has been created and sent for manager approval.`
      })

      router.push('/work-orders')
      
    } catch (error: any) {
      toast.error('Failed to create work order', {
        description: error.message || 'An unexpected error occurred.'
      })
    } finally {
      setSaving(false)
    }
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
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-800">Create New Work Order</h1>
          <p className="text-slate-600 mt-1">Fill in the details to create a new work order</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Work Order Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="customer_id">Customer *</Label>
                  <select
                    id="customer_id"
                    value={formData.customer_id}
                    onChange={(e) => setFormData({...formData, customer_id: e.target.value})}
                    className={`w-full p-2 border rounded ${errors.customer_id ? 'border-red-500' : ''}`}
                    disabled={loading}
                  >
                    <option value="">Select Customer</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.full_name} ({customer.phone})
                      </option>
                    ))}
                  </select>
                  {errors.customer_id && (
                    <p className="text-sm text-red-500 mt-1">{errors.customer_id}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="vehicle_id">Vehicle *</Label>
                  <select
                    id="vehicle_id"
                    value={formData.vehicle_id}
                    onChange={(e) => setFormData({...formData, vehicle_id: e.target.value})}
                    className={`w-full p-2 border rounded ${errors.vehicle_id ? 'border-red-500' : ''}`}
                    disabled={loading || !formData.customer_id}
                  >
                    <option value="">
                      {formData.customer_id ? 'Select Vehicle' : 'Select Customer First'}
                    </option>
                    {filteredVehicles.map((vehicle) => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.license_plate} - {vehicle.year} {vehicle.make} {vehicle.model}
                      </option>
                    ))}
                  </select>
                  {errors.vehicle_id && (
                    <p className="text-sm text-red-500 mt-1">{errors.vehicle_id}</p>
                  )}
                  {!formData.customer_id && (
                    <p className="text-xs text-gray-500 mt-1">Please select a customer first</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="complaint">Complaint Description *</Label>
                <textarea
                  id="complaint"
                  value={formData.complaint}
                  onChange={(e) => {
                    setFormData({...formData, complaint: e.target.value})
                    if (errors.complaint) setErrors(prev => ({ ...prev, complaint: '' }))
                  }}
                  rows={4}
                  placeholder="Describe the customer's complaint in detail (minimum 10 characters)..."
                  className={`w-full p-2 border rounded ${errors.complaint ? 'border-red-500' : ''}`}
                />
                {errors.complaint && (
                  <p className="text-sm text-red-500 mt-1">{errors.complaint}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  {formData.complaint.length}/10 characters minimum
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="mileage">Current Mileage (km)</Label>
                  <Input
                    id="mileage"
                    type="number"
                    value={formData.mileage}
                    onChange={(e) => {
                      setFormData({...formData, mileage: e.target.value})
                      if (errors.mileage) setErrors(prev => ({ ...prev, mileage: '' }))
                    }}
                    placeholder="e.g., 45000"
                    min="0"
                    className={errors.mileage ? 'border-red-500' : ''}
                  />
                  {errors.mileage && (
                    <p className="text-sm text-red-500 mt-1">{errors.mileage}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="priority">Priority Level *</Label>
                  <select
                    id="priority"
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value})}
                    className="w-full p-2 border rounded"
                  >
                    <option value="LOW">Low</option>
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={saving || loading}>
                  {saving ? 'Creating...' : 'Create Work Order'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => router.push('/work-orders')}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}