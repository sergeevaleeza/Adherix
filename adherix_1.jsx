import { useState, useEffect } from "react";

/* ─── CONSTANTS ───────────────────────────────────────────── */
const TODAY = "2026-05-25";
const todayDate = new Date(TODAY);

function daysDiff(s) { return Math.round((new Date(s) - todayDate) / 86400000); }

function getStatus(p) {
  if (p.consecutiveMissed >= 2) return "high-risk";
  const d = daysDiff(p.nextDue);
  if (d < 0)  return "overdue";
  if (d === 0) return "due-today";
  if (d <= 4)  return "due-soon";
  return "on-track";
}

function lastOutreach(events) {
  const arr = events.filter(e => e.type === "outreach").sort((a,b) => b.date.localeCompare(a.date));
  return arr[0] || null;
}

function needsOutreach(p) {
  return ["overdue","high-risk","due-today","due-soon"].includes(getStatus(p));
}

async function askClaude(prompt) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:800, messages:[{role:"user",content:prompt}] })
  });
  const d = await res.json();
  return d.content?.[0]?.text ?? "Failed to generate.";
}

/* ─── DESIGN TOKENS ───────────────────────────────────────── */
const T = {
  bg:"#06091b", surf:"#0b1126", card:"#101829", hover:"#15203a",
  border:"#1b2d4f", borderD:"#131f38",
  acc:"#38bdf8", text:"#e1e9f4", muted:"#8fa3c0", dim:"#3d5270",
  SANS:`-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif`,
  MONO:`'SF Mono', 'Fira Code', Menlo, monospace`,
};

const STATUS_CFG = {
  "on-track":  { label:"On Track",  col:"#10b981" },
  "due-soon":  { label:"Due Soon",  col:"#f59e0b" },
  "due-today": { label:"Due Today", col:"#f97316" },
  "overdue":   { label:"Overdue",   col:"#ef4444" },
  "high-risk": { label:"High Risk", col:"#dc2626" },
};

const TREAT_INFO = {
  "Ketamine":         { freq:"2–3× / week",  freqDays:4,  cat:"Ketamine",      col:"#8b5cf6" },
  "Vivitrol":         { freq:"Monthly",       freqDays:30, cat:"Addiction",     col:"#06b6d4" },
  "Sublocade":        { freq:"Monthly",       freqDays:30, cat:"Addiction",     col:"#06b6d4" },
  "Invega Sustenna":  { freq:"Monthly",       freqDays:30, cat:"Schizophrenia", col:"#a78bfa" },
  "Invega Trinza":    { freq:"Every 3 mos",   freqDays:90, cat:"Schizophrenia", col:"#a78bfa" },
  "Abilify Maintena": { freq:"Monthly",       freqDays:30, cat:"Schizophrenia", col:"#a78bfa" },
};

/* ─── MOCK DATA ───────────────────────────────────────────── */
const INIT_PATIENTS = [
  { id:"PF-10294", name:"Jane D.",   dob:"1985-03-22", diagnosis:"OUD",           treatment:"Vivitrol",        provider:"Dr. Levinson", lastTreatment:"2026-04-22", nextDue:"2026-05-15", consecutiveMissed:1,
    events:[
      {date:"2026-03-24",type:"completed",note:"Vivitrol injection administered. Patient tolerated well."},
      {date:"2026-04-22",type:"completed",note:"Monthly Vivitrol injection completed."},
      {date:"2026-05-15",type:"missed",note:"Patient did not arrive for scheduled appointment."},
      {date:"2026-05-16",type:"outreach",method:"Voicemail",note:"Voicemail left requesting callback to reschedule."},
      {date:"2026-05-20",type:"outreach",method:"Text",note:"Text sent with rescheduling information."},
    ]},
  { id:"PF-10318", name:"Mark R.",   dob:"1978-11-05", diagnosis:"Schizophrenia", treatment:"Invega Sustenna", provider:"Dr. Levinson", lastTreatment:"2026-04-26", nextDue:"2026-05-26", consecutiveMissed:0,
    events:[
      {date:"2026-02-24",type:"completed",note:"Invega Sustenna 156mg IM given."},
      {date:"2026-03-26",type:"completed",note:"Monthly injection administered without issue."},
      {date:"2026-04-26",type:"completed",note:"Invega Sustenna administered. Provider visit completed."},
    ]},
  { id:"PF-10301", name:"Sarah P.",  dob:"1993-07-14", diagnosis:"Depression",    treatment:"Ketamine",        provider:"Dr. Patel",    lastTreatment:"2026-05-19", nextDue:"2026-05-28", consecutiveMissed:0,
    events:[
      {date:"2026-05-12",type:"completed",note:"Ketamine infusion session 1 of 6. No adverse events."},
      {date:"2026-05-14",type:"completed",note:"Session 2 of 6. Patient reported mild dissociation, resolved."},
      {date:"2026-05-16",type:"missed",note:"Patient called to cancel session 3."},
      {date:"2026-05-16",type:"outreach",method:"Call",note:"Spoke with patient. Session rescheduled for 5/19."},
      {date:"2026-05-19",type:"completed",note:"Session 3 of 6 completed. Patient on track."},
    ]},
  { id:"PF-10355", name:"Tom W.",    dob:"1969-04-30", diagnosis:"AUD",           treatment:"Vivitrol",        provider:"Dr. Levinson", lastTreatment:"2026-05-02", nextDue:"2026-06-01", consecutiveMissed:0,
    events:[
      {date:"2026-03-03",type:"completed",note:"Vivitrol injection. Patient reports 30 days sobriety."},
      {date:"2026-04-02",type:"completed",note:"Monthly injection. Reports 60 days sobriety."},
      {date:"2026-05-02",type:"completed",note:"Injection administered. Patient continues to do well."},
    ]},
  { id:"PF-10377", name:"Rosa M.",   dob:"1990-01-18", diagnosis:"Schizophrenia", treatment:"Invega Trinza",   provider:"Dr. Levinson", lastTreatment:"2026-02-24", nextDue:"2026-05-27", consecutiveMissed:0,
    events:[
      {date:"2025-11-24",type:"completed",note:"Invega Trinza 546mg administered."},
      {date:"2026-02-24",type:"completed",note:"Quarterly injection completed without issues."},
    ]},
  { id:"PF-10388", name:"Alex K.",   dob:"1996-09-03", diagnosis:"OUD",           treatment:"Sublocade",       provider:"Dr. Patel",    lastTreatment:"2026-04-18", nextDue:"2026-05-20", consecutiveMissed:1,
    events:[
      {date:"2026-03-19",type:"completed",note:"Sublocade 300mg SQ injection administered."},
      {date:"2026-04-18",type:"completed",note:"Monthly Sublocade injection. Patient stable."},
      {date:"2026-05-20",type:"missed",note:"No-show. No prior cancellation notice."},
      {date:"2026-05-21",type:"outreach",method:"Voicemail",note:"Called patient. No answer. Voicemail left."},
    ]},
  { id:"PF-10402", name:"David L.",  dob:"1972-06-11", diagnosis:"Schizophrenia", treatment:"Abilify Maintena",provider:"Dr. Levinson", lastTreatment:"2026-04-29", nextDue:"2026-05-29", consecutiveMissed:0,
    events:[
      {date:"2026-02-27",type:"completed",note:"Abilify Maintena 400mg IM administered."},
      {date:"2026-03-28",type:"completed",note:"Monthly injection. Provider reviewed symptoms — stable."},
      {date:"2026-04-29",type:"completed",note:"Injection administered. No reported side effects."},
    ]},
  { id:"PF-10419", name:"Carlos R.", dob:"1981-12-25", diagnosis:"AUD",           treatment:"Vivitrol",        provider:"Dr. Patel",    lastTreatment:"2026-03-28", nextDue:"2026-04-28", consecutiveMissed:2,
    events:[
      {date:"2026-02-26",type:"completed",note:"Vivitrol administered. Patient was late but arrived."},
      {date:"2026-03-28",type:"completed",note:"Monthly injection. Provider expressed concern about engagement."},
      {date:"2026-04-28",type:"missed",note:"No-show. First missed appointment."},
      {date:"2026-04-29",type:"outreach",method:"Voicemail",note:"No answer. Left voicemail."},
      {date:"2026-05-05",type:"outreach",method:"Text",note:"Text sent with rescheduling information."},
      {date:"2026-05-23",type:"missed",note:"Rescheduled appointment also missed. Second consecutive no-show."},
      {date:"2026-05-24",type:"provider_notified",note:"Provider notified of two consecutive missed appointments. Care plan review recommended."},
    ]},
  { id:"PF-10437", name:"Lisa N.",   dob:"2000-05-07", diagnosis:"Schizophrenia", treatment:"Invega Sustenna", provider:"Dr. Levinson", lastTreatment:"2026-04-30", nextDue:"2026-05-30", consecutiveMissed:0,
    events:[
      {date:"2026-02-28",type:"completed",note:"Invega Sustenna 117mg IM. Appointment was on time."},
      {date:"2026-03-30",type:"completed",note:"Monthly injection administered."},
      {date:"2026-04-30",type:"completed",note:"Injection given. Patient reports feeling well."},
    ]},
  { id:"PF-10445", name:"Emma B.",   dob:"1988-08-15", diagnosis:"Depression",    treatment:"Ketamine",        provider:"Dr. Patel",    lastTreatment:"2026-05-21", nextDue:"2026-06-04", consecutiveMissed:0,
    events:[
      {date:"2026-05-13",type:"completed",note:"Ketamine infusion session 1 of 6."},
      {date:"2026-05-15",type:"completed",note:"Session 2 of 6. Patient tolerating well."},
      {date:"2026-05-17",type:"completed",note:"Session 3 of 6."},
      {date:"2026-05-19",type:"completed",note:"Session 4 of 6."},
      {date:"2026-05-21",type:"completed",note:"Session 5 of 6. Patient reports significant mood improvement."},
    ]},
];

