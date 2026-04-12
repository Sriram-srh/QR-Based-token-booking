import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/db-service'
import { AuthError, requireRole, verifyAuth } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    verifyAuth(request, ['admin', 'staff'])
    const supabase: any = getSupabaseAdminClient()

    const [counterRes, tokenRes] = await Promise.all([
      supabase
        .from('counters')
        .select('id, name, type, is_active, assigned_staff_id')
        .order('name', { ascending: true }),
      supabase
        .from('meal_tokens')
        .select('counter_id')
        .eq('status', 'USED'),
    ])

    const { data, error } = counterRes
    const { data: tokenRows, error: tokenError } = tokenRes

    if (error) {
      console.error('[api/counters] DB ERROR:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (tokenError) {
      console.error('[api/counters] Token stats DB ERROR:', tokenError)
      return NextResponse.json({ error: tokenError.message }, { status: 500 })
    }

    const servedMap: Record<string, number> = {}
    for (const token of tokenRows || []) {
      const counterId = token?.counter_id
      if (!counterId) {
        continue
      }
      servedMap[counterId] = (servedMap[counterId] || 0) + 1
    }

    const counters = (data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      type: row.type,
      isActive: Boolean(row.is_active),
      assignedStaffId: row.assigned_staff_id || null,
      tokensServed: servedMap[row.id] || 0,
    }))

    return NextResponse.json({ success: true, counters })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[api/counters] Error fetching counters:', error)
    return NextResponse.json({ error: 'Failed to fetch counters' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    requireRole(request, 'admin')
    const supabase: any = getSupabaseAdminClient()
    const { name, type, assignedStaffId } = await request.json()

    if (!name || !String(name).trim()) {
      return NextResponse.json({ error: 'Counter name is required' }, { status: 400 })
    }

    const insertPayload: any = {
      name: String(name).trim(),
      type: String(type || 'General'),
      is_active: true,
      assigned_staff_id: assignedStaffId || null,
    }

    const { data, error } = await supabase
      .from('counters')
      .insert(insertPayload)
      .select('id, name, type, is_active, assigned_staff_id')
      .single()

    if (error) {
      console.error('[api/counters] DB ERROR:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      counter: {
        id: data.id,
        name: data.name,
        type: data.type,
        isActive: Boolean(data.is_active),
        assignedStaffId: data.assigned_staff_id || null,
      },
    }, { status: 201 })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[api/counters] Error creating counter:', error)
    return NextResponse.json({ error: 'Failed to create counter' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    requireRole(request, 'admin')
    const supabase: any = getSupabaseAdminClient()
    const { id, isActive, assignedStaffId } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'Counter id is required' }, { status: 400 })
    }

    const updatePayload: any = {
      updated_at: new Date().toISOString(),
    }

    if (typeof isActive === 'boolean') {
      updatePayload.is_active = isActive
    }

    if (assignedStaffId !== undefined) {
      updatePayload.assigned_staff_id = assignedStaffId || null
    }

    const { data, error } = await supabase
      .from('counters')
      .update(updatePayload)
      .eq('id', id)
      .select('id, name, type, is_active, assigned_staff_id')
      .single()

    if (error) {
      console.error('[api/counters] DB ERROR:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      counter: {
        id: data.id,
        name: data.name,
        type: data.type,
        isActive: Boolean(data.is_active),
        assignedStaffId: data.assigned_staff_id || null,
      },
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[api/counters] Error updating counter:', error)
    return NextResponse.json({ error: 'Failed to update counter' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    requireRole(request, 'admin')
    const supabase: any = getSupabaseAdminClient()
    const id = request.nextUrl.searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Counter id is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('counters')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('[api/counters] DB ERROR:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[api/counters] Error deleting counter:', error)
    return NextResponse.json({ error: 'Failed to delete counter' }, { status: 500 })
  }
}
