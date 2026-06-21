'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Sidebar from '@/components/layout/Sidebar'
import { useAuth } from '@/lib/useAuth'
import { toast } from 'sonner'
import { UserPlus, Users, Shield, Mail, Phone, X, Copy, CheckCircle } from 'lucide-react'

const ROLES = [
  { value: 'manager', label: 'Manager' },
  { value: 'receptionist', label: 'Receptionist' },
  { value: 'technician', label: 'Technician' },
  { value: 'inspection_tech', label: 'Inspection Technician' },
  { value: 'qa_tech', label: 'QA Technician' },
  { value: 'inventory_clerk', label: 'Inventory Clerk' },
  { value: 'accountant', label: 'Accountant' }
]

export default function StaffPage() {
  const { user } = useAuth()
  const [staff, setStaff] = useState<any[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [newStaff, setNewStaff] = useState({
    full_name: '',
    email: '',
    phone: '',
    role: 'technician',
    hourly_rate: '1000'
  })
  const [createdStaff, setCreatedStaff] = useState({ email: '', password: '' })

  useEffect(() => { if (user) fetchStaff() }, [user])

  const fetchStaff = async () => {
    const { data } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
    setStaff((data as any) || [])
  }

  const handleAddStaff = async () => {
    if (!newStaff.full_name || !newStaff.email || !newStaff.phone) {
      toast.error('Missing Information', { description: 'Please fill all required fields.' })
      return
    }

    setLoading(true)
    try {
      // Get current user's session token
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('Not authenticated')
      }

      // Call our secure API route
      const response = await fetch('/api/staff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(newStaff)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create staff')
      }

      // Show success modal with credentials
      setCreatedStaff({ email: data.email, password: data.tempPassword })
      setShowSuccessModal(true)
      setShowAddModal(false)
      setNewStaff({ full_name: '', email: '', phone: '', role: 'technician', hourly_rate: '1000' })
      fetchStaff()
      
    } catch (error: any) {
      toast.error('Failed to add staff', { description: error.message })
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!')
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-64 p-8">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
              <Users className="h-8 w-8 text-blue-600"/> Staff Management
            </h1>
            <p className="text-slate-600 mt-1">Manage garage staff and permissions</p>
          </div>
          <Button onClick={() => setShowAddModal(true)} className="bg-blue-600 hover:bg-blue-700">
            <UserPlus className="h-4 w-4 mr-2" /> Add New Staff
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Staff ({staff.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left p-3">Name</th>
                    <th className="text-left p-3">Role</th>
                    <th className="text-left p-3">
                      <span className="flex items-center gap-1"><Mail className="h-4 w-4" /> Email</span>
                    </th>
                    <th className="text-left p-3">Phone</th>
                    <th className="text-right p-3">Hourly Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {staff.map((member) => (
                    <tr key={member.id} className="border-t hover:bg-slate-50">
                      <td className="p-3 font-medium">{member.full_name}</td>
                      <td className="p-3">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">
                          {member.role?.toUpperCase().replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600">{member.email || 'N/A'}</td>
                      <td className="p-3 text-slate-600">{member.phone}</td>
                      <td className="p-3 text-right">Rs. {member.hourly_rate || 0}/hr</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {staff.length === 0 && <p className="text-center text-slate-500 py-8">No staff members found</p>}
            </div>
          </CardContent>
        </Card>

        {/* Add Staff Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5" /> Add New Staff
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setShowAddModal(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Full Name *</Label>
                  <Input 
                    value={newStaff.full_name} 
                    onChange={(e) => setNewStaff({...newStaff, full_name: e.target.value})}
                    placeholder="Muhammad Ahmed"
                  />
                </div>
                <div>
                  <Label>Email *</Label>
                  <Input 
                    type="email"
                    value={newStaff.email} 
                    onChange={(e) => setNewStaff({...newStaff, email: e.target.value})}
                    placeholder="ahmed@garage.com"
                  />
                </div>
                <div>
                  <Label>Phone *</Label>
                  <Input 
                    value={newStaff.phone} 
                    onChange={(e) => setNewStaff({...newStaff, phone: e.target.value})}
                    placeholder="0300-1234567"
                  />
                </div>
                <div>
                  <Label className="flex items-center gap-2"><Shield className="h-4 w-4" /> Role</Label>
                  <select 
                    value={newStaff.role} 
                    onChange={(e) => setNewStaff({...newStaff, role: e.target.value})}
                    className="w-full p-2 border rounded-lg mt-1"
                  >
                    {ROLES.map(role => (
                      <option key={role.value} value={role.value}>{role.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Hourly Rate (Rs.)</Label>
                  <Input 
                    type="number"
                    value={newStaff.hourly_rate} 
                    onChange={(e) => setNewStaff({...newStaff, hourly_rate: e.target.value})}
                  />
                </div>
                <Button onClick={handleAddStaff} disabled={loading} className="w-full">
                  {loading ? 'Creating Account...' : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" /> Create Staff Account
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Success Modal with Credentials */}
        {showSuccessModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md border-2 border-green-500">
              <CardHeader className="bg-green-50">
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2 text-green-800">
                    <CheckCircle className="h-5 w-5" /> Staff Created Successfully!
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setShowSuccessModal(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <p className="text-sm text-green-800 mb-3">
                    The staff account has been created. Share these credentials securely:
                  </p>
                  
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-green-700">Email</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 p-2 bg-white border border-green-300 rounded font-mono text-sm">
                          {createdStaff.email}
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => copyToClipboard(createdStaff.email)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs text-green-700">Temporary Password</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 p-2 bg-white border border-green-300 rounded font-mono text-sm">
                          {createdStaff.password}
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => copyToClipboard(createdStaff.password)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200 text-sm text-yellow-800">
                  <strong>⚠️ Important:</strong> Ask the staff member to change their password after first login.
                </div>

                <Button 
                  onClick={() => setShowSuccessModal(false)} 
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  Done
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}