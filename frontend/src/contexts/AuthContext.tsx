import React, { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

// Get backend URL from environment variable
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000'

// Set axios base URL from environment variable
axios.defaults.baseURL = BACKEND_URL

// Log for debugging (remove in production)
console.log(`🌐 Using backend URL: ${BACKEND_URL}`)

interface User {
  id: number
  username: string
  full_name: string
  role: string
  ad_free: boolean
  subscription_tier: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  isLoading: boolean
  updateUser: (updatedUser: User) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  // Add response interceptor for 401 errors
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      response => response,
      error => {
        if (error.response?.status === 401 && token) {
          // Token expired - logout user
          console.log('Token expired, logging out...')
          handleAutoLogout()
        }
        return Promise.reject(error)
      }
    )

    return () => {
      axios.interceptors.response.eject(interceptor)
    }
  }, [token, navigate])

  useEffect(() => {
    if (token) {
      // Set Authorization header for ALL axios requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      verifyToken()
    } else {
      setIsLoading(false)
    }
  }, [token])

  const handleAutoLogout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
    delete axios.defaults.headers.common['Authorization']
    
    // Use window.location instead of navigate for guaranteed redirect
    if (window.location.pathname !== '/login') {
      toast.error('Session expired. Please login again.')
      window.location.href = '/login'
    }
  }

  const verifyToken = async () => {
    try {
      const response = await axios.get('/auth/me', {
        timeout: 5000 // 5 second timeout
      })
      setUser(response.data)
      setIsLoading(false)
    } catch (error: any) {
      console.error('Token verification failed:', error)
      
      // Only logout if it's an auth error (401)
      if (error.response?.status === 401) {
        handleAutoLogout()
      } else {
        // Network or server error - don't logout
        setIsLoading(false)
      }
    }
  }

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser)
  }

  const login = async (username: string, password: string) => {
    try {
      const formData = new FormData()
      formData.append('username', username)
      formData.append('password', password)
      
      const response = await axios.post('/auth/login', formData)
      
      const { access_token, user: userData } = response.data
      
      // Save token with expiration tracking
      localStorage.setItem('token', access_token)
      localStorage.setItem('login_time', Date.now().toString())
      
      setToken(access_token)
      setUser(userData)
      
      // Set Authorization header for all future requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
      
      toast.success('Login successful!')
      navigate('/dashboard')
    } catch (error: any) {
      console.error("Login error:", error)

      const backendMessage =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        error.response?.data?.error ||
        JSON.stringify(error.response?.data) ||
        error.message

      toast.error(backendMessage)
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('login_time')
    setToken(null)
    setUser(null)
    delete axios.defaults.headers.common['Authorization']
    
    // Use window.location for reliable redirect
    window.location.href = '/login'
    toast.success('Logged out successfully')
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}