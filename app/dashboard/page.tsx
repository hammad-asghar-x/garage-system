'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Sidebar from '@/components/layout/Sidebar'
import { useAuth } from '@/lib/useAuth'
import { toast } from 'sonner'
import { 
  DollarSign, 
  Car, 
  Clock, 
  AlertCircle, 
  Users, 
  TrendingUp 
} from 'lucide-react'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'

// Colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#a4de6c', '#d0ed57', '#83a6ed', '#8dd1e1', '#8b8b8b', '#ff6b6b'];

export default function ManagerDashboard() {
  const { user, loading: authLoading } = useAuth()
  
  const [stats, setStats] = useState({
    totalRevenue: 0,
    activeJobs: 0,
    pendingApprovals: 0,
    completedJobs: 0
  })
  
  const [statusChartData, setStatusChartData] = useState<any[]>([])
  const [staffData, setStaffData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) fetchAnalytics()
  }, [user])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      // 1. Fetch Invoices for Revenue
      const { data: invoices } = await supabase
        .from('invoices')
        .select('grand_total, status')
      
      // 2. Fetch Work Orders for Status Counts
      const { data: workOrders } = await supabase
        .from('work_orders')
        .select('status')

      // 3. Fetch Labor & Users for Staff Performance
      const { data: laborData } = await supabase
        .from('labor_tracking')
        .select('technician_id, duration_minutes, status')
      
      const { data: usersData } = await supabase
        .from('users')
        .select('id, full_name, role')

      // --- PROCESS DATA ---
      
      // Calculate Revenue
      const totalRevenue = invoices
        ?.filter(inv => inv.status === 'PAID')
        .reduce((sum, inv) => sum + Number(inv.grand_total), 0) || 0

      // Calculate Job Counts
      const activeJobs = workOrders?.filter(wo => !['COMPLETED', 'CANCELLED'].includes(wo.status)).length || 0
      const pendingApprovals = workOrders?.filter(wo => wo.status === 'PENDING_MANAGER_APPROVAL').length || 0
      const completedJobs = workOrders?.filter(wo => wo.status === 'COMPLETED').length || 0

      setStats({ totalRevenue, activeJobs, pendingApprovals, completedJobs })

      // Process Status Chart Data
      const statusCounts: { [key: string]: number } = {}
      workOrders?.forEach(wo => {
        const cleanStatus = wo.status.replace(/_/g, ' ')
        statusCounts[cleanStatus] = (statusCounts[cleanStatus] || 0) + 1
      })
      const chartData = Object.keys(statusCounts).map(key => ({
        name: key,
        value: statusCounts[key]
      }))
      setStatusChartData(chartData)

      // Process Staff Performance Data
      const staffMap: { [key: string]: { name: string; totalMinutes: number; jobs: number } } = {}
      
      laborData?.forEach(labor => {
        if (labor.status === 'COMPLETED' && labor.technician_id) {
          if (!staffMap[labor.technician_id]) {
            const techUser = usersData?.find(u => u.id === labor.technician_id)
            staffMap[labor.technician_id] = {
              name: techUser?.full_name || 'Unknown Tech',
              totalMinutes: 0,
              jobs: 0
            }
          }
          staffMap[labor.technician_id].totalMinutes += Number(labor.duration_minutes || 0)
          staffMap[labor.technician_id].jobs += 1
        }
      })
      
      const staffArray = Object.values(staffMap).sort((a, b) => b.totalMinutes - a.totalMinutes)
      setStaffData(staffArray)

    } catch (error: any) {
      toast.error('Failed to load dashboard analytics', { description: error.message })
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR' }).format(amount)
  }

  const formatHours = (minutes: number) => {
    return (minutes / 60).toFixed(1) + ' hrs'
  }

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-blue-600"></div>
          <p className="mt-2 text-slate-600">Loading Analytics...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-64 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Manager Dashboard</h1>
          <p className="text-slate-600 mt-1">Business overview and staff performance</p>
        </div>

        {/* 1. Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">Total Revenue</p>
                <p className="text-2xl font-bold text-slate-900">{formatCurrency(stats.totalRevenue)}</p>
              </div>
              <DollarSign className="h-10 w-10 text-green-500 opacity-20" />
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">Active Jobs</p>
                <p className="text-2xl font-bold text-slate-900">{stats.activeJobs}</p>
              </div>
              <Car className="h-10 w-10 text-blue-500 opacity-20" />
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-yellow-500">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">Pending Approvals</p>
                <p className="text-2xl font-bold text-slate-900">{stats.pendingApprovals}</p>
              </div>
              <AlertCircle className="h-10 w-10 text-yellow-500 opacity-20" />
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">Completed Jobs</p>
                <p className="text-2xl font-bold text-slate-900">{stats.completedJobs}</p>
              </div>
              <TrendingUp className="h-10 w-10 text-purple-500 opacity-20" />
            </CardContent>
          </Card>
        </div>

        {/* 2. Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Job Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Job Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {statusChartData.length === 0 ? (
                <p className="text-center text-slate-500 py-8">No active jobs to display.</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    >
                      {statusChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions / Alerts */}
          <Card>
            <CardHeader>
              <CardTitle>Manager Action Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-6 w-6 text-yellow-600" />
                  <div>
                    <p className="font-semibold text-yellow-800">Approve Work Orders</p>
                    <p className="text-sm text-yellow-700">{stats.pendingApprovals} jobs waiting for your approval</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-3">
                  <Car className="h-6 w-6 text-blue-600" />
                  <div>
                    <p className="font-semibold text-blue-800">Active Shop Floor</p>
                    <p className="text-sm text-blue-700">{stats.activeJobs} vehicles currently being serviced</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-6 w-6 text-green-600" />
                  <div>
                    <p className="font-semibold text-green-800">Revenue Collected</p>
                    <p className="text-sm text-green-700">{formatCurrency(stats.totalRevenue)} total earned</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 3. Staff Performance Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" /> Technician Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {staffData.length === 0 ? (
              <p className="text-center text-slate-500 py-8">No completed labor sessions recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-slate-50">
                      <th className="text-left p-3 font-semibold">Technician</th>
                      <th className="text-left p-3 font-semibold">Jobs Completed</th>
                      <th className="text-left p-3 font-semibold">Total Hours Worked</th>
                      <th className="text-left p-3 font-semibold">Performance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffData.map((staff, index) => (
                      <tr key={index} className="border-b hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-medium">{staff.name}</td>
                        <td className="p-3">{staff.jobs}</td>
                        <td className="p-3">{formatHours(staff.totalMinutes)}</td>
                        <td className="p-3">
                          <div className="w-full bg-slate-200 rounded-full h-2.5">
                            <div 
                              className="bg-blue-600 h-2.5 rounded-full" 
                              style={{ width: `${Math.min((staff.totalMinutes / (staffData[0].totalMinutes || 1)) * 100, 100)}%` }}
                            ></div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}