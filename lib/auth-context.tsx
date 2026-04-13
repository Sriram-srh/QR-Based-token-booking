"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"
import { supabase } from "@/lib/supabase"

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

  // Listen to real-time Supabase auth state changes
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!session) {
          // Session ended, clear auth immediately
          localStorage.removeItem('user')
          localStorage.removeItem('auth_token')
          localStorage.removeItem('token')
          setAuth({ isLoggedIn: false, user: null, loading: false, error: null })
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          // Session active or refreshed, keep current auth state
          // The login flow already set up the user data
        }
      }
    )

    return () => {
      listener?.subscription.unsubscribe()
    }
  }, [])

  const login = useCallback(async (email: string, password: string, userType: UserType) => {
    setAuth(prev => ({ ...prev, loading: true, error: null }))
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        throw new Error(authError.message)
      }

      const token = authData.session?.access_token
      const authEmail = authData.user?.email

      if (!token || !authEmail) {
        throw new Error('Login failed: missing Supabase session data')
      }

      const { data: dbUser, error: dbUserError } = await supabase
        .from('users')
        .select('id, email, name, role')
        .eq('email', authEmail)
        .single()

      if (dbUserError || !dbUser) {
        throw new Error('Unable to load user profile')
      }

      if (dbUser.role !== userType) {
        throw new Error('User type mismatch')
      }

      let additionalData: Record<string, unknown> = {}

      if (dbUser.role === 'student') {
        const { data: student } = await supabase
          .from('students')
          .select('id, register_number, hostel, room, phone, photo_url')
          .eq('user_id', dbUser.id)
          .maybeSingle()

        additionalData = student
          ? {
              studentId: student.id,
              registerNumber: student.register_number,
              hostel: student.hostel,
              room: student.room,
              phone: student.phone,
              photoUrl: student.photo_url,
            }
          : {}
      } else if (dbUser.role === 'staff') {
        const { data: staff } = await supabase
          .from('staff')
          .select('id')
          .eq('user_id', dbUser.id)
          .maybeSingle()

        const { data: assignedCounter } = staff
          ? await supabase
              .from('counters')
              .select('id, name')
              .eq('assigned_staff_id', staff.id)
              .maybeSingle()
          : { data: null }

        additionalData = staff
          ? {
              staffId: staff.id,
              counterId: assignedCounter?.id || null,
              counterName: assignedCounter?.name || null,
            }
          : {}
      }

      const normalizedUser = normalizeUser({
        ...dbUser,
        ...additionalData,
        userType: dbUser.role,
      })

      localStorage.setItem('user', JSON.stringify(normalizedUser))
      localStorage.setItem('auth_token', token)
      localStorage.setItem('token', token)
      
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
    void supabase.auth.signOut()
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
