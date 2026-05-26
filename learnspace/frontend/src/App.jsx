import { useState, useEffect, useRef } from 'react'
import { fetchAssignments, fetchGrades, fetchCourses, fetchQuizzes, fetchAnnouncements, fetchDiscussions, fetchCalendar, streamChat } from './api/client'

const PAGES = [
  { id: 'dashboard', label: 'Dashboard', icon: '⊞' },
  { id: 'courses', label: 'Courses', icon: '📚' },
  { id: 'assignments', label: 'Assignments', icon: '📋', badge: 'assignments' },
  { id: 'quizzes', label: 'Quizzes', icon: '✅' },
  { id: 'grades', label: 'Grades', icon: '📊' },
  { id: 'discussions', label: 'Discussions', icon: '💬', badge: 'discussions' },
  { id: 'announcements', label: 'Announcements', icon: '📣' },
  { id: 'calendar', label: 'Calendar', icon: '📅' },
]

function Badge({ text, type='due' }) {
  const s = { due:{bg:'#fef3c7',c:'#92400e'}, pending:{bg:'#fef3c7',c:'#92400e'}, submitted:{bg:'#dcfce7',c:'#166534'}, graded:{bg:'#dbeafe',c:'#1e40af'}, upcoming:{bg:'#f3e8ff',c:'#6b21a8'} }[type] || {bg:'#fef3c7',c:'#92400e'}
  return <span style={{background:s.bg,color:s.c,padding:'2px 8px',borderRadius:10,fontSize:11,fontWeight:500}}>{text}</span>
}

function Card({title,children}) {
  return <div style={{background:'var(--surface)',border:'0.5px solid var(--border)',borderRadius:'var(--radius-lg)',padding:16}}>{title&&<div style={{fontSize:13,fontWeight:500,marginBottom:12}}>{title}</div>}{children}</div>
}

function Dashboard({data}) {
  const pending=(data.assignments||[]).filter(a=>['due','pending'].includes(a.status))
  const avg=data.grades?.length?Math.round(data.grades.reduce((s,g)=>s+Number(g.percentage),0)/data.grades.length):0
  return <div style={{display:'flex',flexDirection:'column',gap:16}}>
    <div><h2 style={{fontSize:18,fontWeight:500}}>Welcome back, Sumedh 👋</h2><p style={{fontSize:13,color:'var(--text2)',marginTop:2}}>Friday, May 22, 2026 · Semester 2</p></div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
      {[{val:data.courses?.length||0,lbl:'Active courses',c:'var(--brand)'},{val:pending.length,lbl:'Assignments due',c:'#d97706'},{val:`${avg}%`,lbl:'Overall grade',c:'#16a34a'},{val:(data.quizzes||[]).filter(q=>q.status==='upcoming').length,lbl:'Quizzes upcoming',c:'#1d6fa5'}].map(({val,lbl,c})=>(
        <div key={lbl} style={{background:'var(--surface2)',borderRadius:'var(--radius)',padding:12,textAlign:'center'}}>
          <div style={{fontSize:22,fontWeight:500,color:c}}>{val}</div>
          <div style={{fontSize:11,color:'var(--text2)',marginTop:2}}>{lbl}</div>
        </div>
      ))}
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
      <Card title="Due this week">
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
          <thead><tr>{['Assignment','Course','Due'].map(h=><th key={h} style={{textAlign:'left',padding:'6px 8px',fontSize:11,color:'var(--text2)',borderBottom:'0.5px solid var(--border)'}}>{h}</th>)}</tr></thead>
          <tbody>{pending.slice(0,3).map(a=><tr key={a.id}><td style={{padding:'8px'}}>{(a.title||'').slice(0,22)}</td><td style={{padding:'8px',color:'var(--text2)'}}>{a.code}</td><td style={{padding:'8px'}}><Badge text={String(a.due_date||'').slice(0,10)} type="due"/></td></tr>)}</tbody>
        </table>
      </Card>
      <Card title="Recent announcements">
        {(data.announcements||[]).slice(0,3).map(a=><div key={a.id} style={{padding:'10px 0',borderBottom:'0.5px solid var(--border)'}}>
          <div style={{fontSize:11,color:'var(--text3)'}}>{String(a.posted_at||'').slice(0,10)}</div>
          <div style={{fontSize:13,fontWeight:500,margin:'2px 0'}}>{a.title}</div>
          <div style={{fontSize:12,color:'var(--text2)'}}>{String(a.body||'').slice(0,80)}...</div>
        </div>)}
      </Card>
    </div>
  </div>
}

