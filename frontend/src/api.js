import axios from 'axios'

const http = axios.create({ baseURL: 'http://localhost:8000' })

export async function getQuestion(jobDesc, history) {
  const { data } = await http.post('/api/question', { job_desc: jobDesc, history })
  return data
}

export async function transcribeAudio(blob) {
  const form = new FormData()
  form.append('file', blob, 'recording.webm')
  const { data } = await http.post('/api/transcribe', form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return data
}

export async function analyzeAnswer(transcript, durationSeconds) {
  const { data } = await http.post('/api/analyze', {
    transcript,
    duration_seconds: durationSeconds
  })
  return data
}

export async function checkStar(transcript) {
  const { data } = await http.post('/api/star-check', { transcript })
  return data
}

export async function getReport(analyses, transcripts) {
  const { data } = await http.post('/api/session-report', { analyses, transcripts })
  return data
}
