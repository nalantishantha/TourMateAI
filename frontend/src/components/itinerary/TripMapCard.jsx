// Day-route map for the itinerary builder's summary rail. Pick a day and see
// its stops on an embedded Google Map, with the day's travel times spelled out:
//   • Two or more stops  → the driving route through them in planned order
//     (Maps Embed API directions mode), plus per-leg drive times woven into the
//     numbered stop list and a day total, sourced from the backend route.
//   • A single stop       → offer to route from "where I am now": once the user
//     shares their location, the map switches to a from-you driving route that
//     shows the travel time on the map itself. Until then it just pins the place.
// An "open in Google Maps" link carries the same route. Degrades to a link-only
// card when no API key is configured, and to a hint when the day has no located
// stops yet.

import { Fragment, useMemo, useState } from 'react'

const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

function coord(point) {
  return `${point.latitude},${point.longitude}`
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

// `origin` (optional) lets a single-stop day be routed from the user's location.
function embedSrc(stops, origin) {
  if (stops.length === 1 && !origin) {
    return (
      `https://www.google.com/maps/embed/v1/place?key=${MAPS_KEY}` +
      `&q=${encodeURIComponent(coord(stops[0]))}&zoom=13`
    )
  }
  const points = origin ? [origin, ...stops] : stops
  const from = coord(points[0])
  const destination = coord(points[points.length - 1])
  const waypoints = points.slice(1, -1).map(coord).join('|')
  return (
    `https://www.google.com/maps/embed/v1/directions?key=${MAPS_KEY}` +
    `&origin=${encodeURIComponent(from)}` +
    `&destination=${encodeURIComponent(destination)}` +
    (waypoints ? `&waypoints=${encodeURIComponent(waypoints)}` : '') +
    `&mode=driving`
  )
}

function externalUrl(stops, origin) {
  if (stops.length === 1 && !origin) {
    return `https://www.google.com/maps/search/?api=1&query=${coord(stops[0])}`
  }
  const points = origin ? [origin, ...stops] : stops
  const from = coord(points[0])
  const destination = coord(points[points.length - 1])
  const waypoints = points.slice(1, -1).map(coord).join('|')
  return (
    `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(from)}` +
    `&destination=${encodeURIComponent(destination)}` +
    (waypoints ? `&waypoints=${encodeURIComponent(waypoints)}` : '')
  )
}

export default function TripMapCard({ items, totalDays, routes }) {
  const [selectedDay, setSelectedDay] = useState(1)
  const day = Math.min(selectedDay, totalDays) // trip may have shrunk

  // The user's current position, shared on demand for single-stop routing.
  // It's day-independent, so it survives switching days once granted.
  const [myLocation, setMyLocation] = useState(null)
  const [geoState, setGeoState] = useState('idle') // idle | locating | denied | unsupported

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setGeoState('unsupported')
      return
    }
    setGeoState('locating')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMyLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        })
        setGeoState('ready')
      },
      () => setGeoState('denied'),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    )
  }

  // The day's stops that actually have coordinates, in planned order.
  const stops = useMemo(
    () =>
      items
        .filter((i) => i.day_number === day)
        .map((i) => i.attraction)
        .filter(
          (a) =>
            a &&
            typeof a.latitude === 'number' &&
            typeof a.longitude === 'number'
        ),
    [items, day]
  )

  const dayNumbers = Array.from({ length: totalDays }, (_, i) => i + 1)

  // Backend driving route for this day (2+ stops only) → per-leg + total times.
  // legs[i] is the drive from stops[i] to stops[i+1], so they align by index.
  const route = routes?.[day]
  const legs = route?.state === 'ok' ? route.legs || [] : []

  // A single stop is only routed from the user's location once it's shared.
  const singleWithLocation = stops.length === 1 && myLocation
  const origin = singleWithLocation ? myLocation : null

  return (
    <div className="card card-pad it-map-card">
      <h3 className="it-summary-title">Day map</h3>

      {totalDays > 1 && (
        <div className="it-map-days" role="tablist" aria-label="Pick a day to map">
          {dayNumbers.map((d) => (
            <button
              key={d}
              type="button"
              role="tab"
              aria-selected={d === day}
              className={`it-map-day-btn${d === day ? ' active' : ''}`}
              onClick={() => setSelectedDay(d)}
            >
              {d}
            </button>
          ))}
        </div>
      )}

      {stops.length === 0 ? (
        <p className="it-map-empty">
          Add a place to day {day} and its stops will show up on the map here.
        </p>
      ) : (
        <>
          {MAPS_KEY ? (
            <div className="it-map-frame">
              <iframe
                title={`Map of day ${day} stops`}
                src={embedSrc(stops, origin)}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
          ) : (
            <p className="it-map-empty">
              Maps aren’t configured — use the link below to see this day’s route.
            </p>
          )}

          {/* Single stop: route from the user's own location on request, so the
              map shows how far it is and how long it takes to get there. */}
          {stops.length === 1 &&
            (singleWithLocation ? (
              <p className="it-map-total">
                <span aria-hidden="true">🧭</span>
                Driving route and time from your location shown above.
              </p>
            ) : (
              <div className="it-map-fromme">
                <button
                  type="button"
                  className="btn btn-secondary btn-block"
                  onClick={requestLocation}
                  disabled={geoState === 'locating'}
                >
                  {geoState === 'locating'
                    ? 'Finding you…'
                    : '📍 Show route from my location'}
                </button>
                {geoState === 'denied' && (
                  <p className="it-map-geo-note">
                    Location access was blocked — allow it to route from where you
                    are.
                  </p>
                )}
                {geoState === 'unsupported' && (
                  <p className="it-map-geo-note">
                    This browser can’t share your location.
                  </p>
                )}
              </div>
            ))}

          {/* Multi-stop day total, from the backend driving route. */}
          {route?.state === 'ok' && stops.length > 1 && (
            <p className="it-map-total">
              <span aria-hidden="true">🚗</span>
              <strong>{formatDuration(route.total_duration_s)}</strong>
              {' · '}
              {formatDistance(route.total_distance_m)} driving ·{' '}
              {stops.length} stops
            </p>
          )}
          {route?.state === 'loading' && stops.length > 1 && (
            <p className="it-map-total muted">Calculating drive times…</p>
          )}

          <ol className="it-map-stops">
            {stops.map((stop, index) => (
              <Fragment key={`${stop.id}-${index}`}>
                <li className="it-map-stop">
                  <span className="it-map-stop-num" aria-hidden="true">
                    {index + 1}
                  </span>
                  <span className="it-map-stop-name">{stop.name}</span>
                </li>
                {legs[index] && (
                  <li className="it-map-leg" aria-hidden="true">
                    <span className="it-map-leg-line" />
                    <span className="it-map-leg-text">
                      {formatDuration(legs[index].duration_s)}
                      {' · '}
                      {formatDistance(legs[index].distance_m)}
                    </span>
                  </li>
                )}
              </Fragment>
            ))}
          </ol>

          <a
            className="it-map-link"
            href={externalUrl(stops, origin)}
            target="_blank"
            rel="noreferrer"
          >
            {stops.length > 1 || singleWithLocation
              ? 'Open route in Google Maps ↗'
              : 'Open in Google Maps ↗'}
          </a>
        </>
      )}
    </div>
  )
}
