import { useState, useEffect, useRef, useMemo } from 'react'
import { fetchAssignments, fetchGrades, fetchCourses, fetchQuizzes, fetchAnnouncements, fetchDiscussions, fetchCalendar, streamChat } from './api/client'

/* ─────────────────────────  icons  ───────────────────────── */
const I = {
  grid: <path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" />,
  book: <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5z" />,
  task: <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-6 9 2 2 4-4" />,
  check: <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3" />,
  chart: <path d="M18 20V10M12 20V4M6 20v-6" />,
  chat: <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z" />,
  mega: <path d="m3 11 18-5v12L3 14v-3zM11.6 16.8a3 3 0 1 1-5.8-1.6" />,
  cal: <path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />,
  sun: <path d="M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />,
  moon: <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />,
  bell: <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" />,
  mic: <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3zM19 10v2a7 7 0 0 1-14 0v-2M12 19v4" />,
  send: <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" />,
  x: <path d="M18 6 6 18M6 6l12 12" />,
  stop: <path d="M6 6h12v12H6z" />,
  clock: <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2" />,
  search: <path d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.35-4.35" />,
}
const Ico = ({ d, s = 16, w = 1.7 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>
)

const NAV = [
  { id: 'dashboard', label: 'Today', icon: I.grid, sec: '' },
  { id: 'courses', label: 'Courses', icon: I.book, sec: '' },
  { id: 'assignments', label: 'Assignments', icon: I.task, sec: 'Coursework', count: 'pending' },
  { id: 'quizzes', label: 'Quizzes', icon: I.check, sec: 'Coursework' },
  { id: 'grades', label: 'Grades', icon: I.chart, sec: 'Coursework' },
  { id: 'discussions', label: 'Discussions', icon: I.chat, sec: 'Campus' },
  { id: 'announcements', label: 'Announcements', icon: I.mega, sec: 'Campus' },
  { id: 'calendar', label: 'Calendar', icon: I.cal, sec: 'Campus' },
]

/* ─────────────────────────  styles  ───────────────────────── */
const css = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wdth,wght@12..96,75..100,400;12..96,75..100,600;12..96,75..100,700;12..96,75..100,800&family=Public+Sans:wght@400;500;600&display=swap');

*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

body.dark{
  --ink:#14161F; --slab:#1B1E29; --rise:#232736; --edge:#2C3142; --edge2:#3A4054;
  --paper:#EDEFF6; --mute:#8A90A6;
  --faint:#5D6377; --rail:#2C3142;
}
body.light{
  --ink:#F7F8FC; --slab:#FFFFFF; --rise:#F0F2F8; --edge:#E2E5EF; --edge2:#CDD2E0;
  --paper:#171A23; --mute:#5E6478; --faint:#9AA0B4; --rail:#E2E5EF;
}
:root{
  --sig:#E0263F; --sig-soft:rgba(224,38,63,.12);
  --ok:#2BB673; --info:#3D7DE0; --warn:#D98B14; --plum:#7C5CE0;
  --ui:'Public Sans',system-ui,sans-serif;
  --dis:'Bricolage Grotesque','Public Sans',sans-serif;
  --r:10px;
}

body{font-family:var(--ui);background:var(--ink);color:var(--paper);
  height:100vh;overflow:hidden;-webkit-font-smoothing:antialiased;
  transition:background .25s ease,color .25s ease}

button{font-family:inherit;cursor:pointer;border:none;background:none;color:inherit}
:focus-visible{outline:2px solid var(--info);outline-offset:2px;border-radius:4px}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}

.shell{display:flex;height:100vh}

/* ── sidebar ── */
.side{width:232px;flex-shrink:0;background:var(--slab);border-right:1px solid var(--edge);
  display:flex;flex-direction:column;transition:background .25s ease}
