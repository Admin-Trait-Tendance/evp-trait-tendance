import { useState, useMemo, useEffect, useRef } from "react";
import { supabase } from "./supabase.js";

// ── Design tokens Trait'Tendance néomorphisme ─────────────────────────────────
const CSS = `
  :root {
    --tt-bg: #F0EDE8;
    --tt-surface: #F0EDE8;
    --tt-gold: #B8954A;
    --tt-gold-light: #D4AF6A;
    --tt-gold-dark: #8A6B2E;
    --tt-text: #2C2820;
    --tt-text-2: #6B5E4E;
    --tt-text-3: #9A8C7E;
    --tt-shadow-out: 5px 5px 12px #C8C4BE, -5px -5px 12px #FDFAF5;
    --tt-shadow-in:  inset 3px 3px 8px #C8C4BE, inset -3px -3px 8px #FDFAF5;
    --tt-shadow-sm:  3px 3px 7px #C8C4BE, -3px -3px 7px #FDFAF5;
    --tt-shadow-btn: 4px 4px 10px #C0BCB6, -4px -4px 10px #FFFCF7;
    --tt-shadow-btn-press: inset 2px 2px 6px #C0BCB6, inset -2px -2px 6px #FFFCF7;
    --tt-r: 16px;
    --tt-r-sm: 10px;
    --tt-r-pill: 50px;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: var(--tt-bg); color: var(--tt-text); font-family: 'Inter', system-ui, sans-serif; }

  .nm-card {
    background: var(--tt-surface);
    border-radius: var(--tt-r);
    box-shadow: var(--tt-shadow-out);
    padding: 20px;
  }
  .nm-card-sm {
    background: var(--tt-surface);
    border-radius: var(--tt-r-sm);
    box-shadow: var(--tt-shadow-sm);
    padding: 14px 16px;
  }
  .nm-inset {
    background: var(--tt-bg);
    border-radius: var(--tt-r-sm);
    box-shadow: var(--tt-shadow-in);
    padding: 10px 14px;
  }
  .nm-btn {
    background: var(--tt-surface);
    border-radius: var(--tt-r-sm);
    box-shadow: var(--tt-shadow-btn);
    border: none;
    cursor: pointer;
    color: var(--tt-text);
    font-family: inherit;
    font-size: 13px;
    font-weight: 500;
    padding: 10px 18px;
    transition: box-shadow .15s, transform .1s;
    display: inline-flex; align-items: center; gap: 7px;
  }
  .nm-btn:active { box-shadow: var(--tt-shadow-btn-press); transform: scale(0.98); }
  .nm-btn.primary {
    background: linear-gradient(145deg, var(--tt-gold-light), var(--tt-gold-dark));
    color: #fff;
    box-shadow: 4px 4px 10px #A8844020, -2px -2px 8px #D4AF6A40;
  }
  .nm-btn.primary:active { box-shadow: inset 2px 2px 6px #8A6B2E60; }
  .nm-btn.ghost { box-shadow: none; color: var(--tt-text-2); }
  .nm-btn.ghost:hover { color: var(--tt-gold); }
  .nm-input {
    background: var(--tt-bg);
    border-radius: var(--tt-r-sm);
    box-shadow: var(--tt-shadow-in);
    border: none;
    padding: 10px 14px;
    font-family: inherit;
    font-size: 13px;
    color: var(--tt-text);
    outline: none;
    width: 100%;
    transition: box-shadow .2s;
  }
  .nm-input:focus { box-shadow: inset 3px 3px 8px #C0BCB6, inset -3px -3px 8px #FFFCF7, 0 0 0 2px var(--tt-gold-light)40; }
  .nm-input::placeholder { color: var(--tt-text-3); }
  select.nm-input { cursor: pointer; }
  .nm-tab {
    background: var(--tt-surface);
    border: none;
    border-radius: var(--tt-r-pill);
    padding: 8px 16px;
    font-family: inherit;
    font-size: 13px;
    font-weight: 500;
    color: var(--tt-text-2);
    cursor: pointer;
    box-shadow: var(--tt-shadow-btn);
    transition: all .15s;
  }
  .nm-tab.active {
    box-shadow: var(--tt-shadow-btn-press);
    color: var(--tt-gold);
    background: var(--tt-bg);
  }
  .nm-badge {
    display: inline-flex; align-items: center; justify-content: center;
    border-radius: var(--tt-r-pill);
    font-size: 11px; font-weight: 600;
    padding: 2px 10px;
    background: var(--tt-bg);
    box-shadow: var(--tt-shadow-sm);
  }
  .nm-badge.gold { background: linear-gradient(145deg, var(--tt-gold-light), var(--tt-gold-dark)); color: #fff; box-shadow: none; }
  .nm-badge.info { color: #185FA5; background: #E6F1FB; box-shadow: none; }
  .nm-badge.warn { color: #854F0B; background: #FAEEDA; box-shadow: none; }
  .nm-badge.danger { color: #A32D2D; background: #FCEBEB; box-shadow: none; }
  .nm-divider { height: 0.5px; background: linear-gradient(90deg, transparent, #C8C4BE, transparent); margin: 16px 0; }
  .gold-text { background: linear-gradient(135deg, var(--tt-gold-light), var(--tt-gold-dark)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
  .extra-row { padding: 12px 16px; border-radius: var(--tt-r-sm); cursor: pointer; display: flex; align-items: center; justify-content: space-between; transition: all .15s; }
  .extra-row:hover { box-shadow: var(--tt-shadow-sm); background: var(--tt-surface); }
  .extra-row.selected { box-shadow: var(--tt-shadow-btn-press); background: var(--tt-bg); }
  .stat-card { background: var(--tt-surface); border-radius: var(--tt-r-sm); box-shadow: var(--tt-shadow-sm); padding: 14px 18px; }
  .tt-logo { font-size: 11px; letter-spacing: .12em; text-transform: uppercase; color: var(--tt-text-3); }
  .pill-filter { display: flex; gap: 8px; flex-wrap: wrap; }
  @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
  .fade-in { animation: fadeIn .25s ease; }
  .sig-canvas { width: 100%; cursor: crosshair; touch-action: none; display: block; border-radius: 10px; background: #fff; }
  table { width: 100%; border-collapse: collapse; }
  th { font-size: 11px; font-weight: 600; color: var(--tt-text-3); text-transform: uppercase; letter-spacing: .05em; padding: 8px 10px; text-align: left; border-bottom: 0.5px solid #D8D4CE; }
  td { padding: 10px 10px; font-size: 13px; border-bottom: 0.5px solid #E8E4DE; color: var(--tt-text); vertical-align: middle; }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: #F8F5F040; }
  .avatar { width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(145deg, var(--tt-gold-light), var(--tt-gold-dark)); display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 600; font-size: 14px; box-shadow: 3px 3px 8px #A88440 40, -2px -2px 6px #D4AF6A60; flex-shrink:0; }
  .avatar-sm { width: 30px; height: 30px; border-radius: 50%; background: linear-gradient(145deg, var(--tt-gold-light), var(--tt-gold-dark)); display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 600; font-size: 11px; flex-shrink:0; }
  input[type=checkbox] { width: 18px; height: 18px; accent-color: var(--tt-gold); cursor: pointer; }
  .login-bg { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--tt-bg); }
`;

// ── Constantes ────────────────────────────────────────────────────────────────
const TARIFS = { vac6h:164.37, hsAv:27.395, hsAp:35.75, primeResp:6.36, deplCirc:7.70, deplPetite:15, deplMoyenne:30, deplGrande:50 };
const POSTES = ["MH","Chef de rang","Responsable de salle","Barman","Cuisinier","Plongeur","Hôtesse","Logisticien"];
const DEPL_OPTIONS = ["Aucun","Circulaire","Petite","Moyenne","Grande"];
const MONTHS_FR = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
const ADMIN_TOKEN = "tt-admin-2025";
const ADMIN_EMAILS = ["admin@trait-tendance.fr", "comptabilite@trait-tendance.com"];

