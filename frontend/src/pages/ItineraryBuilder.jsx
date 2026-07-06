// Itinerary Builder — plan one trip day by day. Editable title/dates up top
// (auto-saved, with a status chip), a vertical day-by-day timeline where each
// day takes attractions from the search picker, supports drag-to-reorder
// within the day, and item removal. A sticky summary rail keeps the trip
// totals in view and hosts the (coming-soon) weather suggestions button.

import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import AttractionImage from '../components/explore/AttractionImage'
import AttractionPicker from '../components/itinerary/AttractionPicker'
import {
  addItineraryItem,
  fetchItinerary,
  removeItineraryItem,
  reorderItineraryItems,
  updateItinerary,
} from '../services/itineraries'
import { dayCount, dayDateLabel, formatTripRange } from '../utils/tripDates'
import '../styles/itinerary.css'

function DragHandleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="9" cy="6" r="1.6" />
      <circle cx="15" cy="6" r="1.6" />
      <circle cx="9" cy="12" r="1.6" />
      <circle cx="15" cy="12" r="1.6" />
      <circle cx="9" cy="18" r="1.6" />
      <circle cx="15" cy="18" r="1.6" />
    </svg>
  )
}

/** One attraction row inside a day — draggable, removable, links to detail. */
function DayItemRow({ item, dragging, onDragStart, onDragEnter, onDragEnd, onRemove }) {
  const attraction = item.attraction
  return (
    <div
      className={`it-item ${dragging ? 'it-item-dragging' : ''}`}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/plain', String(item.id))
        onDragStart(item)
      }}
      onDragEnter={() => onDragEnter(item)}
      onDragOver={(e) => e.preventDefault()}
      onDragEnd={onDragEnd}
      onDrop={(e) => e.preventDefault()}
    >
      <span className="it-item-handle" title="Drag to reorder" aria-hidden="true">
        <DragHandleIcon />
      </span>
      <div className="it-item-thumb">
        {attraction ? (
          <AttractionImage attraction={attraction} className="it-item-img" />
        ) : (
          <div className="it-item-img it-item-img-missing" />
        )}
      </div>
      <div className="it-item-body">
        {attraction ? (
          <Link to={`/explore/${attraction.id}`} className="it-item-name">
            {attraction.name}
          </Link>
        ) : (
          <span className="it-item-name">Removed attraction</span>
        )}
        <span className="it-item-meta">
          {attraction?.category}
          {attraction?.avg_rating ? ` · ★ ${attraction.avg_rating.toFixed(1)}` : ''}
        </span>
      </div>
      <button
        type="button"
        className="it-item-remove"
        onClick={() => onRemove(item)}
        aria-label={`Remove ${attraction?.name || 'item'} from this day`}
        title="Remove from day"
      >
        ✕
      </button>
    </div>
  )
}

