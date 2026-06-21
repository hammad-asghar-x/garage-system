'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Phone, CreditCard, ArrowRight, Car, ArrowLeft } from 'lucide-react'

export default function CustomerLoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [identifier, setIdentifier] = useState('')
  const [loginMethod, setLoginMethod] = useState<'phone' | 'cnic'>('phone')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!identifier.trim()) {
      toast.error('Required', { description: 'Please enter your mobile number or CNIC' })
      return
    }

    setLoading(true)
    try {
      const column = loginMethod === 'phone' ? 'phone' : 'cnic'
      
      const { data: customer, error } = await supabase
        .from('customers')
        .select('id, full_name, email, phone')
        .eq(column, identifier)
        .single()

      if (error || !customer) {
        toast.error('Customer Not Found', { 
          description: 'No account found with this ' + (loginMethod === 'phone' ? 'mobile number' : 'CNIC') + '. Please visit the garage to register.' 
        })
        setLoading(false)
        return
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: customer.email || `customer_${customer.id}@garage.local`,
        password: customer.phone
      })

      if (signInError) {
        const { data: authData } = await supabase.auth.signInAnonymously()
        if (!authData) {
          throw new Error('Failed to create session')
        }
      }

      localStorage.setItem('customer_id', customer.id)
      localStorage.setItem('customer_name', customer.full_name)
      localStorage.setItem('customer_phone', customer.phone)

      toast.success('Welcome!', { description: `Hello ${customer.full_name}` })
      router.push('/customer/dashboard')
      
    } catch (error: any) {
      console.error('Login error:', error)
      toast.error('Login Failed', { description: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100 p-4">
      {/* Back Button */}
      <Link 
        href="/"
        className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-blue-600 bg-white hover:bg-blue-50 rounded-lg shadow-sm border border-slate-200 transition-all"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Home
      </Link>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center">
              <Car className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl">GMS Pro - Customer Portal</CardTitle>
          <CardDescription>
            Track your vehicle service status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label>Login With</Label>
              <div className="flex gap-2 mt-2">
                <Button
                  type="button"
                  variant={loginMethod === 'phone' ? 'default' : 'outline'}
                  onClick={() => setLoginMethod('phone')}
                  className="flex-1"
                >
                  <Phone className="h-4 w-4 mr-2" /> Mobile Number
                </Button>
                <Button
                  type="button"
                  variant={loginMethod === 'cnic' ? 'default' : 'outline'}
                  onClick={() => setLoginMethod('cnic')}
                  className="flex-1"
                >
                  <CreditCard className="h-4 w-4 mr-2" /> CNIC
                </Button>
              </div>
            </div>

            <div>
              <Label>
                {loginMethod === 'phone' ? 'Mobile Number' : 'CNIC Number'}
              </Label>
              <Input
                type={loginMethod === 'phone' ? 'tel' : 'text'}
                placeholder={loginMethod === 'phone' ? '0300-1234567' : '12345-1234567-8'}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="mt-1"
                required
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Please wait...' : 'Access Portal'}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </form>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800 text-center">
              <strong>Note:</strong> Only registered customers can access this portal. 
              If you're a new customer, please visit our garage to register.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}