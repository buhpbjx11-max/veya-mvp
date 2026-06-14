import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { toast } from "sonner";

const ACCESS_LABELS: Record<string, string> = { view_only: "צפייה בלבד", limited_edit: "עריכה מוגבלת" };
const STATUS_LABELS: Record<string, string> = { pending: "ממתין", active: "פעיל", revoked: "בוטל" };
const STATUS_COLORS: Record<string, string> = { pending: "#D9C5A1", active: "#A8C3B0", revoked: "#c0392b" };

const AREAS = [
  "רשימת אורחים",
  "תקציב",
  "ספקים",
  "לוח זמנים",
  "הושבה",
  "תמונות",
];

const EMPTY_FORM = { name: "", email: "", phone: "", accessLevel: "view_only" as "view_only" | "limited_edit", assignedArea: "" };

export default function FamilyAccess() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const { data: members = [], isLoading } = trpc.familyAccess.list.useQuery();

  const invite = trpc.familyAccess.invite.useMutation({
    onSuccess: (data) => {
      utils.familyAccess.list.invalidate();
      setShowAdd(false);
      setForm(EMPTY_FORM);
      toast.success("הזמנה נוצרה — העתק את הקישור ושלח");
    },
    onError: (e) => toast.error(e.message),
  });

  const revoke = trpc.familyAccess.revoke.useMutation({
    onSuccess: () => { utils.familyAccess.list.invalidate(); toast.success("גישה בוטלה"); },
    onError: (e) => toast.error(e.message),
  });

  const remove = trpc.familyAccess.remove.useMutation({
    onSuccess: () => { utils.familyAccess.list.invalidate(); toast.success("הוסר"); },
    onError: (e) => toast.error(e.message),
  });

  const memberList = members as any[];

  function handleInvite() {
    if (!form.name.trim()) { toast.error("שם חובה"); return; }
    invite.mutate({
      name: form.name,
      email: form.email || undefined,
      phone: form.phone || undefined,
      accessLevel: form.accessLevel,
      assignedArea: form.accessLevel === "limited_edit" && form.assignedArea ? form.assignedArea : undefined,
    });
  }

  function copyInviteLink(token: string, id: number) {
    const link = `${window.location.origin}/family-access/${token}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedId(id);
      toast.success("קישור הועתק");
      setTimeout(() => setCopiedId(null), 2000);
    });
  }

  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: "#F8F6F2", fontFamily: "'Heebo', sans-serif" }}>
      <style>{`
        .fa-btn { border: none; border-radius: 9999px; padding: 8px 18px; cursor: pointer; font-size: 13px; font-family: 'Heebo', sans-serif; font-weight: 500; transition: all 0.15s; }
        .fa-btn-primary { background: #3F4842; color: #F8F6F2; }
        .fa-btn-primary:hover { background: #2D2D2D; }
        .fa-btn-outline { background: #fff; color: #3F4842; border: 1px solid #DDD8CE !important; }
        .fa-btn-outline:hover { border-color: #A8C3B0 !important; }
        .fa-btn-ghost { background: transparent; color: #5D6861; border: 1px solid transparent !important; padding: 6px 12px; }
        .fa-btn-ghost:hover { background: #F0EDE8; }
        .fa-input { width: 100%; padding: 9px 13px; border-radius: 9999px; border: 1px solid #DDD8CE; background: #fff; font-size: 14px; font-family: 'Heebo', sans-serif; box-sizing: border-box; outline: none; }
        .fa-input:focus { border-color: #A8C3B0; }
        .fa-select { width: 100%; padding: 9px 13px; border-radius: 9999px; border: 1px solid #DDD8CE; background: #fff; font-size: 14px; font-family: 'Heebo', sans-serif; box-sizing: border-box; outline: none; cursor: pointer; }
        .fa-card { background: #fff; border-radius: 18px; box-shadow: 0 1px 2px rgba(45,45,45,.04), 0 8px 24px rgba(63,72,66,.06); border: 1px solid #EDE8E0; }
        .fa-member-row { background: #fff; border-radius: 14px; border: 1px solid #EDE8E0; padding: 16px 20px; display: flex; align-items: flex-start; gap: 14; }
        .fa-member-row:hover { box-shadow: 0 4px 16px rgba(63,72,66,.08); }
      `}</style>

      {/* Header */}
      <div style={{ background: "#3F4842", padding: "16px 24px", display: "flex", alignItems: "center", gap: 16 }}>
        <button onClick={() => navigate("/couple/dashboard")} style={{ background: "none", border: "none", color: "#A8C3B0", cursor: "pointer" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <h1 style={{ color: "#F8F6F2", fontFamily: "'Frank Ruhl Libre', serif", fontSize: 22, margin: 0 }}>שיתוף עם המשפחה</h1>
        <span style={{ marginRight: "auto", background: "rgba(168,195,176,0.25)", color: "#A8C3B0", borderRadius: 9999, padding: "4px 12px", fontSize: 12 }}>
          {memberList.filter(m => m.status === "active").length} פעילים
        </span>
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "24px 16px" }}>

        {/* Explainer */}
        <div className="fa-card" style={{ padding: "16px 20px", marginBottom: 20, display: "flex", gap: 14, alignItems: "flex-start" }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#F0EDE8", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5D6861" strokeWidth="1.5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div>
            <div style={{ fontWeight: 600, color: "#3F4842", fontSize: 14, marginBottom: 3 }}>שתפו בני משפחה ב-VEYA</div>
            <div style={{ fontSize: 13, color: "#888", lineHeight: 1.6 }}>
              תוכלו לתת לבני משפחה גישה מוגבלת לתכנון — לצפייה בלבד, או לעריכה של אזור ספציפי (כמו רשימת אורחים).
              הגישה מתבצעת דרך קישור ייחודי — ללא צורך בחשבון VEYA.
            </div>
          </div>
        </div>

        {/* Add button */}
        <div style={{ marginBottom: 16 }}>
          <button className="fa-btn fa-btn-primary" onClick={() => setShowAdd(true)}>+ הוספת בן/בת משפחה</button>
        </div>

        {/* Add form */}
        {showAdd && (
          <div className="fa-card" style={{ padding: 20, marginBottom: 20 }}>
            <div style={{ fontWeight: 700, color: "#3F4842", fontSize: 15, marginBottom: 14 }}>הזמנת בן/בת משפחה</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>שם *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="שם מלא" className="fa-input" />
              </div>
              <div>
                <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>אימייל</label>
                <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@example.com" className="fa-input" type="email" />
              </div>
              <div>
                <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>טלפון</label>
                <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="050-..." className="fa-input" />
              </div>
              <div>
                <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>רמת גישה</label>
                <select value={form.accessLevel} onChange={e => setForm(f => ({ ...f, accessLevel: e.target.value as any }))} className="fa-select">
                  <option value="view_only">צפייה בלבד</option>
                  <option value="limited_edit">עריכה מוגבלת</option>
                </select>
              </div>
              {form.accessLevel === "limited_edit" && (
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>אזור לעריכה</label>
                  <select value={form.assignedArea} onChange={e => setForm(f => ({ ...f, assignedArea: e.target.value }))} className="fa-select">
                    <option value="">בחר אזור</option>
                    {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "flex-end" }}>
              <button className="fa-btn fa-btn-outline" onClick={() => { setShowAdd(false); setForm(EMPTY_FORM); }}>ביטול</button>
              <button className="fa-btn fa-btn-primary" onClick={handleInvite} disabled={invite.isPending}>
                {invite.isPending ? "יוצר קישור..." : "צור קישור הזמנה"}
              </button>
            </div>
          </div>
        )}

        {/* Members list */}
        {isLoading ? (
          <div style={{ textAlign: "center", padding: 40, color: "#888" }}>טוען...</div>
        ) : memberList.length === 0 ? (
          <div className="fa-card" style={{ padding: 48, textAlign: "center" }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#A8C3B0" strokeWidth="1.2" style={{ marginBottom: 12 }}>
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <div style={{ color: "#888", fontSize: 15 }}>טרם שותפו בני משפחה</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {memberList.map((m: any) => (
              <div key={m.id} className="fa-card" style={{ padding: "16px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  {/* Avatar */}
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#F0EDE8", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontFamily: "'Frank Ruhl Libre', serif", fontSize: 16, color: "#5D6861", fontWeight: 600 }}>
                    {m.name.charAt(0)}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: "#3F4842", fontSize: 15 }}>{m.name}</div>
                    <div style={{ fontSize: 12, color: "#888", marginTop: 2, display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <span>{ACCESS_LABELS[m.accessLevel] ?? m.accessLevel}</span>
                      {m.assignedArea && <span>· {m.assignedArea}</span>}
                      {m.email && <span>· {m.email}</span>}
                    </div>
                  </div>

                  {/* Status */}
                  <div style={{
                    background: (STATUS_COLORS[m.status] ?? "#ccc") + "22",
                    color: STATUS_COLORS[m.status] ?? "#888",
                    borderRadius: 9999,
                    padding: "4px 12px",
                    fontSize: 12,
                    fontWeight: 500,
                    flexShrink: 0,
                  }}>
                    {STATUS_LABELS[m.status] ?? m.status}
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                    {m.status !== "revoked" && m.inviteToken && (
                      <button
                        className="fa-btn fa-btn-ghost"
                        onClick={() => copyInviteLink(m.inviteToken, m.id)}
                        title="העתק קישור הזמנה"
                        style={{ color: copiedId === m.id ? "#5D6861" : "#A8C3B0" }}
                      >
                        {copiedId === m.id ? (
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                        ) : (
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                        )}
                      </button>
                    )}
                    {m.status === "active" && (
                      <button
                        className="fa-btn fa-btn-ghost"
                        onClick={() => revoke.mutate({ id: m.id })}
                        title="בטל גישה"
                        style={{ color: "#c0392b" }}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                      </button>
                    )}
                    {m.status === "revoked" && (
                      <button
                        className="fa-btn fa-btn-ghost"
                        onClick={() => { if (confirm("למחוק לחלוטין?")) remove.mutate({ id: m.id }); }}
                        title="מחק"
                        style={{ color: "#c0392b" }}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* Invite link (pending) */}
                {m.status === "pending" && m.inviteToken && (
                  <div style={{ marginTop: 12, padding: "10px 14px", background: "#F8F6F2", borderRadius: 10, display: "flex", alignItems: "center", gap: 10 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A8C3B0" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                    <span style={{ fontSize: 12, color: "#888", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {`${window.location.origin}/family-access/${m.inviteToken}`}
                    </span>
                    <button
                      className="fa-btn fa-btn-outline"
                      style={{ padding: "4px 12px", fontSize: 12 }}
                      onClick={() => copyInviteLink(m.inviteToken, m.id)}
                    >
                      {copiedId === m.id ? "הועתק ✓" : "העתק"}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
