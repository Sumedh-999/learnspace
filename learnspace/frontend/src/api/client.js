const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const fetchAssignments   = ()      => fetch(`${BASE}/api/assignments/`).then(r => r.json())
export const fetchGrades        = (id=1)  => fetch(`${BASE}/api/grades/${id}`).then(r => r.json())
export const fetchCourses       = ()      => fetch(`${BASE}/api/courses/`).then(r => r.json())
export const fetchQuizzes       = ()      => fetch(`${BASE}/api/quizzes/`).then(r => r.json())
export const fetchAnnouncements = ()      => fetch(`${BASE}/api/announcements/`).then(r => r.json())
export const fetchDiscussions   = ()      => fetch(`${BASE}/api/discussions/`).then(r => r.json())
export const fetchCalendar      = ()      => fetch(`${BASE}/api/calendar/`).then(r => r.json())

export async function* streamChat(message, history = [], studentId = 1) {
  const res = await fetch(`${BASE}/api/chat/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history, student_id: studentId })
  })
  if (!res.ok) throw new Error(`chat ${res.status}`)

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop()                       // keep the partial line
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const data = line.slice(6).trim()
      if (data === '[DONE]') return
      try { const p = JSON.parse(data); if (p.text) yield p.text } catch {}
    }
  }
}

export const fetchDocuments = () =>
  fetch(`${BASE}/api/documents/`).then(r => {
    if (!r.ok) throw new Error('Could not load documents')
    return r.json()
  })

export async function uploadDocument(file, onPhase = () => {}) {
  const fd = new FormData()
  fd.append('file', file)
  onPhase('Uploading')

  const res = await fetch(`${BASE}/api/documents/`, { method: 'POST', body: fd })

  if (!res.ok) {
    let detail = `Upload failed (${res.status})`
    try { detail = (await res.json()).detail || detail } catch {}
    throw new Error(detail)
  }
  onPhase('Indexing')
  return res.json()
}

export async function deleteDocument(id) {
  const res = await fetch(`${BASE}/api/documents/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Could not remove that document')
  return res.json()
}
