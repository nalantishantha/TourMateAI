// Chat API calls (see backend/app/routes/chat.py for the contracts these
// mirror). The backend expands suggested attraction ids into full attraction
// objects, so everything here is ready to render.

import api from './api'

export async function sendChatMessage(message, conversationHistory = []) {
  const { data } = await api.post('/chat', {
    message,
    conversation_history: conversationHistory,
  })
  return data // { reply, suggested_attractions: [attraction], chat_log_id, created_at }
}

export async function fetchChatHistory({ limit = 50 } = {}) {
  const { data } = await api.get('/chat/history', { params: { limit } })
  return data.messages // [{ id, message, response, suggested_attractions, created_at }]
}

export async function clearChatHistory() {
  const { data } = await api.delete('/chat/history')
  return data.deleted
}
