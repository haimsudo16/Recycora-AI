import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { authApi } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('recycora_user')
    return raw ? JSON.parse(raw) : null
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('recycora_token')
    if (!token) {
      setLoading(false)
      return
    }
    authApi
      .me()
      .then((res) => {
        setUser(res.data)
        localStorage.setItem('recycora_user', JSON.stringify(res.data))
      })
      .catch(() => {
        localStorage.removeItem('recycora_token')
        localStorage.removeItem('recycora_user')
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (email, password) => {
    const res = await authApi.login({ email, password })
    localStorage.setItem('recycora_token', res.data.access_token)
    localStorage.setItem('recycora_user', JSON.stringify(res.data.user))
    setUser(res.data.user)
    return res.data.user
  }, [])

  const register = useCallback(async (payload) => {
    const res = await authApi.register(payload)
    localStorage.setItem('recycora_token', res.data.access_token)
    localStorage.setItem('recycora_user', JSON.stringify(res.data.user))
    setUser(res.data.user)
    return res.data.user
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('recycora_token')
    localStorage.removeItem('recycora_user')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, setUser, login, register, logout, loading, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
