import axios from 'axios'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

import { tokenStore } from '@/services/api'
import { authApi } from '@/services/campus'
import type { User } from '@/types'

interface AuthState {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<User>
  register: (data: Record<string, unknown>) => Promise<User>
  logout: () => Promise<void>
  refresh: () => Promise<void>
  setUser: (user: User) => void
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(Boolean(tokenStore.get()))

  const refresh = useCallback(async () => {
    const token = tokenStore.get()
    if (!token) {
      setUser(null)
      setLoading(false)
      return
    }
    try {
      setUser(await authApi.me())
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) tokenStore.clear()
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (tokenStore.get()?.startsWith('demo-')) tokenStore.clear()
    localStorage.removeItem('campushub.demo_user')
    localStorage.removeItem('campushub.demo_registered_users')
    refresh()
    const onUnauthorized = () => setUser(null)
    const onStorage = (event: StorageEvent) => {
      if (event.key === 'campushub.token') refresh()
    }
    window.addEventListener('campushub:unauthorized', onUnauthorized)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener('campushub:unauthorized', onUnauthorized)
      window.removeEventListener('storage', onStorage)
    }
  }, [refresh])

  const logout = useCallback(async () => {
    const token = tokenStore.get()
    tokenStore.clear()
    localStorage.removeItem('campushub.demo_user')
    localStorage.removeItem('campushub.demo_registered_users')
    setUser(null)
    window.speechSynthesis?.cancel()
    if (token && !token.startsWith('demo-')) {
      try {
        await authApi.logout(token)
      } catch {
        console.warn('The browser session was cleared, but the server could not revoke its token.')
      }
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    await logout()
    const res = await authApi.login(email, password)
    tokenStore.set(res.access_token)
    setUser(res.user)
    return res.user
  }, [logout])

  const register = useCallback(async (data: Record<string, unknown>) => {
    await logout()
    const res = await authApi.register(data)
    tokenStore.set(res.access_token)
    setUser(res.user)
    return res.user
  }, [logout])

  const value = useMemo(
    () => ({ user, loading, login, register, logout, refresh, setUser }),
    [user, loading, login, register, logout, refresh],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
