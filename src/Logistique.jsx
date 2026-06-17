import { useState, useMemo, useEffect } from "react";
import { supabase } from "./supabase.js";

// ── Constantes ────────────────────────────────────────────────────────────────
const POSTES_INTERNES = ["Logistique", "Cuisinier", "Plonge"];
const MONTHS_FR = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
const ADMIN_EMAILS_LOG = ["admin@trait-tendance.fr", "comptabilite@trait-tendance.com"];

const CSS_LOG = `
  :root {
    --tt-bg: #F0EDE8; --tt-surface: #F0EDE8;
    --tt-blue: #2A5F8F; --tt-blue-light: #4A7FAF; --tt-blue-dark: #1A3F6F;
    --tt-text: #2C2820; --tt-text-2: #6B5E4E; --tt-text-3: #9A8C7E;
    --tt-shadow-out: 5px 5px 12px #C8C4BE, -5px -5px 12px #FDFAF5;
    --tt-shadow-in: inset 3px 3px 8px #C8C4BE, inset -3px -3px 8px #FDFAF5;
    --tt-shadow-sm: 3px 3px 7px #C8C4BE, -3px -3px 7px #FDFAF5;
    --tt-shadow-btn: 4px 4px 10px #C0BCB6, -4px -4px 10px #FFFCF7;
    --tt-shadow-btn-press: inset 2px 2px 6px #C0BCB6, inset -2px -2px 6px #FFFCF7;
    --tt-r: 16px; --tt-r-sm: 10px; --tt-r-pill: 50px;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: var(--tt-bg); font-family: system-ui, sans-serif; }
  .nm-card { background: var(--tt-surface); border-radius: var(--tt-r); box-shadow: var(--tt-shadow-out); padding: 20px; }
  .nm-inset { background: var(--tt-bg); border-radius: var(--tt-r-sm); box-shadow: var(--tt-shadow-in); padding: 10px 14px; }
  .nm-btn { background: var(--tt-surface); border-radius: var(--tt-r-sm); box-shadow: var(--tt-shadow-btn); border: none; cursor: pointer; color: var(--tt-text); font-family: inherit; font-size: 13px; font-weight: 500; padding: 10px 18px; transition: box-shadow .15s; display: inline-flex; align-items: center; gap: 7px; }
  .nm-btn:active { box-shadow: var(--tt-shadow-btn-press); }
  .nm-btn.primary { background: linear-gradient(145deg, var(--tt-blue-light), var(--tt-blue-dark)); color: #fff; box-shadow: none; }
  .nm-btn.ghost { box-shadow: none; color: var(--tt-text-2); }
  .nm-input { background: var(--tt-bg); border-radius: var(--tt-r-sm); box-shadow: var(--tt-shadow-in); border: none; padding: 10px 14px; font-family: inherit; font-size: 13px; color: var(--tt-text); outline: none; width: 100%; }
  .nm-input:focus { box-shadow: inset 3px 3px 8px #C0BCB6, inset -3px -3px 8px #FFFCF7, 0 0 0 2px #4A7FAF40; }
  .nm-tab { background: var(--tt-surface); border: none; border-radius: var(--tt-r-pill); padding: 8px 16px; font-family: inherit; font-size: 13px; font-weight: 500; color: var(--tt-text-2); cursor: pointer; box-shadow: var(--tt-shadow-btn); transition: all .15s; }
  .nm-tab.active { box-shadow: var(--tt-shadow-btn-press); color: var(--tt-blue); background: var(--tt-bg); }
  .nm-divider { height: 0.5px; background: linear-gradient(90deg,transparent,#C8C4BE,transparent); margin: 14px 0; }
  .stat-card { background: var(--tt-surface); border-radius: var(--tt-r-sm); box-shadow: var(--tt-shadow-sm); padding: 14px 18px; flex: 1; min-width: 110px; }
  .avatar { width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(145deg, var(--tt-blue-light), var(--tt-blue-dark)); display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 600; font-size: 14px; flex-shrink: 0; }
  .tt-logo { font-size: 11px; letter-spacing: .12em; text-transform: uppercase; color: var(--tt-text-3); }
  @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
  .fade-in { animation: fadeIn .25s ease; }
  table { width: 100%; border-collapse: collapse; }
  th { font-size: 11px; font-weight: 600; color: var(--tt-text-3); text-transform: uppercase; letter-spacing: .05em; padding: 8px 10px; text-align: left; border-bottom: 0.5px solid #D8D4CE; }
  td { padding: 10px 10px; font-size: 13px; border-bottom: 0.5px solid #E8E4DE; color: var(--tt-text); vertical-align: middle; }
  tr:last-child td { border-bottom: none; }
  input[type=checkbox] { width: 16px; height: 16px; accent-color: var(--tt-blue); cursor: pointer; }
`;

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtDate(d) {
  if (!d) return "—";
  const [y, m, j] = d.split("-");
  return `${j} ${MONTHS_FR[parseInt(m)-1]} ${y}`;
}

