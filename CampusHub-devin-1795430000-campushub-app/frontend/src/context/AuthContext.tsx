import axios from 'axios'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

import { tokenStore } from '@/services/api'
import { authApi, FALLBACK_REGISTRATION_OPTIONS } from '@/services/campus'
import type { User } from '@/types'

const DEMO_REGISTERED_KEY = 'campushub.demo_registered_users'

interface StoredDemoAccount {
  password: string
  user: User
}

function getRegisteredDemoAccounts(): StoredDemoAccount[] {
  try {
    const raw = localStorage.getItem(DEMO_REGISTERED_KEY)
    return raw ? (JSON.parse(raw) as StoredDemoAccount[]) : []
  } catch {
    return []
  }
}

function saveRegisteredDemoAccount(user: User, password: string) {
  const accounts = getRegisteredDemoAccounts().filter(
    (a) => a.user.email.toLowerCase() !== user.email.toLowerCase(),
  )
  accounts.push({ password, user })
  localStorage.setItem(DEMO_REGISTERED_KEY, JSON.stringify(accounts))
}

const DEMO_STUDENT: User = {
  id: 2,
  email: 'aarav.student@campushub.demo',
  full_name: 'Aarav Gupta',
  role: 'student',
  is_active: true,
  created_at: '2026-01-01T00:00:00Z',
  student: {
    id: 1,
    enrollment_no: 'MUST2023CSE042',
    year_of_study: 3,
    phone: '+91-98765-43210',
    department_id: 1,
    program_id: 1,
    department_name: 'Computer Science & Engineering',
    program_name: 'B.Tech Computer Science & Engineering',
  },
}

const DEMO_ADMIN: User = {
  id: 1,
  email: 'admin@campushub.demo',
  full_name: 'Campus Administrator',
  role: 'admin',
  is_active: true,
  created_at: '2026-01-01T00:00:00Z',
  student: null,
}

interface AuthState {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<User>
  loginAsDemo: (role: 'student' | 'admin') => User
  register: (data: Record<string, unknown>) => Promise<User>
  logout: () => void
  refresh: () => Promise<void>
  setUser: (user: User) => void
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(Boolean(tokenStore.get()))

  const refresh = useCallback(async () => {
    const token = tokenStore.get()
    if (!token) return setLoading(false)
    if (token.startsWith('demo-')) {
      const stored = localStorage.getItem('campushub.demo_user')
      if (stored) {
        try {
          setUser(JSON.parse(stored))
          setLoading(false)
          return
        } catch {
          // fallback below
        }
      }
      setUser(token.includes('admin') ? DEMO_ADMIN : DEMO_STUDENT)
      setLoading(false)
      return
    }
    try {
      setUser(await authApi.me())
    } catch {
      tokenStore.clear()
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
    const onUnauthorized = () => setUser(null)
    window.addEventListener('campushub:unauthorized', onUnauthorized)
    return () => window.removeEventListener('campushub:unauthorized', onUnauthorized)
  }, [refresh])

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await authApi.login(email, password)
      tokenStore.set(res.access_token)
      setUser(res.user)
      localStorage.removeItem('campushub.demo_user')
      return res.user
    } catch (err) {
      // Fallback for demo & offline-registered logins if backend is offline
      if (!axios.isAxiosError(err) || !err.response || err.response.status >= 500) {
        const lower = email.toLowerCase().trim()
        const registered = getRegisteredDemoAccounts().find(
          (a) => a.user.email.toLowerCase() === lower && a.password === password,
        )
        if (registered) {
          tokenStore.set('demo-student-token')
          localStorage.setItem('campushub.demo_user', JSON.stringify(registered.user))
          setUser(registered.user)
          return registered.user
        }

        const isAdminDemo = lower.includes('admin') || lower === 'admin@campushub.demo'
        const isStudentDemo = lower.includes('student') || lower === 'aarav.student@campushub.demo'

        if (isAdminDemo) {
          tokenStore.set('demo-admin-token')
          localStorage.setItem('campushub.demo_user', JSON.stringify(DEMO_ADMIN))
          setUser(DEMO_ADMIN)
          return DEMO_ADMIN
        }
        if (isStudentDemo) {
          tokenStore.set('demo-student-token')
          const studentUser = { ...DEMO_STUDENT, email: lower }
          localStorage.setItem('campushub.demo_user', JSON.stringify(studentUser))
          setUser(studentUser)
          return studentUser
        }
      }
      throw err
    }
  }, [])

  const loginAsDemo = useCallback((role: 'student' | 'admin') => {
    const demoUser = role === 'admin' ? DEMO_ADMIN : DEMO_STUDENT
    tokenStore.set(`demo-${role}-token`)
    localStorage.setItem('campushub.demo_user', JSON.stringify(demoUser))
    setUser(demoUser)
    return demoUser
  }, [])

  const register = useCallback(async (data: Record<string, unknown>) => {
    try {
      const res = await authApi.register(data)
      tokenStore.set(res.access_token)
      localStorage.removeItem('campushub.demo_user')
      setUser(res.user)
      return res.user
    } catch (err) {
      if (axios.isAxiosError(err) && err.response && err.response.status < 500) {
        throw err
      }
      const email = String(data.email ?? '').trim().toLowerCase()
      const enrollmentNo = String(data.enrollment_no ?? '').trim().toUpperCase()
      const existing = getRegisteredDemoAccounts()
      if (existing.some((a) => a.user.email.toLowerCase() === email)) {
        throw new Error('An account with this email already exists')
      }
      if (existing.some((a) => a.user.student?.enrollment_no.toUpperCase() === enrollmentNo)) {
        throw new Error('This enrollment number is already registered')
      }
      const deptId = typeof data.department_id === 'number' ? data.department_id : null
      const progId = typeof data.program_id === 'number' ? data.program_id : null
      const dept = FALLBACK_REGISTRATION_OPTIONS.departments.find((d) => d.id === deptId)
      const prog = FALLBACK_REGISTRATION_OPTIONS.programs.find((p) => p.id === progId)
      const newUser: User = {
        id: Date.now(),
        email,
        full_name: String(data.full_name ?? '').trim(),
        role: 'student',
        is_active: true,
        created_at: new Date().toISOString(),
        student: {
          id: Date.now(),
          enrollment_no: enrollmentNo,
          year_of_study: typeof data.year_of_study === 'number' ? data.year_of_study : 1,
          phone: (data.phone as string | null) ?? null,
          department_id: deptId,
          program_id: progId,
          department_name: dept?.name ?? null,
          program_name: prog?.name ?? null,
        },
      }
      saveRegisteredDemoAccount(newUser, String(data.password ?? ''))
      tokenStore.set('demo-student-token')
      localStorage.setItem('campushub.demo_user', JSON.stringify(newUser))
      setUser(newUser)
      return newUser
    }
  }, [])

  const logout = useCallback(() => {
    tokenStore.clear()
    localStorage.removeItem('campushub.demo_user')
    setUser(null)
    window.speechSynthesis?.cancel()
  }, [])

  const value = useMemo(
    () => ({ user, loading, login, loginAsDemo, register, logout, refresh, setUser }),
    [user, loading, login, loginAsDemo, register, logout, refresh],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
