import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/db-service';
import { AuthError, verifyAuth } from '@/lib/auth-middleware';

export async function POST(request: NextRequest) {
  try {
    const user = verifyAuth(request);
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const allowedPrincipalIds = [user.userId, user.studentId, user.staffId].filter((value): value is string => Boolean(value));
    if (user.role !== 'admin' && !allowedPrincipalIds.includes(userId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = getSupabaseAdminClient() as any;
    const baseQuery = supabase.from('notifications') as any;
    const orParts = [
      ...allowedPrincipalIds.map((id: string) => `user_id.eq.${id}`),
      `target_role.eq.${user.role}`,
      'target_role.is.null',
    ];

    let { error } = await baseQuery
      .update({ is_read: true })
      .or(orParts.join(','));

    if (error && String(error.message || '').toLowerCase().includes('is_read')) {
      ({ error } = await (supabase.from('notifications') as any)
        .update({ read: true })
        .or(orParts.join(',')));
    }

    if (error) {
      console.error('DB ERROR:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('[v0] Notifications read-all error:', error);
    return NextResponse.json({ error: 'Failed to mark notifications as read' }, { status: 500 });
  }
}
