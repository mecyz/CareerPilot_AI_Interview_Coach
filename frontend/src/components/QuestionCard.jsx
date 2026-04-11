import './QuestionCard.css'

export default function QuestionCard({ question, tips, number }) {
  return (
    <div className="question-card fade-in">
      <div className="question-header">
        <span className="q-number">Q{number}</span>
        <span className="q-badge pill pill-red">Interview Question</span>
      </div>
      <p className="question-text">{question}</p>
      {tips && (
        <div className="tips-box">
          <span className="tips-label">Tip</span>
          <span className="tips-text">{tips}</span>
        </div>
      )}
    </div>
  )
}
