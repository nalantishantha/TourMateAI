// Ask TourMate — the chatbot page. A full messaging UI: the user's stored
// conversation loads from ChatLogs on mount, new turns go through POST
// /api/chat (which persists them), replies can carry inline attraction cards,
// and a typing indicator + auto-scroll keep it feeling like a real messenger.

import { useEffect, useRef, useState } from 'react'
import ChatMessage, { BotAvatar, TypingIndicator } from '../components/chat/ChatMessage'
import { clearChatHistory, fetchChatHistory, sendChatMessage } from '../services/chat'
import '../styles/chat.css'

// Starter chips for an empty conversation — phrased to hit the assistant's
// strong suits (each maps onto a mock-chatbot rule today).
const QUICK_PROMPTS = [
  'What are the best beaches?',
  'Where can I see elephants and leopards?',
  'Which heritage sites should I not miss?',
  'When is the best season to visit?',
]

const COMPOSER_MAX_HEIGHT = 132 // px — ~4 lines before the textarea scrolls

let nextLocalId = 0
const localId = () => `local-${nextLocalId++}`

// One ChatLogs row = one exchange = two on-screen messages.
function historyRowToTurns(row) {
  return [
    { id: `h${row.id}-user`, role: 'user', content: row.message },
    {
      id: `h${row.id}-assistant`,
      role: 'assistant',
      content: row.response,
      attractions: row.suggested_attractions,
    },
  ]
}

export default function Chat() {
  const [messages, setMessages] = useState([])
  const [historyCount, setHistoryCount] = useState(0) // messages restored from ChatLogs
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)

  const scrollRef = useRef(null)
  const textareaRef = useRef(null)
  const restoredRef = useRef(false) // first paint after history load jumps, no smooth scroll

  useEffect(() => {
    let cancelled = false
    fetchChatHistory()
      .then((rows) => {
        if (cancelled) return
        const turns = rows.flatMap(historyRowToTurns)
        setMessages(turns)
        setHistoryCount(turns.length)
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
  }, [])

  // Keep the newest message in view.
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const behavior = restoredRef.current ? 'smooth' : 'auto'
    restoredRef.current = true
    el.scrollTo({ top: el.scrollHeight, behavior })
  }, [messages, sending, loading])

  const resetComposerHeight = () => {
    const el = textareaRef.current
    if (el) el.style.height = 'auto'
  }

  const handleInput = (event) => {
    setInput(event.target.value)
    const el = event.target
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, COMPOSER_MAX_HEIGHT)}px`
  }

  const send = async (raw) => {
    const text = raw.trim()
    if (!text || sending) return

    setInput('')
    resetComposerHeight()

    // Context for the assistant: every successful turn so far, newest last.
    const history = messages
      .filter((m) => !m.failed)
      .map(({ role, content }) => ({ role, content }))

    const userMessage = { id: localId(), role: 'user', content: text }
    setMessages((prev) => [...prev, userMessage])
    setSending(true)
    try {
      const data = await sendChatMessage(text, history)
      setMessages((prev) => [
        ...prev,
        {
          id: localId(),
          role: 'assistant',
          content: data.reply,
          attractions: data.suggested_attractions,
        },
      ])
    } catch {
      setMessages((prev) =>
        prev.map((m) => (m.id === userMessage.id ? { ...m, failed: true } : m))
      )
    } finally {
      setSending(false)
    }
  }

  const retry = (message) => {
    setMessages((prev) => prev.filter((m) => m.id !== message.id))
    send(message.content)
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    send(input)
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      send(input)
    }
  }

  const handleClear = async () => {
    if (!window.confirm('Clear your entire conversation? This cannot be undone.')) return
    try {
      await clearChatHistory()
      setMessages([])
      setHistoryCount(0)
    } catch {
      // Leave the conversation as-is; the user can simply try again.
    }
  }

  const showEarlierDivider = historyCount > 0 && messages.length > historyCount

  return (
    <div className="chat-page">
      <div className="chat-header">
        <div>
          <h1 className="chat-title">Ask TourMate</h1>
          <p className="chat-subtitle">Your AI travel guide for Sri Lanka</p>
        </div>
        {messages.length > 0 && (
          <button type="button" className="btn btn-ghost chat-clear" onClick={handleClear}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-8 0 1 13h8l1-13"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Clear chat
          </button>
        )}
      </div>

      <div className="chat-panel card">
        <div className="chat-scroll" ref={scrollRef}>
          {loading ? (
            <div className="chat-state">
              <div className="spinner" />
              <p>Loading your conversation…</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="chat-welcome">
              <div className="chat-welcome-avatar">
                <BotAvatar />
              </div>
              <h2>Ayubowan! Where shall we go?</h2>
              <p>
                Ask me anything about traveling in Sri Lanka — beaches, wildlife,
                heritage sites, hiking, or when to visit.
              </p>
              {loadError && (
                <div className="alert alert-error chat-load-error">
                  We couldn't load your previous conversation, but you can start
                  chatting right away.
                </div>
              )}
              <div className="chat-prompts">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    className="chat-prompt"
                    onClick={() => send(prompt)}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((message, index) => (
                <div key={message.id} className="chat-msg-slot">
                  {showEarlierDivider && index === historyCount && (
                    <div className="chat-divider" role="separator">
                      <span>New messages</span>
                    </div>
                  )}
                  <ChatMessage message={message} onRetry={retry} />
                </div>
              ))}
              {sending && <TypingIndicator />}
            </>
          )}
        </div>

        <form className="chat-composer" onSubmit={handleSubmit}>
          <textarea
            ref={textareaRef}
            className="chat-input"
            rows={1}
            placeholder="Ask about beaches, temples, safaris…"
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            maxLength={2000}
            aria-label="Message TourMate"
          />
          <button
            type="submit"
            className="chat-send"
            disabled={!input.trim() || sending}
            aria-label="Send message"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="m4.5 12 15-7.5L15 12l4.5 7.5-15-7.5Zm0 0H15"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </form>
        <p className="chat-hint">Enter to send · Shift + Enter for a new line</p>
      </div>
    </div>
  )
}
