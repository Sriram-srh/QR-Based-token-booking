import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

function getSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase server environment variables')
  }

  return createClient(supabaseUrl, serviceRoleKey)
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdminClient()
    const { email, password, userType } = await request.json()

    if (!email || !password || !userType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get user from database
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (userError || !users) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, users.password_hash)
    if (!passwordMatch) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Verify user type matches
    if (users.role !== userType) {
      return NextResponse.json(
        { error: 'User type mismatch' },
        { status: 401 }
      )
    }

    // Get additional user info based on type
    let additionalData: Record<string, any> = {}
    if (userType === 'student') {
      const { data: student } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', users.id)
        .single()
      additionalData = student
        ? {
            studentId: student.id,
            registerNumber: student.register_number,
            hostel: student.hostel,
            room: student.room,
            phone: student.phone,
            photoUrl: student.photo_url,
          }
        : {}
    } else if (userType === 'staff') {
      const { data: staff } = await supabase
        .from('staff')
        .select('*')
        .eq('user_id', users.id)
        .single()
      const { data: assignedCounter } = staff
        ? await supabase
          .from('counters')
          .select('id, name, type')
          .eq('assigned_staff_id', staff.id)
          .maybeSingle()
        : { data: null }
      additionalData = staff
        ? {
            staffId: staff.id,
            counterId: assignedCounter?.id || null,
            counterName: assignedCounter?.name || null,
            counterType: assignedCounter?.type || null,
          }
        : {}
    }

    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      return NextResponse.json({ error: 'JWT_SECRET is not configured' }, { status: 500 })
    }

    const token = jwt.sign(
      {
        userId: users.id,
        role: users.role,
        studentId: additionalData.studentId,
        staffId: additionalData.staffId,
        counterId: additionalData.counterId,
      },
      jwtSecret,
      { expiresIn: '12h' }
    )

    return NextResponse.json({
      token,
      user: {
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        userType: users.role,
        ...additionalData
      }
    })
  } catch (error) {
    console.error('[v0] Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
