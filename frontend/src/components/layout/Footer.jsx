// App footer — brand, quick links, and project meta.

import { Link } from 'react-router-dom'
import Logo from './Logo'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <Logo />
          <p className="footer-tagline">
            Your intelligent travel companion for exploring Sri Lanka.
          </p>
        </div>

        <nav className="footer-col" aria-label="Discover">
          <span className="footer-heading">Discover</span>
          <Link to="/explore">Explore</Link>
          <Link to="/itineraries">Itineraries</Link>
          <Link to="/chat">Ask TourMate</Link>
        </nav>

        <nav className="footer-col" aria-label="Account">
          <span className="footer-heading">Account</span>
          <Link to="/profile">Profile</Link>
          <Link to="/">Home</Link>
        </nav>
      </div>

      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} TourMateAI · A CIS6035 project</span>
        <span>Made for travelers in Sri Lanka</span>
      </div>
    </footer>
  )
}
