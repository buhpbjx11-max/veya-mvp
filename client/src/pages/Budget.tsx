import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { toast } from "sonner";

const CATEGORIES = ["אולם", "קייטרינג", "צילום", "וידאו", "מוזיקה", "פרחים", "שמלה/חליפה", "הזמנות", "תאורה", "הסעות", "כיבוד", "טבעות", "שונות", "אחר"];
const CAT_COLORS: Record<string, string> = {
  "אולם": "#3F4842", "קייטרינג": "#5D6861", "צילום": "#A8C3B0", "וידאו": "#7BA08A",
  "מוזיקה": "#D9C5A1", "פרחים": "#B5C9B8", "שמלה/חליפה": "#8FAF98", "הזמנות": "#C8D8CC",
  "תאורה": "#E8E2D9", "הסעות": "#6B8F76", "כיבוד": "#4A7059", "טבעות": "#9AB5A3",
  "שונות": "#DDD8CE", "אחר": "#B0ADA5",
};

function PieChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return (
    <div style={{ width: 160, height: 160, borderRadius: "50%", background: "#E8E2D9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#888" }}>
      אין נתונים
    </div>
  );
  let cumAngle = -Math.PI / 2;
  const slices = data.filter(d => d.value > 0).map(d => {
    const angle = (d.value / total) * 2 * Math.PI;
    const startAngle = cumAngle;
    cumAngle += angle;
    return { ...d, startAngle, endAngle: cumAngle };
  });
  const R = 70, cx = 80, cy = 80;
  function arcPath(start: number, end: number) {
    const x1 = cx + R * Math.cos(start), y1 = cy + R * Math.sin(start);
    const x2 = cx + R * Math.cos(end), y2 = cy + R * Math.sin(end);
    const large = end - start > Math.PI ? 1 : 0;
    return `M ${cx} ${cy} L ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} Z`;
  }
  return (
    <svg width={160} height={160} viewBox="0 0 160 160">
      {slices.map((s, i) => (
        <path key={i} d={arcPath(s.startAngle, s.endAngle)} fill={s.color} stroke="#F8F6F2" strokeWidth={1.5}>
          <title>{s.label}: {s.value.toLocaleString()} ₪</title>
        </path>
      ))}
      <circle cx={cx} cy={cy} r={32} fill="#F8F6F2" />
    </svg>
  );
}

