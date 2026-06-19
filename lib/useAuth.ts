'use client'

import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { useRouter } from 'next/navigation'

export interface User {
  id: string
  email: string
  full_name: string
  role: string
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check active sessions and sets the user
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        // Fetch the user's profile from the public.users table
        const { data: profile } = await supabase
          .from('users')
          .select('full_name, role')
          .eq('id', session.user.id)
          .single()

        setUser({
          id: session.user.id,
          email: session.user.email || '',
          full_name: profile?.full_name || 'User',
          role: profile?.role || 'customer'
        })
      } else {
        setUser(null)
        // If no user, redirect to login (unless we are already on login page)
        if (window.location.pathname !== '/login') {
          router.push('/login')
        }
      }
      setLoading(false)
    }

    getSession()

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        getSession()
      } else {
        setUser(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return { user, loading, signOut }
}