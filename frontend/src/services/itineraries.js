// Itinerary API calls (see backend/app/routes/itineraries.py for the
// contracts these mirror). Detail responses include `items` with each
// attraction expanded, ordered by (day_number, order_index) — ready to group
// by day and render.

import api from './api'

export async function fetchItineraries() {
  const { data } = await api.get('/itineraries')
  return data.itineraries // [{ id, title, start_date, end_date, item_count, preview_stops }]
}

export async function createItinerary({ title, startDate, endDate }) {
  const { data } = await api.post('/itineraries', {
    title,
    start_date: startDate || null,
    end_date: endDate || null,
  })
  return data.itinerary // detail shape (items: [])
}

export async function fetchItinerary(id) {
  const { data } = await api.get(`/itineraries/${id}`)
  return data.itinerary // { ...list fields, items: [{ id, day_number, order_index, attraction }] }
}

// Partial update — only pass the fields that changed.
export async function updateItinerary(id, fields) {
  const { data } = await api.put(`/itineraries/${id}`, fields)
  return data.itinerary
}

export async function deleteItinerary(id) {
  const { data } = await api.delete(`/itineraries/${id}`)
  return data.deleted
}

export async function addItineraryItem(id, { attractionId, dayNumber }) {
  const { data } = await api.post(`/itineraries/${id}/items`, {
    attraction_id: attractionId,
    day_number: dayNumber,
  })
  return data.item
}

// `itemIds` is the complete new order for that day.
export async function reorderItineraryItems(id, dayNumber, itemIds) {
  const { data } = await api.put(`/itineraries/${id}/items/reorder`, {
    day_number: dayNumber,
    item_ids: itemIds,
  })
  return data.itinerary
}

export async function removeItineraryItem(id, itemId) {
  const { data } = await api.delete(`/itineraries/${id}/items/${itemId}`)
  return data.deleted
}
