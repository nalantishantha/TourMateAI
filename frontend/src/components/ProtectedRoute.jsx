// Route guard: renders children only for authenticated users, otherwise redirects
// to /login (remembering where they were headed so we can send them back later).

import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  // Wait for the first Firebase auth resolution before deciding.
  if (loading) return <p style={{ padding: 24 }}>Loading…</p>

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children
}
