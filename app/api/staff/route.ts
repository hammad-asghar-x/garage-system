import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || (profile.role !== 'manager' && profile.role !== 'super_admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { full_name, email, phone, role, hourly_rate } = body

    if (!full_name || !email || !phone || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if email already exists in public.users
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('email', email)
      .maybeSingle()

    if (existingUser) {
      return NextResponse.json({ 
        error: 'Email already exists',
        message: `Staff with email ${email} already exists.`
      }, { status: 409 })
    }

    // ✅ FIXED DEFAULT PASSWORD
    const tempPassword = 'password123'

    // Create auth user
    const { data: authData, error: authCreateError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { full_name, role }
    })

    if (authCreateError) {
      // If user already exists in auth, find them
      if (authCreateError.message.includes('already registered')) {
        const { data: allUsers } = await supabaseAdmin.auth.admin.listUsers()
        const foundUser = allUsers.users.find(u => u.email === email)
        
        if (foundUser) {
          // Use UPSERT to insert or update the public.users record
          const { error: upsertError } = await supabaseAdmin
            .from('users')
            .upsert([{
              id: foundUser.id,
              full_name: full_name,
              email: email,
              phone: phone,
              role: role,
              hourly_rate: parseFloat(hourly_rate) || 1000
            }], {
              onConflict: 'id'
            })

          if (upsertError) {
            console.error('Upsert error:', upsertError)
            return NextResponse.json({ error: upsertError.message }, { status: 500 })
          }

          return NextResponse.json({
            success: true,
            message: `Staff member ${full_name} updated successfully.`,
            tempPassword: tempPassword,
            email: email
          })
        }
      }
      
      console.error('Auth creation error:', authCreateError)
      return NextResponse.json({ error: authCreateError.message }, { status: 500 })
    }

    // Insert into public.users using UPSERT (handles duplicates)
    const { error: upsertError } = await supabaseAdmin
      .from('users')
      .upsert([{
        id: authData.user.id,
        full_name: full_name,
        email: email,
        phone: phone,
        role: role,
        hourly_rate: parseFloat(hourly_rate) || 1000
      }], {
        onConflict: 'id'
      })

    if (upsertError) {
      console.error('Upsert error:', upsertError)
      return NextResponse.json({ error: upsertError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Staff member ${full_name} created successfully.`,
      tempPassword: tempPassword,
      email: email
    })

  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}