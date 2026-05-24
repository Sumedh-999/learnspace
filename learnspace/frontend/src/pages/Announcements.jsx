import { useEffect, useState } from 'react'
import { getAnnouncements } from '../api/client'

export default function Announcements() {
  const [data, setData] = useState([])
  useEffect(() => { getAnnouncements().then(r => setData(r.data)).catch(() => {}) }, [])

  const rows = data.length ? data : [
    {title:'Final exam schedule now published',body:'The final examination timetable for Semester 2 has been posted. Please check your individual course pages for room assignments.',date:'May 21, 2026',course:'All students'},
    {title:'Extended library hours during exam period',body:'The Learning Resource Centre will be open until midnight, Sunday through Thursday, from May 23 to June 6.',date:'May 20, 2026',course:'Library'},
    {title:'Classroom change — Monday May 25',body:'AIML-2210 lecture on Monday is relocated to Room 2A-14 due to scheduled maintenance in the main lab.',date:'May 18, 2026',course:'AIML-2210'},
    {title:'AWS Guest Lecture — May 29',body:'We will have a guest speaker from AWS Canada joining us on May 29 to discuss real-world cloud architecture patterns.',date:'May 15, 2026',course:'CLOD-3100'},
  ]

  return (
    <div className="page">
      <div className="page-header"><h1 className="page-title">Announcements</h1><p className="page-sub">All courses</p></div>
      <div className="card">
        {rows.map((a,i) => (
          <div key={i} className="ann-item">
            <div className="ann-date">{a.date} · {a.course}</div>
            <div className="ann-title">{a.title}</div>
            <div className="ann-text">{a.body}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
