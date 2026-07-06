// Dashboard — the authenticated home. Welcome hero, quick actions into the
// three AI features, then three data sections:
//   - Recommended for you  → GET /api/recommendations/mock (placeholder until
//                            the real engine lands; see services/recommendations.js)
//   - Continue planning    → GET /api/itineraries
//   - Trending attractions → GET /api/attractions?sort=rating
// Each section loads independently so one failure never blanks the page.

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import PageContainer from '../components/layout/PageContainer'
import AttractionCard, { AttractionCardSkeleton } from '../components/explore/AttractionCard'
import useLikes from '../hooks/useLikes'
import { fetchAttractions } from '../services/attractions'
import { fetchItineraries } from '../services/itineraries'
import { fetchRecommendations } from '../services/recommendations'
import '../styles/pages.css'
import '../styles/explore.css'
import '../styles/dashboard.css'

const SECTION_SIZE = 4

const QUICK_ACTIONS = [
  {
    to: '/itineraries',
    title: 'Plan a trip',
    sub: 'Build a day-by-day itinerary',
    accent: 'qa-plan',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="4.5" y="5.5" width="15" height="14" rx="2.3" stroke="currentColor" strokeWidth="1.8" />
        <path d="M8 3.5v4M16 3.5v4M4.5 10.5h15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M8.5 14.5h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    to: '/chat',
    title: 'Ask the assistant',
    sub: 'Travel answers, grounded in local knowledge',
    accent: 'qa-chat',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M4.5 6.8A2.3 2.3 0 0 1 6.8 4.5h10.4a2.3 2.3 0 0 1 2.3 2.3v7.4a2.3 2.3 0 0 1-2.3 2.3H9.6l-3.8 3v-3H6.8a2.3 2.3 0 0 1-2.3-2.3V6.8Z"
          stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"
        />
        <path d="M8.5 9.5h7M8.5 12.5h4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    to: '/identify',
    title: 'Identify a landmark',
    sub: 'Upload a photo, get the story',
    accent: 'qa-identify',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M4.5 8.3A2.3 2.3 0 0 1 6.8 6h1.4l1.3-1.7a1.5 1.5 0 0 1 1.2-.6h2.6a1.5 1.5 0 0 1 1.2.6L15.8 6h1.4a2.3 2.3 0 0 1 2.3 2.3v8.4a2.3 2.3 0 0 1-2.3 2.3H6.8a2.3 2.3 0 0 1-2.3-2.3V8.3Z"
          stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"
        />
        <circle cx="12" cy="12.3" r="3.2" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    ),
  },
]

function ArrowIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h14m0 0-6-6m6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// Section wrapper: heading + optional "view all" link, consistent spacing.
function DashSection({ title, hint, linkTo, linkLabel, children }) {
  return (
    <section className="dash-section" aria-label={title}>
      <div className="dash-section-head">
        <div>
          <h2 className="dash-section-title">{title}</h2>
          {hint && <p className="dash-section-hint">{hint}</p>}
        </div>
        {linkTo && (
          <Link to={linkTo} className="dash-section-link">
            {linkLabel}
            <ArrowIcon />
          </Link>
        )}
      </div>
      {children}
    </section>
  )
}

function CardGridSkeleton() {
  return (
    <div className="attraction-grid dash-grid" aria-busy="true">
      {Array.from({ length: SECTION_SIZE }, (_, i) => (
        <AttractionCardSkeleton key={i} />
      ))}
    </div>
  )
}

function SectionError({ children }) {
  return <p className="dash-section-error">⚠️ {children}</p>
}

function formatDates(itinerary) {
  if (!itinerary.start_date) return 'Dates not set yet'
  const opts = { day: 'numeric', month: 'short' }
  const start = new Date(itinerary.start_date).toLocaleDateString(undefined, opts)
  if (!itinerary.end_date) return start
  const end = new Date(itinerary.end_date).toLocaleDateString(undefined, opts)
  return `${start} – ${end}`
}

