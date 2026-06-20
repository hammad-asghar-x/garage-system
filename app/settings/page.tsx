'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Sidebar from '@/components/layout/Sidebar'
import { toast } from 'sonner'
import { Settings as SettingsIcon, Save, Building, Mail, Phone, MapPin } from 'lucide-react'

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    garageName: 'GMS Pro Garage',
    email: 'info@gmspro.com',
    phone: '+92 300 1234567',
    address: '123 Auto Lane, Karachi',
    taxRate: '17',
    currency: 'PKR'
  })

  const handleSave = () => {
    toast.success('Settings Saved!', { description: 'Garage settings updated successfully.' })
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-64 p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
            <SettingsIcon className="h-8 w-8 text-blue-600"/> Settings
          </h1>
          <p className="text-slate-600 mt-1">Manage garage settings and configuration</p>
        </div>

        <div className="max-w-2xl space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5 text-blue-600" /> Garage Information
              </CardTitle>
              <CardDescription>Basic information about your garage</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Garage Name</Label>
                <Input 
                  value={settings.garageName} 
                  onChange={(e) => setSettings({...settings, garageName: e.target.value})}
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="flex items-center gap-2"><Mail className="h-4 w-4" /> Email</Label>
                  <Input 
                    type="email"
                    value={settings.email} 
                    onChange={(e) => setSettings({...settings, email: e.target.value})}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="flex items-center gap-2"><Phone className="h-4 w-4" /> Phone</Label>
                  <Input 
                    value={settings.phone} 
                    onChange={(e) => setSettings({...settings, phone: e.target.value})}
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Address</Label>
                <Input 
                  value={settings.address} 
                  onChange={(e) => setSettings({...settings, address: e.target.value})}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Business Settings</CardTitle>
              <CardDescription>Tax and currency configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tax Rate (%)</Label>
                  <Input 
                    type="number"
                    value={settings.taxRate} 
                    onChange={(e) => setSettings({...settings, taxRate: e.target.value})}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Currency</Label>
                  <Input 
                    value={settings.currency} 
                    onChange={(e) => setSettings({...settings, currency: e.target.value})}
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Button onClick={handleSave} className="w-full">
            <Save className="h-4 w-4 mr-2" /> Save Settings
          </Button>
        </div>
      </div>
    </div>
  )
}