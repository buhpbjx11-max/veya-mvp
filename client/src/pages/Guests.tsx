import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import Papa from "papaparse";

type DietType = "regular" | "vegetarian" | "vegan" | "child";
const DIET_LABELS: Record<DietType, string> = { regular: "רגיל", vegetarian: "צמחוני", vegan: "טבעוני", child: "ילדים" };
const RSVP_LABELS = { pending: "ממתין", yes: "מגיע", no: "לא מגיע", maybe: "אולי" };
const RSVP_COLORS = { pending: "#A8C3B0", yes: "#5D6861", no: "#c0392b", maybe: "#D9C5A1" };

type RsvpStatus = "pending" | "yes" | "no" | "maybe";

const EMPTY_FORM = { name: "", count: 1, side: "", group: "", phone: "", dietType: "" as DietType | "", allergies: "" };

export default function Guests() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const [search, setSearch] = useState("");
  const [filterRsvp, setFilterRsvp] = useState<RsvpStatus | "all">("all");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [importPreview, setImportPreview] = useState<any[] | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: guests = [], isLoading } = trpc.guest.list.useQuery();
  const createGuest = trpc.guest.create.useMutation({
    onSuccess: () => { utils.guest.list.invalidate(); setShowAdd(false); setForm(EMPTY_FORM); toast.success("אורח נוסף"); },
    onError: (e) => toast.error(e.message),
  });
  const updateGuest = trpc.guest.update.useMutation({
    onSuccess: () => utils.guest.list.invalidate(),
    onError: (e) => toast.error(e.message),
  });
  const deleteGuest = trpc.guest.delete.useMutation({
    onSuccess: () => utils.guest.list.invalidate(),
    onError: (e) => toast.error(e.message),
  });
  const bulkCreate = trpc.guest.bulkCreate.useMutation({
    onSuccess: (r) => { utils.guest.list.invalidate(); setImportPreview(null); toast.success(`${r.created} אורחים יובאו בהצלחה`); },
    onError: (e) => toast.error(e.message),
  });

  const guestList = guests as any[];
  const filtered = guestList.filter(g => {
    if (filterRsvp !== "all" && g.rsvpStatus !== filterRsvp) return false;
    if (search && !g.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalConfirmed = guestList.filter(g => g.rsvpStatus === "yes").reduce((s, g) => s + (g.count ?? 1), 0);
  const totalGuests = guestList.reduce((s, g) => s + (g.count ?? 1), 0);

  // ─── Export ───────────────────────────────────────────────────────────────
  function exportToExcel() {
    const rows = guestList.map(g => ({
      "שם": g.name,
      "כמות": g.count ?? 1,
      "צד": g.side ?? "",
      "קבוצה": g.group ?? "",
      "טלפון": g.phone ?? "",
      "RSVP": RSVP_LABELS[g.rsvpStatus as RsvpStatus] ?? g.rsvpStatus,
      "תזונה": (g.diet as any)?.type ? DIET_LABELS[(g.diet as any).type as DietType] : "",
      "אלרגיות": (g.diet as any)?.allergies ?? "",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "אורחים");
    XLSX.writeFile(wb, "רשימת-אורחים.xlsx");
  }

  function exportToCSV() {
    const rows = guestList.map(g => ({
      name: g.name,
      count: g.count ?? 1,
      side: g.side ?? "",
      group: g.group ?? "",
      phone: g.phone ?? "",
      rsvp: g.rsvpStatus,
      diet: (g.diet as any)?.type ?? "",
      allergies: (g.diet as any)?.allergies ?? "",
    }));
    const csv = Papa.unparse(rows, { header: true });
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "רשימת-אורחים.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  // ─── Import ───────────────────────────────────────────────────────────────
  function handleImportFile(file: File) {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext === "csv") {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          const rows = parseImportRows(result.data as any[]);
          setImportPreview(rows);
        },
        error: () => toast.error("שגיאה בקריאת CSV"),
      });
    } else if (ext === "xlsx" || ext === "xls") {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(ws, { defval: "" });
        const rows = parseImportRows(json as any[]);
        setImportPreview(rows);
      };
      reader.readAsArrayBuffer(file);
    } else {
      toast.error("נתמך רק CSV, XLSX, XLS");
    }
  }

  function parseImportRows(rows: any[]): any[] {
    return rows.map(r => {
      // Support Hebrew and English column names
      const name = r["שם"] || r["name"] || r["Name"] || "";
      const count = parseInt(r["כמות"] || r["count"] || r["Count"] || "1") || 1;
      const side = r["צד"] || r["side"] || r["Side"] || "";
      const group = r["קבוצה"] || r["group"] || r["Group"] || "";
      const phone = r["טלפון"] || r["phone"] || r["Phone"] || "";
      return { name: String(name).trim(), count, side: String(side).trim(), group: String(group).trim(), phone: String(phone).trim() };
    }).filter(r => r.name.length > 0);
  }

  async function confirmImport() {
    if (!importPreview || importPreview.length === 0) return;
    setImporting(true);
    try {
      await bulkCreate.mutateAsync({ guests: importPreview.map(g => ({ name: g.name, count: g.count, side: g.side || undefined, group: g.group || undefined, phone: g.phone || undefined })) });
    } finally {
      setImporting(false);
    }
  }

  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: "#F8F6F2", fontFamily: "'Heebo', sans-serif" }}>
      <style>{`
        .g-btn { border: none; border-radius: 9999px; padding: 8px 18px; cursor: pointer; font-size: 13px; font-family: 'Heebo', sans-serif; font-weight: 500; transition: all 0.15s; }
        .g-btn-primary { background: #3F4842; color: #F8F6F2; }
        .g-btn-primary:hover { background: #2D2D2D; }
        .g-btn-outline { background: #fff; color: #3F4842; border: 1px solid #DDD8CE !important; }
        .g-btn-outline:hover { border-color: #A8C3B0 !important; }
        .g-chip { display: inline-flex; align-items: center; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 500; cursor: pointer; border: 1px solid transparent; transition: all 0.15s; }
        .g-chip.active { background: #3F4842; color: #F8F6F2; }
        .g-chip:not(.active) { background: #fff; color: #5D6861; border-color: #DDD8CE; }
        .g-chip:not(.active):hover { border-color: #A8C3B0; }
      `}</style>

      {/* Header */}
      <div style={{ background: "#3F4842", padding: "16px 24px", display: "flex", alignItems: "center", gap: 16 }}>
        <button onClick={() => navigate("/couple/dashboard")} style={{ background: "none", border: "none", color: "#A8C3B0", cursor: "pointer" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <h1 style={{ color: "#F8F6F2", fontFamily: "'Frank Ruhl Libre', serif", fontSize: 22, margin: 0 }}>אורחים</h1>
        <div style={{ marginRight: "auto", display: "flex", gap: 8 }}>
          <span style={{ background: "rgba(168,195,176,0.25)", color: "#A8C3B0", borderRadius: 9999, padding: "4px 12px", fontSize: 12 }}>{totalConfirmed} מגיעים</span>
          <span style={{ background: "rgba(248,246,242,0.1)", color: "rgba(248,246,242,0.6)", borderRadius: 9999, padding: "4px 12px", fontSize: 12 }}>{totalGuests} סה"כ</span>
        </div>
      </div>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "24px 16px" }}>
        {/* Actions bar */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
          <button className="g-btn g-btn-primary" onClick={() => setShowAdd(true)}>+ הוספת אורח</button>
          <button className="g-btn g-btn-outline" onClick={() => fileInputRef.current?.click()}>📥 ייבוא CSV/Excel</button>
          <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" style={{ display: "none" }} onChange={e => { if (e.target.files?.[0]) handleImportFile(e.target.files[0]); e.target.value = ""; }} />
          <div style={{ marginRight: "auto", display: "flex", gap: 6 }}>
            <button className="g-btn g-btn-outline" onClick={exportToExcel} title="ייצוא Excel">📊 Excel</button>
            <button className="g-btn g-btn-outline" onClick={exportToCSV} title="ייצוא CSV">📄 CSV</button>
          </div>
        </div>

        {/* Import preview */}
        {importPreview && (
          <div style={{ background: "#fff", borderRadius: 18, padding: 20, marginBottom: 20, boxShadow: "0 1px 2px rgba(45,45,45,.04), 0 8px 24px rgba(63,72,66,.06)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ fontWeight: 700, color: "#3F4842", fontSize: 15 }}>תצוגה מקדימה — {importPreview.length} אורחים</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="g-btn g-btn-outline" onClick={() => setImportPreview(null)}>ביטול</button>
                <button className="g-btn g-btn-primary" onClick={confirmImport} disabled={importing}>{importing ? "מייבא..." : "אישור ייבוא"}</button>
              </div>
            </div>
            <div style={{ maxHeight: 200, overflow: "auto", fontSize: 13 }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr style={{ borderBottom: "1px solid #E8E2D9" }}>
                  {["שם", "כמות", "צד", "קבוצה", "טלפון"].map(h => <th key={h} style={{ padding: "6px 8px", textAlign: "right", color: "#888", fontWeight: 500 }}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {importPreview.slice(0, 20).map((r, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #F0EDE8" }}>
                      <td style={{ padding: "6px 8px", color: "#3F4842" }}>{r.name}</td>
                      <td style={{ padding: "6px 8px", color: "#888" }}>{r.count}</td>
                      <td style={{ padding: "6px 8px", color: "#888" }}>{r.side}</td>
                      <td style={{ padding: "6px 8px", color: "#888" }}>{r.group}</td>
                      <td style={{ padding: "6px 8px", color: "#888" }}>{r.phone}</td>
                    </tr>
                  ))}
                  {importPreview.length > 20 && <tr><td colSpan={5} style={{ padding: "6px 8px", color: "#888", textAlign: "center" }}>ועוד {importPreview.length - 20} שורות...</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Search + filter */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="חיפוש לפי שם..."
            style={{ flex: 1, minWidth: 200, padding: "8px 14px", borderRadius: 9999, border: "1px solid #e8e2d9", background: "#fff", fontSize: 14, fontFamily: "'Heebo', sans-serif" }} />
          {(["all", "yes", "no", "pending", "maybe"] as const).map(s => (
            <span key={s} className={`g-chip${filterRsvp === s ? " active" : ""}`} onClick={() => setFilterRsvp(s)}>
              {s === "all" ? "הכל" : RSVP_LABELS[s as RsvpStatus]}
            </span>
          ))}
        </div>

        {/* Add form */}
        {showAdd && (
          <div style={{ background: "#fff", borderRadius: 18, padding: 20, marginBottom: 16, boxShadow: "0 1px 2px rgba(45,45,45,.04), 0 8px 24px rgba(63,72,66,.06)" }}>
            <div style={{ fontWeight: 700, color: "#3F4842", fontSize: 15, marginBottom: 14 }}>הוספת אורח</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>שם *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="שם מלא"
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 9999, border: "1px solid #e8e2d9", fontSize: 14, fontFamily: "'Heebo', sans-serif", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>כמות</label>
                <input type="number" min={1} max={20} value={form.count} onChange={e => setForm(f => ({ ...f, count: parseInt(e.target.value) || 1 }))}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 9999, border: "1px solid #e8e2d9", fontSize: 14, fontFamily: "'Heebo', sans-serif", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>צד</label>
                <input value={form.side} onChange={e => setForm(f => ({ ...f, side: e.target.value }))} placeholder="צד הזוג / משותף"
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 9999, border: "1px solid #e8e2d9", fontSize: 14, fontFamily: "'Heebo', sans-serif", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>קבוצה</label>
                <input value={form.group} onChange={e => setForm(f => ({ ...f, group: e.target.value }))} placeholder="משפחה / חברים"
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 9999, border: "1px solid #e8e2d9", fontSize: 14, fontFamily: "'Heebo', sans-serif", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>טלפון</label>
                <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="050-..."
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 9999, border: "1px solid #e8e2d9", fontSize: 14, fontFamily: "'Heebo', sans-serif", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>תזונה</label>
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
              <button className="g-btn g-btn-outline" onClick={() => setShowAdd(false)}>ביטול</button>
              <button className="g-btn g-btn-primary" onClick={() => {
                if (!form.name.trim()) { toast.error("שם הוא שדה חובה"); return; }
                createGuest.mutate({
                  name: form.name.trim(), count: form.count,
                  side: form.side || undefined, group: form.group || undefined, phone: form.phone || undefined,
                  diet: form.dietType ? { type: form.dietType, allergies: form.allergies || undefined } : undefined,
                });
              }} disabled={createGuest.isPending}>{createGuest.isPending ? "שומר..." : "שמירה"}</button>
            </div>
          </div>
        )}

        {/* Guest list */}
        {isLoading ? (
          <div style={{ textAlign: "center", padding: 40, color: "#888" }}>טוען...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: "#888" }}>
            {guestList.length === 0 ? "עדיין לא הוספת אורחים" : "לא נמצאו אורחים לפי הסינון"}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filtered.map((g: any) => (
              <div key={g.id} style={{ background: "#fff", borderRadius: 18, padding: "14px 18px", boxShadow: "0 1px 2px rgba(45,45,45,.04), 0 8px 24px rgba(63,72,66,.06)", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: "#3F4842", fontSize: 15 }}>{g.name}</div>
                  <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
                    {g.count > 1 && <span style={{ marginLeft: 8 }}>{g.count} אנשים</span>}
                    {g.side && <span style={{ marginLeft: 8 }}>• {g.side}</span>}
                    {g.group && <span style={{ marginLeft: 8 }}>• {g.group}</span>}
                    {(g.diet as any)?.type && <span style={{ marginLeft: 8 }}>• {DIET_LABELS[(g.diet as any).type as DietType]}</span>}
                    {(g.diet as any)?.allergies && <span style={{ color: "#c0392b", marginLeft: 8 }}>⚠ {(g.diet as any).allergies}</span>}
                  </div>
                </div>
                <select value={g.rsvpStatus} onChange={e => updateGuest.mutate({ id: g.id, rsvpStatus: e.target.value as RsvpStatus })}
                  style={{ padding: "4px 10px", borderRadius: 9999, border: "none", background: (RSVP_COLORS[g.rsvpStatus as RsvpStatus] ?? "#A8C3B0") + "33", color: "#3F4842", fontSize: 13, cursor: "pointer", fontFamily: "'Heebo', sans-serif" }}>
                  {Object.entries(RSVP_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                {/* RSVP personal link */}
                {g.inviteToken && (
                  <button
                    title="שתף קישור RSVP אישי"
                    onClick={() => {
                      const url = `${window.location.origin}/rsvp?token=${g.inviteToken}`;
                      navigator.clipboard.writeText(url)
                        .then(() => toast.success(`קישור RSVP ל-${g.name} הועתק`))
                        .catch(() => prompt(`קישור RSVP ל-${g.name}:`, url));
                    }}
                    style={{ background: "none", border: "none", color: "#A8C3B0", cursor: "pointer", padding: 4 }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                  </button>
                )}
                <button onClick={() => { if (confirm(`להסיר את ${g.name}?`)) deleteGuest.mutate({ id: g.id }); }}
                  style={{ background: "none", border: "none", color: "#ccc", cursor: "pointer", padding: 4 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Import template hint */}
        <div style={{ marginTop: 20, padding: "12px 16px", background: "#EFF5F1", borderRadius: 12, fontSize: 12, color: "#5D6861" }}>
          <strong>פורמט ייבוא:</strong> CSV/Excel עם עמודות: שם (חובה), כמות, צד, קבוצה, טלפון — או בעברית או באנגלית (name, count, side, group, phone)
        </div>
      </div>
    </div>
  );
}
