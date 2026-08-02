// src/components/ProtectedRoute.tsx - Simple fix
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Layout from './Layout'

const ProtectedRoute = () => {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return (
    <Layout>
      <Outlet />
    </Layout>
  )
}

export default ProtectedRoute