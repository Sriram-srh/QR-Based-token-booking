import { createClient } from '@supabase/supabase-js';
import { normalizeMealType } from '@/lib/meal-type';
import { extractTokenLookupFromQR } from '@/lib/qr-utils';

let supabaseClient: ReturnType<typeof createClient> | null = null;
let adminClient: ReturnType<typeof createClient> | null = null;

function getSupabaseClient() {
  if (supabaseClient) {
    return supabaseClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }

  supabaseClient = createClient(supabaseUrl, supabaseKey);
  return supabaseClient;
}

export function getSupabaseAdminClient() {
  if (adminClient) {
    return adminClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase server environment variables');
  }

  adminClient = createClient(supabaseUrl, serviceRoleKey);
  return adminClient;
}

async function waitForSyncedUserRow(supabase: ReturnType<typeof createClient>, userId: string, retries = 5, delayMs = 200) {
  let userRow = null;

  while (retries > 0) {
    const { data } = await supabase
      .from('users')
      .select('id, name, email, role, is_active')
      .eq('id', userId)
      .maybeSingle();

    if (data) {
      userRow = data;
      break;
    }

    await new Promise((resolve) => setTimeout(resolve, delayMs));
    retries--;
  }

  return userRow;
}

export interface MealToken {
  id: string;
  student_id: string;
  meal_type: 'Breakfast' | 'Lunch' | 'Dinner';
  status: 'VALID' | 'USED' | 'EXPIRED' | 'CANCELLED';
  qr_code: string;
  backup_code?: string | null;
  qr_code_image: string | null;
  total_cost: number;
  expires_at: string;
  scanned_at: string | null;
  counter_id: string | null;
  created_at: string;
  updated_at: string;
}

function generateBackupCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

export interface QRScanResult {
  success: boolean;
  reason?: 'INVALID' | 'INVALID_QR_FORMAT' | 'ALREADY_USED' | 'EXPIRED' | 'CANCELLED' | 'INTERNAL_ERROR';
  tokenId?: string;
  studentId?: string;
  mealType?: string;
  status?: string;
  expiresAt?: string;
  error?: string;
}

/**
 * Create a new meal token in the database
 */
export async function createMealToken(
  studentId: string,
  mealType: string,
  qrCode: string,
  qrCodeImage: string | null,
  totalCost: number,
  expiresAt: Date,
  backupCode?: string
): Promise<MealToken | null> {
  try {
    const normalizedMealType = normalizeMealType(mealType)
    if (!normalizedMealType) {
      console.error('[v0] Invalid meal type provided:', mealType)
      return null
    }

    const supabase = getSupabaseAdminClient();

    let { data, error } = await (supabase
      .from('meal_tokens') as any)
      .insert([
        {
          student_id: studentId,
          meal_type: normalizedMealType,
          status: 'VALID',
          qr_code: qrCode,
          backup_code: backupCode || generateBackupCode(),
          qr_code_image: qrCodeImage,
          total_cost: totalCost,
          expires_at: expiresAt.toISOString(),
        },
      ])
      .select()
      .single();

    if (error && String(error.message || '').toLowerCase().includes('backup_code')) {
      const fallback = await (supabase
        .from('meal_tokens') as any)
        .insert([
          {
            student_id: studentId,
            meal_type: normalizedMealType,
            status: 'VALID',
            qr_code: qrCode,
            qr_code_image: qrCodeImage,
            total_cost: totalCost,
            expires_at: expiresAt.toISOString(),
          },
        ])
        .select()
        .single();

      data = fallback.data;
      error = fallback.error;
    }

    if (error) {
      console.error('[v0] Error creating meal token:', error);
      return null;
    }

    return data as unknown as MealToken;
  } catch (err) {
    console.error('[v0] Exception creating meal token:', err);
    return null;
  }
}

/**
 * Get meal token by QR code
 */
export async function getMealTokenByQRCode(qrCode: string): Promise<MealToken | null> {
  try {
    const supabase = getSupabaseClient();
    const { tokenLookup } = extractTokenLookupFromQR(qrCode);

    if (!tokenLookup) {
      return null;
    }

    let { data, error } = await supabase
      .from('meal_tokens')
      .select('*')
      .or(`qr_code.eq.${tokenLookup},backup_code.eq.${tokenLookup}`)
      .single();

    if (error && String(error.message || '').toLowerCase().includes('backup_code')) {
      const fallback = await supabase
        .from('meal_tokens')
        .select('*')
        .eq('qr_code', tokenLookup)
        .single();

      data = fallback.data;
      error = fallback.error;
    }

    if (error) {
      console.error('[v0] Error fetching meal token:', error);
      return null;
    }

    return data as unknown as MealToken;
  } catch (err) {
    console.error('[v0] Exception fetching meal token:', err);
    return null;
  }
}

