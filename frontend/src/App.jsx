import { useState } from 'react'
import Sidebar from './components/Sidebar.jsx'
import InterviewTab from './components/InterviewTab.jsx'
import ReportTab from './components/ReportTab.jsx'
import './App.css'

export default function App() {
  const [tab, setTab] = useState('interview')
  const [jobDesc, setJobDesc] = useState('')
  const [resumeText, setResumeText] = useState('')
  const [history, setHistory] = useState([])
  const [analyses, setAnalyses] = useState([])
  const [transcripts, setTranscripts] = useState([])
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [questionCount, setQuestionCount] = useState(0)

  function onAnswerComplete(transcript, analysis, starResult) {
    const updatedHistory = [
      ...history,
      { role: 'assistant', content: currentQuestion?.question || '' },
      { role: 'user', content: transcript }
    ]
    setHistory(updatedHistory)
    setAnalyses(prev => [...prev, { ...analysis, star: starResult }])
    setTranscripts(prev => [...prev, transcript])
    setQuestionCount(q => q + 1)
  }

  function onNewQuestion(q) {
    setCurrentQuestion(q)
  }

  function resetSession() {
    setHistory([])
    setAnalyses([])
    setTranscripts([])
    setCurrentQuestion(null)
    setQuestionCount(0)
  }

  return (
    <div className="app-shell">
      <Sidebar
        jobDesc={jobDesc}
        setJobDesc={setJobDesc}
        setResumeText={setResumeText}
        questionCount={questionCount}
        onReset={resetSession}
      />
      <div className="main-area">
        <header className="top-bar">
          <span className="brand">AI Interview Coach</span>
          <div className="tabs">
            <button
              className={`tab-btn ${tab === 'interview' ? 'active' : ''}`}
              onClick={() => setTab('interview')}
            >Interview</button>
            <button
              className={`tab-btn ${tab === 'report' ? 'active' : ''}`}
              onClick={() => setTab('report')}
              disabled={analyses.length === 0}
            >Report {analyses.length > 0 && `(${analyses.length})`}</button>
          </div>
        </header>

        <div className="tab-content">
          {tab === 'interview' ? (
            <InterviewTab
              jobDesc={jobDesc}
              resumeText={resumeText}
              history={history}
              currentQuestion={currentQuestion}
              onNewQuestion={onNewQuestion}
              onAnswerComplete={onAnswerComplete}
              questionCount={questionCount}
            />
          ) : (
            <ReportTab analyses={analyses} transcripts={transcripts} />
          )}
        </div>
      </div>
    </div>
  )
}
