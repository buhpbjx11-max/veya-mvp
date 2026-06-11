import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { toast } from "sonner";

const CATEGORIES = ["אולם", "קייטרינג", "צילום", "וידאו", "מוזיקה", "פרחים", "שמלה/חליפה", "הזמנות", "תאורה", "הסעות", "כיבוד", "אחר"];

export default function Budget() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ category: "", description: "", estimatedAmount: "", actualAmount: "", paid: false, notes: "" });

  const { data: items = [], isLoading } = trpc.budget.list.useQuery();
  const createItem = trpc.budget.create.useMutation({
    onSuccess: () => { utils.budget.list.invalidate(); setShowAdd(false); setForm({ category: "", description: "", estimatedAmount: "", actualAmount: "", paid: false, notes: "" }); toast.success("פריט נוסף"); },
    onError: (e) => toast.error(e.message),
  });
  const updateItem = trpc.budget.update.useMutation({
    onSuccess: () => { utils.budget.list.invalidate(); toast.success("עודכן"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteItem = trpc.budget.delete.useMutation({
    onSuccess: () => { utils.budget.list.invalidate(); toast.success("פריט הוסר"); },
    onError: (e) => toast.error(e.message),
  });

  if (!user) { navigate("/"); return null; }

  const totalEstimated = items.reduce((s, i) => s + parseFloat(i.estimatedAmount ?? "0"), 0);
  const totalActual = items.reduce((s, i) => s + parseFloat(i.actualAmount ?? "0"), 0);
  const totalPaid = items.filter(i => i.paid).reduce((s, i) => s + parseFloat(i.actualAmount ?? i.estimatedAmount ?? "0"), 0);

  const fmt = (n: number) => n.toLocaleString("he-IL", { style: "currency", currency: "ILS", maximumFractionDigits: 0 });

  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: "#F8F6F2", fontFamily: "'Heebo', sans-serif" }}>
      <div style={{ background: "#3F4842", padding: "16px 24px", display: "flex", alignItems: "center", gap: 16 }}>
        <button onClick={() => navigate("/couple/dashboard")} style={{ background: "none", border: "none", color: "#A8C3B0", cursor: "pointer" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <h1 style={{ color: "#F8F6F2", fontFamily: "'Frank Ruhl Libre', serif", fontSize: 22, margin: 0 }}>תקציב</h1>
        <button onClick={() => setShowAdd(true)} style={{
          marginRight: "auto", background: "#A8C3B0", color: "#3F4842", border: "none",
          borderRadius: 9999, padding: "8px 18px", cursor: "pointer", fontSize: 13, fontWeight: 600,
        }}>+ הוספת פריט</button>
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "24px 16px" }}>
        {/* Summary */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
          {[
            { label: "תקציב מתוכנן", value: fmt(totalEstimated), color: "#3F4842" },
            { label: "הוצאה בפועל", value: fmt(totalActual), color: "#5D6861" },
            { label: "שולם", value: fmt(totalPaid), color: "#A8C3B0" },
          ].map(s => (
            <div key={s.label} style={{ background: "#fff", borderRadius: 18, padding: 16, textAlign: "center", boxShadow: "0 1px 2px rgba(45,45,45,.04), 0 8px 24px rgba(63,72,66,.06)" }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Add form */}
        {showAdd && (
          <div style={{ background: "#fff", borderRadius: 18, padding: 20, marginBottom: 20, boxShadow: "0 1px 2px rgba(45,45,45,.04), 0 8px 24px rgba(63,72,66,.06)" }}>
            <h3 style={{ margin: "0 0 16px", fontFamily: "'Frank Ruhl Libre', serif", color: "#3F4842" }}>פריט חדש</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>קטגוריה *</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 9999, border: "1px solid #e8e2d9", fontSize: 14, fontFamily: "'Heebo', sans-serif", boxSizing: "border-box" }}>
                  <option value="">בחרי קטגוריה</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>תיאור</label>
                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 9999, border: "1px solid #e8e2d9", fontSize: 14, fontFamily: "'Heebo', sans-serif", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>סכום מתוכנן (₪)</label>
                <input type="number" value={form.estimatedAmount} onChange={e => setForm(f => ({ ...f, estimatedAmount: e.target.value }))}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 9999, border: "1px solid #e8e2d9", fontSize: 14, fontFamily: "'Heebo', sans-serif", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>סכום בפועל (₪)</label>
                <input type="number" value={form.actualAmount} onChange={e => setForm(f => ({ ...f, actualAmount: e.target.value }))}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 9999, border: "1px solid #e8e2d9", fontSize: 14, fontFamily: "'Heebo', sans-serif", boxSizing: "border-box" }} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "space-between", alignItems: "center" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14 }}>
                <input type="checkbox" checked={form.paid} onChange={e => setForm(f => ({ ...f, paid: e.target.checked }))} />
                שולם
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setShowAdd(false)} style={{ background: "none", border: "1px solid #e8e2d9", borderRadius: 9999, padding: "8px 20px", cursor: "pointer", fontSize: 14 }}>ביטול</button>
                <button onClick={() => {
                  if (!form.category) { toast.error("קטגוריה היא שדה חובה"); return; }
                  createItem.mutate({ ...form, estimatedAmount: form.estimatedAmount || undefined, actualAmount: form.actualAmount || undefined });
                }} disabled={createItem.isPending} style={{
                  background: "#3F4842", color: "#F8F6F2", border: "none", borderRadius: 9999,
                  padding: "8px 20px", cursor: "pointer", fontSize: 14, fontWeight: 600,
                }}>{createItem.isPending ? "שומר..." : "שמירה"}</button>
              </div>
            </div>
          </div>
        )}

        {/* Items list */}
        {isLoading ? (
          <div style={{ textAlign: "center", padding: 40, color: "#888" }}>טוען...</div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: "#888" }}>עדיין לא הוספת פריטי תקציב</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {items.map(item => (
              <div key={item.id} style={{
                background: "#fff", borderRadius: 18, padding: "14px 18px",
                boxShadow: "0 1px 2px rgba(45,45,45,.04), 0 8px 24px rgba(63,72,66,.06)",
                display: "flex", alignItems: "center", gap: 12,
                borderRight: `4px solid ${item.paid ? "#A8C3B0" : "#e8e2d9"}`,
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: "#3F4842", fontSize: 15 }}>{item.category}</div>
                  {item.description && <div style={{ fontSize: 12, color: "#888" }}>{item.description}</div>}
                </div>
                <div style={{ textAlign: "left" }}>
                  {item.estimatedAmount && <div style={{ fontSize: 12, color: "#888" }}>מתוכנן: {fmt(parseFloat(item.estimatedAmount))}</div>}
                  {item.actualAmount && <div style={{ fontSize: 14, fontWeight: 600, color: "#3F4842" }}>{fmt(parseFloat(item.actualAmount))}</div>}
                </div>
                <button onClick={() => updateItem.mutate({ id: item.id, paid: !item.paid })} style={{
                  background: item.paid ? "#A8C3B0" : "#F8F6F2", border: "1px solid #e8e2d9",
                  borderRadius: 9999, padding: "4px 12px", cursor: "pointer", fontSize: 12, color: "#3F4842",
                }}>{item.paid ? "שולם ✓" : "סמן כשולם"}</button>
                <button onClick={() => {
                  if (confirm("להסיר פריט זה?")) deleteItem.mutate({ id: item.id });
                }} style={{ background: "none", border: "none", color: "#ccc", cursor: "pointer", padding: 4 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
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
