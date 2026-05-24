import { useEffect, useState } from 'react'
import { getAssignments, getAnnouncements } from '../api/client'

export default function Dashboard() {
  const [assignments, setAssignments] = useState([])
  const [announcements, setAnnouncements] = useState([])

  useEffect(() => {
    getAssignments().then(r => setAssignments(r.data)).catch(() => {})
    getAnnouncements().then(r => setAnnouncements(r.data)).catch(() => {})
  }, [])

  const pending = assignments.filter(a => a.status === 'pending')

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Welcome back, Sumedh 👋</h1>
          <p className="page-sub">Friday, May 22, 2026 · Semester 2</p>
        </div>
      </div>
      <div className="stat-row">
        <div className="stat red"><div className="stat-val">4</div><div className="stat-lbl">Active courses</div></div>
        <div className="stat amber"><div className="stat-val">{pending.length || 3}</div><div className="stat-lbl">Assignments due</div></div>
        <div className="stat green"><div className="stat-val">87%</div><div className="stat-lbl">Overall grade</div></div>
        <div className="stat blue"><div className="stat-val">2</div><div className="stat-lbl">Quizzes upcoming</div></div>
      </div>
      <div className="two-col">
        <div className="card">
          <div className="card-title">⏰ Due this week</div>
          <table className="table">
            <thead><tr><th>Assignment</th><th>Course</th><th>Due</th></tr></thead>
            <tbody>
              {(pending.length ? pending : [
                {name:'Lab Report 3',course:'AIML-2210',due_date:'May 22'},
                {name:'Cloud Deploy',course:'CLOD-3100',due_date:'May 24'},
                {name:'Case Study',course:'PROJ-1050',due_date:'May 26'},
              ]).map((a,i) => (
                <tr key={i}><td>{a.name}</td><td>{a.course}</td><td><span className="badge due">{a.due_date}</span></td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card">
          <div className="card-title">📢 Announcements</div>
          {(announcements.length ? announcements : [
            {title:'Exam schedule posted',date:'May 21',body:'Final exam timetable is now available.'},
            {title:'Library extended hours',date:'May 20',body:'Open until midnight during exam season.'},
            {title:'AIML-2210 class moved',date:'May 18',body:"Monday's class moved to Room 2A-14."},
          ]).slice(0,3).map((a,i) => (
            <div key={i} className="ann-item">
              <div className="ann-date">{a.date}</div>
              <div className="ann-title">{a.title}</div>
              <div className="ann-text">{a.body}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