export default function Budget() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ category: "", description: "", estimatedAmount: "", actualAmount: "", paid: false, notes: "" });
  const [activeTab, setActiveTab] = useState<"list" | "chart">("list");

  const { data: items = [], isLoading } = trpc.budget.list.useQuery();
  const createItem = trpc.budget.create.useMutation({
    onSuccess: () => { utils.budget.list.invalidate(); setShowAdd(false); setForm({ category: "", description: "", estimatedAmount: "", actualAmount: "", paid: false, notes: "" }); toast.success("פריט נוסף"); },
    onError: (e) => toast.error(e.message),
  });
  const updateItem = trpc.budget.update.useMutation({
    onSuccess: () => { utils.budget.list.invalidate(); setEditId(null); toast.success("עודכן"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteItem = trpc.budget.delete.useMutation({
    onSuccess: () => utils.budget.list.invalidate(),
    onError: (e) => toast.error(e.message),
  });

  const fmt = (n: number) => "₪" + n.toLocaleString("he-IL", { maximumFractionDigits: 0 });
  const totalEstimated = items.reduce((s, i) => s + parseFloat(i.estimatedAmount ?? "0"), 0);
  const totalActual = items.reduce((s, i) => s + parseFloat(i.actualAmount ?? "0"), 0);
  const totalPaid = items.filter(i => i.paid).reduce((s, i) => s + parseFloat(i.actualAmount ?? i.estimatedAmount ?? "0"), 0);
  const remaining = totalEstimated - totalActual;
  const pctUsed = totalEstimated > 0 ? Math.min(100, Math.round((totalActual / totalEstimated) * 100)) : 0;

  const byCategory = useMemo(() => {
    const map: Record<string, { estimated: number; actual: number }> = {};
    for (const item of items) {
      const cat = item.category ?? "אחר";
      if (!map[cat]) map[cat] = { estimated: 0, actual: 0 };
      map[cat].estimated += parseFloat(item.estimatedAmount ?? "0");
      map[cat].actual += parseFloat(item.actualAmount ?? "0");
    }
    return Object.entries(map).sort((a, b) => b[1].actual - a[1].actual);
  }, [items]);

  const pieData = byCategory.map(([label, v]) => ({ label, value: v.actual || v.estimated, color: CAT_COLORS[label] ?? "#B0ADA5" }));

  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: "#F8F6F2", fontFamily: "'Heebo', sans-serif" }}>
      <style>{`
        .b-btn { border: none; border-radius: 9999px; padding: 8px 18px; cursor: pointer; font-size: 13px; font-family: 'Heebo', sans-serif; font-weight: 500; transition: all 0.15s; }
        .b-btn-primary { background: #3F4842; color: #F8F6F2; }
        .b-btn-primary:hover { background: #2D2D2D; }
        .b-btn-outline { background: #fff; color: #3F4842; border: 1px solid #DDD8CE !important; }
        .b-btn-outline:hover { border-color: #A8C3B0 !important; }
        .b-tab { padding: 6px 18px; border-radius: 9999px; cursor: pointer; font-size: 13px; border: 1px solid transparent; transition: all 0.15s; font-family: 'Heebo', sans-serif; }
        .b-tab.active { background: #3F4842; color: #F8F6F2; }
        .b-tab:not(.active) { background: #fff; color: #5D6861; border-color: #DDD8CE; }
        .b-tab:not(.active):hover { border-color: #A8C3B0; }
      `}</style>

      <div style={{ background: "#3F4842", padding: "16px 24px", display: "flex", alignItems: "center", gap: 16 }}>
        <button onClick={() => navigate("/couple/dashboard")} style={{ background: "none", border: "none", color: "#A8C3B0", cursor: "pointer" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <h1 style={{ color: "#F8F6F2", fontFamily: "'Frank Ruhl Libre', serif", fontSize: 22, margin: 0 }}>תקציב</h1>
        <button onClick={() => setShowAdd(true)} style={{ marginRight: "auto", background: "#A8C3B0", color: "#3F4842", border: "none", borderRadius: 9999, padding: "8px 18px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
          + הוספת פריט
        </button>
      </div>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "24px 16px" }}>
        {/* Summary cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
          {[
            { label: "תקציב כולל", value: fmt(totalEstimated), sub: "מתוכנן", color: "#3F4842" },
            { label: "הוצא", value: fmt(totalActual), sub: `${pctUsed}% מהתקציב`, color: pctUsed > 90 ? "#c0392b" : "#5D6861" },
            { label: "נותר", value: fmt(Math.max(0, remaining)), sub: remaining < 0 ? "חריגה!" : "לתכנון", color: remaining < 0 ? "#c0392b" : "#A8C3B0" },
          ].map(c => (
            <div key={c.label} style={{ background: "#fff", borderRadius: 18, padding: "16px 18px", boxShadow: "0 1px 2px rgba(45,45,45,.04), 0 8px 24px rgba(63,72,66,.06)" }}>
              <div style={{ fontSize: 11, color: "#888", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>{c.label}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: c.color, fontFamily: "'Frank Ruhl Libre', serif" }}>{c.value}</div>
              <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{c.sub}</div>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        {totalEstimated > 0 && (
          <div style={{ background: "#fff", borderRadius: 18, padding: "16px 20px", marginBottom: 20, boxShadow: "0 1px 2px rgba(45,45,45,.04), 0 8px 24px rgba(63,72,66,.06)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13, color: "#5D6861" }}>
              <span>ניצול תקציב</span>
              <span style={{ fontWeight: 700, color: pctUsed > 90 ? "#c0392b" : "#3F4842" }}>{pctUsed}%</span>
            </div>
            <div style={{ background: "#E8E2D9", borderRadius: 9999, height: 10, overflow: "hidden" }}>
              <div style={{ width: `${pctUsed}%`, height: "100%", background: pctUsed > 90 ? "#c0392b" : "#A8C3B0", borderRadius: 9999, transition: "width 0.5s ease" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 11, color: "#888" }}>
              <span>שולם: {fmt(totalPaid)}</span>
              <span>נותר לתשלום: {fmt(Math.max(0, totalActual - totalPaid))}</span>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <button className={`b-tab${activeTab === "list" ? " active" : ""}`} onClick={() => setActiveTab("list")}>רשימה</button>
          <button className={`b-tab${activeTab === "chart" ? " active" : ""}`} onClick={() => setActiveTab("chart")}>גרף קטגוריות</button>
        </div>

        {/* Add form */}
        {showAdd && (
          <div style={{ background: "#fff", borderRadius: 18, padding: 20, marginBottom: 16, boxShadow: "0 1px 2px rgba(45,45,45,.04), 0 8px 24px rgba(63,72,66,.06)" }}>
            <div style={{ fontWeight: 700, color: "#3F4842", fontSize: 15, marginBottom: 14 }}>הוספת פריט תקציב</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>קטגוריה *</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 9999, border: "1px solid #e8e2d9", fontSize: 14, fontFamily: "'Heebo', sans-serif", boxSizing: "border-box" }}>
                  <option value="">בחר קטגוריה</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>תיאור</label>
                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="שם ספק / פרטים"
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
                <button className="b-btn b-btn-outline" onClick={() => setShowAdd(false)}>ביטול</button>
                <button className="b-btn b-btn-primary" onClick={() => {
                  if (!form.category) { toast.error("קטגוריה היא שדה חובה"); return; }
                  createItem.mutate({ ...form, estimatedAmount: form.estimatedAmount || undefined, actualAmount: form.actualAmount || undefined });
                }} disabled={createItem.isPending}>{createItem.isPending ? "שומר..." : "שמירה"}</button>
              </div>
            </div>
          </div>
        )}

        {/* Chart tab */}
        {activeTab === "chart" && (
          <div style={{ background: "#fff", borderRadius: 18, padding: 24, boxShadow: "0 1px 2px rgba(45,45,45,.04), 0 8px 24px rgba(63,72,66,.06)" }}>
            {items.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40, color: "#888" }}>הוסף פריטים כדי לראות את הגרף</div>
            ) : (
              <div style={{ display: "flex", gap: 32, alignItems: "flex-start", flexWrap: "wrap" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                  <PieChart data={pieData} />
                  <div style={{ fontSize: 11, color: "#888" }}>לפי סכום בפועל / מתוכנן</div>
                </div>
                <div style={{ flex: 1, minWidth: 240 }}>
                  {byCategory.map(([cat, v]) => {
                    const pct = v.estimated > 0 ? Math.min(100, Math.round((v.actual / v.estimated) * 100)) : (v.actual > 0 ? 100 : 0);
                    const color = CAT_COLORS[cat] ?? "#B0ADA5";
                    return (
                      <div key={cat} style={{ marginBottom: 14 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 13 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 10, height: 10, borderRadius: "50%", background: color, flexShrink: 0 }} />
                            <span style={{ color: "#3F4842", fontWeight: 500 }}>{cat}</span>
                          </div>
                          <div style={{ display: "flex", gap: 12, fontSize: 12, color: "#888" }}>
                            {v.actual > 0 && <span style={{ color: "#3F4842", fontWeight: 600 }}>{fmt(v.actual)}</span>}
                            {v.estimated > 0 && <span>/ {fmt(v.estimated)}</span>}
                          </div>
                        </div>
                        <div style={{ background: "#E8E2D9", borderRadius: 9999, height: 6, overflow: "hidden" }}>
                          <div style={{ width: `${pct}%`, height: "100%", background: pct > 90 ? "#c0392b" : color, borderRadius: 9999, transition: "width 0.4s ease" }} />
                        </div>
                        <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{pct}% מהתקציב</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* List tab */}
        {activeTab === "list" && (
          isLoading ? (
            <div style={{ textAlign: "center", padding: 40, color: "#888" }}>טוען...</div>
          ) : items.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: "#888" }}>עדיין לא הוספת פריטי תקציב</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {(items as any[]).map((item) => (
                <div key={item.id} style={{
                  background: "#fff", borderRadius: 18, padding: "14px 18px",
                  boxShadow: "0 1px 2px rgba(45,45,45,.04), 0 8px 24px rgba(63,72,66,.06)",
                  display: "flex", alignItems: "center", gap: 12,
                  borderRight: `4px solid ${item.paid ? "#A8C3B0" : (CAT_COLORS[item.category] ?? "#e8e2d9")}`,
                }}>
                  {editId === item.id ? (
                    <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                      <input defaultValue={item.description ?? ""} id={`desc-${item.id}`}
                        style={{ padding: "6px 10px", borderRadius: 9999, border: "1px solid #e8e2d9", fontSize: 13, fontFamily: "'Heebo', sans-serif" }} />
                      <input type="number" defaultValue={item.estimatedAmount ?? ""} id={`est-${item.id}`} placeholder="מתוכנן"
                        style={{ padding: "6px 10px", borderRadius: 9999, border: "1px solid #e8e2d9", fontSize: 13, fontFamily: "'Heebo', sans-serif" }} />
                      <input type="number" defaultValue={item.actualAmount ?? ""} id={`act-${item.id}`} placeholder="בפועל"
                        style={{ padding: "6px 10px", borderRadius: 9999, border: "1px solid #e8e2d9", fontSize: 13, fontFamily: "'Heebo', sans-serif" }} />
                    </div>
                  ) : (
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: CAT_COLORS[item.category] ?? "#B0ADA5", flexShrink: 0 }} />
                        <span style={{ fontWeight: 600, color: "#3F4842", fontSize: 15 }}>{item.category}</span>
                        {item.description && <span style={{ fontSize: 12, color: "#888" }}>— {item.description}</span>}
                      </div>
                    </div>
                  )}
                  <div style={{ textAlign: "left", minWidth: 100 }}>
                    {item.estimatedAmount && <div style={{ fontSize: 11, color: "#888" }}>מתוכנן: {fmt(parseFloat(item.estimatedAmount))}</div>}
                    {item.actualAmount && <div style={{ fontSize: 14, fontWeight: 700, color: "#3F4842" }}>{fmt(parseFloat(item.actualAmount))}</div>}
                  </div>
                  {editId === item.id ? (
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="b-btn b-btn-primary" style={{ padding: "6px 14px" }} onClick={() => {
                        const desc = (document.getElementById(`desc-${item.id}`) as HTMLInputElement)?.value;
                        const est = (document.getElementById(`est-${item.id}`) as HTMLInputElement)?.value;
                        const act = (document.getElementById(`act-${item.id}`) as HTMLInputElement)?.value;
                        updateItem.mutate({ id: item.id, description: desc || undefined, estimatedAmount: est || undefined, actualAmount: act || undefined });
                      }}>שמור</button>
                      <button className="b-btn b-btn-outline" style={{ padding: "6px 14px" }} onClick={() => setEditId(null)}>ביטול</button>
                    </div>
                  ) : (
                    <>
                      <button onClick={() => updateItem.mutate({ id: item.id, paid: !item.paid })} style={{
                        background: item.paid ? "#A8C3B0" : "#F8F6F2", border: "1px solid #e8e2d9",
                        borderRadius: 9999, padding: "4px 12px", cursor: "pointer", fontSize: 12, color: "#3F4842", fontFamily: "'Heebo', sans-serif",
                      }}>{item.paid ? "שולם ✓" : "סמן כשולם"}</button>
                      <button onClick={() => setEditId(item.id)} style={{ background: "none", border: "none", color: "#A8C3B0", cursor: "pointer", padding: 4 }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button onClick={() => { if (confirm("להסיר פריט זה?")) deleteItem.mutate({ id: item.id }); }}
                        style={{ background: "none", border: "none", color: "#ccc", cursor: "pointer", padding: 4 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
