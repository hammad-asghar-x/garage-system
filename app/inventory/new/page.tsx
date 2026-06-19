'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import Sidebar from '@/components/layout/Sidebar'
import { useAuth } from '@/lib/useAuth'
import { useRouter } from 'next/navigation'

export default function NewPartPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<{[key: string]: string}>({})
  
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    category: '',
    quantity: '',
    reorder_level: '5',
    unit_price: ''
  })

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {}
    let isValid = true

    if (!formData.sku.trim()) { newErrors.sku = 'SKU is required'; isValid = false }
    if (!formData.name.trim()) { newErrors.name = 'Name is required'; isValid = false }
    if (!formData.quantity || Number(formData.quantity) < 0) { newErrors.quantity = 'Invalid quantity'; isValid = false }
    if (!formData.unit_price || Number(formData.unit_price) < 0) { newErrors.unit_price = 'Invalid price'; isValid = false }

    setErrors(newErrors)
    return isValid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setSaving(true)
    try {
      const { error } = await supabase.from('parts').insert([{
        sku: formData.sku.trim().toUpperCase(),
        name: formData.name.trim(),
        category: formData.category.trim(),
        quantity: parseInt(formData.quantity),
        reorder_level: parseInt(formData.reorder_level),
        unit_price: parseFloat(formData.unit_price)
      }])

      if (error) throw error

      toast.success('Part Added!', { description: `${formData.name} added to inventory.` })
      router.push('/inventory')
    } catch (error: any) {
      toast.error('Failed to add part', { description: error.message })
    } finally {
      setSaving(false)
    }
  }

  if (authLoading) return <div className="flex min-h-screen items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-blue-600"></div></div>
  if (!user) return null

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-64 p-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-6">Add New Part</h1>
        <Card>
          <CardHeader><CardTitle>Part Details</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>SKU *</Label>
                  <Input value={formData.sku} onChange={(e) => setFormData({...formData, sku: e.target.value})} className={errors.sku ? 'border-red-500' : ''} />
                  {errors.sku && <p className="text-sm text-red-500 mt-1">{errors.sku}</p>}
                </div>
                <div>
                  <Label>Category</Label>
                  <Input value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} placeholder="e.g., Engine, Brakes" />
                </div>
              </div>
              <div>
                <Label>Part Name *</Label>
                <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className={errors.name ? 'border-red-500' : ''} />
                {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Quantity *</Label>
                  <Input type="number" value={formData.quantity} onChange={(e) => setFormData({...formData, quantity: e.target.value})} className={errors.quantity ? 'border-red-500' : ''} />
                  {errors.quantity && <p className="text-sm text-red-500 mt-1">{errors.quantity}</p>}
                </div>
                <div>
                  <Label>Reorder Level</Label>
                  <Input type="number" value={formData.reorder_level} onChange={(e) => setFormData({...formData, reorder_level: e.target.value})} />
                </div>
                <div>
                  <Label>Unit Price (Rs.) *</Label>
                  <Input type="number" step="0.01" value={formData.unit_price} onChange={(e) => setFormData({...formData, unit_price: e.target.value})} className={errors.unit_price ? 'border-red-500' : ''} />
                  {errors.unit_price && <p className="text-sm text-red-500 mt-1">{errors.unit_price}</p>}
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Part'}</Button>
                <Button type="button" variant="outline" onClick={() => router.push('/inventory')}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}