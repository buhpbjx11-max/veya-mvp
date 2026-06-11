import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function Seating() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const [showAddTable, setShowAddTable] = useState(false);
  const [newTableLabel, setNewTableLabel] = useState("");
  const [newTableCapacity, setNewTableCapacity] = useState(10);
  const [newTableShape, setNewTableShape] = useState<"round" | "rect">("round");
  const [draggingGuestId, setDraggingGuestId] = useState<number | null>(null);
  const [activeTableId, setActiveTableId] = useState<number | null>(null);

  const { data, isLoading } = trpc.seating.list.useQuery();
  const createTable = trpc.seating.createTable.useMutation({
    onSuccess: () => { utils.seating.list.invalidate(); setShowAddTable(false); setNewTableLabel(""); toast.success("שולחן נוסף"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteTable = trpc.seating.deleteTable.useMutation({
    onSuccess: () => { utils.seating.list.invalidate(); toast.success("שולחן הוסר"); },
    onError: (e) => toast.error(e.message),
  });
  const assignGuest = trpc.seating.assignGuest.useMutation({
    onSuccess: () => utils.seating.list.invalidate(),
    onError: (e) => toast.error(e.message),
  });

  if (!user) { navigate("/"); return null; }

  const tables = data?.tables ?? [];
  const guests = data?.guests ?? [];
  const unseatedGuests = guests.filter(g => !g.tableId && g.rsvpStatus === "yes");
  const allConfirmed = guests.filter(g => g.rsvpStatus === "yes");

  const handleDrop = (tableId: number | null) => {
    if (draggingGuestId === null) return;
    assignGuest.mutate({ guestId: draggingGuestId, tableId });
    setDraggingGuestId(null);
    setActiveTableId(null);
  };

  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: "#F8F6F2", fontFamily: "'Heebo', sans-serif" }}>
      {/* Header */}
      <div style={{ background: "#3F4842", padding: "16px 24px", display: "flex", alignItems: "center", gap: 16 }}>
        <button onClick={() => navigate("/couple/dashboard")} style={{ background: "none", border: "none", color: "#A8C3B0", cursor: "pointer" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <h1 style={{ color: "#F8F6F2", fontFamily: "'Frank Ruhl Libre', serif", fontSize: 22, margin: 0 }}>סידור הושבה</h1>
        <div style={{ marginRight: "auto" }}>
          <span style={{ background: "#5D6861", color: "#F8F6F2", borderRadius: 9999, padding: "4px 12px", fontSize: 13 }}>
            {allConfirmed.reduce((s, g) => s + (g.count ?? 1), 0)} מגיעים
          </span>
        </div>
      </div>

      <div style={{ display: "flex", height: "calc(100vh - 60px)" }}>
        {/* Left panel — unseated guests */}
        <div style={{ width: 240, background: "#fff", borderLeft: "1px solid #e8e2d9", padding: 16, overflowY: "auto", flexShrink: 0 }}>
          <div style={{ fontSize: 13, color: "#888", marginBottom: 12 }}>
            ממתינים להושבה ({unseatedGuests.reduce((s, g) => s + (g.count ?? 1), 0)})
          </div>
          <div
            onDragOver={e => e.preventDefault()}
            onDrop={() => handleDrop(null)}
            style={{ minHeight: 40, borderRadius: 12, border: "2px dashed #e8e2d9", padding: 4, marginBottom: 12 }}
          >
            {unseatedGuests.map(g => (
              <div key={g.id}
                draggable
                onDragStart={() => setDraggingGuestId(g.id)}
                style={{
                  background: "#F8F6F2", borderRadius: 9999, padding: "6px 12px", marginBottom: 6,
                  cursor: "grab", fontSize: 13, color: "#3F4842", border: "1px solid #e8e2d9",
                  userSelect: "none",
                }}>
                {g.name} {g.count > 1 ? `(${g.count})` : ""}
              </div>
            ))}
          </div>
          <button onClick={() => setShowAddTable(true)} style={{
            width: "100%", background: "#3F4842", color: "#F8F6F2", border: "none",
            borderRadius: 9999, padding: "8px 0", cursor: "pointer", fontSize: 13, fontWeight: 600,
          }}>+ שולחן חדש</button>
        </div>

        {/* Canvas */}
        <div style={{ flex: 1, padding: 24, overflowY: "auto" }}>
          {isLoading ? (
            <div style={{ textAlign: "center", padding: 40, color: "#888" }}>טוען...</div>
          ) : tables.length === 0 ? (
            <div style={{ textAlign: "center", padding: 60, color: "#888" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#A8C3B0" strokeWidth="1.5" style={{ display: "inline-block" }}>
                  <circle cx="12" cy="12" r="10"/><path d="M8 12h8M12 8v8"/>
                </svg>
              </div>
              <div>הוסיפי שולחן ראשון כדי להתחיל</div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
              {tables.map(table => {
                const seated = guests.filter(g => g.tableId === table.id);
                const seatedCount = seated.reduce((s, g) => s + (g.count ?? 1), 0);
                const isFull = seatedCount >= table.capacity;
                const isOver = activeTableId === table.id;

                return (
                  <div key={table.id}
                    onDragOver={e => { e.preventDefault(); setActiveTableId(table.id); }}
                    onDragLeave={() => setActiveTableId(null)}
                    onDrop={() => handleDrop(table.id)}
                    style={{
                      background: "#fff", borderRadius: 18, padding: 16,
                      boxShadow: isOver
                        ? "0 0 0 2px #A8C3B0, 0 8px 24px rgba(63,72,66,.12)"
                        : "0 1px 2px rgba(45,45,45,.04), 0 8px 24px rgba(63,72,66,.06)",
                      border: `2px solid ${isFull ? "#D9C5A1" : isOver ? "#A8C3B0" : "transparent"}`,
                      transition: "box-shadow 0.15s, border-color 0.15s",
                    }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                      <div>
                        <div style={{ fontWeight: 600, color: "#3F4842", fontSize: 15 }}>{table.label}</div>
                        <div style={{ fontSize: 12, color: isFull ? "#D9C5A1" : "#888" }}>
                          {seatedCount} / {table.capacity} {table.shape === "round" ? "⬤" : "▬"}
                        </div>
                      </div>
                      <button onClick={() => {
                        if (confirm(`להסיר את שולחן "${table.label}"?`)) deleteTable.mutate({ id: table.id });
                      }} style={{ background: "none", border: "none", color: "#ddd", cursor: "pointer", padding: 4 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                        </svg>
                      </button>
                    </div>

                    {/* Seated guests */}
                    <div style={{ minHeight: 40 }}>
                      {seated.map(g => (
                        <div key={g.id}
                          draggable
                          onDragStart={() => setDraggingGuestId(g.id)}
                          style={{
                            background: "#F8F6F2", borderRadius: 9999, padding: "4px 10px",
                            marginBottom: 4, cursor: "grab", fontSize: 12, color: "#3F4842",
                            border: "1px solid #e8e2d9", userSelect: "none", display: "flex",
                            alignItems: "center", justifyContent: "space-between",
                          }}>
                          <span>{g.name} {g.count > 1 ? `(${g.count})` : ""}</span>
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

      {/* Add table modal */}
      {showAddTable && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div dir="rtl" style={{ background: "#fff", borderRadius: 18, padding: 28, width: 360, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <h3 style={{ margin: "0 0 20px", fontFamily: "'Frank Ruhl Libre', serif", color: "#3F4842" }}>שולחן חדש</h3>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>שם השולחן</label>
              <input value={newTableLabel} onChange={e => setNewTableLabel(e.target.value)}
                placeholder="שולחן 1 / משפחה / חברים"
                style={{ width: "100%", padding: "8px 12px", borderRadius: 9999, border: "1px solid #e8e2d9", fontSize: 14, fontFamily: "'Heebo', sans-serif", boxSizing: "border-box" }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
              <div>
                <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>קיבולת</label>
                <input type="number" min={1} max={100} value={newTableCapacity} onChange={e => setNewTableCapacity(Number(e.target.value))}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 9999, border: "1px solid #e8e2d9", fontSize: 14, fontFamily: "'Heebo', sans-serif", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>צורה</label>
                <select value={newTableShape} onChange={e => setNewTableShape(e.target.value as "round" | "rect")}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 9999, border: "1px solid #e8e2d9", fontSize: 14, fontFamily: "'Heebo', sans-serif", boxSizing: "border-box" }}>
                  <option value="round">עגול</option>
                  <option value="rect">מלבני</option>
                </select>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => setShowAddTable(false)} style={{ background: "none", border: "1px solid #e8e2d9", borderRadius: 9999, padding: "8px 20px", cursor: "pointer", fontSize: 14 }}>ביטול</button>
              <button onClick={() => {
                if (!newTableLabel.trim()) { toast.error("שם השולחן הוא שדה חובה"); return; }
                createTable.mutate({ label: newTableLabel.trim(), capacity: newTableCapacity, shape: newTableShape });
              }} disabled={createTable.isPending} style={{
                background: "#3F4842", color: "#F8F6F2", border: "none", borderRadius: 9999,
                padding: "8px 20px", cursor: "pointer", fontSize: 14, fontWeight: 600,
              }}>{createTable.isPending ? "שומר..." : "הוספה"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
