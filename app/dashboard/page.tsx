'use client'

import Sidebar from '@/components/layout/Sidebar'
import { useAuth } from '@/lib/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function DashboardPage() {
  const { user, loading } = useAuth()

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  if (!user) return null

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-64 p-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-6">
          Welcome back, {user.full_name}!
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Role</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600 capitalize">
                {user.role.replace('_', ' ')}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Email</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg text-slate-600">{user.email}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg text-green-600 font-semibold">● Online</p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <h2 className="text-xl font-semibold text-blue-800 mb-2"> Phase 6 Coming Next</h2>
          <p className="text-blue-700">
            The Work Order Management module will be built here next. 
            This is the core of the Garage Management System!
          </p>
        </div>
      </div>
    </div>
  )
}