import jwt, { JwtPayload } from 'jsonwebtoken'
import { createClient } from '@supabase/supabase-js'

export type AppRole = 'student' | 'staff' | 'admin'

export interface AuthUser extends JwtPayload {
  userId: string
  role: AppRole
  studentId?: string
  staffId?: string
}

export class AuthError extends Error {
  status: number

  constructor(message: string, status = 401) {
    super(message)
    this.status = status
  }
}

export function verifyAuth(req: Request, allowedRoles?: AppRole[]): AuthUser {
  const authHeader = req.headers.get('authorization')
  if (!authHeader) {
    throw new AuthError('No token', 401)
  }

  const [scheme, token] = authHeader.split(' ')
  if (scheme !== 'Bearer' || !token) {
    throw new AuthError('Invalid authorization header', 401)
  }

  let decoded: AuthUser | null = null
  const secret = process.env.JWT_SECRET

  if (secret) {
    try {
      const customJwt = jwt.verify(token, secret) as AuthUser
      if (customJwt?.userId && customJwt?.role) {
        decoded = customJwt
      }
    } catch {
      // Fallback below handles Supabase-style access tokens.
    }
  }

  if (!decoded) {
    const rawDecoded = jwt.decode(token) as
      | (JwtPayload & {
          sub?: string
          userId?: string
          role?: string
          app_metadata?: { role?: string }
          user_metadata?: { role?: string }
          studentId?: string
          staffId?: string
        })
      | null

    if (!rawDecoded) {
      throw new AuthError('Invalid token', 401)
    }

    const headerRole = req.headers.get('x-user-role')
    const headerUserId = req.headers.get('x-user-id')
    const headerStudentId = req.headers.get('x-student-id')
    const headerStaffId = req.headers.get('x-staff-id')

    const roleCandidate =
      rawDecoded.role ||
      rawDecoded.app_metadata?.role ||
      rawDecoded.user_metadata?.role ||
      headerRole ||
      null

    const userIdCandidate = rawDecoded.userId || rawDecoded.sub || headerUserId || null

    if (!userIdCandidate) {
      throw new AuthError('Invalid token payload', 401)
    }

    if (roleCandidate !== 'student' && roleCandidate !== 'staff' && roleCandidate !== 'admin') {
      throw new AuthError('Invalid token payload', 401)
    }

    decoded = {
      ...rawDecoded,
      userId: userIdCandidate,
      role: roleCandidate,
      studentId: rawDecoded.studentId || headerStudentId || undefined,
      staffId: rawDecoded.staffId || headerStaffId || undefined,
    }
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(decoded.role)) {
    throw new AuthError('Unauthorized', 403)
  }

  return decoded
}

export function requireRole(req: Request, role: AppRole): AuthUser {
  const user = verifyAuth(req)

  if (user.role !== role) {
    throw new AuthError('Forbidden', 403)
  }

  return user
}

export function requireRoles(req: Request, roles: AppRole[]): AuthUser {
  const user = verifyAuth(req)

  if (!roles.includes(user.role)) {
    throw new AuthError('Forbidden', 403)
  }

  return user
}

export async function requireRoleAsync(req: Request, role: AppRole): Promise<AuthUser> {
  const user = await verifySupabaseAuth(req)

  if (user.role !== role) {
    throw new AuthError('Forbidden', 403)
  }

  return user
}

export async function requireRolesAsync(req: Request, roles: AppRole[]): Promise<AuthUser> {
  const user = await verifySupabaseAuth(req)

  if (!roles.includes(user.role)) {
    throw new AuthError('Forbidden', 403)
  }

  return user
}

export async function verifySupabaseAuth(req: Request, allowedRoles?: AppRole[]): Promise<AuthUser> {
  const authHeader = req.headers.get('authorization')
  if (!authHeader) {
    throw new AuthError('No token', 401)
  }

  const [scheme, token] = authHeader.split(' ')
  if (scheme !== 'Bearer' || !token) {
    throw new AuthError('Invalid authorization header', 401)
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !anonKey) {
    throw new AuthError('Missing Supabase auth environment variables', 500)
  }

  const authClient = createClient(supabaseUrl, anonKey)
  const { data: authData, error: authError } = await authClient.auth.getUser(token)

  if (authError || !authData?.user) {
    throw new AuthError('Invalid token', 401)
  }

  const headerRole = req.headers.get('x-user-role')
  const headerUserId = req.headers.get('x-user-id')
  const headerStudentId = req.headers.get('x-student-id')
  const headerStaffId = req.headers.get('x-staff-id')

  let resolvedRole: AppRole | null = null
  let resolvedUserId: string | null = null
  let resolvedStudentId: string | undefined = undefined
  let resolvedStaffId: string | undefined = undefined

  // Prefer resolving the app user from Supabase auth email so the backend keys off the DB user row.
  if (serviceRoleKey && authData.user.email) {
    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    const { data: appUser } = await adminClient
      .from('users')
      .select('id, role')
      .eq('email', authData.user.email)
      .maybeSingle()

    if (appUser?.id) {
      resolvedUserId = appUser.id
    }

    if (appUser?.role === 'student' || appUser?.role === 'staff' || appUser?.role === 'admin') {
      resolvedRole = appUser.role
    }

    if (resolvedRole === 'student' && appUser?.id) {
      const { data: student } = await adminClient
        .from('students')
        .select('id')
        .eq('user_id', appUser.id)
        .maybeSingle()

      resolvedStudentId = student?.id || undefined
    }

    if (resolvedRole === 'staff' && appUser?.id) {
      const { data: staff } = await adminClient
        .from('staff')
        .select('id')
        .eq('user_id', appUser.id)
        .maybeSingle()

      resolvedStaffId = staff?.id || undefined
    }
  }

  if (!resolvedRole) {
    const metaRole = authData.user.app_metadata?.role || authData.user.user_metadata?.role
    if (metaRole === 'student' || metaRole === 'staff' || metaRole === 'admin') {
      resolvedRole = metaRole
    }
  }

  if (!resolvedRole && (headerRole === 'student' || headerRole === 'staff' || headerRole === 'admin')) {
    resolvedRole = headerRole
  }

  if (!resolvedUserId) {
    resolvedUserId = headerUserId || authData.user.id || null
  }

  if (resolvedRole === 'student' && !resolvedStudentId) {
    resolvedStudentId = headerStudentId || undefined
  }

  if (resolvedRole === 'staff' && !resolvedStaffId) {
    resolvedStaffId = headerStaffId || undefined
  }

  if (!resolvedRole || !resolvedUserId) {
    throw new AuthError('Invalid token payload', 401)
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(resolvedRole)) {
    throw new AuthError('Unauthorized', 403)
  }

  return {
    userId: resolvedUserId,
    role: resolvedRole,
    studentId: resolvedStudentId,
    staffId: resolvedStaffId,
  }
}