function initials(nom) {
  const parts = nom.trim().split(" ");
  return parts.slice(0,2).map(p => p[0]).join("").toUpperCase();
}

function minutesDiff(t1, t2) {
  if (!t1 || !t2) return 0;
  const [h1,m1] = t1.split(":").map(Number);
  const [h2,m2] = t2.split(":").map(Number);
  return (h2*60+m2) - (h1*60+m1);
}

function fmtDuration(mins) {
  if (mins <= 0) return "—";
  const h = Math.floor(mins/60);
  const m = mins % 60;
  return m > 0 ? `${h}h${String(m).padStart(2,'0')}` : `${h}h`;
}

function calcDureeJour(pointage) {
  // Somme de toutes les plages de la journée
  let total = 0;
  const plages = pointage.plages || [];
  plages.forEach(p => {
    if (p.debut && p.fin) {
      total += Math.max(0, minutesDiff(p.debut, p.fin));
    }
  });
  return total;
}

function exportCSVLog(pointages) {
  const headers = ["Nom","Date","Debut matin","Fin matin","Debut apres-midi","Fin apres-midi","Total heures"];
  const rows = pointages.map(p => {
    const plages = p.plages || [];
    const duree = calcDureeJour(p);
    return [
      p.nom,
      p.date,
      plages[0]?.debut || "",
      plages[0]?.fin || "",
      plages[1]?.debut || "",
      plages[1]?.fin || "",
      fmtDuration(duree)
    ];
  });
  const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(";")).join("\n");
  const blob = new Blob(["\uFEFF"+csv], {type:"text/csv;charset=utf-8;"});
  const a = document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="Pointage_internes.csv"; a.click();
}

