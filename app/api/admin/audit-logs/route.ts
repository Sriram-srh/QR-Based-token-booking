import { NextRequest, NextResponse } from 'next/server';
import { getAuditLogs } from '@/lib/db-service';
import { verifyAuth, AuthError } from '@/lib/auth-middleware';

export async function GET(request: NextRequest) {
  try {
    verifyAuth(request, ['admin']);
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
    console.error('[v0] Error fetching audit logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}
