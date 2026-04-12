import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/db-service';
import { AuthError, verifyAuth } from '@/lib/auth-middleware';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = verifyAuth(request);
    const { id } = await context.params;
    const body = await request.json();
    const { userId, read } = body;

    if (!id || !userId || typeof read !== 'boolean') {
      return NextResponse.json({ error: 'id, userId and read are required' }, { status: 400 });
    }

    if (user.role !== 'admin' && user.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase: any = getSupabaseAdminClient();
    const { error } = await supabase
      .from('notifications')
      .update({ read })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('[v0] Notifications PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
  }
}