// ── Formulaire de pointage ────────────────────────────────────────────────────
function FormulairePointage({ user, onSave }) {
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);
  const [plages, setPlages] = useState([{ debut: "", fin: "", pasMidiFin: false }]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function updatePlage(idx, key, val) {
    setPlages(prev => prev.map((p, i) => i === idx ? {...p, [key]: val} : p));
  }

  function addPlage() {
    setPlages(prev => [...prev, { debut: "", fin: "" }]);
  }

  function removePlage(idx) {
    setPlages(prev => prev.filter((_, i) => i !== idx));
  }

  async function handleSave() {
    if (!plages[0]?.debut) { alert("Heure d'arrivée obligatoire."); return; }
    setSaving(true);
    const { error } = await supabase.from("pointages_internes").insert([{
      user_id: user.id,
      nom: user.nom,
      poste: user.poste,
      date,
      plages: JSON.stringify(plages),
      created_at: new Date().toISOString()
    }]);
    setSaving(false);
    if (error) { alert("Erreur : " + error.message); return; }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    setPlages([{ debut: "", fin: "" }]);
  }

  const totalMins = plages.reduce((s, p) => s + Math.max(0, minutesDiff(p.debut, p.fin)), 0);
  const labelStyle = { fontSize: 11, color: "var(--tt-text-3)", display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: ".05em" };

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <label style={labelStyle}>Date</label>
        <input className="nm-input" type="date" value={date} onChange={e => setDate(e.target.value)} />
      </div>

      {plages.map((plage, idx) => (
        <div key={idx} className="nm-inset" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--tt-text-2)" }}>
              {idx === 0 ? "Matin" : idx === 1 ? "Après-midi" : `Plage ${idx + 1}`}
            </div>
            {idx > 0 && (
              <button className="nm-btn ghost" style={{ fontSize: 12, padding: "2px 8px" }} onClick={() => removePlage(idx)}>
                × Supprimer
              </button>
            )}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={labelStyle}>{idx === 0 ? "Arrivée" : "Début"} *</label>
              <input className="nm-input" type="time" value={plage.debut} onChange={e => updatePlage(idx, "debut", e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Départ</label>
              <input className="nm-input" type="time" value={plage.fin} onChange={e => updatePlage(idx, "fin", e.target.value)} />
            </div>
          </div>
          {idx === 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="checkbox" id="pasmidi" checked={!!plage.pasMidiFin}
                onChange={e => updatePlage(0, "pasMidiFin", e.target.checked)} />
              <label htmlFor="pasmidi" style={{ fontSize: 13, cursor: "pointer" }}>Pas de pause déjeuner</label>
            </div>
          )}
          {plage.debut && plage.fin && (
            <div style={{ fontSize: 12, color: "var(--tt-blue)", fontWeight: 500 }}>
              Durée : {fmtDuration(Math.max(0, minutesDiff(plage.debut, plage.fin)))}
            </div>
          )}
        </div>
      ))}

      {totalMins > 0 && (
        <div className="nm-inset" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 13, color: "var(--tt-text-3)" }}>Total du jour</span>
          <span style={{ fontWeight: 700, fontSize: 16, color: "var(--tt-blue)" }}>{fmtDuration(totalMins)}</span>
        </div>
      )}

      <button className="nm-btn" onClick={addPlage} style={{ justifyContent: "center" }}>
        <i className="ti ti-plus" /> Ajouter une plage horaire
      </button>

      <button className="nm-btn primary" onClick={handleSave} disabled={saving} style={{ width: "100%", justifyContent: "center", padding: 13, fontSize: 15 }}>
        {saved ? "✓ Pointage enregistré" : saving ? "Enregistrement…" : "Enregistrer le pointage"}
      </button>
    </div>
  );
}

