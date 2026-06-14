import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { toast } from "sonner";

type TimelineItem = {
  id: string;
  time: string;
  label: string;
  responsible: string;
  addedBy: string;
};

const DEFAULT_ITEMS: TimelineItem[] = [
  { id: "d1", time: "14:00", label: "הגעת הזוג לאולם", responsible: "", addedBy: "couple" },
  { id: "d2", time: "16:00", label: "הכנות אחרונות", responsible: "", addedBy: "couple" },
  { id: "d3", time: "18:00", label: "קבלת פנים", responsible: "", addedBy: "couple" },
  { id: "d4", time: "19:30", label: "חופה", responsible: "", addedBy: "couple" },
  { id: "d5", time: "20:00", label: "ארוחה", responsible: "", addedBy: "couple" },
  { id: "d6", time: "22:00", label: "ריקודים", responsible: "", addedBy: "couple" },
];

function genId() { return Math.random().toString(36).slice(2, 10); }

export default function Timeline() {
  const [, navigate] = useLocation();
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const { data: timelineData, isLoading } = trpc.timeline.get.useQuery();

  // Initialize items from server data once
  if (!loaded && !isLoading && timelineData) {
    setItems(timelineData.items && timelineData.items.length > 0 ? (timelineData.items as TimelineItem[]) : DEFAULT_ITEMS);
    setLoaded(true);
  }

  const saveTimeline = trpc.timeline.save.useMutation({
    onSuccess: () => { setDirty(false); toast.success("לוח הזמנים נשמר"); },
    onError: (e) => toast.error(e.message),
  });

  function updateItem(idx: number, field: keyof TimelineItem, value: string) {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, [field]: value } : it));
    setDirty(true);
  }

  function addItem() {
    const last = items[items.length - 1];
    const newTime = last ? incrementTime(last.time) : "09:00";
    setItems(prev => [...prev, { id: genId(), time: newTime, label: "", responsible: "", addedBy: "couple" }]);
    setDirty(true);
  }

  function removeItem(idx: number) {
    setItems(prev => prev.filter((_, i) => i !== idx));
    setDirty(true);
  }

  function incrementTime(t: string): string {
    const [h, m] = t.split(":").map(Number);
    const total = h * 60 + m + 60;
    return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
  }

  // Drag-and-drop reorder
  function handleDragStart(idx: number) { setDragIdx(idx); }
  function handleDragOver(e: React.DragEvent, idx: number) { e.preventDefault(); setDragOverIdx(idx); }
  function handleDrop(idx: number) {
    if (dragIdx === null || dragIdx === idx) { setDragIdx(null); setDragOverIdx(null); return; }
    const next = [...items];
    const [moved] = next.splice(dragIdx, 1);
    next.splice(idx, 0, moved);
    setItems(next);
    setDirty(true);
    setDragIdx(null);
    setDragOverIdx(null);
  }

  function handleSave() {
    saveTimeline.mutate({ items });
  }

  const sortedItems = [...items].sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: "#F8F6F2", fontFamily: "'Heebo', sans-serif" }}>
      <style>{`
        .tl-btn { border: none; border-radius: 9999px; padding: 8px 18px; cursor: pointer; font-size: 13px; font-family: 'Heebo', sans-serif; font-weight: 500; transition: all 0.15s; }
        .tl-btn-primary { background: #3F4842; color: #F8F6F2; }
        .tl-btn-primary:hover { background: #2D2D2D; }
        .tl-btn-outline { background: #fff; color: #3F4842; border: 1px solid #DDD8CE !important; }
        .tl-btn-outline:hover { border-color: #A8C3B0 !important; }
        .tl-input { padding: 7px 12px; border-radius: 8px; border: 1px solid #DDD8CE; background: #fff; font-size: 13.5px; font-family: 'Heebo', sans-serif; outline: none; transition: border-color 0.15s; }
        .tl-input:focus { border-color: #A8C3B0; }
        .tl-row { background: #fff; border-radius: 14px; border: 1px solid #EDE8E0; box-shadow: 0 1px 4px rgba(63,72,66,.04); padding: 12px 16px; display: flex; align-items: center; gap: 12px; transition: box-shadow 0.15s, border-color 0.15s; }
        .tl-row:hover { box-shadow: 0 4px 16px rgba(63,72,66,.08); }
        .tl-row.drag-over { border-color: #A8C3B0; background: #F5FBF7; }
        .tl-drag-handle { cursor: grab; color: #ccc; flex-shrink: 0; }
        .tl-drag-handle:active { cursor: grabbing; }
      `}</style>

      {/* Header */}
      <div style={{ background: "#3F4842", padding: "16px 24px", display: "flex", alignItems: "center", gap: 16 }}>
        <button onClick={() => navigate("/couple/dashboard")} style={{ background: "none", border: "none", color: "#A8C3B0", cursor: "pointer" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <h1 style={{ color: "#F8F6F2", fontFamily: "'Frank Ruhl Libre', serif", fontSize: 22, margin: 0 }}>לוח זמנים</h1>
        <div style={{ marginRight: "auto", display: "flex", gap: 8, alignItems: "center" }}>
          {dirty && <span style={{ fontSize: 12, color: "#D9C5A1" }}>שינויים לא שמורים</span>}
          <button className="tl-btn tl-btn-outline" style={{ background: "rgba(255,255,255,0.1)", color: "#F8F6F2", borderColor: "rgba(255,255,255,0.2) !important" }}
            onClick={handleSave} disabled={saveTimeline.isPending || !dirty}>
            {saveTimeline.isPending ? "שומר..." : "שמור"}
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "24px 16px" }}>

        {/* Intro card */}
        <div style={{ background: "#fff", borderRadius: 18, padding: "16px 20px", marginBottom: 20, border: "1px solid #EDE8E0", display: "flex", gap: 14, alignItems: "flex-start" }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#F0EDE8", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5D6861" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div>
            <div style={{ fontWeight: 600, color: "#3F4842", fontSize: 14, marginBottom: 3 }}>לוח זמנים של יום האירוע</div>
            <div style={{ fontSize: 13, color: "#888", lineHeight: 1.6 }}>
              ערכו את לוח הזמנים, גררו שורות לסידור מחדש, והוסיפו אחראי/ת לכל פריט. האולם יוכל לראות את הלוח ולהוסיף פריטים משלו.
            </div>
          </div>
        </div>

        {/* Column headers */}
        <div style={{ display: "grid", gridTemplateColumns: "80px 1fr 160px 36px", gap: 8, padding: "0 16px", marginBottom: 8 }}>
          <div style={{ fontSize: 11, color: "#aaa", fontWeight: 600, letterSpacing: 0.5 }}>שעה</div>
          <div style={{ fontSize: 11, color: "#aaa", fontWeight: 600, letterSpacing: 0.5 }}>אירוע / פריט</div>
          <div style={{ fontSize: 11, color: "#aaa", fontWeight: 600, letterSpacing: 0.5 }}>אחראי/ת</div>
          <div />
        </div>

        {/* Timeline rows */}
        {isLoading && !loaded ? (
          <div style={{ textAlign: "center", padding: 40, color: "#888" }}>טוען...</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {items.map((item, idx) => (
              <div
                key={item.id}
                className={`tl-row${dragOverIdx === idx ? " drag-over" : ""}`}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDrop={() => handleDrop(idx)}
                onDragEnd={() => { setDragIdx(null); setDragOverIdx(null); }}
              >
                {/* Drag handle */}
                <div className="tl-drag-handle">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="3" y1="8" x2="21" y2="8"/><line x1="3" y1="16" x2="21" y2="16"/>
                  </svg>
                </div>

                {/* Time */}
                <input
                  type="time"
                  value={item.time}
                  onChange={e => updateItem(idx, "time", e.target.value)}
                  className="tl-input"
                  style={{ width: 80, flexShrink: 0 }}
                />

                {/* Label */}
                <input
                  value={item.label}
                  onChange={e => updateItem(idx, "label", e.target.value)}
                  placeholder="תיאור האירוע..."
                  className="tl-input"
                  style={{ flex: 1 }}
                />

                {/* Responsible */}
                <input
                  value={item.responsible}
                  onChange={e => updateItem(idx, "responsible", e.target.value)}
                  placeholder="אחראי/ת"
                  className="tl-input"
                  style={{ width: 150, flexShrink: 0 }}
                />

                {/* Delete */}
                <button
                  onClick={() => removeItem(idx)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#ccc", padding: 4, borderRadius: 4, flexShrink: 0 }}
                  title="הסר פריט"
                  onMouseEnter={e => (e.currentTarget.style.color = "#c0392b")}
                  onMouseLeave={e => (e.currentTarget.style.color = "#ccc")}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add + Save */}
        <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "space-between", alignItems: "center" }}>
          <button className="tl-btn tl-btn-outline" onClick={addItem}>+ הוספת פריט</button>
          <button className="tl-btn tl-btn-primary" onClick={handleSave} disabled={saveTimeline.isPending || !dirty}>
            {saveTimeline.isPending ? "שומר..." : "שמור לוח זמנים"}
          </button>
        </div>

        {/* Summary view */}
        {items.length > 0 && (
          <div style={{ marginTop: 32 }}>
            <div style={{ fontSize: 13, color: "#888", fontWeight: 600, letterSpacing: 0.5, marginBottom: 12 }}>תצוגת ציר זמן</div>
            <div style={{ position: "relative", paddingRight: 24 }}>
              {/* Vertical line */}
              <div style={{ position: "absolute", right: 7, top: 8, bottom: 8, width: 2, background: "#E8E2D9" }} />
              {[...items].sort((a, b) => a.time.localeCompare(b.time)).map((item, idx) => (
                <div key={item.id} style={{ display: "flex", gap: 16, marginBottom: 16, position: "relative" }}>
                  {/* Dot */}
                  <div style={{ position: "absolute", right: 0, top: 4, width: 16, height: 16, borderRadius: "50%", background: "#A8C3B0", border: "3px solid #F8F6F2", flexShrink: 0 }} />
                  <div style={{ marginRight: 24, flex: 1 }}>
                    <div style={{ display: "flex", gap: 12, alignItems: "baseline" }}>
                      <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, color: "#3F4842", fontWeight: 600 }}>{item.time}</span>
                      <span style={{ fontSize: 14, color: "#5D6861", fontWeight: 500 }}>{item.label || "—"}</span>
                    </div>
                    {item.responsible && (
                      <div style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>אחראי/ת: {item.responsible}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
