import { useState, useCallback } from 'react'
import api from '../api/axios'

export interface CustomerUser {
  id: number
  name: string
  email: string
  role: string
  profile_image?: string | null
}

export function useCustomerAuth() {
  const [user, setUser] = useState<CustomerUser | null>(() => {
    const stored = localStorage.getItem('customer_user')
    return stored ? JSON.parse(stored) : null
  })

  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem('customer_token')
  )

  const login = useCallback(async (email: string, password: string) => {
    // 1. Try real backend API
    try {
      const res = await api.post('/auth/login', { email, password })
      if (res.data?.success && res.data?.data) {
        const { user: userData, token: userToken } = res.data.data
        localStorage.setItem('customer_token', userToken)
        localStorage.setItem('customer_user', JSON.stringify(userData))
        setUser(userData)
        setToken(userToken)
        return userData
      }
    } catch (err: any) {
      // 2. Check locally registered users as fallback
      const localUsers = JSON.parse(localStorage.getItem('tb_registered_users') || '[]')
      const found = localUsers.find(
        (u: any) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
      )

      if (found) {
        const userData: CustomerUser = {
          id: found.id || Date.now(),
          name: found.name,
          email: found.email,
          role: 'customer',
        }
        const userToken = `token-local-${Date.now()}`
        localStorage.setItem('customer_token', userToken)
        localStorage.setItem('customer_user', JSON.stringify(userData))
        setUser(userData)
        setToken(userToken)
        return userData
      }

      const serverMsg = err.response?.data?.message
      throw new Error(serverMsg || 'Email atau kata sandi tidak sesuai. Silakan coba lagi.')
    }
  }, [])

  const register = useCallback(async (name: string, email: string, password: string) => {
    // Always store in local registered users database
    const localUsers = JSON.parse(localStorage.getItem('tb_registered_users') || '[]')
    const existsLocally = localUsers.some(
      (u: any) => u.email.toLowerCase() === email.trim().toLowerCase()
    )
    if (existsLocally) {
      throw new Error('Email sudah terdaftar. Silakan gunakan email lain atau masuk.')
    }

    // Try backend API registration
    try {
      await api.post('/auth/register', { name, email, password, role: 'customer' })
    } catch (err: any) {
      if (err.response?.status === 400 && err.response?.data?.message?.includes('already')) {
        throw new Error(err.response.data.message)
      }
    }

    // Save user record to local store so user can log in with their credentials
    const newLocalUser = {
      id: Math.floor(1000 + Math.random() * 9000),
      name: name.trim(),
      email: email.trim(),
      password,
      role: 'customer',
      createdAt: new Date().toISOString(),
    }
    localStorage.setItem('tb_registered_users', JSON.stringify([...localUsers, newLocalUser]))

    return { success: true }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('customer_token')
    localStorage.removeItem('customer_user')
    setUser(null)
    setToken(null)
  }, [])

  const isAuthenticated = Boolean(user && token)

  return { user, token, isAuthenticated, login, register, logout }
}