export default function Dashboard() {
  const { user, firebaseUser } = useAuth()
  const name = user?.name || firebaseUser?.email?.split('@')[0] || 'traveler'
  const hasInterests = (user?.preferences?.interests || []).length > 0

  const { liked, toggleLike } = useLikes()

  // Per-section state: null = loading, [] = loaded empty, 'error' = failed.
  const [recommended, setRecommended] = useState(null)
  const [itineraries, setItineraries] = useState(null)
  const [trending, setTrending] = useState(null)

  useEffect(() => {
    let cancelled = false
    const load = (promise, setter) =>
      promise
        .then((data) => !cancelled && setter(data))
        .catch(() => !cancelled && setter('error'))

    load(fetchRecommendations({ limit: SECTION_SIZE }), setRecommended)
    load(fetchItineraries(), setItineraries)
    load(
      fetchAttractions({ sort: 'rating', perPage: SECTION_SIZE }).then(
        (data) => data.attractions
      ),
      setTrending
    )

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <PageContainer>
      <section className="home-hero dash-hero">
        <span className="badge badge-primary">Sri Lanka · AI travel companion</span>
        <h1 className="home-greeting">
          Welcome back, <span className="home-name">{name}</span>.
        </h1>
        <p className="home-lead">
          Here's what the island has lined up for you today.
        </p>
      </section>

      <section className="qa-row" aria-label="Quick actions">
        {QUICK_ACTIONS.map((qa) => (
          <Link key={qa.to} to={qa.to} className={`card card-hover qa-card ${qa.accent}`}>
            <span className="qa-icon">{qa.icon}</span>
            <span className="qa-text">
              <span className="qa-title">{qa.title}</span>
              <span className="qa-sub">{qa.sub}</span>
            </span>
            <span className="qa-arrow" aria-hidden="true">
              <ArrowIcon />
            </span>
          </Link>
        ))}
      </section>

      <DashSection
        title="Recommended for you"
        hint={
          hasInterests
            ? 'Picked from your travel interests.'
            : 'Popular picks — set your interests for tailored ones.'
        }
        linkTo="/profile"
        linkLabel="Tune your interests"
      >
        {recommended === null ? (
          <CardGridSkeleton />
        ) : recommended === 'error' ? (
          <SectionError>Couldn't load recommendations right now.</SectionError>
        ) : recommended.length === 0 ? (
          <p className="dash-section-error">
            Nothing to recommend yet — the catalogue may still be empty.
          </p>
        ) : (
          <div className="attraction-grid dash-grid">
            {recommended.map((rec, i) => (
              <div key={rec.id} className="rec-cell">
                <AttractionCard
                  attraction={rec}
                  index={i}
                  liked={liked.has(rec.id)}
                  onToggleLike={toggleLike}
                />
                <span className="rec-reason">
                  <span aria-hidden="true">✦</span> {rec.reason}
                </span>
              </div>
            ))}
          </div>
        )}
      </DashSection>

      <DashSection
        title="Continue planning"
        hint="Pick up a trip where you left off."
        linkTo={itineraries?.length ? '/itineraries' : undefined}
        linkLabel="All itineraries"
      >
        {itineraries === null ? (
          <div className="itinerary-row-list" aria-busy="true">
            <div className="card itinerary-row skeleton" style={{ height: '4.5rem' }} />
          </div>
        ) : itineraries === 'error' ? (
          <SectionError>Couldn't load your itineraries right now.</SectionError>
        ) : itineraries.length === 0 ? (
          <div className="card dash-empty">
            <span className="dash-empty-icon" aria-hidden="true">🧳</span>
            <div className="dash-empty-text">
              <h3>No trips in the works</h3>
              <p>Start an itinerary and your plans will show up here.</p>
            </div>
            <Link to="/itineraries" className="btn btn-primary">
              Plan a trip
            </Link>
          </div>
        ) : (
          <div className="itinerary-row-list">
            {itineraries.map((it) => (
              <Link key={it.id} to="/itineraries" className="card card-hover itinerary-row">
                <span className="itinerary-row-icon" aria-hidden="true">🗺️</span>
                <span className="itinerary-row-text">
                  <span className="itinerary-row-title">{it.title}</span>
                  <span className="itinerary-row-meta">
                    {formatDates(it)} · {it.item_count}{' '}
                    {it.item_count === 1 ? 'place' : 'places'}
                    {it.preview_stops.length > 0 && (
                      <> · {it.preview_stops.join(' · ')}</>
                    )}
                  </span>
                </span>
                <span className="itinerary-row-arrow" aria-hidden="true">
                  <ArrowIcon />
                </span>
              </Link>
            ))}
          </div>
        )}
      </DashSection>

      <DashSection
        title="Trending attractions"
        hint="The island's highest-rated places right now."
        linkTo="/explore"
        linkLabel="Explore all"
      >
        {trending === null ? (
          <CardGridSkeleton />
        ) : trending === 'error' ? (
          <SectionError>Couldn't load trending attractions right now.</SectionError>
        ) : trending.length === 0 ? (
          <p className="dash-section-error">No attractions in the catalogue yet.</p>
        ) : (
          <div className="attraction-grid dash-grid">
            {trending.map((attraction, i) => (
              <AttractionCard
                key={attraction.id}
                attraction={attraction}
                index={i}
                liked={liked.has(attraction.id)}
                onToggleLike={toggleLike}
              />
            ))}
          </div>
        )}
      </DashSection>
    </PageContainer>
  )
}