/**
 * Get meal token by ID
 */
export async function getMealTokenById(tokenId: string): Promise<MealToken | null> {
  try {
    const { data, error } = await getSupabaseClient()
      .from('meal_tokens')
      .select('*')
      .eq('id', tokenId)
      .single();

    if (error) {
      console.error('[v0] Error fetching meal token by ID:', error);
      return null;
    }

    return data as unknown as MealToken;
  } catch (err) {
    console.error('[v0] Exception fetching meal token by ID:', err);
    return null;
  }
}

/**
 * Update meal token status when scanned
 */
export async function markTokenAsScanned(
  tokenId: string,
  counterId: string
): Promise<MealToken | null> {
  try {
    const { data, error } = await (getSupabaseAdminClient()
      .from('meal_tokens') as any)
      .update({
        status: 'USED',
        scanned_at: new Date().toISOString(),
        counter_id: counterId,
      })
      .eq('id', tokenId)
      .eq('status', 'VALID')
      .select()
      .single();

    if (error) {
      if (String((error as any)?.code || '').toUpperCase() === 'PGRST116') {
        return null;
      }
      console.error('[v0] Error marking token as scanned:', error);
      return null;
    }

    return data as MealToken;
  } catch (err) {
    console.error('[v0] Exception marking token as scanned:', err);
    return null;
  }
}

/**
 * Get student tokens for a meal type
 */
export async function getStudentTokensByMealType(
  studentId: string,
  mealType: string
): Promise<MealToken[]> {
  try {
    const { data, error } = await getSupabaseClient()
      .from('meal_tokens')
      .select('*')
      .eq('student_id', studentId)
      .eq('meal_type', mealType)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[v0] Error fetching student tokens:', error);
      return [];
    }

    return data as unknown as MealToken[];
  } catch (err) {
    console.error('[v0] Exception fetching student tokens:', err);
    return [];
  }
}

/**
 * Validate QR token on scan
 */
export async function validateAndScanToken(
  qrCode: string,
  counterId: string
): Promise<QRScanResult> {
  try {
    if (!String(qrCode || '').trim()) {
      return {
        success: false,
        reason: 'INVALID_QR_FORMAT',
        error: 'Invalid token payload',
      };
    }

    const token = await getMealTokenByQRCode(qrCode);

    if (!token) {
      return {
        success: false,
        reason: 'INVALID',
        error: 'Token not found',
      };
    }

    // Check if token is already used
    if (token.status === 'USED') {
      return {
        success: false,
        reason: 'ALREADY_USED',
        error: 'Token already scanned',
        tokenId: token.id,
        studentId: token.student_id,
        mealType: token.meal_type,
        status: token.status,
        expiresAt: token.expires_at,
      };
    }

    // Check if token is expired
    const now = new Date().getTime();
    const expiry = new Date(token.expires_at).getTime();
    if (Number.isFinite(expiry) && now > expiry) {
      return {
        success: false,
        reason: 'EXPIRED',
        error: 'Token expired',
        tokenId: token.id,
        studentId: token.student_id,
        mealType: token.meal_type,
        status: 'EXPIRED',
        expiresAt: token.expires_at,
      };
    }

    // Check if token is cancelled
    if (token.status === 'CANCELLED') {
      return {
        success: false,
        reason: 'CANCELLED',
        error: 'Token cancelled',
        tokenId: token.id,
        studentId: token.student_id,
        mealType: token.meal_type,
        status: token.status,
        expiresAt: token.expires_at,
      };
    }

    // Mark token as scanned
    const scannedToken = await markTokenAsScanned(token.id, counterId);

    if (!scannedToken) {
      const latestToken = await getMealTokenById(token.id);
      if (latestToken?.status === 'USED') {
        return {
          success: false,
          reason: 'ALREADY_USED',
          error: 'Token already scanned',
          tokenId: latestToken.id,
          studentId: latestToken.student_id,
          mealType: latestToken.meal_type,
          status: latestToken.status,
          expiresAt: latestToken.expires_at,
        };
      }

      return {
        success: false,
        reason: 'INTERNAL_ERROR',
        error: 'Failed to update token status',
      };
    }

    return {
      success: true,
      tokenId: scannedToken.id,
      studentId: scannedToken.student_id,
      mealType: scannedToken.meal_type,
      status: scannedToken.status,
      expiresAt: scannedToken.expires_at,
    };
  } catch (err) {
    console.error('[v0] Exception validating and scanning token:', err);
    return {
      success: false,
      reason: 'INTERNAL_ERROR',
      error: 'An error occurred during validation',
    };
  }
}

