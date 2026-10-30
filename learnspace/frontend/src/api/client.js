const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const KEY = 'ls_code'

/* ── access code ── */
const code = () => {
  try { return localStorage.getItem(KEY) || '' } catch { return '' }
}

export const authHeaders = (extra = {}) => {
  const c = code()
  return c ? { ...extra, 'X-Access-Code': c } : { ...extra }
}

export const setAccessCode = (v) => {
  try { localStorage.setItem(KEY, String(v).trim()) } catch { /* storage blocked */ }
}
export const hasAccessCode = () => !!code()
export const clearAccessCode = () => {
  try { localStorage.removeItem(KEY) } catch { /* storage blocked */ }
}

// Shareable link: https://your-app.vercel.app/?code=XYZ saves the code and cleans the URL
;(function takeCodeFromUrl() {
  try {
    const url = new URL(window.location.href)
    const c = url.searchParams.get('code')
    if (c) {
      setAccessCode(c)
      url.searchParams.delete('code')
      window.history.replaceState(null, '', url.pathname + url.search + url.hash)
    }
  } catch { /* ignore */ }
})()

/* ── portal data (public) ── */
export const fetchAssignments   = ()      => fetch(`${BASE}/api/assignments/`).then(r => r.json())
export const fetchGrades        = (id=1)  => fetch(`${BASE}/api/grades/${id}`).then(r => r.json())
export const fetchCourses       = ()      => fetch(`${BASE}/api/courses/`).then(r => r.json())
export const fetchQuizzes       = ()      => fetch(`${BASE}/api/quizzes/`).then(r => r.json())
export const fetchAnnouncements = ()      => fetch(`${BASE}/api/announcements/`).then(r => r.json())
export const fetchDiscussions   = ()      => fetch(`${BASE}/api/discussions/`).then(r => r.json())
export const fetchCalendar      = ()      => fetch(`${BASE}/api/calendar/`).then(r => r.json())

/* ── chat ── */
export async function* streamChat(message, history = [], studentId = 1) {
  const res = await fetch(`${BASE}/api/chat/stream`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
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

/* ── documents ── */
export const fetchDocuments = () =>
  fetch(`${BASE}/api/documents/`).then(r => {
    if (!r.ok) throw new Error('Could not load documents')
    return r.json()
  })

async function failure(res, fallback) {
  if (res.status === 401) return new Error('This needs an access code. Open LearnBot and enter it first.')
  let detail = fallback
  try { detail = (await res.json()).detail || detail } catch {}
  return new Error(detail)
}

export async function uploadDocument(file, onPhase = () => {}) {
  const fd = new FormData()
  fd.append('file', file)
  onPhase('Uploading')

  const res = await fetch(`${BASE}/api/documents/`, {
    method: 'POST',
    headers: authHeaders(),          // no Content-Type — the browser sets it for FormData
    body: fd
  })
  if (!res.ok) throw await failure(res, `Upload failed (${res.status})`)

  onPhase('Indexing')
  return res.json()
}

export async function deleteDocument(id) {
  const res = await fetch(`${BASE}/api/documents/${id}`, {
    method: 'DELETE',
    headers: authHeaders()
  })
  if (!res.ok) throw await failure(res, 'Could not remove that document')
  return res.json()
}