// ── Calendrier interne ────────────────────────────────────────────────────────
function CalendrierLog({ pointages, userId = null, isAdmin = false }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [filterNom, setFilterNom] = useState("Tous");
  const [selectedDay, setSelectedDay] = useState(null);

  const employes = useMemo(() => {
    const noms = [...new Set(pointages.map(p => p.nom))].sort();
    return noms;
  }, [pointages]);

  const filtered = useMemo(() => {
    let rows = userId ? pointages.filter(p => p.user_id === userId) : pointages;
    if (isAdmin && filterNom !== "Tous") rows = rows.filter(p => p.nom === filterNom);
    return rows;
  }, [pointages, userId, isAdmin, filterNom]);

  const byDate = useMemo(() => {
    const map = {};
    filtered.forEach(p => {
      if (!map[p.date]) map[p.date] = [];
      map[p.date].push({ ...p, plages: typeof p.plages === "string" ? JSON.parse(p.plages) : p.plages });
    });
    return map;
  }, [filtered]);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayMon = (new Date(year, month, 1).getDay() + 6) % 7;
  const JOURS = ["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"];

  function fmtKey(d) { return `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`; }
  function prevMonth() { month === 0 ? (setMonth(11), setYear(y => y-1)) : setMonth(m => m-1); setSelectedDay(null); }
  function nextMonth() { month === 11 ? (setMonth(0), setYear(y => y+1)) : setMonth(m => m+1); setSelectedDay(null); }

  const monthPointages = filtered.filter(p => p.date?.startsWith(`${year}-${String(month+1).padStart(2,'0')}`));
  const monthMins = monthPointages.reduce((s, p) => {
    const plages = typeof p.plages === "string" ? JSON.parse(p.plages) : (p.plages || []);
    return s + plages.reduce((a, pl) => a + Math.max(0, minutesDiff(pl.debut, pl.fin)), 0);
  }, 0);

  const selectedKey = selectedDay ? fmtKey(selectedDay) : null;
  const selectedRows = selectedKey ? (byDate[selectedKey] || []) : [];

  return (
    <div className="fade-in">
      {isAdmin && (
        <div style={{ marginBottom: 16, display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "var(--tt-text-3)" }}>Employé :</span>
          <select className="nm-input" value={filterNom} onChange={e => setFilterNom(e.target.value)} style={{ maxWidth: 200 }}>
            <option value="Tous">Tous</option>
            {employes.map(n => <option key={n}>{n}</option>)}
          </select>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <button className="nm-btn" onClick={prevMonth} style={{ padding: "8px 14px" }}><i className="ti ti-chevron-left"/></button>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 700, fontSize: 18, color: "var(--tt-blue)" }}>{MONTHS_FR[month]} {year}</div>
          <div style={{ fontSize: 12, color: "var(--tt-text-3)", marginTop: 2 }}>
            {monthPointages.length} pointage(s) · {fmtDuration(monthMins)}
          </div>
        </div>
        <button className="nm-btn" onClick={nextMonth} style={{ padding: "8px 14px" }}><i className="ti ti-chevron-right"/></button>
      </div>

      <div className="nm-card" style={{ padding: 12, marginBottom: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, marginBottom: 8 }}>
          {JOURS.map(j => <div key={j} style={{ textAlign: "center", fontSize: 11, fontWeight: 600, color: "var(--tt-text-3)", padding: "4px 0" }}>{j}</div>)}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
          {Array(firstDayMon).fill(null).map((_, i) => <div key={`e${i}`}/>)}
          {Array(daysInMonth).fill(null).map((_, i) => {
            const d = i + 1;
            const key = fmtKey(d);
            const rows = byDate[key] || [];
            const hasData = rows.length > 0;
            const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
            const isSelected = selectedDay === d;
            const dayMins = rows.reduce((s, p) => {
              const plages = typeof p.plages === "string" ? JSON.parse(p.plages) : (p.plages||[]);
              return s + plages.reduce((a, pl) => a + Math.max(0, minutesDiff(pl.debut, pl.fin)), 0);
            }, 0);
            return (
              <div key={d} onClick={() => hasData && setSelectedDay(isSelected ? null : d)}
                style={{
                  borderRadius: 8, padding: "6px 4px", textAlign: "center",
                  cursor: hasData ? "pointer" : "default",
                  background: isSelected ? "var(--tt-bg)" : hasData ? "var(--tt-surface)" : "transparent",
                  boxShadow: isSelected ? "var(--tt-shadow-in)" : hasData ? "var(--tt-shadow-sm)" : "none",
                  border: isToday ? "1.5px solid var(--tt-blue)" : "1.5px solid transparent",
                  minHeight: 52, display: "flex", flexDirection: "column", alignItems: "center", gap: 2
                }}>
                <div style={{ fontSize: 13, fontWeight: isToday ? 700 : 500, color: isToday ? "var(--tt-blue)" : "var(--tt-text)" }}>{d}</div>
                {hasData && <div style={{ fontSize: 10, color: "var(--tt-blue)", fontWeight: 600 }}>{fmtDuration(dayMins)}</div>}
              </div>
            );
          })}
        </div>
      </div>

      {selectedDay && (
        <div className="fade-in">
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 12 }}>
            {selectedDay} {MONTHS_FR[month]} {year}
          </div>
          {selectedRows.map((p, idx) => {
            const plages = typeof p.plages === "string" ? JSON.parse(p.plages) : (p.plages||[]);
            const totalMins = plages.reduce((s, pl) => s + Math.max(0, minutesDiff(pl.debut, pl.fin)), 0);
            return (
              <div key={idx} className="nm-card" style={{ marginBottom: 10, padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div>
                    {isAdmin && <div style={{ fontWeight: 600, fontSize: 14 }}>{p.nom}</div>}
                    <div style={{ fontSize: 12, color: "var(--tt-text-3)" }}>{p.poste}</div>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: "var(--tt-blue)" }}>{fmtDuration(totalMins)}</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {plages.map((pl, i) => (
                    <div key={i} className="nm-inset" style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                      <span style={{ color: "var(--tt-text-3)" }}>{i === 0 ? "Matin" : i === 1 ? "Après-midi" : `Plage ${i+1}`}</span>
                      <span><strong>{pl.debut}</strong> → <strong>{pl.fin || "—"}</strong>
                        {pl.debut && pl.fin && <span style={{ color: "var(--tt-text-3)", marginLeft: 8 }}>({fmtDuration(Math.max(0,minutesDiff(pl.debut,pl.fin)))})</span>}
                      </span>
                    </div>
                  ))}
                </div>
                {plages[0]?.pasMidiFin && <div style={{ fontSize: 11, color: "var(--tt-blue)", marginTop: 6 }}>Pas de pause déjeuner</div>}
              </div>
            );
          })}
        </div>
      )}

      {!selectedDay && monthPointages.length > 0 && (
        <div>
          <div style={{ fontSize: 12, color: "var(--tt-text-3)", marginBottom: 10, textTransform: "uppercase", letterSpacing: ".05em" }}>Tous les pointages du mois</div>
          {Object.entries(byDate)
            .filter(([k]) => k.startsWith(`${year}-${String(month+1).padStart(2,'0')}`))
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([date, rows]) => {
              const [y, m, d] = date.split("-");
              const dayMins = rows.reduce((s, p) => {
                const plages = typeof p.plages === "string" ? JSON.parse(p.plages) : (p.plages||[]);
                return s + plages.reduce((a, pl) => a + Math.max(0, minutesDiff(pl.debut, pl.fin)), 0);
              }, 0);
              return (
                <div key={date} className="nm-card" style={{ marginBottom: 10, padding: 0, overflow: "hidden" }}>
                  <div style={{ padding: "10px 14px", background: "var(--tt-bg)", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
                    onClick={() => setSelectedDay(parseInt(d))}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{parseInt(d)} {MONTHS_FR[parseInt(m)-1]}</div>
                    <div style={{ display: "flex", gap: 16, alignItems: "center", fontSize: 13 }}>
                      <span style={{ color: "var(--tt-text-3)" }}>{rows.length} pointage(s)</span>
                      <span style={{ fontWeight: 600, color: "var(--tt-blue)" }}>{fmtDuration(dayMins)}</span>
                    </div>
                  </div>
                  <table>
                    <tbody>
                      {rows.map((p, i) => {
                        const plages = typeof p.plages === "string" ? JSON.parse(p.plages) : (p.plages||[]);
                        const mins = plages.reduce((s, pl) => s + Math.max(0, minutesDiff(pl.debut, pl.fin)), 0);
                        return (
                          <tr key={i}>
                            {isAdmin && <td style={{ fontWeight: 500 }}>{p.nom}</td>}
                            <td style={{ color: "var(--tt-text-3)" }}>{p.poste}</td>
                            <td>{plages[0]?.debut} → {plages[0]?.fin || "—"}</td>
                            {plages[1] && <td>{plages[1]?.debut} → {plages[1]?.fin || "—"}</td>}
                            <td style={{ textAlign: "right", fontWeight: 600, color: "var(--tt-blue)" }}>{fmtDuration(mins)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}

// ── Interface interne employé ─────────────────────────────────────────────────
function InterneApp({ user, pointages, onLogout }) {
  const [tab, setTab] = useState("pointage");
  const mesPointages = useMemo(() =>
    pointages.filter(p => p.user_id === user.id).sort((a,b) => b.date.localeCompare(a.date)),
    [pointages, user]);
  const totalMins = useMemo(() =>
    mesPointages.reduce((s, p) => {
      const plages = typeof p.plages === "string" ? JSON.parse(p.plages) : (p.plages||[]);
      return s + plages.reduce((a, pl) => a + Math.max(0, minutesDiff(pl.debut, pl.fin)), 0);
    }, 0), [mesPointages]);

  async function handleSave(data) {
    // triggered from FormulairePointage via supabase directly
  }

  return (
    <div style={{ minHeight: "100vh", paddingBottom: 40 }}>
      <style>{CSS_LOG}</style>
      <div style={{ background: "var(--tt-surface)", boxShadow: "0 3px 12px #C8C4BE50", padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div className="avatar">{initials(user.nom)}</div>
          <div>
            <div className="tt-logo">Trait'Tendance · Logistique</div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>{user.nom} <span style={{ color: "var(--tt-text-3)", fontSize: 12 }}>· {user.poste}</span></div>
          </div>
        </div>
        <button className="nm-btn ghost" onClick={onLogout} style={{ fontSize: 12 }}>
          <i className="ti ti-logout"/>Déconnexion
        </button>
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 16px" }}>
        <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
          <div className="stat-card"><div style={{ fontSize: 11, color: "var(--tt-text-3)", marginBottom: 6, textTransform: "uppercase" }}>Pointages</div><div style={{ fontSize: 20, fontWeight: 600 }}>{mesPointages.length}</div></div>
          <div className="stat-card"><div style={{ fontSize: 11, color: "var(--tt-text-3)", marginBottom: 6, textTransform: "uppercase" }}>Total heures</div><div style={{ fontSize: 20, fontWeight: 600, color: "var(--tt-blue)" }}>{fmtDuration(totalMins)}</div></div>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          {[["pointage","Pointer","ti-clock"],["calendrier","Calendrier","ti-calendar"],["historique","Historique","ti-list"]].map(([id,lbl,ic])=>(
            <button key={id} className={`nm-tab${tab===id?" active":""}`} onClick={()=>setTab(id)}>
              <i className={`ti ${ic}`}/> {lbl}
            </button>
          ))}
        </div>

        {tab==="pointage" && (
          <div className="nm-card fade-in">
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Nouveau pointage</div>
            <FormulairePointage user={user} onSave={handleSave}/>
          </div>
        )}
        {tab==="calendrier" && <CalendrierLog pointages={pointages} userId={user.id} isAdmin={false}/>}
        {tab==="historique" && (
          <div className="fade-in">
            {mesPointages.length === 0 ? (
              <div className="nm-card" style={{ textAlign: "center", padding: 40, color: "var(--tt-text-3)" }}>Aucun pointage enregistré.</div>
            ) : mesPointages.map(p => {
              const plages = typeof p.plages === "string" ? JSON.parse(p.plages) : (p.plages||[]);
              const totalMins = plages.reduce((s, pl) => s + Math.max(0, minutesDiff(pl.debut, pl.fin)), 0);
              return (
                <div key={p.id} className="nm-card" style={{ marginBottom: 12, padding: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <div style={{ fontWeight: 600 }}>{fmtDate(p.date)}</div>
                    <div style={{ fontWeight: 700, color: "var(--tt-blue)" }}>{fmtDuration(totalMins)}</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {plages.map((pl, i) => (
                      <div key={i} style={{ fontSize: 13, color: "var(--tt-text-2)" }}>
                        {i===0?"Matin":i===1?"Après-midi":`Plage ${i+1}`} : <strong>{pl.debut}</strong> → <strong>{pl.fin||"—"}</strong>
                        {pl.debut&&pl.fin&&<span style={{ color:"var(--tt-text-3)",marginLeft:8 }}>({fmtDuration(Math.max(0,minutesDiff(pl.debut,pl.fin)))})</span>}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Interface admin logistique ────────────────────────────────────────────────
export function AdminLogApp({ pointages, onLogout }) {
  const [tab, setTab] = useState("calendrier");
  const [filterNom, setFilterNom] = useState("Tous");

  const employes = useMemo(() => ["Tous", ...new Set(pointages.map(p => p.nom)).values()].sort(), [pointages]);
  const filtered = useMemo(() =>
    filterNom === "Tous" ? pointages : pointages.filter(p => p.nom === filterNom),
    [pointages, filterNom]);

  const totalMins = filtered.reduce((s, p) => {
    const plages = typeof p.plages === "string" ? JSON.parse(p.plages) : (p.plages||[]);
    return s + plages.reduce((a, pl) => a + Math.max(0, minutesDiff(pl.debut, pl.fin)), 0);
  }, 0);

  return (
    <div style={{ minHeight: "100vh", paddingBottom: 40 }}>
      <style>{CSS_LOG}</style>
      <div style={{ background: "var(--tt-surface)", boxShadow: "0 3px 12px #C8C4BE50", padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28, position: "sticky", top: 0, zIndex: 10 }}>
        <div>
          <div className="tt-logo" style={{ marginBottom: 2 }}>Trait'Tendance · Logistique</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "var(--tt-blue)" }}>Tableau de bord Internes</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="nm-btn" onClick={() => exportCSVLog(filtered)}><i className="ti ti-download"/>Export CSV</button>
          <button className="nm-btn ghost" onClick={onLogout}><i className="ti ti-logout"/>Déconnexion</button>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 20px" }}>
        <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
          <div className="stat-card"><div style={{ fontSize: 11, color: "var(--tt-text-3)", marginBottom: 6, textTransform: "uppercase" }}>Employés</div><div style={{ fontSize: 20, fontWeight: 600 }}>{new Set(pointages.map(p=>p.nom)).size}</div></div>
          <div className="stat-card"><div style={{ fontSize: 11, color: "var(--tt-text-3)", marginBottom: 6, textTransform: "uppercase" }}>Pointages</div><div style={{ fontSize: 20, fontWeight: 600 }}>{filtered.length}</div></div>
          <div className="stat-card"><div style={{ fontSize: 11, color: "var(--tt-text-3)", marginBottom: 6, textTransform: "uppercase" }}>Total heures</div><div style={{ fontSize: 20, fontWeight: 600, color: "var(--tt-blue)" }}>{fmtDuration(totalMins)}</div></div>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
          {[["calendrier","Calendrier","ti-calendar"],["liste","Liste","ti-list"]].map(([id,lbl,ic])=>(
            <button key={id} className={`nm-tab${tab===id?" active":""}`} onClick={()=>setTab(id)}>
              <i className={`ti ${ic}`}/> {lbl}
            </button>
          ))}
        </div>

        {tab==="calendrier" && <CalendrierLog pointages={filtered} isAdmin={true}/>}
        {tab==="liste" && (
          <div className="fade-in">
            <div style={{ marginBottom: 16 }}>
              <select className="nm-input" value={filterNom} onChange={e=>setFilterNom(e.target.value)} style={{ maxWidth: 220 }}>
                {employes.map(n => <option key={n}>{n}</option>)}
              </select>
            </div>
            <div className="nm-card" style={{ padding: 0, overflow: "hidden" }}>
              <table>
                <thead><tr>
                  <th>Employé</th><th>Date</th><th>Poste</th><th>Matin</th><th>Après-midi</th><th>Total</th>
                </tr></thead>
                <tbody>
                  {filtered.sort((a,b)=>b.date.localeCompare(a.date)).map(p => {
                    const plages = typeof p.plages==="string"?JSON.parse(p.plages):(p.plages||[]);
                    const mins = plages.reduce((s,pl)=>s+Math.max(0,minutesDiff(pl.debut,pl.fin)),0);
                    return (
                      <tr key={p.id}>
                        <td style={{fontWeight:500}}>{p.nom}</td>
                        <td style={{whiteSpace:"nowrap",color:"var(--tt-text-2)"}}>{fmtDate(p.date)}</td>
                        <td>{p.poste}</td>
                        <td>{plages[0]?.debut||"—"} → {plages[0]?.fin||"—"}</td>
                        <td>{plages[1]?.debut||"—"} → {plages[1]?.fin||"—"}</td>
                        <td style={{fontWeight:600,color:"var(--tt-blue)"}}>{fmtDuration(mins)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── App Logistique (router principal) ─────────────────────────────────────────
export default function LogistiqueApp({ session, onLogout }) {
  const [pointages, setPointages] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("pointages_internes").select("*").order("date", { ascending: false });
      if (data) setPointages(data);
      setReady(true);
    };
    load();
    const channel = supabase.channel("pointages-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "pointages_internes" }, load)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  if (!ready) return <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh",background:"#F0EDE8",fontSize:14,color:"#9A8C7E"}}>Chargement…</div>;

  if (session.isAdmin) return <AdminLogApp pointages={pointages} onLogout={onLogout}/>;

  return <InterneApp user={session.user} pointages={pointages} onLogout={onLogout}/>;
}
