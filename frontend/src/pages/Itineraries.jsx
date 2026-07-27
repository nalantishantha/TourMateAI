// My Itineraries — the trips list. Cards link into the Itinerary Builder;
// "Plan a new trip" opens a modal that creates the itinerary and jumps
// straight into the builder for it.

import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PageContainer from '../components/layout/PageContainer'
import { attractionPhoto } from '../assets/photos'
import {
  createItinerary,
  deleteItinerary,
  fetchItineraries,
} from '../services/itineraries'
import { dayCount, formatTripRange } from '../utils/tripDates'
import '../styles/itinerary.css'

function todayIso(offsetDays = 0) {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return d.toISOString().slice(0, 10)
}

/** Modal form: trip title + dates, with a live day-count readout. */
function NewTripModal({ onClose }) {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [startLocation, setStartLocation] = useState('')
  const [endLocation, setEndLocation] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState(todayIso())
  const [endDate, setEndDate] = useState(todayIso(2))
  const [preferences, setPreferences] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const days = dayCount(startDate, endDate)
  const datesInvalid = Boolean(startDate && endDate && !days)

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!destination.trim() || datesInvalid || submitting) return
    setSubmitting(true)
    setError(null)
    
    // The title of the itinerary is the destination
    let title = destination.trim()
    if (origin.trim()) {
      title += ` from ${origin.trim()}`
    }

    try {
      const itinerary = await createItinerary({
        title: title.trim(),
        startLocation: startLocation.trim(),
        endLocation: endLocation.trim(),
        description: description.trim(),
        startDate,
        endDate,
        is_ai_generated: true,
        preferences: preferences.trim() // Although DB doesn't save preferences directly, AI agent uses it on next page load if we passed it.
      })
      // Navigate to the AI Trip Viewer 
      navigate(`/itineraries/${itinerary.id}`, { state: { initialPreferences: preferences.trim() } })
    } catch (err) {
      setError(err?.response?.data?.error || 'Could not create the trip. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <div className="it-modal-backdrop" onClick={onClose}>
      <div
        className="it-modal card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-trip-title"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '600px' }}
      >
        <div className="it-modal-head">
          <h2 id="new-trip-title">AI Trip Planner</h2>
          <button type="button" className="it-modal-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="it-date-row">
            <div className="field">
              <label className="label" htmlFor="trip-origin">Start from</label>
              <input
                id="trip-origin"
                className="input"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                placeholder="e.g. New York (Optional)"
                maxLength={200}
              />
            </div>
            <div className="field">
              <label className="label" htmlFor="trip-dest">To (Destination)</label>
              <input
                id="trip-dest"
                className="input"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="e.g. Paris"
                maxLength={200}
                autoFocus
              />
            </div>
          </div>

          <div className="it-date-row">
            <div className="field">
              <label className="label" htmlFor="trip-from">From</label>
              <input
                id="trip-from"
                className="input"
                value={startLocation}
                onChange={(e) => setStartLocation(e.target.value)}
                placeholder="Starting location (e.g. Colombo)"
              />
            </div>
            <div className="field">
              <label className="label" htmlFor="trip-to">To</label>
              <input
                id="trip-to"
                className="input"
                value={endLocation}
                onChange={(e) => setEndLocation(e.target.value)}
                placeholder="Destination (e.g. Galle)"
              />
            </div>
          </div>

          <div className="field">
            <label className="label" htmlFor="trip-description">Trip description (Optional)</label>
            <textarea
              id="trip-description"
              className="input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. A beach trip with sea baths and turtles"
              rows={3}
            />
          </div>

          <div className="it-date-row">
            <div className="field">
              <label className="label" htmlFor="trip-start">Start date</label>
              <input
                id="trip-start"
                className="input"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="field">
              <label className="label" htmlFor="trip-end">To date</label>
              <input
                id="trip-end"
                className="input"
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          
          <div className="field">
            <label className="label" htmlFor="trip-prefs">Opinions / Ideas</label>
            <textarea
              id="trip-prefs"
              className="input"
              value={preferences}
              onChange={(e) => setPreferences(e.target.value)}
              placeholder="e.g. I love museums, want to keep it budget-friendly, and prefer morning flights."
              style={{ minHeight: '80px', resize: 'vertical' }}
            />
          </div>

          <p className={`it-days-hint ${datesInvalid ? 'it-days-hint-error' : ''}`} aria-live="polite">
            {datesInvalid
              ? 'The end date is before the start date.'
              : days
                ? `${days} day${days === 1 ? '' : 's'} of adventure`
                : 'Pick your travel dates'}
          </p>

          {error && <div className="alert alert-error">{error}</div>}

          <div className="it-modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!destination.trim() || datesInvalid || submitting}
            >
              {submitting ? 'Creating…' : 'Create & Plan with AI'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/** Real photos of the trip's own stops, matched by name — the card's cover. */
function tripCoverPhotos(previewStops, max = 3) {
  const photos = []
  const seen = new Set()
  for (const name of previewStops) {
    const photo = attractionPhoto({ name })
    if (photo && !seen.has(photo.src)) {
      seen.add(photo.src)
      photos.push(photo)
    }
    if (photos.length >= max) break
  }
  return photos
}

function TripCard({ itinerary, onDelete }) {
  const days = dayCount(itinerary.start_date, itinerary.end_date)
  const range = formatTripRange(itinerary.start_date, itinerary.end_date)
  const covers = tripCoverPhotos(itinerary.preview_stops)

  const handleDelete = (event) => {
    event.preventDefault()
    event.stopPropagation()
    onDelete(itinerary)
  }

  return (
    <Link to={`/itineraries/${itinerary.id}`} className="trip-card card card-hover">
      <div className="trip-card-photos" aria-hidden="true">
        {covers.length > 0 ? (
          covers.map((photo) => (
            <img
              key={photo.src}
              src={photo.src}
              style={{ objectPosition: photo.position }}
              alt=""
              loading="lazy"
            />
          ))
        ) : (
          <span className="trip-card-photos-empty">🧭</span>
        )}
      </div>

      <div className="trip-card-body">
        <div className="trip-card-top">
          <div className="trip-card-badges">
            {days && <span className="badge badge-primary">{days} day{days === 1 ? '' : 's'}</span>}
            <span className="badge">
              {itinerary.item_count} place{itinerary.item_count === 1 ? '' : 's'}
            </span>
          </div>
          <button
            type="button"
            className="trip-card-delete"
            onClick={handleDelete}
            aria-label={`Delete ${itinerary.title}`}
            title="Delete trip"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-8 0 1 13h8l1-13"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        <h3 className="trip-card-title">{itinerary.title}</h3>
        {range && <p className="trip-card-range">{range}</p>}

        {itinerary.preview_stops.length > 0 ? (
          <p className="trip-card-stops">
            {itinerary.preview_stops.join(' · ')}
            {itinerary.item_count > itinerary.preview_stops.length && ' · …'}
          </p>
        ) : (
          <p className="trip-card-stops trip-card-stops-empty">
            Nothing planned yet — tap to start adding places.
          </p>
        )}

        <span className="trip-card-cta" aria-hidden="true">
          Open planner
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 12h14m0 0-6-6m6 6-6 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </div>
    </Link>
  )
}

export default function Itineraries() {
  const [itineraries, setItineraries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetchItineraries()
      .then((rows) => {
        if (!cancelled) setItineraries(rows)
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const handleDelete = async (itinerary) => {
    if (!window.confirm(`Delete “${itinerary.title}” and everything planned in it?`)) return
    const previous = itineraries
    setItineraries((prev) => prev.filter((i) => i.id !== itinerary.id))
    try {
      await deleteItinerary(itinerary.id)
    } catch {
      setItineraries(previous) // deletion failed — put it back
    }
  }

  return (
    <PageContainer
      title="My itineraries"
      subtitle="Your trips, planned day by day."
      actions={
        <button type="button" className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Plan a new trip
        </button>
      }
    >
      {loading ? (
        <div className="loading-screen">
          <div className="spinner" />
          <p>Loading your trips…</p>
        </div>
      ) : error ? (
        <div className="alert alert-error">
          We couldn't load your itineraries. Refresh the page to try again.
        </div>
      ) : itineraries.length === 0 ? (
        <div className="explore-empty card">
          <span className="explore-empty-icon" aria-hidden="true">🧳</span>
          <h3>No trips yet</h3>
          <p>
            Create your first itinerary and build it day by day — beaches one
            morning, ancient cities the next.
          </p>
          <button type="button" className="btn btn-primary" onClick={() => setShowModal(true)}>
            Plan a new trip
          </button>
        </div>
      ) : (
        <div className="trip-grid">
          {itineraries.map((itinerary) => (
            <TripCard key={itinerary.id} itinerary={itinerary} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {showModal && <NewTripModal onClose={() => setShowModal(false)} />}
    </PageContainer>
  )
}
