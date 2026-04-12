import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/db-service';
import { AuthError, verifyAuth } from '@/lib/auth-middleware';

export async function GET(request: NextRequest) {
  try {
    const user = verifyAuth(request);
    const supabase = getSupabaseAdminClient();
    const requestedUserId = request.nextUrl.searchParams.get('userId');

    // Keep compatibility with existing clients, but default to auth context.
    if (requestedUserId && user.role !== 'admin' && user.userId !== requestedUserId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const principalIds = [
      requestedUserId || user.userId,
      user.staffId,
      user.studentId,
    ].filter(Boolean) as string[];

    const orParts = [
      `target_role.eq.${user.role}`,
      'target_role.is.null',
      ...principalIds.map((id) => `user_id.eq.${id}`),
    ];

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .or(orParts.join(','))
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Notifications error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const notifications = (data || []).map((row: any) => ({
      id: row.id,
      message: row.message,
      type: row.type || 'info',
      read: Boolean(row.is_read ?? row.read),
      timestamp: row.created_at,
    }));

    return NextResponse.json({ notifications });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('[v0] Notifications GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}
