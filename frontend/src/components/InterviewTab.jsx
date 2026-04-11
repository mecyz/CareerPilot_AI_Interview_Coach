import { useState } from 'react'
import QuestionCard from './QuestionCard.jsx'
import RecordingControls from './RecordingControls.jsx'
import FeedbackPanel from './FeedbackPanel.jsx'
import { getQuestion, analyzeAnswer, checkStar } from '../api.js'
import './InterviewTab.css'

export default function InterviewTab({
  jobDesc, resumeText, history, currentQuestion,
  onNewQuestion, onAnswerComplete, questionCount
}) {
  const [loadingQ, setLoadingQ] = useState(false)
  const [phase, setPhase] = useState('start') // start | question | recording | processing | done
  const [lastAnalysis, setLastAnalysis] = useState(null)
  const [lastTranscript, setLastTranscript] = useState('')
  const [error, setError] = useState('')

  async function handleGetQuestion() {
    if (!jobDesc.trim()) { setError('Please enter a job description in the sidebar first.'); return }
    setError('')
    setLoadingQ(true)
    try {
      const q = await getQuestion(jobDesc + (resumeText ? '\n\nResume:\n' + resumeText : ''), history)
      onNewQuestion(q)
      setPhase('question')
      setLastAnalysis(null)
      setLastTranscript('')
    } catch {
      setError('Could not reach the backend. Make sure the FastAPI server is running on port 8000.')
    } finally {
      setLoadingQ(false)
    }
  }

  async function handleTranscriptReady(transcript, durationSeconds) {
    setPhase('processing')
    setLastTranscript(transcript)
    try {
      const [analysis, star] = await Promise.all([
        analyzeAnswer(transcript, durationSeconds),
        checkStar(transcript)
      ])
      setLastAnalysis({ ...analysis, star })
      onAnswerComplete(transcript, analysis, star)
      setPhase('done')
    } catch {
      setError('Analysis failed. Check that the backend is running.')
      setPhase('question')
    }
  }

  return (
    <div className="interview-tab">
      {error && <div className="error-banner">{error}</div>}

      {phase === 'start' && (
        <div className="start-screen fade-in">
          <h1 className="start-heading">Ready when you are.</h1>
          <p className="start-sub">Make sure your job description is in the sidebar, then get your first question.</p>
          <button className="btn-primary" onClick={handleGetQuestion} disabled={loadingQ}>
            {loadingQ ? 'Loading…' : 'Get First Question'}
          </button>
        </div>
      )}

      {phase !== 'start' && currentQuestion && (
        <QuestionCard
          question={currentQuestion.question}
          tips={currentQuestion.tips}
          number={questionCount + 1}
        />
      )}

      {phase === 'question' && (
        <RecordingControls onTranscriptReady={handleTranscriptReady} />
      )}

      {phase === 'processing' && (
        <div className="processing-msg fade-in">
          <div className="spinner" />
          <span>Analysing your answer…</span>
        </div>
      )}

      {phase === 'done' && lastAnalysis && (
        <div className="done-area fade-in">
          <FeedbackPanel analysis={lastAnalysis} transcript={lastTranscript} />
          <button className="btn-primary" onClick={handleGetQuestion} disabled={loadingQ} style={{ marginTop: 20 }}>
            {loadingQ ? 'Loading…' : 'Next Question →'}
          </button>
        </div>
      )}
    </div>
  )
}
