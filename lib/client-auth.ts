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

  return {
    Authorization: `Bearer ${token}`,
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