import { useEffect, useState } from 'react'
import { getCourses } from '../api/client'

export default function Courses() {
  const [courses, setCourses] = useState([])
  useEffect(() => { getCourses().then(r => setCourses(r.data)).catch(() => {}) }, [])

  const data = courses.length ? courses : [
    {code:'AIML-2210',name:'Machine Learning & AI Fundamentals',instructor:'Dr. Patel',schedule:'Mon/Wed',color:'#c8102e',progress:72},
    {code:'CLOD-3100',name:'Cloud Infrastructure & DevOps',instructor:'Prof. Singh',schedule:'Tue/Thu',color:'#1d6fa5',progress:60},
    {code:'PROJ-1050',name:'Project Management Essentials',instructor:'Ms. Chen',schedule:'Wednesday',color:'#16a34a',progress:85},
    {code:'DATA-4020',name:'Data Engineering & Pipelines',instructor:'Dr. Nguyen',schedule:'Friday',color:'#7c3aed',progress:45},
  ]

  return (
    <div className="page">
      <div className="page-header"><h1 className="page-title">My courses</h1><p className="page-sub">Semester 2 · 4 enrolled</p></div>
      <div className="course-grid">
        {data.map(c => (
          <div key={c.code} className="course-card">
            <div className="course-top" style={{background:c.color}}></div>
            <div className="course-body">
              <div className="course-code">{c.code}</div>
              <div className="course-name">{c.name}</div>
              <div className="course-meta"><span>👤 {c.instructor}</span><span>🕐 {c.schedule}</span></div>
              <div className="progress-bar"><div className="progress-fill" style={{width:`${c.progress}%`,background:c.color}}></div></div>
              <div style={{fontSize:'11px',color:'var(--text3)',marginTop:'4px'}}>{c.progress}% complete</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
