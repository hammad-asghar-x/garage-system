'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Sidebar from '@/components/layout/Sidebar'
import { useAuth } from '@/lib/useAuth'
import { toast } from 'sonner'
import { Car, CheckCircle, XCircle, Camera, Upload } from 'lucide-react'

interface WorkOrder {
  id: string
  wo_number: string
  complaint: string
  status: string
  customers: { full_name: string }
  vehicles: { license_plate: string; make: string; model: string; year: number }
}

const INSPECTION_ITEMS = [
  'Engine Oil',
  'Brake Pads',
  'Brake Fluid',
  'Coolant Level',
  'Tire Condition',
  'Battery Health',
  'Air Filter',
  'AC System',
  'Lights & Signals',
  'Suspension',
  'Exhaust System',
  'Transmission Fluid'
]

export default function InspectionPage() {
  const { user, loading: authLoading } = useAuth()
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [selectedWO, setSelectedWO] = useState<string>('')
  const [inspectionResults, setInspectionResults] = useState<{[key: string]: {status: string, notes: string, photos: string[]}}>({})
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (user) fetchWorkOrders()
  }, [user])

  const fetchWorkOrders = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('work_orders')
        .select(`
          id, wo_number, complaint, status,
          customers (full_name),
          vehicles (license_plate, make, model, year)
        `)
        .in('status', ['PENDING_MANAGER_APPROVAL', 'AWAITING_INSPECTION', 'INSPECTION_IN_PROGRESS'])
        .order('created_at', { ascending: false })

      if (error) throw error
      setWorkOrders((data as any) || [])
    } catch (error: any) {
      toast.error('Failed to load work orders', { description: error.message })
    } finally {
      setLoading(false)
    }
  }

  const handleInspectionChange = (item: string, updates: Partial<{status: string, notes: string, photos: string[]}>) => {
    setInspectionResults(prev => ({
      ...prev,
      [item]: { 
        status: prev[item]?.status || '', 
        notes: prev[item]?.notes || '', 
        photos: prev[item]?.photos || [],
        ...updates 
      }
    }))
  }

  const handlePhotoUpload = async (item: string, file: File) => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${selectedWO}-${item.replace(/\s+/g, '-')}-${Date.now()}.${fileExt}`
      
      const { data, error: uploadError } = await supabase.storage
        .from('inspection-photos')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('inspection-photos')
        .getPublicUrl(fileName)

      // Add photo URL to inspection results
      const currentPhotos = inspectionResults[item]?.photos || []
      handleInspectionChange(item, { photos: [...currentPhotos, publicUrl] })

      toast.success('Photo uploaded!', { description: `${item} photo saved.` })
      return publicUrl
    } catch (error: any) {
      toast.error('Upload failed', { description: error.message })
      return null
    }
  }

  const submitInspection = async () => {
    if (!selectedWO) {
      toast.error('No Work Order Selected', { description: 'Please select a work order to inspect.' })
      return
    }

    setSubmitting(true)
    try {
      // 1. Create the Inspection Report
      const issues = []
      for (const [item, result] of Object.entries(inspectionResults)) {
        if (result.status === 'FAIL' || result.notes) {
          issues.push({
            checklist_item: item,
            description: result.notes || `Failed inspection: ${result.status}`,
            severity: result.status === 'FAIL' ? 'HIGH' : 'MEDIUM',
            photo_urls: result.photos || []
          })
        }
      }

      const { data: report } = await supabase
        .from('inspection_reports')
        .insert([{
          work_order_id: selectedWO,
          inspector_id: user?.id,
          status: 'COMPLETED'
        }])
        .select()
        .single()

      if (issues.length > 0 && report) {
        await supabase
          .from('inspection_issues')
          .insert(issues.map(issue => ({
            ...issue,
            inspection_report_id: report.id
          })))
      }

      // 2. Update status to IN_PROGRESS so Technician can see it
      await supabase
        .from('work_orders')
        .update({ status: 'IN_PROGRESS' })
        .eq('id', selectedWO)

      toast.success('Inspection Submitted!', { description: 'Job sent to Technician for repair.' })
      setSelectedWO('')
      setInspectionResults({})
      fetchWorkOrders()
    } catch (error: any) {
      toast.error('Failed to submit inspection', { description: error.message })
    } finally {
      setSubmitting(false)
    }
  }

  if (authLoading) {
    return <div className="flex min-h-screen items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-blue-600"></div></div>
  }
  if (!user) return null

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-64 p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-800">Vehicle Inspection</h1>
          <p className="text-slate-600 mt-1">Perform 12-point vehicle inspection with photos</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Work Order Selection */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5" /> Pending Inspections
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-center py-4">Loading...</p>
              ) : workOrders.length === 0 ? (
                <p className="text-center text-slate-500 py-4">No pending inspections</p>
              ) : (
                <div className="space-y-2">
                  {workOrders.map((wo) => (
                    <button
                      key={wo.id}
                      onClick={() => setSelectedWO(wo.id)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedWO === wo.id ? 'bg-blue-50 border-blue-500' : 'hover:bg-slate-50'
                      }`}
                    >
                      <p className="font-bold text-sm text-blue-600">{wo.wo_number}</p>
                      <p className="text-xs text-slate-600">{wo.vehicles.make} {wo.vehicles.model}</p>
                      <p className="text-xs text-slate-500">{wo.customers.full_name}</p>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Inspection Form */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>12-Point Inspection Checklist</CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedWO ? (
                <div className="text-center py-12 text-slate-500">
                  <Car className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Select a work order to begin inspection</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {INSPECTION_ITEMS.map((item) => (
                    <div key={item} className="border rounded-lg p-4 bg-white">
                      <div className="flex justify-between items-center mb-3">
                        <Label className="font-bold text-slate-800 text-base">{item}</Label>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant={inspectionResults[item]?.status === 'PASS' ? 'default' : 'outline'}
                            onClick={() => handleInspectionChange(item, { status: 'PASS' })}
                            className={inspectionResults[item]?.status === 'PASS' ? 'bg-green-600 hover:bg-green-700' : ''}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" /> Pass
                          </Button>
                          <Button
                            size="sm"
                            variant={inspectionResults[item]?.status === 'FAIL' ? 'destructive' : 'outline'}
                            onClick={() => handleInspectionChange(item, { status: 'FAIL' })}
                          >
                            <XCircle className="h-4 w-4 mr-1" /> Fail
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <Input
                          placeholder="Add notes (e.g., 'Worn out', 'Needs replacement')..."
                          value={inspectionResults[item]?.notes || ''}
                          onChange={(e) => handleInspectionChange(item, { notes: e.target.value })}
                          className="w-full"
                        />
                        
                        <div className="flex items-center gap-2">
                          <label className="cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={async (e) => {
                                if (e.target.files?.[0]) {
                                  await handlePhotoUpload(item, e.target.files[0])
                                }
                              }}
                            />
                            <Button variant="outline" size="sm" asChild>
                              <span>
                                <Camera className="h-4 w-4 mr-2" />
                                Upload Photo
                              </span>
                            </Button>
                          </label>
                          
                          {inspectionResults[item]?.photos && inspectionResults[item].photos.length > 0 && (
                            <div className="flex gap-2 ml-4">
                              {inspectionResults[item].photos.map((photo, idx) => (
                                <a 
                                  key={idx} 
                                  href={photo} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:underline"
                                >
                                  Photo {idx + 1}
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  <Button
                    onClick={submitInspection}
                    disabled={submitting}
                    className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700 mt-4"
                  >
                    {submitting ? (
                      <span className="flex items-center gap-2">
                        <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                        Submitting...
                      </span>
                    ) : (
                      'Submit Inspection & Send to Technician'
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}