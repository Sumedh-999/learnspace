const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const fetchAssignments = () => fetch(`${BASE}/api/assignments/`).then(r => r.json())
export const fetchGrades = (id=1) => fetch(`${BASE}/api/grades/${id}`).then(r => r.json())
export const fetchCourses = () => fetch(`${BASE}/api/courses/`).then(r => r.json())
export const fetchQuizzes = () => fetch(`${BASE}/api/quizzes/`).then(r => r.json())
export const fetchAnnouncements = () => fetch(`${BASE}/api/announcements/`).then(r => r.json())
export const fetchDiscussions = () => fetch(`${BASE}/api/discussions/`).then(r => r.json())
export const fetchCalendar = () => fetch(`${BASE}/api/calendar/`).then(r => r.json())

export async function* streamChat(message, studentId=1) {
  const res = await fetch(`${BASE}/api/chat/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, student_id: studentId })
  })
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const chunk = decoder.decode(value, { stream: true })
    for (const line of chunk.split('\n')) {
      if (!line.startsWith('data: ')) continue
      const data = line.slice(6).trim()
      if (data === '[DONE]') return
      try { const p = JSON.parse(data); if (p.text) yield p.text } catch {}
    }
  }
}
