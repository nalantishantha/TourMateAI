// Profile — account details from the backend user row (falls back to the
// Firebase user while /api/auth/verify hasn't resolved).

import { useAuth } from '../context/AuthContext'
import PageContainer from '../components/layout/PageContainer'
import '../styles/pages.css'

export default function Profile() {
  const { user, firebaseUser, logout } = useAuth()

  const rows = [
    ['Name', user?.name || '—'],
    ['Email', user?.email || firebaseUser?.email || '—'],
    ['Member since', user?.created_at ? new Date(user.created_at).toLocaleDateString() : '—'],
  ]

  return (
    <PageContainer
      title="Profile"
      subtitle="Your account details."
      width="narrow"
      actions={
        <button type="button" className="btn btn-secondary" onClick={logout}>
          Log out
        </button>
      }
    >
      <div className="card card-pad">
        <dl className="profile-list">
          {rows.map(([label, value]) => (
            <div key={label} className="profile-row">
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </PageContainer>
  )
}
