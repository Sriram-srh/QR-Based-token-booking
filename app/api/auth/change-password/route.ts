import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getSupabaseAdminClient } from '@/lib/db-service';

export async function POST(request: NextRequest) {
  try {
    const { userId, currentPassword, newPassword } = await request.json();

    if (!userId || !currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'userId, currentPassword and newPassword are required' },
        { status: 400 }
      );
    }

    if (String(newPassword).length < 6) {
      return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();

    const { data: userRow, error: userError } = await supabase
      .from('users')
      .select('id, password_hash')
      .eq('id', userId)
      .single();

    if (userError || !userRow) {
      if (userError) {
        console.error('DB ERROR:', userError);
      }
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const matches = await bcrypt.compare(currentPassword, userRow.password_hash);
    if (!matches) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    const { error: updateError } = await supabase
      .from('users')
      .update({ password_hash: hashed, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (updateError) {
      console.error('DB ERROR:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[v0] Change password error:', error);
    return NextResponse.json({ error: 'Failed to update password' }, { status: 500 });
  }
}
