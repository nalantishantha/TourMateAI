// Itinerary API calls (see backend/app/routes/itineraries.py). Read-only for
// now — the Dashboard's "Continue planning" section; CRUD lands with the
// planner feature.

import api from './api'

export async function fetchItineraries() {
  const { data } = await api.get('/itineraries')
  return data.itineraries // [{ id, title, start_date, end_date, item_count, preview_stops }]
}
