import { useEffect, useState } from 'react'
import { getQuizzes } from '../api/client'

export default function Quizzes() {
  const [data, setData] = useState([])
  useEffect(() => { getQuizzes().then(r => setData(r.data)).catch(() => {}) }, [])

  const rows = data.length ? data : [
    {name:'AIML-2210 Midterm Quiz',course:'AIML-2210',date:'May 25',duration_min:45,questions:30,points:100,status:'upcoming'},
    {name:'CLOD-3100 AWS Concepts Quiz',course:'CLOD-3100',date:'May 28',duration_min:30,questions:20,points:50,status:'upcoming'},
    {name:'DATA-4020 Pipelines Quiz 1',course:'DATA-4020',date:'May 14',duration_min:20,questions:25,points:50,status:'completed',score:92},
    {name:'PROJ-1050 Agile Quiz',course:'PROJ-1050',date:'May 10',duration_min:15,questions:20,points:20,status:'completed',score:90},
  ]

  return (
    <div className="page">
      <div className="page-header"><h1 className="page-title">Quizzes & exams</h1><p className="page-sub">{rows.filter(r=>r.status==='upcoming').length} upcoming · {rows.filter(r=>r.status==='completed').length} completed</p></div>
      <div className="card">
        {rows.map((q,i) => (
          <div key={i} className="quiz-item">
            <div className="quiz-icon">{q.status==='completed' ? '✅' : '📝'}</div>
            <div style={{flex:1}}>
              <div style={{fontWeight:500,fontSize:'13px'}}>{q.name}</div>
              <div style={{fontSize:'11px',color:'var(--text2)',marginTop:'2px'}}>{q.date} · {q.duration_min} min · {q.questions} questions · {q.points} pts</div>
            </div>
            {q.status==='completed'
              ? <span className="badge graded">{q.score}%</span>
              : <span className="badge upcoming">Upcoming</span>}
          </div>
        ))}
      </div>
    </div>
  )
}
