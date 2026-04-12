import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { normalizeMealType } from '@/lib/meal-type';

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
  tokenId?: string;
  studentId?: string;
  mealType?: string;
  status?: string;
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

    let { data, error } = await supabase
      .from('meal_tokens')
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
      const fallback = await supabase
        .from('meal_tokens')
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

    return data as MealToken;
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

    let { data, error } = await supabase
      .from('meal_tokens')
      .select('*')
      .or(`qr_code.eq.${qrCode},backup_code.eq.${qrCode}`)
      .single();

    if (error && String(error.message || '').toLowerCase().includes('backup_code')) {
      const fallback = await supabase
        .from('meal_tokens')
        .select('*')
        .eq('qr_code', qrCode)
        .single();

      data = fallback.data;
      error = fallback.error;
    }

    if (error) {
      console.error('[v0] Error fetching meal token:', error);
      return null;
    }

    return data as MealToken;
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

    return data as MealToken;
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
    const { data, error } = await getSupabaseAdminClient()
      .from('meal_tokens')
      .update({
        status: 'USED',
        scanned_at: new Date().toISOString(),
        counter_id: counterId,
      })
      .eq('id', tokenId)
      .select()
      .single();

    if (error) {
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

    return data as MealToken[];
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
    const token = await getMealTokenByQRCode(qrCode);

    if (!token) {
      return {
        success: false,
        error: 'Token not found',
      };
    }

    // Check if token is already used
    if (token.status === 'USED') {
      return {
        success: false,
        error: 'Token already scanned',
        tokenId: token.id,
        studentId: token.student_id,
        mealType: token.meal_type,
        status: token.status,
      };
    }

    // Check if token is expired
    const now = new Date().getTime();
    const expiry = new Date(token.expires_at).getTime();
    if (Number.isFinite(expiry) && now > expiry) {
      return {
        success: false,
        error: 'Token expired',
        tokenId: token.id,
        studentId: token.student_id,
        mealType: token.meal_type,
        status: 'EXPIRED',
      };
    }

    // Check if token is cancelled
    if (token.status === 'CANCELLED') {
      return {
        success: false,
        error: 'Token cancelled',
        tokenId: token.id,
        studentId: token.student_id,
        mealType: token.meal_type,
        status: token.status,
      };
    }

    // Mark token as scanned
    const scannedToken = await markTokenAsScanned(token.id, counterId);

    if (!scannedToken) {
      return {
        success: false,
        error: 'Failed to update token status',
      };
    }

    return {
      success: true,
      tokenId: scannedToken.id,
      studentId: scannedToken.student_id,
      mealType: scannedToken.meal_type,
      status: scannedToken.status,
    };
  } catch (err) {
    console.error('[v0] Exception validating and scanning token:', err);
    return {
      success: false,
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
    const { error } = await getSupabaseAdminClient().from('audit_logs').insert([
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

    // Hash the default password
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Create user account
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert([
        {
          email,
          name,
          password_hash: hashedPassword,
          role: 'student',
          is_active: true,
        },
      ])
      .select()
      .single();

    if (userError || !userData) {
      console.error('[v0] Error creating user:', userError);
      return { success: false, error: userError?.message || 'Failed to create user' };
    }

    // Create student record
    const { data: studentData, error: studentError } = await supabase
      .from('students')
      .insert([
        {
          user_id: userData.id,
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
      // Rollback user creation if student creation fails
      await supabase.from('users').delete().eq('id', userData.id);
      console.error('[v0] Error creating student record:', studentError);
      return { success: false, error: studentError?.message || 'Failed to create student record' };
    }

    return {
      success: true,
      student: {
        id: studentData.id,
        user_id: userData.id,
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
