// 404 page for unknown routes. Rendered inside the app shell (navbar + footer),
// so a lost authenticated user still has full navigation to get back on track.

import { Link } from 'react-router-dom'
import PageContainer from '../components/layout/PageContainer'

export default function NotFound() {
  return (
    <PageContainer width="narrow">
      <div className="card error-state">
        <span className="error-state-code" aria-hidden="true">404</span>
        <h1 className="error-state-title">Page not found</h1>
        <p className="error-state-text">
          The page you're looking for doesn't exist or may have moved. Let's get
          you back to exploring Sri Lanka.
        </p>
        <div className="error-state-actions">
          <Link to="/" className="btn btn-primary">
            Back to dashboard
          </Link>
          <Link to="/explore" className="btn btn-ghost">
            Explore attractions
          </Link>
        </div>
      </div>
    </PageContainer>
  )
}
