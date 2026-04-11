import './FeedbackPanel.css'

function scoreColor(val, max = 10) {
  const pct = val / max
  if (pct >= 0.7) return 'good'
  if (pct >= 0.4) return 'ok'
  return 'poor'
}

function paceLabel(label) {
  if (label === 'good') return { text: 'Good pace', cls: 'good' }
  if (label === 'fast') return { text: 'Too fast', cls: 'poor' }
  return { text: 'Too slow', cls: 'ok' }
}

export default function FeedbackPanel({ analysis, transcript }) {
  if (!analysis) return null
  const { filler_count, sentiment_label, pace_label: pl, pace_wpm, star, fillers } = analysis
  const starScore = star?.score ?? null
  const pace = paceLabel(pl)
  const topFillers = Object.entries(fillers || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)

  return (
    <div className="feedback-panel fade-in">
      <div className="fp-header">
        <span className="fp-title">Answer Feedback</span>
        {starScore !== null && (
          <div className={`fp-star-score ${scoreColor(starScore)}`}>
            STAR {starScore}/10
          </div>
        )}
      </div>

      <div className="fp-metrics">
        <div className="metric-card">
          <span className="metric-label">Sentiment</span>
          <span className={`metric-val ${sentiment_label === 'positive' ? 'good' : sentiment_label === 'negative' ? 'poor' : 'ok'}`}>
            {sentiment_label}
          </span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Pace</span>
          <span className={`metric-val ${pace.cls}`}>{pace.text}</span>
          <span className="metric-sub">{Math.round(pace_wpm)} wpm</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Filler words</span>
          <span className={`metric-val ${filler_count <= 3 ? 'good' : filler_count <= 7 ? 'ok' : 'poor'}`}>
            {filler_count}
          </span>
          {topFillers.length > 0 && (
            <span className="metric-sub">{topFillers.map(([w, c]) => `"${w}" ×${c}`).join(', ')}</span>
          )}
        </div>
      </div>

      {star?.feedback && (
        <div className="fp-star-feedback">
          <span className="fp-section-label">STAR Method</span>
          <p>{star.feedback}</p>
        </div>
      )}
    </div>
  )
}
