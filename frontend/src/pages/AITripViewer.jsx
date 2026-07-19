import { useState, useRef, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import html2pdf from 'html2pdf.js'
import PageContainer from '../components/layout/PageContainer'
import { fetchItinerary } from '../services/itineraries'
import { useAuth } from '../context/AuthContext'
import '../styles/itinerary.css'

export default function AITripViewer({ initialItinerary }) {
  const { id } = useParams()
  const { user } = useAuth()
  const [itinerary, setItinerary] = useState(initialItinerary || null)
  const [loading, setLoading] = useState(!initialItinerary)
  const [generating, setGenerating] = useState(false)
  const [editRequest, setEditRequest] = useState('')
  const [error, setError] = useState(null)
  const [showEdit, setShowEdit] = useState(false)
  
  const contentRef = useRef(null)

  useEffect(() => {
    if (!itinerary) {
      setLoading(true)
      fetchItinerary(id)
        .then(data => {
          setItinerary(data)
          // If the AI plan doesn't exist yet, we trigger generation!
          if (!data.ai_plan) {
             generatePlan(data)
          }
        })
        .catch(() => setError('Failed to load itinerary.'))
        .finally(() => setLoading(false))
    } else if (!itinerary.ai_plan && !generating && !error) {
       generatePlan(itinerary)
    }
  }, [id, itinerary])

  const generatePlan = async (currentItinerary, editMessage = null) => {
    setGenerating(true)
    setError(null)
    
    try {
      const token = await user.getIdToken()
      // If it's a new generation, we construct the initial prompt.
      // We assume the title is the destination, and dates are set.
      let message = editMessage
      if (!message) {
        message = `Plan a trip to ${currentItinerary.title} from ${currentItinerary.start_date || 'TBD'} to ${currentItinerary.end_date || 'TBD'}.`
      }

      const response = await fetch('/api/ai/plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          itinerary_id: currentItinerary.id,
          message: message
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate AI plan.')
      }

      const result = await response.json()
      setItinerary({
        ...currentItinerary,
        ai_plan: result.answer,
        thread_id: result.thread_id
      })
      setEditRequest('')
      setShowEdit(false)
    } catch (err) {
      setError(err.message || 'An error occurred.')
    } finally {
      setGenerating(false)
    }
  }

  const handleDownloadPdf = () => {
    const element = contentRef.current
    if (!element) return

    const opt = {
      margin: 10,
      filename: `${itinerary.title.replace(/\s+/g, '_')}_Plan.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }

    html2pdf().from(element).set(opt).save()
  }

  const handleEditSubmit = (e) => {
    e.preventDefault()
    if (!editRequest.trim() || generating) return
    generatePlan(itinerary, editRequest.trim())
  }

  if (loading) {
    return (
      <PageContainer title="Loading...">
        <div className="loading-screen">
          <div className="spinner" />
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer
      title={itinerary?.title || 'AI Trip Planner'}
      subtitle={itinerary?.start_date ? `${itinerary.start_date} to ${itinerary.end_date}` : ''}
      actions={
        itinerary?.ai_plan && !generating && (
          <div className="ai-actions" style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn btn-ghost" onClick={() => setShowEdit(!showEdit)}>
              {showEdit ? 'Cancel Edit' : 'Edit Plan'}
            </button>
            <button className="btn btn-primary" onClick={handleDownloadPdf}>
              Download PDF
            </button>
          </div>
        )
      }
    >
      {error && <div className="alert alert-error">{error}</div>}

      {showEdit && (
        <form onSubmit={handleEditSubmit} className="card" style={{ marginBottom: '2rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)' }}>
          <div className="field">
            <label className="label">What would you like to change?</label>
            <textarea
              className="input"
              style={{ minHeight: '80px', resize: 'vertical' }}
              placeholder="e.g., Make it cheaper, change the hotel, add a museum..."
              value={editRequest}
              onChange={e => setEditRequest(e.target.value)}
              autoFocus
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={!editRequest.trim() || generating}>
            Submit Changes
          </button>
        </form>
      )}

      <div className="ai-viewer-content card" style={{ padding: '2rem', position: 'relative' }}>
        {generating && (
          <div className="generating-overlay" style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
            background: 'rgba(var(--bg-rgb), 0.7)', backdropFilter: 'blur(4px)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            zIndex: 10, borderRadius: 'var(--radius)'
          }}>
            <div className="spinner" style={{ width: '40px', height: '40px', borderWidth: '4px' }} />
            <h3 style={{ marginTop: '1rem' }}>Your AI agent is planning...</h3>
            <p>Gathering live flights, hotels, and crafting the perfect route.</p>
          </div>
        )}
        
        <div ref={contentRef} className="markdown-body" style={{ minHeight: '300px' }}>
          {itinerary?.ai_plan ? (
            <ReactMarkdown>{itinerary.ai_plan}</ReactMarkdown>
          ) : !generating ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No plan generated yet.</p>
          ) : null}
        </div>
      </div>
    </PageContainer>
  )
}