function Courses({courses}) {
  return <div style={{display:'flex',flexDirection:'column',gap:16}}>
    <h2 style={{fontSize:18,fontWeight:500}}>My courses</h2>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
      {courses.map(c=><div key={c.id} style={{background:'var(--surface)',border:'0.5px solid var(--border)',borderRadius:'var(--radius-lg)',overflow:'hidden'}}>
        <div style={{height:6,background:c.color||'var(--brand)'}}/>
        <div style={{padding:14}}>
          <div style={{fontSize:10,color:'var(--text3)',letterSpacing:'.5px',textTransform:'uppercase'}}>{c.code}</div>
          <div style={{fontSize:13,fontWeight:500,margin:'4px 0 6px'}}>{c.name}</div>
          <div style={{fontSize:11,color:'var(--text2)',display:'flex',gap:12}}><span>👤 {c.instructor}</span><span>🕐 {c.schedule}</span></div>
          <div style={{height:3,background:'var(--border)',borderRadius:2,marginTop:10,overflow:'hidden'}}><div style={{height:'100%',width:`${c.progress}%`,background:c.color||'var(--brand)',borderRadius:2}}/></div>
        </div>
      </div>)}
    </div>
  </div>
}

function Assignments({assignments}) {
  return <div style={{display:'flex',flexDirection:'column',gap:16}}>
    <h2 style={{fontSize:18,fontWeight:500}}>Assignments</h2>
    <Card>
      <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
        <thead><tr>{['Assignment','Course','Due date','Points','Status'].map(h=><th key={h} style={{textAlign:'left',padding:'8px 12px',fontSize:11,color:'var(--text2)',borderBottom:'0.5px solid var(--border)',background:'var(--surface2)'}}>{h}</th>)}</tr></thead>
        <tbody>{assignments.map(a=><tr key={a.id} style={{borderBottom:'0.5px solid var(--border)'}}>
          <td style={{padding:'10px 12px',fontWeight:500}}>{a.title}</td>
          <td style={{padding:'10px 12px',color:'var(--text2)'}}>{a.code}</td>
          <td style={{padding:'10px 12px'}}>{String(a.due_date||'').slice(0,10)}</td>
          <td style={{padding:'10px 12px'}}>{a.points}</td>
          <td style={{padding:'10px 12px'}}><Badge text={a.status==='graded'?`${a.score}/100`:a.status} type={a.status}/></td>
        </tr>)}</tbody>
      </table>
    </Card>
  </div>
}

