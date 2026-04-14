import { getSupabase } from '@/lib/supabase'

function resolveStoredToken(): string | null {
  if (typeof window === 'undefined') {
    return null
  }

  const directToken =
    window.localStorage.getItem('auth_token') ||
    window.localStorage.getItem('token')

  if (directToken) {
    return directToken
  }

  // Fallback to Supabase persisted auth storage key format (sb-<project-ref>-auth-token).
  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i)
    if (!key || !key.startsWith('sb-') || !key.endsWith('-auth-token')) {
      continue
    }

    const raw = window.localStorage.getItem(key)
    if (!raw) {
      continue
    }

    try {
      const parsed = JSON.parse(raw)

      if (typeof parsed?.access_token === 'string') {
        return parsed.access_token
      }

      if (typeof parsed?.currentSession?.access_token === 'string') {
        return parsed.currentSession.access_token
      }

      if (typeof parsed?.session?.access_token === 'string') {
        return parsed.session.access_token
      }

      if (Array.isArray(parsed)) {
        const firstWithToken = parsed.find((entry: any) => typeof entry?.access_token === 'string')
        if (firstWithToken?.access_token) {
          return firstWithToken.access_token
        }
      }
    } catch {
      // Ignore malformed storage entries and continue searching.
    }
  }

  return null
}

function resolveStoredUser(): any {
  if (typeof window === 'undefined') {
    return null
  }

  const userRaw = window.localStorage.getItem('user')
  let user: any = null

  if (userRaw) {
    try {
      user = JSON.parse(userRaw)
    } catch {
      user = null
    }
  }

  return user
}

export function getAuthHeaders(): Record<string, string> {
  const token = resolveStoredToken()
  if (!token) {
    return {}
  }

  const user = resolveStoredUser()

  return {
    Authorization: `Bearer ${token}`,
    ...(user?.role ? { 'X-User-Role': String(user.role) } : {}),
    ...(user?.id ? { 'X-User-Id': String(user.id) } : {}),
    ...(user?.studentId ? { 'X-Student-Id': String(user.studentId) } : {}),
    ...(user?.staffId ? { 'X-Staff-Id': String(user.staffId) } : {}),
  }
}

export async function getAuthHeadersAsync(): Promise<Record<string, string>> {
  if (typeof window === 'undefined') {
    return {}
  }

  try {
    const supabase = getSupabase()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    const token = session?.access_token || resolveStoredToken()
    if (!token) {
      return {}
    }

    const user = resolveStoredUser()

    return {
      Authorization: `Bearer ${token}`,
      ...(user?.role ? { 'X-User-Role': String(user.role) } : {}),
      ...(user?.id ? { 'X-User-Id': String(user.id) } : {}),
      ...(user?.studentId ? { 'X-Student-Id': String(user.studentId) } : {}),
      ...(user?.staffId ? { 'X-Staff-Id': String(user.staffId) } : {}),
    }
  } catch {
    return getAuthHeaders()
  }
}

export function isAuthFailureStatus(status: number): boolean {
  return status === 401 || status === 403
}

export function clearAuthSession(): void {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem('user')
  window.localStorage.removeItem('auth_token')
  window.localStorage.removeItem('token')
}

export async function parseJsonSafe(response: Response): Promise<any> {
  const raw = await response.text()
  if (!raw) {
    return {}
  }

  try {
    return JSON.parse(raw)
  } catch {
    return { raw }
  }
}