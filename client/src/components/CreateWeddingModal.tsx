import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (inviteUrl: string, names: string) => void;
}

const INPUT_STYLE: React.CSSProperties = {
  width: "100%",
  border: "1.5px solid #EFEDE7",
  borderRadius: 8,
  padding: "11px 14px",
  fontSize: 14,
  color: "#3F4842",
  background: "#fff",
  fontFamily: "inherit",
  outline: "none",
  transition: "border-color 0.15s",
  boxSizing: "border-box",
};

const LABEL_STYLE: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  color: "#5D6861",
  marginBottom: 5,
  letterSpacing: "0.5px",
};

export default function CreateWeddingModal({ open, onClose, onCreated }: Props) {
  const [name1, setName1] = useState("");
  const [name2, setName2] = useState("");
  const [date, setDate] = useState("");
  const [guestCount, setGuestCount] = useState("");

  const utils = trpc.useUtils();

  const createMutation = trpc.wedding.create.useMutation({
    onSuccess: (data) => {
      toast.success("החתונה נוצרה בהצלחה!");
      utils.wedding.list.invalidate();
      onCreated(data.inviteUrl, `${name1} & ${name2}`);
      // Reset form
      setName1(""); setName2(""); setDate(""); setGuestCount("");
    },
    onError: (err) => {
      toast.error(err.message || "שגיאה ביצירת החתונה");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name1.trim() || !name2.trim()) {
      toast.error("יש למלא את שמות שני בני הזוג");
      return;
    }
    createMutation.mutate({
      name1: name1.trim(),
      name2: name2.trim(),
      date: date || undefined,
      guestCount: guestCount ? parseInt(guestCount) : undefined,
      origin: window.location.origin,
    });
  };

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(45,45,45,.45)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20,
        backdropFilter: "blur(2px)",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      dir="rtl"
    >
      <div style={{
        background: "#fff",
        borderRadius: 18,
        boxShadow: "0 2px 4px rgba(45,45,45,.08), 0 20px 60px rgba(63,72,66,.18)",
        padding: "36px 40px",
        width: "100%",
        maxWidth: 480,
        position: "relative",
      }}>
        {/* Close button */}
        <button
          onClick={onClose}
          style={{ position: "absolute", top: 16, left: 16, background: "transparent", border: "none", cursor: "pointer", color: "#8B8B85", padding: 4 }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Header */}
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: 12, color: "#8B8B85", letterSpacing: 2, marginBottom: 6 }}>
          • New Wedding
        </div>
        <h2 style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 26, color: "#3F4842", fontWeight: 400, marginBottom: 24 }}>
          יצירת חתונה חדשה
        </h2>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Names row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={LABEL_STYLE}>שם 1 *</label>
              <input
                value={name1}
                onChange={(e) => setName1(e.target.value)}
                placeholder="שם ראשון"
                style={INPUT_STYLE}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#3F4842")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#EFEDE7")}
                required
              />
            </div>
            <div>
              <label style={LABEL_STYLE}>שם 2 *</label>
              <input
                value={name2}
                onChange={(e) => setName2(e.target.value)}
                placeholder="שם שני"
                style={INPUT_STYLE}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#3F4842")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#EFEDE7")}
                required
              />
            </div>
          </div>

          {/* Date */}
          <div>
            <label style={LABEL_STYLE}>תאריך החתונה</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={INPUT_STYLE}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#3F4842")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#EFEDE7")}
            />
          </div>

          {/* Guest count */}
          <div>
            <label style={LABEL_STYLE}>מספר אורחים משוער</label>
            <input
              type="number"
              value={guestCount}
              onChange={(e) => setGuestCount(e.target.value)}
              placeholder="לדוגמה: 150"
              min="1"
              max="5000"
              style={INPUT_STYLE}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#3F4842")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#EFEDE7")}
            />
          </div>

          {/* Note about invite link */}
          <div style={{ background: "#F8F6F2", border: "1px solid #EFEDE7", borderRadius: 8, padding: "12px 14px", fontSize: 12.5, color: "#5D6861", lineHeight: 1.7 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline", verticalAlign: "middle", marginLeft: 5 }}>
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            לאחר היצירה תקבלו קישור ייחודי לשליחה לזוג. הזוג יקבל גישה מלאה לאחר לחיצה על הקישור.
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={createMutation.isPending}
            style={{
              background: createMutation.isPending ? "#A8C3B0" : "#3F4842",
              color: "#F8F6F2",
              border: "none",
              borderRadius: 9999,
              padding: "13px",
              fontSize: 14,
              fontWeight: 500,
              cursor: createMutation.isPending ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              transition: "background 0.18s",
              marginTop: 4,
            }}
            onMouseEnter={(e) => { if (!createMutation.isPending) (e.currentTarget as HTMLButtonElement).style.background = "#2D2D2D"; }}
            onMouseLeave={(e) => { if (!createMutation.isPending) (e.currentTarget as HTMLButtonElement).style.background = "#3F4842"; }}
          >
            {createMutation.isPending ? (
              <>
                <div style={{ width: 14, height: 14, border: "2px solid rgba(248,246,242,.4)", borderTopColor: "#F8F6F2", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                יוצר חתונה...
              </>
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                יצירת חתונה
              </>
            )}
          </button>
        </form>

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
