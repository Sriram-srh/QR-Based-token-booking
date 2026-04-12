import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getSupabaseAdminClient } from '@/lib/db-service';
import { requireRole, AuthError } from '@/lib/auth-middleware';

export async function GET(request: NextRequest) {
  try {
    requireRole(request, 'admin');
    const supabase: any = getSupabaseAdminClient();

    const [staffRes, counterRes] = await Promise.all([
      supabase
        .from('staff')
        .select(`
          id,
          employee_number,
          created_at,
          users:users(id, name, email, is_active)
        `)
        .order('created_at', { ascending: false }),
      supabase
        .from('counters')
        .select('id, name, type, is_active, assigned_staff_id')
        .order('name', { ascending: true }),
    ]);

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
    console.error('[v0] Staff GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch staff accounts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    requireRole(request, 'admin');
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
    console.error('[v0] Staff POST error:', error);
    return NextResponse.json({ error: 'Failed to create staff account' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    requireRole(request, 'admin');
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
    console.error('[v0] Staff PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update counter assignment' }, { status: 500 });
  }
}
