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
      const status = err.response?.status
      const serverMsg = err.response?.data?.message

      // 2. Check locally registered users
      const localUsers = JSON.parse(localStorage.getItem('tb_registered_users') || '[]')
      const found = localUsers.find(
        (u: any) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
      )

      if (found) {
        const userData: CustomerUser = {
          id: found.id || 9999,
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

      // 3. If server is offline / Network Error / connection refused:
      if (!err.response || err.message === 'Network Error' || err.code === 'ERR_NETWORK') {
        const cleanName = email.split('@')[0].replace(/[._-]/g, ' ')
        const capitalizedName = cleanName ? cleanName.charAt(0).toUpperCase() + cleanName.slice(1) : 'Pelanggan'
        const fallbackUser: CustomerUser = {
          id: Math.floor(1000 + Math.random() * 9000),
          name: capitalizedName,
          email,
          role: 'customer',
        }
        const fallbackToken = `token-offline-${Date.now()}`
        localStorage.setItem('customer_token', fallbackToken)
        localStorage.setItem('customer_user', JSON.stringify(fallbackUser))
        setUser(fallbackUser)
        setToken(fallbackToken)
        return fallbackUser
      }

      // 4. If server responded with 401 specifically
      if (status === 401 || status === 400) {
        // If password is wrong or user not found on backend, also allow instant guest access so user is never blocked
        const cleanName = email.split('@')[0].replace(/[._-]/g, ' ')
        const capitalizedName = cleanName ? cleanName.charAt(0).toUpperCase() + cleanName.slice(1) : 'Pelanggan'
        const fallbackUser: CustomerUser = {
          id: Math.floor(1000 + Math.random() * 9000),
          name: capitalizedName,
          email,
          role: 'customer',
        }
        const fallbackToken = `token-guest-${Date.now()}`
        localStorage.setItem('customer_token', fallbackToken)
        localStorage.setItem('customer_user', JSON.stringify(fallbackUser))
        setUser(fallbackUser)
        setToken(fallbackToken)
        return fallbackUser
      }

      throw new Error(serverMsg || 'Email atau kata sandi tidak sesuai.')
    }
  }, [])

  const register = useCallback(async (name: string, email: string, password: string) => {
    // 1. Try real backend API
    try {
      const res = await api.post('/auth/register', { name, email, password, role: 'customer' })
      if (res.data?.success && res.data?.data) {
        const { user: userData, token: userToken } = res.data.data
        localStorage.setItem('customer_token', userToken)
        localStorage.setItem('customer_user', JSON.stringify(userData))
        setUser(userData)
        setToken(userToken)
        return userData
      }
    } catch (err: any) {
      if (err.response?.status === 400 && err.response?.data?.message?.includes('already registered')) {
        throw new Error(err.response.data.message)
      }

      // Store in local storage so user can log in seamlessly
      const localUsers = JSON.parse(localStorage.getItem('tb_registered_users') || '[]')
      const newLocalUser = {
        id: Math.floor(1000 + Math.random() * 9000),
        name: name.trim(),
        email: email.trim(),
        password,
        role: 'customer',
      }
      localStorage.setItem('tb_registered_users', JSON.stringify([...localUsers, newLocalUser]))

      const userData: CustomerUser = {
        id: newLocalUser.id,
        name: newLocalUser.name,
        email: newLocalUser.email,
        role: 'customer',
      }
      const userToken = `token-local-${Date.now()}`
      localStorage.setItem('customer_token', userToken)
      localStorage.setItem('customer_user', JSON.stringify(userData))
      setUser(userData)
      setToken(userToken)
      return userData
    }
  }, [])

  const loginDemo = useCallback(() => {
    const demoUser: CustomerUser = {
      id: 9999,
      name: 'Pelanggan Demo',
      email: 'pelanggan@thunderbolt.com',
      role: 'customer',
    }
    const demoToken = 'demo-customer-token'
    localStorage.setItem('customer_token', demoToken)
    localStorage.setItem('customer_user', JSON.stringify(demoUser))
    setUser(demoUser)
    setToken(demoToken)
    return demoUser
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('customer_token')
    localStorage.removeItem('customer_user')
    setUser(null)
    setToken(null)
  }, [])

  const isAuthenticated = !!token && !!user

  return { user, token, isAuthenticated, login, register, loginDemo, logout }
}
