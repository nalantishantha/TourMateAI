// Profile — the user's account, editable travel preferences (which feed the
// recommendation engine), their review history, and their liked places.
//
// Preferences are saved via PUT /api/users/me and pushed back into AuthContext
// so the rest of the app (navbar, dashboard greeting) stays in sync. Reviews
// come from GET /api/users/me/feedback; liked places are the local heart set
// (useLikes) hydrated against the attractions catalogue.

import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import PageContainer from '../components/layout/PageContainer'
import AttractionCard from '../components/explore/AttractionCard'
import StarRating from '../components/explore/StarRating'
import { useAuth } from '../context/AuthContext'
import useLikes from '../hooks/useLikes'
import { fetchAttractions } from '../services/attractions'
import {
  BUDGET_OPTIONS,
  INTERESTS,
  PACE_OPTIONS,
  fetchMyFeedback,
  updateMyProfile,
} from '../services/users'
import '../styles/explore.css' // AttractionCard + grid styles
import '../styles/profile.css'

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatMonthYear(iso) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  })
}

// Up to two initials from a name for the avatar (first + last word).
function initials(name) {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  const first = parts[0][0]
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase()
}

// Two interest arrays are "the same" if they hold the same values (order-free).
function sameInterests(a, b) {
  if (a.length !== b.length) return false
  const set = new Set(a)
  return b.every((value) => set.has(value))
}

// ---- Identity header --------------------------------------------------------

// The page's focal point: who this account belongs to, plus at-a-glance stats.
// reviewCount is null while the feedback request is still in flight.
function ProfileIdentity({ user, reviewCount, savedCount }) {
  const interestCount = Array.isArray(user.preferences?.interests)
    ? user.preferences.interests.length
    : 0
  const memberSince = formatMonthYear(user.created_at)

  return (
    <section className="card profile-identity">
      <div className="profile-identity-head">
        <div className="profile-avatar" aria-hidden="true">
          {initials(user.name)}
        </div>
        <div className="profile-identity-info">
          <h2 className="profile-identity-name">{user.name || 'Traveller'}</h2>
          <p className="profile-identity-email">{user.email}</p>
          {memberSince && (
            <p className="profile-identity-since">Member since {memberSince}</p>
          )}
        </div>
      </div>

      <dl className="profile-stats">
        <div className="profile-stat">
          <dt className="profile-stat-label">Interests</dt>
          <dd className="profile-stat-value">{interestCount}</dd>
        </div>
        <div className="profile-stat">
          <dt className="profile-stat-label">Reviews</dt>
          <dd className="profile-stat-value">
            {reviewCount == null ? '—' : reviewCount}
          </dd>
        </div>
        <div className="profile-stat">
          <dt className="profile-stat-label">Saved</dt>
          <dd className="profile-stat-value">{savedCount}</dd>
        </div>
      </dl>
    </section>
  )
}

// ---- Preferences form -------------------------------------------------------

function PreferencesForm({ user, onSaved }) {
  const initial = useMemo(() => {
    const prefs = user.preferences || {}
    return {
      name: user.name || '',
      interests: Array.isArray(prefs.interests) ? prefs.interests : [],
      budget: prefs.budget || '',
      pace: prefs.pace || '',
    }
  }, [user])

  const [name, setName] = useState(initial.name)
  const [interests, setInterests] = useState(initial.interests)
  const [budget, setBudget] = useState(initial.budget)
  const [pace, setPace] = useState(initial.pace)

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)

  // Reseed the form if the underlying user identity changes (e.g. re-login).
  const seededFor = useRef(user.id)
  useEffect(() => {
    if (seededFor.current === user.id) return
    seededFor.current = user.id
    setName(initial.name)
    setInterests(initial.interests)
    setBudget(initial.budget)
    setPace(initial.pace)
    setSaved(false)
    setError(null)
  }, [user.id, initial])

  const dirty =
    name.trim() !== initial.name ||
    budget !== initial.budget ||
    pace !== initial.pace ||
    !sameInterests(interests, initial.interests)

  const touch = () => {
    if (saved) setSaved(false)
    if (error) setError(null)
  }

  const toggleInterest = (value) => {
    touch()
    setInterests((prev) =>
      prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value]
    )
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Please enter your name.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const updated = await updateMyProfile({
        name: trimmed,
        preferences: {
          interests,
          budget: budget || null,
          pace: pace || null,
        },
      })
      onSaved(updated) // refresh app-wide user + reseed initial snapshot
      setSaved(true)
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          'Could not save your profile. Please try again.'
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="card card-pad profile-card" onSubmit={handleSubmit}>
      <div className="profile-card-head">
        <h2 className="profile-section-title">Profile &amp; travel preferences</h2>
        <p className="profile-section-hint">
          Tell us what you love — we use this to tailor your recommendations.
        </p>
      </div>

      <div className="field">
        <label className="label" htmlFor="profile-name">
          Name
        </label>
        <input
          id="profile-name"
          className="input"
          type="text"
          value={name}
          maxLength={120}
          onChange={(e) => {
            setName(e.target.value)
            touch()
          }}
          placeholder="Your name"
        />
      </div>

      <div className="field">
        <label className="label" htmlFor="profile-email">
          Email
        </label>
        <input
          id="profile-email"
          className="input"
          type="email"
          value={user.email || ''}
          disabled
          readOnly
        />
        <p className="hint">Managed by your sign-in — it can't be changed here.</p>
      </div>

      <fieldset className="field profile-fieldset">
        <legend className="label">Travel interests</legend>
        <p className="hint profile-fieldset-hint">
          Pick as many as you like.
        </p>
        <div className="pref-chips" role="group" aria-label="Travel interests">
          {INTERESTS.map((interest) => {
            const selected = interests.includes(interest)
            return (
              <button
                key={interest}
                type="button"
                className={`pref-chip${selected ? ' selected' : ''}`}
                aria-pressed={selected}
                onClick={() => toggleInterest(interest)}
              >
                {interest}
              </button>
            )
          })}
        </div>
      </fieldset>

      <div className="profile-selects">
        <div className="field">
          <label className="label" htmlFor="profile-budget">
            Budget
          </label>
          <select
            id="profile-budget"
            className="input"
            value={budget}
            onChange={(e) => {
              setBudget(e.target.value)
              touch()
            }}
          >
            <option value="">No preference</option>
            {BUDGET_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label className="label" htmlFor="profile-pace">
            Trip pace
          </label>
          <select
            id="profile-pace"
            className="input"
            value={pace}
            onChange={(e) => {
              setPace(e.target.value)
              touch()
            }}
          >
            <option value="">No preference</option>
            {PACE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {saved && !error && (
        <div className="alert alert-success">Your profile has been saved.</div>
      )}

      <div className="profile-save-row">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={saving || !dirty}
        >
          {saving ? 'Saving…' : saved && !dirty ? 'Saved' : 'Save changes'}
        </button>
        {dirty && !saving && (
          <span className="profile-save-note">You have unsaved changes.</span>
        )}
      </div>
    </form>
  )
}

