'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Wrench, Mail, Lock, Phone, User, ArrowRight, Car } from 'lucide-react'
import Link from 'next/link'

export default function CustomerLoginPage() {
  const [isSignup, setIsSignup] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' })
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isSignup) {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
        })
        if (authError) throw authError

        if (authData.user) {
          await supabase.from('users').insert([{
            id: authData.user.id,
            full_name: form.name,
            phone: form.phone,
            role: 'customer'
          }])

          await supabase.from('customers').insert([{
            id: authData.user.id,
            full_name: form.name,
            phone: form.phone,
            email: form.email
          }])
        }

        toast.success('Account Created!', { description: 'Welcome to GMS Pro!' })
        router.push('/customer/dashboard')
      } else {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        })
        if (authError) throw authError

        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', authData.user?.id)
          .single()

        if (profile?.role === 'customer') {
          toast.success('Welcome Back!')
          router.push('/customer/dashboard')
        } else {
          toast.error('Wrong Portal', { description: 'Please use the Staff Login.' })
          await supabase.auth.signOut()
        }
      }
    } catch (error: any) {
      toast.error(isSignup ? 'Signup Failed' : 'Login Failed', { description: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-linear-to-br from-blue-600 via-blue-700 to-slate-900 relative overflow-hidden">
        <div className="relative z-10 flex flex-col justify-center px-16">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-lg mb-6">
            <Wrench className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">GMS Pro</h1>
          <p className="text-2xl text-blue-100 font-light mb-8">Customer Portal</p>
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-blue-100">
              <Car className="h-5 w-5" />
              <span>Book appointments online</span>
            </div>
            <div className="flex items-center gap-3 text-blue-100">
              <ArrowRight className="h-5 w-5" />
              <span>Track your vehicle in real-time</span>
            </div>
            <div className="flex items-center gap-3 text-blue-100">
              <Mail className="h-5 w-5" />
              <span>View invoices and give feedback</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 mb-4">
              <Wrench className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">GMS Pro</h1>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">
              {isSignup ? 'Create Account' : 'Customer Login'}
            </h2>
            <p className="text-slate-600 mb-6">
              {isSignup ? 'Sign up to book and track your vehicle' : 'Sign in to manage your bookings'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignup && (
                <>
                  <div>
                    <Label>Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input className="pl-10 h-11" placeholder="Muhammad Ahmed" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} required />
                    </div>
                  </div>
                  <div>
                    <Label>Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input className="pl-10 h-11" placeholder="0300-1234567" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} required />
                    </div>
                  </div>
                </>
              )}
              <div>
                <Label>Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input className="pl-10 h-11" type="email" placeholder="you@email.com" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} required />
                </div>
              </div>
              <div>
                <Label>Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input className="pl-10 h-11" type="password" placeholder="••••••••" value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} required />
                </div>
              </div>

              <Button type="submit" disabled={loading} className="w-full h-12 text-base bg-blue-600 hover:bg-blue-700">
                {loading ? 'Please wait...' : (isSignup ? 'Create Account' : 'Sign In')}
              </Button>
            </form>

            <button 
              onClick={() => setIsSignup(!isSignup)}
              className="mt-4 text-sm text-blue-600 hover:underline w-full text-center"
            >
              {isSignup ? 'Already have an account? Sign In' : 'New customer? Create Account'}
            </button>

            <div className="mt-4 text-center">
              <Link href="/" className="text-sm text-slate-500 hover:text-blue-600">← Back to Home</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}