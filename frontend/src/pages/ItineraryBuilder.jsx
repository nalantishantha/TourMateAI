// Itinerary Builder — plan one trip day by day. Editable title/dates up top
// (auto-saved, with a status chip), a vertical day-by-day timeline where each
// day takes attractions from the search picker, supports drag-to-reorder
// within the day, and item removal. Each day with 2+ located stops shows a
// live driving route summary (total time/distance, refreshed as the order
// changes) and, with enough stops, an "Optimize order" suggestion the user
// can apply or dismiss. A sticky summary rail keeps the trip totals in view
// and hosts the weather-aware suggestions button, which fetches each day's
// forecast (from its first stop's coordinates) and flags days with
// rain/storms so outdoor-heavy plans can be rethought.

import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import AttractionImage from '../components/explore/AttractionImage'
import AttractionPicker from '../components/itinerary/AttractionPicker'
import TripMapCard from '../components/itinerary/TripMapCard'
import {
  addItineraryItem,
  fetchDayRoute,
  fetchItinerary,
  removeItineraryItem,
  reorderItineraryItems,
  updateItinerary,
} from '../services/itineraries'
import { fetchWeather } from '../services/weather'
import { dayCount, dayDateLabel, dayIsoDate, formatTripRange } from '../utils/tripDates'
import { weatherEmoji } from '../utils/weather'
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

function formatDistance(meters) {
  if (typeof meters !== 'number') return ''
  if (meters < 1000) return `${Math.round(meters)} m`
  const km = meters / 1000
  return `${km >= 100 ? Math.round(km) : km.toFixed(1)} km`
}

function formatDuration(seconds) {
  if (typeof seconds !== 'number') return ''
  const mins = Math.round(seconds / 60)
  if (mins < 60) return `${mins} min`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m ? `${h} h ${m} min` : `${h} h`
}

/** Per-day driving route summary + the optimize-order suggestion flow.
 * Hidden entirely until a day has two located stops (no route to show). */
