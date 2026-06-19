'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Sidebar from '@/components/layout/Sidebar'
import { useAuth } from '@/lib/useAuth'
import { toast } from 'sonner'
import { CreditCard, Banknote, QrCode } from 'lucide-react'

interface PartUsed {
  id: string
  quantity: number
  parts: { name: string; unit_price: number }
}

interface LaborSession {
  id: string
  duration_minutes: number
}

export default function InvoicePage() {
  const { user, loading: authLoading } = useAuth()
  const params = useParams()
  const router = useRouter()
  const woId = Array.isArray(params.id) ? params.id[0] : params.id

  const [wo, setWo] = useState<any>(null)
  const [partsUsed, setPartsUsed] = useState<PartUsed[]>([])
  const [laborSessions, setLaborSessions] = useState<LaborSession[]>([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [invoiceData, setInvoiceData] = useState<any>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('CASH')
  const [transactionId, setTransactionId] = useState('')

  useEffect(() => {
    if (user && woId) fetchData()
  }, [user, woId])

  const fetchData = async () => {
    setLoading(true)
    try {
      // 1. Fetch Work Order
      const { data: woData } = await supabase.from('work_orders').select(`
        *, customers (full_name, phone, cnic), vehicles (license_plate, make, model, year)
      `).eq('id', woId).single()
      setWo(woData)

      // 2. Fetch Approved Parts
      const { data: partsData } = await supabase.from('part_requests').select(`
        id, quantity, parts (name, unit_price)
      `).eq('work_order_id', woId).eq('status', 'APPROVED')
        setPartsUsed((partsData as any) || [])
      // 3. Fetch Labor Sessions
      const { data: laborData } = await supabase.from('labor_tracking').select('id, duration_minutes').eq('work_order_id', woId).eq('status', 'COMPLETED')
      setLaborSessions(laborData || [])

      // 4. Check if invoice already exists
      const { data: existingInvoice } = await supabase.from('invoices').select('*').eq('work_order_id', woId).single()
      if (existingInvoice) setInvoiceData(existingInvoice)

    } catch (error: any) {
      toast.error('Failed to load data', { description: error.message })
    } finally {
      setLoading(false)
    }
  }

  const calculateTotals = () => {
    const partsTotal = partsUsed.reduce((sum, item) => sum + (item.quantity * item.parts.unit_price), 0)
    const totalMinutes = laborSessions.reduce((sum, item) => sum + (item.duration_minutes || 0), 0)
    const totalHours = totalMinutes / 60
    const hourlyRate = 1500 // Standard labor rate in PKR
    const laborTotal = totalHours * hourlyRate
    const taxTotal = (partsTotal + laborTotal) * 0.17 // 17% GST
    const grandTotal = partsTotal + laborTotal + taxTotal

    return { partsTotal, laborTotal, taxTotal, grandTotal, totalHours }
  }

  const handleGenerateInvoice = async () => {
    setGenerating(true)
    try {
      const { partsTotal, laborTotal, taxTotal, grandTotal } = calculateTotals()
      
      // Generate unique invoice number
      const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`

      const { data, error } = await supabase.from('invoices').insert([{
        work_order_id: woId,
        invoice_number: invoiceNumber,
        parts_total: partsTotal,
        labor_total: laborTotal,
        tax_total: taxTotal,
        grand_total: grandTotal,
        status: 'UNPAID'
      }]).select().single()

      if (error) throw error

      // Update WO status to READY_FOR_BILLING (or COMPLETED if paid immediately)
      await supabase.from('work_orders').update({ status: 'READY_FOR_BILLING' }).eq('id', woId)

      setInvoiceData(data)
      setShowPaymentModal(true)
      toast.success('Invoice Generated!', { description: `Invoice ${invoiceNumber} created.` })
    } catch (error: any) {
      toast.error('Failed to generate invoice', { description: error.message })
    } finally {
      setGenerating(false)
    }
  }

  const handlePayment = async () => {
    if (!invoiceData) return
    setGenerating(true)
    try {
      const { error: paymentError } = await supabase.from('payments').insert([{
        invoice_id: invoiceData.id,
        amount: invoiceData.grand_total,
        payment_method: paymentMethod,
        transaction_id: paymentMethod === 'CASH' ? 'CASH-REG' : transactionId
      }])
      if (paymentError) throw paymentError

      const { error: invoiceError } = await supabase.from('invoices').update({ status: 'PAID' }).eq('id', invoiceData.id)
      if (invoiceError) throw invoiceError

      // Finalize Work Order
      await supabase.from('work_orders').update({ status: 'COMPLETED' }).eq('id', woId)

      toast.success('Payment Successful!', { description: `Received Rs. ${invoiceData.grand_total} via ${paymentMethod}.` })
      router.push('/billing')
    } catch (error: any) {
      toast.error('Payment Failed', { description: error.message })
    } finally {
      setGenerating(false)
    }
  }

  if (authLoading || loading) return <div className="flex min-h-screen items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-blue-600"></div></div>
  if (!user) return null
  if (!wo) return <div className="p-8 text-center">Job not found.</div>

  const { partsTotal, laborTotal, taxTotal, grandTotal, totalHours } = calculateTotals()

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-64 p-8">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Invoice Generation</h1>
            <p className="text-slate-600 mt-1">{wo.wo_number} - {wo.vehicles.license_plate}</p>
          </div>
          {invoiceData && <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full font-bold">INVOICE CREATED</span>}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Invoice Preview */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader><CardTitle>Bill Summary</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-b pb-4">
                    <h3 className="font-bold text-lg mb-2">Customer Details</h3>
                    <p><span className="font-semibold">Name:</span> {wo.customers.full_name}</p>
                    <p><span className="font-semibold">Phone:</span> {wo.customers.phone}</p>
                    <p><span className="font-semibold">CNIC:</span> {wo.customers.cnic || 'N/A'}</p>
                  </div>

                  <div className="border-b pb-4">
                    <h3 className="font-bold text-lg mb-2">Parts Used ({partsUsed.length})</h3>
                    {partsUsed.length === 0 ? <p className="text-slate-500">No parts used.</p> : (
                      <table className="w-full text-sm">
                        <thead><tr className="border-b"><th className="text-left py-1">Part</th><th className="text-right py-1">Qty</th><th className="text-right py-1">Price</th><th className="text-right py-1">Total</th></tr></thead>
                        <tbody>
                          {partsUsed.map((item) => (
                            <tr key={item.id} className="border-b">
                              <td className="py-2">{item.parts.name}</td>
                              <td className="text-right py-2">{item.quantity}</td>
                              <td className="text-right py-2">Rs. {item.parts.unit_price}</td>
                              <td className="text-right py-2 font-semibold">Rs. {(item.quantity * item.parts.unit_price).toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                    <p className="text-right font-bold mt-2">Parts Subtotal: Rs. {partsTotal.toFixed(2)}</p>
                  </div>

                  <div className="border-b pb-4">
                    <h3 className="font-bold text-lg mb-2">Labor Charges</h3>
                    <p className="text-sm text-slate-600">Total Time: {totalHours.toFixed(2)} Hours @ Rs. 1500/hr</p>
                    <p className="text-right font-bold mt-2">Labor Subtotal: Rs. {laborTotal.toFixed(2)}</p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between"><span>Subtotal:</span><span>Rs. {(partsTotal + laborTotal).toFixed(2)}</span></div>
                    <div className="flex justify-between text-slate-600"><span>Tax (17% GST):</span><span>Rs. {taxTotal.toFixed(2)}</span></div>
                    <div className="flex justify-between text-xl font-bold text-slate-900 pt-2 border-t"><span>Grand Total:</span><span>Rs. {grandTotal.toFixed(2)}</span></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actions & Payment */}
          <div className="space-y-6">
            {!invoiceData ? (
              <Card>
                <CardHeader><CardTitle>Generate Invoice</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 mb-4">Review the totals and generate the final invoice for the customer.</p>
                  <Button onClick={handleGenerateInvoice} disabled={generating} className="w-full h-12 text-lg">
                    {generating ? 'Generating...' : 'Generate Invoice'}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader><CardTitle>Collect Payment</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm text-green-700">Amount Due</p>
                    <p className="text-3xl font-bold text-green-900">Rs. {grandTotal.toFixed(2)}</p>
                  </div>

                  <div>
                    <label className="text-sm font-semibold">Payment Method</label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <button 
                        onClick={() => setPaymentMethod('CASH')}
                        className={`p-3 border rounded-lg flex flex-col items-center gap-1 ${paymentMethod === 'CASH' ? 'bg-blue-100 border-blue-500 text-blue-700' : 'bg-white'}`}
                      >
                        <Banknote className="h-5 w-5" /> <span className="text-xs font-bold">Cash</span>
                      </button>
                      <button 
                        onClick={() => setPaymentMethod('EASYPAISA')}
                        className={`p-3 border rounded-lg flex flex-col items-center gap-1 ${paymentMethod === 'EASYPAISA' ? 'bg-green-100 border-green-500 text-green-700' : 'bg-white'}`}
                      >
                        <QrCode className="h-5 w-5" /> <span className="text-xs font-bold">EasyPaisa</span>
                      </button>
                    </div>
                  </div>

                  {paymentMethod !== 'CASH' && (
                    <div>
                      <label className="text-sm font-semibold">Transaction ID / Ref Number</label>
                      <input 
                        type="text" 
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        placeholder="e.g., 83749201"
                        className="w-full p-2 border rounded mt-1"
                      />
                    </div>
                  )}

                  {paymentMethod === 'EASYPAISA' && (
                    <div className="text-center p-4 bg-white border rounded-lg">
                      {/* Placeholder for QR Code */}
                      <div className="w-32 h-32 bg-slate-900 mx-auto flex items-center justify-center rounded">
                        <QrCode className="h-24 w-24 text-white" />
                      </div>
                      <p className="text-xs text-slate-500 mt-2">Scan with EasyPaisa App</p>
                      <p className="font-bold text-green-600">0300-1234567 (Garage Account)</p>
                    </div>
                  )}

                  <Button onClick={handlePayment} disabled={generating} className="w-full h-12 text-lg bg-green-600 hover:bg-green-700">
                    {generating ? 'Processing...' : 'Confirm Payment & Complete Job'}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}