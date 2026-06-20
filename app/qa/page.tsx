'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import Sidebar from '@/components/layout/Sidebar'
import { useAuth } from '@/lib/useAuth'
import { toast } from 'sonner'
import { ShieldCheck, CheckCircle, XCircle, ClipboardList } from 'lucide-react'

const QA_CHECKLIST = [
  'Engine runs smoothly without unusual noises',
  'Brakes respond properly and stop effectively',
  'All lights (headlights, brake lights, signals) working',
  'AC/Heating system functioning correctly',
  'No fluid leaks under the vehicle',
  'Tire pressure and condition acceptable',
  'Dashboard warning lights cleared',
  'Test drive completed successfully'
]

export default function QAPage() {
  const { user } = useAuth()
  const [jobs, setJobs] = useState<any[]>([])
  const [selectedJob, setSelectedJob] = useState<any>(null)
  const [checklist, setChecklist] = useState<{[key: string]: boolean}>({})
  const [comments, setComments] = useState('')
  const [reworkReason, setReworkReason] = useState('')
  const [showQAModal, setShowQAModal] = useState(false)

  useEffect(() => { if (user) fetchJobs() }, [user])

  const fetchJobs = async () => {
    const { data } = await supabase
      .from('work_orders')
      .select(`
        id, wo_number, complaint, status, technician_id,
        customers (full_name),
        vehicles (make, model, license_plate),
        users!technician_id (full_name)
      `)
      .eq('status', 'QA_IN_PROGRESS')
      .order('created_at', { ascending: false })
    setJobs((data as any) || [])
  }

  const openQAModal = (job: any) => {
    setSelectedJob(job)
    setShowQAModal(true)
    setChecklist({})
    setComments('')
    setReworkReason('')
  }

  const handleChecklistChange = (item: string, checked: boolean) => {
    setChecklist(prev => ({ ...prev, [item]: checked }))
  }

  const handlePassQA = async () => {
    if (!selectedJob) return

    try {
      await supabase.from('qa_reports').insert([{
        work_order_id: selectedJob.id,
        qa_technician_id: user?.id,
        passed: true,
        checklist_items: checklist,
        comments: comments,
        rework_reason: null
      }])

      await supabase.from('work_orders').update({ status: 'READY_FOR_BILLING' }).eq('id', selectedJob.id)

      toast.success('QA Passed!', { description: 'Vehicle sent to Billing.' })
      setShowQAModal(false)
      fetchJobs()
    } catch (e: any) { toast.error('Error', { description: e.message }) }
  }

  const handleFailQA = async () => {
    if (!selectedJob) return
    if (!reworkReason.trim()) {
      toast.error('Rework Reason Required', { description: 'Please specify what needs to be fixed.' })
      return
    }

    try {
      await supabase.from('qa_reports').insert([{
        work_order_id: selectedJob.id,
        qa_technician_id: user?.id,
        passed: false,
        checklist_items: checklist,
        comments: comments,
        rework_reason: reworkReason
      }])

      await supabase.from('work_orders').update({ status: 'IN_PROGRESS' }).eq('id', selectedJob.id)

      toast.error('QA Failed - Sent for Rework', { description: 'Technician notified of issues.' })
      setShowQAModal(false)
      fetchJobs()
    } catch (e: any) { toast.error('Error', { description: e.message }) }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-64 p-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <ShieldCheck className="h-8 w-8 text-purple-600"/> Quality Assurance
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {jobs.map((job) => (
            <Card key={job.id} className="border-l-4 border-l-purple-500">
              <CardHeader>
                <CardTitle className="text-lg">{job.wo_number}</CardTitle>
                <p className="text-sm text-slate-600">{job.vehicles?.make} {job.vehicles?.model} ({job.vehicles?.license_plate})</p>
                <p className="text-xs text-slate-500">Technician: {job.users?.full_name || 'Unknown'}</p>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-700 mb-4 bg-slate-50 p-2 rounded">"{job.complaint}"</p>
                <Button onClick={() => openQAModal(job)} className="w-full bg-purple-600 hover:bg-purple-700">
                  <ClipboardList className="h-4 w-4 mr-2" /> Perform QA Inspection
                </Button>
              </CardContent>
            </Card>
          ))}
          {jobs.length === 0 && <p className="text-slate-500 col-span-2 text-center py-12">No vehicles awaiting QA.</p>}
        </div>

        {/* QA Modal */}
        {showQAModal && selectedJob && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle className="text-xl">QA Inspection - {selectedJob.wo_number}</CardTitle>
                <p className="text-sm text-slate-600">{selectedJob.vehicles?.make} {selectedJob.vehicles?.model}</p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Checklist */}
                <div>
                  <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-purple-600" /> Inspection Checklist
                  </h3>
                  <div className="space-y-2">
                    {QA_CHECKLIST.map((item) => (
                      <label key={item} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checklist[item] || false}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChecklistChange(item, e.target.checked)}
                          className="mt-1 h-4 w-4"
                        />
                        <span className="text-sm text-slate-700">{item}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Comments */}
                <div>
                  <Label>Additional Comments (Optional)</Label>
                  <textarea
                    value={comments}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setComments(e.target.value)}
                    placeholder="Any additional notes about the inspection..."
                    rows={3}
                    className="mt-1 w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>

                {/* Rework Reason */}
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <Label className="text-red-900 font-bold">Rework Reason (Required if failing)</Label>
                  <textarea
                    value={reworkReason}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReworkReason(e.target.value)}
                    placeholder="Describe what needs to be fixed..."
                    rows={3}
                    className="mt-1 w-full p-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button onClick={handlePassQA} className="flex-1 bg-green-600 hover:bg-green-700">
                    <CheckCircle className="h-4 w-4 mr-2" /> Pass QA
                  </Button>
                  <Button onClick={handleFailQA} variant="destructive" className="flex-1">
                    <XCircle className="h-4 w-4 mr-2" /> Fail & Send for Rework
                  </Button>
                </div>
                <Button variant="outline" onClick={() => setShowQAModal(false)} className="w-full">
                  Cancel
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}