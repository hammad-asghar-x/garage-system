'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Sidebar from '@/components/layout/Sidebar'
import { useAuth } from '@/lib/useAuth'
import { toast } from 'sonner'
import Link from 'next/link'
import { Clock, Play, Square, Package, CheckCircle } from 'lucide-react'

interface WorkOrder {
  id: string
  wo_number: string
  complaint: string
  status: string
  assigned_to: string | null
  customers: { full_name: string }
  vehicles: { license_plate: string; make: string; model: string; year: number | null }
}

interface LaborSession {
  id: string
  work_order_id: string
  start_time: string
  end_time: string | null
  duration_minutes: number | null
  status: string
}

export default function TechnicianDashboard() {
  const { user, loading: authLoading } = useAuth()
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [laborSessions, setLaborSessions] = useState<{[key: string]: LaborSession}>({})
  const [loading, setLoading] = useState(false)
  const [timers, setTimers] = useState<{[key: string]: number}>({})

  useEffect(() => {
    if (user) {
      fetchAssignedJobs()
      fetchActiveLaborSessions()
    }
  }, [user])

  // Update timers every second
  useEffect(() => {
    const interval = setInterval(() => {
      setTimers(prev => {
        const newTimers = { ...prev }
        Object.keys(newTimers).forEach(woId => {
          newTimers[woId] = newTimers[woId] + 1
        })
        return newTimers
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const fetchAssignedJobs = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('work_orders')
        .select(`
          id, wo_number, complaint, status, assigned_to,
          customers (full_name),
          vehicles (license_plate, make, model, year)
        `)
        .in('status', ['IN_PROGRESS', 'PARTS_READY', 'REWORK_NEEDED'])
        .eq('assigned_to', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setWorkOrders((data as any) || [])
    } catch (error: any) {
      toast.error('Failed to load jobs', { description: error.message })
    } finally {
      setLoading(false)
    }
  }

  const fetchActiveLaborSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('labor_tracking')
        .select('*')
        .eq('technician_id', user?.id)
        .eq('status', 'IN_PROGRESS')

      if (error) throw error

      const sessionsMap: {[key: string]: LaborSession} = {}
      ;(data as any)?.forEach((session: LaborSession) => {
        sessionsMap[session.work_order_id] = session
        
        const startTime = new Date(session.start_time).getTime()
        const now = Date.now()
        const elapsedSeconds = Math.floor((now - startTime) / 1000)
        
        setTimers(prev => ({ ...prev, [session.work_order_id]: elapsedSeconds }))
      })
      
      setLaborSessions(sessionsMap)
    } catch (error: any) {
      console.error('Error fetching labor sessions:', error)
    }
  }

  const handleStartTimer = async (woId: string) => {
    try {
      const { data, error } = await supabase
        .from('labor_tracking')
        .insert([{
          work_order_id: woId,
          technician_id: user?.id,
          start_time: new Date().toISOString(),
          status: 'IN_PROGRESS'
        }])
        .select()
        .single()

      if (error) throw error

      setLaborSessions(prev => ({ ...prev, [woId]: data as any }))
      setTimers(prev => ({ ...prev, [woId]: 0 }))

      toast.success('Timer Started!', { description: 'Tracking your work time.' })
    } catch (error: any) {
      toast.error('Failed to start timer', { description: error.message })
    }
  }

  const handleStopTimer = async (woId: string) => {
    const session = laborSessions[woId]
    if (!session) return

    try {
      const { error } = await supabase
        .from('labor_tracking')
        .update({
          end_time: new Date().toISOString(),
          status: 'COMPLETED'
        })
        .eq('id', session.id)

      if (error) throw error

      setLaborSessions(prev => {
        const newSessions = { ...prev }
        delete newSessions[woId]
        return newSessions
      })

      setTimers(prev => {
        const newTimers = { ...prev }
        delete newTimers[woId]
        return newTimers
      })

      toast.success('Timer Stopped!', { description: 'Work time recorded.' })
    } catch (error: any) {
      toast.error('Failed to stop timer', { description: error.message })
    }
  }

  // NEW FUNCTION: Mark Job as Complete
  const handleCompleteJob = async (woId: string) => {
    // Optional: Auto-stop timer if it's still running
    if (laborSessions[woId]) {
      await handleStopTimer(woId)
    }

    try {
      const { error } = await supabase
        .from('work_orders')
        .update({ status: 'REPAIRS_COMPLETED' })
        .eq('id', woId)

      if (error) throw error

      toast.success('Job Marked as Complete!', { 
        description: 'Work order sent to Quality Assurance (QA).' 
      })
      
      // Remove from local list so it disappears from the dashboard
      setWorkOrders(prev => prev.filter(wo => wo.id !== woId))
    } catch (error: any) {
      toast.error('Failed to complete job', { description: error.message })
    }
  }

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

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
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-800">Technician Workbench</h1>
          <p className="text-slate-600 mt-1">Your assigned jobs and active timers</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" /> Assigned Work Orders ({workOrders.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center py-8">Loading jobs...</p>
            ) : (
              <div className="space-y-4">
                {workOrders.map((wo) => {
                  const hasActiveTimer = laborSessions[wo.id]
                  const elapsedSeconds = timers[wo.id] || 0

                  return (
                    <div key={wo.id} className="border rounded-lg p-4 bg-white shadow-sm">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-bold text-blue-600 text-lg">{wo.wo_number}</p>
                          <p className="text-slate-700 font-medium">
                            {wo.vehicles.year} {wo.vehicles.make} {wo.vehicles.model} ({wo.vehicles.license_plate})
                          </p>
                          <p className="text-sm text-slate-500">Customer: {wo.customers.full_name}</p>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            wo.status === 'REWORK_NEEDED' ? 'bg-red-100 text-red-800' :
                            wo.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {wo.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>

                      <div className="bg-slate-50 p-3 rounded mb-3">
                        <p className="text-sm text-slate-600">
                          <span className="font-semibold">Complaint:</span> {wo.complaint}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {!hasActiveTimer ? (
                          <Button 
                            onClick={() => handleStartTimer(wo.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Start Timer
                          </Button>
                        ) : (
                          <>
                            <div className="flex items-center gap-2 bg-blue-100 px-4 py-2 rounded">
                              <Clock className="h-4 w-4 text-blue-600" />
                              <span className="font-mono font-bold text-blue-800">
                                {formatTime(elapsedSeconds)}
                              </span>
                            </div>
                            <Button 
                              onClick={() => handleStopTimer(wo.id)}
                              variant="destructive"
                            >
                              <Square className="h-4 w-4 mr-2" />
                              Stop Timer
                            </Button>
                          </>
                        )}
                        
                        <Link href={`/technician/${wo.id}/parts`}>
                          <Button variant="outline">
                            <Package className="h-4 w-4 mr-2" />
                            Request Parts
                          </Button>
                        </Link>

                        {/* NEW BUTTON: Mark as Complete */}
                        <Button 
                          onClick={() => handleCompleteJob(wo.id)}
                          className="bg-slate-800 hover:bg-slate-900 ml-auto"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Mark as Complete
                        </Button>
                      </div>
                    </div>
                  )
                })}

                {workOrders.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-slate-500">No work orders assigned to you.</p>
                    <p className="text-sm text-slate-400 mt-1">
                      Contact the manager to get assigned to jobs.
                    </p>
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