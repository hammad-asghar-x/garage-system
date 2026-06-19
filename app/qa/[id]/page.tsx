'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import Sidebar from '@/components/layout/Sidebar'
import { useAuth } from '@/lib/useAuth'
import { toast } from 'sonner'
import { CheckCircle, XCircle, Image as ImageIcon } from 'lucide-react'

interface InspectionIssue {
  id: string
  checklist_item: string
  description: string
  severity: string
  photo_urls: string[]
}

export default function QAReviewPage() {
  const { user, loading: authLoading } = useAuth()
  const params = useParams()
  const router = useRouter()
  const woId = Array.isArray(params.id) ? params.id[0] : params.id

  const [wo, setWo] = useState<any>(null)
  const [issues, setIssues] = useState<InspectionIssue[]>([])
  const [qaNotes, setQaNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (user && woId) fetchData()
  }, [user, woId])

  const fetchData = async () => {
    setLoading(true)
    try {
      // 1. Fetch Work Order
      const { data: woData, error: woError } = await supabase
        .from('work_orders')
        .select(`
          *,
          customers (full_name, phone),
          vehicles (license_plate, make, model, year)
        `)
        .eq('id', woId)
        .single()
      if (woError) throw woError
      setWo(woData)

      // 2. Fetch Inspection Report & Issues (to see what the tech fixed)
      const { data: reportData } = await supabase
        .from('inspection_reports')
        .select(`
          id,
          inspection_issues (
            id, checklist_item, description, severity, photo_urls
          )
        `)
        .eq('work_order_id', woId)
        .single()

      if (reportData && reportData.inspection_issues) {
        setIssues(reportData.inspection_issues as InspectionIssue[])
      }
    } catch (error: any) {
      toast.error('Failed to load data', { description: error.message })
    } finally {
      setLoading(false)
    }
  }

  const handleDecision = async (decision: 'QA_APPROVED' | 'REWORK_NEEDED') => {
    setSubmitting(true)
    try {
      const { error } = await supabase
        .from('work_orders')
        .update({ 
          status: decision,
          qa_notes: qaNotes || (decision === 'REWORK_NEEDED' ? 'Rework required by QA.' : 'Passed QA inspection.')
        })
        .eq('id', woId)

      if (error) throw error

      toast.success(
        decision === 'QA_APPROVED' ? 'Job Approved!' : 'Sent for Rework!', 
        { description: `Status updated to ${decision.replace('_', ' ')}` }
      )
      router.push('/qa')
    } catch (error: any) {
      toast.error('Failed to update status', { description: error.message })
    } finally {
      setSubmitting(false)
    }
  }

  if (authLoading || loading) return <div className="flex min-h-screen items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-blue-600"></div></div>
  if (!user) return null
  if (!wo) return <div className="p-8 text-center">Job not found.</div>

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-64 p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-800">QA Review: {wo.wo_number}</h1>
          <p className="text-slate-600 mt-1">{wo.vehicles.year} {wo.vehicles.make} {wo.vehicles.model}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Inspection Report & Photos */}
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><ImageIcon className="h-5 w-5"/> Inspection Report & Photos</CardTitle></CardHeader>
              <CardContent>
                {issues.length === 0 ? (
                  <p className="text-slate-500">No inspection issues recorded.</p>
                ) : (
                  <div className="space-y-4">
                    {issues.map((issue) => (
                      <div key={issue.id} className="border rounded-lg p-3 bg-slate-50">
                        <div className="flex justify-between items-center mb-1">
                          <h4 className="font-bold text-slate-800">{issue.checklist_item}</h4>
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                            issue.severity === 'CRITICAL' ? 'bg-red-200 text-red-800' :
                            issue.severity === 'HIGH' ? 'bg-orange-200 text-orange-800' : 'bg-yellow-200 text-yellow-800'
                          }`}>{issue.severity}</span>
                        </div>
                        <p className="text-sm text-slate-700 mb-2">{issue.description}</p>
                        
                        {issue.photo_urls && issue.photo_urls.length > 0 && (
                          <div className="flex gap-2 flex-wrap">
                            {issue.photo_urls.map((url, idx) => (
                              <a key={idx} href={url} target="_blank" rel="noopener noreferrer">
                                <img src={url} alt="Issue" className="h-20 w-20 object-cover rounded border hover:opacity-80 transition-opacity" />
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: QA Decision */}
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>QA Decision</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>QA Notes / Feedback</Label>
                  <textarea
                    value={qaNotes}
                    onChange={(e) => setQaNotes(e.target.value)}
                    rows={4}
                    placeholder="Write notes about the quality of the repair..."
                    className="w-full p-2 border rounded mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <Button 
                    onClick={() => handleDecision('QA_APPROVED')} 
                    disabled={submitting}
                    className="bg-green-600 hover:bg-green-700 h-12"
                  >
                    <CheckCircle className="h-5 w-5 mr-2" /> Pass QA
                  </Button>
                  <Button 
                    onClick={() => handleDecision('REWORK_NEEDED')} 
                    disabled={submitting}
                    variant="destructive"
                    className="h-12"
                  >
                    <XCircle className="h-5 w-5 mr-2" /> Fail / Rework
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Job Details</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div><span className="font-semibold">Customer:</span> {wo.customers.full_name}</div>
                <div><span className="font-semibold">Phone:</span> {wo.customers.phone}</div>
                <div><span className="font-semibold">Complaint:</span> {wo.complaint}</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}