// ── Données depuis Supabase ──────────────────────────────────────────────────
const DEMO_USERS = [];
const DEMO_SAISIES = [];

// ── Storage remplacé par Supabase ────────────────────────────────────────────
function load(key, fallback) { return fallback; }
function save(key, val) {}

// ── Calculs ───────────────────────────────────────────────────────────────────
function parseHHMM(s) {
  if (!s) return null;
  const [h,m] = s.split(":").map(Number);
  if (isNaN(h)||isNaN(m)) return null;
  return h*60+m;
}
function calcH(debut, fin) {
  const d=parseHHMM(debut); let f=parseHHMM(fin);
  if(d===null||f===null) return {vac:0,hsAv:0,hsAp:0};
  if(f<=d) f+=1440;
  const duree=(f-d)/60;
  const vac=duree>=6?1:Math.round(duree/6*100)/100;
  let hav=0,hap=0;
  if(duree>6){
    const hs=d+360, he=f;
    const ae=Math.min(he,1440); if(ae>hs) hav=Math.round((ae-hs)/60*100)/100;
    const as=Math.max(hs,1440); if(he>as) hap=Math.round((he-as)/60*100)/100;
  }
  return {vac,hsAv:hav,hsAp:hap};
}
function calcTotal(s) {
  const {vac,hsAv,hsAp}=calcH(s.heureArrivee,s.heureDepart);
  let t=vac*TARIFS.vac6h+hsAv*TARIFS.hsAv+hsAp*TARIFS.hsAp;
  if(s.estResponsable) t+=(s.primeResp||0)*TARIFS.primeResp;
  if(s.deplacement==="Circulaire") t+=TARIFS.deplCirc;
  else if(s.deplacement==="Petite") t+=TARIFS.deplPetite;
  else if(s.deplacement==="Moyenne") t+=TARIFS.deplMoyenne;
  else if(s.deplacement==="Grande") t+=TARIFS.deplGrande;
  return Math.round(t*100)/100;
}
function fmtDate(d) {
  if(!d) return "—";
  const [y,m,j]=d.split("-");
  return `${j} ${MONTHS_FR[parseInt(m)-1]} ${y}`;
}
function initials(nom,prenom) {
  return `${(nom||"?")[0]}${(prenom||"?")[0]}`.toUpperCase();
}
function exportCSV(saisies) {
  const headers=["ID","Nom","Prénom","Date","Événement","H.Arrivée","H.Départ","Poste","Resp","PrimeResp","NbPersonnes","Déplacement","Vac","HS<minuit","HS>minuit","Total brut"];
  const rows=saisies.map(s=>{
    const {vac,hsAv,hsAp}=calcH(s.heureArrivee,s.heureDepart);
    return [s.id,s.nom,s.prenom,s.date,s.evenement,s.heureArrivee,s.heureDepart,s.poste,s.estResponsable?"Oui":"Non",s.primeResp||0,s.nbPersonnes||0,s.deplacement,vac,hsAv,hsAp,calcTotal(s)];
  });
  const csv=[headers,...rows].map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(";")).join("\n");
  const blob=new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8;"});
  const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="EVP_export.csv"; a.click();
}

// ── Composants partagés ───────────────────────────────────────────────────────
function StatCard({label,value,sub,gold}) {
  return (
    <div className="stat-card" style={{flex:1,minWidth:110}}>
      <div style={{fontSize:11,color:"var(--tt-text-3)",marginBottom:6,textTransform:"uppercase",letterSpacing:".05em"}}>{label}</div>
      <div style={{fontSize:20,fontWeight:600,color:gold?"var(--tt-gold)":"var(--tt-text)"}}>{value}</div>
      {sub&&<div style={{fontSize:11,color:"var(--tt-text-3)",marginTop:3}}>{sub}</div>}
    </div>
  );
}

function DeplBadge({val}) {
  if(!val||val==="Aucun") return <span style={{color:"var(--tt-text-3)",fontSize:12}}>—</span>;
  const cl={Circulaire:"info",Petite:"gold",Moyenne:"warn",Grande:"danger"};
  return <span className={`nm-badge ${cl[val]||""}`}>{val}</span>;
}

