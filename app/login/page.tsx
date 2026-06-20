'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { 
  Wrench, 
  Mail, 
  Lock, 
  ArrowRight, 
  Car,
  Shield,
  CheckCircle
} from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{email?: string, password?: string}>({})
  const router = useRouter()

  const validateForm = () => {
    let isValid = true
    const newErrors: {email?: string, password?: string} = {}

    if (!email) {
      newErrors.email = 'Email is required'
      isValid = false
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email'
      isValid = false
    }

    if (!password) {
      newErrors.password = 'Password is required'
      isValid = false
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error('Validation Error', { description: 'Please fix the errors in the form.' })
      return
    }

    setLoading(true)
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', authData.user?.id)
        .single()

      const role = profile?.role || 'customer'
      let redirectPath = '/dashboard'
      
      if (role === 'manager' || role === 'super_admin') redirectPath = '/dashboard'
      else if (role === 'technician') redirectPath = '/technician'
      else if (role === 'qa_tech') redirectPath = '/qa'
      else if (role === 'inventory_clerk') redirectPath = '/inventory'
      else if (role === 'accountant') redirectPath = '/billing'
      else if (role === 'receptionist') redirectPath = '/work-orders'

      toast.success('Welcome Back!', { description: `Redirecting to ${role.replace('_', ' ')} portal...` })
      router.push(redirectPath)
      
    } catch (error: any) {
      toast.error('Login Failed', { description: error.message || 'Invalid email or password.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-linear-to-br from-blue-600 via-blue-700 to-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80')] bg-cover bg-center opacity-10"></div>
        
        <div className="relative z-10 flex flex-col justify-center px-16">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-lg mb-6">
              <Wrench className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-5xl font-bold text-white mb-4">GMS Pro</h1>
            <p className="text-2xl text-blue-100 font-light">Garage Management System</p>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="shrink-0 w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                <Car className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg">Professional Auto Care</h3>
                <p className="text-blue-100 text-sm mt-1">Streamline your garage operations with our comprehensive system</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="shrink-0 w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg">Secure & Reliable</h3>
                <p className="text-blue-100 text-sm mt-1">Enterprise-grade security for your business data</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="shrink-0 w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg">Real-Time Tracking</h3>
                <p className="text-blue-100 text-sm mt-1">Monitor vehicle status, inventory, and staff performance</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 mb-4">
              <Wrench className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">GMS Pro</h1>
          </div>

          <Card className="border-0 shadow-2xl bg-white">
            <CardHeader className="space-y-1 pb-6">
              <h2 className="text-3xl font-bold text-slate-900">Welcome Back</h2>
              <p className="text-slate-600">Sign in to access your garage dashboard</p>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold text-slate-700">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="manager@garage.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        if (errors.email) setErrors(prev => ({...prev, email: ''}))
                      }}
                      className={`pl-11 h-12 text-base border-slate-200 ${errors.email ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-semibold text-slate-700">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value)
                        if (errors.password) setErrors(prev => ({...prev, password: ''}))
                      }}
                      className={`pl-11 h-12 text-base border-slate-200 ${errors.password ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700"
                  disabled={loading}
                >
                  {loading ? 'Signing in...' : (
                    <span className="flex items-center gap-2">Sign In <ArrowRight className="h-4 w-4" /></span>
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <a href="/" className="text-sm text-slate-600 hover:text-blue-600">← Back to Home</a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}