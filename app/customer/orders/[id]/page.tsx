'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Clock, Car, FileText, Star, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const STEPS = [
  { key: 'PENDING_MANAGER_APPROVAL', label: 'Booking Received' },
  { key: 'AWAITING_INSPECTION', label: 'Awaiting Inspection' },
  { key: 'INSPECTION_COMPLETE', label: 'Inspection Done' },
  { key: 'IN_PROGRESS', label: 'Repair In Progress' },
  { key: 'REPAIRS_COMPLETED', label: 'Repairs Finished' },
  { key: 'QA_APPROVED', label: 'Quality Check Passed' },
  { key: 'READY_FOR_BILLING', label: 'Ready for Pickup' },
  { key: 'COMPLETED', label: 'Completed' }
]

export default function CustomerOrderTracking() {
  const params = useParams()
  const woId = Array.isArray(params.id) ? params.id[0] : params.id
  const [wo, setWo] = useState<any>(null)
  const [issues, setIssues] = useState<any[]>([])
  const [invoice, setInvoice] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState({ rating: 0, comment: '' })
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false)

  useEffect(() => { if (woId) fetchData() }, [woId])

  const fetchData = async () => {
    try {
      const { data: woData } = await supabase.from('work_orders').select(`
        *, vehicles (license_plate, make, model, year, color), customers (full_name)
      `).eq('id', woId).single()
      setWo(woData)

      const { data: report } = await supabase.from('inspection_reports').select(`
        inspection_issues (checklist_item, description, severity, photo_urls)
      `).eq('work_order_id', woId).single()
      if (report?.inspection_issues) setIssues(report.inspection_issues)

      const { data: inv } = await supabase.from('invoices').select('*').eq('work_order_id', woId).single()
      if (inv) setInvoice(inv)

      const { data: fb } = await supabase.from('feedback').select('*').eq('work_order_id', woId).single()
      if (fb) { setFeedback({ rating: fb.rating, comment: fb.comment }); setFeedbackSubmitted(true) }
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const submitFeedback = async () => {
    if (feedback.rating === 0) return alert('Please select a rating')
    try {
      await supabase.from('feedback').insert([{
        work_order_id: woId, customer_id: wo.customer_id,
        rating: feedback.rating, comment: feedback.comment
      }])
      setFeedbackSubmitted(true)
      alert('Thank you for your feedback!')
    } catch (e: any) { alert('Error: ' + e.message) }
  }

  const currentStepIndex = wo ? STEPS.findIndex(s => s.key === wo.status) : -1

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-blue-600"></div></div>
  if (!wo) return <div className="min-h-screen flex items-center justify-center">Order not found</div>

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/customer/dashboard" className="flex items-center gap-2 text-slate-600 hover:text-blue-600">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Link>
          <span className="font-bold text-blue-600">{wo.wo_number}</span>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Vehicle Info */}
        <div className="bg-linear-to-r from-blue-600 to-blue-700 text-white p-6 rounded-2xl">
          <h1 className="text-2xl font-bold mb-1">{wo.vehicles?.year} {wo.vehicles?.make} {wo.vehicles?.model}</h1>
          <p className="text-blue-100">{wo.vehicles?.license_plate} • {wo.vehicles?.color}</p>
          <div className="mt-4 bg-white/10 rounded-lg p-3">
            <p className="text-xs text-blue-100">Current Status</p>
            <p className="text-xl font-bold">{wo.status.replace(/_/g, ' ')}</p>
          </div>
        </div>

        {/* Real-Time Timeline */}
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><Clock className="h-5 w-5 text-blue-600" /> Real-Time Progress</h2>
          <div className="space-y-0">
            {STEPS.map((step, i) => {
              const done = i <= currentStepIndex
              const current = i === currentStepIndex
              return (
                <div key={step.key} className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${done ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-slate-300 text-slate-400'} ${current ? 'animate-pulse' : ''}`}>
                      {done ? <CheckCircle2 className="h-5 w-5" /> : <div className="w-2 h-2 rounded-full bg-slate-300" />}
                    </div>
                    {i < STEPS.length - 1 && <div className={`w-0.5 h-8 ${done ? 'bg-green-500' : 'bg-slate-200'}`} />}
                  </div>
                  <p className={`pt-1.5 font-medium ${done ? 'text-slate-900' : 'text-slate-400'} ${current ? 'text-blue-600 font-bold' : ''}`}>{step.label}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Inspection Photos */}
        {issues.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <h2 className="text-lg font-bold mb-4">Inspection Findings</h2>
            <div className="space-y-3">
              {issues.map((issue: any, i: number) => (
                <div key={i} className="border rounded-lg p-3 bg-slate-50">
                  <p className="font-bold text-sm">{issue.checklist_item} <span className="text-yellow-600">({issue.severity})</span></p>
                  <p className="text-sm text-slate-600">{issue.description}</p>
                  {issue.photo_urls?.length > 0 && (
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {issue.photo_urls.map((url: string, j: number) => (
                        <a key={j} href={url} target="_blank"><img src={url} className="h-20 w-20 object-cover rounded border" alt="issue" /></a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Invoice */}
        {invoice && (
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><FileText className="h-5 w-5 text-green-600" /> Invoice</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Parts:</span><span>Rs. {invoice.parts_total}</span></div>
              <div className="flex justify-between"><span>Labor:</span><span>Rs. {invoice.labor_total}</span></div>
              <div className="flex justify-between"><span>Tax:</span><span>Rs. {invoice.tax_total}</span></div>
              <div className="flex justify-between text-lg font-bold border-t pt-2"><span>Total:</span><span className="text-green-700">Rs. {invoice.grand_total}</span></div>
              <div className="text-center mt-2">
                <span className={`px-4 py-1 rounded-full font-bold text-sm ${invoice.status === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{invoice.status}</span>
              </div>
            </div>
          </div>
        )}

        {/* Feedback */}
        {wo.status === 'COMPLETED' && (
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Star className="h-5 w-5 text-yellow-500" /> Rate Your Experience</h2>
            {feedbackSubmitted ? (
              <div className="text-center py-4">
                <div className="flex justify-center gap-1 mb-2">
                  {[1,2,3,4,5].map(i => <Star key={i} className={`h-6 w-6 ${i <= feedback.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300'}`} />)}
                </div>
                <p className="text-green-600 font-semibold">Thank you for your feedback!</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex gap-2">
                  {[1,2,3,4,5].map(i => (
                    <button key={i} onClick={() => setFeedback({...feedback, rating: i})}>
                      <Star className={`h-8 w-8 ${i <= feedback.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300'}`} />
                    </button>
                  ))}
                </div>
                <textarea value={feedback.comment} onChange={(e) => setFeedback({...feedback, comment: e.target.value})} placeholder="Tell us about your experience..." className="w-full p-3 border rounded-lg" rows={3} />
                <Button onClick={submitFeedback} className="w-full bg-yellow-500 hover:bg-yellow-600">Submit Feedback</Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}