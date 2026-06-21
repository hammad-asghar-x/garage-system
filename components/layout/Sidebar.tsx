'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { 
  LayoutDashboard, Users, Car, FileText, Calendar, 
  CheckCircle, Wrench, Shield, Package, DollarSign, 
  UserCog, Settings, LogOut, Star, User
} from 'lucide-react'
import { useAuth } from '@/lib/useAuth'
import { supabase } from '@/lib/supabaseClient'

const menuItems = [
  { 
    name: 'Dashboard', 
    href: '/dashboard', 
    icon: LayoutDashboard, 
    roles: ['super_admin', 'manager', 'receptionist', 'inspection_tech', 'inventory_clerk', 'technician', 'qa_tech', 'accountant'] 
  },
  { 
    name: 'Profile', 
    href: '/profile', 
    icon: User, 
    roles: ['super_admin', 'manager', 'receptionist', 'inspection_tech', 'inventory_clerk', 'technician', 'qa_tech', 'accountant', 'customer'] 
  },
  { 
    name: 'Customers', 
    href: '/customers', 
    icon: Users, 
    roles: ['super_admin', 'manager', 'receptionist'] 
  },
  { 
    name: 'Vehicles', 
    href: '/vehicles', 
    icon: Car, 
    roles: ['super_admin', 'manager', 'receptionist'] 
  },
  { 
    name: 'Work Orders', 
    href: '/work-orders', 
    icon: FileText, 
    roles: ['super_admin', 'manager', 'receptionist'] 
  },
  { 
    name: 'Appointments', 
    href: '/appointments', 
    icon: Calendar, 
    roles: ['super_admin', 'manager', 'receptionist'] 
  },
  { 
    name: 'Inspection', 
    href: '/inspection', 
    icon: CheckCircle, 
    roles: ['super_admin', 'manager', 'inspection_tech'] 
  },
  { 
    name: 'Technician', 
    href: '/technician', 
    icon: Wrench, 
    roles: ['super_admin', 'manager', 'technician'] 
  },
  { 
    name: 'QA', 
    href: '/qa', 
    icon: Shield, 
    roles: ['super_admin', 'manager', 'qa_tech'] 
  },
  { 
    name: 'Inventory', 
    href: '/inventory', 
    icon: Package, 
    roles: ['super_admin', 'manager', 'inventory_clerk'] 
  },
  { 
    name: 'Billing', 
    href: '/billing', 
    icon: DollarSign, 
    roles: ['super_admin', 'manager', 'accountant'] 
  },
  { 
    name: 'Staff', 
    href: '/staff', 
    icon: UserCog, 
    roles: ['super_admin', 'manager'] 
  },
  { 
    name: 'Feedback', 
    href: '/feedback', 
    icon: Star, 
    roles: ['super_admin', 'manager'] 
  },
  { 
    name: 'Settings', 
    href: '/settings', 
    icon: Settings, 
    roles: ['super_admin', 'manager'] 
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const [userRole, setUserRole] = useState<string>('')
  const [userName, setUserName] = useState('')

  useEffect(() => {
    if (user) {
      fetchUserRole()
    }
  }, [user])

  const fetchUserRole = async () => {
    try {
      let { data } = await supabase
        .from('customers')
        .select('full_name, role')
        .eq('id', user?.id)
        .single()

      if (!data) {
        const { data: userData } = await supabase
          .from('users')
          .select('full_name, role')
          .eq('id', user?.id)
          .single()
        data = userData
      }

      if (data) {
        setUserRole(data.role || 'customer')
        setUserName(data.full_name || user?.email || 'User')
      }
    } catch (error) {
      console.error('Error fetching user role:', error)
    }
  }

  const handleLogout = async () => {
    await signOut()
  }

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(userRole)
  )

  return (
    <div className="fixed left-0 top-0 h-screen w-64 bg-slate-900 text-white flex flex-col">
      {/* Logo/Header - Fixed */}
      <div className="p-4 border-b border-slate-700 shrink-0">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-1.5 rounded-lg">
            <Wrench className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-xl">GMS Pro</span>
        </div>
      </div>

      {/* Menu Items - Scrollable with hidden scrollbar */}
      <nav 
        className="flex-1 overflow-y-auto py-4 px-2 space-y-1"
        style={{
          scrollbarWidth: 'none', /* Firefox */
          msOverflowStyle: 'none', /* IE and Edge */
        }}
      >
        {/* Hide scrollbar for Chrome, Safari and Opera */}
        <style jsx>{`
          nav::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        
        {filteredMenuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-blue-600 text-white' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="font-medium">{item.name}</span>
            </Link>
          )
        })}
      </nav>

      {/* User Info & Logout - Fixed at bottom */}
      <div className="border-t border-slate-700 p-4 bg-slate-900 shrink-0">
        <div className="mb-3">
          <p className="text-sm text-slate-400">Logged in as</p>
          <p className="font-semibold text-white truncate">{userName}</p>
          <p className="text-xs text-blue-400 capitalize">{userRole.replace('_', ' ')}</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </div>
  )
}