function Quizzes({quizzes}) {
  return <div style={{display:'flex',flexDirection:'column',gap:16}}>
    <h2 style={{fontSize:18,fontWeight:500}}>Quizzes & exams</h2>
    <Card>{quizzes.map(q=><div key={q.id} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 0',borderBottom:'0.5px solid var(--border)'}}>
      <div style={{width:36,height:36,borderRadius:'var(--radius)',background:'var(--surface2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>{q.status==='upcoming'?'📝':'✅'}</div>
      <div style={{flex:1}}><div style={{fontSize:13,fontWeight:500}}>{q.title}</div><div style={{fontSize:11,color:'var(--text2)',marginTop:2}}>{String(q.scheduled_date||'').slice(0,10)} · {q.duration_mins} min</div></div>
      <Badge text={q.status} type={q.status}/>
    </div>)}</Card>
  </div>
}

function Grades({grades}) {
  return <div style={{display:'flex',flexDirection:'column',gap:16}}>
    <h2 style={{fontSize:18,fontWeight:500}}>Grades · <span style={{color:'var(--text2)',fontWeight:400}}>GPA 3.7</span></h2>
    <Card>{grades.map(g=><div key={g.id} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 0',borderBottom:'0.5px solid var(--border)'}}>
      <div style={{flex:1}}><div style={{fontSize:13,fontWeight:500}}>{g.name}</div><div style={{fontSize:11,color:'var(--text2)'}}>{g.code}</div></div>
      <div style={{width:120,height:6,background:'var(--border)',borderRadius:3,overflow:'hidden'}}><div style={{height:'100%',width:`${g.percentage}%`,background:g.color||'var(--brand)',borderRadius:3}}/></div>
      <div style={{fontSize:13,fontWeight:500,minWidth:36,textAlign:'right',color:g.color||'var(--brand)'}}>{g.percentage}%</div>
      <div style={{fontSize:12,fontWeight:500,padding:'2px 8px',borderRadius:6,background:'#f3e8ff',color:'#6b21a8',minWidth:30,textAlign:'center'}}>{g.letter_grade}</div>
    </div>)}</Card>
  </div>
}

function Discussions({discussions}) {
  return <div style={{display:'flex',flexDirection:'column',gap:16}}>
    <h2 style={{fontSize:18,fontWeight:500}}>Discussions</h2>
    <Card>{discussions.map(d=><div key={d.id} style={{padding:'12px 0',borderBottom:'0.5px solid var(--border)'}}>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
        <div style={{width:26,height:26,borderRadius:'50%',background:'var(--surface2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:500,color:'var(--text2)',border:'0.5px solid var(--border)',flexShrink:0}}>{d.author_initials}</div>
        <span style={{fontSize:12,fontWeight:500}}>{d.author_name}</span>
        <span style={{fontSize:11,color:'var(--text3)',marginLeft:'auto'}}>{String(d.posted_at||'').slice(0,10)}</span>
      </div>
      <div style={{fontSize:12,color:'var(--text2)',marginLeft:34,lineHeight:1.5}}>{d.body}</div>
      <div style={{fontSize:11,color:'var(--brand)',marginLeft:34,marginTop:4,cursor:'pointer'}}>{d.reply_count} replies · Join discussion</div>
    </div>)}</Card>
  </div>
}

function Announcements({announcements}) {
  return <div style={{display:'flex',flexDirection:'column',gap:16}}>
    <h2 style={{fontSize:18,fontWeight:500}}>Announcements</h2>
    <Card>{announcements.map(a=><div key={a.id} style={{padding:'12px 0',borderBottom:'0.5px solid var(--border)'}}>
      <div style={{fontSize:11,color:'var(--text3)',marginBottom:3}}>{String(a.posted_at||'').slice(0,10)}</div>
      <div style={{fontSize:13,fontWeight:500,marginBottom:3}}>{a.title}</div>
      <div style={{fontSize:12,color:'var(--text2)',lineHeight:1.5}}>{a.body}</div>
    </div>)}</Card>
  </div>
}

function CalendarView({events}) {
  const [month,setMonth]=useState(4),[year,setYear]=useState(2026)
  const months=['January','February','March','April','May','June','July','August','September','October','November','December']
  const eventDays=events.map(e=>new Date(e.event_date).getDate())
  const first=new Date(year,month,1).getDay(),days=new Date(year,month+1,0).getDate()
  return <div style={{display:'flex',flexDirection:'column',gap:16}}>
    <h2 style={{fontSize:18,fontWeight:500}}>Calendar</h2>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
      <Card>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
          <span style={{cursor:'pointer',padding:'2px 8px',fontSize:18}} onClick={()=>month===0?(setMonth(11),setYear(y=>y-1)):setMonth(m=>m-1)}>‹</span>
          <span style={{fontSize:14,fontWeight:500}}>{months[month]} {year}</span>
          <span style={{cursor:'pointer',padding:'2px 8px',fontSize:18}} onClick={()=>month===11?(setMonth(0),setYear(y=>y+1)):setMonth(m=>m+1)}>›</span>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:4,textAlign:'center'}}>
          {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d=><div key={d} style={{fontSize:10,color:'var(--text3)',padding:'4px 0',fontWeight:500}}>{d}</div>)}
          {Array.from({length:first},(_,i)=><div key={`p${i}`} style={{padding:'6px 4px',fontSize:12,color:'var(--text3)'}}>{new Date(year,month,0).getDate()-first+1+i}</div>)}
          {Array.from({length:days},(_,i)=>{const d=i+1,isToday=year===2026&&month===4&&d===22,hasEv=eventDays.includes(d);return(
            <div key={d} style={{padding:'6px 4px',fontSize:12,borderRadius:'var(--radius)',cursor:'pointer',background:isToday?'var(--brand)':'transparent',color:isToday?'#fff':'var(--text)',position:'relative'}}>
              {d}{hasEv&&<div style={{position:'absolute',bottom:2,left:'50%',transform:'translateX(-50%)',width:4,height:4,borderRadius:'50%',background:isToday?'#fff':'var(--brand)'}}/>}
            </div>
          )})}
        </div>
      </Card>
      <Card title="Upcoming events">
        {events.slice(0,6).map(e=><div key={e.id} style={{display:'flex',gap:10,padding:'8px 0',borderBottom:'0.5px solid var(--border)',alignItems:'flex-start'}}>
          <div style={{width:8,height:8,borderRadius:'50%',background:e.color||'var(--brand)',flexShrink:0,marginTop:4}}/>
          <div><div style={{fontSize:13,fontWeight:500}}>{e.title}</div><div style={{fontSize:11,color:'var(--text2)',marginTop:1}}>{String(e.event_date||'').slice(0,10)} · {e.code}</div></div>
        </div>)}
      </Card>
    </div>
  </div>
}

function Chatbot() {
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState([{role:'bot', text:"Hi Sumedh! 👋 I'm LearnBot. Ask me about assignments, grades, quizzes, or your courses!"}])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [listening, setListening] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const ref = useRef(null)
  const recognitionRef = useRef(null)

  useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight }, [msgs])

  function isGreeting(text) {
    const t = (text || '').toLowerCase().trim()
    return /^(hi|hello|hey|hii|heyy|good morning|good afternoon|good evening)\b[!.?]*$/.test(t)
  }

  function startListening() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) { alert('Speech recognition not supported. Use Chrome or Edge.'); return }
    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    recognition.onstart = () => setListening(true)
    recognition.onend = () => setListening(false)
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript
      setInput(transcript)
      setTimeout(() => send(transcript), 300)
    }
    recognition.onerror = () => setListening(false)
    recognitionRef.current = recognition
    recognition.start()
  }

  function stopListening() {
    if (recognitionRef.current) recognitionRef.current.stop()
    setListening(false)
  }

  function speakText(text) {
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const clean = text.replace(/[*_#`]/g, '').replace(/\n/g, ' ')
    const utterance = new SpeechSynthesisUtterance(clean)
    utterance.lang = 'en-US'
    utterance.rate = 1.0
    utterance.pitch = 1.0
    const voices = window.speechSynthesis.getVoices()
    const preferred = voices.find(v => v.name.includes('Google') && v.lang === 'en-US')
    if (preferred) utterance.voice = preferred
    utterance.onstart = () => setSpeaking(true)
    utterance.onend = () => setSpeaking(false)
    window.speechSynthesis.speak(utterance)
  }

  async function send(text) {
    const q = (text || input).trim()
    if (!q || streaming) return
    setInput('')
    setMsgs(m => [...m, {role:'user', text:q}, {role:'bot', text:'', streaming:true}])
    setStreaming(true)
    try {
      let full = ''
      for await (const chunk of streamChat(q)) {
        full += chunk
        setMsgs(m => m.map((x, i) => i === m.length - 1 ? {...x, text: full} : x))
      }
      setMsgs(m => m.map((x, i) => i === m.length - 1 ? {...x, streaming: false} : x))
      speakText(full)
    } catch {
      setMsgs(m => m.map((x, i) => i === m.length - 1 ? {role:'bot', text:'Connection error.'} : x))
    }
    setStreaming(false)
  }

  function stopSpeaking() {
    window.speechSynthesis.cancel()
    setSpeaking(false)
  }

  if (!open) return (
    <button onClick={() => setOpen(true)} style={{position:'absolute',bottom:20,right:20,width:48,height:48,borderRadius:'50%',background:'var(--brand)',border:'none',cursor:'pointer',color:'#fff',fontSize:22,zIndex:10,boxShadow:'0 2px 8px rgba(0,0,0,0.2)'}} aria-label="Open LearnBot">🤖</button>
  )

  return (
    <div style={{position:'absolute',bottom:20,right:20,width:320,background:'var(--surface)',border:'0.5px solid var(--border2)',borderRadius:'var(--radius-lg)',display:'flex',flexDirection:'column',zIndex:10,overflow:'hidden',boxShadow:'0 4px 20px rgba(0,0,0,0.1)'}}>
      <div style={{background:'var(--brand)',padding:'12px 14px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{color:'#fff',fontSize:14,fontWeight:500,display:'flex',alignItems:'center',gap:6}}>
          🤖 LearnBot AI
          {speaking && <span style={{fontSize:11,background:'rgba(255,255,255,0.2)',padding:'2px 8px',borderRadius:10,animation:'pulse 1s infinite'}}>🔊 Speaking...</span>}
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          {speaking && <button onClick={stopSpeaking} style={{background:'rgba(255,255,255,0.2)',border:'none',color:'#fff',cursor:'pointer',borderRadius:6,padding:'2px 8px',fontSize:11}}>Stop</button>}
          <button onClick={() => setOpen(false)} style={{background:'none',border:'none',color:'rgba(255,255,255,0.8)',cursor:'pointer',fontSize:18}}>×</button>
        </div>
      </div>

      <div ref={ref} style={{height:260,overflowY:'auto',padding:12,display:'flex',flexDirection:'column',gap:8}}>
        {msgs.map((m, i) => (
          <div key={i} style={{maxWidth:'85%',padding:'8px 10px',borderRadius:10,fontSize:12,lineHeight:1.5,alignSelf:m.role==='user'?'flex-end':'flex-start',background:m.role==='user'?'var(--brand)':'var(--surface2)',color:m.role==='user'?'#fff':'var(--text)',borderBottomRightRadius:m.role==='user'?3:10,borderBottomLeftRadius:m.role==='bot'?3:10}}>
            {m.text || (m.streaming ? '...' : '')}
          </div>
        ))}
      </div>

      {msgs.length <= 2 && (
        <div style={{padding:'6px 12px',display:'flex',flexWrap:'wrap',gap:5,borderTop:'0.5px solid var(--border)'}}>
          {["What's due today?","My grades?","Upcoming quizzes?","Any announcements?"].map(c => (
            <button key={c} onClick={() => send(c)} style={{padding:'4px 10px',borderRadius:10,border:'0.5px solid var(--border2)',fontSize:11,cursor:'pointer',color:'var(--text2)',background:'transparent',fontFamily:'var(--font-sans)'}}>{c}</button>
          ))}
        </div>
      )}

      <div style={{display:'flex',gap:6,padding:'8px 12px',borderTop:'0.5px solid var(--border)',alignItems:'center'}}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder={listening ? '🎤 Listening...' : 'Ask about your courses...'}
          style={{flex:1,border:`0.5px solid ${listening ? 'var(--brand)' : 'var(--border2)'}`,borderRadius:'var(--radius)',padding:'7px 10px',fontSize:12,background:listening?'var(--brand-light)':'var(--surface2)',color:'var(--text)',outline:'none',fontFamily:'var(--font-sans)',transition:'all .2s'}}
        />
        <button
          onClick={listening ? stopListening : startListening}
          style={{width:30,height:30,borderRadius:'var(--radius)',background:listening?'#dc2626':'var(--surface2)',border:`0.5px solid ${listening?'#dc2626':'var(--border2)'}`,cursor:'pointer',fontSize:14,transition:'all .2s'}}
          title={listening ? 'Stop listening' : 'Speak'}
        >🎤</button>
        <button onClick={() => send()} style={{width:30,height:30,borderRadius:'var(--radius)',background:'var(--brand)',border:'none',cursor:'pointer',color:'#fff',fontSize:14}}>↑</button>
      </div>
    </div>
  )
}

export default function App() {
  const [page,setPage]=useState('dashboard')
  const [data,setData]=useState({assignments:[],grades:[],courses:[],quizzes:[],announcements:[],discussions:[],events:[]})
  const [loading,setLoading]=useState(true)

  useEffect(()=>{
    Promise.all([fetchAssignments(),fetchGrades(),fetchCourses(),fetchQuizzes(),fetchAnnouncements(),fetchDiscussions(),fetchCalendar()])
      .then(([assignments,grades,courses,quizzes,announcements,discussions,events])=>{
        setData({assignments,grades,courses,quizzes,announcements,discussions,events});setLoading(false)
      }).catch(()=>setLoading(false))
  },[])

  const pending=data.assignments.filter(a=>['due','pending'].includes(a.status))

  return <div style={{display:'flex',flexDirection:'column',height:'100vh'}}>
    <div style={{background:'var(--brand)',padding:'0 20px',height:48,display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
      <div style={{color:'#fff',fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:16,display:'flex',alignItems:'center',gap:8}}>🎓 LearnSpace <span style={{opacity:.6,fontSize:12,fontWeight:400}}>/ Student Portal</span></div>
      <div style={{display:'flex',alignItems:'center',gap:12}}>
        <span style={{color:'rgba(255,255,255,0.8)',fontSize:18}}>🔔</span>
        <div style={{width:30,height:30,borderRadius:'50%',background:'rgba(255,255,255,0.2)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:12,fontWeight:500}}>SJ</div>
      </div>
    </div>
    <div style={{display:'flex',flex:1,overflow:'hidden'}}>
      <div style={{width:200,background:'var(--nav-bg)',display:'flex',flexDirection:'column',flexShrink:0,padding:'12px 0'}}>
        {PAGES.map(p=><div key={p.id} onClick={()=>setPage(p.id)} style={{display:'flex',alignItems:'center',gap:10,padding:'9px 16px',color:page===p.id?'#fff':'var(--nav-text)',cursor:'pointer',fontSize:13,borderLeft:`3px solid ${page===p.id?'var(--brand)':'transparent'}`,background:page===p.id?'rgba(200,16,46,0.15)':'transparent'}}>
          <span>{p.icon}</span>{p.label}
          {p.badge==='assignments'&&pending.length>0&&<span style={{marginLeft:'auto',background:'var(--brand)',color:'#fff',fontSize:10,padding:'1px 6px',borderRadius:10}}>{pending.length}</span>}
        </div>)}
      </div>
      <div style={{position:'relative',flex:1,display:'flex',overflow:'hidden'}}>
        <div style={{flex:1,overflowY:'auto',padding:20}}>
          {loading?<div style={{textAlign:'center',padding:40,color:'var(--text2)'}}>Connecting to backend...</div>:<>
            {page==='dashboard'&&<Dashboard data={data}/>}
            {page==='courses'&&<Courses courses={data.courses}/>}
            {page==='assignments'&&<Assignments assignments={data.assignments}/>}
            {page==='quizzes'&&<Quizzes quizzes={data.quizzes}/>}
            {page==='grades'&&<Grades grades={data.grades}/>}
            {page==='discussions'&&<Discussions discussions={data.discussions}/>}
            {page==='announcements'&&<Announcements announcements={data.announcements}/>}
            {page==='calendar'&&<CalendarView events={data.events}/>}
          </>}
        </div>
        <Chatbot/>
      </div>
    </div>
  </div>
}
