import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { createQRCodeId, generateQRCodeDataUrl } from '@/lib/qr-utils'
import { verifySupabaseAuth, AuthError } from '@/lib/auth-middleware'
import { normalizeMealType } from '@/lib/meal-type'
import { z } from 'zod'

function generateBackupCode() {
  return Math.random().toString(36).substring(2, 10).toUpperCase()
}

function getSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase server environment variables')
  }

  return createClient(supabaseUrl, serviceRoleKey)
}

// Get all tokens for a student
export async function GET(request: NextRequest) {
  try {
    const user = await verifySupabaseAuth(request, ['student', 'admin'])
    const supabase = getSupabaseAdminClient()
    const studentId = request.nextUrl.searchParams.get('studentId')
    
    if (!studentId) {
      return NextResponse.json(
        { error: 'Student ID required' },
        { status: 400 }
      )
    }

    if (user.role === 'student' && user.studentId && user.studentId !== studentId) {
      return NextResponse.json({ error: 'Unauthorized student access' }, { status: 403 })
    }

    const [tokensRes, preBookingsRes] = await Promise.all([
      supabase
        .from('meal_tokens')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false }),
      supabase
        .from('pre_bookings')
        .select('id, student_id, meal_date, meal_type, status, total_cost, qr_token_id, created_at')
        .eq('student_id', studentId)
        .order('meal_date', { ascending: true }),
    ])

    if (tokensRes.error) {
      console.error('DB ERROR:', tokensRes.error)
      throw tokensRes.error
    }

    if (preBookingsRes.error) {
      console.error('DB ERROR:', preBookingsRes.error)
      throw preBookingsRes.error
    }

    const tokens = tokensRes.data || []
    const preBookings = preBookingsRes.data || []

    const now = Date.now()
    const needsExpiryUpdate = tokens.filter((token: any) => {
      if (token.status !== 'VALID') return false
      const expiry = new Date(token.expires_at).getTime()
      return Number.isFinite(expiry) && now > expiry
    })

    let normalizedTokens = tokens
    if (needsExpiryUpdate.length > 0) {
      const ids = needsExpiryUpdate.map((token: any) => token.id)
      const { error: expiryUpdateError } = await supabase
        .from('meal_tokens')
        .update({ status: 'EXPIRED', updated_at: new Date().toISOString() })
        .in('id', ids)

      if (expiryUpdateError) {
        console.error('DB ERROR:', expiryUpdateError)
      }

      const { data: refreshedTokens, error: refreshError } = await supabase
        .from('meal_tokens')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })

      if (refreshError) {
        console.error('DB ERROR:', refreshError)
        throw refreshError
      }

      normalizedTokens = refreshedTokens || []
    }

    const active = normalizedTokens
      .filter((token: any) => {
        const expiry = new Date(token.expires_at).getTime()
        return token.status === 'VALID' && Number.isFinite(expiry) && expiry > now
      })
      .map((token: any) => ({
        ...token,
        backupCode: token.backup_code || null,
      }))

    const used = normalizedTokens
      .filter((token: any) => {
        const expiry = new Date(token.expires_at).getTime()
        const expiredByTime = Number.isFinite(expiry) && expiry <= now
        return token.status === 'USED' || token.status === 'EXPIRED' || token.status === 'CANCELLED' || expiredByTime
      })
      .map((token: any) => ({
        ...token,
        backupCode: token.backup_code || null,
      }))

    const upcoming = preBookings
      .filter((pb: any) => {
        const mealTs = new Date(`${pb.meal_date}T00:00:00`).getTime()
        return Number.isFinite(mealTs) && mealTs >= new Date(new Date().setHours(0, 0, 0, 0)).getTime() && pb.status !== 'CANCELLED'
      })
      .map((pb: any) => ({
        id: pb.id,
        preBookingId: pb.id,
        meal_type: pb.meal_type,
        meal_date: pb.meal_date,
        status: 'UPCOMING',
        total_cost: Number(pb.total_cost || 0),
        qr_code: null,
        qr_code_image: null,
        backup_code: null,
        backupCode: null,
        qr_token_id: pb.qr_token_id || null,
        created_at: pb.created_at,
        source: 'pre_bookings',
      }))

    const tokensFlat = [...active, ...used]

    return NextResponse.json({
      active,
      upcoming,
      used,
      tokens: tokensFlat,
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[v0] Get tokens error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tokens' },
      { status: 500 }
    )
  }
}

