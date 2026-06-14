import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { toast } from "sonner";

const CATEGORIES = ["צלם/צלמת", "DJ/תקליטן", "קייטרינג", "פרחים", "תאורה", "הגברה", "שמלה/חליפה", "קייק", "הסעות", "מאפר/מעצב שיער", "אחר"];
const STATUS_LABELS: Record<string, string> = { active: "פעיל", pending: "ממתין", done: "הושלם", cancelled: "בוטל" };
const STATUS_COLORS: Record<string, string> = { active: "#5D6861", pending: "#D9C5A1", done: "#A8C3B0", cancelled: "#c0392b" };

const EMPTY_FORM = { name: "", category: "", phone: "", contact: "", status: "active", cost: "" };

export default function Vendors() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [filterCat, setFilterCat] = useState<string>("all");
  const [search, setSearch] = useState("");

  const { data: vendors = [], isLoading } = trpc.vendor.list.useQuery();

  const createVendor = trpc.vendor.create.useMutation({
    onSuccess: () => { utils.vendor.list.invalidate(); setShowAdd(false); setForm(EMPTY_FORM); toast.success("ספק נוסף"); },
    onError: (e) => toast.error(e.message),
  });
  const updateVendor = trpc.vendor.update.useMutation({
    onSuccess: () => { utils.vendor.list.invalidate(); setEditId(null); setForm(EMPTY_FORM); toast.success("עודכן"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteVendor = trpc.vendor.delete.useMutation({
    onSuccess: () => { utils.vendor.list.invalidate(); toast.success("ספק הוסר"); },
    onError: (e) => toast.error(e.message),
  });

  const vendorList = vendors as any[];
  const filtered = vendorList.filter(v => {
    if (filterCat !== "all" && v.category !== filterCat) return false;
    if (search && !v.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const cats = Array.from(new Set(vendorList.map(v => v.category).filter(Boolean)));

  function startEdit(v: any) {
    setEditId(v.id);
    setForm({ name: v.name, category: v.category ?? "", phone: v.phone ?? "", contact: v.contact ?? "", status: v.status ?? "active", cost: "" });
    setShowAdd(false);
  }

  function handleSubmit() {
    if (!form.name.trim()) { toast.error("שם ספק חובה"); return; }
    if (editId) {
      updateVendor.mutate({ id: editId, name: form.name, category: form.category || undefined, phone: form.phone || undefined, contact: form.contact || undefined, status: form.status });
    } else {
      createVendor.mutate({ name: form.name, category: form.category || undefined, phone: form.phone || undefined, contact: form.contact || undefined, status: form.status, cost: form.cost || undefined });
    }
  }

  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: "#F8F6F2", fontFamily: "'Heebo', sans-serif" }}>
      <style>{`
        .v-btn { border: none; border-radius: 9999px; padding: 8px 18px; cursor: pointer; font-size: 13px; font-family: 'Heebo', sans-serif; font-weight: 500; transition: all 0.15s; }
        .v-btn-primary { background: #3F4842; color: #F8F6F2; }
        .v-btn-primary:hover { background: #2D2D2D; }
        .v-btn-outline { background: #fff; color: #3F4842; border: 1px solid #DDD8CE !important; }
        .v-btn-outline:hover { border-color: #A8C3B0 !important; }
        .v-btn-ghost { background: transparent; color: #5D6861; border: 1px solid transparent !important; padding: 6px 12px; }
        .v-btn-ghost:hover { background: #F0EDE8; }
        .v-input { width: 100%; padding: 9px 13px; border-radius: 9999px; border: 1px solid #DDD8CE; background: #fff; font-size: 14px; font-family: 'Heebo', sans-serif; box-sizing: border-box; outline: none; }
        .v-input:focus { border-color: #A8C3B0; }
        .v-select { width: 100%; padding: 9px 13px; border-radius: 9999px; border: 1px solid #DDD8CE; background: #fff; font-size: 14px; font-family: 'Heebo', sans-serif; box-sizing: border-box; outline: none; cursor: pointer; }
        .v-card { background: #fff; border-radius: 18px; box-shadow: 0 1px 2px rgba(45,45,45,.04), 0 8px 24px rgba(63,72,66,.06); border: 1px solid #EDE8E0; }
        .v-chip { display: inline-flex; align-items: center; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 500; cursor: pointer; border: 1px solid transparent; transition: all 0.15s; }
        .v-chip.active { background: #3F4842; color: #F8F6F2; }
        .v-chip:not(.active) { background: #fff; color: #5D6861; border-color: #DDD8CE; }
        .v-chip:not(.active):hover { border-color: #A8C3B0; }
      `}</style>

      {/* Header */}
      <div style={{ background: "#3F4842", padding: "16px 24px", display: "flex", alignItems: "center", gap: 16 }}>
        <button onClick={() => navigate("/couple/dashboard")} style={{ background: "none", border: "none", color: "#A8C3B0", cursor: "pointer" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <h1 style={{ color: "#F8F6F2", fontFamily: "'Frank Ruhl Libre', serif", fontSize: 22, margin: 0 }}>ספקים</h1>
        <span style={{ marginRight: "auto", background: "rgba(168,195,176,0.25)", color: "#A8C3B0", borderRadius: 9999, padding: "4px 12px", fontSize: 12 }}>
          {vendorList.length} ספקים
        </span>
      </div>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "24px 16px" }}>

        {/* Actions */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
          <button className="v-btn v-btn-primary" onClick={() => { setShowAdd(true); setEditId(null); setForm(EMPTY_FORM); }}>+ הוספת ספק</button>
          <div style={{ marginRight: "auto", display: "flex", gap: 6, flexWrap: "wrap" }}>
            <span className={`v-chip${filterCat === "all" ? " active" : ""}`} onClick={() => setFilterCat("all")}>הכל</span>
            {cats.map(c => (
              <span key={c} className={`v-chip${filterCat === c ? " active" : ""}`} onClick={() => setFilterCat(c)}>{c}</span>
            ))}
          </div>
        </div>

        {/* Search */}
        <div style={{ marginBottom: 16 }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="חיפוש לפי שם..." className="v-input" style={{ maxWidth: 320 }} />
        </div>

        {/* Add/Edit form */}
        {(showAdd || editId !== null) && (
          <div className="v-card" style={{ padding: 20, marginBottom: 20 }}>
            <div style={{ fontWeight: 700, color: "#3F4842", fontSize: 15, marginBottom: 14 }}>
              {editId ? "עריכת ספק" : "הוספת ספק"}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>שם ספק *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="שם מלא" className="v-input" />
              </div>
              <div>
                <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>סוג / קטגוריה</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="v-select">
                  <option value="">בחר קטגוריה</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>טלפון</label>
                <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="050-..." className="v-input" />
              </div>
              <div>
                <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>איש/ת קשר / אימייל</label>
                <input value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))} placeholder="שם או אימייל" className="v-input" />
              </div>
              {!editId && (
                <div>
                  <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>עלות משוערת (₪)</label>
                  <input value={form.cost} onChange={e => setForm(f => ({ ...f, cost: e.target.value }))} placeholder="0" className="v-input" type="number" min="0" />
                </div>
              )}
              <div>
                <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>סטטוס</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="v-select">
                  {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "flex-end" }}>
              <button className="v-btn v-btn-outline" onClick={() => { setShowAdd(false); setEditId(null); setForm(EMPTY_FORM); }}>ביטול</button>
              <button className="v-btn v-btn-primary" onClick={handleSubmit}
                disabled={createVendor.isPending || updateVendor.isPending}>
                {editId ? "שמור שינויים" : "הוספה"}
              </button>
            </div>
          </div>
        )}

        {/* Vendors list */}
        {isLoading ? (
          <div style={{ textAlign: "center", padding: 40, color: "#888" }}>טוען...</div>
        ) : filtered.length === 0 ? (
          <div className="v-card" style={{ padding: 48, textAlign: "center" }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#A8C3B0" strokeWidth="1.2" style={{ marginBottom: 12 }}>
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <div style={{ color: "#888", fontSize: 15 }}>
              {vendorList.length === 0 ? "טרם נוספו ספקים — לחצו על + הוספת ספק" : "אין ספקים תואמים לחיפוש"}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map((v: any) => (
              <div key={v.id} className="v-card" style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 16 }}>
                {/* Category icon */}
                <div style={{ width: 42, height: 42, borderRadius: "50%", background: "#F0EDE8", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5D6861" strokeWidth="1.5">
                    <path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                  </svg>
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: "#3F4842", fontSize: 15, marginBottom: 2 }}>{v.name}</div>
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: 13, color: "#888" }}>
                    {v.category && <span>{v.category}</span>}
                    {v.phone && <span>📞 {v.phone}</span>}
                    {v.contact && <span>✉ {v.contact}</span>}
                  </div>
                </div>

                {/* Status badge */}
                <div style={{
                  background: STATUS_COLORS[v.status] ? STATUS_COLORS[v.status] + "22" : "#F0EDE8",
                  color: STATUS_COLORS[v.status] ?? "#888",
                  borderRadius: 9999,
                  padding: "4px 12px",
                  fontSize: 12,
                  fontWeight: 500,
                  flexShrink: 0,
                }}>
                  {STATUS_LABELS[v.status] ?? v.status}
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                  <button className="v-btn v-btn-ghost" onClick={() => startEdit(v)} title="עריכה">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button className="v-btn v-btn-ghost" onClick={() => { if (confirm("למחוק ספק זה?")) deleteVendor.mutate({ id: v.id }); }} title="מחיקה"
                    style={{ color: "#c0392b" }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
