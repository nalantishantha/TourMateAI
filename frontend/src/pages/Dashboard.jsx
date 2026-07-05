// Minimal protected landing page. Proves the whole loop works: it only renders
// for authenticated users, and `user` is the DB row returned by /api/auth/verify.

import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const { user, firebaseUser, logout } = useAuth()

  return (
    <div style={{ maxWidth: 480, margin: '48px auto', padding: 16 }}>
      <h1>TourMateAI</h1>
      <p>You are logged in{user?.email ? ` as ${user.email}` : ''}.</p>
      <pre style={{ background: '#f4f4f4', padding: 12, overflowX: 'auto' }}>
        {JSON.stringify(user ?? { firebase_uid: firebaseUser?.uid }, null, 2)}
      </pre>
      <button onClick={logout}>Log out</button>
    </div>
  )
}
