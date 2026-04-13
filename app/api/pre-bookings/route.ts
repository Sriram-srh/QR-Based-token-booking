import { NextRequest, NextResponse } from 'next/server'
import { createQRCodeId, generateQRCodeDataUrl } from '@/lib/qr-utils'
import { getSupabaseAdminClient } from '@/lib/db-service'
import { verifySupabaseAuth, AuthError } from '@/lib/auth-middleware'
import { normalizeMealType } from '@/lib/meal-type'
import { z } from 'zod'

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function generateBackupCode() {
  return Math.random().toString(36).substring(2, 10).toUpperCase()
}

export async function GET(request: NextRequest) {
  try {
    const user = await verifySupabaseAuth(request, ['student', 'admin'])
    const supabase: any = getSupabaseAdminClient()
    const studentId = request.nextUrl.searchParams.get('studentId')

    if (!studentId) {
      return NextResponse.json({ error: 'studentId is required' }, { status: 400 })
    }

    if (user.role === 'student' && user.studentId && user.studentId !== studentId) {
      return NextResponse.json({ error: 'Unauthorized student access' }, { status: 403 })
    }

    const { data, error } = await supabase
      .from('pre_bookings')
      .select('id, student_id, meal_date, meal_type, status, total_cost, qr_token_id, created_at')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('DB ERROR:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: data || [], preBookings: data || [] })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('API ERROR:', error)
    return NextResponse.json({ error: 'Failed to fetch pre-bookings' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifySupabaseAuth(request, ['student', 'admin'])
    const supabase: any = getSupabaseAdminClient()
    const body = await request.json()
    const parsed = z.object({
      studentId: z.string().uuid(),
      mealId: z.string().uuid().optional(),
      mealDate: z.string(),
      mealType: z.string(),
      totalCost: z.number(),
      items: z.array(z.object({
        itemId: z.string(),
        name: z.string().optional(),
        cost: z.number().optional(),
        quantity: z.number().int().positive(),
      })).optional(),
    }).safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request payload' }, { status: 400 })
    }

    const { studentId, mealDate, totalCost, items } = parsed.data
    const mealType = normalizeMealType(parsed.data.mealType)

    if (!mealType) {
      return NextResponse.json(
        { error: 'Invalid meal type. Use Breakfast, Lunch, or Dinner.' },
        { status: 400 }
      )
    }

    let { mealId } = parsed.data

    if (user.role === 'student' && user.studentId && user.studentId !== studentId) {
      return NextResponse.json({ error: 'Unauthorized student access' }, { status: 403 })
    }

    if (!mealId) {
      const { data: mealRow } = await supabase
        .from('meals')
        .select('id')
        .eq('meal_date', mealDate)
        .eq('type', mealType)
        .maybeSingle()

      mealId = mealRow?.id
    }

    if (!mealId) {
      return NextResponse.json({ error: 'Meal not found for date/type' }, { status: 404 })
    }

    const { data: existing, error: existingError } = await supabase
      .from('pre_bookings')
      .select('id')
      .eq('student_id', studentId)
      .eq('meal_date', mealDate)
      .eq('meal_type', mealType)
      .in('status', ['PENDING', 'ACTIVE'])
      .maybeSingle()

    if (existingError) {
      console.error('DB ERROR:', existingError)
      throw existingError
    }

    if (existing) {
      return NextResponse.json({ error: 'Pre-booking already exists for this meal' }, { status: 409 })
    }

    const { data: rpcData, error: rpcError } = await supabase.rpc('book_meal', {
      p_student_id: studentId,
      p_meal_id: mealId,
      p_total_cost: totalCost,
    })

    if (rpcError || !rpcData) {
      console.error('DB ERROR:', rpcError)
      return NextResponse.json({ error: rpcError?.message || 'Booking failed' }, { status: 409 })
    }

    const preBookingId = String(rpcData)
    const { data: preBooking, error: preBookingError } = await supabase
      .from('pre_bookings')
      .select('id, student_id, meal_date, meal_type, status, total_cost, qr_token_id, created_at')
      .eq('id', preBookingId)
      .single()

    if (preBookingError || !preBooking) {
      console.error('DB ERROR:', preBookingError)
      return NextResponse.json({ error: preBookingError?.message || 'Failed to read booking' }, { status: 500 })
    }

    const timestamp = Date.now()
    const qrCode = createQRCodeId(studentId, mealType, timestamp)
    const backupCode = generateBackupCode()
    const qrCodeImage = await generateQRCodeDataUrl({
      tokenId: qrCode,
      studentId,
      mealType,
      date: mealDate,
      timestamp,
    })

    const expiresAt = new Date(mealDate)
    expiresAt.setHours(23, 59, 59, 999)

    let token: any = null
    let tokenInsertError: any = null

    const tokenInsert = await supabase
      .from('meal_tokens')
      .insert({
        student_id: studentId,
        meal_type: mealType,
        status: 'VALID',
        qr_code: qrCode,
        backup_code: backupCode,
        qr_code_image: qrCodeImage,
        total_cost: totalCost,
        expires_at: expiresAt.toISOString(),
      })
      .select('id')
      .single()

    token = tokenInsert.data
    tokenInsertError = tokenInsert.error

    // Backward compatibility if backup_code column is unavailable
    if (tokenInsertError && String(tokenInsertError.message || '').toLowerCase().includes('backup_code')) {
      const tokenFallbackInsert = await supabase
        .from('meal_tokens')
        .insert({
          student_id: studentId,
          meal_type: mealType,
          status: 'VALID',
          qr_code: qrCode,
          qr_code_image: qrCodeImage,
          total_cost: totalCost,
          expires_at: expiresAt.toISOString(),
        })
        .select('id')
        .single()

      token = tokenFallbackInsert.data
      tokenInsertError = tokenFallbackInsert.error
    }

    if (tokenInsertError || !token) {
      console.error('DB ERROR:', tokenInsertError)
      // Keep API behavior explicit: if token creation fails, remove orphan pre-booking row.
      await supabase.from('pre_bookings').delete().eq('id', preBooking.id)
      return NextResponse.json({ error: tokenInsertError?.message || 'Failed to create meal token' }, { status: 500 })
    }

    const { error: preBookingUpdateError } = await supabase
      .from('pre_bookings')
      .update({ qr_token_id: token.id, updated_at: new Date().toISOString() })
      .eq('id', preBooking.id)

    if (preBookingUpdateError) {
      console.error('DB ERROR:', preBookingUpdateError)
      return NextResponse.json({ error: preBookingUpdateError.message }, { status: 500 })
    }

    const validItems = Array.isArray(items)
      ? items.filter((item: any) => item && isUuid(item.itemId) && typeof item.quantity === 'number' && item.quantity > 0)
      : []

    if (validItems.length > 0) {
      const itemRows = validItems.map((item: any) => ({
        pre_booking_id: preBooking.id,
        menu_item_id: item.itemId,
        name: item.name,
        cost: item.cost,
        quantity: item.quantity,
      }))

      const { error: itemError } = await supabase.from('pre_booking_items').insert(itemRows)
      if (itemError) {
        // Keep core pre-booking row even if line-item write fails due menu-item mismatches.
        console.error('DB ERROR:', itemError)
      }

      const tokenItemRows = validItems.map((item: any) => ({
        token_id: token.id,
        menu_item_id: item.itemId,
        name: String(item.name || 'Menu Item'),
        cost: Number(item.cost || 0),
        quantity: Number(item.quantity || 1),
      }))

      const { error: tokenItemsError } = await supabase.from('meal_token_items').insert(tokenItemRows)
      if (tokenItemsError) {
        console.error('DB ERROR:', tokenItemsError)
      }
    }

    return NextResponse.json({ preBooking: { ...preBooking, qr_token_id: token.id } }, { status: 201 })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[v0] Create pre-booking error:', error)
    return NextResponse.json({ error: 'Failed to create pre-booking' }, { status: 500 })
  }
}
