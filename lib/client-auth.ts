export function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') {
    return {}
  }

  const token =
    window.localStorage.getItem('auth_token') ||
    window.localStorage.getItem('token')
  if (!token) {
    return {}
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

  return {
    Authorization: `Bearer ${token}`,
    ...(user?.role ? { 'X-User-Role': String(user.role) } : {}),
    ...(user?.id ? { 'X-User-Id': String(user.id) } : {}),
    ...(user?.studentId ? { 'X-Student-Id': String(user.studentId) } : {}),
    ...(user?.staffId ? { 'X-Staff-Id': String(user.staffId) } : {}),
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