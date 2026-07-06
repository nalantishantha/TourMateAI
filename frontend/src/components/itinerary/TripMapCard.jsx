// Day-route map for the itinerary builder's summary rail. Pick a day and see
// its stops on an embedded Google Map: one stop → a place pin, two or more →
// the driving route through them in planned order (Maps Embed API directions
// mode), plus a numbered stop list and an "open in Google Maps" link that
// carries the same route. Degrades to a link-only card when no API key is
// configured, and to a hint when the day has no located stops yet.

import { useMemo, useState } from 'react'

const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

function coord(attraction) {
  return `${attraction.latitude},${attraction.longitude}`
}

function embedSrc(stops) {
  if (stops.length === 1) {
    return (
      `https://www.google.com/maps/embed/v1/place?key=${MAPS_KEY}` +
      `&q=${encodeURIComponent(coord(stops[0]))}&zoom=13`
    )
  }
  const origin = coord(stops[0])
  const destination = coord(stops[stops.length - 1])
  const waypoints = stops.slice(1, -1).map(coord).join('|')
  return (
    `https://www.google.com/maps/embed/v1/directions?key=${MAPS_KEY}` +
    `&origin=${encodeURIComponent(origin)}` +
    `&destination=${encodeURIComponent(destination)}` +
    (waypoints ? `&waypoints=${encodeURIComponent(waypoints)}` : '') +
    `&mode=driving`
  )
}

function externalUrl(stops) {
  if (stops.length === 1) {
    return `https://www.google.com/maps/search/?api=1&query=${coord(stops[0])}`
  }
  const origin = coord(stops[0])
  const destination = coord(stops[stops.length - 1])
  const waypoints = stops.slice(1, -1).map(coord).join('|')
  return (
    `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}` +
    `&destination=${encodeURIComponent(destination)}` +
    (waypoints ? `&waypoints=${encodeURIComponent(waypoints)}` : '')
  )
}

export default function TripMapCard({ items, totalDays }) {
  const [selectedDay, setSelectedDay] = useState(1)
  const day = Math.min(selectedDay, totalDays) // trip may have shrunk

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
                src={embedSrc(stops)}
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

          <ol className="it-map-stops">
            {stops.map((stop, index) => (
              <li key={`${stop.id}-${index}`} className="it-map-stop">
                <span className="it-map-stop-num" aria-hidden="true">
                  {index + 1}
                </span>
                <span className="it-map-stop-name">{stop.name}</span>
              </li>
            ))}
          </ol>

          <a
            className="it-map-link"
            href={externalUrl(stops)}
            target="_blank"
            rel="noreferrer"
          >
            {stops.length > 1 ? 'Open route in Google Maps ↗' : 'Open in Google Maps ↗'}
          </a>
        </>
      )}
    </div>
  )
}
