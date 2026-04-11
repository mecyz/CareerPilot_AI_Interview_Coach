import { useState, useRef } from 'react'
import { transcribeAudio } from '../api.js'
import './RecordingControls.css'

export default function RecordingControls({ onTranscriptReady }) {
  const [state, setState] = useState('idle') // idle | recording | transcribing
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState('')
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const startTimeRef = useRef(null)

  async function startRecording() {
    setError('')
    setTranscript('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      mediaRecorderRef.current = mr
      chunksRef.current = []
      startTimeRef.current = Date.now()

      mr.ondataavailable = e => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        const duration = (Date.now() - startTimeRef.current) / 1000
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setState('transcribing')
        try {
          const result = await transcribeAudio(blob)
          setTranscript(result.transcript)
          onTranscriptReady(result.transcript, duration)
        } catch {
          setError('Transcription failed. Is the backend running?')
          setState('idle')
        }
      }

      mr.start(250)
      setState('recording')
    } catch (err) {
      setError('Microphone access denied. Please allow microphone access in your browser.')
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && state === 'recording') {
      mediaRecorderRef.current.stop()
    }
  }

  return (
    <div className="recording-controls fade-in">
      <div className="rec-row">
        {state === 'idle' && (
          <button className="btn-record" onClick={startRecording}>
            <span className="rec-dot" /> Start Recording
          </button>
        )}

        {state === 'recording' && (
          <>
            <div className="rec-indicator">
              <span className="rec-dot-live" />
              <span className="rec-label">Recording…</span>
            </div>
            <button className="btn-stop" onClick={stopRecording}>
              ■ Stop
            </button>
          </>
        )}

        {state === 'transcribing' && (
          <div className="rec-transcribing">
            <div className="spinner-sm" />
            <span>Transcribing…</span>
          </div>
        )}
      </div>

      {error && <div className="rec-error">{error}</div>}

      {transcript && (
        <div className="transcript-preview">
          <span className="transcript-label">Your answer</span>
          <p>{transcript}</p>
        </div>
      )}
    </div>
  )
}
