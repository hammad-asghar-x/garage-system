'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { CheckCircle2, Clock, AlertCircle, Car, FileText, Image as ImageIcon } from 'lucide-react'

// Define the main customer-facing statuses
const TRACKING_STEPS = [
  { status: 'PENDING_MANAGER_APPROVAL', label: 'Received', icon: Clock },
  { status: 'AWAITING_INSPECTION', label: 'Inspection Queued', icon: Clock },
  { status: 'INSPECTION_IN_PROGRESS', label: 'Inspecting Vehicle', icon: Clock },
  { status: 'INSPECTION_COMPLETE', label: 'Inspection Done', icon: CheckCircle2 },
  { status: 'IN_PROGRESS', label: 'Repairs In Progress', icon: Clock },
  { status: 'REPAIRS_COMPLETED', label: 'Repairs Finished', icon: CheckCircle2 },
  { status: 'QA_IN_PROGRESS', label: 'Quality Check', icon: Clock },
  { status: 'QA_APPROVED', label: 'QA Passed', icon: CheckCircle2 },
  { status: 'READY_FOR_BILLING', label: 'Ready for Pickup', icon: CheckCircle2 },
  { status: 'COMPLETED', label: 'Job Completed', icon: CheckCircle2 }
]

interface InspectionIssue {
  id: string
  checklist_item: string
  description: string
  photo_urls: string[]
}

export default function CustomerTrackingPage() {
  const params = useParams()
  const woId = Array.isArray(params.id) ? params.id[0] : params.id

  const [wo, setWo] = useState<any>(null)
  const [issues, setIssues] = useState<InspectionIssue[]>([])
  const [invoice, setInvoice] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (woId) fetchData()
  }, [woId])

  const fetchData = async () => {
    setLoading(true)
    try {
      // 1. Fetch WO, Customer, Vehicle
      const { data: woData } = await supabase.from('work_orders').select(`
        *, customers (full_name, phone), vehicles (license_plate, make, model, year)
      `).eq('id', woId).single()
      setWo(woData)

      // 2. Fetch Inspection Issues & Photos
      const { data: reportData } = await supabase.from('inspection_reports').select(`
        inspection_issues (id, checklist_item, description, photo_urls)
      `).eq('work_order_id', woId).single()
      
      if (reportData?.inspection_issues) {
        setIssues(reportData.inspection_issues as InspectionIssue[])
      }

      // 3. Fetch Invoice (if paid/completed)
      const { data: invoiceData } = await supabase.from('invoices').select('*').eq('work_order_id', woId).single()
      if (invoiceData) setInvoice(invoiceData)

    } catch (error: any) {
      toast.error('Failed to load tracking data', { description: error.message })
    } finally {
      setLoading(false)
    }
  }

  const getCurrentStepIndex = () => {
    if (!wo) return -1
    const index = TRACKING_STEPS.findIndex(step => step.status === wo.status)
    return index === -1 ? 0 : index
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-blue-600"></div></div>
  if (!wo) return <div className="min-h-screen flex items-center justify-center text-slate-500">Work Order not found.</div>

  const currentStep = getCurrentStepIndex()

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-blue-600 text-white p-6 pb-12 rounded-b-3xl shadow-lg">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-1">Vehicle Tracking</h1>
          <p className="text-blue-100 text-sm">Work Order: {wo.wo_number}</p>
          <div className="mt-4 bg-white/10 backdrop-blur rounded-lg p-4">
            <p className="text-xs text-blue-100 uppercase">Current Status</p>
            <p className="text-xl font-bold">{wo.status.replace(/_/g, ' ')}</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-6 space-y-6">
        
        {/* Timeline Card */}
        <Card className="border-0 shadow-md">
          <CardHeader><CardTitle className="text-lg">Progress Timeline</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {TRACKING_STEPS.map((step, index) => {
                const isCompleted = index < currentStep
                const isCurrent = index === currentStep
                
                return (
                  <div key={step.status} className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                        isCompleted ? 'bg-green-500 border-green-500 text-white' :
                        isCurrent ? 'bg-blue-600 border-blue-600 text-white animate-pulse' :
                        'bg-white border-slate-300 text-slate-400'
                      }`}>
                        {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <step.icon className="h-4 w-4" />}
                      </div>
                      {index < TRACKING_STEPS.length - 1 && (
                        <div className={`w-0.5 h-8 mt-1 ${isCompleted ? 'bg-green-500' : 'bg-slate-200'}`}></div>
                      )}
                    </div>
                    <div className={`pt-1 ${isCurrent ? 'font-bold text-slate-900' : isCompleted ? 'text-slate-700' : 'text-slate-400'}`}>
                      {step.label}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Vehicle Info */}
        <Card>
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Car className="h-5 w-5"/> Vehicle Details</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Model:</span><span className="font-semibold">{wo.vehicles.year} {wo.vehicles.make} {wo.vehicles.model}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Plate:</span><span className="font-mono font-bold">{wo.vehicles.license_plate}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Customer:</span><span>{wo.customers.full_name}</span></div>
          </CardContent>
        </Card>

        {/* Inspection Photos */}
        {issues.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><ImageIcon className="h-5 w-5"/> Inspection Report</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-600">Our technicians found the following issues during inspection:</p>
              {issues.map((issue) => (
                <div key={issue.id} className="border rounded-lg p-3 bg-slate-50">
                  <h4 className="font-bold text-slate-800">{issue.checklist_item}</h4>
                  <p className="text-sm text-slate-700 mb-2">{issue.description}</p>
                  {issue.photo_urls && issue.photo_urls.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {issue.photo_urls.map((url, idx) => (
                        <a key={idx} href={url} target="_blank" rel="noopener noreferrer">
                          <img src={url} alt="Issue" className="h-24 w-24 object-cover rounded border hover:opacity-80 transition-opacity" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Invoice Summary */}
        {invoice && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader><CardTitle className="text-lg flex items-center gap-2 text-green-800"><FileText className="h-5 w-5"/> Final Invoice</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between"><span>Parts:</span><span>Rs. {invoice.parts_total}</span></div>
              <div className="flex justify-between"><span>Labor:</span><span>Rs. {invoice.labor_total}</span></div>
              <div className="flex justify-between"><span>Tax (17%):</span><span>Rs. {invoice.tax_total}</span></div>
              <div className="flex justify-between text-xl font-bold text-green-900 pt-2 border-t border-green-200"><span>Grand Total:</span><span>Rs. {invoice.grand_total}</span></div>
              <div className="mt-4 text-center">
                <span className={`px-4 py-2 rounded-full font-bold text-sm ${invoice.status === 'PAID' ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'}`}>
                  STATUS: {invoice.status}
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}