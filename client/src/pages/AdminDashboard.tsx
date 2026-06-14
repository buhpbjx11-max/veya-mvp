import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

type Tab = "stats" | "venues" | "couples" | "leads" | "access" | "feedback";

const statusLabel: Record<string, string> = { trial: "ניסיון", active: "פעיל", locked: "נעול", cancelled: "בוטל" };
const statusBg: Record<string, string> = { trial: "#D9C5A133", active: "#A8C3B033", locked: "#e8a0a033", cancelled: "#ccc3" };
const statusFg: Record<string, string> = { trial: "#5D6861", active: "#3F4842", locked: "#c0392b", cancelled: "#888" };
const roleLabel: Record<string, string> = { legal: "עורך דין", cpa: "רואה חשבון", tax: "יועץ מס" };
const CATEGORY_LABELS: Record<string, string> = {
  overall: "כללי",
  venue: "אולם",
  veya: "VEYA",
  seating: "הושבה",
  guests: "אורחים",
  budget: "תקציב",
};

export default function AdminDashboard() {
  const [, navigate] = useLocation();
  const { user, logout } = useAuth({ redirectOnUnauthenticated: true });
  const [tab, setTab] = useState<Tab>("stats");
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadForm, setLeadForm] = useState({ venueName: "", contact: "", phone: "", email: "", notes: "", stage: "lead" as const, source: "manual" as const });
  const [showAccessForm, setShowAccessForm] = useState(false);
  const [accessForm, setAccessForm] = useState({ name: "", email: "", role: "legal" as const, scope: "", permission: "view" as const });

  const utils = trpc.useUtils();
  const statsQ = trpc.admin?.getStats?.useQuery(undefined, { enabled: tab === "stats" });
  const venuesQ = trpc.admin?.listVenues?.useQuery(undefined, { enabled: tab === "venues" });
  const couplesQ = trpc.admin?.listCouples?.useQuery(undefined, { enabled: tab === "couples" });
  const leadsQ = trpc.admin?.listLeads?.useQuery(undefined, { enabled: tab === "leads" });
  const accessQ = trpc.admin?.listAccessGrants?.useQuery(undefined, { enabled: tab === "access" });
  const feedbackQ = trpc.admin?.getFeedbackStats?.useQuery(undefined, { enabled: tab === "feedback" });

  const updateVenueStatus = trpc.admin?.updateVenueStatus?.useMutation({ onSuccess: () => utils.admin?.listVenues?.invalidate() });
  const createLead = trpc.admin?.createLead?.useMutation({ onSuccess: () => { utils.admin?.listLeads?.invalidate(); setShowLeadForm(false); setLeadForm({ venueName: "", contact: "", phone: "", email: "", notes: "", stage: "lead", source: "manual" }); } });
  const updateLead = trpc.admin?.updateLead?.useMutation({ onSuccess: () => utils.admin?.listLeads?.invalidate() });
  const deleteLead = trpc.admin?.deleteLead?.useMutation({ onSuccess: () => utils.admin?.listLeads?.invalidate() });
  const createAccess = trpc.admin?.createAccessGrant?.useMutation({ onSuccess: () => { utils.admin?.listAccessGrants?.invalidate(); setShowAccessForm(false); } });
  const updateAccess = trpc.admin?.updateAccessGrant?.useMutation({ onSuccess: () => utils.admin?.listAccessGrants?.invalidate() });

  const tabs: { id: Tab; label: string }[] = [
    { id: "stats", label: "סטטיסטיקות" },
    { id: "venues", label: "אולמות" },
    { id: "couples", label: "זוגות" },
    { id: "leads", label: "CRM לידים" },
    { id: "access", label: "גישות חיצוניות" },
    { id: "feedback", label: "משוב זוגות" },
  ];

  if (!user) return null;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--cream)", direction: "rtl", fontFamily: "var(--font-body)" }}>
      {/* ── Sidebar ── */}
      <aside style={{ width: 240, background: "#2D2D2D", display: "flex", flexDirection: "column", flexShrink: 0, position: "sticky", top: 0, height: "100vh", overflowY: "auto" }}>
        <div style={{ padding: "28px 24px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ fontFamily: "var(--font-wordmark)", fontSize: 26, color: "#F8F6F2", letterSpacing: 2 }}>VEYA</div>
          <div style={{ fontSize: 11, color: "#A8C3B0", marginTop: 2, letterSpacing: 1 }}>HQ — ניהול פנימי</div>
        </div>
        <nav style={{ flex: 1, padding: "16px 0" }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              display: "flex", alignItems: "center", gap: 10, width: "100%",
              padding: "11px 24px", background: tab === t.id ? "rgba(168,195,176,0.15)" : "transparent",
              border: "none", borderRight: tab === t.id ? "3px solid #A8C3B0" : "3px solid transparent",
              color: tab === t.id ? "#A8C3B0" : "rgba(248,246,242,0.6)",
              fontSize: 14, cursor: "pointer", textAlign: "right", transition: "all 0.15s",
            }}>
              {t.label}
            </button>
          ))}
        </nav>
        <div style={{ padding: "16px 24px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ fontSize: 12, color: "rgba(248,246,242,0.5)" }}>{user.name || "Admin"}</div>
          <button onClick={async () => { await logout(); navigate("/"); }} style={{ marginTop: 8, fontSize: 12, color: "#A8C3B0", background: "none", border: "none", cursor: "pointer", padding: 0 }}>יציאה</button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={{ flex: 1, padding: "32px 36px", overflowY: "auto" }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 28, color: "var(--forest)", margin: 0 }}>
            {tabs.find(t => t.id === tab)?.label}
          </h1>
        </div>

        {/* ─── Stats ─── */}
        {tab === "stats" && (
          statsQ?.isLoading ? <Loader /> :
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
            {[
              { label: "סה\"כ אולמות", value: statsQ?.data?.totalVenues ?? 0 },
              { label: "אולמות פעילים", value: statsQ?.data?.activeVenues ?? 0, accent: "#A8C3B0" },
              { label: "בתקופת ניסיון", value: statsQ?.data?.trialVenues ?? 0, accent: "#D9C5A1" },
              { label: "נעולים", value: statsQ?.data?.lockedVenues ?? 0, accent: "#e8a0a0" },
              { label: "סה\"כ זוגות", value: statsQ?.data?.totalCouples ?? 0 },
              { label: "מקושרים לאולם", value: statsQ?.data?.venueLinkedCouples ?? 0, accent: "#A8C3B0" },
              { label: "עצמאיים", value: statsQ?.data?.independentCouples ?? 0 },
              { label: "סה\"כ חתונות", value: statsQ?.data?.totalWeddings ?? 0, accent: "#5D6861" },
            ].map(s => (
              <div key={s.label} style={{ background: "#fff", borderRadius: 18, padding: "20px 24px", boxShadow: "0 1px 2px rgba(45,45,45,.04), 0 8px 24px rgba(63,72,66,.06)", border: "1px solid rgba(63,72,66,0.08)" }}>
                <div style={{ fontSize: 32, fontWeight: 700, color: s.accent || "var(--forest)", fontFamily: "var(--font-heading)" }}>{s.value}</div>
                <div style={{ fontSize: 13, color: "var(--forest-light)", marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* ─── Venues ─── */}
        {tab === "venues" && (
          venuesQ?.isLoading ? <Loader /> :
          <Table headers={["שם האולם", "אזור", "תוכנית", "סטטוס", "שינוי סטטוס"]}>
            {venuesQ?.data?.length === 0
              ? <EmptyRow cols={5} text="אין אולמות עדיין" />
              : venuesQ?.data?.map(v => (
                <tr key={v.id} style={{ borderBottom: "1px solid rgba(63,72,66,0.06)" }}>
                  <Td bold>{v.name}</Td>
                  <Td muted>{v.region || "—"}</Td>
                  <Td muted style={{ textTransform: "uppercase", fontSize: 12 }}>{v.plan}</Td>
                  <Td>
                    <Pill bg={statusBg[v.subStatus]} fg={statusFg[v.subStatus]}>{statusLabel[v.subStatus]}</Pill>
                  </Td>
                  <Td>
                    <select value={v.subStatus} onChange={e => updateVenueStatus?.mutate({ venueId: v.id, subStatus: e.target.value as any })}
                      style={{ padding: "4px 8px", borderRadius: 8, border: "1px solid rgba(63,72,66,0.2)", fontSize: 12, background: "var(--cream)", cursor: "pointer" }}>
                      <option value="trial">ניסיון</option>
                      <option value="active">פעיל</option>
                      <option value="locked">נעול</option>
                      <option value="cancelled">בוטל</option>
                    </select>
                  </Td>
                </tr>
              ))
            }
          </Table>
        )}

        {/* ─── Couples ─── */}
        {tab === "couples" && (
          couplesQ?.isLoading ? <Loader /> :
          <Table headers={["שמות", "תאריך חתונה", "סוג", "נעול", "נוצר"]}>
            {couplesQ?.data?.length === 0
              ? <EmptyRow cols={5} text="אין זוגות עדיין" />
              : couplesQ?.data?.map(c => (
                <tr key={c.id} style={{ borderBottom: "1px solid rgba(63,72,66,0.06)" }}>
                  <Td bold>{c.name1} & {c.name2}</Td>
                  <Td muted>{c.weddingDate ? new Date(c.weddingDate).toLocaleDateString("he-IL") : "—"}</Td>
                  <Td>
                    <Pill bg={c.type === "venue_linked" ? "#A8C3B033" : "#D9C5A133"} fg="var(--forest)">
                      {c.type === "venue_linked" ? "מקושר לאולם" : "עצמאי"}
                    </Pill>
                  </Td>
                  <Td muted style={{ fontSize: 12 }}>{c.assignmentLocked ? "נעול" : "—"}</Td>
                  <Td muted style={{ fontSize: 12 }}>{new Date(c.createdAt).toLocaleDateString("he-IL")}</Td>
                </tr>
              ))
            }
          </Table>
        )}

        {/* ─── CRM Leads ─── */}
        {tab === "leads" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 14, color: "var(--forest-light)" }}>{leadsQ?.data?.length || 0} לידים</div>
              <ActionBtn onClick={() => setShowLeadForm(true)}>+ ליד חדש</ActionBtn>
            </div>

            {showLeadForm && (
              <FormCard title="ליד חדש" onClose={() => setShowLeadForm(false)}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {[["venueName", "שם האולם"], ["contact", "איש קשר"], ["phone", "טלפון"], ["email", "אימייל"]].map(([k, l]) => (
                    <Field key={k} label={l}>
                      <input value={(leadForm as any)[k]} onChange={e => setLeadForm(p => ({ ...p, [k]: e.target.value }))} style={inputStyle} />
                    </Field>
                  ))}
                  <Field label="שלב">
                    <select value={leadForm.stage} onChange={e => setLeadForm(p => ({ ...p, stage: e.target.value as any }))} style={inputStyle}>
                      <option value="lead">ליד</option><option value="meeting">פגישה</option>
                      <option value="proposal">הצעה</option><option value="closed">סגור</option>
                    </select>
                  </Field>
                </div>
                <Field label="הערות" style={{ marginTop: 12 }}>
                  <textarea value={leadForm.notes} onChange={e => setLeadForm(p => ({ ...p, notes: e.target.value }))} rows={2} style={{ ...inputStyle, resize: "vertical" }} />
                </Field>
                <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                  <ActionBtn onClick={() => createLead?.mutate(leadForm)} disabled={createLead?.isPending}>
                    {createLead?.isPending ? "שומר..." : "שמירה"}
                  </ActionBtn>
                  <OutlineBtn onClick={() => setShowLeadForm(false)}>ביטול</OutlineBtn>
                </div>
              </FormCard>
            )}

            <Table headers={["שם האולם", "איש קשר", "טלפון", "שלב", "מקור", "פעולות"]}>
              {leadsQ?.isLoading ? <EmptyRow cols={6} text="טוען..." /> :
               leadsQ?.data?.length === 0 ? <EmptyRow cols={6} text="אין לידים עדיין" /> :
               leadsQ?.data?.map(lead => (
                <tr key={lead.id} style={{ borderBottom: "1px solid rgba(63,72,66,0.06)" }}>
                  <Td bold>{lead.venueName || "—"}</Td>
                  <Td muted>{lead.contact || "—"}</Td>
                  <Td muted>{lead.phone || "—"}</Td>
                  <Td>
                    <select value={lead.stage} onChange={e => updateLead?.mutate({ id: lead.id, stage: e.target.value as any })}
                      style={{ padding: "3px 8px", borderRadius: 8, border: "1px solid rgba(63,72,66,0.2)", fontSize: 12, background: "var(--cream)", cursor: "pointer" }}>
                      <option value="lead">ליד</option><option value="meeting">פגישה</option>
                      <option value="proposal">הצעה</option><option value="closed">סגור</option>
                    </select>
                  </Td>
                  <Td muted style={{ fontSize: 12 }}>{lead.source}</Td>
                  <Td>
                    <DangerBtn onClick={() => { if (confirm("למחוק ליד זה?")) deleteLead?.mutate({ id: lead.id }); }}>מחיקה</DangerBtn>
                  </Td>
                </tr>
              ))}
            </Table>
          </div>
        )}

        {/* ─── Feedback Stats ─── */}
        {tab === "feedback" && (
          feedbackQ?.isLoading ? <Loader /> :
          <div>
            {/* Summary KPIs */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16, marginBottom: 28 }}>
              <div style={{ background: "#fff", borderRadius: 18, padding: "20px 24px", boxShadow: "0 1px 2px rgba(45,45,45,.04), 0 8px 24px rgba(63,72,66,.06)", border: "1px solid rgba(63,72,66,0.08)" }}>
                <div style={{ fontSize: 32, fontWeight: 700, color: "var(--forest)", fontFamily: "var(--font-heading)" }}>{feedbackQ?.data?.count ?? 0}</div>
                <div style={{ fontSize: 13, color: "var(--forest-light)", marginTop: 4 }}>סה"כ סקרים</div>
              </div>
              {Object.entries(feedbackQ?.data?.averages ?? {}).map(([cat, avg]) => (
                <div key={cat} style={{ background: "#fff", borderRadius: 18, padding: "20px 24px", boxShadow: "0 1px 2px rgba(45,45,45,.04), 0 8px 24px rgba(63,72,66,.06)", border: "1px solid rgba(63,72,66,0.08)" }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                    <span style={{ fontSize: 32, fontWeight: 700, color: avg >= 4 ? "#A8C3B0" : avg >= 3 ? "#D9C5A1" : "#e8a0a0", fontFamily: "var(--font-heading)" }}>{avg}</span>
                    <span style={{ fontSize: 14, color: "var(--forest-light)" }}>/5</span>
                  </div>
                  <div style={{ fontSize: 13, color: "var(--forest-light)", marginTop: 4 }}>{CATEGORY_LABELS[cat] ?? cat}</div>
                  {/* Star bar */}
                  <div style={{ marginTop: 8, height: 4, borderRadius: 2, background: "rgba(63,72,66,0.1)" }}>
                    <div style={{ height: "100%", borderRadius: 2, background: avg >= 4 ? "#A8C3B0" : avg >= 3 ? "#D9C5A1" : "#e8a0a0", width: `${(avg / 5) * 100}%`, transition: "width 0.4s" }} />
                  </div>
                </div>
              ))}
            </div>
            {/* Recent comments */}
            <h3 style={{ fontFamily: "var(--font-heading)", fontSize: 18, color: "var(--forest)", marginBottom: 16 }}>הערות אחרונות</h3>
            {!feedbackQ?.data?.recent?.length
              ? <div style={{ color: "var(--forest-light)", padding: 24, textAlign: "center" }}>אין הערות עדיין</div>
              : <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {feedbackQ.data.recent.map(r => (
                    <div key={r.id} style={{ background: "#fff", borderRadius: 14, padding: "16px 20px", boxShadow: "0 1px 2px rgba(45,45,45,.04), 0 4px 16px rgba(63,72,66,.05)", border: "1px solid rgba(63,72,66,0.08)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                        <p style={{ margin: 0, fontSize: 14, color: "var(--forest)", lineHeight: 1.6, flex: 1 }}>{r.comment}</p>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                          {r.overallRating !== null && (
                            <Pill bg="#A8C3B033" fg="#3F4842">★ {r.overallRating}/5</Pill>
                          )}
                          <span style={{ fontSize: 11, color: "var(--forest-light)" }}>{new Date(r.createdAt).toLocaleDateString("he-IL")}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
            }
          </div>
        )}

        {/* ─── Access Grants ─── */}
        {tab === "access" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 14, color: "var(--forest-light)" }}>גישות חיצוניות (עו"ד / רו"ח / יועץ מס)</div>
              <ActionBtn onClick={() => setShowAccessForm(true)}>+ גישה חדשה</ActionBtn>
            </div>

            {showAccessForm && (
              <FormCard title="גישה חדשה" onClose={() => setShowAccessForm(false)}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {[["name", "שם"], ["email", "אימייל"], ["scope", "תחום (אופציונלי)"]].map(([k, l]) => (
                    <Field key={k} label={l}>
                      <input value={(accessForm as any)[k]} onChange={e => setAccessForm(p => ({ ...p, [k]: e.target.value }))} style={inputStyle} />
                    </Field>
                  ))}
                  <Field label="תפקיד">
                    <select value={accessForm.role} onChange={e => setAccessForm(p => ({ ...p, role: e.target.value as any }))} style={inputStyle}>
                      <option value="legal">עורך דין</option><option value="cpa">רואה חשבון</option><option value="tax">יועץ מס</option>
                    </select>
                  </Field>
                  <Field label="הרשאה">
                    <select value={accessForm.permission} onChange={e => setAccessForm(p => ({ ...p, permission: e.target.value as any }))} style={inputStyle}>
                      <option value="view">צפייה</option><option value="download">הורדה</option><option value="edit">עריכה</option>
                    </select>
                  </Field>
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                  <ActionBtn onClick={() => createAccess?.mutate(accessForm)} disabled={createAccess?.isPending}>
                    {createAccess?.isPending ? "שומר..." : "אישור גישה"}
                  </ActionBtn>
                  <OutlineBtn onClick={() => setShowAccessForm(false)}>ביטול</OutlineBtn>
                </div>
              </FormCard>
            )}

            <Table headers={["שם", "אימייל", "תפקיד", "הרשאה", "סטטוס", "פעולה"]}>
              {accessQ?.isLoading ? <EmptyRow cols={6} text="טוען..." /> :
               accessQ?.data?.length === 0 ? <EmptyRow cols={6} text="אין גישות חיצוניות" /> :
               accessQ?.data?.map(grant => (
                <tr key={grant.id} style={{ borderBottom: "1px solid rgba(63,72,66,0.06)" }}>
                  <Td bold>{grant.name}</Td>
                  <Td muted>{grant.email}</Td>
                  <Td muted>{roleLabel[grant.role]}</Td>
                  <Td muted style={{ fontSize: 12 }}>{grant.permission}</Td>
                  <Td>
                    <Pill
                      bg={grant.status === "active" ? "#A8C3B033" : grant.status === "revoked" ? "#e8a0a033" : "#D9C5A133"}
                      fg={grant.status === "active" ? "#3F4842" : grant.status === "revoked" ? "#c0392b" : "#5D6861"}
                    >
                      {grant.status === "active" ? "פעיל" : grant.status === "revoked" ? "בוטל" : "ממתין"}
                    </Pill>
                  </Td>
                  <Td>
                    {grant.status !== "revoked" && (
                      <DangerBtn onClick={() => updateAccess?.mutate({ id: grant.id, status: "revoked" })}>ביטול גישה</DangerBtn>
                    )}
                  </Td>
                </tr>
              ))}
            </Table>
          </div>
        )}
      </main>
    </div>
  );
}

/* ── Micro-components ── */
function Loader() { return <div style={{ color: "var(--forest-light)", padding: 24 }}>טוען...</div>; }

function Table({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", borderRadius: 18, boxShadow: "0 1px 2px rgba(45,45,45,.04), 0 8px 24px rgba(63,72,66,.06)", overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead>
          <tr style={{ background: "var(--cream)", borderBottom: "1px solid rgba(63,72,66,0.1)" }}>
            {headers.map(h => <th key={h} style={{ padding: "12px 16px", textAlign: "right", fontWeight: 600, color: "var(--forest)", fontSize: 13 }}>{h}</th>)}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function Td({ children, bold, muted, style }: { children?: React.ReactNode; bold?: boolean; muted?: boolean; style?: React.CSSProperties }) {
  return <td style={{ padding: "12px 16px", color: muted ? "var(--forest-light)" : "var(--forest)", fontWeight: bold ? 500 : 400, ...style }}>{children}</td>;
}

function EmptyRow({ cols, text }: { cols: number; text: string }) {
  return <tr><td colSpan={cols} style={{ padding: 24, textAlign: "center", color: "var(--forest-light)" }}>{text}</td></tr>;
}

function Pill({ children, bg, fg }: { children: React.ReactNode; bg: string; fg: string }) {
  return <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 9999, fontSize: 12, background: bg, color: fg, fontWeight: 500 }}>{children}</span>;
}

function ActionBtn({ children, onClick, disabled }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ padding: "8px 20px", borderRadius: 9999, background: "var(--forest)", color: "#F8F6F2", border: "none", fontSize: 13, cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.7 : 1, fontFamily: "var(--font-body)" }}>
      {children}
    </button>
  );
}