// Create a new token
export async function POST(request: NextRequest) {
  try {
    const user = await verifySupabaseAuth(request, ['student', 'admin'])
    const supabase = getSupabaseAdminClient()
    const body = await request.json()
    const parsed = z.object({
      studentId: z.string().uuid(),
      mealType: z.string(),
      totalCost: z.number(),
      selectedMenuItems: z.array(z.object({
        id: z.string().uuid(),
        name: z.string().optional(),
        cost: z.number().optional(),
      })).optional(),
    }).safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const { studentId, totalCost, selectedMenuItems } = parsed.data
    const mealType = normalizeMealType(parsed.data.mealType)

    if (!mealType) {
      return NextResponse.json(
        { error: 'Invalid meal type. Use Breakfast, Lunch, or Dinner.' },
        { status: 400 }
      )
    }

    if (user.role === 'student' && user.studentId && user.studentId !== studentId) {
      return NextResponse.json({ error: 'Unauthorized student access' }, { status: 403 })
    }

    // Generate QR code payload and image
    const timestamp = Date.now()
    const qrCode = createQRCodeId(studentId, mealType, timestamp)
    const backupCode = generateBackupCode()
    const qrCodeImage = await generateQRCodeDataUrl({
      tokenId: qrCode,
      studentId,
      mealType,
      date: new Date().toISOString().split('T')[0],
      timestamp,
    })

    // Create token in database
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // Expires in 7 days

    let token: any = null
    let insertError: any = null

    const insertWithBackup = await supabase
      .from('meal_tokens')
      .insert({
        student_id: studentId,
        meal_type: mealType,
        status: 'VALID',
        qr_code: qrCode,
        backup_code: backupCode,
        qr_code_image: qrCodeImage,
        total_cost: totalCost,
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single()

    token = insertWithBackup.data
    insertError = insertWithBackup.error

    if (insertError && String(insertError.message || '').toLowerCase().includes('backup_code')) {
      const fallbackInsert = await supabase
        .from('meal_tokens')
        .insert({
          student_id: studentId,
          meal_type: mealType,
          status: 'VALID',
          qr_code: qrCode,
          qr_code_image: qrCodeImage,
          total_cost: totalCost,
          expires_at: expiresAt.toISOString()
        })
        .select()
        .single()

      token = fallbackInsert.data
      insertError = fallbackInsert.error
    }

    if (insertError || !token) {
      console.error('DB ERROR:', insertError)
      throw insertError || new Error('Token creation failed')
    }

    if (Array.isArray(selectedMenuItems) && selectedMenuItems.length > 0) {
      const tokenItems = selectedMenuItems.map((item) => ({
        token_id: token.id,
        menu_item_id: item.id,
        name: String(item.name || 'Menu Item'),
        cost: Number(item.cost || 0),
        quantity: 1,
      }))

      const { error: tokenItemError } = await supabase.from('meal_token_items').insert(tokenItems)
      if (tokenItemError) {
        console.error('DB ERROR:', tokenItemError)
      }
    }

    return NextResponse.json(
      {
        token: {
          ...token,
          backupCode: token.backup_code || null,
          backup_code: token.backup_code || null,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[v0] Create token error:', error)
    return NextResponse.json(
      { error: 'Failed to create token' },
      { status: 500 }
    )
  }
}

// Cancel a token (before it is used)
export async function PATCH(request: NextRequest) {
  try {
    const user = await verifySupabaseAuth(request, ['student', 'admin'])
    const supabase = getSupabaseAdminClient()
    const { tokenId, studentId } = await request.json()

    if (!tokenId || !studentId) {
      return NextResponse.json(
        { error: 'tokenId and studentId are required' },
        { status: 400 }
      )
    }

    if (user.role === 'student' && user.studentId && user.studentId !== studentId) {
      return NextResponse.json({ error: 'Unauthorized student access' }, { status: 403 })
    }

    const { data: token, error: tokenError } = await supabase
      .from('meal_tokens')
      .select('id, status, expires_at')
      .eq('id', tokenId)
      .eq('student_id', studentId)
      .single()

    if (tokenError || !token) {
      if (tokenError) {
        console.error('DB ERROR:', tokenError)
      }
      return NextResponse.json(
        { error: 'Token not found' },
        { status: 404 }
      )
    }

    const now = new Date().getTime()
    const expiresAt = new Date(token.expires_at).getTime()

    if (token.status !== 'VALID') {
      return NextResponse.json(
        { error: `Cannot cancel token with status ${token.status}` },
        { status: 400 }
      )
    }

    if (Number.isFinite(expiresAt) && now >= expiresAt) {
      return NextResponse.json(
        { error: 'Cannot cancel expired token' },
        { status: 400 }
      )
    }

    const { error: updateError } = await supabase
      .from('meal_tokens')
      .update({ status: 'CANCELLED', updated_at: new Date().toISOString() })
      .eq('id', tokenId)
      .eq('student_id', studentId)

    if (updateError) {
      console.error('DB ERROR:', updateError)
      throw updateError
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[v0] Cancel token error:', error)
    return NextResponse.json(
      { error: 'Failed to cancel token' },
      { status: 500 }
    )
  }
}
