import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { authApi } from '../lib/endpoints'
import { ensureCsrfToken } from '../lib/api'
import type { User } from '../types'

type AuthContextValue = {
  user: User | null
  loading: boolean
  unreadCount: number
  setUnreadCount: (count: number) => void
  setUser: (user: User) => void
  login: (email: string, password: string, remember?: boolean) => Promise<User>
  register: (payload: {
    name: string
    email: string
    password: string
    password_confirmation: string
  }) => Promise<User>
  demoLogin: () => Promise<User>
  logout: () => Promise<void>
  refreshUser: () => Promise<User | null>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)

  const refreshUser = useCallback(async (): Promise<User | null> => {
    try {
      const response = await authApi.me()
      setUserState(response.data.user)
      setUnreadCount(response.data.unread_notifications)
      return response.data.user
    } catch {
      return null
    }
  }, [])

  useEffect(() => {
    let active = true
    const bootstrap = async () => {
      try {
        const response = await authApi.me()
        if (!active) return
        setUserState(response.data.user)
        setUnreadCount(response.data.unread_notifications)
      } catch {
        if (!active) return
        setUserState(null)
      } finally {
        if (active) setLoading(false)
      }
    }
    void bootstrap()
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const onUnauthorized = () => {
      setUserState(null)
      setUnreadCount(0)
    }
    window.addEventListener('edrive:unauthorized', onUnauthorized)
    return () => window.removeEventListener('edrive:unauthorized', onUnauthorized)
  }, [])

  const login = useCallback(async (email: string, password: string, remember = false) => {
    const response = await authApi.login({ email, password, remember })
    await ensureCsrfToken(true)
    setUserState(response.data.user)
    setLoading(false)
    return response.data.user
  }, [])

  const register = useCallback(
    async (payload: { name: string; email: string; password: string; password_confirmation: string }) => {
      const response = await authApi.register(payload)
      await ensureCsrfToken(true)
      setUserState(response.data.user)
      setLoading(false)
      return response.data.user
    },
    [],
  )

  const demoLogin = useCallback(async () => {
    const response = await authApi.demoLogin()
    await ensureCsrfToken(true)
    setUserState(response.data.user)
    setLoading(false)
    return response.data.user
  }, [])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch {
      // The session is cleared in the browser even if the request fails.
    } finally {
      await ensureCsrfToken(true).catch(() => undefined)
      setUserState(null)
      setUnreadCount(0)
    }
  }, [])

  const setUser = useCallback((nextUser: User) => {
    setUserState(nextUser)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      unreadCount,
      setUnreadCount,
      setUser,
      login,
      register,
      demoLogin,
      logout,
      refreshUser,
    }),
    [user, loading, unreadCount, setUser, login, register, demoLogin, logout, refreshUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
