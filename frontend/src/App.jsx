// App routes. Public: /login, /signup. Everything else is behind ProtectedRoute,
// which redirects unauthenticated users to /login.

import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import SignUp from './pages/SignUp'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      {/* Unknown paths fall back to the protected home. */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
