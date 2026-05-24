import { useState } from 'react'

const EVENT_DAYS = [22,24,25,26,28,29]
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const EVENTS = [
  {title:'Lab Report 3 due',meta:'Today · AIML-2210',color:'#c8102e'},
  {title:'Cloud Deploy Lab due',meta:'May 24 · CLOD-3100',color:'#1d6fa5'},
  {title:'AIML Midterm Quiz',meta:'May 25 · 10:00 AM',color:'#c8102e'},
  {title:'Project Case Study due',meta:'May 26 · PROJ-1050',color:'#16a34a'},
  {title:'AWS Concepts Quiz',meta:'May 28 · CLOD-3100',color:'#1d6fa5'},
  {title:'AWS Guest Lecture',meta:'May 29 · CLOD-3100',color:'#7c3aed'},
]

export default function Calendar() {
  const [year, setYear] = useState(2026)
  const [month, setMonth] = useState(4)

  const prev = () => { if(month===0){setMonth(11);setYear(y=>y-1)}else setMonth(m=>m-1) }
  const next = () => { if(month===11){setMonth(0);setYear(y=>y+1)}else setMonth(m=>m+1) }

  const first = new Date(year, month, 1).getDay()
  const days = new Date(year, month+1, 0).getDate()
  const prevDays = new Date(year, month, 0).getDate()
  const cells = []
  for(let i=0;i<first;i++) cells.push({day:prevDays-first+1+i,cur:false})
  for(let d=1;d<=days;d++) cells.push({day:d,cur:true})

  return (
    <div className="page">
      <div className="page-header"><h1 className="page-title">Calendar</h1><p className="page-sub">Academic schedule</p></div>
      <div className="two-col">
        <div className="card">
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'12px'}}>
            <button onClick={prev} style={{background:'none',border:'none',cursor:'pointer',fontSize:'18px',color:'var(--text2)',padding:'2px 8px'}}>‹</button>
            <span style={{fontWeight:500,fontSize:'14px'}}>{MONTHS[month]} {year}</span>
            <button onClick={next} style={{background:'none',border:'none',cursor:'pointer',fontSize:'18px',color:'var(--text2)',padding:'2px 8px'}}>›</button>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:'4px',textAlign:'center'}}>
            {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => <div key={d} style={{fontSize:'10px',color:'var(--text3)',padding:'4px 0',fontWeight:500}}>{d}</div>)}
            {cells.map((c,i) => {
              const isToday = c.cur && year===2026 && month===4 && c.day===22
              const hasEvent = c.cur && year===2026 && month===4 && EVENT_DAYS.includes(c.day)
              return (
                <div key={i} style={{padding:'6px 4px',borderRadius:'6px',fontSize:'12px',cursor:'pointer',position:'relative',background:isToday?'#c8102e':'transparent',color:isToday?'#fff':c.cur?'var(--text)':'var(--text3)',fontWeight:isToday?500:400}}>
                  {c.day}
                  {hasEvent && <div style={{position:'absolute',bottom:'3px',left:'50%',transform:'translateX(-50%)',width:'4px',height:'4px',borderRadius:'50%',background:isToday?'#fff':'#c8102e'}}></div>}
                </div>
              )
            })}
          </div>
        </div>
        <div className="card">
          <div className="card-title">📅 Upcoming events</div>
          {EVENTS.map((e,i) => (
            <div key={i} style={{display:'flex',gap:'10px',padding:'8px 0',borderBottom:'0.5px solid var(--border)',alignItems:'flex-start'}}>
              <div style={{width:'8px',height:'8px',borderRadius:'50%',background:e.color,flexShrink:0,marginTop:'4px'}}></div>
              <div><div style={{fontSize:'13px',fontWeight:500}}>{e.title}</div><div style={{fontSize:'11px',color:'var(--text2)',marginTop:'1px'}}>{e.meta}</div></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
