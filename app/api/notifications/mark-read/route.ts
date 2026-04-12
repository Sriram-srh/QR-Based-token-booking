import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/db-service';
import { AuthError, verifyAuth } from '@/lib/auth-middleware';

export async function POST(request: NextRequest) {
  try {
    const user = verifyAuth(request);
    const { id, userId } = await request.json();

    if (!id || !userId) {
      return NextResponse.json({ error: 'id and userId are required' }, { status: 400 });
    }

    const allowedPrincipalIds = [user.userId, user.studentId, user.staffId].filter(Boolean);
    if (user.role !== 'admin' && !allowedPrincipalIds.includes(userId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = getSupabaseAdminClient() as any;
    const { data: notification, error: fetchError } = await supabase
      .from('notifications')
      .select('id, user_id, target_role')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) {
      console.error('Notifications mark-read fetch error:', fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    const canAccess =
      user.role === 'admin' ||
      (notification.user_id && allowedPrincipalIds.includes(notification.user_id)) ||
      notification.target_role === user.role ||
      notification.target_role == null;

    if (!canAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);

    if (error && String(error.message || '').toLowerCase().includes('is_read')) {
      ({ error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id));
    }

    if (error) {
      console.error('Notifications mark-read error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('[v0] Notifications mark-read route error:', error);
    return NextResponse.json({ error: 'Failed to mark notification as read' }, { status: 500 });
  }
}
