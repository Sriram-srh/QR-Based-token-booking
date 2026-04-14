"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"
import { getSupabase } from "@/lib/supabase"

const supabase = getSupabase()

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
    loading: true,
    error: null,
  })

  const clearPersistedAuth = useCallback(() => {
    localStorage.removeItem('user')
    localStorage.removeItem('auth_token')
    localStorage.removeItem('token')
  }, [])

  const hydrateUserFromSession = useCallback(async (session: any, expectedRole?: UserType): Promise<User> => {
    const authEmail = session?.user?.email
    const token = session?.access_token

    if (!token || !authEmail) {
      throw new Error('Missing Supabase session data')
    }

    const { data: dbUser, error: dbUserError } = await supabase
      .from('users')
      .select('id, email, name, role')
      .eq('email', authEmail)
      .single()

    if (dbUserError || !dbUser) {
      throw new Error('Unable to load user profile')
    }

    if (expectedRole && dbUser.role !== expectedRole) {
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

    return normalizedUser
  }, [])

  // Hydrate auth state from Supabase session on mount
  useEffect(() => {
    let mounted = true

    const restoreFromSupabaseSession = async () => {
      const { data, error } = await supabase.auth.getSession()

      if (!mounted) return

      if (error || !data.session) {
        clearPersistedAuth()
        setAuth({ isLoggedIn: false, user: null, loading: false, error: null })
        return
      }

      try {
        const normalizedUser = await hydrateUserFromSession(data.session)
        if (!mounted) return

        setAuth({
          isLoggedIn: true,
          user: normalizedUser,
          loading: false,
          error: null,
        })
      } catch {
        clearPersistedAuth()
        setAuth({ isLoggedIn: false, user: null, loading: false, error: null })
      }
    }

    void restoreFromSupabaseSession()

    return () => {
      mounted = false
    }
  }, [clearPersistedAuth, hydrateUserFromSession])

  // Listen to real-time Supabase auth state changes
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event: string, session: any) => {
        if (!session || event === 'SIGNED_OUT') {
          clearPersistedAuth()
          setAuth({ isLoggedIn: false, user: null, loading: false, error: null })
          return
        }

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
          void (async () => {
            try {
              const normalizedUser = await hydrateUserFromSession(session)
              setAuth({ isLoggedIn: true, user: normalizedUser, loading: false, error: null })
            } catch {
              clearPersistedAuth()
              setAuth({ isLoggedIn: false, user: null, loading: false, error: null })
            }
          })()
        }
      }
    )

    return () => {
      listener?.subscription.unsubscribe()
    }
  }, [clearPersistedAuth, hydrateUserFromSession])

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
      if (!authData.session) {
        throw new Error('Login failed: missing Supabase session data')
      }

      const normalizedUser = await hydrateUserFromSession(authData.session, userType)
      
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
  }, [hydrateUserFromSession])

  const logout = useCallback(() => {
    void supabase.auth.signOut()
    clearPersistedAuth()
    setAuth({ isLoggedIn: false, user: null, loading: false, error: null })
  }, [clearPersistedAuth])

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