.brand{display:flex;align-items:center;gap:10px;padding:20px 18px 18px}
.mark{width:30px;height:30px;border-radius:9px;background:var(--sig);flex-shrink:0;
  display:grid;place-items:center;color:#fff;font-family:var(--dis);font-weight:800;font-size:15px}
.brand-name{font-family:var(--dis);font-weight:700;font-size:17px;letter-spacing:-.02em}

.who{margin:0 12px 14px;padding:11px 12px;background:var(--rise);border-radius:var(--r);
  display:flex;align-items:center;gap:10px}
.who-av{width:32px;height:32px;border-radius:9px;flex-shrink:0;display:grid;place-items:center;
  background:linear-gradient(140deg,var(--sig),var(--plum));color:#fff;
  font-family:var(--dis);font-weight:700;font-size:12px}
.who-n{font-size:12.5px;font-weight:600;line-height:1.3}
.who-p{font-size:11px;color:var(--mute);margin-top:1px}

.nav{flex:1;overflow-y:auto;padding:0 12px 12px}
.nav::-webkit-scrollbar{width:0}
.sec{font-size:10.5px;font-weight:600;color:var(--faint);padding:14px 10px 6px;letter-spacing:.02em}
.nl{display:flex;align-items:center;gap:11px;width:100%;padding:8px 10px;border-radius:8px;
  font-size:13px;font-weight:500;color:var(--mute);text-align:left;transition:background .12s,color .12s}
.nl:hover{background:var(--rise);color:var(--paper)}
.nl[aria-current="page"]{background:var(--sig-soft);color:var(--paper);font-weight:600}
.nl[aria-current="page"] svg{color:var(--sig)}
.nl svg{flex-shrink:0;color:var(--faint)}
.nl:hover svg{color:var(--mute)}
.pill{margin-left:auto;min-width:18px;height:18px;padding:0 6px;border-radius:9px;
  background:var(--sig);color:#fff;font-size:10.5px;font-weight:600;display:grid;place-items:center}

/* ── main ── */
.main{flex:1;display:flex;flex-direction:column;min-width:0;position:relative}
.bar{height:56px;flex-shrink:0;display:flex;align-items:center;gap:14px;
  padding:0 26px;border-bottom:1px solid var(--edge)}
.find{flex:1;max-width:340px;display:flex;align-items:center;gap:8px;height:34px;padding:0 12px;
  background:var(--rise);border:1px solid transparent;border-radius:8px;color:var(--faint);
  font-size:12.5px;transition:border-color .15s}
.find:focus-within{border-color:var(--edge2)}
.find input{flex:1;background:none;border:none;outline:none;color:var(--paper);font:inherit}
.find input::placeholder{color:var(--faint)}
.bar-sp{flex:1}
.icb{width:32px;height:32px;border-radius:8px;display:grid;place-items:center;color:var(--mute);
  transition:background .12s,color .12s}
.icb:hover{background:var(--rise);color:var(--paper)}
.icb.dot::after{content:'';position:absolute;margin:-12px 0 0 12px;width:6px;height:6px;
  border-radius:50%;background:var(--sig)}
.me{width:32px;height:32px;border-radius:50%;display:grid;place-items:center;
  background:linear-gradient(140deg,var(--sig),var(--plum));color:#fff;
  font-family:var(--dis);font-weight:700;font-size:11.5px}

.scroll{flex:1;overflow-y:auto;padding:26px 26px 40px}
.scroll::-webkit-scrollbar{width:8px}
.scroll::-webkit-scrollbar-thumb{background:var(--edge);border-radius:4px;
  border:2px solid var(--ink)}
.page{max-width:1080px;margin:0 auto}

.h1{font-family:var(--dis);font-size:27px;font-weight:700;letter-spacing:-.025em;line-height:1.15}
.h2{font-family:var(--dis);font-size:15px;font-weight:600;letter-spacing:-.01em}
.sub{font-size:13px;color:var(--mute);margin-top:5px}

/* ── the rail: hero ── */
.rail{margin:24px 0 26px;border-left:2px solid var(--rail);padding-left:22px}
.stop{position:relative;padding-bottom:20px}
.stop:last-child{padding-bottom:0}
.stop::before{content:'';position:absolute;left:-28px;top:6px;width:10px;height:10px;
  border-radius:50%;background:var(--ink);border:2px solid var(--rail)}
.stop.hot::before{border-color:var(--sig);background:var(--sig);
  box-shadow:0 0 0 4px var(--sig-soft)}
.when{font-size:11px;font-weight:600;color:var(--faint);letter-spacing:.02em}
.stop.hot .when{color:var(--sig)}
.what{font-family:var(--dis);font-size:16px;font-weight:600;letter-spacing:-.01em;margin:3px 0 2px}
.stop.hot .what{font-size:22px}
.where{font-size:12.5px;color:var(--mute);display:flex;align-items:center;gap:7px}
.tag{width:7px;height:7px;border-radius:2px;flex-shrink:0}

/* ── inline metrics ── */
.metrics{display:flex;flex-wrap:wrap;gap:0;border:1px solid var(--edge);border-radius:var(--r);
  overflow:hidden;margin-bottom:26px}
.met{flex:1;min-width:130px;padding:14px 18px;border-right:1px solid var(--edge)}
.met:last-child{border-right:none}
.met-v{font-family:var(--dis);font-size:24px;font-weight:700;letter-spacing:-.03em;line-height:1}
.met-l{font-size:11.5px;color:var(--mute);margin-top:5px}

/* ── panels ── */
.two{display:grid;grid-template-columns:1fr 1fr;gap:18px}
.panel{border:1px solid var(--edge);border-radius:var(--r);overflow:hidden;background:var(--slab)}
.ph{display:flex;align-items:center;justify-content:space-between;padding:14px 16px 12px;
  border-bottom:1px solid var(--edge)}
.pb{padding:4px 16px 12px}
.more{font-size:11.5px;font-weight:500;color:var(--mute)}
.more:hover{color:var(--paper)}

.row{display:flex;align-items:flex-start;gap:11px;padding:11px 0;border-bottom:1px solid var(--edge)}
.row:last-child{border-bottom:none}
.row-m{flex:1;min-width:0}
.row-t{font-size:13px;font-weight:500;line-height:1.35}
.row-s{font-size:11.5px;color:var(--mute);margin-top:3px;line-height:1.45}
.chip{font-size:10.5px;font-weight:600;padding:3px 8px;border-radius:20px;white-space:nowrap;flex-shrink:0}
.c-sig{background:var(--sig-soft);color:var(--sig)}
.c-warn{background:rgba(217,139,20,.13);color:var(--warn)}
.c-ok{background:rgba(43,182,115,.13);color:var(--ok)}
.c-info{background:rgba(61,125,224,.13);color:var(--info)}
.c-plum{background:rgba(124,92,224,.13);color:var(--plum)}

/* ── course cards ── */
.courses{display:grid;grid-template-columns:repeat(auto-fill,minmax(232px,1fr));gap:14px}
.cc{border:1px solid var(--edge);border-radius:var(--r);padding:16px;background:var(--slab);
  text-align:left;width:100%;transition:border-color .15s}
.cc:hover{border-color:var(--edge2)}
.cc-c{font-size:11px;font-weight:600;color:var(--mute);letter-spacing:.03em}
.cc-n{font-family:var(--dis);font-size:15px;font-weight:600;letter-spacing:-.015em;
  margin:6px 0 12px;line-height:1.25}
.cc-w{font-size:11.5px;color:var(--mute);margin-bottom:14px}
.cc-p{display:flex;align-items:center;gap:9px}
.trk{flex:1;height:4px;background:var(--rail);border-radius:2px;overflow:hidden}
.fil{height:100%;border-radius:2px}
.pct{font-family:var(--dis);font-size:12px;font-weight:700;color:var(--mute)}

/* ── table ── */
.tw{border:1px solid var(--edge);border-radius:var(--r);overflow:hidden;background:var(--slab)}
table{width:100%;border-collapse:collapse;font-size:12.5px}
th{text-align:left;padding:11px 16px;font-size:11px;font-weight:600;color:var(--mute);
  background:var(--rise);border-bottom:1px solid var(--edge)}
td{padding:12px 16px;border-bottom:1px solid var(--edge)}
tr:last-child td{border-bottom:none}
tbody tr:hover td{background:var(--rise)}
.strong{font-weight:500}

/* ── grades ── */
.gr{display:flex;align-items:center;gap:16px;padding:14px 0;border-bottom:1px solid var(--edge)}
.gr:last-child{border-bottom:none}
.gr-m{flex:1;min-width:0}
.gr-n{font-size:13px;font-weight:500}
.gr-c{font-size:11.5px;color:var(--mute);margin-top:2px}
.gr-b{width:110px;height:5px;background:var(--rail);border-radius:3px;overflow:hidden;flex-shrink:0}
.gr-v{font-family:var(--dis);font-size:15px;font-weight:700;min-width:46px;text-align:right;
  letter-spacing:-.02em}
.gr-l{font-family:var(--dis);font-size:12px;font-weight:700;padding:3px 9px;border-radius:6px;
  min-width:34px;text-align:center}

/* ── discussion ── */
.dc{padding:14px 0;border-bottom:1px solid var(--edge)}
.dc:last-child{border-bottom:none}
.dc-h{display:flex;align-items:center;gap:9px;margin-bottom:7px}
.dc-a{width:26px;height:26px;border-radius:50%;background:var(--rise);border:1px solid var(--edge);
  display:grid;place-items:center;font-size:10px;font-weight:600;color:var(--mute);flex-shrink:0}
.dc-n{font-size:12.5px;font-weight:600}
.dc-t{font-size:11px;color:var(--faint);margin-left:auto}
.dc-b{font-size:12.5px;color:var(--mute);line-height:1.55;padding-left:35px}
.dc-r{font-size:11.5px;font-weight:500;color:var(--info);padding-left:35px;margin-top:6px}

/* ── calendar ── */
.cg{display:grid;grid-template-columns:repeat(7,1fr);gap:2px}
.cd-h{font-size:10.5px;font-weight:600;color:var(--faint);text-align:center;padding:6px 0}
.cd{aspect-ratio:1;display:grid;place-items:center;font-size:12px;border-radius:7px;
  position:relative;color:var(--paper)}
.cd.off{color:var(--faint)}
.cd.now{background:var(--sig);color:#fff;font-weight:700}
.cd.has::after{content:'';position:absolute;bottom:5px;width:4px;height:4px;border-radius:50%;
  background:var(--sig)}
.cd.now.has::after{background:#fff}
.cnav{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
.cbtn{width:26px;height:26px;border-radius:6px;display:grid;place-items:center;color:var(--mute);font-size:15px}
.cbtn:hover{background:var(--rise)}

/* ── empty / loading ── */
.void{text-align:center;padding:56px 20px;color:var(--mute);font-size:13px}
.void b{display:block;font-family:var(--dis);font-size:16px;font-weight:600;color:var(--paper);
  margin-bottom:6px}
.spin{width:18px;height:18px;border:2px solid var(--edge);border-top-color:var(--sig);
  border-radius:50%;margin:0 auto 14px;animation:sp .7s linear infinite}
@keyframes sp{to{transform:rotate(360deg)}}

/* ── bot ── */
.fab{position:absolute;bottom:22px;right:22px;width:50px;height:50px;border-radius:16px;
  background:var(--sig);color:#fff;display:grid;place-items:center;z-index:40;
  box-shadow:0 8px 24px rgba(224,38,63,.32);transition:transform .15s}
.fab:hover{transform:translateY(-2px)}
.bot{position:absolute;bottom:22px;right:22px;width:352px;max-width:calc(100vw - 44px);
  background:var(--slab);border:1px solid var(--edge2);border-radius:16px;z-index:40;
  display:flex;flex-direction:column;overflow:hidden;box-shadow:0 20px 52px rgba(0,0,0,.42)}
.bh{display:flex;align-items:center;gap:10px;padding:13px 14px;border-bottom:1px solid var(--edge)}
.bav{width:32px;height:32px;border-radius:10px;background:var(--sig);color:#fff;
  display:grid;place-items:center;flex-shrink:0}
.bn{font-family:var(--dis);font-size:13.5px;font-weight:700;letter-spacing:-.01em}
.bs{font-size:11px;color:var(--mute);display:flex;align-items:center;gap:5px;margin-top:1px}
.live{width:5px;height:5px;border-radius:50%;background:var(--ok)}
.bmsg{height:280px;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px}
.bmsg::-webkit-scrollbar{width:6px}
.bmsg::-webkit-scrollbar-thumb{background:var(--edge);border-radius:3px}
.bub{max-width:88%;padding:10px 12px;border-radius:12px;font-size:12.5px;line-height:1.6}
.bub.bot{background:var(--rise);border-bottom-left-radius:4px;align-self:flex-start}
.bub.user{background:var(--sig);color:#fff;border-bottom-right-radius:4px;align-self:flex-end}
.li{display:flex;gap:8px;margin:5px 0}
.li i{color:var(--sig);font-style:normal;flex-shrink:0;font-weight:700}
.ms{font-size:10px;color:var(--faint);margin-top:8px;padding-top:7px;border-top:1px solid var(--edge)}
.dots span{display:inline-block;width:5px;height:5px;margin-right:3px;border-radius:50%;
  background:var(--mute);animation:bp 1.1s infinite}
.dots span:nth-child(2){animation-delay:.15s}
.dots span:nth-child(3){animation-delay:.3s}
@keyframes bp{0%,60%,100%{opacity:.3}30%{opacity:1}}
.seeds{display:flex;flex-wrap:wrap;gap:6px;padding:0 14px 12px}
.seed{padding:6px 11px;border:1px solid var(--edge2);border-radius:20px;font-size:11px;
  color:var(--mute);transition:border-color .12s,color .12s}
.seed:hover{border-color:var(--mute);color:var(--paper)}
.bin{display:flex;gap:7px;padding:11px 14px;border-top:1px solid var(--edge)}
.bin input{flex:1;background:var(--rise);border:1px solid var(--edge);border-radius:9px;
  padding:9px 11px;font:inherit;font-size:12.5px;color:var(--paper);outline:none;transition:border-color .15s}
.bin input:focus{border-color:var(--edge2)}
.bin input::placeholder{color:var(--faint)}
.bb{width:34px;height:34px;border-radius:9px;display:grid;place-items:center;flex-shrink:0}
.bb.mic{background:var(--rise);border:1px solid var(--edge);color:var(--mute)}
.bb.mic.on{background:var(--sig);border-color:var(--sig);color:#fff}
.bb.go{background:var(--sig);color:#fff}
.bb:disabled{opacity:.45;cursor:not-allowed}

@media(max-width:860px){
  .side{position:fixed;inset:0 auto 0 0;z-index:60;transform:translateX(-100%);
    transition:transform .22s ease;box-shadow:0 0 40px rgba(0,0,0,.4)}
  .side.open{transform:none}
  .veil{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:50}
  .two,.courses{grid-template-columns:1fr}
  .scroll{padding:18px 16px 32px}
  .bar{padding:0 16px}
  .find{max-width:none}
  .bot{width:calc(100vw - 32px);right:16px;bottom:16px}
  .fab{right:16px;bottom:16px}
  .met{min-width:50%;border-bottom:1px solid var(--edge)}
}
@media(min-width:861px){.burger{display:none}.veil{display:none}}
`

/* ─────────────────────────  helpers  ───────────────────────── */
const CLR = ['#E0263F', '#3D7DE0', '#2BB673', '#7C5CE0', '#D98B14']
const hue = (code = '') => CLR[[...code].reduce((a, c) => a + c.charCodeAt(0), 0) % CLR.length]
const d = (v) => v ? new Date(v + 'T00:00:00') : null
const today = () => { const t = new Date(); t.setHours(0, 0, 0, 0); return t }
const daysTo = (v) => { const x = d(v); return x ? Math.round((x - today()) / 864e5) : 9999 }
const human = (v) => {
  const n = daysTo(v)
  if (n < 0) return `${Math.abs(n)} ${Math.abs(n) === 1 ? 'day' : 'days'} overdue`
  if (n === 0) return 'Due today'
  if (n === 1) return 'Due tomorrow'
  if (n <= 7) return `Due in ${n} days`
  return d(v)?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) || ''
}
const short = (v) => d(v)?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) || '—'

function md(text) {
  if (!text) return null
  return text.split('\n').filter(l => l.trim()).map((line, i) => {
    const t = line.trim()
    const bullet = /^[-•*]\s/.test(t)
    const body = bullet ? t.replace(/^[-•*]\s+/, '') : t
    const parts = body.split(/(\*\*[^*]+\*\*)/g).filter(Boolean).map((p, j) =>
      p.startsWith('**') && p.endsWith('**')
        ? <strong key={j}>{p.slice(2, -2)}</strong>
        : <span key={j}>{p}</span>)
    return bullet
      ? <div className="li" key={i}><i>•</i><span>{parts}</span></div>
      : <div key={i} style={{ marginBottom: 4 }}>{parts}</div>
  })
}

const Panel = ({ title, more, children }) => (
  <section className="panel">
    <header className="ph"><h2 className="h2">{title}</h2>{more && <button className="more">{more}</button>}</header>
    <div className="pb">{children}</div>
  </section>
)

const Empty = ({ head, note }) => <div className="void"><b>{head}</b>{note}</div>

/* ─────────────────────────  pages  ───────────────────────── */
function Today({ data, go }) {
  const open = useMemo(() =>
    (data.assignments || [])
      .filter(a => ['due', 'pending'].includes(a.status))
      .sort((a, b) => daysTo(a.due_date) - daysTo(b.due_date)),
    [data.assignments])

  const quizzes = (data.quizzes || []).filter(q => q.status === 'upcoming')
  const avg = data.grades?.length
    ? Math.round(data.grades.reduce((s, g) => s + Number(g.percentage || 0), 0) / data.grades.length) : 0
  const gpa = data.grades?.length
    ? (data.grades.reduce((s, g) => s + ({ 'A+': 4, A: 4, 'B+': 3.3, B: 3, 'C+': 2.3, C: 2 }[g.letter_grade] ?? 3), 0)
      / data.grades.length).toFixed(1) : '—'

  const next = open.slice(0, 4)
  const now = new Date()

  return (
    <div className="page">
      <h1 className="h1">Good {now.getHours() < 12 ? 'morning' : now.getHours() < 17 ? 'afternoon' : 'evening'}, Sumedh</h1>
      <p className="sub">
        {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        {open.length ? ` — ${open.length} ${open.length === 1 ? 'task' : 'tasks'} still open` : ' — nothing outstanding'}
      </p>

      {next.length > 0 && (
        <div className="rail">
          {next.map((a, i) => (
            <div className={`stop${i === 0 ? ' hot' : ''}`} key={a.id}>
              <div className="when">{human(a.due_date)}</div>
              <div className="what">{a.title}</div>
              <div className="where">
                <span className="tag" style={{ background: hue(a.code) }} />
                {a.code} · {a.points} points
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="metrics">
        <div className="met"><div className="met-v">{data.courses?.length || 0}</div><div className="met-l">Courses enrolled</div></div>
        <div className="met"><div className="met-v">{avg}%</div><div className="met-l">Average grade</div></div>
        <div className="met"><div className="met-v">{gpa}</div><div className="met-l">Term GPA</div></div>
        <div className="met"><div className="met-v">{quizzes.length}</div><div className="met-l">Quizzes ahead</div></div>
      </div>

      <div className="two">
        <Panel title="Recently graded" more="All grades">
          {(data.assignments || []).filter(a => a.status === 'graded').slice(0, 4).map(a => (
            <div className="row" key={a.id}>
              <div className="row-m">
                <div className="row-t">{a.title}</div>
                <div className="row-s">{a.code}</div>
              </div>
              <span className="chip c-ok">{a.score}/{a.points}</span>
            </div>
          ))}
          {!(data.assignments || []).some(a => a.status === 'graded') &&
            <Empty head="Nothing graded yet" note="Scores appear here once instructors post them." />}
        </Panel>

        <Panel title="Announcements" more="See all">
          {(data.announcements || []).slice(0, 4).map(a => (
            <div className="row" key={a.id}>
              <div className="row-m">
                <div className="row-t">{a.title}</div>
                <div className="row-s">{String(a.body || '').slice(0, 84)}…</div>
              </div>
            </div>
          ))}
          {!(data.announcements || []).length && <Empty head="No announcements" note="Check back later." />}
        </Panel>
      </div>
    </div>
  )
}

function Courses({ courses }) {
  return (
    <div className="page">
      <h1 className="h1">Courses</h1>
      <p className="sub">{courses.length} enrolled this term</p>
      <div className="courses" style={{ marginTop: 22 }}>
        {courses.map(c => {
          const col = c.color || hue(c.code)
          return (
            <button className="cc" key={c.id}>
              <div className="cc-c" style={{ color: col }}>{c.code}</div>
              <div className="cc-n">{c.name}</div>
              <div className="cc-w">{c.instructor} · {c.schedule}</div>
              <div className="cc-p">
                <div className="trk"><div className="fil" style={{ width: `${c.progress}%`, background: col }} /></div>
                <span className="pct">{c.progress}%</span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function Assignments({ assignments }) {
  const chip = (a) => {
    if (a.status === 'graded') return <span className="chip c-info">{a.score}/{a.points}</span>
    if (a.status === 'submitted') return <span className="chip c-ok">Submitted</span>
    const n = daysTo(a.due_date)
    return <span className={`chip ${n <= 1 ? 'c-sig' : 'c-warn'}`}>{human(a.due_date)}</span>
  }
  return (
    <div className="page">
      <h1 className="h1">Assignments</h1>
      <p className="sub">{assignments.filter(a => ['due', 'pending'].includes(a.status)).length} open · {assignments.length} total</p>
      <div className="tw" style={{ marginTop: 22 }}>
        <table>
          <thead><tr><th>Assignment</th><th>Course</th><th>Due</th><th>Points</th><th>Status</th></tr></thead>
          <tbody>
            {assignments.map(a => (
              <tr key={a.id}>
                <td className="strong">{a.title}</td>
                <td style={{ color: 'var(--mute)' }}>{a.code}</td>
                <td>{short(a.due_date)}</td>
                <td>{a.points}</td>
                <td>{chip(a)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!assignments.length && <Empty head="No assignments" note="Nothing has been posted yet." />}
      </div>
    </div>
  )
}

function Quizzes({ quizzes }) {
  return (
    <div className="page">
      <h1 className="h1">Quizzes</h1>
      <p className="sub">{quizzes.filter(q => q.status === 'upcoming').length} scheduled ahead</p>
      <section className="panel" style={{ marginTop: 22 }}>
        <div className="pb" style={{ paddingTop: 8 }}>
          {quizzes.map(q => (
            <div className="row" key={q.id}>
              <span className="tag" style={{ background: hue(q.code), marginTop: 6, width: 8, height: 8 }} />
              <div className="row-m">
                <div className="row-t">{q.title}</div>
                <div className="row-s">{short(q.scheduled_date)} · {q.duration_mins} min · {q.code}</div>
              </div>
              <span className={`chip ${q.status === 'upcoming' ? 'c-plum' : 'c-ok'}`}>
                {q.status === 'upcoming' ? human(q.scheduled_date) : 'Complete'}
              </span>
            </div>
          ))}
          {!quizzes.length && <Empty head="No quizzes scheduled" note="Your instructors haven't posted any yet." />}
        </div>
      </section>
    </div>
  )
}

function Grades({ grades }) {
  const avg = grades.length
    ? Math.round(grades.reduce((s, g) => s + Number(g.percentage || 0), 0) / grades.length) : 0
  return (
    <div className="page">
      <h1 className="h1">Grades</h1>
      <p className="sub">Averaging {avg}% across {grades.length} courses</p>
      <section className="panel" style={{ marginTop: 22 }}>
        <div className="pb" style={{ paddingTop: 8 }}>
          {grades.map(g => {
            const col = g.color || hue(g.code)
            return (
              <div className="gr" key={g.id}>
                <div className="gr-m">
                  <div className="gr-n">{g.name}</div>
                  <div className="gr-c">{g.code}</div>
                </div>
                <div className="gr-b"><div className="fil" style={{ width: `${g.percentage}%`, background: col }} /></div>
                <div className="gr-v" style={{ color: col }}>{g.percentage}%</div>
                <div className="gr-l" style={{ background: `${col}1f`, color: col }}>{g.letter_grade}</div>
              </div>
            )
          })}
          {!grades.length && <Empty head="No grades posted" note="Results appear once your work is marked." />}
        </div>
      </section>
    </div>
  )
}

function Discussions({ discussions }) {
  return (
    <div className="page">
      <h1 className="h1">Discussions</h1>
      <p className="sub">{discussions.length} active threads</p>
      <section className="panel" style={{ marginTop: 22 }}>
        <div className="pb" style={{ paddingTop: 8 }}>
          {discussions.map(t => (
            <article className="dc" key={t.id}>
              <div className="dc-h">
                <span className="dc-a">{t.author_initials}</span>
                <span className="dc-n">{t.author_name}</span>
                <span className="dc-t">{short(String(t.posted_at || '').slice(0, 10))}</span>
              </div>
              <p className="dc-b">{t.body}</p>
              <button className="dc-r">{t.reply_count} replies</button>
            </article>
          ))}
          {!discussions.length && <Empty head="No discussions yet" note="Start a thread to get the conversation going." />}
        </div>
      </section>
    </div>
  )
}

function Announcements({ announcements }) {
  return (
    <div className="page">
      <h1 className="h1">Announcements</h1>
      <p className="sub">{announcements.length} posts</p>
      <section className="panel" style={{ marginTop: 22 }}>
        <div className="pb" style={{ paddingTop: 8 }}>
          {announcements.map(a => (
            <article className="row" key={a.id} style={{ flexDirection: 'column', gap: 5 }}>
              <div className="dc-t" style={{ marginLeft: 0 }}>{short(String(a.posted_at || '').slice(0, 10))}</div>
              <div className="row-t">{a.title}</div>
              <div className="row-s" style={{ marginTop: 0 }}>{a.body}</div>
            </article>
          ))}
          {!announcements.length && <Empty head="Nothing posted" note="Announcements from your courses show up here." />}
        </div>
      </section>
    </div>
  )
}

function CalendarPage({ events }) {
  const t = today()
  const [m, setM] = useState(t.getMonth())
  const [y, setY] = useState(t.getFullYear())
  const marks = useMemo(() => new Set(
    events.filter(e => { const x = d(e.event_date); return x && x.getMonth() === m && x.getFullYear() === y })
      .map(e => d(e.event_date).getDate())), [events, m, y])
  const lead = new Date(y, m, 1).getDay()
  const span = new Date(y, m + 1, 0).getDate()
  const prev = new Date(y, m, 0).getDate()
  const step = (n) => { const nx = new Date(y, m + n, 1); setM(nx.getMonth()); setY(nx.getFullYear()) }

  const soon = [...events].sort((a, b) => daysTo(a.event_date) - daysTo(b.event_date))
    .filter(e => daysTo(e.event_date) >= 0).slice(0, 6)

  return (
    <div className="page">
      <h1 className="h1">Calendar</h1>
      <p className="sub">Deadlines, quizzes and campus events</p>
      <div className="two" style={{ marginTop: 22 }}>
        <section className="panel">
          <div className="pb" style={{ padding: 16 }}>
            <div className="cnav">
              <button className="cbtn" onClick={() => step(-1)} aria-label="Previous month">‹</button>
              <span className="h2">{new Date(y, m).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
              <button className="cbtn" onClick={() => step(1)} aria-label="Next month">›</button>
            </div>
            <div className="cg">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((x, i) => <div className="cd-h" key={i}>{x}</div>)}
              {Array.from({ length: lead }, (_, i) =>
                <div className="cd off" key={`p${i}`}>{prev - lead + 1 + i}</div>)}
              {Array.from({ length: span }, (_, i) => {
                const n = i + 1
                const isNow = n === t.getDate() && m === t.getMonth() && y === t.getFullYear()
                return <div className={`cd${isNow ? ' now' : ''}${marks.has(n) ? ' has' : ''}`} key={n}>{n}</div>
              })}
            </div>
          </div>
        </section>

        <Panel title="Coming up">
          {soon.map(e => (
            <div className="row" key={e.id}>
              <span className="tag" style={{ background: e.color || hue(e.code), marginTop: 6 }} />
              <div className="row-m">
                <div className="row-t">{e.title}</div>
                <div className="row-s">{short(e.event_date)} · {e.code || 'Campus'}</div>
              </div>
              <span className="chip c-info">{human(e.event_date).replace('Due ', '')}</span>
            </div>
          ))}
          {!soon.length && <Empty head="Nothing scheduled" note="Your calendar is clear." />}
        </Panel>
      </div>
    </div>
  )
}

/* ─────────────────────────  bot  ───────────────────────── */
const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function Bot() {
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState([{ role: 'bot', text: "Ask me about your deadlines, grades, instructors or anything on your portal." }])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [hearing, setHearing] = useState(false)
  const [talking, setTalking] = useState(false)
  const feed = useRef(null), rec = useRef(null), snd = useRef(null)

  useEffect(() => { if (feed.current) feed.current.scrollTop = feed.current.scrollHeight }, [msgs])

  async function say(text) {
    try {
      setTalking(true)
      const r = await fetch(`${API}/api/tts/speak`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.replace(/[*_#`]/g, '').replace(/\n/g, ' ') })
      })
      if (!r.ok) return setTalking(false)
      const url = URL.createObjectURL(await r.blob())
      const a = new Audio(url); snd.current = a
      a.onended = a.onerror = () => { setTalking(false); URL.revokeObjectURL(url); snd.current = null }
      await a.play()
    } catch { setTalking(false) }
  }

  function hush() {
    if (snd.current) { snd.current.pause(); snd.current = null }
    setTalking(false)
  }

  async function listen() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      const bits = []
      setHearing(true)
      mr.ondataavailable = e => bits.push(e.data)
      mr.onstop = async () => {
        setHearing(false)
        stream.getTracks().forEach(t => t.stop())
        const fd = new FormData()
        fd.append('audio', new Blob(bits, { type: 'audio/webm' }), 'clip.webm')
        try {
          const r = await fetch(`${API}/api/stt/transcribe`, { method: 'POST', body: fd })
          const j = await r.json()
          if (j.transcript) { setInput(j.transcript); setTimeout(() => send(j.transcript), 200) }
        } catch { /* silent */ }
      }
      mr.start()
      setTimeout(() => mr.state === 'recording' && mr.stop(), 8000)
      rec.current = mr
    } catch { setHearing(false) }
  }

  const quiet = () => { if (rec.current?.state === 'recording') rec.current.stop(); setHearing(false) }

  async function send(seed) {
    const q = (seed ?? input).trim()
    if (!q || busy) return
    setInput(''); hush()
    setMsgs(m => [...m, { role: 'user', text: q }, { role: 'bot', text: '', pending: true }])
    setBusy(true)
    const t0 = performance.now()
    let first = null
    try {
      let all = ''
      for await (const bit of streamChat(q)) {
        if (first === null) first = Math.round(performance.now() - t0)
        all += bit
        setMsgs(m => m.map((x, i) => i === m.length - 1 ? { ...x, text: all, pending: false } : x))
      }
      const total = Math.round(performance.now() - t0)
      setMsgs(m => m.map((x, i) => i === m.length - 1
        ? { ...x, pending: false, meta: `${first}ms to first word · ${total}ms total` } : x))
      say(all)
    } catch {
      const total = Math.round(performance.now() - t0)
      setMsgs(m => m.map((x, i) => i === m.length - 1
        ? { role: 'bot', text: `Couldn't reach the server after ${(total / 1000).toFixed(1)}s. It may be waking up — try again.` } : x))
    }
    setBusy(false)
  }

  if (!open) return (
    <button className="fab" onClick={() => setOpen(true)} aria-label="Open assistant">
      <Ico d={I.chat} s={21} />
    </button>
  )

  return (
    <div className="bot" role="dialog" aria-label="LearnBot assistant">
      <header className="bh">
        <div className="bav"><Ico d={I.chat} s={16} /></div>
        <div style={{ flex: 1 }}>
          <div className="bn">LearnBot</div>
          <div className="bs"><span className="live" />{talking ? 'Speaking' : busy ? 'Thinking' : 'Ready'}</div>
        </div>
        {talking && <button className="seed" onClick={hush}>Stop</button>}
        <button className="icb" onClick={() => { setOpen(false); hush() }} aria-label="Close"><Ico d={I.x} s={17} /></button>
      </header>

      <div className="bmsg" ref={feed}>
        {msgs.map((m, i) => (
          <div className={`bub ${m.role}`} key={i}>
            {m.pending
              ? <span className="dots"><span /><span /><span /></span>
              : m.role === 'bot' ? md(m.text) : m.text}
            {m.meta && <div className="ms">{m.meta}</div>}
          </div>
        ))}
      </div>

      {msgs.length <= 1 && (
        <div className="seeds">
          {["What's due next?", 'My grades', 'Who teaches Cloud?', 'Upcoming quizzes'].map(s =>
            <button className="seed" key={s} onClick={() => send(s)}>{s}</button>)}
        </div>
      )}

      <div className="bin">
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder={hearing ? 'Listening…' : 'Ask about your courses'} />
        <button className={`bb mic${hearing ? ' on' : ''}`} onClick={hearing ? quiet : listen}
          aria-label={hearing ? 'Stop recording' : 'Speak'}><Ico d={I.mic} s={15} /></button>
        <button className="bb go" onClick={() => send()} disabled={busy || !input.trim()}
          aria-label="Send"><Ico d={I.send} s={15} /></button>
      </div>
    </div>
  )
}