// ---- Review history ---------------------------------------------------------

// Reviews are fetched once at the page level (they also feed the identity
// stat) and handed down here. `reviews === null` means still loading.
function ReviewHistory({ reviews, error }) {
  return (
    <section className="card card-pad profile-card">
      <h2 className="profile-section-title">Your reviews</h2>

      {error ? (
        <p className="profile-empty">Couldn't load your reviews right now.</p>
      ) : reviews === null ? (
        <p className="profile-empty">Loading your reviews…</p>
      ) : reviews.length === 0 ? (
        <p className="profile-empty">
          You haven't reviewed anywhere yet.{' '}
          <Link to="/explore">Explore attractions</Link> and share your rating.
        </p>
      ) : (
        <ul className="profile-review-list" role="list">
          {reviews.map((review) => (
            <li key={review.id} className="profile-review-item">
              <div className="profile-review-main">
                <Link
                  to={`/explore/${review.attraction_id}`}
                  className="profile-review-name"
                >
                  {review.attraction_name || 'Attraction'}
                </Link>
                <div className="profile-review-meta">
                  <StarRating value={review.rating} size={14} />
                  <span className="profile-review-date">
                    {formatDate(review.created_at)}
                  </span>
                </div>
                {review.comment && (
                  <p className="profile-review-comment">{review.comment}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

// ---- Liked places -----------------------------------------------------------

function LikedPlaces({ liked, toggleLike }) {
  const [catalogue, setCatalogue] = useState(null) // id -> attraction
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    // One request covers the whole seeded catalogue; we filter to the hearts.
    fetchAttractions({ perPage: 100, sort: 'name' })
      .then((data) => {
        if (cancelled) return
        const map = new Map(data.attractions.map((a) => [a.id, a]))
        setCatalogue(map)
      })
      .catch(() => !cancelled && setError(true))
    return () => {
      cancelled = true
    }
  }, [])

  const likedAttractions =
    catalogue === null
      ? []
      : [...liked].map((id) => catalogue.get(id)).filter(Boolean)

  return (
    <section className="card card-pad profile-card">
      <h2 className="profile-section-title">Liked places</h2>

      {error ? (
        <p className="profile-empty">Couldn't load your liked places right now.</p>
      ) : catalogue === null ? (
        <p className="profile-empty">Loading your liked places…</p>
      ) : likedAttractions.length === 0 ? (
        <p className="profile-empty">
          No favourites yet — tap the heart on any place in{' '}
          <Link to="/explore">Explore</Link> to save it here.
        </p>
      ) : (
        <div className="attraction-grid profile-liked-grid">
          {likedAttractions.map((attraction, i) => (
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
    </section>
  )
}

// ---- Page -------------------------------------------------------------------

export default function Profile() {
  const { user, firebaseUser, logout, setUser } = useAuth()
  const { liked, toggleLike } = useLikes()

  // Fetch the user's reviews once here — they feed both the identity stat and
  // the review list below, so a single request keeps the two in sync.
  const [reviews, setReviews] = useState(null) // null = loading
  const [reviewsError, setReviewsError] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetchMyFeedback()
      .then((data) => !cancelled && setReviews(data))
      .catch(() => !cancelled && setReviewsError(true))
    return () => {
      cancelled = true
    }
  }, [])

  // Reseed the form's baseline after a save so "unsaved changes" clears.
  const handleSaved = (updated) => setUser(updated)

  return (
    <PageContainer
      title="Your profile"
      subtitle="Manage your account and tailor your recommendations."
      actions={
        <button type="button" className="btn btn-secondary" onClick={logout}>
          Log out
        </button>
      }
    >
      {!user ? (
        <div className="card card-pad profile-card">
          <p className="profile-empty">
            Loading your profile…
            {firebaseUser?.email && (
              <>
                {' '}Signed in as {firebaseUser.email}.
              </>
            )}
          </p>
        </div>
      ) : (
        <div className="profile-stack">
          <ProfileIdentity
            user={user}
            reviewCount={reviewsError ? null : reviews?.length ?? null}
            savedCount={liked.size}
          />
          <PreferencesForm user={user} onSaved={handleSaved} />
          <ReviewHistory reviews={reviews} error={reviewsError} />
          <LikedPlaces liked={liked} toggleLike={toggleLike} />
        </div>
      )}
    </PageContainer>
  )
}
