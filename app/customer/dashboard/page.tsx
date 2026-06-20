'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/lib/useAuth'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { 
  Wrench, Car, Calendar, Clock, CheckCircle, AlertCircle, 
  Plus, LogOut, Star, Package, ChevronRight, Phone, User
} from 'lucide-react'
import Link from 'next/link'

const SERVICE_TYPES = ['General Service','Oil Change','Brake Repair','Engine Repair','AC Service','Tire Service','Electrical Issue','Suspension','Transmission','Other']

const STATUS_STEPS = [
  'PENDING_MANAGER_APPROVAL','AWAITING_INSPECTION','INSPECTION_IN_PROGRESS',
  'INSPECTION_COMPLETE','IN_PROGRESS','PARTS_READY','REPAIRS_COMPLETED',
  'QA_APPROVED','READY_FOR_BILLING','COMPLETED'
]

export default function CustomerDashboard() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [tab, setTab] = useState<'book' | 'active' | 'history'>('book')
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [customerProfile, setCustomerProfile] = useState<any>(null)
  const [booking, setBooking] = useState({
    vehicle_make: '', vehicle_model: '', vehicle_year: '', license_plate: '',
    service_type: 'General Service', preferred_date: '', preferred_time: '', description: ''
  })

  // Safe access to user metadata
  const userMeta = (user as any)?.user_metadata || {}

  useEffect(() => {
    if (user) {
      fetchCustomerProfile()
      fetchOrders()
    }
  }, [user])

  const fetchCustomerProfile = async () => {
    try {
      const { data } = await supabase
        .from('customers')
        .select('full_name, phone, email')
        .eq('id', user?.id)
        .single()
      setCustomerProfile(data)
    } catch (error) {
      console.error('Error fetching customer profile:', error)
    }
  }

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('work_orders')
        .select(`
          id, wo_number, complaint, status, created_at,
          vehicles (license_plate, make, model, year),
          invoices (grand_total, status)
        `)
        .eq('customer_id', user?.id)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setOrders((data as any) || [])
    } catch (error: any) {
      toast.error('Failed to load orders', { description: error.message })
    } finally {
      setLoading(false)
    }
  }

  const ensureCustomerExists = async () => {
    try {
      const { data: existing } = await supabase
        .from('customers')
        .select('id')
        .eq('id', user?.id)
        .single()

      if (!existing) {
        const { error } = await supabase
          .from('customers')
          .insert([{
            id: user?.id,
            full_name: userMeta?.full_name || user?.email || 'Customer',
            phone: userMeta?.phone || 'N/A',
            email: user?.email || ''
          }])

        if (error) {
          console.error('Customer creation error:', error)
        } else {
          await fetchCustomerProfile()
        }
      }
    } catch (error) {
      console.error('Error ensuring customer exists:', error)
    }
  }

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!booking.vehicle_make || !booking.vehicle_model || !booking.preferred_date || !booking.preferred_time) {
      toast.error('Missing Info', { description: 'Please fill all required fields.' })
      return
    }

    if (!user?.id) {
      toast.error('Not logged in', { description: 'Please login again.' })
      return
    }

    setLoading(true)
    try {
      await ensureCustomerExists()

      const { data: vehicle, error: vehicleError } = await supabase
        .from('vehicles')
        .insert([{
          customer_id: user.id,
          license_plate: booking.license_plate || 'N/A',
          make: booking.vehicle_make,
          model: booking.vehicle_model,
          year: booking.vehicle_year ? parseInt(booking.vehicle_year) : null
        }])
        .select('id')
        .single()

      if (vehicleError) throw vehicleError
      if (!vehicle?.id) throw new Error('Failed to create vehicle')

      const woNumber = `WO-${Date.now().toString().slice(-6)}`
      const { error: woError } = await supabase
        .from('work_orders')
        .insert([{
          wo_number: woNumber,
          customer_id: user.id,
          vehicle_id: vehicle.id,
          complaint: booking.description || booking.service_type,
          status: 'PENDING_MANAGER_APPROVAL'
        }])

      if (woError) throw woError

      const { error: aptError } = await supabase
        .from('appointments')
        .insert([{
          customer_name: customerProfile?.full_name || userMeta?.full_name || 'Customer',
          customer_phone: customerProfile?.phone || userMeta?.phone || 'N/A',
          customer_email: customerProfile?.email || user?.email || '',
          vehicle_make: booking.vehicle_make,
          vehicle_model: booking.vehicle_model,
          vehicle_year: booking.vehicle_year ? parseInt(booking.vehicle_year) : new Date().getFullYear(),
          license_plate: booking.license_plate || 'N/A',
          service_type: booking.service_type,
          preferred_date: booking.preferred_date,
          preferred_time: booking.preferred_time,
          description: booking.description,
          status: 'PENDING',
          wo_number: woNumber
        }])

      if (aptError) throw aptError

      toast.success('Booking Confirmed!', { description: `Work Order ${woNumber} created.` })
      setBooking({
        vehicle_make:'',
        vehicle_model:'',
        vehicle_year:'',
        license_plate:'',
        service_type:'General Service',
        preferred_date:'',
        preferred_time:'',
        description:''
      })
      setTab('active')
      fetchOrders()
    } catch (error: any) {
      console.error('Booking error:', error)
      toast.error('Booking Failed', { description: error.message })
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await signOut()
    router.push('/customer/login')
  }

  const activeOrders = orders.filter(o => !['COMPLETED','CANCELLED'].includes(o.status))
  const historyOrders = orders.filter(o => ['COMPLETED'].includes(o.status))

  const getStatusColor = (status: string) => {
    if (status === 'COMPLETED') return 'bg-green-100 text-green-800'
    if (status === 'IN_PROGRESS' || status === 'REPAIRS_COMPLETED') return 'bg-blue-100 text-blue-800'
    if (status.includes('QA')) return 'bg-purple-100 text-purple-800'
    return 'bg-yellow-100 text-yellow-800'
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <nav className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg"><Wrench className="h-5 w-5 text-white" /></div>
            <span className="font-bold text-lg text-slate-900">GMS Pro</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-800">{customerProfile?.full_name || userMeta?.full_name || 'Customer'}</p>
              <p className="text-xs text-slate-500">{customerProfile?.phone || userMeta?.phone || 'No phone'}</p>
            </div>
            <button onClick={handleLogout} className="text-slate-500 hover:text-red-600 flex items-center gap-1 text-sm">
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          <button onClick={() => setTab('book')} className={`px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap ${tab === 'book' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border'}`}>
            <Plus className="h-4 w-4 inline mr-1" /> Book New Service
          </button>
          <button onClick={() => setTab('active')} className={`px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap ${tab === 'active' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border'}`}>
            <Clock className="h-4 w-4 inline mr-1" /> Active Orders ({activeOrders.length})
          </button>
          <button onClick={() => setTab('history')} className={`px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap ${tab === 'history' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border'}`}>
            <CheckCircle className="h-4 w-4 inline mr-1" /> Order History ({historyOrders.length})
          </button>
        </div>

        {/* TAB 1: BOOK NEW SERVICE */}
        {tab === 'book' && (
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Book a New Service</h2>
            <form onSubmit={handleBook} className="space-y-6">
              <div>
                <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2"><Car className="h-4 w-4 text-blue-600" /> Vehicle Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><Label>Make *</Label><Input value={booking.vehicle_make} onChange={(e) => setBooking({...booking, vehicle_make: e.target.value})} placeholder="Honda" required /></div>
                  <div><Label>Model *</Label><Input value={booking.vehicle_model} onChange={(e) => setBooking({...booking, vehicle_model: e.target.value})} placeholder="Civic" required /></div>
                  <div><Label>Year</Label><Input type="number" value={booking.vehicle_year} onChange={(e) => setBooking({...booking, vehicle_year: e.target.value})} placeholder="2021" /></div>
                  <div><Label>License Plate</Label><Input value={booking.license_plate} onChange={(e) => setBooking({...booking, license_plate: e.target.value})} placeholder="ABC-1234" /></div>
                </div>
              </div>
              <div>
                <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2"><Wrench className="h-4 w-4 text-blue-600" /> Service Details</h3>
                <div className="space-y-4">
                  <div>
                    <Label>Service Type *</Label>
                    <select value={booking.service_type} onChange={(e) => setBooking({...booking, service_type: e.target.value})} className="w-full p-2 border rounded-lg">
                      {SERVICE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><Label>Preferred Date *</Label><Input type="date" value={booking.preferred_date} onChange={(e) => setBooking({...booking, preferred_date: e.target.value})} min={new Date().toISOString().split('T')[0]} required /></div>
                    <div><Label>Preferred Time *</Label><Input type="time" value={booking.preferred_time} onChange={(e) => setBooking({...booking, preferred_time: e.target.value})} required /></div>
                  </div>
                  <div><Label>Describe the Issue</Label><textarea value={booking.description} onChange={(e) => setBooking({...booking, description: e.target.value})} rows={3} className="w-full p-3 border rounded-lg" placeholder="e.g., Strange noise from engine..." /></div>
                </div>
              </div>
              <Button type="submit" disabled={loading} className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700">
                {loading ? 'Booking...' : 'Confirm Booking'}
              </Button>
            </form>
          </div>
        )}

        {/* TAB 2: ACTIVE ORDERS */}
        {tab === 'active' && (
          <div className="space-y-4">
            {activeOrders.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border p-12 text-center">
                <Car className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No active orders</p>
                <Button onClick={() => setTab('book')} className="mt-4">Book a Service</Button>
              </div>
            ) : activeOrders.map((wo) => (
              <div key={wo.id} className="bg-white rounded-xl shadow-sm border p-5">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-bold text-lg text-blue-600">{wo.wo_number}</p>
                    <p className="text-slate-700">{wo.vehicles?.make} {wo.vehicles?.model} ({wo.vehicles?.license_plate})</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(wo.status)}`}>
                    {wo.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="text-sm text-slate-600 mb-3">{wo.complaint}</p>
                <div className="w-full bg-slate-200 rounded-full h-2 mb-3">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${Math.min((STATUS_STEPS.indexOf(wo.status) + 1) / STATUS_STEPS.length * 100, 100)}%` }} />
                </div>
                <Link href={`/customer/orders/${wo.id}`}>
                  <Button variant="outline" className="w-full">
                    Track Order <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: ORDER HISTORY */}
        {tab === 'history' && (
          <div className="space-y-4">
            {historyOrders.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border p-12 text-center">
                <Package className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No completed orders yet</p>
              </div>
            ) : historyOrders.map((wo) => (
              <div key={wo.id} className="bg-white rounded-xl shadow-sm border p-5">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-bold text-blue-600">{wo.wo_number}</p>
                    <p className="text-slate-700">{wo.vehicles?.make} {wo.vehicles?.model}</p>
                    <p className="text-xs text-slate-500">{new Date(wo.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">COMPLETED</span>
                    {wo.invoices && <p className="text-sm font-bold text-green-700 mt-1">Rs. {wo.invoices.grand_total}</p>}
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <Link href={`/customer/orders/${wo.id}`} className="flex-1">
                    <Button variant="outline" className="w-full text-sm">View Details</Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}