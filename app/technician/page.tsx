'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import Sidebar from '@/components/layout/Sidebar'
import { useAuth } from '@/lib/useAuth'
import { toast } from 'sonner'
import { Wrench, Clock, CheckCircle, Package, AlertCircle, Play, Square, XCircle } from 'lucide-react'

export default function TechnicianPage() {
  const { user } = useAuth()
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [selectedJobId, setSelectedJobId] = useState('')
  const [availableParts, setAvailableParts] = useState<any[]>([])
  const [selectedPartId, setSelectedPartId] = useState('')
  const [partQty, setPartQty] = useState(1)
  
  const [activeTimers, setActiveTimers] = useState<{[key: string]: {id: string, startTime: number}}>({})
  const [tick, setTick] = useState(0)
  
  const [filter, setFilter] = useState<'active' | 'my-jobs' | 'available' | 'completed' | 'rework'>('active')

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => { 
    if (user) {
      fetchJobs()
      loadActiveTimers()
    }
  }, [user, filter])

  const fetchJobs = async () => {
    setLoading(true)
    try {
      let statusFilter = ['IN_PROGRESS', 'AWAITING_PARTS', 'PARTS_READY']
      
      if (filter === 'completed') {
        statusFilter = ['QA_IN_PROGRESS', 'READY_FOR_BILLING', 'COMPLETED']
      } else if (filter === 'rework') {
        statusFilter = ['IN_PROGRESS'] // Jobs sent back from QA
      }

      const { data, error } = await supabase
        .from('work_orders')
        .select(`
          id, wo_number, complaint, status, technician_id,
          customers (full_name),
          vehicles (license_plate, make, model)
        `)
        .in('status', statusFilter)
        .order('created_at', { ascending: false })

      if (error) throw error
      setJobs((data as any) || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const loadActiveTimers = async () => {
    if (!user) return
    try {
      const { data, error } = await supabase
        .from('labor_tracking')
        .select('id, work_order_id, start_time')
        .eq('technician_id', user.id)
        .eq('status', 'IN_PROGRESS')
      
      if (error) throw error

      const newTimers: any = {}
      data?.forEach((record: any) => {
        newTimers[record.work_order_id] = {
          id: record.id,
          startTime: new Date(record.start_time).getTime()
        }
      })
      setActiveTimers(newTimers)
    } catch (error) {
      console.error('Failed to load active timers:', error)
    }
  }

  const formatTime = (startTime: number) => {
    const diff = Date.now() - startTime
    const hrs = Math.floor(diff / 3600000)
    const mins = Math.floor((diff % 3600000) / 60000)
    const secs = Math.floor((diff % 60000) / 1000)
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleStartTimer = async (woId: string) => {
    try {
      const { data: pastSessions } = await supabase
        .from('labor_tracking')
        .select('start_time, end_time, duration_minutes')
        .eq('work_order_id', woId)
        .eq('technician_id', user?.id)
        .eq('status', 'COMPLETED')

      let previousDurationMs = 0;
      if (pastSessions) {
        for (const session of pastSessions) {
          if (session.duration_minutes) {
            previousDurationMs += session.duration_minutes * 60000;
          } else if (session.start_time && session.end_time) {
            previousDurationMs += new Date(session.end_time).getTime() - new Date(session.start_time).getTime();
          }
        }
      }

      const virtualStartTime = Date.now() - previousDurationMs;

      const { data, error } = await supabase.from('labor_tracking').insert([{
        work_order_id: woId,
        technician_id: user?.id,
        start_time: new Date(virtualStartTime).toISOString(),
        status: 'IN_PROGRESS'
      }]).select().single()

      if (error) throw error

      setActiveTimers(prev => ({
        ...prev,
        [woId]: { id: data.id, startTime: virtualStartTime }
      }))

      toast.success(previousDurationMs > 0 ? 'Timer Resumed!' : 'Timer Started!')
    } catch (e: any) { 
      toast.error('Error starting timer', { description: e.message }) 
    }
  }

  const handleStopTimer = async (woId: string) => {
    const timer = activeTimers[woId]
    if (!timer) {
      toast.error('No active timer found for this job.')
      return
    }

    try {
      const { error } = await supabase
        .from('labor_tracking')
        .update({ 
          end_time: new Date().toISOString(),
          status: 'COMPLETED'
        })
        .eq('id', timer.id)
      
      if (error) throw error

      setActiveTimers(prev => {
        const newState = { ...prev }
        delete newState[woId]
        return newState
      })

      toast.success('Timer Paused & Saved!')
    } catch (e: any) { 
      toast.error('Error stopping timer', { description: e.message }) 
    }
  }

  const openRequestModal = async (woId: string) => {
    setSelectedJobId(woId)
    setShowRequestModal(true)
    const { data } = await supabase.from('parts').select('id, name, sku, quantity').order('name')
    setAvailableParts((data as any) || [])
  }

  const handleClaimJob = async (woId: string) => {
    try {
      await supabase.from('work_orders').update({ technician_id: user?.id, status: 'IN_PROGRESS' }).eq('id', woId)
      toast.success('Job Claimed!')
      fetchJobs()
    } catch (e: any) { toast.error('Error', { description: e.message }) }
  }

  const handleRequestParts = async () => {
    if (!selectedPartId || !selectedJobId) return toast.error('Please select a part')
    try {
      await supabase.from('part_requests').insert([{
        work_order_id: selectedJobId,
        requested_by: user?.id,
        part_id: selectedPartId,
        quantity: partQty,
        status: 'PENDING'
      }])
      await supabase.from('work_orders').update({ status: 'AWAITING_PARTS' }).eq('id', selectedJobId)
      toast.success('Parts Requested!')
      setShowRequestModal(false)
      setSelectedPartId('')
      setPartQty(1)
      fetchJobs()
    } catch (e: any) { toast.error('Error', { description: e.message }) }
  }

  const handleMarkComplete = async (woId: string) => {
    try {
      if (activeTimers[woId]) {
        await handleStopTimer(woId)
      }
      await supabase.from('work_orders').update({ status: 'QA_IN_PROGRESS' }).eq('id', woId)
      toast.success('Repair Complete! Sent to QA.')
      fetchJobs()
    } catch (e: any) { toast.error('Error', { description: e.message }) }
  }

  const getStatusBadge = (status: string) => {
    if (status === 'AWAITING_PARTS') return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold flex items-center gap-1"><AlertCircle className="h-3 w-3"/> Awaiting Parts</span>
    if (status === 'PARTS_READY') return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold flex items-center gap-1"><Package className="h-3 w-3"/> Parts Ready</span>
    if (status === 'QA_IN_PROGRESS') return <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-bold flex items-center gap-1"><Clock className="h-3 w-3"/> In QA</span>
    if (status === 'COMPLETED') return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold flex items-center gap-1"><CheckCircle className="h-3 w-3"/> Completed</span>
    return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold flex items-center gap-1"><Clock className="h-3 w-3"/> In Progress</span>
  }

  const filteredJobs = jobs.filter(job => {
    if (filter === 'my-jobs') return job.technician_id === user?.id && ['IN_PROGRESS', 'AWAITING_PARTS', 'PARTS_READY'].includes(job.status)
    if (filter === 'available') return !job.technician_id
    if (filter === 'completed') return job.technician_id === user?.id
    if (filter === 'rework') return job.technician_id === user?.id && job.status === 'IN_PROGRESS'
    return true
  })

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-64 p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2"><Wrench className="h-8 w-8 text-blue-600"/> Technician Dashboard</h1>
          <Button onClick={fetchJobs} variant="outline">Refresh</Button>
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          <Button onClick={() => setFilter('active')} variant={filter === 'active' ? 'default' : 'outline'} className={filter === 'active' ? 'bg-blue-600' : ''}>Active Jobs</Button>
          <Button onClick={() => setFilter('my-jobs')} variant={filter === 'my-jobs' ? 'default' : 'outline'} className={filter === 'my-jobs' ? 'bg-blue-600' : ''}>My Active Jobs</Button>
          <Button onClick={() => setFilter('available')} variant={filter === 'available' ? 'default' : 'outline'} className={filter === 'available' ? 'bg-blue-600' : ''}>Available</Button>
          <Button onClick={() => setFilter('rework')} variant={filter === 'rework' ? 'default' : 'outline'} className={filter === 'rework' ? 'bg-red-600 text-white' : ''}>
            <XCircle className="h-4 w-4 mr-1" /> Rework Needed
          </Button>
          <Button onClick={() => setFilter('completed')} variant={filter === 'completed' ? 'default' : 'outline'} className={filter === 'completed' ? 'bg-green-600' : ''}>
            <CheckCircle className="h-4 w-4 mr-1" /> Completed
          </Button>
        </div>
        
        {loading ? <p>Loading...</p> : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.map((job) => {
              const isMyJob = job.technician_id === user?.id
              const isAssigned = !!job.technician_id
              const activeTimer = activeTimers[job.id]
              const isRework = filter === 'rework'
              const isCompleted = filter === 'completed'

              return (
                <Card key={job.id} className={`border-l-4 ${isRework ? 'border-l-red-500' : isMyJob ? 'border-l-green-500' : 'border-l-blue-500'}`}>
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                      <CardTitle className="text-lg">{job.wo_number}</CardTitle>
                      {getStatusBadge(job.status)}
                    </div>
                    <p className="text-sm text-slate-600">{job.vehicles?.make} {job.vehicles?.model} ({job.vehicles?.license_plate})</p>
                    {isRework && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                        <strong>️ QA Failed:</strong> This job was sent back for rework. Check QA comments for details.
                      </div>
                    )}
                    {activeTimer && (
                      <div className="mt-2 flex items-center gap-2 text-green-600 font-mono font-bold bg-green-50 px-2 py-1 rounded border border-green-200">
                        <Clock className="h-4 w-4 animate-pulse" />
                        {formatTime(activeTimer.startTime)}
                      </div>
                    )}
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-700 mb-4 bg-slate-50 p-2 rounded">"{job.complaint}"</p>
                    
                    {!isAssigned && !isCompleted ? (
                      <Button onClick={() => handleClaimJob(job.id)} className="w-full bg-blue-600 hover:bg-blue-700">Claim Job</Button>
                    ) : isMyJob && !isCompleted ? (
                      <div className="space-y-2">
                        <div className="flex gap-2 mb-3 p-2 bg-slate-50 rounded border">
                          {activeTimer ? (
                            <Button onClick={() => handleStopTimer(job.id)} variant="destructive" className="flex-1">
                              <Square className="h-4 w-4 mr-1" /> Pause Timer
                            </Button>
                          ) : (
                            <Button onClick={() => handleStartTimer(job.id)} className="flex-1 bg-green-600 hover:bg-green-700">
                              <Play className="h-4 w-4 mr-1" /> Start / Resume Timer
                            </Button>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Button variant="outline" className="flex-1" onClick={() => openRequestModal(job.id)} disabled={job.status === 'AWAITING_PARTS'}>
                            <Package className="h-4 w-4 mr-1" /> Request Parts
                          </Button>
                          <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => handleMarkComplete(job.id)} disabled={job.status === 'AWAITING_PARTS'}>
                            <CheckCircle className="h-4 w-4 mr-1" /> Mark Complete
                          </Button>
                        </div>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              )
            })}
            {filteredJobs.length === 0 && <p className="col-span-3 text-center py-12 text-slate-500">No jobs found.</p>}
          </div>
        )}

        {/* Request Parts Modal */}
        {showRequestModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-96">
              <CardHeader><CardTitle>Request Parts</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Select Part</Label>
                  <select className="w-full p-2 border rounded-lg mt-1 bg-white" value={selectedPartId} onChange={e => setSelectedPartId(e.target.value)}>
                    <option value="">-- Choose a part --</option>
                    {availableParts.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.sku}) - Stock: {p.quantity}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Quantity</Label>
                  <input type="number" className="w-full p-2 border rounded-lg mt-1" value={partQty} onChange={e => setPartQty(parseInt(e.target.value))} min="1" />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleRequestParts} className="flex-1" disabled={!selectedPartId}>Submit Request</Button>
                  <Button variant="outline" onClick={() => setShowRequestModal(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}