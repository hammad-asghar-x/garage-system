'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Sidebar from '@/components/layout/Sidebar'
import { useAuth } from '@/lib/useAuth'
import { toast } from 'sonner'
import { 
  DollarSign, FileText, ArrowLeft, CreditCard, Banknote, 
  CheckCircle, Printer, Clock, Package, Wrench, Eye, User, Car
} from 'lucide-react'

type BillingState = 'list' | 'preview' | 'invoice' | 'receipt' | 'jobDetails'

export default function BillingPage() {
  const { user } = useAuth()
  const [state, setState] = useState<BillingState>('list')
  const [jobs, setJobs] = useState<any[]>([])
  const [selectedJob, setSelectedJob] = useState<any>(null)
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null)
  const [costBreakdown, setCostBreakdown] = useState<any>({ 
    parts: 0, labor: 0, tax: 0, total: 0, laborDetails: [], partsDetails: [] 
  })
  const [loading, setLoading] = useState(false)

  const userRole = (user as any)?.role || 'accountant'
  const isManager = userRole === 'manager' || userRole === 'super_admin'

  useEffect(() => { 
    if (user && state === 'list') fetchJobs() 
  }, [user, state])

  const fetchJobs = async () => {
    const { data } = await supabase
      .from('work_orders')
      .select(`
        id, wo_number, complaint, status, customer_id, created_at,
        customers (full_name, phone, email),
        vehicles (make, model, year, license_plate)
      `)
      .in('status', ['READY_FOR_BILLING', 'COMPLETED'])
      .order('created_at', { ascending: false })
    setJobs((data as any) || [])
  }

  const calculateCosts = async (woId: string) => {
    const { data: laborRecords } = await supabase
      .from('labor_tracking')
      .select('technician_id, duration_minutes')
      .eq('work_order_id', woId)
      .eq('status', 'COMPLETED')
      .not('duration_minutes', 'is', null)

    let laborTotal = 0
    const laborDetails: any[] = []

    if (laborRecords && laborRecords.length > 0) {
      const techIds = [...new Set(laborRecords.map(r => r.technician_id))]
      const { data: technicians } = await supabase
        .from('users')
        .select('id, full_name, hourly_rate')
        .in('id', techIds)

      for (const record of laborRecords) {
        const tech = technicians?.find(t => t.id === record.technician_id)
        const minutes = record.duration_minutes || 0
        const hours = minutes / 60
        const rate = tech?.hourly_rate || 0
        const cost = hours * rate
        laborTotal += cost
        laborDetails.push({ technician: tech?.full_name || 'Unknown', minutes, hours: hours.toFixed(2), rate, cost })
      }
    }

    const { data: partRequests } = await supabase
      .from('part_requests')
      .select('part_id, quantity')
      .eq('work_order_id', woId)
      .eq('status', 'APPROVED')

    let partsTotal = 0
    const partsDetails: any[] = []

    if (partRequests && partRequests.length > 0) {
      for (const req of partRequests) {
        const { data: part } = await supabase.from('parts').select('name, sku, unit_price').eq('id', req.part_id).single()
        if (part) {
          const cost = (part.unit_price || 0) * req.quantity
          partsTotal += cost
          partsDetails.push({ name: part.name, sku: part.sku, quantity: req.quantity, unit_price: part.unit_price, cost })
        }
      }
    }

    const subtotal = partsTotal + laborTotal
    const tax = subtotal * 0.17
    const total = subtotal + tax

    return { parts: partsTotal, labor: laborTotal, tax, total, laborDetails, partsDetails }
  }

  const handleOpenJob = async (job: any) => {
    setSelectedJob(job)
    setLoading(true)
    const { data: existingInvoice } = await supabase.from('invoices').select('*').eq('work_order_id', job.id).single()

    if (existingInvoice) {
      setSelectedInvoice(existingInvoice)
      const breakdown = await calculateCosts(job.id)
      setCostBreakdown(breakdown)
      setState(existingInvoice.status === 'PAID' ? 'receipt' : 'invoice')
    } else {
      const breakdown = await calculateCosts(job.id)
      setCostBreakdown(breakdown)
      setState('preview')
    }
    setLoading(false)
  }

  const handleViewJobDetails = async (job: any) => {
    setSelectedJob(job)
    setLoading(true)
    
    const { data: invoice } = await supabase
      .from('invoices')
      .select('*')
      .eq('work_order_id', job.id)
      .single()
    
    setSelectedInvoice(invoice)
    setState('jobDetails')
    setLoading(false)
  }

  const handleGenerateInvoice = async () => {
    if (!selectedJob) return
    setLoading(true)
    try {
      const invoiceNumber = `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`
      const { data, error } = await supabase.from('invoices').insert([{
        work_order_id: selectedJob.id,
        customer_id: selectedJob.customer_id,
        invoice_number: invoiceNumber,
        parts_total: costBreakdown.parts,
        labor_total: costBreakdown.labor,
        tax_total: costBreakdown.tax,
        grand_total: costBreakdown.total,
        status: 'UNPAID',
        payment_method: null
      }]).select().single()

      if (error) throw error
      setSelectedInvoice(data)
      toast.success('Invoice Generated!', { description: `Invoice #${invoiceNumber} created.` })
      setState('invoice')
    } catch (e: any) {
      toast.error('Error generating invoice', { description: e.message })
    } finally {
      setLoading(false)
    }
  }

  const handlePayment = async (method: 'CASH' | 'ONLINE') => {
    if (!selectedInvoice) return
    setLoading(true)
    try {
      await supabase.from('invoices').update({ 
        status: 'PAID', 
        payment_method: method,
        paid_at: new Date().toISOString()
      }).eq('id', selectedInvoice.id)

      const updated = { ...selectedInvoice, status: 'PAID', payment_method: method }
      setSelectedInvoice(updated)
      toast.success(method === 'CASH' ? 'Cash Collected!' : 'Payment Verified!', { description: `Rs. ${selectedInvoice.grand_total} processed.` })
      setState('receipt')
    } catch (e: any) {
      toast.error('Error', { description: e.message })
    } finally {
      setLoading(false)
    }
  }

  const handleMarkCompleted = async () => {
    if (!selectedJob) return
    setLoading(true)
    try {
      await supabase.from('work_orders').update({ status: 'COMPLETED' }).eq('id', selectedJob.id)
      toast.success('Job Completed!', { description: 'Customer has been served.' })
      setState('list')
      setSelectedJob(null)
      setSelectedInvoice(null)
      fetchJobs()
    } catch (e: any) {
      toast.error('Error', { description: e.message })
    } finally {
      setLoading(false)
    }
  }

  const goBackToList = () => {
    setState('list')
    setSelectedJob(null)
    setSelectedInvoice(null)
  }

  const pendingJobs = jobs.filter(j => j.status === 'READY_FOR_BILLING')
  const completedJobs = jobs.filter(j => j.status === 'COMPLETED')

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-64 p-8">
        {/* HEADER */}
        <div className="mb-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            {state !== 'list' && (
              <Button variant="outline" onClick={goBackToList}>
                <ArrowLeft className="h-4 w-4 mr-2" /> Back
              </Button>
            )}
            <div>
              <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
                <DollarSign className="h-8 w-8 text-green-600"/> 
                {isManager ? 'Completed Jobs' : 'Billing & Invoicing'}
              </h1>
              <p className="text-slate-600 mt-1">
                {isManager && 'View completed jobs and invoice details'}
                {!isManager && state === 'list' && 'Select a job to generate invoice'}
                {!isManager && state === 'preview' && 'Review costs and generate invoice'}
                {!isManager && state === 'invoice' && 'Collect payment from customer'}
                {!isManager && state === 'receipt' && 'Payment received - Complete the job'}
                {!isManager && state === 'jobDetails' && 'Completed job details and invoice'}
              </p>
            </div>
          </div>
        </div>

        {/* MANAGER VIEW: Only Completed Jobs */}
        {isManager && state === 'list' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-700">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Completed Jobs ({completedJobs.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {completedJobs.length === 0 ? (
                <p className="text-slate-500 text-center py-4">No completed jobs yet</p>
              ) : (
                <div className="space-y-2">
                  {completedJobs.map(job => (
                    <div 
                      key={job.id} 
                      className="flex justify-between items-center p-3 bg-slate-50 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors"
                      onClick={() => handleViewJobDetails(job)}
                    >
                      <div>
                        <p className="font-medium text-slate-700">
                          {job.wo_number} - {job.vehicles?.make} {job.vehicles?.model}
                        </p>
                        <p className="text-xs text-slate-500">{job.customers?.full_name}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">COMPLETED</span>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={(e) => { 
                            e.stopPropagation()
                            handleViewJobDetails(job) 
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" /> View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ACCOUNTANT VIEW: Ready for Billing + Recently Completed */}
        {!isManager && state === 'list' && (
          <>
            <Card className="mb-6 border-l-4 border-l-yellow-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  Ready for Billing ({pendingJobs.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pendingJobs.length === 0 ? (
                  <p className="text-slate-500 text-center py-4">No jobs ready for billing</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pendingJobs.map(job => (
                      <Card 
                        key={job.id} 
                        className="border-l-4 border-l-yellow-400 hover:shadow-md cursor-pointer transition-shadow" 
                        onClick={() => handleOpenJob(job)}
                      >
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-blue-600">{job.wo_number}</h3>
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold">READY</span>
                          </div>
                          <p className="text-sm text-slate-700 font-medium">
                            {job.vehicles?.year} {job.vehicles?.make} {job.vehicles?.model}
                          </p>
                          <p className="text-xs text-slate-500">{job.vehicles?.license_plate}</p>
                          <p className="text-xs text-slate-600 mt-2">Customer: {job.customers?.full_name}</p>
                          <p className="text-xs text-slate-500">Phone: {job.customers?.phone}</p>
                          <Button 
                            className="w-full mt-3 bg-green-600 hover:bg-green-700" 
                            onClick={(e) => { e.stopPropagation(); handleOpenJob(job) }}
                          >
                            <FileText className="h-4 w-4 mr-2" /> Open for Billing
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-700">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Recently Completed ({completedJobs.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {completedJobs.length === 0 ? (
                  <p className="text-slate-500 text-center py-4">No completed jobs yet</p>
                ) : (
                  <div className="space-y-2">
                    {completedJobs.map(job => (
                      <div 
                        key={job.id} 
                        className="flex justify-between items-center p-3 bg-slate-50 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors"
                        onClick={() => handleViewJobDetails(job)}
                      >
                        <div>
                          <p className="font-medium text-slate-700">
                            {job.wo_number} - {job.vehicles?.make} {job.vehicles?.model}
                          </p>
                          <p className="text-xs text-slate-500">{job.customers?.full_name}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">COMPLETED</span>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={(e) => { 
                              e.stopPropagation()
                              handleViewJobDetails(job) 
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" /> View Details
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* INVOICE PREVIEW (Accountant Only) */}
        {!isManager && state === 'preview' && selectedJob && (
          <div className="max-w-3xl mx-auto">
            <Card className="border-2 border-blue-200">
              <CardHeader className="bg-blue-50">
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2"><FileText className="h-5 w-5" /> Invoice Preview</span>
                  <span className="text-sm font-normal text-slate-600">{selectedJob.wo_number}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
                  <div>
                    <p className="text-xs text-slate-500">Customer</p>
                    <p className="font-semibold">{selectedJob.customers?.full_name}</p>
                    <p className="text-sm text-slate-600">{selectedJob.customers?.phone}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Vehicle</p>
                    <p className="font-semibold">
                      {selectedJob.vehicles?.year} {selectedJob.vehicles?.make} {selectedJob.vehicles?.model}
                    </p>
                    <p className="text-sm text-slate-600">{selectedJob.vehicles?.license_plate}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2"><Package className="h-4 w-4 text-blue-600" /> Parts Used</h3>
                  {costBreakdown.partsDetails.length === 0 ? (
                    <p className="text-sm text-slate-500 italic">No parts used</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="text-left p-2">Part</th>
                          <th className="text-center p-2">Qty</th>
                          <th className="text-right p-2">Price</th>
                          <th className="text-right p-2">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {costBreakdown.partsDetails.map((p: any, i: number) => (
                          <tr key={i} className="border-t">
                            <td className="p-2">{p.name}<br/><span className="text-xs text-slate-500">{p.sku}</span></td>
                            <td className="p-2 text-center">{p.quantity}</td>
                            <td className="p-2 text-right">Rs. {p.unit_price}</td>
                            <td className="p-2 text-right font-semibold">Rs. {p.cost}</td>
                          </tr>
                        ))}
                        <tr className="border-t bg-blue-50 font-bold">
                          <td colSpan={3} className="p-2 text-right">Parts Subtotal:</td>
                          <td className="p-2 text-right">Rs. {costBreakdown.parts}</td>
                        </tr>
                      </tbody>
                    </table>
                  )}
                </div>

                <div>
                  <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2"><Wrench className="h-4 w-4 text-green-600" /> Labor</h3>
                  {costBreakdown.laborDetails.length === 0 ? (
                    <p className="text-sm text-slate-500 italic">No labor tracked</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="text-left p-2">Technician</th>
                          <th className="text-center p-2">Time</th>
                          <th className="text-right p-2">Rate</th>
                          <th className="text-right p-2">Cost</th>
                        </tr>
                      </thead>
                      <tbody>
                        {costBreakdown.laborDetails.map((l: any, i: number) => (
                          <tr key={i} className="border-t">
                            <td className="p-2">{l.technician}</td>
                            <td className="p-2 text-center">{l.minutes} min ({l.hours} hrs)</td>
                            <td className="p-2 text-right">Rs. {l.rate}/hr</td>
                            <td className="p-2 text-right font-semibold">Rs. {Math.round(l.cost)}</td>
                          </tr>
                        ))}
                        <tr className="border-t bg-green-50 font-bold">
                          <td colSpan={3} className="p-2 text-right">Labor Subtotal:</td>
                          <td className="p-2 text-right">Rs. {Math.round(costBreakdown.labor)}</td>
                        </tr>
                      </tbody>
                    </table>
                  )}
                </div>

                <div className="border-t-2 border-slate-300 pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Parts:</span>
                    <span>Rs. {costBreakdown.parts}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Labor:</span>
                    <span>Rs. {Math.round(costBreakdown.labor)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Tax (17%):</span>
                    <span>Rs. {Math.round(costBreakdown.tax)}</span>
                  </div>
                  <div className="flex justify-between text-2xl font-bold text-green-700 pt-2 border-t">
                    <span>Grand Total:</span>
                    <span>Rs. {Math.round(costBreakdown.total)}</span>
                  </div>
                </div>

                <Button onClick={handleGenerateInvoice} disabled={loading} className="w-full h-12 text-lg bg-green-600 hover:bg-green-700">
                  {loading ? 'Generating...' : (<><FileText className="h-5 w-5 mr-2" /> Generate Invoice</>)}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* INVOICE (UNPAID) - Accountant Only */}
        {!isManager && state === 'invoice' && selectedJob && selectedInvoice && (
          <div className="max-w-3xl mx-auto space-y-6">
            <Card className="border-2 border-green-200">
              <CardHeader className="bg-linear-to-r from-green-50 to-blue-50">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>INVOICE</CardTitle>
                    <p className="text-sm text-slate-600">Invoice #{selectedInvoice.invoice_number}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-500">Date</p>
                    <p className="font-semibold">{new Date(selectedInvoice.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-slate-50 rounded-lg">
                  <div>
                    <p className="text-xs text-slate-500">Bill To</p>
                    <p className="font-bold">{selectedJob.customers?.full_name}</p>
                    <p className="text-sm">{selectedJob.customers?.phone}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Vehicle</p>
                    <p className="font-bold">
                      {selectedJob.vehicles?.year} {selectedJob.vehicles?.make} {selectedJob.vehicles?.model}
                    </p>
                    <p className="text-sm font-mono">{selectedJob.vehicles?.license_plate}</p>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between py-2 border-b">
                    <span className="flex items-center gap-2"><Package className="h-4 w-4 text-blue-600" /> Parts Subtotal</span>
                    <span className="font-semibold">Rs. {selectedInvoice.parts_total}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="flex items-center gap-2"><Wrench className="h-4 w-4 text-green-600" /> Labor Subtotal</span>
                    <span className="font-semibold">Rs. {Math.round(selectedInvoice.labor_total)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span>Tax (17%)</span>
                    <span className="font-semibold">Rs. {Math.round(selectedInvoice.tax_total)}</span>
                  </div>
                  <div className="flex justify-between py-3 bg-green-50 rounded-lg px-3 -mx-3">
                    <span className="text-xl font-bold">Grand Total</span>
                    <span className="text-2xl font-bold text-green-700">Rs. {Math.round(selectedInvoice.grand_total)}</span>
                  </div>
                </div>

                <div className="text-center">
                  <span className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full font-bold inline-flex items-center gap-2">
                    <Clock className="h-4 w-4" /> Awaiting Payment
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5" /> Select Payment Method</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button onClick={() => handlePayment('CASH')} disabled={loading} className="h-32 flex-col bg-green-600 hover:bg-green-700 text-white">
                  <Banknote className="h-10 w-10 mb-2" />
                  <span className="text-lg font-bold">Cash Payment</span>
                  <span className="text-xs opacity-90">Collect cash from customer</span>
                </Button>
                <Button onClick={() => handlePayment('ONLINE')} disabled={loading} className="h-32 flex-col bg-blue-600 hover:bg-blue-700 text-white">
                  <CreditCard className="h-10 w-10 mb-2" />
                  <span className="text-lg font-bold">Online Payment</span>
                  <span className="text-xs opacity-90">Card / Bank Transfer</span>
                </Button>
              </CardContent>
            </Card>

            <Button variant="outline" onClick={() => window.print()} className="w-full">
              <Printer className="h-4 w-4 mr-2" /> Print Invoice
            </Button>
          </div>
        )}

        {/* RECEIPT - Accountant Only */}
        {!isManager && state === 'receipt' && selectedJob && selectedInvoice && (
          <div className="max-w-3xl mx-auto">
            <Card className="border-2 border-green-500">
              <div className="bg-green-500 text-white p-6 text-center">
                <CheckCircle className="h-16 w-16 mx-auto mb-2" />
                <h2 className="text-2xl font-bold">Payment Received!</h2>
                <p className="text-green-100">
                  {selectedInvoice.payment_method === 'CASH' ? 'Cash Collected' : 'Online Payment Verified'}
                </p>
              </div>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
                  <div>
                    <p className="text-xs text-slate-500">Invoice #</p>
                    <p className="font-bold">{selectedInvoice.invoice_number}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Paid On</p>
                    <p className="font-bold">{new Date(selectedInvoice.paid_at || selectedInvoice.created_at).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Customer</p>
                    <p className="font-bold">{selectedJob.customers?.full_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Payment Method</p>
                    <p className="font-bold flex items-center justify-end gap-1">
                      {selectedInvoice.payment_method === 'CASH' ? <Banknote className="h-4 w-4" /> : <CreditCard className="h-4 w-4" />}
                      {selectedInvoice.payment_method}
                    </p>
                  </div>
                </div>

                <div className="text-center py-4 border-y-2 border-dashed">
                  <p className="text-sm text-slate-500">Amount Received</p>
                  <p className="text-4xl font-bold text-green-700">Rs. {Math.round(selectedInvoice.grand_total)}</p>
                </div>

                <div className="flex gap-2">
                  <Button onClick={() => window.print()} variant="outline" className="flex-1">
                    <Printer className="h-4 w-4 mr-2" /> Print Receipt
                  </Button>
                  <Button onClick={handleMarkCompleted} disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700">
                    {loading ? 'Completing...' : (<><CheckCircle className="h-4 w-4 mr-2" /> Mark Job Complete</>)}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* JOB DETAILS - Both Manager and Accountant */}
        {state === 'jobDetails' && selectedJob && (
          <div className="max-w-3xl mx-auto">
            <Card className="border-2 border-green-200">
              <CardHeader className="bg-linear-to-r from-green-50 to-blue-50">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <FileText className="h-6 w-6" /> Completed Job Details
                    </CardTitle>
                    <p className="text-sm text-slate-600 mt-1">{selectedJob.wo_number}</p>
                  </div>
                  <span className="px-3 py-1 bg-green-500 text-white rounded-full text-sm font-bold">
                    COMPLETED
                  </span>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="flex justify-center">
                  <div className="px-6 py-3 bg-green-100 border-2 border-green-500 rounded-lg text-center">
                    <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-1" />
                    <p className="text-green-800 font-bold text-lg">JOB COMPLETED</p>
                    <p className="text-green-600 text-sm">
                      {new Date(selectedJob.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
                  <div>
                    <h4 className="font-bold text-slate-700 mb-2 flex items-center gap-2">
                      <User className="h-4 w-4 text-blue-600" /> Customer Information
                    </h4>
                    <p className="font-semibold">{selectedJob.customers?.full_name}</p>
                    <p className="text-sm text-slate-600">{selectedJob.customers?.phone}</p>
                    {selectedJob.customers?.email && (
                      <p className="text-sm text-slate-600">{selectedJob.customers.email}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <h4 className="font-bold text-slate-700 mb-2 flex items-center gap-2 justify-end">
                      <Car className="h-4 w-4 text-blue-600" /> Vehicle Information
                    </h4>
                    <p className="font-semibold">
                      {selectedJob.vehicles?.year} {selectedJob.vehicles?.make} {selectedJob.vehicles?.model}
                    </p>
                    <p className="text-sm text-slate-600 font-mono">{selectedJob.vehicles?.license_plate}</p>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="font-bold text-slate-700 mb-2">Original Complaint</h4>
                  <p className="text-slate-700 italic">"{selectedJob.complaint}"</p>
                </div>

                {selectedInvoice ? (
                  <div className="border-2 border-green-200 rounded-lg p-4 bg-green-50">
                    <h4 className="font-bold text-green-800 mb-3 flex items-center gap-2">
                      <DollarSign className="h-5 w-5" /> Invoice Details
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between py-1">
                        <span className="text-slate-600">Invoice Number:</span>
                        <span className="font-bold">{selectedInvoice.invoice_number}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-600">Parts Total:</span>
                        <span className="font-semibold">Rs. {selectedInvoice.parts_total}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-600">Labor Total:</span>
                        <span className="font-semibold">Rs. {Math.round(selectedInvoice.labor_total)}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-600">Tax (17%):</span>
                        <span className="font-semibold">Rs. {Math.round(selectedInvoice.tax_total)}</span>
                      </div>
                      <div className="flex justify-between py-2 border-t mt-2">
                        <span className="font-bold text-base">Grand Total:</span>
                        <span className="font-bold text-green-700 text-lg">Rs. {Math.round(selectedInvoice.grand_total)}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-600">Payment Method:</span>
                        <span className="font-semibold flex items-center gap-1">
                          {selectedInvoice.payment_method === 'CASH' ? (
                            <><Banknote className="h-4 w-4" /> Cash</>
                          ) : (
                            <><CreditCard className="h-4 w-4" /> Online</>
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-600">Paid On:</span>
                        <span className="font-semibold">
                          {new Date(selectedInvoice.paid_at || selectedInvoice.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <Button onClick={() => window.print()} variant="outline" className="w-full mt-4">
                      <Printer className="h-4 w-4 mr-2" /> Print Invoice
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-yellow-200 rounded-lg p-4 bg-yellow-50">
                    <p className="text-yellow-800 text-center">No invoice found for this job</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}