'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Sidebar from '@/components/layout/Sidebar'
import { useAuth } from '@/lib/useAuth'
import { toast } from 'sonner'

const CHECKLIST = [
  'Tire Pressure', 'Brake Pads', 'Engine Coolant', 'Battery', 
  'Lights', 'Wipers', 'Belts & Hoses', 'Fluids', 
  'Suspension', 'Steering', 'Exhaust', 'AC System'
]

interface IssueData {
  status: 'OK' | 'WARNING' | 'FAIL'
  description: string
  severity: string
  photo: File | null
  photoUrl: string | null
}

export default function DVIFormPage() {
  const { user, loading: authLoading } = useAuth()
  const params = useParams()
  const router = useRouter()
  
  // Safely extract the ID
  const woId = Array.isArray(params.id) ? params.id[0] : params.id
  
  const [wo, setWo] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  
  const [checklist, setChecklist] = useState<IssueData[]>(
    CHECKLIST.map(() => ({ status: 'OK', description: '', severity: 'LOW', photo: null, photoUrl: null }))
  )
  const [overallNotes, setOverallNotes] = useState('')

  useEffect(() => {
    if (user && woId) {
      fetchWO()
    }
  }, [user, woId])

  const fetchWO = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('work_orders')
        .select(`
          *,
          customers (full_name, phone),
          vehicles (license_plate, make, model, year)
        `)
        .eq('id', woId)
        .single()
      
      if (error) throw error
      setWo(data)
    } catch (error: any) {
      toast.error('Failed to load WO', { description: error.message })
    } finally {
      setLoading(false)
    }
  }

  const updateChecklist = (index: number, field: keyof IssueData, value: any) => {
    const newChecklist = [...checklist]
    newChecklist[index] = { ...newChecklist[index], [field]: value }
    setChecklist(newChecklist)
  }

  // FIXED: Updates both photo and photoUrl in a SINGLE step to prevent React state overwriting
  const handlePhotoSelect = (index: number, file: File | null) => {
    console.log(' File selected:', file?.name, file?.type, file?.size)
    
    if (file) {
      // Validate file type
      if (!file.type.match('image/jpeg|image/png|image/webp')) {
        toast.error('Invalid File Type', { 
          description: 'Only JPG, PNG, and WEBP images are allowed.' 
        })
        return
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File Too Large', { 
          description: 'Image must be under 5MB.' 
        })
        return
      }
    }

    // Single state update to prevent data loss
    const newChecklist = [...checklist]
    newChecklist[index] = {
      ...newChecklist[index],
      photo: file,
      photoUrl: file ? URL.createObjectURL(file) : null
    }
    setChecklist(newChecklist)
    
    console.log('✅ State updated. Photo is now:', newChecklist[index].photo?.name)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      console.log('🚀 Starting inspection submission...')
      console.log('📋 Work Order ID:', woId)
      console.log('👤 User ID:', user?.id)

      // 1. Create the main Inspection Report
      const { data: report, error: reportError } = await supabase
        .from('inspection_reports')
        .insert([{
          work_order_id: woId,
          inspection_tech_id: user?.id,
          start_time: new Date().toISOString(),
          end_time: new Date().toISOString(),
          overall_notes: overallNotes,
          status: 'SUBMITTED'
        }])
        .select()
        .single()

      if (reportError) {
        console.error('❌ Error creating report:', reportError)
        throw reportError
      }

      console.log('✅ Inspection report created:', report.id)

      // 2. Process Issues & Upload Photos to Supabase Storage
      const issuesToInsert = []
      
      for (let i = 0; i < CHECKLIST.length; i++) {
        const item = checklist[i]
        
        console.log(`\n🔍 Processing item ${i}: ${CHECKLIST[i]}`)
        console.log('Status:', item.status)
        console.log('Has photo:', item.photo !== null)
        
        // Only save if it's NOT 'OK'
        if (item.status !== 'OK') {
          let photoUrl = null
          
          // Upload photo to Storage if the user attached one
          if (item.photo) {
            console.log('📸 Processing photo upload for item:', CHECKLIST[i])
            console.log('📁 File details:', {
              name: item.photo.name,
              size: item.photo.size,
              type: item.photo.type
            })
            
            const fileExt = item.photo.name.split('.').pop()
            const fileName = `${woId}/${i}-${Date.now()}.${fileExt}`
            
            console.log('📍 Upload path:', fileName)
            console.log(' Bucket name: inspection-photos')
            
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('inspection-photos')
              .upload(fileName, item.photo, {
                cacheControl: '3600',
                upsert: false,
                contentType: item.photo.type
              })
            
            console.log('⬆️ Upload result:', { uploadData, uploadError })
              
            if (uploadError) {
              console.error('❌ Upload failed:', uploadError)
              console.error('Error message:', uploadError.message)
              throw uploadError
            }

            // Get the public URL to save in the database
            const { data } = supabase.storage.from('inspection-photos').getPublicUrl(fileName)
            photoUrl = data.publicUrl
            console.log('✅ Photo URL:', photoUrl)
          } else {
            console.log('⚠️ No photo attached for this item')
          }

          issuesToInsert.push({
            inspection_report_id: report.id,
            checklist_item: CHECKLIST[i],
            description: item.description || `Issue found with ${CHECKLIST[i]}`,
            severity: item.severity,
            photo_urls: photoUrl ? [photoUrl] : []
          })
          
          console.log('✅ Item processed successfully')
        } else {
          console.log('⏭️ Skipping item (status is OK)')
        }
      }

      console.log('\n💾 Total issues to insert:', issuesToInsert.length)

      // Insert all issues into the database
      if (issuesToInsert.length > 0) {
        console.log('💾 Inserting issues to database...')
        const { error: issuesError } = await supabase
          .from('inspection_issues')
          .insert(issuesToInsert)
        if (issuesError) {
          console.error('❌ Error inserting issues:', issuesError)
          throw issuesError
        }
        console.log('✅ Issues inserted successfully')
      }

      // 3. Update Work Order Status to INSPECTION_COMPLETE
      const { error: woError } = await supabase
        .from('work_orders')
        .update({ status: 'INSPECTION_COMPLETE' })
        .eq('id', woId)

      if (woError) {
        console.error('❌ Error updating WO status:', woError)
        throw woError
      }

      console.log('\n🎉 Inspection submitted successfully!')
      toast.success('Inspection Submitted!', { 
        description: 'Report saved and sent to Manager.' 
      })
      
      router.push('/inspection')
    } catch (error: any) {
      console.error('💥 Final error:', error)
      toast.error('Failed to submit inspection', { 
        description: error.message || 'An unexpected error occurred.' 
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-blue-600"></div>
      </div>
    )
  }
  
  if (!user) return null
  if (!wo) return <div className="p-8 text-center text-red-500">Work Order not found.</div>

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-64 p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-800">Digital Vehicle Inspection (DVI)</h1>
          <p className="text-slate-600 mt-1">
            {wo.wo_number} - {wo.vehicles.year} {wo.vehicles.make} {wo.vehicles.model} ({wo.vehicles.license_plate})
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader><CardTitle>12-Point Inspection Checklist</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            {CHECKLIST.map((item, index) => (
              <div key={item} className="border rounded-lg p-4 bg-white shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-lg text-slate-800">{item}</h3>
                  <select 
                    value={checklist[index].status}
                    onChange={(e) => updateChecklist(index, 'status', e.target.value)}
                    className={`px-3 py-1 rounded-full text-sm font-bold border cursor-pointer ${
                      checklist[index].status === 'OK' ? 'bg-green-100 text-green-800 border-green-200' :
                      checklist[index].status === 'WARNING' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                      'bg-red-100 text-red-800 border-red-200'
                    }`}
                  >
                    <option value="OK">✅ OK</option>
                    <option value="WARNING">⚠️ Warning</option>
                    <option value="FAIL">❌ Fail</option>
                  </select>
                </div>

                {checklist[index].status !== 'OK' && (
                  <div className="mt-4 space-y-3 pl-4 border-l-4 border-slate-200 animate-in fade-in slide-in-from-top-2">
                    <div>
                      <Label>Description of Issue</Label>
                      <Input 
                        value={checklist[index].description}
                        onChange={(e) => updateChecklist(index, 'description', e.target.value)}
                        placeholder={`e.g., Front left ${item.toLowerCase()} is low...`}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Severity</Label>
                        <select 
                          value={checklist[index].severity}
                          onChange={(e) => updateChecklist(index, 'severity', e.target.value)}
                          className="w-full p-2 border rounded"
                        >
                          <option value="LOW">Low</option>
                          <option value="MEDIUM">Medium</option>
                          <option value="HIGH">High</option>
                          <option value="CRITICAL">Critical</option>
                        </select>
                      </div>
                      <div>
                        <Label>Upload Photo (JPG/PNG/WEBP, Max 5MB)</Label>
                        <input 
                          type="file" 
                          accept="image/png, image/jpeg, image/webp"
                          onChange={(e) => handlePhotoSelect(index, e.target.files?.[0] || null)}
                          className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        {checklist[index].photoUrl && (
                          <img src={checklist[index].photoUrl} alt="Preview" className="mt-2 h-24 rounded border object-cover" />
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader><CardTitle>Overall Notes & Recommendations</CardTitle></CardHeader>
          <CardContent>
            <textarea 
              value={overallNotes}
              onChange={(e) => setOverallNotes(e.target.value)}
              rows={4}
              placeholder="Add any general notes about the vehicle's condition..."
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button onClick={handleSubmit} disabled={submitting} size="lg">
            {submitting ? 'Submitting & Uploading...' : 'Submit Inspection Report'}
          </Button>
          <Button variant="outline" size="lg" onClick={() => router.push('/inspection')}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}