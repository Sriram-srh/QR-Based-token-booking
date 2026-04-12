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

  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new AuthError('Server auth is not configured', 500)
  }

  let decoded: AuthUser
  try {
    decoded = jwt.verify(token, secret) as AuthUser
  } catch {
    throw new AuthError('Invalid token', 401)
  }

  if (!decoded?.userId || !decoded?.role) {
    throw new AuthError('Invalid token payload', 401)
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