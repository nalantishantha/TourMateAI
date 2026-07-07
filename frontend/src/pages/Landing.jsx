// Pre-login landing page — the first impression. A full-viewport photo hero
// with the value proposition and a search-shaped CTA, an editorial strip of
// destinations, the three AI capabilities, and a closing CTA band. All
// photography comes from the bundled scenes in assets/photos.js.

import { Link, useLocation } from 'react-router-dom'
import Logo from '../components/layout/Logo'
import { useAuth } from '../context/AuthContext'
import { scenes } from '../assets/photos'
import '../styles/landing.css'

const WONDERS = [
  { scene: scenes.sigiriyaGround, name: 'Sigiriya', region: 'Cultural Triangle' },
  { scene: scenes.nineArch, name: 'Nine Arch Bridge', region: 'Ella' },
  { scene: scenes.templeOfTooth, name: 'Temple of the Tooth', region: 'Kandy' },
  { scene: scenes.coconutTreeHill, name: 'Coconut Tree Hill', region: 'Mirissa' },
  { scene: scenes.leopard, name: 'Yala National Park', region: 'Southern Province' },
  { scene: scenes.galleFort, name: 'Galle Fort', region: 'South Coast' },
  { scene: scenes.adamsPeak, name: "Adam's Peak", region: 'Hill Country' },
  { scene: scenes.dambulla, name: 'Dambulla Cave Temple', region: 'Cultural Triangle' },
]

const FEATURES = [
  {
    scene: scenes.adamsPeak,
    title: 'Picks that fit the day',
    copy: 'Recommendations weigh your interests against where you are, the weather overhead, and the hour — so a rainy Kandy afternoon suggests the museum, not the summit.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 3l1.9 5.3L19 10l-5.1 1.7L12 17l-1.9-5.3L5 10l5.1-1.7L12 3z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path d="M18.5 15.5l.9 2.6 2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9.9-2.6z" fill="currentColor" />
      </svg>
    ),
  },
  {
    scene: scenes.templeOfTooth,
    title: 'Answers like a local',
    copy: 'Ask anything — festival dates, dress codes, the best train seats — and get answers grounded in a Sri Lanka knowledge base, with sources you can check.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M21 12a8 8 0 0 1-8 8H4l1.7-3.2A8 8 0 1 1 21 12z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <circle cx="9" cy="12" r="1" fill="currentColor" />
        <circle cx="13" cy="12" r="1" fill="currentColor" />
        <circle cx="17" cy="12" r="1" fill="currentColor" />
      </svg>
    ),
  },
  {
    scene: scenes.dambulla,
    title: 'Point, shoot, identify',
    copy: 'Photograph a temple, bridge, or ruin you can’t name and the vision model identifies it, tells its story, and lines up what to see nearby.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="14" r="3.5" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    ),
  },
]

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="m16 16 4.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

export default function Landing() {
  const { isAuthenticated } = useAuth()
  const { state } = useLocation() // preserve a remembered destination through login

  return (
    <div className="landing">
      <header className="landing-nav">
        <Logo />
        <nav className="landing-nav-actions" aria-label="Account">
          {isAuthenticated ? (
            <Link to="/" className="btn btn-white">
              Open the app
            </Link>
          ) : (
            <>
              <Link to="/login" state={state} className="btn btn-frost">
                Log in
              </Link>
              <Link to="/signup" state={state} className="btn btn-white">
                Get started
              </Link>
            </>
          )}
        </nav>
      </header>

      <section className="landing-hero">
        <img
          className="landing-hero-photo"
          src={scenes.stiltFishing.src}
          style={{ objectPosition: scenes.stiltFishing.position }}
          alt={scenes.stiltFishing.alt}
        />
        <div className="landing-hero-scrim" aria-hidden="true" />

        <div className="landing-hero-content">
          <span className="landing-kicker">Your AI travel companion · Sri Lanka</span>
          <h1 className="landing-headline">Sri Lanka, tuned to you.</h1>
          <p className="landing-subhead">
            One companion that reads the weather, knows where you're standing,
            and plans like it grew up here — recommendations, answers, and
            landmark recognition for the whole island.
          </p>

          <Link
            to={isAuthenticated ? '/explore' : '/signup'}
            state={state}
            className="landing-search"
            aria-label="Start exploring attractions"
          >
            <span className="landing-search-icon">
              <SearchIcon />
            </span>
            <span className="landing-search-text">
              Where to? Sigiriya, Ella, Mirissa…
            </span>
            <span className="btn btn-primary landing-search-btn">Explore</span>
          </Link>
        </div>
      </section>

      <section className="landing-section" aria-labelledby="wonders-title">
        <div className="landing-section-head">
          <div>
            <span className="landing-eyebrow">Where the island takes you</span>
            <h2 id="wonders-title" className="landing-h2">
              Eight wonders to start with
            </h2>
          </div>
        </div>

        <div className="wonder-row">
          {WONDERS.map(({ scene, name, region }) => (
            <Link
              key={name}
              to={isAuthenticated ? '/explore' : '/signup'}
              className="wonder-card"
            >
              <img
                src={scene.src}
                style={{ objectPosition: scene.position }}
                alt={scene.alt}
                loading="lazy"
              />
              <div className="wonder-scrim" aria-hidden="true" />
              <span className="wonder-label">
                <span className="wonder-name">{name}</span>
                <span className="wonder-region">{region}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="landing-section" aria-labelledby="features-title">
        <div className="landing-section-head">
          <div>
            <span className="landing-eyebrow">What makes it a companion</span>
            <h2 id="features-title" className="landing-h2">
              Three ways the AI carries your trip
            </h2>
          </div>
        </div>

        <div className="feature-grid">
          {FEATURES.map(({ scene, title, copy, icon }) => (
            <article key={title} className="feature-card">
              <div className="feature-photo">
                <img
                  src={scene.src}
                  style={{ objectPosition: scene.position }}
                  alt={scene.alt}
                  loading="lazy"
                />
              </div>
              <div className="feature-body">
                <span className="feature-icon">{icon}</span>
                <h3 className="feature-title">{title}</h3>
                <p className="feature-copy">{copy}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-cta">
        <img
          src={scenes.whaleWatching.src}
          style={{ objectPosition: scenes.whaleWatching.position }}
          alt={scenes.whaleWatching.alt}
          loading="lazy"
        />
        <div className="landing-cta-scrim" aria-hidden="true" />
        <div className="landing-cta-content">
          <h2>Ready when you are.</h2>
          <p>Free for travelers. Set your interests once — the island does the rest.</p>
          <div className="landing-cta-actions">
            {isAuthenticated ? (
              <Link to="/" className="btn btn-white btn-lg">
                Open the app
              </Link>
            ) : (
              <>
                <Link to="/signup" className="btn btn-white btn-lg">
                  Create your free account
                </Link>
                <Link to="/login" className="btn btn-frost btn-lg">
                  Log in
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <Logo />
        <span>© {new Date().getFullYear()} TourMateAI · A CIS6035 project</span>
      </footer>
    </div>
  )
}