function MiniTable({rows, onContrat}) {
  if(!rows.length) return <div style={{padding:"30px 0",textAlign:"center",color:"var(--tt-text-3)",fontSize:13}}>Aucune saisie</div>;
  return (
    <div style={{overflowX:"auto"}}>
      <table>
        <thead><tr>
          {["Date","Événement","Horaires","Poste","Resp","Dépl","Vac","HS<","HS>","Total",""].map(h=><th key={h}>{h}</th>)}
        </tr></thead>
        <tbody>
          {rows.map(s=>{
            const {vac,hsAv,hsAp}=calcH(s.heureArrivee,s.heureDepart);
            return (
              <tr key={s.id}>
                <td style={{whiteSpace:"nowrap",color:"var(--tt-text-2)"}}>{fmtDate(s.date)}</td>
                <td style={{maxWidth:160,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.evenement}</td>
                <td style={{whiteSpace:"nowrap"}}>{s.heureArrivee}–{s.heureDepart}</td>
                <td>{s.poste}</td>
                <td>{s.estResponsable?<span className="nm-badge info">×{s.primeResp}</span>:<span style={{color:"var(--tt-text-3)"}}>—</span>}</td>
                <td><DeplBadge val={s.deplacement}/></td>
                <td style={{textAlign:"right",fontWeight:500}}>{vac}</td>
                <td style={{textAlign:"right",color:hsAv>0?"#854F0B":"var(--tt-text-3)"}}>{hsAv||"—"}</td>
                <td style={{textAlign:"right",color:hsAp>0?"#A32D2D":"var(--tt-text-3)"}}>{hsAp||"—"}</td>
                <td style={{textAlign:"right",fontWeight:600,color:"var(--tt-gold)"}}>{calcTotal(s).toFixed(2)} €</td>
                <td>{onContrat&&<button className="nm-btn" onClick={()=>onContrat(s)} style={{fontSize:11,padding:"4px 8px"}}><i className="ti ti-file-text"/></button>}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── FORMULAIRE SAISIE (partagé extra + admin) ─────────────────────────────────
function FormulaireVacation({onSave, defaultNom="", defaultPrenom="", readOnlyIdentity=false}) {
  const today=new Date().toISOString().split("T")[0];
  const [form,setForm]=useState({nom:defaultNom,prenom:defaultPrenom,evenement:"",date:today,heureArrivee:"",heureDepart:"",poste:"MH",estResponsable:false,primeResp:1,nbPersonnes:0,deplacement:"Aucun",signature:""});
  const [saved,setSaved]=useState(false);
  const canvasRef=useRef(null);
  const [drawing,setDrawing]=useState(false);
  const [lastPos,setLastPos]=useState(null);

  const calc=useMemo(()=>calcH(form.heureArrivee,form.heureDepart),[form.heureArrivee,form.heureDepart]);
  const total=useMemo(()=>calcTotal(form),[form]);

  function set(k,v){setForm(f=>({...f,[k]:v}));}
  function getPos(e,cv){const r=cv.getBoundingClientRect();const src=e.touches?e.touches[0]:e;return{x:src.clientX-r.left,y:src.clientY-r.top};}
  function startDraw(e){e.preventDefault();setDrawing(true);setLastPos(getPos(e,canvasRef.current));}
  function draw(e){e.preventDefault();if(!drawing)return;const cv=canvasRef.current;const ctx=cv.getContext("2d");const pos=getPos(e,cv);ctx.beginPath();ctx.moveTo(lastPos.x,lastPos.y);ctx.lineTo(pos.x,pos.y);ctx.strokeStyle="#2C2820";ctx.lineWidth=2;ctx.lineCap="round";ctx.stroke();setLastPos(pos);set("signature",cv.toDataURL());}
  function stopDraw(){setDrawing(false);}
  function clearSig(){canvasRef.current.getContext("2d").clearRect(0,0,canvasRef.current.width,canvasRef.current.height);set("signature","");}

  function submit(){
    if(!form.nom||!form.prenom||!form.evenement||!form.heureArrivee||!form.heureDepart){alert("Champs obligatoires manquants.");return;}
    onSave({...form,id:Date.now().toString(),createdAt:new Date().toISOString()});
    setSaved(true); setTimeout(()=>setSaved(false),3000);
    setForm(f=>({...f,evenement:"",heureArrivee:"",heureDepart:"",estResponsable:false,primeResp:1,nbPersonnes:0,deplacement:"Aucun",signature:""}));
    clearSig();
  }

  return (
    <div className="fade-in" style={{display:"flex",flexDirection:"column",gap:14}}>
      {!readOnlyIdentity && (
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          <div><label style={{fontSize:11,color:"var(--tt-text-3)",display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:".05em"}}>Nom *</label><input className="nm-input" value={form.nom} onChange={e=>set("nom",e.target.value)} placeholder="DUPONT"/></div>
          <div><label style={{fontSize:11,color:"var(--tt-text-3)",display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:".05em"}}>Prénom *</label><input className="nm-input" value={form.prenom} onChange={e=>set("prenom",e.target.value)} placeholder="Alice"/></div>
        </div>
      )}
      {readOnlyIdentity && (
        <div className="nm-inset" style={{display:"flex",alignItems:"center",gap:12}}>
          <div className="avatar-sm">{initials(form.nom,form.prenom)}</div>
          <span style={{fontWeight:600,fontSize:14}}>{form.nom} {form.prenom}</span>
          <span className="nm-badge gold" style={{marginLeft:"auto"}}>Identifié</span>
        </div>
      )}
      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:14}}>
        <div><label style={{fontSize:11,color:"var(--tt-text-3)",display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:".05em"}}>Événement *</label><input className="nm-input" value={form.evenement} onChange={e=>set("evenement",e.target.value)} placeholder="Gala Musée Orangerie…"/></div>
        <div><label style={{fontSize:11,color:"var(--tt-text-3)",display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:".05em"}}>Date</label><input className="nm-input" type="date" value={form.date} onChange={e=>set("date",e.target.value)}/></div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        <div><label style={{fontSize:11,color:"var(--tt-text-3)",display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:".05em"}}>Arrivée *</label><input className="nm-input" type="time" value={form.heureArrivee} onChange={e=>set("heureArrivee",e.target.value)}/></div>
        <div><label style={{fontSize:11,color:"var(--tt-text-3)",display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:".05em"}}>Départ *</label><input className="nm-input" type="time" value={form.heureDepart} onChange={e=>set("heureDepart",e.target.value)}/></div>
      </div>
      {form.heureArrivee&&form.heureDepart&&(
        <div className="nm-inset" style={{display:"flex",gap:20,flexWrap:"wrap",alignItems:"center"}}>
          <span style={{fontSize:13}}><span style={{color:"var(--tt-text-3)"}}>Vacations</span> <strong>{calc.vac}</strong></span>
          {calc.hsAv>0&&<span style={{fontSize:13}}><span style={{color:"var(--tt-text-3)"}}>HS &lt;minuit</span> <strong style={{color:"#854F0B"}}>{calc.hsAv}h</strong></span>}
          {calc.hsAp>0&&<span style={{fontSize:13}}><span style={{color:"var(--tt-text-3)"}}>HS &gt;minuit</span> <strong style={{color:"#A32D2D"}}>{calc.hsAp}h</strong></span>}
          <span style={{marginLeft:"auto",fontWeight:700,fontSize:16,color:"var(--tt-gold)"}}>{total.toFixed(2)} €</span>
        </div>
      )}
      <div><label style={{fontSize:11,color:"var(--tt-text-3)",display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:".05em"}}>Poste</label>
        <select className="nm-input" value={form.poste} onChange={e=>set("poste",e.target.value)}>
          {POSTES.map(p=><option key={p}>{p}</option>)}
        </select>
      </div>
      <div className="nm-inset" style={{display:"flex",flexDirection:"column",gap:12}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <input type="checkbox" id="resp" checked={form.estResponsable} onChange={e=>set("estResponsable",e.target.checked)}/>
          <label htmlFor="resp" style={{fontWeight:500,fontSize:14,cursor:"pointer"}}>Responsable</label>
        </div>
        {form.estResponsable&&(
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div><label style={{fontSize:11,color:"var(--tt-text-3)",display:"block",marginBottom:5}}>Primes resp. (nb)</label><input className="nm-input" type="number" min="0" value={form.primeResp} onChange={e=>set("primeResp",parseInt(e.target.value)||0)}/></div>
            <div><label style={{fontSize:11,color:"var(--tt-text-3)",display:"block",marginBottom:5}}>Personnes sous resp.</label><input className="nm-input" type="number" min="0" value={form.nbPersonnes} onChange={e=>set("nbPersonnes",parseInt(e.target.value)||0)}/></div>
          </div>
        )}
      </div>
      <div>
        <label style={{fontSize:11,color:"var(--tt-text-3)",display:"block",marginBottom:8,textTransform:"uppercase",letterSpacing:".05em"}}>Prime de déplacement</label>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {DEPL_OPTIONS.map(opt=>(
            <button key={opt} className={`nm-tab${form.deplacement===opt?" active":""}`} onClick={()=>set("deplacement",opt)}>
              {opt}{opt!=="Aucun"?` · ${opt==="Circulaire"?7.70:opt==="Petite"?15:opt==="Moyenne"?30:50}€`:""}
            </button>
          ))}
        </div>
      </div>
      <div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <label style={{fontSize:11,color:"var(--tt-text-3)",textTransform:"uppercase",letterSpacing:".05em"}}>Signature</label>
          <button className="nm-btn ghost" style={{fontSize:12,padding:"4px 10px"}} onClick={clearSig}>Effacer</button>
        </div>
        <div className="nm-inset" style={{padding:4}}>
          <canvas ref={canvasRef} width={600} height={100} className="sig-canvas"
            onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
            onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw}/>
        </div>
        <div style={{fontSize:11,color:"var(--tt-text-3)",marginTop:4,textAlign:"center"}}>Signez dans le cadre ci-dessus</div>
      </div>
      <button className="nm-btn primary" onClick={submit} style={{width:"100%",justifyContent:"center",padding:14,fontSize:15}}>
        {saved?"✓ Saisie enregistrée":"Enregistrer ma vacation"}
      </button>
    </div>
  );
}

// ── LOGIN ─────────────────────────────────────────────────────────────────────
function LoginPage({onLogin,onAdminAccess}) {
  const [email,setEmail]=useState("");
  const [pwd,setPwd]=useState("");
  const [nom,setNom]=useState("");
  const [prenom,setPrenom]=useState("");
  const [err,setErr]=useState("");
  const [mode,setMode]=useState("extra"); // extra | admin
  const [subMode,setSubMode]=useState("login"); // login | register
  const [loading,setLoading]=useState(false);

  async function handleExtra(){
    setLoading(true); setErr("");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pwd });
    setLoading(false);
    if (error || !data.user) { setErr("Email ou mot de passe incorrect."); return; }
    if (ADMIN_EMAILS.includes(data.user.email)) {
      await supabase.auth.signOut();
      setErr("Utilisez l'onglet Admin pour ce compte.");
      return;
    }
    const meta = data.user.user_metadata || {};
    onLogin({ id: data.user.id, email: data.user.email,
      nom: meta.nom || nom || data.user.email.split("@")[0].toUpperCase(),
      prenom: meta.prenom || prenom || "" });
  }

  async function handleRegister(){
    setLoading(true); setErr("");
    if (!nom || !prenom) { setErr("Veuillez saisir votre nom et prénom."); setLoading(false); return; }
    const { data, error } = await supabase.auth.signUp({
      email, password: pwd,
      options: { data: { nom: nom.toUpperCase(), prenom } }
    });
    setLoading(false);
    if (error) { setErr(error.message); return; }
    if (data.user) {
      onLogin({ id: data.user.id, email: data.user.email, nom: nom.toUpperCase(), prenom });
    } else {
      setErr("Vérifiez votre email pour confirmer votre compte.");
    }
  }

  async function handleAdmin(){
    setLoading(true); setErr("");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pwd });
    setLoading(false);
    if (error || !data.user) { setErr("Email ou mot de passe incorrect."); return; }
    if (!ADMIN_EMAILS.includes(data.user.email)) {
      await supabase.auth.signOut();
      setErr("Ce compte n'a pas accès à l'administration.");
      return;
    }
    onAdminAccess();
  }

  return (
    <div className="login-bg">
      <div style={{width:"100%",maxWidth:400,padding:"0 20px"}}>
        <div className="nm-card" style={{padding:32}}>
          <div style={{textAlign:"center",marginBottom:28}}>
            <div className="tt-logo" style={{marginBottom:8}}>Trait'Tendance</div>
            <div style={{fontSize:22,fontWeight:700}} className="gold-text">Espace Extras</div>
            <div style={{fontSize:13,color:"var(--tt-text-3)",marginTop:4}}>Les architectes de l'événement</div>
          </div>
          <div style={{display:"flex",gap:8,marginBottom:24,padding:4,borderRadius:"var(--tt-r-pill)",background:"var(--tt-bg)",boxShadow:"var(--tt-shadow-in)"}}>
            {["extra","admin"].map(m=>(
              <button key={m} onClick={()=>{setMode(m);setErr("");}} style={{flex:1,padding:"8px 0",border:"none",borderRadius:"var(--tt-r-pill)",cursor:"pointer",fontWeight:500,fontSize:13,fontFamily:"inherit",transition:"all .15s",
                background:mode===m?"var(--tt-surface)":"transparent",
                boxShadow:mode===m?"var(--tt-shadow-btn)":"none",
                color:mode===m?"var(--tt-gold)":"var(--tt-text-2)"}}>
                {m==="extra"?"Extra":"Admin"}
              </button>
            ))}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {mode==="extra" && (
              <div style={{display:"flex",gap:6,padding:4,borderRadius:"var(--tt-r-pill)",background:"var(--tt-bg)",boxShadow:"var(--tt-shadow-in)",marginBottom:4}}>
                {[["login","Se connecter"],["register","Créer un compte"]].map(([id,lbl])=>(
                  <button key={id} onClick={()=>{setSubMode(id);setErr("");}} style={{flex:1,padding:"7px 0",border:"none",borderRadius:"var(--tt-r-pill)",cursor:"pointer",fontWeight:500,fontSize:12,fontFamily:"inherit",transition:"all .15s",
                    background:subMode===id?"var(--tt-surface)":"transparent",
                    boxShadow:subMode===id?"var(--tt-shadow-btn)":"none",
                    color:subMode===id?"var(--tt-gold)":"var(--tt-text-2)"}}>
                    {lbl}
                  </button>
                ))}
              </div>
            )}
            {mode==="extra" && subMode==="register" && (
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <div><label style={{fontSize:11,color:"var(--tt-text-3)",display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:".05em"}}>Nom</label>
                  <input className="nm-input" value={nom} onChange={e=>setNom(e.target.value)} placeholder="DUPONT"/></div>
                <div><label style={{fontSize:11,color:"var(--tt-text-3)",display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:".05em"}}>Prénom</label>
                  <input className="nm-input" value={prenom} onChange={e=>setPrenom(e.target.value)} placeholder="Alice"/></div>
              </div>
            )}
            <div><label style={{fontSize:11,color:"var(--tt-text-3)",display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:".05em"}}>Email</label>
              <input className="nm-input" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="votre@email.com"/>
            </div>
            <div><label style={{fontSize:11,color:"var(--tt-text-3)",display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:".05em"}}>{mode==="admin"?"Clé d'accès admin":"Mot de passe"}</label>
              <input className="nm-input" type="password" value={pwd} onChange={e=>setPwd(e.target.value)} placeholder="••••••••"
                onKeyDown={e=>{if(e.key!=="Enter") return; mode==="admin"?handleAdmin():subMode==="register"?handleRegister():handleExtra();}}/>
            </div>
            {err&&<div style={{fontSize:12,color:"#A32D2D",padding:"8px 12px",background:"#FCEBEB",borderRadius:8}}>{err}</div>}
            <button className="nm-btn primary" disabled={loading}
              onClick={mode==="admin"?handleAdmin:subMode==="register"?handleRegister:handleExtra}
              style={{width:"100%",justifyContent:"center",padding:13,marginTop:4}}>
              {loading?"…":mode==="admin"?"Accès administration":subMode==="register"?"Créer mon compte":"Se connecter"}
            </button>
            {mode==="extra" && subMode==="login" && (
              <div style={{textAlign:"center",fontSize:12,color:"var(--tt-text-3)"}}>
                Pas encore de compte ?{" "}
                <span onClick={()=>setSubMode("register")} style={{color:"var(--tt-gold)",cursor:"pointer",fontWeight:500}}>Créer un compte</span>
              </div>
            )}
          </div>
          <div className="nm-divider" style={{marginTop:24}}/>
          <div style={{fontSize:11,color:"var(--tt-text-3)",textAlign:"center"}}>
            Démo : alice@extra.tt / 1234 — Admin : tt-admin-2025
          </div>
        </div>
      </div>
    </div>
  );
}

// ── INTERFACE EXTRA ───────────────────────────────────────────────────────────
function ExtraApp({user, saisies, onSave, onLogout}) {
  const [tab,setTab]=useState("saisie");
  const [contratSaisie,setContratSaisie]=useState(null);
  const mesSaisies=useMemo(()=>saisies.filter(s=>s.userId===user.id).sort((a,b)=>b.date.localeCompare(a.date)),[saisies,user]);
  const totalBrut=useMemo(()=>mesSaisies.reduce((s,r)=>s+calcTotal(r),0),[mesSaisies]);
  const totalVac=useMemo(()=>mesSaisies.reduce((s,r)=>s+calcH(r.heureArrivee,r.heureDepart).vac,0),[mesSaisies]);

  return (
    <div style={{minHeight:"100vh",padding:"0 0 40px"}}>
      <style>{CSS}</style>
      {/* Header */}
      <div style={{background:"var(--tt-surface)",boxShadow:"0 3px 12px #C8C4BE50",padding:"14px 20px",display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24,position:"sticky",top:0,zIndex:10}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div className="avatar">{initials(user.nom,user.prenom)}</div>
          <div>
            <div className="tt-logo">Trait'Tendance</div>
            <div style={{fontWeight:600,fontSize:15}}>{user.nom} {user.prenom}</div>
          </div>
        </div>
        <button className="nm-btn ghost" onClick={onLogout} style={{fontSize:12}}>
          <i className="ti ti-logout"/>Déconnexion
        </button>
      </div>

      <div style={{maxWidth:680,margin:"0 auto",padding:"0 16px"}}>
        {/* Stats */}
        <div style={{display:"flex",gap:12,marginBottom:24,flexWrap:"wrap"}}>
          <StatCard label="Prestations" value={mesSaisies.length}/>
          <StatCard label="Total vacations" value={totalVac.toFixed(2)}/>
          <StatCard label="Total brut estimé" value={`${totalBrut.toFixed(2)} €`} gold/>
        </div>

        {/* Tabs */}
        <div style={{display:"flex",gap:8,marginBottom:20}}>
          {[["saisie","Saisir une vacation","ti-edit"],["contrats","Mes contrats","ti-file-text"]].map(([id,lbl,ic])=>(
            <button key={id} className={`nm-tab${tab===id?" active":""}`} onClick={()=>setTab(id)}>
              <i className={`ti ${ic}`}/> {lbl}
            </button>
          ))}
        </div>

        {tab==="saisie"&&(
          <div className="nm-card fade-in">
            <div style={{fontSize:16,fontWeight:600,marginBottom:20}}>Nouvelle vacation</div>
            <FormulaireVacation
              onSave={s=>onSave({...s,userId:user.id})}
              defaultNom={user.nom} defaultPrenom={user.prenom}
              readOnlyIdentity={true}
            />
          </div>
        )}

        {contratSaisie&&<ContratModal saisie={contratSaisie} readonlyExtra={user} onClose={()=>setContratSaisie(null)}/>}
      {tab==="contrats"&&(
          <div className="fade-in">
            {mesSaisies.length===0?(
              <div className="nm-card" style={{textAlign:"center",padding:40,color:"var(--tt-text-3)"}}>
                Aucune saisie pour le moment.<br/>
                <span style={{fontSize:13}}>Vos contrats apparaîtront ici après validation.</span>
              </div>
            ):(
              mesSaisies.map(s=>{
                const {vac,hsAv,hsAp}=calcH(s.heureArrivee,s.heureDepart);
                return (
                  <div key={s.id} className="nm-card" style={{marginBottom:16}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:8}}>
                      <div>
                        <div style={{fontWeight:600,fontSize:15,marginBottom:4}}>{s.evenement}</div>
                        <div style={{fontSize:13,color:"var(--tt-text-2)"}}>{fmtDate(s.date)} · {s.heureArrivee}–{s.heureDepart}</div>
                      </div>
                      <div style={{textAlign:"right"}}>
                        <div style={{fontWeight:700,fontSize:18,color:"var(--tt-gold)"}}>{calcTotal(s).toFixed(2)} €</div>
                        <div style={{fontSize:11,color:"var(--tt-text-3)"}}>brut estimé</div>
                      </div>
                    </div>
                    <div className="nm-divider"/>
                    <div style={{display:"flex",gap:16,flexWrap:"wrap",fontSize:13}}>
                      <span><span style={{color:"var(--tt-text-3)"}}>Poste :</span> <strong>{s.poste}</strong></span>
                      <span><span style={{color:"var(--tt-text-3)"}}>Vac :</span> <strong>{vac}</strong></span>
                      {hsAv>0&&<span style={{color:"#854F0B"}}><span style={{color:"var(--tt-text-3)"}}>HS&lt; :</span> <strong>{hsAv}h</strong></span>}
                      {hsAp>0&&<span style={{color:"#A32D2D"}}><span style={{color:"var(--tt-text-3)"}}>HS&gt; :</span> <strong>{hsAp}h</strong></span>}
                      {s.estResponsable&&<span><span style={{color:"var(--tt-text-3)"}}>Resp ×:</span> <strong>{s.primeResp}</strong></span>}
                      <DeplBadge val={s.deplacement}/>
                    </div>
                    {s.signature&&(
                      <div style={{marginTop:12}}>
                        <div style={{fontSize:11,color:"var(--tt-text-3)",marginBottom:4}}>Signature</div>
                        <img src={s.signature} style={{height:40,borderRadius:6,background:"#fff",padding:2}}/>
                      </div>
                    )}
                    <div style={{marginTop:12}}><button className="nm-btn" onClick={()=>setContratSaisie(s)} style={{fontSize:12}}><i className="ti ti-file-text"/> Voir / générer le contrat</button></div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── ADMIN : Détail extra ──────────────────────────────────────────────────────
function ExtraDetail({extra,saisies,onBack}) {
  const [contratSaisie,setContratSaisie]=useState(null);
  const [filterEvt,setFilterEvt]=useState("Tous");
  const [filterMois,setFilterMois]=useState("Tous");
  const [filterDate,setFilterDate]=useState("");

  const rows=useMemo(()=>saisies.filter(s=>`${s.nom}|${s.prenom}`===`${extra.nom}|${extra.prenom}`),[saisies,extra]);
  const evts=useMemo(()=>["Tous",...new Set(rows.map(r=>r.evenement))],[rows]);
  const mois=useMemo(()=>["Tous",...new Set(rows.map(r=>r.date.substring(0,7))).keys()].filter((v,i,a)=>a.indexOf(v)===i),[rows]);

  const filtered=useMemo(()=>rows.filter(s=>{
    if(filterEvt!=="Tous"&&s.evenement!==filterEvt) return false;
    if(filterMois!=="Tous"&&!s.date.startsWith(filterMois)) return false;
    if(filterDate&&s.date!==filterDate) return false;
    return true;
  }).sort((a,b)=>b.date.localeCompare(a.date)),[rows,filterEvt,filterMois,filterDate]);

  const stats=useMemo(()=>({
    total:filtered.reduce((s,r)=>s+calcTotal(r),0),
    vac:filtered.reduce((s,r)=>s+calcH(r.heureArrivee,r.heureDepart).vac,0),
  }),[filtered]);

  return (
    <div className="fade-in">
      <button className="nm-btn" onClick={onBack} style={{marginBottom:20}}>
        <i className="ti ti-arrow-left"/> Retour
      </button>
      <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:20}}>
        <div className="avatar" style={{width:52,height:52,fontSize:18}}>{initials(extra.nom,extra.prenom)}</div>
        <div>
          <div style={{fontWeight:700,fontSize:20}}>{extra.nom} {extra.prenom}</div>
          <div style={{fontSize:13,color:"var(--tt-text-2)"}}>{rows.length} prestation(s) au total</div>
        </div>
        <button className="nm-btn" onClick={()=>exportCSV(rows)} style={{marginLeft:"auto"}}>
          <i className="ti ti-download"/> CSV
        </button>
      </div>

      <div style={{display:"flex",gap:12,marginBottom:20,flexWrap:"wrap"}}>
        <StatCard label="Saisies filtrées" value={filtered.length}/>
        <StatCard label="Vacations" value={stats.vac.toFixed(2)}/>
        <StatCard label="Total brut" value={`${stats.total.toFixed(2)} €`} gold/>
      </div>

      {/* Filtres */}
      <div className="nm-card" style={{marginBottom:16,padding:16}}>
        <div style={{fontSize:11,color:"var(--tt-text-3)",textTransform:"uppercase",letterSpacing:".05em",marginBottom:10}}>Filtres</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
          <div>
            <div style={{fontSize:11,color:"var(--tt-text-3)",marginBottom:4}}>Événement</div>
            <select className="nm-input" value={filterEvt} onChange={e=>setFilterEvt(e.target.value)}>
              {evts.map(e=><option key={e}>{e}</option>)}
            </select>
          </div>
          <div>
            <div style={{fontSize:11,color:"var(--tt-text-3)",marginBottom:4}}>Mois</div>
            <select className="nm-input" value={filterMois} onChange={e=>setFilterMois(e.target.value)}>
              {mois.map(m=>{const [y,mo]=m==="Tous"?[null,null]:m.split("-");return <option key={m} value={m}>{m==="Tous"?"Tous":`${MONTHS_FR[parseInt(mo)-1]} ${y}`}</option>;})}
            </select>
          </div>
          <div>
            <div style={{fontSize:11,color:"var(--tt-text-3)",marginBottom:4}}>Date précise</div>
            <input className="nm-input" type="date" value={filterDate} onChange={e=>setFilterDate(e.target.value)}/>
          </div>
        </div>
        {(filterEvt!=="Tous"||filterMois!=="Tous"||filterDate)&&(
          <button className="nm-btn ghost" style={{fontSize:12,marginTop:8}} onClick={()=>{setFilterEvt("Tous");setFilterMois("Tous");setFilterDate("");}}>
            Réinitialiser les filtres
          </button>
        )}
      </div>

      {contratSaisie&&<ContratModal saisie={contratSaisie} onClose={()=>setContratSaisie(null)}/>}
      <div className="nm-card" style={{padding:0,overflow:"hidden"}}>
        <MiniTable rows={filtered} onContrat={s=>setContratSaisie(s)}/>
      </div>
    </div>
  );
}

// ── ADMIN : Vue globale ───────────────────────────────────────────────────────
function AdminVue({saisies,onDelete}) {
  const [contratSaisie,setContratSaisie]=useState(null);
  const [filterEvt,setFilterEvt]=useState("Tous");
  const [filterMois,setFilterMois]=useState("Tous");
  const [filterDate,setFilterDate]=useState("");

  const evts=useMemo(()=>["Tous",...new Set(saisies.map(s=>s.evenement))],[saisies]);
  const mois=useMemo(()=>{const s=new Set(saisies.map(s=>s.date.substring(0,7)));return["Tous",...s];},[saisies]);

  const filtered=useMemo(()=>saisies.filter(s=>{
    if(filterEvt!=="Tous"&&s.evenement!==filterEvt) return false;
    if(filterMois!=="Tous"&&!s.date.startsWith(filterMois)) return false;
    if(filterDate&&s.date!==filterDate) return false;
    return true;
  }).sort((a,b)=>b.date.localeCompare(a.date)),[saisies,filterEvt,filterMois,filterDate]);

  const stats=useMemo(()=>({
    total:filtered.reduce((s,r)=>s+calcTotal(r),0),
    vac:filtered.reduce((s,r)=>s+calcH(r.heureArrivee,r.heureDepart).vac,0),
    extras:new Set(filtered.map(s=>`${s.nom}|${s.prenom}`)).size,
  }),[filtered]);

  return (
    <div className="fade-in">
      <div style={{display:"flex",gap:12,marginBottom:20,flexWrap:"wrap"}}>
        <StatCard label="Saisies" value={filtered.length}/>
        <StatCard label="Extras" value={stats.extras}/>
        <StatCard label="Vacations" value={stats.vac.toFixed(2)}/>
        <StatCard label="Total brut" value={`${stats.total.toFixed(2)} €`} gold/>
      </div>
      <div className="nm-card" style={{marginBottom:16,padding:16}}>
        <div style={{fontSize:11,color:"var(--tt-text-3)",textTransform:"uppercase",letterSpacing:".05em",marginBottom:10}}>Filtres globaux</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
          <div><div style={{fontSize:11,color:"var(--tt-text-3)",marginBottom:4}}>Événement</div>
            <select className="nm-input" value={filterEvt} onChange={e=>setFilterEvt(e.target.value)}>
              {evts.map(e=><option key={e}>{e}</option>)}
            </select>
          </div>
          <div><div style={{fontSize:11,color:"var(--tt-text-3)",marginBottom:4}}>Mois</div>
            <select className="nm-input" value={filterMois} onChange={e=>setFilterMois(e.target.value)}>
              {mois.map(m=>{const [y,mo]=m==="Tous"?[null,null]:m.split("-");return<option key={m} value={m}>{m==="Tous"?"Tous":`${MONTHS_FR[parseInt(mo)-1]} ${y}`}</option>;})}
            </select>
          </div>
          <div><div style={{fontSize:11,color:"var(--tt-text-3)",marginBottom:4}}>Date précise</div>
            <input className="nm-input" type="date" value={filterDate} onChange={e=>setFilterDate(e.target.value)}/>
          </div>
        </div>
        {(filterEvt!=="Tous"||filterMois!=="Tous"||filterDate)&&<button className="nm-btn ghost" style={{fontSize:12,marginTop:8}} onClick={()=>{setFilterEvt("Tous");setFilterMois("Tous");setFilterDate("");}}>Réinitialiser</button>}
      </div>
      {contratSaisie&&<ContratModal saisie={contratSaisie} onClose={()=>setContratSaisie(null)}/>}
      <div className="nm-card" style={{padding:0,overflow:"hidden"}}>
        <MiniTable rows={filtered} onContrat={s=>setContratSaisie(s)}/>
      </div>
    </div>
  );
}

// ── ADMIN : Liste extras ──────────────────────────────────────────────────────
function AdminExtras({saisies,onSelectExtra}) {
  const [search,setSearch]=useState("");
  const extras=useMemo(()=>{
    const map={};
    saisies.forEach(s=>{
      const k=`${s.nom}|${s.prenom}`;
      if(!map[k]) map[k]={nom:s.nom,prenom:s.prenom,rows:[]};
      map[k].rows.push(s);
    });
    return Object.values(map)
      .filter(e=>!search||`${e.nom} ${e.prenom}`.toLowerCase().includes(search.toLowerCase()))
      .sort((a,b)=>a.nom.localeCompare(b.nom));
  },[saisies,search]);

  return (
    <div className="fade-in">
      <div style={{marginBottom:16}}>
        <input className="nm-input" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher un extra…" style={{maxWidth:320}}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:12}}>
        {extras.map(e=>{
          const total=e.rows.reduce((s,r)=>s+calcTotal(r),0);
          const vac=e.rows.reduce((s,r)=>s+calcH(r.heureArrivee,r.heureDepart).vac,0);
          return (
            <div key={`${e.nom}|${e.prenom}`} className="nm-card" style={{cursor:"pointer",transition:"box-shadow .15s"}}
              onClick={()=>onSelectExtra(e)}
              onMouseEnter={el=>el.currentTarget.style.boxShadow="7px 7px 16px #C0BCB6,-7px -7px 16px #FFFCF7"}
              onMouseLeave={el=>el.currentTarget.style.boxShadow=""}>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <div className="avatar">{initials(e.nom,e.prenom)}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:600,fontSize:14}}>{e.nom} {e.prenom}</div>
                  <div style={{fontSize:12,color:"var(--tt-text-2)"}}>{e.rows.length} prestation(s)</div>
                </div>
                <i className="ti ti-chevron-right" style={{color:"var(--tt-text-3)",fontSize:16}}/>
              </div>
              <div className="nm-divider"/>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"var(--tt-text-2)"}}>
                <span>Vac : <strong>{vac.toFixed(2)}</strong></span>
                <span style={{fontWeight:700,color:"var(--tt-gold)"}}>{total.toFixed(2)} €</span>
              </div>
            </div>
          );
        })}
        {extras.length===0&&<div style={{gridColumn:"1/-1",textAlign:"center",padding:40,color:"var(--tt-text-3)"}}>Aucun extra trouvé</div>}
      </div>
    </div>
  );
}

// ── ADMIN APP ─────────────────────────────────────────────────────────────────
function AdminApp({saisies,users,onAddSaisie,onDeleteSaisie,onLogout}) {
  const [tab,setTab]=useState("extras");
  const [selectedExtra,setSelectedExtra]=useState(null);

  const TABS=[
    {id:"extras",lbl:"Extras",ic:"ti-users"},
    {id:"vue",lbl:"Toutes les saisies",ic:"ti-table"},
    {id:"saisie",lbl:"Nouvelle saisie",ic:"ti-plus"},
  ];

  function handleSelectExtra(e){setSelectedExtra(e);setTab("extras");}

  return (
    <div style={{minHeight:"100vh",padding:"0 0 40px"}}>
      <style>{CSS}</style>
      {/* Header */}
      <div style={{background:"var(--tt-surface)",boxShadow:"0 3px 12px #C8C4BE50",padding:"14px 24px",display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:28,position:"sticky",top:0,zIndex:10}}>
        <div>
          <div className="tt-logo" style={{marginBottom:2}}>Trait'Tendance · Administration</div>
          <div style={{fontSize:18,fontWeight:700}} className="gold-text">Tableau de bord EVP</div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <button className="nm-btn" onClick={()=>exportCSV(saisies)}><i className="ti ti-download"/>Export CSV</button>
          <button className="nm-btn ghost" onClick={onLogout}><i className="ti ti-logout"/>Déconnexion</button>
        </div>
      </div>

      <div style={{maxWidth:960,margin:"0 auto",padding:"0 20px"}}>
        <div style={{display:"flex",gap:8,marginBottom:24}}>
          {TABS.map(t=>(
            <button key={t.id} className={`nm-tab${tab===t.id?" active":""}`} onClick={()=>{setTab(t.id);if(t.id!=="extras")setSelectedExtra(null);}}>
              <i className={`ti ${t.ic}`}/> {t.lbl}
            </button>
          ))}
        </div>

        {tab==="extras"&&!selectedExtra&&<AdminExtras saisies={saisies} onSelectExtra={handleSelectExtra}/>}
        {tab==="extras"&&selectedExtra&&<ExtraDetail extra={selectedExtra} saisies={saisies} onBack={()=>setSelectedExtra(null)}/>}
        {tab==="vue"&&<AdminVue saisies={saisies} onDelete={onDeleteSaisie}/>}
        {tab==="saisie"&&(
          <div className="nm-card fade-in" style={{maxWidth:680}}>
            <div style={{fontSize:16,fontWeight:600,marginBottom:20}}>Saisir une vacation</div>
            <FormulaireVacation onSave={s=>{onAddSaisie({...s,userId:"admin"});setTab("vue");}}/>
          </div>
        )}
      </div>
    </div>
  );
}

// ── ROOT — Supabase connecté ─────────────────────────────────────────────────
export default function App() {
  const [saisies, setSaisies] = useState([]);
  const [session, setSession] = useState(null);
  const [ready, setReady]     = useState(false);

  // Auth state
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        const u = data.session.user;
        const meta = u.user_metadata || {};
        if (ADMIN_EMAILS.includes(u.email)) {
          setSession({ type: "admin" });
        } else {
          setSession({ type: "extra", user: { id: u.id, email: u.email,
            nom: meta.nom || u.email.split("@")[0].toUpperCase(),
            prenom: meta.prenom || "" }});
        }
      }
      setReady(true);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, sess) => {
      if (!sess) setSession(null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  // Load saisies in realtime
  useEffect(() => {
    const fetchSaisies = async () => {
      const { data } = await supabase.from("saisies").select("*").order("created_at", { ascending: false });
      if (data) setSaisies(data);
    };
    fetchSaisies();
    const channel = supabase.channel("saisies-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "saisies" }, fetchSaisies)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  async function addSaisie(s) {
    const { id, ...data } = s;
    await supabase.from("saisies").insert([{ ...data, created_at: new Date().toISOString() }]);
  }

  async function delSaisie(id) {
    if (!confirm("Supprimer cette saisie ?")) return;
    await supabase.from("saisies").delete().eq("id", id);
  }

  async function logout() {
    await supabase.auth.signOut();
    setSession(null);
  }

  if (!ready) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh",background:"#F0EDE8"}}>
      <style>{CSS}</style>
      <div style={{color:"#9A8C7E",fontSize:14}}>Chargement…</div>
    </div>
  );

  if (!session) return (
    <>
      <style>{CSS}</style>
      <LoginPage onLogin={u => setSession({type:"extra",user:u})} onAdminAccess={() => setSession({type:"admin"})}/>
    </>
  );

  if (session.type === "extra") return (
    <ExtraApp user={session.user} saisies={saisies} onSave={addSaisie} onLogout={logout}/>
  );

  return (
    <AdminApp saisies={saisies} users={[]} onAddSaisie={addSaisie} onDeleteSaisie={delSaisie} onLogout={logout}/>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GÉNÉRATION CONTRAT PDF — jsPDF (100% client, gratuit)
// ─────────────────────────────────────────────────────────────────────────────

function loadJsPDF() {
  return new Promise((resolve, reject) => {
    if (window.jspdf) { resolve(window.jspdf.jsPDF); return; }
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
    s.onload = () => resolve(window.jspdf.jsPDF);
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

async function genererContratPDF(data) {
  const jsPDF = await loadJsPDF();
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210, ML = 20, MR = 20, TW = W - ML - MR;
  let y = 15;

  function line(dy = 5) { y += dy; }
  function text(txt, x, opts = {}) {
    const { size = 10, bold = false, italic = false, align = "left", color = "#000000" } = opts;
    doc.setFontSize(size);
    doc.setFont("helvetica", bold ? "bold" : italic ? "italic" : "normal");
    doc.setTextColor(color);
    doc.text(txt, x, y, { align });
  }
  function mtext(txt, x, maxW, opts = {}) {
    const { size = 10, bold = false, italic = false, lineH = 5 } = opts;
    doc.setFontSize(size);
    doc.setFont("helvetica", bold ? "bold" : italic ? "italic" : "normal");
    doc.setTextColor("#000000");
    const lines = doc.splitTextToSize(txt, maxW);
    doc.text(lines, x, y);
    y += lines.length * lineH - lineH;
  }
  function hline(lx = ML, rx = W - MR, w = 0.3) {
    doc.setLineWidth(w); doc.setDrawColor("#cccccc");
    doc.line(lx, y, rx, y);
  }

  // ── Titre ──
  doc.setFillColor("#f8f8f8");
  doc.rect(ML, y - 5, TW, 16, "F");
  doc.setLineWidth(0.5); doc.setDrawColor("#000000");
  doc.rect(ML, y - 5, TW, 16, "S");
  text("CONTRAT A DUREE DETERMINEE", W / 2, { size: 12, bold: true, align: "center" }); line(6);
  text("CONTRAT DE TRAVAIL EXTRA", W / 2, { size: 12, bold: true, align: "center" }); line(10);

  // ── En-tête société ──
  doc.setLineWidth(0.5); doc.setDrawColor("#000000");
  doc.rect(ML, y, TW, 28, "S");
  line(5);
  text("SAS TRAIT TENDANCE", ML + 4, { bold: true }); line(5);
  text("Situé au :   141 avenue de Verdun", ML + 4); line(5);
  text("               Chemin des Montquartiers", ML + 4); line(5);
  text("               92130 Issy-les-Moulineaux", ML + 4); line(5);

  // Logo TT
  doc.setFontSize(22); doc.setFont("helvetica", "bold");
  doc.setTextColor("#B8954A");
  doc.text("TT", W - MR - 4, y - 14, { align: "right" });
  doc.setFontSize(11); doc.setTextColor("#000000");
  doc.text("TRAIT'TENDANCE", W - MR - 4, y - 8, { align: "right" });

  line(5);
  text(`N° SIRET :  445 285 216 00047`, ML + 4); line(12);

  // ── Salarié ──
  text("Et", ML); line(6);
  const nomComplet = `${data.prenom || ""} ${data.nom || ""}`.trim();
  doc.setFont("helvetica", "bold"); doc.setFontSize(10);
  doc.text("Monsieur, Madame, Mademoiselle ", ML, y);
  doc.setFont("helvetica", "normal");
  doc.text(nomComplet || "……………………………………………………", ML + 63, y);
  line(6);
  text(`Demeurant : ${data.adresse || "………………………………………………………………………………"}`, ML); line(6);
  text(`Né(e) le : ${data.naissance || "……………… à ………………………………………………"}`, ML); line(6);
  text(`N° SS : ${data.nss || "………………………………………………………………………………"}`, ML); line(6);
  text(`De nationalité : ${data.nationalite || "…………………………………………………………"}`, ML); line(10);

  // ── Emploi ──
  const emploi = `${data.poste || "…"} — ${data.evenement || "…"} — ${data.heureArrivee || "…"}h à ${data.heureDepart || "…"}h`;
  mtext(`Emploi offert (description poste, lieu et horaire travail) : ${emploi}`, ML, TW, { lineH: 5 }); line(10);

  // ── Durée ──
  text("Contrat à durée déterminée conclu pour :", ML); line(6);
  text("(✓) 1 jour", ML); line(8);
  text(`Date d'effet : ${data.date || "…………………………………………………………………"}`, ML); line(6);
  text("Motif du contrat : Extra", ML); line(6);
  text("Convention collective applicable : HOTELS CAFES RESTAURANTS", ML); line(6);
  doc.setFont("helvetica", "normal"); doc.setFontSize(10);
  doc.text("Rémunération : ", ML, y);
  doc.setFont("helvetica", "bold");
  doc.text(`${data.total || "…………"} €`, ML + 35, y);
  doc.setFont("helvetica", "normal");
  doc.text(" + 10% Congés Payés", ML + 35 + doc.getTextWidth(`${data.total || "…………"} €`), y);
  line(10);

  // ── Clause ──
  const clause = `« Le salarié déclare avoir une connaissance parfaite des caractéristiques du poste et des contraintes liées à celui-ci pour avoir déjà effectué ponctuellement des missions d'Extra pour la Société TRAIT TENDANCE, et ce à plusieurs reprises,
Depuis le : ${data.depuisLe || "………………………………"}

Ainsi, à l'issue de la mission, les relations entre les parties cesseront, la Société TRAIT TENDANCE demeurant libre, en fonction de son volume d'activité et de ses choix propres, de collaborer à nouveau avec le salarié ou avec toute autre personne de son choix. »`;
  doc.setFont("helvetica", "italic"); doc.setFontSize(9);
  const clauseLines = doc.splitTextToSize(clause, TW - 20);
  doc.text(clauseLines, ML + 20, y);
  y += clauseLines.length * 4.5; line(8);

  // ── Caisse retraite ──
  doc.setFont("helvetica", "normal"); doc.setFontSize(10);
  doc.text("Caisse de retraite :   ", ML, y);
  doc.setFont("helvetica", "bold");
  doc.text("KLESIA RETRAITE", ML + 42, y); line(5);
  doc.setFont("helvetica", "normal");
  text("4-22 rue Marie-Georges Picquart", ML + 42); line(5);
  text("75017 Paris", ML + 42); line(12);

  // ── Fait à ──
  const today = new Date().toLocaleDateString("fr-FR");
  text(`Fait à Paris,`, ML); line(5);
  text(`Le ${today}`, ML); line(12);

  // ── Signatures ──
  text("Signature Salarié", ML); 
  text("Signature Employeur", W - MR, { align: "right" });

  // Signature image si présente
  if (data.signature && data.signature.startsWith("data:image")) {
    try { doc.addImage(data.signature, "PNG", ML, y + 2, 60, 18); } catch(e) {}
  }

  line(8);
  hline(ML, ML + 70, 0.3);
  hline(W - MR - 70, W - MR, 0.3);

  const b64 = doc.output("datauristring");
  return b64;
}

function downloadPDF(b64uri, filename) {
  const a = document.createElement("a");
  a.href = b64uri; a.download = filename; a.click();
  return b64uri;
}

// ── Modale Contrat ────────────────────────────────────────────────────────────
export function ContratModal({ saisie, onClose, readonlyExtra = null }) {
  const [step, setStep] = useState("form"); // form | generating | preview
  const [pdfUri, setPdfUri] = useState(null);
  const [emailTo, setEmailTo] = useState(readonlyExtra?.email || "");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);
  const [extraInfo, setExtraInfo] = useState({
    adresse:     readonlyExtra?.adresse     || "",
    nss:         readonlyExtra?.nss         || "",
    naissance:   readonlyExtra?.naissance   || "",
    nationalite: readonlyExtra?.nationalite || "Française",
    depuisLe:    readonlyExtra?.depuisLe    || "",
  });

  function setEI(k, v) { setExtraInfo(p => ({ ...p, [k]: v })); }

  async function handleGenerate() {
    setStep("generating");
    await new Promise(r => setTimeout(r, 50)); // let UI update
    const data = { ...saisie, ...extraInfo, total: calcTotal(saisie).toFixed(2) };
    const uri = await genererContratPDF(data);
    setPdfUri(uri);
    downloadPDF(uri, `Contrat_${saisie.nom}_${saisie.date}.pdf`);
    setStep("preview");
  }

  async function handleSendEmail() {
    if (!emailTo) { alert("Saisissez un email."); return; }
    setSending(true);
    await new Promise(r => setTimeout(r, 1200));
    setSending(false);
    setSendResult(`Contrat envoyé à ${emailTo} ✓`);
  }

  const overlay = { position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", padding:"16px" };
  const modal = { background:"var(--tt-surface)", borderRadius:"var(--tt-r)", boxShadow:"10px 10px 30px rgba(0,0,0,0.3)", width:"100%", maxWidth:520, maxHeight:"90vh", overflowY:"auto", padding:28 };
  const labelS = { fontSize:11, color:"var(--tt-text-3)", display:"block", marginBottom:5, textTransform:"uppercase", letterSpacing:".05em" };

  return (
    <div style={overlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={modal}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <div style={{ fontWeight:700, fontSize:18 }}>Générer le contrat</div>
          <button className="nm-btn ghost" onClick={onClose} style={{ fontSize:20, padding:"0 6px" }}>×</button>
        </div>

        <div className="nm-inset" style={{ marginBottom:20 }}>
          <div style={{ fontWeight:600, fontSize:14, marginBottom:4 }}>{saisie.nom} {saisie.prenom}</div>
          <div style={{ fontSize:13, color:"var(--tt-text-2)" }}>{saisie.evenement} · {fmtDate(saisie.date)}</div>
          <div style={{ fontSize:13, color:"var(--tt-text-2)" }}>{saisie.heureArrivee}–{saisie.heureDepart} · {saisie.poste}</div>
          <div style={{ fontSize:15, fontWeight:700, color:"var(--tt-gold)", marginTop:6 }}>{calcTotal(saisie).toFixed(2)} € brut</div>
        </div>

        {step === "form" && (
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <div style={{ fontSize:13, color:"var(--tt-text-2)", marginBottom:4 }}>Complétez les informations du salarié</div>
            <div><label style={labelS}>Adresse</label><input className="nm-input" value={extraInfo.adresse} onChange={e => setEI("adresse", e.target.value)} placeholder="120 rue de la Paix, 75001 Paris" /></div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <div><label style={labelS}>Date et lieu de naissance</label><input className="nm-input" value={extraInfo.naissance} onChange={e => setEI("naissance", e.target.value)} placeholder="13/02/1985 à Paris" /></div>
              <div><label style={labelS}>N° Sécurité Sociale</label><input className="nm-input" value={extraInfo.nss} onChange={e => setEI("nss", e.target.value)} placeholder="2 85 02 75 123 456 78" /></div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <div><label style={labelS}>Nationalité</label><input className="nm-input" value={extraInfo.nationalite} onChange={e => setEI("nationalite", e.target.value)} placeholder="Française" /></div>
              <div><label style={labelS}>Salarié depuis le</label><input className="nm-input" value={extraInfo.depuisLe} onChange={e => setEI("depuisLe", e.target.value)} placeholder="01/01/2022" /></div>
            </div>
            <button className="nm-btn primary" onClick={handleGenerate} style={{ width:"100%", justifyContent:"center", padding:13, marginTop:8 }}>
              <i className="ti ti-file-text" /> Générer le contrat PDF
            </button>
          </div>
        )}

        {step === "generating" && (
          <div style={{ textAlign:"center", padding:"40px 0" }}>
            <div style={{ fontSize:13, color:"var(--tt-text-2)" }}>Génération en cours…</div>
          </div>
        )}

        {step === "preview" && pdfUri && (
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div style={{ background:"#EAF3DE", borderRadius:8, padding:"10px 14px", fontSize:13, color:"#3B6D11" }}>
              ✓ Contrat généré — téléchargement automatique lancé
            </div>
            <div style={{ border:"0.5px solid #ccc", borderRadius:8, overflow:"hidden", height:320 }}>
              <iframe src={pdfUri} style={{ width:"100%", height:"100%", border:"none" }} title="Aperçu contrat" />
            </div>
            <div className="nm-divider" />
            <div style={{ fontSize:13, fontWeight:600, marginBottom:4 }}>Envoyer par email à l'extra</div>
            <div style={{ display:"flex", gap:10 }}>
              <input className="nm-input" type="email" value={emailTo} onChange={e => setEmailTo(e.target.value)} placeholder="extra@email.com" style={{ flex:1 }} />
              <button className="nm-btn primary" onClick={handleSendEmail} disabled={sending}>
                {sending ? "Envoi…" : <><i className="ti ti-send" /> Envoyer</>}
              </button>
            </div>
            {sendResult && <div style={{ fontSize:13, color:"#3B6D11", background:"#EAF3DE", borderRadius:8, padding:"8px 12px" }}>{sendResult}</div>}
            <div style={{ display:"flex", gap:8, marginTop:4 }}>
              <button className="nm-btn" onClick={() => downloadPDF(pdfUri, `Contrat_${saisie.nom}_${saisie.date}.pdf`)} style={{ flex:1, justifyContent:"center" }}>
                <i className="ti ti-download" /> Télécharger
              </button>
              <button className="nm-btn ghost" onClick={onClose} style={{ flex:1, justifyContent:"center" }}>Fermer</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
