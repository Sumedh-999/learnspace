export default function Discussions() {
  const posts = [
    {initials:'SP',name:'Sarah P.',time:'2h ago',text:'Has anyone figured out the RAG pipeline architecture for the final project? Confused about chunking strategy vs embedding model tradeoffs.',replies:4},
    {initials:'MK',name:'Mike K.',time:'5h ago',text:'For CLOD-3100 Lab 4 — do we use Terraform or CloudFormation? Prof. Singh wasn\'t clear in the slides.',replies:7},
    {initials:'RG',name:'Riya G.',time:'Yesterday',text:'Study group for the AIML midterm this Sunday at 2pm in the library? Room LIB-220. Let me know if you\'re in!',replies:12},
    {initials:'TA',name:'TA — Dr. Patel',time:'2 days ago',text:'Reminder: Office hours this week are moved to Thursday 3–5pm. Assignment 3 questions welcome.',replies:2},
  ]
  return (
    <div className="page">
      <div className="page-header"><h1 className="page-title">Discussions</h1><p className="page-sub">5 new replies</p></div>
      <div className="card">
        {posts.map((p,i) => (
          <div key={i} className="disc-item">
            <div className="disc-header">
              <div className="disc-avatar">{p.initials}</div>
              <div style={{fontWeight:500,fontSize:'13px'}}>{p.name}</div>
              <div style={{marginLeft:'auto',fontSize:'11px',color:'var(--text3)'}}>{p.time}</div>
            </div>
            <div style={{fontSize:'13px',color:'var(--text2)',marginLeft:'34px',lineHeight:'1.5',marginTop:'4px'}}>{p.text}</div>
            <div style={{fontSize:'12px',color:'#c8102e',marginLeft:'34px',marginTop:'6px',cursor:'pointer'}}>{p.replies} replies · Join discussion</div>
          </div>
        ))}
      </div>
    </div>
  )
}
