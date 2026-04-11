import { useState, useEffect } from 'react'
import { getReport } from '../api.js'
import './ReportTab.css'

export default function ReportTab({ analyses, transcripts }) {
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (analyses.length === 0) return
    setLoading(true)
    setError('')
    getReport(analyses, transcripts)
      .then(setReport)
      .catch(() => setError('Could not generate report. Check the backend.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="report-loading">
      <div className="spinner" />
      <span>Generating your session report…</span>
    </div>
  )

  if (error) return <div className="report-error">{error}</div>
  if (!report) return null

  const { overall_score, strengths, improvements, summary, avg_pace_wpm, avg_sentiment, total_fillers, top_fillers } = report

  return (
    <div className="report-tab fade-in">
      <div className="report-hero">
        <div className="score-ring">
          <span className="score-num">{overall_score}</span>
          <span className="score-denom">/100</span>
        </div>
        <div>
          <h2 className="report-heading">Session Complete</h2>
          <p className="report-sub">{analyses.length} question{analyses.length !== 1 ? 's' : ''} answered</p>
        </div>
      </div>

      <div className="report-stats">
        <div className="rs-card">
          <span className="rs-label">Avg pace</span>
          <span className="rs-val">{Math.round(avg_pace_wpm)} wpm</span>
        </div>
        <div className="rs-card">
          <span className="rs-label">Avg sentiment</span>
          <span className="rs-val">{avg_sentiment >= 0.1 ? 'Positive' : avg_sentiment <= -0.1 ? 'Negative' : 'Neutral'}</span>
        </div>
        <div className="rs-card">
          <span className="rs-label">Total fillers</span>
          <span className="rs-val">{total_fillers}</span>
        </div>
      </div>

      {summary && (
        <div className="report-section">
          <span className="section-label">Summary</span>
          <p className="summary-text">{summary}</p>
        </div>
      )}

      <div className="report-two-col">
        {strengths?.length > 0 && (
          <div className="report-section">
            <span className="section-label">Strengths</span>
            <ul className="report-list strengths">
              {strengths.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
        )}
        {improvements?.length > 0 && (
          <div className="report-section">
            <span className="section-label">Improvements</span>
            <ul className="report-list improvements">
              {improvements.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
        )}
      </div>

      {top_fillers?.length > 0 && (
        <div className="report-section">
          <span className="section-label">Top filler words</span>
          <div className="filler-pills">
            {top_fillers.map(([w, c]) => (
              <span key={w} className="filler-pill">"{w}" <strong>{c}×</strong></span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
