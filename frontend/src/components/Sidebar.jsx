import { useRef } from 'react'
import './Sidebar.css'

export default function Sidebar({ jobDesc, setJobDesc, setResumeText, questionCount, onReset }) {
  const fileRef = useRef()

  async function handlePDF(e) {
    const file = e.target.files[0]
    if (!file) return
    const pdfjsLib = await import('pdfjs-dist')
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs`
    const doc = await pdfjsLib.getDocument(URL.createObjectURL(file)).promise
    let text = ''
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i)
      const content = await page.getTextContent()
      text += content.items.map(s => s.str).join(' ') + '\n'
    }
    setResumeText(text)
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-dot" />
        <span>Coach</span>
      </div>

      <div className="sidebar-section">
        <label>Job Description</label>
        <textarea
          rows={8}
          placeholder="Paste the job description here…"
          value={jobDesc}
          onChange={e => setJobDesc(e.target.value)}
        />
      </div>

      <div className="sidebar-section">
        <label>Resume (optional)</label>
        <button className="upload-btn" onClick={() => fileRef.current.click()}>
          Upload PDF
        </button>
        <input ref={fileRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={handlePDF} />
      </div>

      <div className="sidebar-stats">
        <div className="stat">
          <span className="stat-num">{questionCount}</span>
          <span className="stat-label">Questions answered</span>
        </div>
      </div>

      {questionCount > 0 && (
        <button className="reset-btn" onClick={onReset}>Reset session</button>
      )}
    </aside>
  )
}