/* ─── SMALL COMPONENTS ───────────────────────────────────── */
const ini = name => name.split(" ").map(n=>n[0]).join("");

const StatusBadge = ({ status, lg }) => {
  const s = STATUS_CFG[status];
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:5, background:`${s.col}15`, color:s.col, border:`1px solid ${s.col}30`, borderRadius:20, padding:lg?"5px 13px":"2px 9px", fontSize:lg?13:11, fontWeight:700, fontFamily:T.MONO, whiteSpace:"nowrap" }}>
      <span style={{ width:5, height:5, borderRadius:"50%", background:s.col, flexShrink:0 }} />{s.label}
    </span>
  );
};

const TreatTag = ({ t }) => {
  const info = TREAT_INFO[t] || { col:T.acc };
  return <span style={{ display:"inline-block", background:`${info.col}15`, color:info.col, border:`1px solid ${info.col}30`, borderRadius:6, padding:"2px 8px", fontSize:11, fontWeight:600, whiteSpace:"nowrap" }}>{t}</span>;
};

const Btn = ({ children, onClick, v="pri", st, disabled }) => {
  const vs = {
    pri:   { background:T.acc,  color:T.bg,   border:"none",              fontWeight:700 },
    out:   { background:"transparent", color:T.text, border:`1px solid ${T.border}` },
    ghost: { background:"transparent", color:T.muted, border:"none" },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{ ...vs[v], padding:"7px 14px", borderRadius:8, cursor:disabled?"not-allowed":"pointer", fontSize:12, fontFamily:T.SANS, display:"inline-flex", alignItems:"center", gap:5, opacity:disabled?0.5:1, ...(st||{}) }}>{children}</button>
  );
};

const Nav = ({ icon, label, active, onClick, badge }) => (
  <button onClick={onClick} style={{ display:"flex", alignItems:"center", gap:9, width:"100%", padding:"10px 20px", border:"none", borderLeft:`2px solid ${active?T.acc:"transparent"}`, background:active?`${T.acc}12`:"transparent", color:active?T.acc:T.muted, cursor:"pointer", fontSize:13, fontWeight:active?600:400, fontFamily:T.SANS, textAlign:"left", transition:"all 0.1s" }}>
    <span style={{ fontSize:13 }}>{icon}</span>
    <span style={{ flex:1 }}>{label}</span>
    {badge>0 && <span style={{ background:"#ef4444", color:"#fff", borderRadius:10, padding:"1px 7px", fontSize:10, fontWeight:700 }}>{badge}</span>}
  </button>
);

