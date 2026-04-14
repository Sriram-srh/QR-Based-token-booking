import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !anonKey) {
    throw new Error('Missing Supabase auth environment variables')
  }

  return createClient(supabaseUrl, anonKey)
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient()
    const { email, password, userType } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error || !data.user || !data.session) {
      return NextResponse.json(
        { success: false, error: error?.message || 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Optional role gate: if caller supplied a userType, validate against auth metadata.
    if (userType) {
      const metaRole = data.user.app_metadata?.role || data.user.user_metadata?.role
      if (metaRole && metaRole !== userType) {
        return NextResponse.json(
          { success: false, error: 'User type mismatch' },
          { status: 401 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      user: data.user,
      session: data.session,
    })
  } catch (error) {
    console.error('[v0] Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