function OutlineBtn({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button onClick={onClick}
      style={{ padding: "8px 20px", borderRadius: 9999, background: "transparent", color: "var(--forest)", border: "1px solid rgba(63,72,66,0.3)", fontSize: 13, cursor: "pointer", fontFamily: "var(--font-body)" }}>
      {children}
    </button>
  );
}

function DangerBtn({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button onClick={onClick}
      style={{ padding: "3px 10px", borderRadius: 9999, background: "#e8a0a033", color: "#c0392b", border: "none", fontSize: 12, cursor: "pointer" }}>
      {children}
    </button>
  );
}

function FormCard({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div style={{ background: "#fff", borderRadius: 18, padding: 24, marginBottom: 16, boxShadow: "0 1px 2px rgba(45,45,45,.04), 0 8px 24px rgba(63,72,66,.06)", border: "1px solid rgba(63,72,66,0.1)" }}>
      <h3 style={{ margin: "0 0 16px", fontFamily: "var(--font-heading)", color: "var(--forest)", fontSize: 18 }}>{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, children, style }: { label: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={style}>
      <label style={{ display: "block", fontSize: 12, color: "var(--forest-light)", marginBottom: 4 }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "8px 12px", borderRadius: 10,
  border: "1px solid rgba(63,72,66,0.2)", fontSize: 14,
  fontFamily: "var(--font-body)", background: "var(--cream)", boxSizing: "border-box",
};
