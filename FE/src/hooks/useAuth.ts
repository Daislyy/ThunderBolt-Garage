import { useState, useCallback } from 'react'
import api from '../api/axios'

export interface AdminUser {
  id: number
  name: string
  email: string
  role: string
  profile_image: string | null
}

export function useAuth() {
  const [user, setUser] = useState<AdminUser | null>(() => {
    const stored = localStorage.getItem('admin_user')
    return stored ? JSON.parse(stored) : null
  })

  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem('admin_token')
  )

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password })
    const { user: userData, token: userToken } = res.data.data

    if (userData.role !== 'admin') {
      throw new Error('Access denied. Admin accounts only.')
    }

    localStorage.setItem('admin_token', userToken)
    localStorage.setItem('admin_user', JSON.stringify(userData))
    setUser(userData)
    setToken(userToken)
    return userData
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
    setUser(null)
    setToken(null)
  }, [])

  const isAuthenticated = !!token && !!user && user.role === 'admin'

  return { user, token, isAuthenticated, login, logout }
}
