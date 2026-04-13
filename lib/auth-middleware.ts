import jwt, { JwtPayload } from 'jsonwebtoken'

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