import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getSupabaseAdminClient } from '@/lib/db-service';
import { requireRoleAsync, AuthError } from '@/lib/auth-middleware';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRoleAsync(request, 'admin');
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!auth.userId) {
      return NextResponse.json({ error: 'Invalid user' }, { status: 400 });
    }
    if (!auth.role || auth.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.log('[api/admin/staff] Auth resolved:', { userId: auth.userId, role: auth.role });

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('[api/admin/staff] Missing SUPABASE_SERVICE_ROLE_KEY');
      return NextResponse.json({ error: 'Server misconfigured: missing SUPABASE_SERVICE_ROLE_KEY' }, { status: 500 });
    }

    const supabase: any = getSupabaseAdminClient();

    let staffRes = await supabase
      .from('staff')
      .select(`
        id,
        employee_number,
        created_at,
        users:users(id, name, email, is_active)
      `)
      .order('created_at', { ascending: false });

    // Fallback for environments where nested users relation is unavailable in PostgREST cache.
    if (staffRes.error && /users/i.test(String(staffRes.error.message || ''))) {
      const plainStaffRes = await supabase
        .from('staff')
        .select('id, employee_number, created_at, user_id')
        .order('created_at', { ascending: false });

      if (!plainStaffRes.error && Array.isArray(plainStaffRes.data)) {
        const userIds = plainStaffRes.data.map((s: any) => s.user_id).filter(Boolean);
        let userMap: Record<string, any> = {};

        if (userIds.length > 0) {
          const usersRes = await supabase
            .from('users')
            .select('id, name, email, is_active')
            .in('id', userIds);

          if (!usersRes.error) {
            userMap = Object.fromEntries((usersRes.data || []).map((u: any) => [u.id, u]));
          }
        }

        staffRes = {
          data: plainStaffRes.data.map((s: any) => ({
            ...s,
            users: s.user_id ? userMap[s.user_id] || null : null,
          })),
          error: null,
        };
      }
    }

    let counterRes = await supabase
      .from('counters')
      .select('id, name, type, is_active, assigned_staff_id')
      .order('name', { ascending: true });

    if (counterRes.error && /assigned_staff_id/i.test(String(counterRes.error.message || ''))) {
      counterRes = await supabase
        .from('counters')
        .select('id, name, type, is_active')
        .order('name', { ascending: true });
    }

    if (staffRes.error) {
      console.error('DB ERROR:', staffRes.error);
      throw staffRes.error;
    }

    if (counterRes.error) {
      console.error('DB ERROR:', counterRes.error);
      throw counterRes.error;
    }

    const counters = counterRes.data || [];

    const staff = (staffRes.data || []).map((row: any) => ({
      id: row.id,
      userId: row.users?.id,
      name: row.users?.name || 'Unknown',
      email: row.users?.email || '',
      employeeNumber: row.employee_number,
      assignedCounter: counters.find((counter: any) => counter.assigned_staff_id === row.id)?.id || null,
      assignedCounterName: counters.find((counter: any) => counter.assigned_staff_id === row.id)?.name || null,
      assignedCounterType: counters.find((counter: any) => counter.assigned_staff_id === row.id)?.type || null,
    }));

    const countersPayload = counters.map((row: any) => ({
      id: row.id,
      name: row.name,
      type: row.type,
      isActive: Boolean(row.is_active),
      tokensServed: 0,
      assignedStaff: row.assigned_staff_id || null,
    }));

    return NextResponse.json({ success: true, staff, counters: countersPayload });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('[v0] Staff GET error:', JSON.stringify(error, Object.getOwnPropertyNames(error || {}), 2));
    return NextResponse.json({ error: 'Failed to fetch staff accounts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRoleAsync(request, 'admin');
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!auth.userId) {
      return NextResponse.json({ error: 'Invalid user' }, { status: 400 });
    }
    if (!auth.role || auth.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const supabase: any = getSupabaseAdminClient();
    const { name, email, employeeNumber } = await request.json();

    if (!name || !email || !employeeNumber) {
      return NextResponse.json({ error: 'name, email and employeeNumber are required' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash('password123', 10);

    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert([
        {
          email,
          name,
          password_hash: hashedPassword,
          role: 'staff',
          is_active: true,
        },
      ])
      .select('id, name, email')
      .single();

    if (userError || !userData) {
      console.error('DB ERROR:', userError);
      return NextResponse.json({ error: userError?.message || 'Failed to create user' }, { status: 500 });
    }

    const { data: staffData, error: staffError } = await supabase
      .from('staff')
      .insert([
        {
          user_id: userData.id,
          employee_number: employeeNumber,
        },
      ])
      .select('id, employee_number')
      .single();

    if (staffError || !staffData) {
      await supabase.from('users').delete().eq('id', userData.id);
      console.error('DB ERROR:', staffError);
      return NextResponse.json({ error: staffError?.message || 'Failed to create staff' }, { status: 500 });
    }

    return NextResponse.json(
      {
        success: true,
        staff: {
          id: staffData.id,
          userId: userData.id,
          name: userData.name,
          email: userData.email,
          employeeNumber: staffData.employee_number,
          assignedCounter: null,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('[v0] Staff POST error:', JSON.stringify(error, Object.getOwnPropertyNames(error || {}), 2));
    return NextResponse.json({ error: 'Failed to create staff account' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireRoleAsync(request, 'admin');
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!auth.userId) {
      return NextResponse.json({ error: 'Invalid user' }, { status: 400 });
    }
    if (!auth.role || auth.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const supabase: any = getSupabaseAdminClient();

    const { staffId, counterId } = await request.json();

    if (!staffId) {
      return NextResponse.json({ error: 'staffId is required' }, { status: 400 });
    }

    const { error: clearError } = await supabase
      .from('counters')
      .update({ assigned_staff_id: null, updated_at: new Date().toISOString() })
      .eq('assigned_staff_id', staffId);

    if (clearError) {
      console.error('DB ERROR:', clearError);
      return NextResponse.json({ error: clearError.message }, { status: 500 });
    }

    if (!counterId) {
      return NextResponse.json({ success: true });
    }

    const { data: updatedCounter, error } = await supabase
      .from('counters')
      .update({ assigned_staff_id: staffId, updated_at: new Date().toISOString() })
      .eq('id', counterId)
      .select('id');

    if (error) {
      console.error('DB ERROR:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!updatedCounter || updatedCounter.length === 0) {
      return NextResponse.json({ error: 'Counter not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('[v0] Staff PATCH error:', JSON.stringify(error, Object.getOwnPropertyNames(error || {}), 2));
    return NextResponse.json({ error: 'Failed to update counter assignment' }, { status: 500 });
  }
}