function DayRouteSummary({ locatedItems, route, suggestion, onOptimize, onApply, onDismiss }) {
  if (locatedItems.length < 2) return null

  // A suggestion is only shown while the day's order still matches the one it
  // was computed for — any reorder/add/remove silently retires it.
  const signature = locatedItems.map((i) => i.id).join(',')
  const live = suggestion && suggestion.signature === signature ? suggestion : null

  // First/last stops stay fixed, so with < 4 stops there is nothing to reorder.
  const canOptimize = locatedItems.length >= 4 && route?.state === 'ok'
  const applying = live?.state === 'applying'
  const savedSeconds =
    live?.route && route?.state === 'ok'
      ? route.total_duration_s - live.route.total_duration_s
      : 0
  const nameById = new Map(
    locatedItems.map((i) => [i.id, i.attraction?.name || 'Attraction'])
  )

  return (
    <div className="it-day-route-wrap">
      <div className="it-day-route">
        <span aria-hidden="true">🚗</span>
        {!route || route.state === 'loading' ? (
          <span className="it-route-text muted">Calculating route…</span>
        ) : route.state === 'ok' ? (
          <span className="it-route-text">
            {formatDuration(route.total_duration_s)} ·{' '}
            {formatDistance(route.total_distance_m)} driving between{' '}
            {locatedItems.length} stops
          </span>
        ) : (
          <span className="it-route-text muted">Route info unavailable right now</span>
        )}
        {canOptimize && (
          <button
            type="button"
            className="it-route-optimize"
            onClick={onOptimize}
            disabled={live?.state === 'loading' || applying}
          >
            {live?.state === 'loading' ? 'Optimizing…' : 'Optimize order'}
          </button>
        )}
      </div>

      {live?.state === 'already-optimal' && (
        <p className="it-route-note ok" role="status">
          ✓ This order is already the fastest route.
        </p>
      )}
      {live?.state === 'error' && (
        <p className="it-route-note muted" role="status">
          Couldn’t get a suggestion right now — try again later.
        </p>
      )}
      {(live?.state === 'ready' || applying) && (
        <div className="it-route-suggest" role="status">
          <p className="it-route-suggest-title">
            Faster order found
            {savedSeconds > 60 ? ` — saves about ${formatDuration(savedSeconds)}` : ''}
          </p>
          <ol className="it-route-suggest-list">
            {live.itemIds.map((itemId) => (
              <li key={itemId}>{nameById.get(itemId)}</li>
            ))}
          </ol>
          <div className="it-route-suggest-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={onApply}
              disabled={applying}
            >
              {applying ? 'Applying…' : 'Apply this order'}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onDismiss}
              disabled={applying}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/** Compact weather indicator shown in a day's header once the forecast loads. */
function DayWeatherChip({ weather }) {
  if (!weather) return null
  if (weather.state === 'ok') {
    const title = [
      weather.description || weather.condition,
      weather.placeName ? `at ${weather.placeName}` : null,
    ]
      .filter(Boolean)
      .join(' ')
    return (
      <span
        className={`it-day-weather${weather.isBad ? ' is-bad' : ''}`}
        title={title}
      >
        <span aria-hidden="true">{weather.emoji}</span>
        {typeof weather.temp === 'number' && (
          <span>
            {Math.round(weather.temp)}°
            {typeof weather.tempMin === 'number' && (
              <span className="it-weather-lo">/{Math.round(weather.tempMin)}°</span>
            )}
          </span>
        )}
        {typeof weather.rainChance === 'number' && weather.rainChance >= 20 && (
          <span className="it-weather-rain">💧{weather.rainChance}%</span>
        )}
        {weather.isCurrent && <span className="it-weather-now">now</span>}
      </span>
    )
  }
  if (weather.state === 'out-of-range') {
    return (
      <span className="it-day-weather muted" title="Beyond the 5-day forecast window">
        forecast later
      </span>
    )
  }
  if (weather.state === 'unavailable') {
    return <span className="it-day-weather muted">weather n/a</span>
  }
  return null
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

  // Weather-aware suggestions: fetched on demand per day (keyed by day number).
  const [weatherState, setWeatherState] = useState('idle') // idle | loading | done | error
  const [dayWeather, setDayWeather] = useState({}) // { [day]: { state, ... } }

  // Per-day driving routes, refreshed as a day's stop order changes.
  const [dayRoutes, setDayRoutes] = useState({}) // { [day]: { state, total_*, legs } }
  const routeFetchedSig = useRef({}) // { [day]: "id,id,..." } — last order fetched
  const [routeSuggestion, setRouteSuggestion] = useState(null) // one open suggestion

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

  // ---- Weather-aware suggestions ---------------------------------------------

  // First planned attraction per day drives that day's forecast. A change to any
  // day's opener (or the trip's start date) invalidates a previously run check.
  const firstStopSignature = useMemo(() => {
    const byDay = {}
    for (const it of items) {
      if (byDay[it.day_number] === undefined) byDay[it.day_number] = it.attraction_id
    }
    return `${itinerary?.start_date || ''}|${JSON.stringify(byDay)}`
  }, [items, itinerary])

  useEffect(() => {
    setWeatherState('idle')
    setDayWeather({})
  }, [firstStopSignature])

  const runWeatherCheck = async () => {
    setWeatherState('loading')
    const results = {}
    const byLocation = new Map() // "lat,lng" -> weather payload (or {error}) — fetch once
    const days = Array.from({ length: totalDays }, (_, i) => i + 1)

    try {
      for (const day of days) {
        const first = items.find((i) => i.day_number === day)?.attraction
        if (
          !first ||
          typeof first.latitude !== 'number' ||
          typeof first.longitude !== 'number'
        ) {
          results[day] = { state: 'no-location' }
          continue
        }

        const key = `${first.latitude.toFixed(2)},${first.longitude.toFixed(2)}`
        let weather = byLocation.get(key)
        if (!weather) {
          try {
            weather = await fetchWeather(first.latitude, first.longitude)
          } catch {
            weather = { error: true }
          }
          byLocation.set(key, weather)
        }

        if (weather.error || weather.available === false) {
          results[day] = { state: 'unavailable' }
          continue
        }

        // Line the day's calendar date up against a forecast day; when the trip
        // has no dates, fall back to current conditions as a general indicator.
        const iso = dayIsoDate(itinerary.start_date, day)
        let block = iso ? weather.forecast?.find((f) => f.date === iso) : null
        let isCurrent = false
        if (!block && !iso && weather.current) {
          block = weather.current
          isCurrent = true
        }
        if (!block) {
          results[day] = { state: 'out-of-range' }
          continue
        }

        results[day] = {
          state: 'ok',
          isBad: Boolean(block.is_bad),
          condition: block.condition,
          description: block.description,
          emoji: weatherEmoji(block.condition),
          temp: block.temp_max_c ?? block.temp_c ?? null,
          tempMin: block.temp_min_c ?? null,
          rainChance: block.rain_chance ?? null,
          isCurrent,
          placeName: first.name,
        }
      }
      setDayWeather(results)
      setWeatherState('done')
    } catch {
      setWeatherState('error')
    }
  }

  const okDays = Object.values(dayWeather).filter((w) => w.state === 'ok')
  const badDayCount = okDays.filter((w) => w.isBad).length
  const anyForecast = okDays.length > 0

  // ---- Per-day driving routes -------------------------------------------------

  // Only stops with coordinates can be routed; grouped per day in current order.
  const locatedByDay = useMemo(() => {
    const byDay = {}
    for (const it of items) {
      const a = it.attraction
      if (typeof a?.latitude === 'number' && typeof a?.longitude === 'number') {
        ;(byDay[it.day_number] ||= []).push(it)
      }
    }
    return byDay
  }, [items])

  const routeSignature = useMemo(
    () =>
      Object.entries(locatedByDay)
        .map(([day, list]) => `${day}:${list.map((i) => i.id).join(',')}`)
        .join('|'),
    [locatedByDay]
  )

  // Fresh trip → forget everything fetched for the previous one.
  useEffect(() => {
    routeFetchedSig.current = {}
    setDayRoutes({})
    setRouteSuggestion(null)
  }, [id])

  // Fetch/refresh each routable day's route whenever its stop order changes.
  // Debounced, and paused mid-drag so we only ask once the drop settles; the
  // backend caches per ordered stop list, so re-asking is cheap anyway.
  useEffect(() => {
    if (drag || !itinerary) return undefined
    const timer = setTimeout(() => {
      // Days that lost their route (now < 2 located stops) fall back to hidden.
      for (const day of Object.keys(routeFetchedSig.current)) {
        if ((locatedByDay[day] || []).length < 2) {
          delete routeFetchedSig.current[day]
          setDayRoutes((prev) => {
            const next = { ...prev }
            delete next[day]
            return next
          })
        }
      }
      for (const [day, list] of Object.entries(locatedByDay)) {
        if (list.length < 2) continue
        const sig = list.map((i) => i.id).join(',')
        if (routeFetchedSig.current[day] === sig) continue
        routeFetchedSig.current[day] = sig
        setDayRoutes((prev) => ({ ...prev, [day]: { state: 'loading' } }))
        fetchDayRoute(itinerary.id, day)
          .then((data) => {
            if (routeFetchedSig.current[day] !== sig) return // superseded
            setDayRoutes((prev) => ({
              ...prev,
              [day]: { state: 'ok', ...data.route },
            }))
          })
          .catch(() => {
            if (routeFetchedSig.current[day] !== sig) return
            setDayRoutes((prev) => ({ ...prev, [day]: { state: 'unavailable' } }))
          })
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [routeSignature, drag, itinerary, locatedByDay])

  const handleOptimize = async (day) => {
    const list = locatedByDay[day] || []
    const signature = list.map((i) => i.id).join(',')
    setRouteSuggestion({ day, state: 'loading', signature })
    try {
      const data = await fetchDayRoute(itinerary.id, day, { optimize: true })
      const suggested = data.suggested_item_order || []
      if (suggested.join(',') === signature) {
        setRouteSuggestion({ day, state: 'already-optimal', signature })
      } else {
        setRouteSuggestion({
          day,
          state: 'ready',
          signature,
          itemIds: suggested,
          route: data.route,
        })
      }
    } catch {
      setRouteSuggestion({ day, state: 'error', signature })
    }
  }

  const applyRouteSuggestion = async () => {
    if (!routeSuggestion?.itemIds) return
    const { day, itemIds } = routeSuggestion
    // The reorder endpoint wants the day's complete order — stops without
    // coordinates weren't routed, so they keep their place at the end.
    const unlocated = items
      .filter((i) => i.day_number === day && !itemIds.includes(i.id))
      .map((i) => i.id)
    setRouteSuggestion({ ...routeSuggestion, state: 'applying' })
    setSaveState('saving')
    try {
      const updated = await reorderItineraryItems(itinerary.id, day, [
        ...itemIds,
        ...unlocated,
      ])
      setItinerary(updated)
      setRouteSuggestion(null)
      setSaveState('saved')
    } catch {
      setRouteSuggestion({ ...routeSuggestion, state: 'error' })
      setSaveState('error')
    }
  }

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
            const dayW = dayWeather[day]
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
                    <DayWeatherChip weather={dayW} />
                  </div>

                  {dayW?.state === 'ok' && dayW.isBad && (
                    <div className="it-day-warn" role="status">
                      <span aria-hidden="true">⛈</span>{' '}
                      {dayW.description
                        ? dayW.description.charAt(0).toUpperCase() + dayW.description.slice(1)
                        : 'Rain expected'}
                      {typeof dayW.rainChance === 'number'
                        ? ` (${dayW.rainChance}% chance)`
                        : ''}{' '}
                      — best to plan indoor stops for this day.
                    </div>
                  )}

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

                  <DayRouteSummary
                    locatedItems={locatedByDay[day] || []}
                    route={dayRoutes[day]}
                    suggestion={routeSuggestion?.day === day ? routeSuggestion : null}
                    onOptimize={() => handleOptimize(day)}
                    onApply={applyRouteSuggestion}
                    onDismiss={() => setRouteSuggestion(null)}
                  />

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

            <div className="it-weather">
              <button
                type="button"
                className="btn btn-secondary btn-block it-weather-btn"
                onClick={runWeatherCheck}
                disabled={weatherState === 'loading'}
              >
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
                {weatherState === 'loading'
                  ? 'Checking the forecast…'
                  : weatherState === 'done'
                    ? 'Refresh forecast'
                    : 'Get weather-aware suggestions'}
              </button>

              {weatherState === 'done' && (
                <p
                  className={`it-weather-summary ${
                    badDayCount ? 'warn' : anyForecast ? 'ok' : ''
                  }`}
                  role="status"
                >
                  {badDayCount
                    ? `⚠ Rain or storms forecast on ${badDayCount} day${
                        badDayCount > 1 ? 's' : ''
                      } — flagged in your timeline. Consider indoor stops there.`
                    : anyForecast
                      ? '☀ Clear conditions across your planned days.'
                      : 'Add a place with a location to a day to see its forecast.'}
                </p>
              )}

              {weatherState === 'error' && (
                <p className="it-weather-summary warn" role="status">
                  Couldn’t load the forecast right now. Please try again.
                </p>
              )}
            </div>
          </div>

          <TripMapCard items={items} totalDays={totalDays} />
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
