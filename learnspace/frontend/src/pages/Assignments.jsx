import { useEffect, useState } from 'react'
import { getAssignments } from '../api/client'

export default function Assignments() {
  const [data, setData] = useState([])
  useEffect(() => { getAssignments().then(r => setData(r.data)).catch(() => {}) }, [])

  const rows = data.length ? data : [
    {name:'Lab Report 3 — Neural Networks',course:'AIML-2210',due_date:'May 22',status:'pending',points:50},
    {name:'Cloud Deployment Lab',course:'CLOD-3100',due_date:'May 24',status:'pending',points:40},
    {name:'Project Case Study',course:'PROJ-1050',due_date:'May 26',status:'pending',points:60},
    {name:'Data Pipeline Design',course:'DATA-4020',due_date:'May 18',status:'submitted',points:45},
    {name:'AWS IAM Policy Lab',course:'CLOD-3100',due_date:'May 15',status:'graded',points:30,score:92},
    {name:'ML Model Evaluation',course:'AIML-2210',due_date:'May 10',status:'graded',points:50,score:88},
  ]

  const statusBadge = s => {
    const map = {pending:'due',submitted:'submitted',graded:'graded',late:'late'}
    return <span className={`badge ${map[s]||'due'}`}>{s}</span>
  }

  return (
    <div className="page">
      <div className="page-header"><h1 className="page-title">Assignments</h1><p className="page-sub">{rows.filter(r=>r.status==='pending').length} pending · {rows.filter(r=>r.status!=='pending').length} completed</p></div>
      <div className="card">
        <table className="table">
          <thead><tr><th>Assignment</th><th>Course</th><th>Due date</th><th>Points</th><th>Status</th></tr></thead>
          <tbody>
            {rows.map((a,i) => (
              <tr key={i}>
                <td><strong>{a.name}</strong></td>
                <td>{a.course}</td>
                <td>{a.due_date}</td>
                <td>{a.score ? `${a.score}/${a.points}` : a.points}</td>
                <td>{statusBadge(a.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