/**
 * Get student info for verification
 */
export async function getStudentInfo(studentId: string) {
  try {
    const { data, error } = await getSupabaseClient()
      .from('students')
      .select('*, users(name, email)')
      .eq('id', studentId)
      .single();

    if (error) {
      console.error('[v0] Error fetching student info:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.error('[v0] Exception fetching student info:', err);
    return null;
  }
}

/**
 * Log audit event
 */
export async function logAuditEvent(
  action: string,
  userId: string | null,
  userRole: string | null,
  details: Record<string, unknown>
): Promise<boolean> {
  try {
    const { error } = await (getSupabaseAdminClient().from('audit_logs') as any).insert([
      {
        action,
        user_id: userId,
        user_role: userRole,
        details,
        timestamp: new Date().toISOString(),
      },
    ]);

    if (error) {
      console.error('[v0] Error logging audit event:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[v0] Exception logging audit event:', err);
    return false;
  }
}

/**
 * Get all active students
 */
export async function getActiveStudents() {
  try {
    const { data, error } = await getSupabaseAdminClient()
      .from('students')
      .select('id, register_number, hostel, room, phone, photo_url, users!inner(id, name, email, is_active)')
      .eq('users.is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[v0] Error fetching students:', error);
      return [];
    }

    return data;
  } catch (err) {
    console.error('[v0] Exception fetching students:', err);
    return [];
  }
}

/**
 * Create a new student account with automatic user login creation
 */
export async function createStudent(
  name: string,
  email: string,
  registerNumber: string,
  hostel: string,
  room: string,
  phone: string,
  photoUrl?: string
) {
  try {
    const supabase = getSupabaseAdminClient();

    const defaultPassword = 'Default@123';

    const { data: authCreated, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: defaultPassword,
      email_confirm: true,
      app_metadata: { role: 'student' },
      user_metadata: { role: 'student', name },
    });

    if (authError || !authCreated?.user?.id) {
      console.error('[v0] Error creating auth user:', authError);
      return { success: false, error: authError?.message || 'Failed to create auth user' };
    }

    const authUserId = authCreated.user.id;

    const userRow = await waitForSyncedUserRow(supabase, authUserId);

    if (!userRow) {
      await supabase.auth.admin.deleteUser(authUserId);
      console.error('[v0] Error waiting for synced user row:', authUserId);
      return { success: false, error: 'User sync failed' };
    }

    // Trigger will auto-create users row from auth.users user_metadata
    // Just create student record linked to auth user
    const { data: studentData, error: studentError } = await (supabase
      .from('students') as any)
      .insert([
        {
          user_id: authUserId,
          register_number: registerNumber,
          hostel,
          room,
          phone,
          photo_url: photoUrl || null,
        },
      ])
      .select()
      .single();

    if (studentError || !studentData) {
      // Rollback auth creation if student creation fails
      await supabase.auth.admin.deleteUser(authUserId);
      console.error('[v0] Error creating student record:', studentError);
      return { success: false, error: studentError?.message || 'Failed to create student record' };
    }

    return {
      success: true,
      student: {
        id: studentData.id,
        user_id: authUserId,
        name,
        email,
        registerNumber,
        hostel,
        room,
        phone,
        photoUrl: photoUrl || null,
      },
    };
  } catch (err) {
    console.error('[v0] Exception creating student:', err);
    return { success: false, error: (err as Error).message || 'Unknown error' };
  }
}

/**
 * Get audit logs for admin reporting
 */
export async function getAuditLogs(limit = 500) {
  try {
    const { data, error } = await getSupabaseAdminClient()
      .from('audit_logs')
      .select('id, action, user_role, details, timestamp, users(name, email)')
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[v0] Error fetching audit logs:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('[v0] Exception fetching audit logs:', err);
    return [];
  }
}