export default function ItineraryBuilder() {
  const { id } = useParams()

  const [itinerary, setItinerary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  // Editable meta, kept apart from the saved itinerary so typing is instant.
  const [titleDraft, setTitleDraft] = useState('')
  const [startDraft, setStartDraft] = useState('')
  const [endDraft, setEndDraft] = useState('')
  const [saveState, setSaveState] = useState('idle') // idle | saving | saved | error

  const [pickerDay, setPickerDay] = useState(null) // day number or null
  const [drag, setDrag] = useState(null) // { itemId, day }
  const dragChanged = useRef(false)
  const preDragItems = useRef(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setLoadError(false)
    fetchItinerary(id)
      .then((data) => {
        if (cancelled) return
        setItinerary(data)
        setTitleDraft(data.title)
        setStartDraft(data.start_date || '')
        setEndDraft(data.end_date || '')
      })
      .catch(() => {
        if (!cancelled) setLoadError(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  const items = useMemo(() => itinerary?.items || [], [itinerary])

  const totalDays = useMemo(() => {
    const fromDates = dayCount(itinerary?.start_date, itinerary?.end_date)
    if (fromDates) return fromDates
    return Math.max(1, ...items.map((i) => i.day_number || 1))
  }, [itinerary, items])

  const daysCovered = useMemo(
    () => new Set(items.map((i) => i.day_number)).size,
    [items]
  )

  const plannedIds = useMemo(
    () => new Set(items.map((i) => i.attraction_id)),
    [items]
  )

  const datesInvalid = Boolean(
    startDraft && endDraft && !dayCount(startDraft, endDraft)
  )

  // ---- Meta editing (title + dates), saved on commit ------------------------

  const saveMeta = async (fields) => {
    setSaveState('saving')
    try {
      const updated = await updateItinerary(itinerary.id, fields)
      // The server may pull stranded items onto the last day when a trip
      // shrinks — adopt its state wholesale so the timeline matches.
      setItinerary(updated)
      setSaveState('saved')
    } catch {
      setSaveState('error')
    }
  }

  const commitTitle = () => {
    const next = titleDraft.trim()
    if (!next) {
      setTitleDraft(itinerary.title) // don't allow blanking the title
      return
    }
    if (next !== itinerary.title) saveMeta({ title: next })
  }

  const commitDates = (nextStart, nextEnd) => {
    setStartDraft(nextStart)
    setEndDraft(nextEnd)
    if (nextStart && nextEnd && !dayCount(nextStart, nextEnd)) return // invalid — hold
    saveMeta({ start_date: nextStart || null, end_date: nextEnd || null })
  }

  // ---- Items: add / remove / reorder -----------------------------------------

  const handleAdd = async (attraction) => {
    try {
      const item = await addItineraryItem(itinerary.id, {
        attractionId: attraction.id,
        dayNumber: pickerDay,
      })
      setItinerary((prev) => ({ ...prev, items: [...prev.items, item] }))
    } catch {
      setSaveState('error')
    }
  }

  const handleRemove = async (item) => {
    const previous = itinerary.items
    setItinerary((prev) => ({
      ...prev,
      items: prev.items.filter((i) => i.id !== item.id),
    }))
    try {
      await removeItineraryItem(itinerary.id, item.id)
    } catch {
      setItinerary((prev) => ({ ...prev, items: previous })) // removal failed
      setSaveState('error')
    }
  }

  const handleDragStart = (item) => {
    setDrag({ itemId: item.id, day: item.day_number })
    dragChanged.current = false
    preDragItems.current = itinerary.items
  }

  // Reorder locally as the dragged row passes over a sibling in the same day.
  const handleDragEnter = (target) => {
    if (!drag || target.id === drag.itemId || target.day_number !== drag.day) return
    setItinerary((prev) => {
      const list = [...prev.items]
      const from = list.findIndex((i) => i.id === drag.itemId)
      const to = list.findIndex((i) => i.id === target.id)
      if (from === -1 || to === -1) return prev
      const [moved] = list.splice(from, 1)
      list.splice(to, 0, moved)
      dragChanged.current = true
      return { ...prev, items: list }
    })
  }

  const handleDragEnd = async () => {
    const current = drag
    setDrag(null)
    if (!current || !dragChanged.current) return
    const dayIds = itinerary.items
      .filter((i) => i.day_number === current.day)
      .map((i) => i.id)
    setSaveState('saving')
    try {
      const updated = await reorderItineraryItems(itinerary.id, current.day, dayIds)
      setItinerary(updated)
      setSaveState('saved')
    } catch {
      // Persisting the new order failed — snap back to the pre-drag order.
      setItinerary((prev) => ({ ...prev, items: preDragItems.current }))
      setSaveState('error')
    }
  }

  // ---- Render ------------------------------------------------------------------

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Loading your trip…</p>
      </div>
    )
  }

  if (loadError || !itinerary) {
    return (
      <div className="page page-narrow">
        <div className="explore-empty card">
          <span className="explore-empty-icon" aria-hidden="true">🧳</span>
          <h3>Trip not found</h3>
          <p>This itinerary doesn't exist or isn't yours.</p>
          <Link to="/itineraries" className="btn btn-primary">
            Back to my itineraries
          </Link>
        </div>
      </div>
    )
  }

  const range = formatTripRange(itinerary.start_date, itinerary.end_date)
  const dayNumbers = Array.from({ length: totalDays }, (_, i) => i + 1)

  return (
    <div className="page it-page">
      <Link to="/itineraries" className="detail-back">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M19 12H5m0 0 6-6m-6 6 6 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        My itineraries
      </Link>

      <div className="it-meta card card-pad">
        <div className="it-meta-title-row">
          <input
            className="it-title-input"
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
            maxLength={200}
            aria-label="Trip name"
          />
          <span
            className={`it-save-chip it-save-${saveState}`}
            role="status"
            aria-live="polite"
          >
            {saveState === 'saving' && 'Saving…'}
            {saveState === 'saved' && '✓ Saved'}
            {saveState === 'error' && "Couldn't save — retry your last change"}
          </span>
        </div>

        <div className="it-meta-dates">
          <div className="it-meta-date">
            <label className="label" htmlFor="it-start">Start</label>
            <input
              id="it-start"
              className="input"
              type="date"
              value={startDraft}
              onChange={(e) => commitDates(e.target.value, endDraft)}
            />
          </div>
          <div className="it-meta-date">
            <label className="label" htmlFor="it-end">End</label>
            <input
              id="it-end"
              className="input"
              type="date"
              value={endDraft}
              min={startDraft || undefined}
              onChange={(e) => commitDates(startDraft, e.target.value)}
            />
          </div>
          <p className={`it-days-hint ${datesInvalid ? 'it-days-hint-error' : ''}`}>
            {datesInvalid
              ? 'End date is before the start date — not saved yet.'
              : `${totalDays} day${totalDays === 1 ? '' : 's'}${range ? ` · ${range}` : ''}`}
          </p>
        </div>
      </div>

      <div className="it-layout">
        <div className="it-timeline">
          {dayNumbers.map((day) => {
            const dayItems = items.filter((i) => i.day_number === day)
            const dateLabel = dayDateLabel(itinerary.start_date, day)
            return (
              <section key={day} className="it-day" aria-label={`Day ${day}`}>
                <div className="it-day-rail" aria-hidden="true">
                  <span className="it-day-dot">{day}</span>
                  <span className="it-day-line" />
                </div>
                <div className="it-day-main">
                  <div className="it-day-head">
                    <h2 className="it-day-title">Day {day}</h2>
                    {dateLabel && <span className="it-day-date">{dateLabel}</span>}
                    <span className="it-day-count">
                      {dayItems.length > 0 &&
                        `${dayItems.length} place${dayItems.length === 1 ? '' : 's'}`}
                    </span>
                  </div>

                  {dayItems.length === 0 ? (
                    <div className="it-day-empty">
                      Nothing planned yet — add your first stop.
                    </div>
                  ) : (
                    <div className="it-day-items">
                      {dayItems.map((item) => (
                        <DayItemRow
                          key={item.id}
                          item={item}
                          dragging={drag?.itemId === item.id}
                          onDragStart={handleDragStart}
                          onDragEnter={handleDragEnter}
                          onDragEnd={handleDragEnd}
                          onRemove={handleRemove}
                        />
                      ))}
                    </div>
                  )}

                  <button
                    type="button"
                    className="btn btn-ghost it-day-add"
                    onClick={() => setPickerDay(day)}
                  >
                    + Add a place
                  </button>
                </div>
              </section>
            )
          })}
        </div>

        <aside className="it-summary">
          <div className="card card-pad">
            <h3 className="it-summary-title">Trip summary</h3>
            <dl className="it-summary-stats">
              <div className="it-summary-stat">
                <dt>Days</dt>
                <dd>{totalDays}</dd>
              </div>
              <div className="it-summary-stat">
                <dt>Attractions</dt>
                <dd>{items.length}</dd>
              </div>
              <div className="it-summary-stat">
                <dt>Days with plans</dt>
                <dd>
                  {daysCovered}/{totalDays}
                </dd>
              </div>
            </dl>

            <div className="it-tooltip-wrap">
              <button type="button" className="btn btn-secondary btn-block it-weather-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle cx="9" cy="9" r="3.5" stroke="currentColor" strokeWidth="1.7" />
                  <path
                    d="M9 2.5v1.6M9 13.9v1.6M2.5 9h1.6m9.8 0h1.6M4.4 4.4l1.1 1.1m7-1.1-1.1 1.1"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                  <path
                    d="M13 20.5h5.5a3 3 0 0 0 .4-5.97 4.2 4.2 0 0 0-8.2-.83A2.9 2.9 0 0 0 13 20.5Z"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinejoin="round"
                  />
                </svg>
                Get weather-aware suggestions
              </button>
              <span role="tooltip" className="it-tooltip">
                Coming soon — we'll suggest the best days for beaches, hikes,
                and city stops based on the forecast for your dates.
              </span>
            </div>
          </div>
        </aside>
      </div>

      {pickerDay !== null && (
        <AttractionPicker
          dayNumber={pickerDay}
          plannedIds={plannedIds}
          onAdd={handleAdd}
          onClose={() => setPickerDay(null)}
        />
      )}
    </div>
  )
}
