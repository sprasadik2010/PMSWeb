import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Hospital, Lock, User, HeartPulse, Shield, Stethoscope, Building, Activity } from 'lucide-react'
import toast from 'react-hot-toast'
import axios from 'axios'

const Login = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { login, user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) {
      navigate('/dashboard')
    }
  }, [user, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isSignUp) {
      if (!username || !password || !fullName) {
        toast.error('Please enter all details')
        return
      }
      
      setIsLoading(true)
      try {
        await axios.post('/auth/register', {
          username,
          password,
          full_name: fullName
        })
        toast.success('Registration successful! Please login.')
        setIsSignUp(false)
      } catch (error: any) {
        console.error("Registration error:", error)
        toast.error(error.response?.data?.detail || 'Registration failed')
      } finally {
        setIsLoading(false)
      }
    } else {
      if (!username || !password) {
        toast.error('Please enter both username and password')
        return
      }
      
      setIsLoading(true)
      try {
        await login(username, password)
      } catch (error) {
        // Error is handled in AuthContext
      } finally {
        setIsLoading(false)
      }
    }
  }

  const hospitalFeatures = [
    { icon: Stethoscope, text: 'OP/IP Patient Management', color: 'text-blue-600' },
    { icon: Building, text: 'Doctor & Staff Management', color: 'text-green-600' },
    { icon: Activity, text: 'Real-time Billing System', color: 'text-purple-600' },
    { icon: Shield, text: 'Secure & HIPAA Compliant', color: 'text-red-600' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Left Side - Hospital Info */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 lg:p-12 shadow-2xl">
          <div className="h-full flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl mb-6">
                <Hospital size={40} className="text-white" />
              </div>
              
              <h1 className="text-4xl font-bold text-white mb-4">
                Patient Management System
              </h1>
              <p className="text-blue-100 text-lg mb-8">
                Professional healthcare management solution for modern patient care
              </p>
              
              <div className="space-y-4 mb-8">
                {hospitalFeatures.map((feature, index) => {
                  const Icon = feature.icon
                  return (
                    <div key={index} className="flex items-center space-x-4">
                      <div className="p-2 bg-white/10 rounded-lg">
                        <Icon className={`${feature.color} filter brightness-125`} size={24} />
                      </div>
                      <span className="text-white font-medium">{feature.text}</span>
                    </div>
                  )
                })}
              </div>
            </div>
            
            <div className="mt-auto">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center">
                  <HeartPulse className="text-white mr-3" size={24} />
                  <div>
                    <p className="text-white font-semibold">Healthcare First</p>
                    <p className="text-blue-100 text-sm">Your commitment to quality patient care</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="flex flex-col justify-center">
          <div className="bg-white rounded-3xl shadow-2xl p-8 lg:p-12 border border-gray-200">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-4 shadow-lg">
                {isSignUp ? <User size={28} className="text-white" /> : <Lock size={28} className="text-white" />}
              </div>
              <h2 className="text-3xl font-bold text-gray-900">{isSignUp ? 'Create Clinic Workspace' : 'Secure Login'}</h2>
              <p className="text-gray-600 mt-2">{isSignUp ? 'Start managing your OP/IP clinic today' : 'Access your patient management dashboard'}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {isSignUp && (
                <div className="space-y-2">
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-900">
                    Clinic / Doctor Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="e.g. City Dental Care"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="username" className="block text-sm font-medium text-gray-900">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter your username"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-900">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter your password"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {isSignUp ? 'Creating Account...' : 'Authenticating...'}
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <Lock size={20} className="mr-2" />
                    {isSignUp ? 'Create SaaS Workspace' : 'Login to Dashboard'}
                  </span>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-blue-600 hover:text-blue-700 font-semibold transition-colors cursor-pointer"
              >
                {isSignUp ? 'Already have a clinic? Log In' : "Register a New Clinic (SaaS Signup)"}
              </button>
            </div>

          </div>

          {/* Footer */}
          <div className="text-center mt-6 text-gray-600">
            <p className="text-sm">© {new Date().getFullYear()} PMS Lite - Professional Patient Management</p>
            <p className="text-sm mt-1">Version 1.0 • OP/IP Support • Secure & Compliant</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login