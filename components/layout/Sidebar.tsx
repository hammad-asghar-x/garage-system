'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Users, 
  Car, 
  FileText, 
  Package, 
  Settings,
  LogOut 
} from 'lucide-react'
import { useAuth } from '@/lib/useAuth'

const menuItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Vehicles', href: '/vehicles', icon: Car },
  { name: 'Work Orders', href: '/work-orders', icon: FileText },
  { name: 'Inventory', href: '/inventory', icon: Package },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { user, signOut } = useAuth()

  return (
    <div className="flex h-screen w-64 flex-col bg-slate-900 text-white fixed left-0 top-0">
      {/* Logo Area */}
      <div className="flex h-16 items-center border-b border-slate-700 px-6">
        <h1 className="text-xl font-bold text-blue-400"> GMS Pro</h1>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-2 px-4 py-6">
        {menuItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive 
                  ? 'bg-blue-600 text-white' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* User Info & Logout */}
      <div className="border-t border-slate-700 p-4">
        {user ? (
          <>
            <div className="mb-3">
              <p className="text-xs text-slate-400">Logged in as</p>
              <p className="font-semibold text-white truncate">{user.full_name}</p>
              <p className="text-xs text-blue-400 capitalize">{user.role.replace('_', ' ')}</p>
            </div>
            <button 
              onClick={signOut}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-red-900/50 hover:text-red-400 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </>
        ) : (
          <p className="text-sm text-slate-500">Loading user...</p>
        )}
      </div>
    </div>
  )
}