/* ─────────────────────────  app  ───────────────────────── */
export default function App() {
  const [page, setPage] = useState('dashboard')
  const [dark, setDark] = useState(true)
  const [menu, setMenu] = useState(false)
  const [data, setData] = useState({ assignments: [], grades: [], courses: [], quizzes: [], announcements: [], discussions: [], events: [] })
  const [state, setState] = useState('loading')

  useEffect(() => { document.body.className = dark ? 'dark' : 'light' }, [dark])

  useEffect(() => {
    let done = false
    const slow = setTimeout(() => !done && setState(s => s === 'loading' ? 'slow' : s), 6000)
    Promise.all([fetchAssignments(), fetchGrades(), fetchCourses(), fetchQuizzes(),
    fetchAnnouncements(), fetchDiscussions(), fetchCalendar()])
      .then(([assignments, grades, courses, quizzes, announcements, discussions, events]) => {
        done = true; clearTimeout(slow)
        setData({ assignments, grades, courses, quizzes, announcements, discussions, events })
        setState('ready')
      })
      .catch(() => { done = true; clearTimeout(slow); setState('error') })
    return () => clearTimeout(slow)
  }, [])

  const pending = data.assignments.filter(a => ['due', 'pending'].includes(a.status)).length
  const sections = [...new Set(NAV.map(n => n.sec))]

  const body = () => {
    if (state === 'error') return (
      <div className="page"><Empty head="Can't reach the server"
        note="The backend may be asleep — reload in a moment and it should wake up." /></div>
    )
    if (state !== 'ready') return (
      <div className="page"><div className="void"><div className="spin" />
        <b>{state === 'slow' ? 'Still connecting' : 'Loading your term'}</b>
        {state === 'slow' ? 'The server sleeps when idle. First load takes about a minute.' : 'One moment.'}
      </div></div>
    )
    switch (page) {
      case 'courses': return <Courses courses={data.courses} />
      case 'assignments': return <Assignments assignments={data.assignments} />
      case 'quizzes': return <Quizzes quizzes={data.quizzes} />
      case 'grades': return <Grades grades={data.grades} />
      case 'discussions': return <Discussions discussions={data.discussions} />
      case 'announcements': return <Announcements announcements={data.announcements} />
      case 'calendar': return <CalendarPage events={data.events} />
      default: return <Today data={data} go={setPage} />
    }
  }

  return (
    <>
      <style>{css}</style>
      <div className="shell">
        {menu && <div className="veil" onClick={() => setMenu(false)} />}

        <aside className={`side${menu ? ' open' : ''}`}>
          <div className="brand">
            <div className="mark">L</div>
            <span className="brand-name">LearnSpace</span>
          </div>

          <div className="who">
            <div className="who-av">SM</div>
            <div style={{ minWidth: 0 }}>
              <div className="who-n">Sumedh Mahajan</div>
              <div className="who-p">Cloud &amp; AI Engineering</div>
            </div>
          </div>

          <nav className="nav">
            {sections.map(sec => (
              <div key={sec || 'top'}>
                {sec && <div className="sec">{sec}</div>}
                {NAV.filter(n => n.sec === sec).map(n => (
                  <button key={n.id} className="nl"
                    aria-current={page === n.id ? 'page' : undefined}
                    onClick={() => { setPage(n.id); setMenu(false) }}>
                    <Ico d={n.icon} />
                    {n.label}
                    {n.count === 'pending' && pending > 0 && <span className="pill">{pending}</span>}
                  </button>
                ))}
              </div>
            ))}
          </nav>
        </aside>

        <div className="main">
          <header className="bar">
            <button className="icb burger" onClick={() => setMenu(true)} aria-label="Menu">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M3 6h18M3 12h18M3 18h18" /></svg>
            </button>
            <label className="find">
              <Ico d={I.search} s={14} />
              <input placeholder="Search courses, assignments…" />
            </label>
            <div className="bar-sp" />
            <button className="icb" onClick={() => setDark(v => !v)}
              aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}>
              <Ico d={dark ? I.sun : I.moon} s={17} />
            </button>
            <button className="icb dot" aria-label="Notifications"><Ico d={I.bell} s={17} /></button>
            <div className="me">SM</div>
          </header>

          <div className="scroll">{body()}</div>
          <Bot />
        </div>
      </div>
    </>
  )
}
