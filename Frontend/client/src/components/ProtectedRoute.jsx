import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function ProtectedRoute() {
  const { user, loading } = useAuth()
  if (loading) return <main className="auth-loading" aria-live="polite">Checking your CareerOS session...</main>
  return user ? <Outlet /> : <Navigate to="/signin" replace />
}