const EvIcon = ({ type }) => {
  const cfg = { completed:{bg:"#10b98115",col:"#10b981",sym:"✓"}, missed:{bg:"#ef444415",col:"#ef4444",sym:"✗"}, outreach:{bg:"#38bdf815",col:"#38bdf8",sym:"↗"}, provider_notified:{bg:"#f59e0b15",col:"#f59e0b",sym:"!"} };
  const c = cfg[type] || cfg.outreach;
  return <div style={{ width:24,height:24,borderRadius:"50%",background:c.bg,border:`1px solid ${c.col}40`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:c.col,fontWeight:700,flexShrink:0 }}>{c.sym}</div>;
};

/* ─── DASHBOARD ──────────────────────────────────────────── */
const Dashboard = ({ patients, onSelect, setView }) => {
  const today  = patients.filter(p => getStatus(p)==="due-today");
  const week   = patients.filter(p => { const d=daysDiff(p.nextDue); return d>0&&d<=7&&p.consecutiveMissed<2; });
  const over   = patients.filter(p => getStatus(p)==="overdue");
  const hiRisk = patients.filter(p => getStatus(p)==="high-risk");
  const queue  = patients.filter(needsOutreach);

  const Section = ({ title, list, color, empty }) => (
    <div style={{ background:T.card, borderRadius:12, border:`1px solid ${T.borderD}`, padding:18, flex:1, minWidth:0 }}>
      <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:12, display:"flex", alignItems:"center", gap:8 }}>
        <span style={{ color }}>●</span> {title}
        <span style={{ marginLeft:"auto", fontFamily:T.MONO, fontSize:12, color }}>{list.length}</span>
      </div>
      {list.length===0
        ? <div style={{ fontSize:12, color:T.muted }}>{empty}</div>
        : list.map(p => (
          <div key={p.id} onClick={()=>onSelect(p.id)} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"9px 10px", borderRadius:8, cursor:"pointer", marginBottom:3, transition:"background 0.1s" }}
            onMouseEnter={e=>e.currentTarget.style.background=T.hover} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            <div style={{ display:"flex", alignItems:"center", gap:9 }}>
              <div style={{ width:26,height:26,borderRadius:"50%",background:`${T.acc}1a`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,color:T.acc,flexShrink:0 }}>{ini(p.name)}</div>
              <div>
                <div style={{ fontSize:12, fontWeight:600, color:T.text }}>{p.name}</div>
                <div style={{ fontSize:10, color:T.muted }}>{p.treatment} · {TREAT_INFO[p.treatment]?.freq}</div>
              </div>
            </div>
            <StatusBadge status={getStatus(p)} />
          </div>
        ))
      }
    </div>
  );

  return (
    <div style={{ padding:"24px 28px", height:"100%", overflowY:"auto" }}>
      <div style={{ marginBottom:18 }}>
        <h1 style={{ fontSize:21, fontWeight:700, color:T.text, margin:0 }}>Morning Dashboard</h1>
        <p style={{ fontSize:12, color:T.muted, margin:"4px 0 0" }}>Monday, May 25, 2026 · {patients.length} patients tracked</p>
      </div>

      <div style={{ display:"flex", gap:10, marginBottom:18, flexWrap:"wrap" }}>
        {[
          { label:"Due Today",     val:today.length,  col:"#f97316", sub:"Need treatment today" },
          { label:"Due This Week", val:week.length,   col:"#f59e0b", sub:"Upcoming appointments" },
          { label:"Overdue",       val:over.length,   col:"#ef4444", sub:"Past due date" },
          { label:"High Risk",     val:hiRisk.length, col:"#dc2626", sub:"2+ consecutive misses" },
          { label:"Needs Outreach",val:queue.length,  col:T.acc,     sub:"Click to view queue", click:()=>setView("queue") },
        ].map(s => (
          <div key={s.label} onClick={s.click} style={{ background:T.card, borderRadius:12, border:`1px solid ${T.borderD}`, padding:"15px 18px", flex:1, minWidth:0, cursor:s.click?"pointer":"default", transition:"border-color 0.1s" }}
            onMouseEnter={e=>s.click&&(e.currentTarget.style.borderColor=T.border)} onMouseLeave={e=>s.click&&(e.currentTarget.style.borderColor=T.borderD)}>
            <div style={{ fontSize:10, color:T.muted, letterSpacing:"0.09em", textTransform:"uppercase", marginBottom:6 }}>{s.label}</div>
            <div style={{ fontSize:28, fontWeight:700, color:s.col, fontFamily:T.MONO, lineHeight:1 }}>{s.val}</div>
            <div style={{ fontSize:10, color:T.muted, marginTop:4 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 }}>
        <Section title="Due Today"     list={today}  color="#f97316" empty="No treatments due today." />
        <Section title="Due This Week" list={week}   color="#f59e0b" empty="No upcoming treatments." />
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
        <Section title="Overdue"       list={over}   color="#ef4444" empty="No overdue patients." />
        <Section title="High Risk"     list={hiRisk} color="#dc2626" empty="No high-risk patients." />
      </div>
    </div>
  );
};

/* ─── ROSTER ─────────────────────────────────────────────── */
const Roster = ({ patients, onSelect, onAdd, search, setSearch }) => {
  const filtered = patients.filter(p => [p.name,p.treatment,p.diagnosis,p.provider].some(s=>s.toLowerCase().includes(search.toLowerCase())));
  const cols = "1.8fr 0.9fr 1.1fr 0.9fr 1fr 1fr 60px";
  return (
    <div style={{ padding:"24px 28px", height:"100%", overflowY:"auto" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
        <div>
          <h1 style={{ fontSize:21, fontWeight:700, color:T.text, margin:0 }}>Patient Roster</h1>
          <p style={{ fontSize:12, color:T.muted, margin:"4px 0 0" }}>{patients.length} patients enrolled</p>
        </div>
        <Btn onClick={onAdd}>+ Add Patient</Btn>
      </div>
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name, treatment, diagnosis, provider…"
        style={{ width:"100%", boxSizing:"border-box", padding:"9px 13px", marginBottom:13, background:T.card, border:`1px solid ${T.border}`, borderRadius:8, color:T.text, fontFamily:T.SANS, fontSize:13, outline:"none" }} />
      <div style={{ display:"grid", gridTemplateColumns:cols, padding:"6px 14px", fontSize:10, color:T.dim, textTransform:"uppercase", letterSpacing:"0.09em", borderBottom:`1px solid ${T.borderD}` }}>
        {["Patient","Diagnosis","Treatment","Schedule","Next Due","Status",""].map(h=><span key={h}>{h}</span>)}
      </div>
      {filtered.map(p => {
        const d = daysDiff(p.nextDue);
        return (
          <div key={p.id} onClick={()=>onSelect(p.id)} style={{ display:"grid", gridTemplateColumns:cols, padding:"11px 14px", alignItems:"center", borderBottom:`1px solid ${T.borderD}20`, cursor:"pointer", transition:"background 0.1s" }}
            onMouseEnter={e=>e.currentTarget.style.background=T.hover} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            <div style={{ display:"flex", alignItems:"center", gap:9 }}>
              <div style={{ width:28,height:28,borderRadius:"50%",background:`${T.acc}1a`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:T.acc,flexShrink:0 }}>{ini(p.name)}</div>
              <div>
                <div style={{ fontSize:12, fontWeight:600, color:T.text }}>{p.name}</div>
                <div style={{ fontSize:10, color:T.muted, fontFamily:T.MONO }}>{p.id}</div>
              </div>
            </div>
            <div style={{ fontSize:11, color:T.muted }}>{p.diagnosis}</div>
            <TreatTag t={p.treatment} />
            <div style={{ fontSize:11, color:T.muted }}>{TREAT_INFO[p.treatment]?.freq}</div>
            <div style={{ fontFamily:T.MONO, fontSize:11, color:d<0?"#ef4444":d<=4?"#f59e0b":T.muted }}>
              {d<0?`${Math.abs(d)}d ago`:d===0?"Today":`In ${d}d`}
            </div>
            <StatusBadge status={getStatus(p)} />
            <span style={{ fontSize:11, color:T.acc }}>View →</span>
          </div>
        );
      })}
      {filtered.length===0 && <div style={{ textAlign:"center", padding:48, color:T.muted, fontSize:13 }}>No patients found</div>}
    </div>
  );
};

/* ─── PATIENT DETAIL ─────────────────────────────────────── */
const PatientDetail = ({ patient, onBack, onLogEvent }) => {
  const [aiModal, setAiModal] = useState(null);
  const status = getStatus(patient);
  const d = daysDiff(patient.nextDue);
  const info = TREAT_INFO[patient.treatment] || {};
  const sortedEvs = [...patient.events].sort((a,b)=>b.date.localeCompare(a.date));

  async function runAI(type) {
    setAiModal({ type, content:"", loading:true });
    try {
      const lo = lastOutreach(patient.events);
      const daysOver = d < 0 ? Math.abs(d) : 0;
      let prompt;
      if (type==="call") {
        prompt = `You are a medical office coordinator at a psychiatric practice. Write a brief, warm phone call script for a staff member reaching out to a patient about a ${daysOver>0?"missed":"upcoming"} treatment appointment.

Patient first name: ${patient.name.split(" ")[0]}
Treatment: ${patient.treatment} (${info.freq||""})
Diagnosis category: ${patient.diagnosis}
Status: ${STATUS_CFG[status]?.label}
${daysOver>0?`Days overdue: ${daysOver}`:`Next appointment: ${patient.nextDue}`}
${lo?`Last contact attempt: ${lo.method} on ${lo.date}`:"No prior contact attempts."}

Write a warm, professional script under 100 words. 
Use language like: "due for treatment", "missed appointment", "help keep your care on track", "checking in", "support"
Never use: "non-compliant", "failed", "relapsed", "non-adherent"
Format as a phone script the staff member reads aloud. Include a clear next step.`;
      } else {
        prompt = `You are a medical office coordinator at a psychiatric practice. Draft a brief clinical chart note for the patient record, to be copied into Practice Fusion.

Patient: ${patient.name} (${patient.id})
Treatment: ${patient.treatment} · Provider: ${patient.provider}
Status: ${STATUS_CFG[status]?.label}
Last treatment: ${patient.lastTreatment} · Next due: ${patient.nextDue}
${d<0?`Days overdue: ${Math.abs(d)}`:""}
Recent events: ${sortedEvs.slice(0,3).map(e=>`${e.date}: ${e.type}${e.method?" ("+e.method+")":""} — ${e.note}`).join("; ")}

Write a 2–4 sentence clinical documentation note. Be objective and professional. Suitable for a medical record. Do not speculate on diagnosis or include sensitive substance use details beyond what is documented.`;
      }
      const content = await askClaude(prompt);
      setAiModal({ type, content, loading:false });
    } catch { setAiModal({ type, content:"Failed to generate. Please try again.", loading:false }); }
  }

  return (
    <div style={{ padding:"24px 28px", height:"100%", overflowY:"auto" }}>
      <button onClick={onBack} style={{ background:"none", border:"none", color:T.muted, cursor:"pointer", fontFamily:T.SANS, fontSize:13, marginBottom:16, padding:0 }}>← Back</button>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 280px", gap:16 }}>
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

          {/* Header */}
          <div style={{ background:T.card, borderRadius:12, border:`1px solid ${T.borderD}`, padding:20 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                <div style={{ width:48,height:48,borderRadius:"50%",background:`${T.acc}1a`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:700,color:T.acc }}>{ini(patient.name)}</div>
                <div>
                  <h2 style={{ fontSize:19, fontWeight:700, color:T.text, margin:0 }}>{patient.name}</h2>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:5 }}>
                    <TreatTag t={patient.treatment} />
                    <span style={{ fontSize:12, color:T.muted }}>{patient.diagnosis} · {patient.provider}</span>
                  </div>
                </div>
              </div>
              <div style={{ textAlign:"right" }}>
                <StatusBadge status={status} lg />
                <div style={{ fontSize:11, color:T.muted, marginTop:6, fontFamily:T.MONO }}>
                  {d<0?`${Math.abs(d)} days overdue`:d===0?"Due today":`Due in ${d} days`}
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div style={{ background:T.card, borderRadius:12, border:`1px solid ${T.borderD}`, padding:20 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <div style={{ fontSize:13, fontWeight:600, color:T.text }}>Treatment & Outreach Timeline</div>
              <Btn v="out" onClick={()=>onLogEvent(patient.id)}>+ Log Event</Btn>
            </div>
            <div style={{ position:"relative" }}>
              <div style={{ position:"absolute", left:11, top:4, bottom:4, width:1, background:T.borderD }} />
              {sortedEvs.map((ev,i) => (
                <div key={i} style={{ display:"flex", gap:12, alignItems:"flex-start", marginBottom:14, position:"relative" }}>
                  <div style={{ zIndex:1 }}><EvIcon type={ev.type} /></div>
                  <div style={{ flex:1, paddingTop:2 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:2 }}>
                      <span style={{ fontSize:12, fontWeight:600, color:T.text }}>
                        {ev.type==="provider_notified"?"Provider Notified":ev.type.charAt(0).toUpperCase()+ev.type.slice(1)}
                        {ev.method?` — ${ev.method}`:""}
                      </span>
                      <span style={{ fontFamily:T.MONO, fontSize:10, color:T.dim }}>{ev.date}</span>
                    </div>
                    <div style={{ fontSize:12, color:T.muted, lineHeight:1.5 }}>{ev.note}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

          {/* Patient Info */}
          <div style={{ background:T.card, borderRadius:12, border:`1px solid ${T.borderD}`, padding:18 }}>
            <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:14 }}>Patient Info</div>
            {[["Patient ID",patient.id],["Date of Birth",patient.dob],["Diagnosis",patient.diagnosis],["Provider",patient.provider],["Treatment",patient.treatment],["Schedule",info.freq||"—"],["Last Treatment",patient.lastTreatment],["Next Due",patient.nextDue]].map(([k,v])=>(
              <div key={k} style={{ marginBottom:10 }}>
                <div style={{ fontSize:10, color:T.dim, textTransform:"uppercase", letterSpacing:"0.07em" }}>{k}</div>
                <div style={{ fontSize:12, color:T.text, marginTop:2, fontFamily:["Patient ID","Last Treatment","Next Due"].includes(k)?T.MONO:T.SANS }}>{v}</div>
              </div>
            ))}
          </div>

          {/* AI Tools */}
          <div style={{ background:T.card, borderRadius:12, border:`1px solid ${T.borderD}`, padding:18 }}>
            <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:4 }}><span style={{ color:T.acc }}>✦</span> AI Assist</div>
            <p style={{ fontSize:11, color:T.muted, marginBottom:14, lineHeight:1.6 }}>Generate call scripts and chart notes for Practice Fusion.</p>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              <Btn onClick={()=>runAI("call")} st={{ width:"100%", justifyContent:"center" }}>📞 Draft Call Script</Btn>
              <Btn v="out" onClick={()=>runAI("note")} st={{ width:"100%", justifyContent:"center" }}>📋 Draft Chart Note</Btn>
            </div>
          </div>

          {/* Treatment Summary */}
          <div style={{ background:T.card, borderRadius:12, border:`1px solid ${T.borderD}`, padding:18 }}>
            <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:12 }}>Event Summary</div>
            {[["Completed",patient.events.filter(e=>e.type==="completed").length],["Missed",patient.events.filter(e=>e.type==="missed").length],["Outreach Attempts",patient.events.filter(e=>e.type==="outreach").length],["Consecutive Missed",patient.consecutiveMissed]].map(([k,v])=>(
              <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"5px 0", borderBottom:`1px solid ${T.borderD}20` }}>
                <span style={{ fontSize:12, color:T.muted }}>{k}</span>
                <span style={{ fontSize:12, fontFamily:T.MONO, fontWeight:500, color:k==="Consecutive Missed"&&v>=2?"#ef4444":T.text }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Modal */}
      {aiModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200 }}
          onClick={e=>e.target===e.currentTarget&&setAiModal(null)}>
          <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, padding:26, width:520, maxWidth:"92vw" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
              <h3 style={{ fontSize:15, fontWeight:700, color:T.text, margin:0 }}>
                {aiModal.type==="call"?"📞 Call Script Draft":"📋 Chart Note Draft"}
              </h3>
              <Btn v="ghost" onClick={()=>setAiModal(null)}>✕</Btn>
            </div>
            {aiModal.loading
              ? <div style={{ textAlign:"center", padding:"40px 0", color:T.muted }}><div style={{ fontSize:22, color:T.acc, marginBottom:10 }}>✦</div><div style={{ fontSize:13 }}>Generating with Claude…</div></div>
              : <>
                  <div style={{ background:T.bg, borderRadius:10, padding:16, fontSize:13, lineHeight:1.8, color:T.text, whiteSpace:"pre-wrap", border:`1px solid ${T.borderD}`, maxHeight:300, overflowY:"auto" }}>{aiModal.content}</div>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:14 }}>
                    <div style={{ fontSize:11, color:"#f59e0b", flex:1, lineHeight:1.5 }}>⚠ Review before use. Do not paste PHI into unsecured systems.</div>
                    <Btn v="out" onClick={()=>navigator.clipboard?.writeText(aiModal.content)}>Copy</Btn>
                    <Btn onClick={()=>setAiModal(null)}>Done</Btn>
                  </div>
                </>
            }
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── OUTREACH QUEUE ─────────────────────────────────────── */
const OutreachQueue = ({ patients, onSelect }) => {
  const order = { "high-risk":0, "overdue":1, "due-today":2, "due-soon":3 };
  const queue = patients.filter(needsOutreach).sort((a,b)=>(order[getStatus(a)]??9)-(order[getStatus(b)]??9));
  const cols = "1.6fr 1fr 1fr 1fr 1.1fr";

  return (
    <div style={{ padding:"24px 28px", height:"100%", overflowY:"auto" }}>
      <div style={{ marginBottom:18 }}>
        <h1 style={{ fontSize:21, fontWeight:700, color:T.text, margin:0 }}>Outreach Queue</h1>
        <p style={{ fontSize:12, color:T.muted, margin:"4px 0 0" }}>
          {queue.length>0?`${queue.length} patients need contact today`:"All patients are on track"}
        </p>
      </div>

      {queue.length===0
        ? <div style={{ background:T.card, borderRadius:12, border:`1px solid ${T.borderD}`, padding:40, textAlign:"center" }}>
            <div style={{ fontSize:22, marginBottom:8, color:"#10b981" }}>✓</div>
            <div style={{ fontSize:14, fontWeight:600, color:T.text }}>Queue is clear</div>
            <div style={{ fontSize:12, color:T.muted, marginTop:4 }}>All patients are on track</div>
          </div>
        : <>
            <div style={{ display:"grid", gridTemplateColumns:cols, padding:"7px 16px", fontSize:10, color:T.dim, textTransform:"uppercase", letterSpacing:"0.09em", borderBottom:`1px solid ${T.borderD}` }}>
              {["Patient","Treatment","Status","Last Contact","Action"].map(h=><span key={h}>{h}</span>)}
            </div>
            {queue.map(p => {
              const lo = lastOutreach(p.events);
              const d = daysDiff(p.nextDue);
              return (
                <div key={p.id} style={{ display:"grid", gridTemplateColumns:cols, padding:"13px 16px", alignItems:"center", borderBottom:`1px solid ${T.borderD}20`, transition:"background 0.1s" }}
                  onMouseEnter={e=>e.currentTarget.style.background=T.hover} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <div style={{ display:"flex", alignItems:"center", gap:9, cursor:"pointer" }} onClick={()=>onSelect(p.id)}>
                    <div style={{ width:28,height:28,borderRadius:"50%",background:`${T.acc}1a`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:T.acc,flexShrink:0 }}>{ini(p.name)}</div>
                    <div>
                      <div style={{ fontSize:12, fontWeight:600, color:T.text }}>{p.name}</div>
                      <div style={{ fontSize:10, color:T.muted }}>{p.diagnosis}</div>
                    </div>
                  </div>
                  <TreatTag t={p.treatment} />
                  <div>
                    <StatusBadge status={getStatus(p)} />
                    <div style={{ fontSize:10, color:T.muted, marginTop:4, fontFamily:T.MONO }}>
                      {d<0?`${Math.abs(d)}d overdue`:d===0?"Today":`In ${d}d`}
                    </div>
                  </div>
                  <div style={{ fontSize:11 }}>
                    {lo
                      ? <><div style={{ color:T.text }}>{lo.method}</div><div style={{ fontFamily:T.MONO, fontSize:10, color:T.muted }}>{lo.date}</div></>
                      : <span style={{ color:"#ef4444" }}>None yet</span>
                    }
                  </div>
                  <div style={{ display:"flex", gap:6 }}>
                    <Btn v="pri" onClick={()=>onSelect(p.id)} st={{ fontSize:11, padding:"5px 9px" }}>📞 Script</Btn>
                    <Btn v="out" onClick={()=>onSelect(p.id)} st={{ fontSize:11, padding:"5px 9px" }}>📋 Note</Btn>
                  </div>
                </div>
              );
            })}
          </>
      }
    </div>
  );
};

/* ─── PF IMPORT ──────────────────────────────────────────── */
const ImportPage = () => {
  const [step, setStep] = useState(0);
  const [drag, setDrag] = useState(false);
  const preview = [
    { name:"Robert H.", dob:"1970-11-03", appt:"2026-05-22", type:"Vivitrol", matched:true },
    { name:"Priya S.",  dob:"1995-04-17", appt:"2026-05-22", type:"Ketamine", matched:true },
    { name:"Kevin M.",  dob:"1982-07-29", appt:"2026-05-23", type:"Invega",   matched:false },
  ];

  return (
    <div style={{ padding:"24px 28px", height:"100%", overflowY:"auto" }}>
      <div style={{ marginBottom:18 }}>
        <h1 style={{ fontSize:21, fontWeight:700, color:T.text, margin:0 }}>Practice Fusion Import</h1>
        <p style={{ fontSize:12, color:T.muted, margin:"4px 0 0" }}>Phase 1 — CSV appointment import</p>
      </div>

      {step===0 && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
          <div style={{ background:T.card, borderRadius:12, border:`1px solid ${T.borderD}`, padding:24 }}>
            <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:14 }}>Upload Appointment CSV</div>
            <div onDragOver={e=>{e.preventDefault();setDrag(true)}} onDragLeave={()=>setDrag(false)} onDrop={e=>{e.preventDefault();setDrag(false);setStep(1);}} onClick={()=>setStep(1)}
              style={{ border:`2px dashed ${drag?T.acc:T.border}`, borderRadius:10, padding:"34px 20px", textAlign:"center", cursor:"pointer", transition:"all 0.15s", background:drag?`${T.acc}08`:"transparent" }}>
              <div style={{ fontSize:26, marginBottom:10, color:T.acc }}>↑</div>
              <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:4 }}>Drop CSV file here</div>
              <div style={{ fontSize:11, color:T.muted }}>or click to browse</div>
            </div>
            <div style={{ fontSize:11, color:T.muted, marginTop:14, lineHeight:1.7 }}>
              <strong style={{ color:T.text }}>Export from Practice Fusion:</strong><br />
              Reports → Appointments → Export to CSV<br />
              Required: Patient Name, DOB, Appt Date, Appt Type, Provider
            </div>
          </div>

          <div style={{ background:T.card, borderRadius:12, border:`1px solid ${T.borderD}`, padding:24 }}>
            <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:16 }}>Integration Roadmap</div>
            {[
              { phase:"Phase 1 · Now",  label:"CSV Import",       desc:"Export appointment CSV from Practice Fusion, upload here. Adherix matches patients by name + DOB.", done:true },
              { phase:"Phase 2",        label:"Semi-Automated",    desc:"Auto-detect missed visits from appointment report. Auto-generate daily outreach task list.", done:false },
              { phase:"Phase 3",        label:"FHIR Integration",  desc:"Direct API to Practice Fusion. Pull demographics, appointments, encounters. Push chart notes back.", done:false },
            ].map(r=>(
              <div key={r.phase} style={{ display:"flex", gap:12, marginBottom:16, alignItems:"flex-start" }}>
                <div style={{ width:22,height:22,borderRadius:"50%",background:r.done?"#10b98115":`${T.acc}15`,border:`1px solid ${r.done?"#10b98130":`${T.acc}30`}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:r.done?"#10b981":T.acc,flexShrink:0,fontWeight:700 }}>
                  {r.done?"✓":"○"}
                </div>
                <div>
                  <div style={{ fontSize:10, color:T.muted, textTransform:"uppercase", letterSpacing:"0.07em" }}>{r.phase}</div>
                  <div style={{ fontSize:12, fontWeight:600, color:T.text }}>{r.label}</div>
                  <div style={{ fontSize:11, color:T.muted, marginTop:2, lineHeight:1.5 }}>{r.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {step===1 && (
        <div style={{ background:T.card, borderRadius:12, border:`1px solid ${T.borderD}`, padding:24 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
            <div>
              <div style={{ fontSize:13, fontWeight:600, color:T.text }}>Review — appointments_2026-05-22.csv</div>
              <div style={{ fontSize:11, color:T.muted, marginTop:2 }}>3 records · 2 matched · 1 needs review</div>
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <Btn v="out" onClick={()=>setStep(0)}>← Back</Btn>
              <Btn onClick={()=>setStep(2)}>Import 2 Matched</Btn>
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1.5fr 1fr 1fr 1fr 1fr", padding:"6px 14px", fontSize:10, color:T.dim, textTransform:"uppercase", letterSpacing:"0.08em", borderBottom:`1px solid ${T.borderD}` }}>
            {["Patient Name","Date of Birth","Appointment","Treatment","Match"].map(h=><span key={h}>{h}</span>)}
          </div>
          {preview.map((r,i)=>(
            <div key={i} style={{ display:"grid", gridTemplateColumns:"1.5fr 1fr 1fr 1fr 1fr", padding:"11px 14px", alignItems:"center", borderBottom:`1px solid ${T.borderD}20`, background:r.matched?"transparent":"#f59e0b06" }}>
              <span style={{ fontSize:12, fontWeight:600, color:T.text }}>{r.name}</span>
              <span style={{ fontSize:11, fontFamily:T.MONO, color:T.muted }}>{r.dob}</span>
              <span style={{ fontSize:11, fontFamily:T.MONO, color:T.muted }}>{r.appt}</span>
              <TreatTag t={r.type} />
              {r.matched?<span style={{ fontSize:11, color:"#10b981", fontWeight:600 }}>✓ Matched</span>:<span style={{ fontSize:11, color:"#f59e0b", fontWeight:600 }}>⚠ Review</span>}
            </div>
          ))}
          <div style={{ marginTop:14, padding:"12px 14px", background:"#f59e0b08", borderRadius:8, border:"1px solid #f59e0b25" }}>
            <div style={{ fontSize:12, color:"#f59e0b", fontWeight:600, marginBottom:4 }}>⚠ Kevin M. — No match found</div>
            <div style={{ fontSize:11, color:T.muted }}>Patient not in Adherix roster. Add manually or skip.</div>
          </div>
        </div>
      )}

      {step===2 && (
        <div style={{ background:T.card, borderRadius:12, border:`1px solid ${T.borderD}`, padding:40, textAlign:"center" }}>
          <div style={{ fontSize:28, marginBottom:12, color:"#10b981" }}>✓</div>
          <div style={{ fontSize:16, fontWeight:700, color:T.text, marginBottom:6 }}>Import Complete</div>
          <div style={{ fontSize:13, color:T.muted, marginBottom:20 }}>2 appointment records imported successfully</div>
          <Btn onClick={()=>setStep(0)}>Import Another File</Btn>
        </div>
      )}
    </div>
  );
};

/* ─── ADD PATIENT MODAL ──────────────────────────────────── */
const AddModal = ({ onClose, onAdd }) => {
  const [f, setF] = useState({ name:"", dob:"", diagnosis:"OUD", treatment:"Vivitrol", provider:"Dr. Levinson", lastTreatment:"", nextDue:"" });
  const inp = { width:"100%", boxSizing:"border-box", padding:"8px 12px", background:T.bg, border:`1px solid ${T.border}`, borderRadius:8, color:T.text, fontFamily:T.SANS, fontSize:13, outline:"none", marginTop:4 };
  const lbl = { fontSize:10, color:T.muted, textTransform:"uppercase", letterSpacing:"0.07em" };
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200 }}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, padding:26, width:480, maxWidth:"92vw" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
          <h3 style={{ fontSize:15, fontWeight:700, color:T.text, margin:0 }}>Add New Patient</h3>
          <Btn v="ghost" onClick={onClose}>✕</Btn>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          {[["Full Name","name","text",2],["Date of Birth","dob","date",1],["Last Treatment","lastTreatment","date",1],["Next Due Date","nextDue","date",2]].map(([l,k,t,c])=>(
            <div key={k} style={{ gridColumn:c===2?"span 2":undefined }}>
              <label style={lbl}>{l}</label>
              <input type={t} value={f[k]} onChange={e=>setF(x=>({...x,[k]:e.target.value}))} style={inp} />
            </div>
          ))}
          <div>
            <label style={lbl}>Diagnosis</label>
            <select value={f.diagnosis} onChange={e=>setF(x=>({...x,diagnosis:e.target.value}))} style={{...inp,cursor:"pointer"}}>
              {["Depression","OUD","AUD","Schizophrenia","PTSD","Bipolar","Anxiety"].map(d=><option key={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Treatment</label>
            <select value={f.treatment} onChange={e=>setF(x=>({...x,treatment:e.target.value}))} style={{...inp,cursor:"pointer"}}>
              {Object.keys(TREAT_INFO).map(t=><option key={t}>{t}</option>)}
            </select>
          </div>
          <div style={{ gridColumn:"span 2" }}>
            <label style={lbl}>Provider</label>
            <select value={f.provider} onChange={e=>setF(x=>({...x,provider:e.target.value}))} style={{...inp,cursor:"pointer"}}>
              {["Dr. Levinson","Dr. Patel","Dr. Chen","Dr. Williams"].map(p=><option key={p}>{p}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display:"flex", justifyContent:"flex-end", gap:10, marginTop:18 }}>
          <Btn v="out" onClick={onClose}>Cancel</Btn>
          <Btn disabled={!f.name||!f.nextDue} onClick={()=>{ onAdd({id:`PF-${10000+Math.floor(Math.random()*9000)}`,...f,consecutiveMissed:0,events:[]}); onClose(); }}>Add Patient</Btn>
        </div>
      </div>
    </div>
  );
};

/* ─── LOG EVENT MODAL ────────────────────────────────────── */
const LogEventModal = ({ patient, onClose, onLog }) => {
  const [type, setType] = useState("completed");
  const [method, setMethod] = useState("Call");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(TODAY);
  const inp = { width:"100%", boxSizing:"border-box", padding:"8px 12px", background:T.bg, border:`1px solid ${T.border}`, borderRadius:8, color:T.text, fontFamily:T.SANS, fontSize:13, outline:"none", marginTop:4 };
  const lbl = { fontSize:10, color:T.muted, textTransform:"uppercase", letterSpacing:"0.07em" };
  const types = [["completed","Completed"],["missed","Missed"],["outreach","Outreach"],["provider_notified","Provider Notified"]];
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200 }}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, padding:26, width:400 }}>
        <h3 style={{ fontSize:15, fontWeight:700, color:T.text, margin:"0 0 18px" }}>Log Event · {patient.name}</h3>
        <div style={{ marginBottom:12 }}>
          <label style={lbl}>Event Type</label>
          <div style={{ display:"flex", gap:6, marginTop:6, flexWrap:"wrap" }}>
            {types.map(([val,lab])=>(
              <button key={val} onClick={()=>setType(val)} style={{ padding:"5px 11px", borderRadius:6, border:`1px solid ${type===val?T.acc:T.border}`, background:type===val?`${T.acc}15`:"transparent", color:type===val?T.acc:T.muted, cursor:"pointer", fontSize:12, fontFamily:T.SANS, fontWeight:type===val?600:400 }}>
                {lab}
              </button>
            ))}
          </div>
        </div>
        {type==="outreach" && (
          <div style={{ marginBottom:12 }}>
            <label style={lbl}>Method</label>
            <select value={method} onChange={e=>setMethod(e.target.value)} style={{...inp,cursor:"pointer"}}>
              {["Call","Voicemail","Text","Email"].map(m=><option key={m}>{m}</option>)}
            </select>
          </div>
        )}
        <div style={{ marginBottom:12 }}>
          <label style={lbl}>Date</label>
          <input type="date" value={date} onChange={e=>setDate(e.target.value)} style={inp} />
        </div>
        <div style={{ marginBottom:18 }}>
          <label style={lbl}>Note</label>
          <textarea value={note} onChange={e=>setNote(e.target.value)} rows={3} placeholder="Brief documentation note…"
            style={{...inp,resize:"none",lineHeight:1.5}} />
        </div>
        <div style={{ display:"flex", justifyContent:"flex-end", gap:10 }}>
          <Btn v="out" onClick={onClose}>Cancel</Btn>
          <Btn disabled={!note.trim()} onClick={()=>{ onLog(patient.id,{date,type,method:type==="outreach"?method:undefined,note:note.trim()}); onClose(); }}>Save Event</Btn>
        </div>
      </div>
    </div>
  );
};

/* ─── ROOT APP ───────────────────────────────────────────── */
export default function App() {
  const [patients, setPatients] = useState(INIT_PATIENTS);
  const [view, setView] = useState("dashboard");
  const [selId, setSelId] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [logId, setLogId] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const el = document.createElement("style");
    el.textContent = `*{box-sizing:border-box;}body,html{margin:0;padding:0;}::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-thumb{background:#1b2d4f;border-radius:2px;}input[type="date"]::-webkit-calendar-picker-indicator{filter:invert(1)opacity(0.4);}textarea,select{font-family:inherit;}`;
    document.head.appendChild(el);
    return () => document.head.removeChild(el);
  }, []);

  const sel = patients.find(p=>p.id===selId);
  const overdueCt = patients.filter(p=>["overdue","high-risk"].includes(getStatus(p))).length;
  const queueCt   = patients.filter(needsOutreach).length;

  function select(id) { setSelId(id); setView("detail"); }
  function addPatient(p) { setPatients(ps=>[...ps,p]); }
  function logEvent(id, ev) {
    setPatients(ps => ps.map(p => {
      if (p.id!==id) return p;
      return {
        ...p,
        events: [...p.events, ev],
        consecutiveMissed: ev.type==="missed" ? p.consecutiveMissed+1 : ev.type==="completed" ? 0 : p.consecutiveMissed,
        lastTreatment: ev.type==="completed" ? ev.date : p.lastTreatment,
      };
    }));
  }

  const navItems = [
    { icon:"◈", label:"Dashboard",      v:"dashboard" },
    { icon:"◉", label:"Patients",        v:"roster" },
    { icon:"↗", label:"Outreach Queue", v:"queue",  badge:queueCt },
    { icon:"⇥", label:"PF Import",      v:"import" },
  ];

  return (
    <div style={{ display:"flex", height:"100vh", background:T.bg, fontFamily:T.SANS, color:T.text, overflow:"hidden" }}>
      {/* Sidebar */}
      <div style={{ width:205, minWidth:205, background:T.surf, borderRight:`1px solid ${T.borderD}`, display:"flex", flexDirection:"column" }}>
        <div style={{ padding:"20px 20px 18px", borderBottom:`1px solid ${T.borderD}` }}>
          <div style={{ fontSize:17, fontWeight:700, letterSpacing:"-0.03em" }}>
            <span style={{ color:T.acc }}>adh</span>erix
          </div>
          <div style={{ fontSize:9, color:T.dim, marginTop:1, letterSpacing:"0.1em", textTransform:"uppercase" }}>Psychiatric Practice</div>
        </div>

        <div style={{ padding:"10px 0", flex:1 }}>
          {navItems.map(n => (
            <Nav key={n.v} icon={n.icon} label={n.label} active={view===n.v||(n.v==="roster"&&view==="detail")} onClick={()=>setView(n.v)} badge={n.badge||0} />
          ))}
        </div>

        {overdueCt>0 && (
          <div style={{ margin:"0 12px 12px", background:"#ef44440a", border:"1px solid #ef444422", borderRadius:8, padding:"10px 12px" }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#ef4444" }}>⚠ {overdueCt} Overdue</div>
            <div style={{ fontSize:10, color:T.muted, marginTop:2 }}>Needs immediate outreach</div>
          </div>
        )}

        <div style={{ padding:"14px 20px", borderTop:`1px solid ${T.borderD}` }}>
          <div style={{ fontSize:10, color:T.dim, marginBottom:2, textTransform:"uppercase", letterSpacing:"0.07em" }}>Coordinator</div>
          <div style={{ fontSize:13, fontWeight:600 }}>Leeza M.</div>
          <div style={{ fontSize:10, color:T.muted, marginTop:1 }}>Access Multi-Specialty</div>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex:1, overflow:"hidden" }}>
        {view==="dashboard" && <Dashboard patients={patients} onSelect={select} setView={setView} />}
        {view==="roster"    && <Roster patients={patients} onSelect={select} onAdd={()=>setShowAdd(true)} search={search} setSearch={setSearch} />}
        {view==="detail" && sel && <PatientDetail patient={sel} onBack={()=>setView("roster")} onLogEvent={setLogId} />}
        {view==="queue"  && <OutreachQueue patients={patients} onSelect={select} />}
        {view==="import" && <ImportPage />}
      </div>

      {showAdd && <AddModal onClose={()=>setShowAdd(false)} onAdd={addPatient} />}
      {logId   && <LogEventModal patient={patients.find(p=>p.id===logId)} onClose={()=>setLogId(null)} onLog={logEvent} />}
    </div>
  );
}
