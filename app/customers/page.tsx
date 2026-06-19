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

interface Customer {
  id: string
  full_name: string
  phone: string
  email: string | null
  address: string | null
  cnic: string | null
  created_at: string
}

export default function CustomersPage() {
  // 1. ALL HOOKS MUST BE AT THE VERY TOP
  const { user, loading: authLoading } = useAuth() // Renamed to authLoading to prevent conflict
  
  const [customers, setCustomers] = useState<Customer[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    address: '',
    cnic: ''
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<{[key: string]: string}>({})

  // Fetch customers only when the user is successfully logged in
  useEffect(() => {
    if (user) {
      fetchCustomers()
    }
  }, [user])

  // VALIDATION FUNCTIONS
  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^03[0-9]{9,10}$/
    const cleanPhone = phone.replace(/[-\s]/g, '')
    
    if (!cleanPhone) {
      setErrors(prev => ({ ...prev, phone: 'Phone number is required' }))
      return false
    }
    if (!phoneRegex.test(cleanPhone)) {
      setErrors(prev => ({ ...prev, phone: 'Invalid phone format. Use: 03001234567' }))
      return false
    }
    setErrors(prev => ({ ...prev, phone: '' }))
    return true
  }

  const validateCNIC = (cnic: string): boolean => {
    if (!cnic) {
      setErrors(prev => ({ ...prev, cnic: '' }))
      return true
    }
    const cleanCNIC = cnic.replace(/[-\s]/g, '')
    if (cleanCNIC.length !== 13) {
      setErrors(prev => ({ ...prev, cnic: 'CNIC must be 13 digits' }))
      return false
    }
    if (!/^[0-9]+$/.test(cleanCNIC)) {
      setErrors(prev => ({ ...prev, cnic: 'CNIC can only contain numbers' }))
      return false
    }
    setErrors(prev => ({ ...prev, cnic: '' }))
    return true
  }

  const validateEmail = (email: string): boolean => {
    if (!email) {
      setErrors(prev => ({ ...prev, email: '' }))
      return true
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setErrors(prev => ({ ...prev, email: 'Invalid email format' }))
      return false
    }
    setErrors(prev => ({ ...prev, email: '' }))
    return true
  }

  const validateForm = (): boolean => {
    let isValid = true
    if (!formData.full_name.trim()) {
      setErrors(prev => ({ ...prev, full_name: 'Full name is required' }))
      isValid = false
    } else {
      setErrors(prev => ({ ...prev, full_name: '' }))
    }
    if (!validatePhone(formData.phone)) isValid = false
    if (!validateEmail(formData.email)) isValid = false
    if (!validateCNIC(formData.cnic)) isValid = false
    return isValid
  }

  // EXCEPTION HANDLING: Fetch customers
  const fetchCustomers = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setCustomers(data || [])
    } catch (error: any) {
      toast.error('Failed to load customers', {
        description: error.message || 'Please check your internet connection.'
      })
    } finally {
      setLoading(false)
    }
  }

  // EXCEPTION HANDLING: Add customer with validation
  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) {
      toast.error('Validation Error', { description: 'Please fix the errors in the form.' })
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase
        .from('customers')
        .insert([{
          full_name: formData.full_name.trim(),
          phone: formData.phone.replace(/[-\s]/g, ''),
          email: formData.email.trim() || null,
          address: formData.address.trim() || null,
          cnic: formData.cnic.trim() || null
        }])
      
      if (error) throw error
      
      toast.success('Customer Added!', {
        description: `${formData.full_name} has been saved successfully.`
      })
      
      setShowAddForm(false)
      setFormData({ full_name: '', phone: '', email: '', address: '', cnic: '' })
      setErrors({})
      fetchCustomers()
    } catch (error: any) {
      toast.error('Failed to save customer', {
        description: error.message || 'An unexpected error occurred.'
      })
    } finally {
      setSaving(false)
    }
  }

  // INPUT HANDLERS with validation
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^0-9]/g, '')
    if (value.length > 4) {
      value = value.slice(0, 4) + '-' + value.slice(4, 11)
    }
    setFormData({ ...formData, phone: value })
    if (errors.phone) setErrors(prev => ({ ...prev, phone: '' }))
  }

  const handleCNICChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^0-9]/g, '')
    if (value.length > 5) {
      value = value.slice(0, 5) + '-' + value.slice(5)
    }
    if (value.length > 13) {
      value = value.slice(0, 13) + '-' + value.slice(13, 14)
    }
    setFormData({ ...formData, cnic: value })
    if (errors.cnic) setErrors(prev => ({ ...prev, cnic: '' }))
  }

  const filteredCustomers = customers.filter(customer =>
    customer.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm)
  )

  // 2. CONDITIONAL RETURNS MUST COME AFTER ALL HOOKS
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

  if (!user) {
    return null 
  }

  // 3. MAIN UI RENDER
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 ml-64 p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-slate-800">Customer Management</h1>
          <Button onClick={() => setShowAddForm(!showAddForm)}>
            {showAddForm ? 'Cancel' : 'Add New Customer'}
          </Button>
        </div>

        {showAddForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Add New Customer</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddCustomer} className="space-y-4">
                <div>
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => {
                      setFormData({...formData, full_name: e.target.value})
                      if (errors.full_name) setErrors(prev => ({ ...prev, full_name: '' }))
                    }}
                    className={errors.full_name ? 'border-red-500' : ''}
                  />
                  {errors.full_name && <p className="text-sm text-red-500 mt-1">{errors.full_name}</p>}
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={handlePhoneChange}
                    placeholder="0300-1234567"
                    maxLength={12}
                    className={errors.phone ? 'border-red-500' : ''}
                  />
                  {errors.phone && <p className="text-sm text-red-500 mt-1">{errors.phone}</p>}
                  <p className="text-xs text-gray-500 mt-1">Format: 0300-1234567 (numbers only)</p>
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({...formData, email: e.target.value})
                      if (errors.email) setErrors(prev => ({ ...prev, email: '' }))
                    }}
                    className={errors.email ? 'border-red-500' : ''}
                  />
                  {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
                </div>

                <div>
                  <Label htmlFor="cnic">CNIC Number</Label>
                  <Input
                    id="cnic"
                    value={formData.cnic}
                    onChange={handleCNICChange}
                    placeholder="12345-1234567-8"
                    maxLength={15}
                    className={errors.cnic ? 'border-red-500' : ''}
                  />
                  {errors.cnic && <p className="text-sm text-red-500 mt-1">{errors.cnic}</p>}
                  <p className="text-xs text-gray-500 mt-1">Format: 12345-1234567-8 (13 digits)</p>
                </div>

                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Customer'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => {
                      setShowAddForm(false)
                      setFormData({ full_name: '', phone: '', email: '', address: '', cnic: '' })
                      setErrors({})
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Customer List</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Input
                placeholder="Search by name or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-blue-600"></div>
                <p className="mt-2 text-slate-600">Loading customers...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-slate-50">
                      <th className="text-left p-3 font-semibold">Name</th>
                      <th className="text-left p-3 font-semibold">Phone</th>
                      <th className="text-left p-3 font-semibold">Email</th>
                      <th className="text-left p-3 font-semibold">CNIC</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustomers.map((customer) => (
                      <tr key={customer.id} className="border-b hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-medium">{customer.full_name}</td>
                        <td className="p-3">{customer.phone}</td>
                        <td className="p-3 text-slate-500">{customer.email || '-'}</td>
                        <td className="p-3 text-slate-500">{customer.cnic || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredCustomers.length === 0 && !loading && (
                  <div className="text-center py-8">
                    <p className="text-slate-500">No customers found</p>
                    <p className="text-sm text-slate-400 mt-1">Click "Add New Customer" to create one</p>
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