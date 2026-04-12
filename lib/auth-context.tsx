"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"

export type UserType = 'student' | 'staff' | 'admin'

interface User {
  id: string
  email: string
  name: string
  role: UserType
  userType: UserType
  registerNumber?: string
  hostel?: string
  room?: string
  phone?: string
  photoUrl?: string
  studentId?: string
  staffId?: string
  counterId?: string
  counterName?: string
}

interface StudentProfile {
  id: string
  name: string
  email: string
  registerNumber?: string
  hostel?: string
  room?: string
  phone?: string
  photoUrl?: string
}

interface AuthState {
  isLoggedIn: boolean
  user: User | null
  loading: boolean
  error: string | null
}

interface AuthContextType extends AuthState {
  role: UserType | null
  student: StudentProfile | null
  login: (email: string, password: string, userType: UserType) => Promise<void>
  logout: () => void
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.')
    if (parts.length < 2) return null
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
    const json = atob(padded)
    return JSON.parse(json)
  } catch {
    return null
  }
}

function normalizeUser(rawUser: any): User {
  const role = (rawUser?.role || rawUser?.userType) as UserType

  if (role !== 'student' && role !== 'staff' && role !== 'admin') {
    throw new Error('Invalid user role in auth payload')
  }

  return {
    id: rawUser.id,
    email: rawUser.email,
    name: rawUser.name,
    role,
    userType: role,
    registerNumber: rawUser.registerNumber || rawUser.register_number,
    hostel: rawUser.hostel,
    room: rawUser.room,
    phone: rawUser.phone,
    photoUrl: rawUser.photoUrl || rawUser.photo_url,
    studentId: rawUser.studentId || rawUser.student_id,
    staffId: rawUser.staffId || rawUser.staff_id,
    counterId: rawUser.counterId || rawUser.counter_id,
    counterName: rawUser.counterName || rawUser.counter_name,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({
    isLoggedIn: false,
    user: null,
    loading: false,
    error: null,
  })

  // Check for stored session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    const storedToken = localStorage.getItem('auth_token') || localStorage.getItem('token')

    // Do not restore a session without its JWT token.
    if (storedUser && !storedToken) {
      localStorage.removeItem('user')
      setAuth({ isLoggedIn: false, user: null, loading: false, error: null })
      return
    }

    if (storedUser) {
      try {
        const parsedUser = normalizeUser(JSON.parse(storedUser))
        const payload = storedToken ? decodeJwtPayload(storedToken) : null

        // Backfill staff fields for previously cached sessions that predate staffId persistence.
        if (parsedUser.role === 'staff' && !parsedUser.staffId && payload) {
          const payloadStaffId = typeof payload.staffId === 'string' ? payload.staffId : undefined
          const payloadCounterId = typeof payload.counterId === 'string' ? payload.counterId : undefined

          if (payloadStaffId) {
            parsedUser.staffId = payloadStaffId
          }

          if (payloadCounterId && !parsedUser.counterId) {
            parsedUser.counterId = payloadCounterId
          }

          localStorage.setItem('user', JSON.stringify(parsedUser))
        }

        setAuth(prev => ({
          ...prev,
          isLoggedIn: true,
          user: parsedUser
        }))
      } catch (err) {
        localStorage.removeItem('user')
        localStorage.removeItem('auth_token')
        localStorage.removeItem('token')
      }
    }
  }, [])

  const login = useCallback(async (email: string, password: string, userType: UserType) => {
    setAuth(prev => ({ ...prev, loading: true, error: null }))
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, userType })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Login failed')
      }

      const { user, token } = await response.json()
      const normalizedUser = normalizeUser(user)
      localStorage.setItem('user', JSON.stringify(normalizedUser))
      if (token) {
        localStorage.setItem('auth_token', token)
        localStorage.setItem('token', token)
      }
      
      setAuth({
        isLoggedIn: true,
        user: normalizedUser,
        loading: false,
        error: null
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed'
      setAuth(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }))
      throw err
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('user')
    localStorage.removeItem('auth_token')
    localStorage.removeItem('token')
    setAuth({ isLoggedIn: false, user: null, loading: false, error: null })
  }, [])

  const clearError = useCallback(() => {
    setAuth(prev => ({ ...prev, error: null }))
  }, [])

  const role = auth.user?.role || auth.user?.userType || null
  const student = role === 'student' && auth.user
    ? {
        id: auth.user.studentId || auth.user.id,
        name: auth.user.name,
        email: auth.user.email,
        registerNumber: auth.user.registerNumber,
        hostel: auth.user.hostel,
        room: auth.user.room,
        phone: auth.user.phone,
        photoUrl: auth.user.photoUrl,
      }
    : null

  return (
    <AuthContext.Provider value={{ ...auth, role, student, login, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within AuthProvider")
  return context
}
