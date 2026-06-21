'use client'

import Sidebar from '@/components/layout/Sidebar'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Clock, Calendar, Bell } from 'lucide-react'

export default function AppointmentsPage() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-64 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Online Appointments</h1>
          <p className="text-slate-600 mt-1">Manage customer appointment requests</p>
        </div>

        {/* Coming Soon Banner */}
        <div className="bg-linear-to-r from-blue-600 to-blue-700 text-white p-8 rounded-2xl mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-16 w-16 bg-white/20 rounded-full flex items-center justify-center">
              <Calendar className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Coming Soon</h2>
              <p className="text-blue-100">Online Appointment Management System</p>
            </div>
          </div>
          <p className="text-blue-50 max-w-2xl">
            We're working on bringing you a comprehensive appointment management system where you can:
            - View and manage customer booking requests
            - Schedule and confirm appointments
            - Send automated reminders
            - Track appointment history
          </p>
        </div>

        {/* Placeholder Tabs */}
        <div className="flex gap-2 mb-6">
          <Button variant="default" className="bg-blue-600">
            PENDING
          </Button>
          <Button variant="outline" disabled>
            CONFIRMED
          </Button>
          <Button variant="outline" disabled>
            COMPLETED
          </Button>
          <Button variant="outline" disabled>
            CANCELLED
          </Button>
        </div>

        {/* Empty State */}
        <Card className="border-2 border-dashed border-slate-300">
          <CardContent className="p-12 text-center">
            <div className="mb-4">
              <Bell className="h-16 w-16 text-slate-300 mx-auto mb-3" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">
              Appointment System Under Development
            </h3>
            <p className="text-slate-500 max-w-md mx-auto">
              This feature is currently being developed. 
              Once launched, you'll be able to manage all customer appointment requests from here.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full text-sm text-slate-600">
              <Clock className="h-4 w-4" />
              <span>Expected launch: Soon</span>
            </div>
          </CardContent>
        </Card>

        {/* Features Preview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Card>
            <CardContent className="p-6 text-center">
              <Calendar className="h-12 w-12 text-blue-600 mx-auto mb-3" />
              <h3 className="font-bold text-slate-800 mb-2">Schedule Management</h3>
              <p className="text-sm text-slate-600">
                View and manage all appointment requests in one place
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Bell className="h-12 w-12 text-green-600 mx-auto mb-3" />
              <h3 className="font-bold text-slate-800 mb-2">Auto Notifications</h3>
              <p className="text-sm text-slate-600">
                Automatic SMS and email reminders for customers
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Clock className="h-12 w-12 text-purple-600 mx-auto mb-3" />
              <h3 className="font-bold text-slate-800 mb-2">Time Slot Booking</h3>
              <p className="text-sm text-slate-600">
                Customers can book available time slots online
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}