// Authenticated home — warm greeting plus entry points into the three AI
// features. First real page rendered inside the app shell.

import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import PageContainer from '../components/layout/PageContainer'
import '../styles/pages.css'

const FEATURES = [
  {
    to: '/explore',
    title: 'Explore attractions',
    description:
      'Personalized suggestions across Sri Lanka, tuned to your interests, the weather, and the time of day.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 21s-6.5-5.4-6.5-10A6.5 6.5 0 0 1 12 4.5 6.5 6.5 0 0 1 18.5 11c0 4.6-6.5 10-6.5 10Z"
          stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"
        />
        <circle cx="12" cy="11" r="2.4" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    ),
    accent: 'clay',
  },
  {
    to: '/chat',
    title: 'Ask TourMate',
    description:
      'Chat with an AI guide grounded in a Sri Lanka travel knowledge base — opening hours, tips, history, and more.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M4.5 6.8A2.3 2.3 0 0 1 6.8 4.5h10.4a2.3 2.3 0 0 1 2.3 2.3v7.4a2.3 2.3 0 0 1-2.3 2.3H9.6l-3.8 3v-3H6.8a2.3 2.3 0 0 1-2.3-2.3V6.8Z"
          stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"
        />
        <path d="M8.5 9.5h7M8.5 12.5h4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
    accent: 'ocean',
  },
  {
    to: '/itineraries',
    title: 'Plan itineraries',
    description:
      'Save the places you love into day-by-day plans and keep your whole trip in one place.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="4.5" y="5.5" width="15" height="14" rx="2.3" stroke="currentColor" strokeWidth="1.8" />
        <path d="M8 3.5v4M16 3.5v4M4.5 10.5h15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M8.5 14.5h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
    accent: 'spice',
  },
]

export default function Dashboard() {
  const { user, firebaseUser } = useAuth()
  const name = user?.name || firebaseUser?.email?.split('@')[0] || 'traveler'

  return (
    <PageContainer>
      <section className="home-hero">
        <span className="badge badge-primary">Sri Lanka · AI travel companion</span>
        <h1 className="home-greeting">
          Ayubowan, <span className="home-name">{name}</span>.
        </h1>
        <p className="home-lead">
          Where shall we wander today? Your recommendations, chat, and plans all
          live here.
        </p>
      </section>

      <section className="feature-grid" aria-label="Features">
        {FEATURES.map((f) => (
          <Link key={f.to} to={f.to} className={`card card-hover feature-card feature-${f.accent}`}>
            <span className="feature-icon">{f.icon}</span>
            <h3 className="feature-title">{f.title}</h3>
            <p className="feature-desc">{f.description}</p>
            <span className="feature-cta" aria-hidden="true">
              Get started
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14m0 0-6-6m6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </Link>
        ))}
      </section>
    </PageContainer>
  )
}
