// App routes. Public: /login, /signup. Everything else renders inside the
// AppShell layout (navbar + footer) behind ProtectedRoute.

import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import AppShell from './components/layout/AppShell'
import Admin from './pages/Admin'
import Chat from './pages/Chat'
import Dashboard from './pages/Dashboard'
import Explore from './pages/Explore'
import Itineraries from './pages/Itineraries'
import Login from './pages/Login'
import Profile from './pages/Profile'
import SignUp from './pages/SignUp'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />

      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/itineraries" element={<Itineraries />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      {/* Unknown paths fall back to the protected home. */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
