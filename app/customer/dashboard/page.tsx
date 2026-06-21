'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { 
  Car, Clock, CheckCircle, FileText, Star, LogOut, 
  Phone, MessageSquare, AlertCircle, TrendingUp
} from 'lucide-react'

const STATUS_COLORS: any = {
  'PENDING_MANAGER_APPROVAL': 'bg-yellow-100 text-yellow-800',
  'AWAITING_INSPECTION': 'bg-blue-100 text-blue-800',
  'INSPECTION_IN_PROGRESS': 'bg-blue-100 text-blue-800',
  'INSPECTION_COMPLETE': 'bg-green-100 text-green-800',
  'IN_PROGRESS': 'bg-blue-100 text-blue-800',
  'PARTS_READY': 'bg-green-100 text-green-800',
  'REPAIRS_COMPLETED': 'bg-green-100 text-green-800',
  'QA_APPROVED': 'bg-purple-100 text-purple-800',
  'READY_FOR_BILLING': 'bg-green-100 text-green-800',
  'COMPLETED': 'bg-green-100 text-green-800'
}

export default function CustomerDashboard() {
  const router = useRouter()
  const [customerId, setCustomerId] = useState<string>('')
  const [customerName, setCustomerName] = useState('')
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active')
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [feedback, setFeedback] = useState({ rating: 5, comment: '' })

  useEffect(() => {
    // Get customer info from localStorage
    const id = localStorage.getItem('customer_id')
    const name = localStorage.getItem('customer_name')
    
    if (!id) {
      router.push('/customer/login')
      return
    }

    setCustomerId(id)
    setCustomerName(name || 'Customer')
    fetchOrders(id)
  }, [router])

  const fetchOrders = async (id: string) => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('work_orders')
        .select(`
          id, wo_number, complaint, status, created_at,
          vehicles (make, model, year, license_plate),
          invoices (grand_total, status, parts_total, labor_total, tax_total)
        `)
        .eq('customer_id', id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setOrders(data || [])
    } catch (error: any) {
      toast.error('Failed to load orders', { description: error.message })
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('customer_id')
    localStorage.removeItem('customer_name')
    localStorage.removeItem('customer_phone')
    router.push('/customer/login')
  }

  const submitFeedback = async () => {
    if (!selectedOrder) return

    try {
      const { error } = await supabase.from('feedback').insert([{
        work_order_id: selectedOrder.id,
        customer_id: customerId,
        rating: feedback.rating,
        comment: feedback.comment,
        created_at: new Date().toISOString()
      }])

      if (error) throw error

      toast.success('Thank you!', { description: 'Your feedback has been submitted.' })
      setShowFeedbackModal(false)
      setFeedback({ rating: 5, comment: '' })
    } catch (error: any) {
      toast.error('Failed to submit feedback', { description: error.message })
    }
  }

  const activeOrders = orders.filter(o => o.status !== 'COMPLETED')
  const historyOrders = orders.filter(o => o.status === 'COMPLETED')

  const getStatusLabel = (status: string) => {
    return status.replace(/_/g, ' ')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <nav className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <Car className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-slate-900">GMS Pro</h1>
              <p className="text-xs text-slate-500">Customer Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-800">{customerName}</p>
              <p className="text-xs text-slate-500">Customer</p>
            </div>
            <button 
              onClick={handleLogout} 
              className="text-slate-500 hover:text-red-600 flex items-center gap-1 text-sm"
            >
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Welcome Card */}
        <div className="bg-linear-to-r from-blue-600 to-blue-700 text-white p-6 rounded-2xl">
          <h2 className="text-2xl font-bold mb-2">Welcome, {customerName}!</h2>
          <p className="text-blue-100">Track your vehicle service status and view history</p>
        </div>

        {/* Coming Soon - Appointments */}
        <Card className="border-2 border-dashed border-slate-300 bg-slate-50">
          <CardContent className="p-6 text-center">
            <Clock className="h-12 w-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-700 mb-1">Book Appointment</h3>
            <p className="text-slate-500 text-sm mb-3">Schedule your next service visit</p>
            <Button disabled className="bg-slate-400">
              Coming Soon
            </Button>
          </CardContent>
        </Card>

        {/* Tabs */}
        <div className="flex gap-2">
          <Button
            onClick={() => setActiveTab('active')}
            variant={activeTab === 'active' ? 'default' : 'outline'}
            className="flex-1"
          >
            <Clock className="h-4 w-4 mr-2" />
            Active Orders ({activeOrders.length})
          </Button>
          <Button
            onClick={() => setActiveTab('history')}
            variant={activeTab === 'history' ? 'default' : 'outline'}
            className="flex-1"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            History ({historyOrders.length})
          </Button>
        </div>

        {/* Active Orders */}
        {activeTab === 'active' && (
          <div className="space-y-4">
            {activeOrders.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Car className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">No active orders</p>
                  <p className="text-sm text-slate-400 mt-1">Your vehicle services will appear here</p>
                </CardContent>
              </Card>
            ) : (
              activeOrders.map((order) => (
                <Card key={order.id} className="border-l-4 border-l-blue-500">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg text-blue-600">{order.wo_number}</CardTitle>
                        <p className="text-sm text-slate-600">
                          {order.vehicles?.year} {order.vehicles?.make} {order.vehicles?.model}
                        </p>
                        <p className="text-xs text-slate-500">{order.vehicles?.license_plate}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[order.status] || 'bg-slate-100'}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-700 mb-3">"{order.complaint}"</p>
                    <p className="text-xs text-slate-500 mb-3">
                      Created: {new Date(order.created_at).toLocaleDateString()}
                    </p>
                    
                    {/* Feedback Button */}
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedOrder(order)
                        setShowFeedbackModal(true)
                      }}
                      className="w-full"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Give Feedback
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Order History */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            {historyOrders.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">No completed orders yet</p>
                </CardContent>
              </Card>
            ) : (
              historyOrders.map((order) => (
                <Card key={order.id} className="border-l-4 border-l-green-500">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg text-green-600">{order.wo_number}</CardTitle>
                        <p className="text-sm text-slate-600">
                          {order.vehicles?.make} {order.vehicles?.model}
                        </p>
                        <p className="text-xs text-slate-500">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">
                        COMPLETED
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {order.invoices && (
                      <div className="bg-slate-50 p-3 rounded-lg mb-3 space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Parts:</span>
                          <span>Rs. {order.invoices.parts_total}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Labor:</span>
                          <span>Rs. {order.invoices.labor_total}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Tax:</span>
                          <span>Rs. {order.invoices.tax_total}</span>
                        </div>
                        <div className="flex justify-between font-bold text-green-700 border-t pt-1">
                          <span>Total:</span>
                          <span>Rs. {order.invoices.grand_total}</span>
                        </div>
                        <div className="text-center pt-1">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            order.invoices.status === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {order.invoices.status}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedOrder(order)
                        setShowFeedbackModal(true)
                      }}
                      className="w-full"
                    >
                      <Star className="h-4 w-4 mr-2" />
                      Rate Your Experience
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>

      {/* Feedback Modal */}
      {showFeedbackModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                Give Feedback
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-600">
                Order: {selectedOrder.wo_number} - {selectedOrder.vehicles?.make} {selectedOrder.vehicles?.model}
              </p>
              
              <div>
                <Label>Rating</Label>
                <div className="flex gap-2 mt-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setFeedback({ ...feedback, rating: star })}
                      className="text-2xl"
                    >
                      <Star 
                        className={`h-8 w-8 ${
                          star <= feedback.rating 
                            ? 'text-yellow-400 fill-yellow-400' 
                            : 'text-slate-300'
                        }`} 
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label>Your Feedback</Label>
                <textarea
                  value={feedback.comment}
                  onChange={(e) => setFeedback({ ...feedback, comment: e.target.value })}
                  placeholder="Share your experience..."
                  className="w-full p-2 border rounded-lg mt-1"
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={submitFeedback} 
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600"
                >
                  Submit Feedback
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowFeedbackModal(false)}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}