import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { toast } from "sonner";

type DietType = "regular" | "vegetarian" | "vegan" | "child";

const DIET_LABELS: Record<DietType, string> = {
  regular: "רגיל",
  vegetarian: "צמחוני",
  vegan: "טבעוני",
  child: "ילדים",
};

const RSVP_LABELS = {
  pending: "ממתין",
  yes: "מגיע",
  no: "לא מגיע",
  maybe: "אולי",
};

const RSVP_COLORS = {
  pending: "#A8C3B0",
  yes: "#5D6861",
  no: "#c0392b",
  maybe: "#D9C5A1",
};

export default function Guests() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "yes" | "no" | "maybe">("all");
  const [search, setSearch] = useState("");

  const utils = trpc.useUtils();
  const { data: guests = [], isLoading } = trpc.guest.list.useQuery();
  const createGuest = trpc.guest.create.useMutation({
    onSuccess: () => { utils.guest.list.invalidate(); setShowAdd(false); toast.success("אורח נוסף בהצלחה"); },
    onError: (e) => toast.error(e.message),
  });
  const updateGuest = trpc.guest.update.useMutation({
    onSuccess: () => { utils.guest.list.invalidate(); setEditId(null); toast.success("עודכן בהצלחה"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteGuest = trpc.guest.delete.useMutation({
    onSuccess: () => { utils.guest.list.invalidate(); toast.success("אורח הוסר"); },
    onError: (e) => toast.error(e.message),
  });

  const [form, setForm] = useState({
    name: "", count: 1, side: "", group: "", phone: "",
    dietType: "" as DietType | "", allergies: "",
  });

  const resetForm = () => setForm({ name: "", count: 1, side: "", group: "", phone: "", dietType: "", allergies: "" });

  const filtered = guests.filter(g => {
    if (filter !== "all" && g.rsvpStatus !== filter) return false;
    if (search && !g.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalConfirmed = guests.filter(g => g.rsvpStatus === "yes").reduce((s, g) => s + (g.count ?? 1), 0);
  const totalGuests = guests.reduce((s, g) => s + (g.count ?? 1), 0);

  const mealCounts: Record<string, number> = {};
  guests.filter(g => g.rsvpStatus === "yes").forEach(g => {
    const diet = (g.diet as { type?: string } | null)?.type ?? "regular";
    mealCounts[diet] = (mealCounts[diet] ?? 0) + (g.count ?? 1);
  });

  if (!user) { navigate("/"); return null; }

  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: "#F8F6F2", fontFamily: "'Heebo', sans-serif" }}>
      {/* Header */}
      <div style={{ background: "#3F4842", padding: "16px 24px", display: "flex", alignItems: "center", gap: 16 }}>
        <button onClick={() => navigate("/couple/dashboard")} style={{ background: "none", border: "none", color: "#A8C3B0", cursor: "pointer", fontSize: 20 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <h1 style={{ color: "#F8F6F2", fontFamily: "'Frank Ruhl Libre', serif", fontSize: 22, margin: 0 }}>ניהול אורחים</h1>
        <div style={{ marginRight: "auto", display: "flex", gap: 8 }}>
          <span style={{ background: "#5D6861", color: "#F8F6F2", borderRadius: 9999, padding: "4px 12px", fontSize: 13 }}>
            {totalConfirmed} / {totalGuests} מגיעים
          </span>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px" }}>
        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
          {(["all", "yes", "pending", "no"] as const).map(status => {
            const count = status === "all"
              ? guests.reduce((s, g) => s + (g.count ?? 1), 0)
              : guests.filter(g => g.rsvpStatus === status).reduce((s, g) => s + (g.count ?? 1), 0);
            return (
              <button key={status} onClick={() => setFilter(status)} style={{
                background: filter === status ? "#3F4842" : "#fff",
                border: `1px solid ${filter === status ? "#3F4842" : "#e8e2d9"}`,
                borderRadius: 18, padding: "14px 16px", cursor: "pointer", textAlign: "center",
                boxShadow: "0 1px 2px rgba(45,45,45,.04), 0 8px 24px rgba(63,72,66,.06)",
              }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: filter === status ? "#F8F6F2" : "#3F4842" }}>{count}</div>
                <div style={{ fontSize: 12, color: filter === status ? "#A8C3B0" : "#888", marginTop: 2 }}>
                  {status === "all" ? "סה\"כ" : RSVP_LABELS[status]}
                </div>
              </button>
            );
          })}
        </div>

        {/* Meal summary */}
        {Object.keys(mealCounts).length > 0 && (
          <div style={{ background: "#fff", borderRadius: 18, padding: 16, marginBottom: 20, boxShadow: "0 1px 2px rgba(45,45,45,.04), 0 8px 24px rgba(63,72,66,.06)" }}>
            <div style={{ fontSize: 13, color: "#888", marginBottom: 8 }}>סיכום מנות (מגיעים)</div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {Object.entries(mealCounts).map(([type, count]) => (
                <span key={type} style={{ background: "#F8F6F2", border: "1px solid #e8e2d9", borderRadius: 9999, padding: "4px 12px", fontSize: 13, color: "#3F4842" }}>
                  {DIET_LABELS[type as DietType] ?? type}: {count}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Search + Add */}
        <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="חיפוש לפי שם..."
            style={{ flex: 1, padding: "10px 14px", borderRadius: 9999, border: "1px solid #e8e2d9", background: "#fff", fontSize: 14, fontFamily: "'Heebo', sans-serif" }}
          />
          <button onClick={() => { resetForm(); setShowAdd(true); }} style={{
            background: "#3F4842", color: "#F8F6F2", border: "none", borderRadius: 9999,
            padding: "10px 20px", cursor: "pointer", fontSize: 14, fontWeight: 600,
          }}>+ הוספת אורח</button>
        </div>

        {/* Add form */}
        {showAdd && (
          <div style={{ background: "#fff", borderRadius: 18, padding: 20, marginBottom: 20, boxShadow: "0 1px 2px rgba(45,45,45,.04), 0 8px 24px rgba(63,72,66,.06)" }}>
            <h3 style={{ margin: "0 0 16px", fontFamily: "'Frank Ruhl Libre', serif", color: "#3F4842" }}>אורח חדש</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>שם *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 9999, border: "1px solid #e8e2d9", fontSize: 14, fontFamily: "'Heebo', sans-serif", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>כמות</label>
                <input type="number" min={1} max={20} value={form.count} onChange={e => setForm(f => ({ ...f, count: Number(e.target.value) }))}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 9999, border: "1px solid #e8e2d9", fontSize: 14, fontFamily: "'Heebo', sans-serif", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>צד</label>
                <input value={form.side} onChange={e => setForm(f => ({ ...f, side: e.target.value }))}
                  placeholder="צד 1 / צד 2 / משותף"
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 9999, border: "1px solid #e8e2d9", fontSize: 14, fontFamily: "'Heebo', sans-serif", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>קבוצה</label>
                <input value={form.group} onChange={e => setForm(f => ({ ...f, group: e.target.value }))}
                  placeholder="משפחה / חברים / עבודה"
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 9999, border: "1px solid #e8e2d9", fontSize: 14, fontFamily: "'Heebo', sans-serif", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>טלפון</label>
                <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 9999, border: "1px solid #e8e2d9", fontSize: 14, fontFamily: "'Heebo', sans-serif", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>מנה</label>
                <select value={form.dietType} onChange={e => setForm(f => ({ ...f, dietType: e.target.value as DietType | "" }))}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 9999, border: "1px solid #e8e2d9", fontSize: 14, fontFamily: "'Heebo', sans-serif", boxSizing: "border-box" }}>
                  <option value="">רגיל</option>
                  {Object.entries(DIET_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>אלרגיות / הערות</label>
                <input value={form.allergies} onChange={e => setForm(f => ({ ...f, allergies: e.target.value }))}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 9999, border: "1px solid #e8e2d9", fontSize: 14, fontFamily: "'Heebo', sans-serif", boxSizing: "border-box" }} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "flex-end" }}>
              <button onClick={() => setShowAdd(false)} style={{ background: "none", border: "1px solid #e8e2d9", borderRadius: 9999, padding: "8px 20px", cursor: "pointer", fontSize: 14 }}>ביטול</button>
              <button onClick={() => {
                if (!form.name.trim()) { toast.error("שם הוא שדה חובה"); return; }
                createGuest.mutate({
                  name: form.name.trim(),
                  count: form.count,
                  side: form.side || undefined,
                  group: form.group || undefined,
                  phone: form.phone || undefined,
                  diet: form.dietType ? { type: form.dietType, allergies: form.allergies || undefined } : undefined,
                });
              }} disabled={createGuest.isPending} style={{
                background: "#3F4842", color: "#F8F6F2", border: "none", borderRadius: 9999,
                padding: "8px 20px", cursor: "pointer", fontSize: 14, fontWeight: 600,
              }}>{createGuest.isPending ? "שומר..." : "שמירה"}</button>
            </div>
          </div>
        )}

        {/* Guest list */}
        {isLoading ? (
          <div style={{ textAlign: "center", padding: 40, color: "#888" }}>טוען...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: "#888" }}>
            {guests.length === 0 ? "עדיין לא הוספת אורחים" : "לא נמצאו אורחים לפי הסינון"}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filtered.map(g => (
              <div key={g.id} style={{
                background: "#fff", borderRadius: 18, padding: "14px 18px",
                boxShadow: "0 1px 2px rgba(45,45,45,.04), 0 8px 24px rgba(63,72,66,.06)",
                display: "flex", alignItems: "center", gap: 12,
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: "#3F4842", fontSize: 15 }}>{g.name}</div>
                  <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
                    {g.count > 1 && <span style={{ marginLeft: 8 }}>{g.count} אנשים</span>}
                    {g.side && <span style={{ marginLeft: 8 }}>• {g.side}</span>}
                    {g.group && <span style={{ marginLeft: 8 }}>• {g.group}</span>}
                    {(g.diet as { type?: string } | null)?.type && (
                      <span style={{ marginLeft: 8 }}>• {DIET_LABELS[(g.diet as { type: DietType }).type]}</span>
                    )}
                    {(g.diet as { allergies?: string } | null)?.allergies && (
                      <span style={{ color: "#c0392b", marginLeft: 8 }}>⚠ {(g.diet as { allergies: string }).allergies}</span>
                    )}
                  </div>
                </div>

                {/* RSVP selector */}
                <select
                  value={g.rsvpStatus}
                  onChange={e => updateGuest.mutate({ id: g.id, rsvpStatus: e.target.value as "pending" | "yes" | "no" | "maybe" })}
                  style={{
                    padding: "4px 10px", borderRadius: 9999, border: "none",
                    background: RSVP_COLORS[g.rsvpStatus as keyof typeof RSVP_COLORS] + "33",
                    color: "#3F4842", fontSize: 13, cursor: "pointer", fontFamily: "'Heebo', sans-serif",
                  }}
                >
                  {Object.entries(RSVP_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>

                {/* Delete */}
                <button onClick={() => {
                  if (confirm(`להסיר את ${g.name}?`)) deleteGuest.mutate({ id: g.id });
                }} style={{ background: "none", border: "none", color: "#ccc", cursor: "pointer", padding: 4 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
