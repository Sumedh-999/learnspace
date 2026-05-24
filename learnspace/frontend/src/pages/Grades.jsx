import { useEffect, useState } from 'react'
import { getGrades } from '../api/client'

export default function Grades() {
  const [data, setData] = useState([])
  useEffect(() => { getGrades().then(r => setData(r.data)).catch(() => {}) }, [])

  const rows = data.length ? data : [
    {course:'AIML-2210',name:'Machine Learning & AI',percentage:88,letter:'A',color:'#c8102e'},
    {course:'CLOD-3100',name:'Cloud Infrastructure & DevOps',percentage:91,letter:'A+',color:'#1d6fa5'},
    {course:'PROJ-1050',name:'Project Management',percentage:82,letter:'B+',color:'#16a34a'},
    {course:'DATA-4020',name:'Data Engineering & Pipelines',percentage:92,letter:'A+',color:'#7c3aed'},
  ]

  const avg = Math.round(rows.reduce((s,r) => s + r.percentage, 0) / rows.length)

  return (
    <div className="page">
      <div className="page-header"><h1 className="page-title">Grades</h1><p className="page-sub">Semester 2 · Overall: {avg}%</p></div>
      <div className="card">
        {rows.map((r,i) => (
          <div key={i} className="grade-row">
            <div style={{flex:1}}>
              <div style={{fontWeight:500,fontSize:'14px'}}>{r.course} — {r.name}</div>
            </div>
            <div className="grade-bar-wrap">
              <div className="grade-bar-fill" style={{width:`${r.percentage}%`,background:r.color||'#c8102e'}}></div>
            </div>
            <div className="grade-pct" style={{color:r.color||'#c8102e'}}>{r.percentage}%</div>
            <div className="grade-letter">{r.letter}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
