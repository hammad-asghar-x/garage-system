'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Search, Car } from 'lucide-react'

export default function TrackVehiclePage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchTerm.trim()) return

    setLoading(true)
    try {
      let query = supabase
        .from('work_orders')
        .select(`
          id, wo_number,
          customers (phone)
        `)

      // Check if it looks like a WO number (starts with WO-) or a phone number
      if (searchTerm.toUpperCase().startsWith('WO-')) {
        query = query.eq('wo_number', searchTerm.toUpperCase())
      } else {
        // Clean phone number for search (remove dashes/spaces)
        const cleanPhone = searchTerm.replace(/[^0-9]/g, '')
        query = query.eq('customers.phone', cleanPhone)
      }

      const { data, error } = await query.order('created_at', { ascending: false }).limit(1)

      if (error) throw error

      if (data && data.length > 0) {
        router.push(`/track/${data[0].id}`)
      } else {
        toast.error('No Vehicle Found', { 
          description: 'Please check the Work Order number or Phone number and try again.' 
        })
      }
    } catch (error: any) {
      toast.error('Search Failed', { description: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-600 text-white mb-4">
            <Car className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Track Your Vehicle</h1>
          <p className="text-slate-600 mt-2">Enter your Work Order number or Phone number to see real-time status.</p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader>
            <CardTitle className="text-center">Find Your Job</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-4">
              <div>
                <Input
                  placeholder="e.g., WO-2026-0001 or 0300-1234567"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-12 text-lg"
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700">
                {loading ? 'Searching...' : <><Search className="h-5 w-5 mr-2" /> Track Vehicle</>}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-400 mt-6">
          Powered by GMS Pro Garage Management System
        </p>
      </div>
    </div>
  )
}