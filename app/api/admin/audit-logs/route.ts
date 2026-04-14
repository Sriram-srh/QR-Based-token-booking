import { NextRequest, NextResponse } from 'next/server';
import { getAuditLogs } from '@/lib/db-service';
import { verifySupabaseAuth, AuthError } from '@/lib/auth-middleware';

export async function GET(request: NextRequest) {
  try {
    const auth = await verifySupabaseAuth(request, ['admin']);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!auth.userId) {
      return NextResponse.json({ error: 'Invalid user' }, { status: 400 });
    }
    if (!auth.role || auth.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const rows = await getAuditLogs();

    const logs = rows.map((row: any) => {
      const details = row.details;
      const detailsText = typeof details === 'string' ? details : JSON.stringify(details || {});

      return {
        id: row.id,
        action: row.action,
        user: row.users?.name || row.users?.email || 'System',
        role: row.user_role || 'admin',
        details: detailsText,
        timestamp: row.timestamp,
      };
    });

    return NextResponse.json({ success: true, logs });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('[v0] Error fetching audit logs:', JSON.stringify(error, Object.getOwnPropertyNames(error || {}), 2));
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}
