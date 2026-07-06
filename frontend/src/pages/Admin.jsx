import { useAuth } from '../context/AuthContext'
import PageContainer from '../components/layout/PageContainer'
import ComingSoon from '../components/ComingSoon'

export default function Admin() {
  const { user } = useAuth()

  // Mirrors the navbar rule: the backend doesn't return `role` yet, so this
  // renders the not-authorized state for everyone until it does.
  if (user?.role !== 'admin') {
    return (
      <PageContainer title="Admin" width="narrow">
        <div className="alert alert-error" role="alert">
          You don't have access to the admin portal.
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer
      title="Admin"
      subtitle="Manage attractions, users, and content."
    >
      <ComingSoon icon="🛠️" title="Admin portal coming soon">
        Attraction management, user overview, and content tools will live here.
      </ComingSoon>
    </PageContainer>
  )
}
