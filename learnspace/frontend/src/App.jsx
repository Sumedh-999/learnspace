import { useState, useEffect, useRef } from 'react'
import { fetchAssignments, fetchGrades, fetchCourses, fetchQuizzes, fetchAnnouncements, fetchDiscussions, fetchCalendar, streamChat } from './api/client'

const PAGES = [
  { id: 'dashboard', label: 'Dashboard', icon: '⊞', group: 'Main' },
  { id: 'courses', label: 'Courses', icon: '📚', group: 'Main' },
  { id: 'assignments', label: 'Assignments', icon: '📋', group: 'Academic', badge: 'assignments' },
  { id: 'quizzes', label: 'Quizzes', icon: '✅', group: 'Academic' },
  { id: 'grades', label: 'Grades', icon: '📊', group: 'Academic' },
  { id: 'discussions', label: 'Discussions', icon: '💬', group: 'Community', badge: 'discussions' },
  { id: 'announcements', label: 'Announcements', icon: '📣', group: 'Community' },
  { id: 'calendar', label: 'Calendar', icon: '📅', group: 'Community' },
]

const GROUPS = ['Main', 'Academic', 'Community']

const css = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@700;800&display=swap');
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body.dark {
  --bg:#0f0f14;--surface:#1a1a24;--surface2:#22222e;--surface3:#2a2a38;
  --border:rgba(255,255,255,0.06);--border2:rgba(255,255,255,0.12);
  --text:#f0f0f8;--text2:#9090b0;--text3:#5a5a7a;--nav:#13131c;
}
body.light {
  --bg:#f4f4f8;--surface:#ffffff;--surface2:#f0f0f5;--surface3:#e8e8f0;
  --border:rgba(0,0,0,0.07);--border2:rgba(0,0,0,0.13);
  --text:#1a1a2e;--text2:#60608a;--text3:#a0a0b8;--nav:#1a1a2e;
}
:root {
  --brand:#c8102e;--brand-dark:#9e0c24;
  --green:#4ade80;--blue:#60a5fa;--amber:#fbbf24;--purple:#a78bfa;
  --font:'DM Sans',system-ui,sans-serif;--display:'Syne',sans-serif;
}
body{font-family:var(--font);background:var(--bg);color:var(--text);height:100vh;overflow:hidden;transition:background .3s,color .3s;}
.topbar{height:52px;background:var(--brand);display:flex;align-items:center;justify-content:space-between;padding:0 20px;flex-shrink:0;}
.logo{color:#fff;font-family:var(--display);font-weight:800;font-size:17px;display:flex;align-items:center;gap:9px;letter-spacing:-.3px;}
.logo-icon{width:28px;height:28px;background:rgba(255,255,255,0.2);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:15px;}
.topbar-right{display:flex;align-items:center;gap:8px;}
.theme-btn{background:rgba(255,255,255,0.15);border:none;color:#fff;cursor:pointer;padding:5px 10px;border-radius:8px;font-size:12px;font-family:var(--font);transition:background .2s;}
.theme-btn:hover{background:rgba(255,255,255,0.25);}
.notif-btn{width:32px;height:32px;background:rgba(255,255,255,0.15);border:none;border-radius:8px;color:#fff;cursor:pointer;font-size:15px;position:relative;display:flex;align-items:center;justify-content:center;}
.notif-dot{position:absolute;top:5px;right:5px;width:6px;height:6px;border-radius:50%;background:var(--amber);border:1.5px solid var(--brand);}
.avatar-btn{width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,0.25);border:none;color:#fff;font-size:11px;font-weight:600;cursor:pointer;font-family:var(--font);}
.layout{display:flex;flex:1;overflow:hidden;}
.sidebar{width:210px;background:var(--nav);display:flex;flex-direction:column;flex-shrink:0;border-right:1px solid var(--border);transition:background .3s;overflow-y:auto;}
.sidebar-user{padding:14px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px;}
.user-avatar{width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#c8102e,#7c3aed);display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:600;flex-shrink:0;}
.user-name{font-size:12px;font-weight:500;color:var(--text);}
.user-role{font-size:10px;color:var(--text2);margin-top:1px;}
.nav-group{padding:10px 8px 4px;}
.nav-label{font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:var(--text3);padding:0 8px;margin-bottom:4px;}
.nav-item{display:flex;align-items:center;gap:9px;padding:7px 10px;border-radius:10px;cursor:pointer;font-size:12px;color:var(--text2);transition:all .15s;margin-bottom:1px;position:relative;border:none;background:transparent;width:100%;text-align:left;font-family:var(--font);}
.nav-item:hover{background:rgba(255,255,255,0.05);color:var(--text);}
.nav-item.active{background:rgba(200,16,46,0.15);color:#fff;}
.nav-item.active::before{content:'';position:absolute;left:-8px;top:50%;transform:translateY(-50%);width:3px;height:20px;background:var(--brand);border-radius:0 3px 3px 0;}
.nav-icon{width:26px;height:26px;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0;background:rgba(255,255,255,0.05);}
.nav-item.active .nav-icon{background:rgba(200,16,46,0.2);}
.nav-badge{margin-left:auto;background:var(--brand);color:#fff;font-size:9px;padding:1px 5px;border-radius:20px;font-weight:600;}
.wrapper{position:relative;flex:1;display:flex;overflow:hidden;}
.content{flex:1;overflow-y:auto;padding:20px;display:flex;flex-direction:column;gap:14px;}
.content::-webkit-scrollbar{width:4px;}
.content::-webkit-scrollbar-thumb{background:var(--border2);border-radius:4px;}
.page-title{font-size:20px;font-weight:600;letter-spacing:-.3px;}
.page-sub{font-size:12px;color:var(--text2);margin-top:3px;display:flex;align-items:center;gap:6px;}
.live-dot{width:6px;height:6px;border-radius:50%;background:var(--green);animation:pulse 2s infinite;}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;}
.stat-card{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:14px;position:relative;overflow:hidden;}
.stat-top{position:absolute;top:0;left:0;right:0;height:3px;border-radius:14px 14px 0 0;}
.stat-val{font-size:26px;font-weight:600;letter-spacing:-.5px;margin-bottom:2px;}
.stat-lbl{font-size:11px;color:var(--text2);}
.stat-hint{font-size:10px;margin-top:5px;}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
.card{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:16px;}
.card-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;}
.card-title{font-size:13px;font-weight:500;display:flex;align-items:center;gap:7px;}
.card-icon{width:24px;height:24px;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:13px;}
.card-action{font-size:11px;color:var(--brand);cursor:pointer;background:none;border:none;font-family:var(--font);}
.task-item{display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border);}
.task-item:last-child{border-bottom:none;}
.task-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;}
.task-info{flex:1;}
.task-name{font-size:12px;font-weight:500;}
.task-meta{font-size:10px;color:var(--text2);margin-top:1px;}
.task-badge{font-size:10px;padding:2px 8px;border-radius:20px;font-weight:500;white-space:nowrap;}
.badge-red{background:rgba(200,16,46,0.15);color:#f87171;}
.badge-amber{background:rgba(251,191,36,0.15);color:var(--amber);}
.badge-green{background:rgba(74,222,128,0.15);color:var(--green);}
.badge-blue{background:rgba(96,165,250,0.15);color:var(--blue);}
.badge-purple{background:rgba(167,139,250,0.15);color:var(--purple);}
.ann-item{padding:9px 0;border-bottom:1px solid var(--border);}
.ann-item:last-child{border-bottom:none;}
.ann-date{font-size:10px;color:var(--text3);margin-bottom:2px;}
.ann-title-text{font-size:12px;font-weight:500;margin-bottom:2px;}
.ann-body-text{font-size:11px;color:var(--text2);line-height:1.4;}
.course-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
.course-card{background:var(--surface2);border:1px solid var(--border);border-radius:12px;overflow:hidden;cursor:pointer;transition:all .2s;}
.course-card:hover{border-color:var(--border2);transform:translateY(-1px);}
.course-stripe{height:4px;}
.course-body{padding:12px;}
.course-code-text{font-size:9px;letter-spacing:1px;text-transform:uppercase;color:var(--text3);margin-bottom:3px;}
.course-name-text{font-size:12px;font-weight:500;margin-bottom:6px;line-height:1.3;}
.course-meta-row{display:flex;gap:10px;font-size:10px;color:var(--text2);}
.progress-wrap{margin-top:10px;height:3px;background:var(--border2);border-radius:2px;overflow:hidden;}
.progress-fill{height:100%;border-radius:2px;}
.tbl{width:100%;border-collapse:collapse;font-size:12px;}
.tbl th{text-align:left;padding:7px 10px;font-size:10px;font-weight:500;color:var(--text2);border-bottom:1px solid var(--border);background:var(--surface2);}
.tbl td{padding:9px 10px;border-bottom:1px solid var(--border);vertical-align:middle;}
.tbl tr:last-child td{border-bottom:none;}
.tbl tr:hover td{background:var(--surface2);}
.quiz-item{display:flex;align-items:center;gap:12px;padding:11px 0;border-bottom:1px solid var(--border);}
.quiz-item:last-child{border-bottom:none;}
.quiz-icon{width:36px;height:36px;border-radius:10px;background:var(--surface2);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;}
.quiz-info{flex:1;}
.quiz-name{font-size:12px;font-weight:500;}
.quiz-meta{font-size:10px;color:var(--text2);margin-top:2px;}
.grade-item{display:flex;align-items:center;gap:12px;padding:11px 0;border-bottom:1px solid var(--border);}
.grade-item:last-child{border-bottom:none;}
.grade-info{flex:1;}
.grade-course{font-size:12px;font-weight:500;}
.grade-code{font-size:10px;color:var(--text2);margin-top:1px;}
.grade-bar{width:100px;height:5px;background:var(--border2);border-radius:3px;overflow:hidden;}
.grade-fill{height:100%;border-radius:3px;}
.grade-pct{font-size:13px;font-weight:600;min-width:38px;text-align:right;}
.grade-letter{font-size:11px;font-weight:600;padding:2px 8px;border-radius:6px;}
.disc-item{padding:11px 0;border-bottom:1px solid var(--border);}
.disc-item:last-child{border-bottom:none;}
.disc-head{display:flex;align-items:center;gap:8px;margin-bottom:5px;}
.disc-avatar{width:26px;height:26px;border-radius:50%;background:var(--surface2);border:1px solid var(--border2);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:600;color:var(--text2);flex-shrink:0;}
.disc-author{font-size:12px;font-weight:500;}
.disc-time{font-size:10px;color:var(--text3);margin-left:auto;}
.disc-body{font-size:11px;color:var(--text2);margin-left:34px;line-height:1.5;}
.disc-replies{font-size:10px;color:var(--brand);margin-left:34px;margin-top:4px;cursor:pointer;}
.cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:3px;text-align:center;}
.cal-day-name{font-size:9px;color:var(--text3);padding:4px 0;font-weight:500;}
.cal-day{padding:5px 3px;font-size:11px;border-radius:7px;cursor:pointer;position:relative;}
.cal-day:hover{background:var(--surface2);}
.cal-day.today{background:var(--brand);color:#fff;font-weight:600;}
.cal-day.has-event::after{content:'';position:absolute;bottom:2px;left:50%;transform:translateX(-50%);width:3px;height:3px;border-radius:50%;background:var(--brand);}
.cal-day.today.has-event::after{background:#fff;}
.cal-day.other{color:var(--text3);}
.cal-nav-btn{background:none;border:none;cursor:pointer;color:var(--text2);font-size:18px;padding:2px 8px;border-radius:8px;}
.cal-nav-btn:hover{background:var(--surface2);}
.event-item{display:flex;gap:10px;padding:8px 0;border-bottom:1px solid var(--border);align-items:flex-start;}
.event-item:last-child{border-bottom:none;}
.event-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;margin-top:3px;}
.event-title{font-size:12px;font-weight:500;}
.event-meta{font-size:10px;color:var(--text2);margin-top:1px;}
.chatbot-fab{position:absolute;bottom:16px;right:16px;width:46px;height:46px;border-radius:50%;background:var(--brand);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#fff;font-size:20px;box-shadow:0 4px 16px rgba(200,16,46,0.4);z-index:10;transition:transform .2s;}
.chatbot-fab:hover{transform:scale(1.08);}
.chat-panel{position:absolute;bottom:70px;right:16px;width:305px;background:var(--surface);border:1px solid var(--border2);border-radius:16px;display:flex;flex-direction:column;z-index:10;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.25);}
.chat-head{background:var(--brand);padding:11px 14px;display:flex;align-items:center;gap:10px;}
.chat-bot-avatar{width:32px;height:32px;border-radius:10px;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;}
.chat-bot-name{color:#fff;font-size:13px;font-weight:500;}
.chat-bot-status{color:rgba(255,255,255,0.7);font-size:10px;display:flex;align-items:center;gap:4px;}
.chat-status-dot{width:5px;height:5px;border-radius:50%;background:var(--green);}
.chat-close{background:none;border:none;color:rgba(255,255,255,0.7);cursor:pointer;font-size:18px;margin-left:auto;padding:0;}
.chat-msgs{height:220px;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:8px;}
.chat-msgs::-webkit-scrollbar{width:3px;}
.chat-msgs::-webkit-scrollbar-thumb{background:var(--border2);border-radius:3px;}
.chat-bubble{max-width:86%;padding:8px 11px;border-radius:12px;font-size:12px;line-height:1.55;}
.chat-bubble.bot{background:var(--surface2);color:var(--text);border-bottom-left-radius:3px;align-self:flex-start;}
.chat-bubble.user{background:var(--brand);color:#fff;border-bottom-right-radius:3px;align-self:flex-end;}
.chat-chips{padding:7px 12px;display:flex;flex-wrap:wrap;gap:5px;border-top:1px solid var(--border);}
.chip{padding:4px 10px;border-radius:20px;border:1px solid var(--border2);font-size:10px;cursor:pointer;color:var(--text2);background:transparent;font-family:var(--font);transition:all .15s;}
.chip:hover{background:var(--surface2);color:var(--text);}
.chat-input-row{display:flex;gap:6px;padding:8px 12px;border-top:1px solid var(--border);}
.chat-input-row input{flex:1;background:var(--surface2);border:1px solid var(--border2);border-radius:8px;padding:7px 10px;font-size:12px;color:var(--text);outline:none;font-family:var(--font);}
.chat-input-row input::placeholder{color:var(--text3);}
.chat-send-btn{width:30px;height:30px;border-radius:8px;background:var(--brand);border:none;color:#fff;cursor:pointer;font-size:14px;}
.chat-mic-btn{width:30px;height:30px;border-radius:8px;background:var(--surface2);border:1px solid var(--border2);color:var(--text2);cursor:pointer;font-size:13px;transition:all .2s;}
.chat-mic-btn.listening{background:#dc2626;border-color:#dc2626;color:#fff;}
`

function StyleTag() { return <style>{css}</style> }

function Badge({ text, type = 'blue' }) {
  return <span className={`task-badge badge-${type}`}>{text}</span>
}

function Card({ title, icon, iconBg, action, children }) {
  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title"><div className="card-icon" style={{ background: iconBg }}>{icon}</div>{title}</div>
        {action && <button className="card-action">{action}</button>}
      </div>
      {children}
    </div>
  )
}

function Dashboard({ data }) {
  const pending = (data.assignments || []).filter(a => ['due', 'pending'].includes(a.status))
  const avg = data.grades?.length ? Math.round(data.grades.reduce((s, g) => s + Number(g.percentage), 0) / data.grades.length) : 0
  const upcoming = (data.quizzes || []).filter(q => q.status === 'upcoming')
  const gpa = data.grades?.length ? (data.grades.reduce((s, g) => { const m = { 'A+': 4.0, 'A': 4.0, 'B+': 3.3, 'B': 3.0 }; return s + (m[g.letter_grade] || 3.0) }, 0) / data.grades.length).toFixed(1) : '0.0'
  const stats = [
    { val: data.courses?.length || 0, lbl: 'Active courses', color: 'var(--brand)', top: '#c8102e', hint: '📚 All enrolled', hc: 'var(--text2)' },
    { val: `${avg}%`, lbl: 'Overall grade', color: 'var(--green)', top: '#4ade80', hint: '↑ On track', hc: 'var(--green)' },
    { val: upcoming.length, lbl: 'Upcoming quizzes', color: 'var(--blue)', top: '#60a5fa', hint: '⚠ This week', hc: 'var(--amber)' },
    { val: gpa, lbl: 'Current GPA', color: 'var(--purple)', top: '#a78bfa', hint: '★ Excellent', hc: 'var(--purple)' },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div><div className="page-title">Good morning, Sumedh 👋</div><div className="page-sub"><div className="live-dot" />Live · Semester 2 · May 26, 2026</div></div>
      <div className="stats">
        {stats.map(({ val, lbl, color, top, hint, hc }) => (
          <div className="stat-card" key={lbl}>
            <div className="stat-top" style={{ background: top }} />
            <div className="stat-val" style={{ color }}>{val}</div>
            <div className="stat-lbl">{lbl}</div>
            <div className="stat-hint" style={{ color: hc }}>{hint}</div>
          </div>
        ))}
      </div>
      <div className="grid2">
        <Card title="Due this week" icon="📋" iconBg="rgba(200,16,46,0.1)" action="View all">
          {pending.slice(0, 3).map(a => (
            <div className="task-item" key={a.id}>
              <div className="task-dot" style={{ background: a.code?.startsWith('AIML') ? '#c8102e' : a.code?.startsWith('CLOD') ? '#60a5fa' : '#4ade80' }} />
              <div className="task-info"><div className="task-name">{(a.title || '').slice(0, 28)}</div><div className="task-meta">{a.code}</div></div>
              <Badge text={String(a.due_date || '').slice(5, 10)} type={a.status === 'due' ? 'red' : 'amber'} />
            </div>
          ))}
        </Card>
        <Card title="Announcements" icon="📣" iconBg="rgba(96,165,250,0.1)" action="See all">
          {(data.announcements || []).slice(0, 3).map(a => (
            <div className="ann-item" key={a.id}>
              <div className="ann-date">{String(a.posted_at || '').slice(0, 10)}</div>
              <div className="ann-title-text">{a.title}</div>
              <div className="ann-body-text">{String(a.body || '').slice(0, 70)}...</div>
            </div>
          ))}
        </Card>
      </div>
      <Card title="My courses" icon="📚" iconBg="rgba(167,139,250,0.1)" action="View all">
        <div className="course-grid">
          {(data.courses || []).map(c => (
            <div className="course-card" key={c.id}>
              <div className="course-stripe" style={{ background: c.color || '#c8102e' }} />
              <div className="course-body">
                <div className="course-code-text">{c.code}</div>
                <div className="course-name-text">{c.name}</div>
                <div className="course-meta-row"><span>👤 {c.instructor}</span><span>🕐 {c.schedule}</span></div>
                <div className="progress-wrap"><div className="progress-fill" style={{ width: `${c.progress}%`, background: c.color || '#c8102e' }} /></div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function Courses({ courses }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="page-title">My courses</div>
      <div className="course-grid">
        {courses.map(c => (
          <div className="course-card" key={c.id}>
            <div className="course-stripe" style={{ background: c.color || '#c8102e' }} />
            <div className="course-body">
              <div className="course-code-text">{c.code}</div>
              <div className="course-name-text">{c.name}</div>
              <div className="course-meta-row"><span>👤 {c.instructor}</span><span>🕐 {c.schedule}</span></div>
              <div className="progress-wrap"><div className="progress-fill" style={{ width: `${c.progress}%`, background: c.color || '#c8102e' }} /></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Assignments({ assignments }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="page-title">Assignments</div>
      <div className="card">
        <table className="tbl">
          <thead><tr>{['Assignment', 'Course', 'Due date', 'Points', 'Status'].map(h => <th key={h}>{h}</th>)}</tr></thead>
          <tbody>{assignments.map(a => (
            <tr key={a.id}>
              <td style={{ fontWeight: 500 }}>{a.title}</td>
              <td style={{ color: 'var(--text2)' }}>{a.code}</td>
              <td>{String(a.due_date || '').slice(0, 10)}</td>
              <td>{a.points}</td>
              <td><Badge text={a.status === 'graded' ? `${a.score}/100` : a.status} type={a.status === 'graded' ? 'blue' : a.status === 'submitted' ? 'green' : 'red'} /></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  )
}

function Quizzes({ quizzes }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="page-title">Quizzes & exams</div>
      <div className="card">
        {quizzes.map(q => (
          <div className="quiz-item" key={q.id}>
            <div className="quiz-icon">{q.status === 'upcoming' ? '📝' : '✅'}</div>
            <div className="quiz-info"><div className="quiz-name">{q.title}</div><div className="quiz-meta">{String(q.scheduled_date || '').slice(0, 10)} · {q.duration_mins} min · {q.code}</div></div>
            <Badge text={q.status} type={q.status === 'upcoming' ? 'purple' : 'green'} />
          </div>
        ))}
      </div>
    </div>
  )
}

function Grades({ grades }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="page-title">Grades</div>
      <div className="card">
        {grades.map(g => (
          <div className="grade-item" key={g.id}>
            <div className="grade-info"><div className="grade-course">{g.name}</div><div className="grade-code">{g.code}</div></div>
            <div className="grade-bar"><div className="grade-fill" style={{ width: `${g.percentage}%`, background: g.color || '#c8102e' }} /></div>
            <div className="grade-pct" style={{ color: g.color || '#c8102e' }}>{g.percentage}%</div>
            <div className="grade-letter" style={{ background: 'rgba(167,139,250,0.15)', color: 'var(--purple)' }}>{g.letter_grade}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Discussions({ discussions }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="page-title">Discussions</div>
      <div className="card">
        {discussions.map(d => (
          <div className="disc-item" key={d.id}>
            <div className="disc-head">
              <div className="disc-avatar">{d.author_initials}</div>
              <span className="disc-author">{d.author_name}</span>
              <span className="disc-time">{String(d.posted_at || '').slice(0, 10)}</span>
            </div>
            <div className="disc-body">{d.body}</div>
            <div className="disc-replies">{d.reply_count} replies · Join discussion</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Announcements({ announcements }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="page-title">Announcements</div>
      <div className="card">
        {announcements.map(a => (
          <div className="ann-item" key={a.id}>
            <div className="ann-date">{String(a.posted_at || '').slice(0, 10)}</div>
            <div className="ann-title-text">{a.title}</div>
            <div className="ann-body-text">{a.body}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function CalendarView({ events }) {
  const [month, setMonth] = useState(4)
  const [year, setYear] = useState(2026)
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December']
  const eventDays = events.map(e => new Date(e.event_date).getDate())
  const first = new Date(year, month, 1).getDay()
  const days = new Date(year, month + 1, 0).getDate()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="page-title">Calendar</div>
      <div className="grid2">
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <button className="cal-nav-btn" onClick={() => month === 0 ? (setMonth(11), setYear(y => y - 1)) : setMonth(m => m - 1)}>‹</button>
            <span style={{ fontSize: 13, fontWeight: 500 }}>{months[month]} {year}</span>
            <button className="cal-nav-btn" onClick={() => month === 11 ? (setMonth(0), setYear(y => y + 1)) : setMonth(m => m + 1)}>›</button>
          </div>
          <div className="cal-grid">
            {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => <div key={d} className="cal-day-name">{d}</div>)}
            {Array.from({ length: first }, (_, i) => <div key={`p${i}`} className="cal-day other">{new Date(year, month, 0).getDate() - first + 1 + i}</div>)}
            {Array.from({ length: days }, (_, i) => {
              const d = i + 1, isToday = year === 2026 && month === 4 && d === 22, hasEv = eventDays.includes(d)
              return <div key={d} className={`cal-day${isToday ? ' today' : ''}${hasEv ? ' has-event' : ''}`}>{d}</div>
            })}
          </div>
        </div>
        <div className="card">
          <div className="card-header"><div className="card-title"><div className="card-icon" style={{ background: 'rgba(200,16,46,0.1)' }}>📅</div>Upcoming events</div></div>
          {events.slice(0, 6).map(e => (
            <div className="event-item" key={e.id}>
              <div className="event-dot" style={{ background: e.color || '#c8102e' }} />
              <div><div className="event-title">{e.title}</div><div className="event-meta">{String(e.event_date || '').slice(0, 10)} · {e.code}</div></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Chatbot() {
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState([{ role: 'bot', text: "Hi Sumedh! 👋 I'm LearnBot. Ask me about assignments, grades, quizzes, or your courses!" }])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [listening, setListening] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const ref = useRef(null)
  const recRef = useRef(null)

  useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight }, [msgs])

  function startListening() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { alert('Use Chrome or Edge for voice input'); return }
    const r = new SR(); r.lang = 'en-US'; r.interimResults = false
    r.onstart = () => setListening(true)
    r.onend = () => setListening(false)
    r.onresult = e => { const t = e.results[0][0].transcript; setInput(t); setTimeout(() => send(t), 300) }
    r.onerror = () => setListening(false)
    recRef.current = r; r.start()
  }

  function stopListening() { recRef.current?.stop(); setListening(false) }

  function speakText(text) {
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text.replace(/[*_#`]/g, '').replace(/\n/g, ' '))
    u.lang = 'en-US'; u.rate = 1.0
    const v = window.speechSynthesis.getVoices().find(v => v.name.includes('Google') && v.lang === 'en-US')
    if (v) u.voice = v
    u.onstart = () => setSpeaking(true); u.onend = () => setSpeaking(false)
    window.speechSynthesis.speak(u)
  }

  async function send(text) {
    const q = (text || input).trim(); if (!q || streaming) return
    setInput('')
    setMsgs(m => [...m, { role: 'user', text: q }, { role: 'bot', text: '', streaming: true }])
    setStreaming(true)
    try {
      let full = ''
      for await (const chunk of streamChat(q)) { full += chunk; setMsgs(m => m.map((x, i) => i === m.length - 1 ? { ...x, text: full } : x)) }
      setMsgs(m => m.map((x, i) => i === m.length - 1 ? { ...x, streaming: false } : x))
      speakText(full)
    } catch {
      setMsgs(m => m.map((x, i) => i === m.length - 1 ? { role: 'bot', text: 'Connection error. Check your backend.' } : x))
    }
    setStreaming(false)
  }

  if (!open) return <button className="chatbot-fab" onClick={() => setOpen(true)} aria-label="Open LearnBot">🤖</button>

  return (
    <div className="chat-panel">
      <div className="chat-head">
        <div className="chat-bot-avatar">🤖</div>
        <div>
          <div className="chat-bot-name">LearnBot AI {speaking && <span style={{ fontSize: 10, opacity: .8 }}>🔊</span>}</div>
          <div className="chat-bot-status"><div className="chat-status-dot" />Online · Powered by Claude</div>
        </div>
        <button className="chat-close" onClick={() => { setOpen(false); window.speechSynthesis?.cancel() }}>×</button>
      </div>
      <div className="chat-msgs" ref={ref}>
        {msgs.map((m, i) => <div key={i} className={`chat-bubble ${m.role}`}>{m.text || (m.streaming ? '...' : '')}</div>)}
      </div>
      {msgs.length <= 2 && (
        <div className="chat-chips">
          {["What's due today?", "My grades?", "Upcoming quizzes?", "Who teaches ML?"].map(c => (
            <button key={c} className="chip" onClick={() => send(c)}>{c}</button>
          ))}
        </div>
      )}
      <div className="chat-input-row">
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder={listening ? '🎤 Listening...' : 'Ask about your courses...'} style={{ borderColor: listening ? 'var(--brand)' : undefined }} />
        <button className={`chat-mic-btn${listening ? ' listening' : ''}`} onClick={listening ? stopListening : startListening}>🎤</button>
        <button className="chat-send-btn" onClick={() => send()}>↑</button>
      </div>
    </div>
  )
}

export default function App() {
  const [page, setPage] = useState('dashboard')
  const [dark, setDark] = useState(true)
  const [data, setData] = useState({ assignments: [], grades: [], courses: [], quizzes: [], announcements: [], discussions: [], events: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => { document.body.className = dark ? 'dark' : 'light' }, [dark])

  useEffect(() => {
    document.body.className = 'dark'
    Promise.all([fetchAssignments(), fetchGrades(), fetchCourses(), fetchQuizzes(), fetchAnnouncements(), fetchDiscussions(), fetchCalendar()])
      .then(([assignments, grades, courses, quizzes, announcements, discussions, events]) => {
        setData({ assignments, grades, courses, quizzes, announcements, discussions, events }); setLoading(false)
      }).catch(() => setLoading(false))
  }, [])

  const pending = data.assignments.filter(a => ['due', 'pending'].includes(a.status))

  return (
    <>
      <StyleTag />
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <div className="topbar">
          <div className="logo"><div className="logo-icon">🎓</div>LearnSpace</div>
          <div className="topbar-right">
            <button className="theme-btn" onClick={() => setDark(d => !d)}>{dark ? '☀️ Light' : '🌙 Dark'}</button>
            <button className="notif-btn">🔔<div className="notif-dot" /></button>
            <button className="avatar-btn">SJ</button>
          </div>
        </div>
        <div className="layout">
          <div className="sidebar">
            <div className="sidebar-user">
              <div className="user-avatar">SJ</div>
              <div><div className="user-name">Sumedh Joshi</div><div className="user-role">Cloud & AI Engineering</div></div>
            </div>
            {GROUPS.map(group => (
              <div className="nav-group" key={group}>
                <div className="nav-label">{group}</div>
                {PAGES.filter(p => p.group === group).map(p => (
                  <button key={p.id} className={`nav-item${page === p.id ? ' active' : ''}`} onClick={() => setPage(p.id)}>
                    <div className="nav-icon">{p.icon}</div>{p.label}
                    {p.badge === 'assignments' && pending.length > 0 && <span className="nav-badge">{pending.length}</span>}
                  </button>
                ))}
              </div>
            ))}
          </div>
          <div className="wrapper">
            <div className="content">
              {loading ? <div style={{ textAlign: 'center', padding: 40, color: 'var(--text2)' }}>Connecting to backend...</div> : <>
                {page === 'dashboard' && <Dashboard data={data} />}
                {page === 'courses' && <Courses courses={data.courses} />}
                {page === 'assignments' && <Assignments assignments={data.assignments} />}
                {page === 'quizzes' && <Quizzes quizzes={data.quizzes} />}
                {page === 'grades' && <Grades grades={data.grades} />}
                {page === 'discussions' && <Discussions discussions={data.discussions} />}
                {page === 'announcements' && <Announcements announcements={data.announcements} />}
                {page === 'calendar' && <CalendarView events={data.events} />}
              </>}
            </div>
            <Chatbot />
          </div>
        </div>
      </div>
    </>
  )
}
