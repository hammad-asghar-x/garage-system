'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/lib/useAuth'
import Sidebar from '@/components/layout/Sidebar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { User, Shield, Phone, Mail, CreditCard, MapPin, Lock, Save } from 'lucide-react'

export default function ProfilePage() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [userData, setUserData] = useState<any>({
    full_name: '',
    email: '',
    phone: '',
    cnic: '',
    address: '',
    role: ''
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showPasswordSection, setShowPasswordSection] = useState(false)

  useEffect(() => {
    if (user) {
      fetchUserData()
    }
  }, [user])

  const fetchUserData = async () => {
    try {
      // Try customers table first
      let { data } = await supabase
        .from('customers')
        .select('*')
        .eq('id', user?.id)
        .single()

      // If not found, try users table (staff)
      if (!data) {
        const { data: staffData } = await supabase
          .from('users')
          .select('*')
          .eq('id', user?.id)
          .single()
        data = staffData
      }

      if (data) {
        setUserData({
          full_name: data.full_name || '',
          email: data.email || user?.email || '',
          phone: data.phone || '',
          cnic: data.cnic || '',
          address: data.address || '',
          role: data.role || 'customer'
        })
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Determine which table to update
      const { data: customerCheck } = await supabase
        .from('customers')
        .select('id')
        .eq('id', user?.id)
        .single()

      if (customerCheck) {
        // Update customers table
        const { error } = await supabase
          .from('customers')
          .update({
            full_name: userData.full_name,
            phone: userData.phone,
            cnic: userData.cnic,
            address: userData.address
          })
          .eq('id', user?.id)

        if (error) throw error
      } else {
        // Update users table (staff)
        const { error } = await supabase
          .from('users')
          .update({
            full_name: userData.full_name,
            phone: userData.phone,
            cnic: userData.cnic,
            address: userData.address
          })
          .eq('id', user?.id)

        if (error) throw error
      }

      toast.success('Profile updated successfully!')
      fetchUserData()
    } catch (error: any) {
      toast.error('Failed to update profile', { description: error.message })
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    try {
      // First verify current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: passwordData.currentPassword
      })

      if (signInError) {
        toast.error('Current password is incorrect')
        setLoading(false)
        return
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      })

      if (updateError) throw updateError

      toast.success('Password changed successfully!')
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setShowPasswordSection(false)
    } catch (error: any) {
      toast.error('Failed to change password', { description: error.message })
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await signOut()
    router.push('/login')
  }

  if (!user) return null

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-64 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
            <User className="h-8 w-8 text-blue-600" />
            My Profile
          </h1>
          <p className="text-slate-600 mt-1">Manage your account settings and preferences</p>
        </div>

        <div className="max-w-3xl space-y-6">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                Personal Information
              </CardTitle>
              <CardDescription>Update your personal details and contact information</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Full Name</Label>
                    <div className="relative mt-1">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        value={userData.full_name}
                        onChange={(e) => setUserData({ ...userData, full_name: e.target.value })}
                        className="pl-10"
                        placeholder="Your full name"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Email</Label>
                    <div className="relative mt-1">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        value={userData.email}
                        disabled
                        className="pl-10 bg-slate-50"
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Email cannot be changed</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Phone Number</Label>
                    <div className="relative mt-1">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        value={userData.phone}
                        onChange={(e) => setUserData({ ...userData, phone: e.target.value })}
                        className="pl-10"
                        placeholder="0300-1234567"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>CNIC</Label>
                    <div className="relative mt-1">
                      <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        value={userData.cnic}
                        onChange={(e) => setUserData({ ...userData, cnic: e.target.value })}
                        className="pl-10"
                        placeholder="12345-1234567-8"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Address</Label>
                  <div className="relative mt-1">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <textarea
                      value={userData.address}
                      onChange={(e) => setUserData({ ...userData, address: e.target.value })}
                      className="w-full pl-10 p-2 border rounded-lg"
                      rows={3}
                      placeholder="Your complete address"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-slate-400" />
                    <span className="text-sm font-medium text-slate-700">
                      Role: <span className="text-blue-600 uppercase">{userData.role}</span>
                    </span>
                  </div>
                  <Button type="submit" disabled={loading}>
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Password Change Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-blue-600" />
                Security
              </CardTitle>
              <CardDescription>Change your password to keep your account secure</CardDescription>
            </CardHeader>
            <CardContent>
              {!showPasswordSection ? (
                <Button onClick={() => setShowPasswordSection(true)} variant="outline">
                  Change Password
                </Button>
              ) : (
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <Label>Current Password</Label>
                    <Input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      placeholder="Enter current password"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>New Password</Label>
                      <Input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        placeholder="New password"
                        required
                      />
                    </div>

                    <div>
                      <Label>Confirm New Password</Label>
                      <Input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        placeholder="Confirm new password"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" disabled={loading}>
                      {loading ? 'Changing...' : 'Update Password'}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setShowPasswordSection(false)
                        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Account Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Account Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Button onClick={handleLogout} variant="destructive">
                  Logout
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}