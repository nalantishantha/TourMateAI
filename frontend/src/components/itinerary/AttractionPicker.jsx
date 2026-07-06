// Modal for adding attractions to one itinerary day. Reuses the Explore
// search endpoint (GET /api/attractions) with debounced live search; the
// top-rated places show before the user types. Stays open after each add so
// a whole day can be filled in one visit.

import { useEffect, useRef, useState } from 'react'
import AttractionImage from '../explore/AttractionImage'
import { fetchAttractions } from '../../services/attractions'

const SEARCH_DEBOUNCE_MS = 300
const RESULTS_PER_PAGE = 8

export default function AttractionPicker({ dayNumber, plannedIds, onAdd, onClose }) {
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [addingId, setAddingId] = useState(null)
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Close on Escape, from anywhere in the dialog.
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(false)
    fetchAttractions({ search, sort: 'rating', perPage: RESULTS_PER_PAGE })
      .then((data) => {
        if (!cancelled) setResults(data.attractions)
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
  }, [search])

  const handleAdd = async (attraction) => {
    if (addingId) return
    setAddingId(attraction.id)
    try {
      await onAdd(attraction)
    } finally {
      setAddingId(null)
    }
  }

  return (
    <div className="it-modal-backdrop" onClick={onClose}>
      <div
        className="it-modal it-picker card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="picker-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="it-modal-head">
          <h2 id="picker-title">Add to day {dayNumber}</h2>
          <button type="button" className="it-modal-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <input
          ref={inputRef}
          type="search"
          className="input"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search attractions — try “temple” or “beach”…"
          aria-label="Search attractions to add"
        />

        <div className="it-picker-results">
          {loading ? (
            <div className="it-picker-state">
              <div className="spinner" />
            </div>
          ) : error ? (
            <p className="it-picker-note">Search failed — check your connection and try again.</p>
          ) : results.length === 0 ? (
            <p className="it-picker-note">
              No places match {search ? `“${search}”` : 'that'}. Try another word.
            </p>
          ) : (
            results.map((attraction) => {
              const planned = plannedIds.has(attraction.id)
              return (
                <div key={attraction.id} className="it-picker-row">
                  <div className="it-picker-thumb">
                    <AttractionImage attraction={attraction} className="it-picker-img" />
                  </div>
                  <div className="it-picker-body">
                    <span className="it-picker-name">{attraction.name}</span>
                    <span className="it-picker-meta">
                      {attraction.category}
                      {attraction.avg_rating ? ` · ★ ${attraction.avg_rating.toFixed(1)}` : ''}
                    </span>
                  </div>
                  <button
                    type="button"
                    className={`btn ${planned ? 'btn-ghost' : 'btn-secondary'} it-picker-add`}
                    onClick={() => handleAdd(attraction)}
                    disabled={addingId === attraction.id}
                  >
                    {addingId === attraction.id ? 'Adding…' : planned ? '+ Add again' : '+ Add'}
                  </button>
                </div>
              )
            })
          )}
        </div>

        <p className="it-picker-hint">
          Places already in your trip show “Add again” — revisiting a spot on
          another day is fair game.
        </p>
      </div>
    </div>
  )
}
