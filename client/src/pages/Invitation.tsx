import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

// ─── Icons ───────────────────────────────────────────────────────────────────
const IcoEdit = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);
const IcoShare = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
);
const IcoCopy = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);
const IcoCheck = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const IcoCalendar = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);
const IcoLocation = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
  </svg>
);
const IcoClock = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);

const CARD_STYLE: React.CSSProperties = {
  background: "#FFFFFF",
  borderRadius: 18,
  boxShadow: "0 2px 12px rgba(63,72,66,.07), 0 1px 3px rgba(63,72,66,.05)",
  border: "1px solid #EFEDE7",
};

function formatHebrewDate(d: Date | string | null | undefined) {
  if (!d) return null;
  const date = new Date(d);
  return date.toLocaleDateString("he-IL", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

export default function Invitation() {
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({ location: "", time: "", customText: "", rsvpDeadline: "" });

  const invQuery = trpc.couple.getInvitation.useQuery();
  const inv = invQuery.data;

  useEffect(() => {
    if (inv) {
      const d = inv.invitation as Record<string, string> | null;
      setForm({
        location: (d?.location as string) ?? "",
        time: (d?.time as string) ?? "",
        customText: (d?.customText as string) ?? "",
        rsvpDeadline: (d?.rsvpDeadline as string) ?? "",
      });
    }
  }, [inv]);

  const updateMutation = trpc.couple.updateInvitation.useMutation({
    onSuccess: () => {
      toast.success("ההזמנה עודכנה");
      setEditing(false);
      invQuery.refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const shareToken = (inv?.invitation as Record<string, string> | null)?.shareToken ?? inv?.shareToken;
  const shareUrl = shareToken ? `${window.location.origin}/invitation/${shareToken}` : null;

  const handleCopy = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleSave = () => {
    updateMutation.mutate({
      location: form.location || undefined,
      time: form.time || undefined,
      customText: form.customText || undefined,
      rsvpDeadline: form.rsvpDeadline || undefined,
    });
  };

  const weddingDate = inv?.weddingDate;
  const name1 = inv?.name1 ?? "";
  const name2 = inv?.name2 ?? "";
  const location = form.location;
  const time = form.time;
  const customText = form.customText;

  return (
    <div style={{ minHeight: "100vh", background: "#F8F6F2", fontFamily: "'Heebo', sans-serif", direction: "rtl" }}>
      {/* Page header */}
      <div style={{ borderBottom: "1px solid #EFEDE7", background: "#FFFFFF", padding: "20px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 22, color: "#3F4842", margin: 0, fontWeight: 600 }}>
            הזמנה דיגיטלית
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#5D6861" }}>
            שתפו קישור לאורחים להצגת ההזמנה ואישור הגעה
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {shareUrl && (
            <button
              onClick={handleCopy}
              style={{
                display: "flex", alignItems: "center", gap: 7,
                background: copied ? "#A8C3B0" : "#EFEDE7",
                color: "#3F4842", border: "none", borderRadius: 9999,
                padding: "9px 18px", fontSize: 13, fontWeight: 500, cursor: "pointer",
                fontFamily: "inherit", transition: "all 0.15s",
              }}
            >
              <span style={{ width: 14, height: 14 }}>{copied ? <IcoCheck /> : <IcoCopy />}</span>
              {copied ? "הועתק!" : "העתק קישור"}
            </button>
          )}
          <button
            onClick={() => setEditing(!editing)}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              background: editing ? "#3F4842" : "#3F4842",
              color: "#F8F6F2", border: "none", borderRadius: 9999,
              padding: "9px 18px", fontSize: 13, fontWeight: 500, cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            <span style={{ width: 14, height: 14 }}><IcoEdit /></span>
            {editing ? "ביטול" : "עריכה"}
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>

        {/* Edit form */}
        {editing && (
          <div style={{ ...CARD_STYLE, padding: 28, gridColumn: "1 / -1" }}>
            <h2 style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 18, color: "#3F4842", margin: "0 0 20px", fontWeight: 600 }}>
              עריכת פרטי ההזמנה
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#5D6861", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  מיקום האירוע
                </label>
                <input
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="שם האולם, כתובת..."
                  style={{ width: "100%", border: "1px solid #EFEDE7", borderRadius: 10, padding: "10px 14px", fontSize: 14, fontFamily: "inherit", outline: "none", background: "#FAFAF8", color: "#3F4842", boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#5D6861", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  שעת האירוע
                </label>
                <input
                  value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                  placeholder="19:00"
                  style={{ width: "100%", border: "1px solid #EFEDE7", borderRadius: 10, padding: "10px 14px", fontSize: 14, fontFamily: "inherit", outline: "none", background: "#FAFAF8", color: "#3F4842", boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#5D6861", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  תאריך אחרון לאישור הגעה
                </label>
                <input
                  type="date"
                  value={form.rsvpDeadline}
                  onChange={(e) => setForm({ ...form, rsvpDeadline: e.target.value })}
                  style={{ width: "100%", border: "1px solid #EFEDE7", borderRadius: 10, padding: "10px 14px", fontSize: 14, fontFamily: "inherit", outline: "none", background: "#FAFAF8", color: "#3F4842", boxSizing: "border-box" }}
                />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#5D6861", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  טקסט אישי (אופציונלי)
                </label>
                <textarea
                  value={form.customText}
                  onChange={(e) => setForm({ ...form, customText: e.target.value })}
                  placeholder="ברכה אישית לאורחים..."
                  rows={3}
                  style={{ width: "100%", border: "1px solid #EFEDE7", borderRadius: 10, padding: "10px 14px", fontSize: 14, fontFamily: "inherit", outline: "none", background: "#FAFAF8", color: "#3F4842", resize: "vertical", boxSizing: "border-box" }}
                />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
              <button
                onClick={() => setEditing(false)}
                style={{ background: "#EFEDE7", color: "#3F4842", border: "none", borderRadius: 9999, padding: "9px 20px", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}
              >
                ביטול
              </button>
              <button
                onClick={handleSave}
                disabled={updateMutation.isPending}
                style={{ background: "#3F4842", color: "#F8F6F2", border: "none", borderRadius: 9999, padding: "9px 20px", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}
              >
                {updateMutation.isPending ? "שומר..." : "שמור"}
              </button>
            </div>
          </div>
        )}

        {/* Invitation preview */}
        <div style={{ gridColumn: "1 / -1" }}>
          <div style={{
            background: "linear-gradient(135deg, #3F4842 0%, #5D6861 100%)",
            borderRadius: 24,
            padding: "56px 48px",
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
            boxShadow: "0 8px 40px rgba(63,72,66,.2)",
          }}>
            {/* Decorative elements */}
            <div style={{ position: "absolute", top: 24, left: 24, width: 80, height: 80, borderRadius: "50%", background: "rgba(217,197,161,.08)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", bottom: 32, right: 32, width: 120, height: 120, borderRadius: "50%", background: "rgba(168,195,176,.06)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", top: 0, right: 0, width: 200, height: 200, background: "radial-gradient(circle, rgba(217,197,161,.05) 0%, transparent 70%)", pointerEvents: "none" }} />

            {/* VEYA mark */}
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: 14, color: "rgba(217,197,161,.6)", letterSpacing: "0.2em", marginBottom: 32 }}>
              VEYA
            </div>

            {/* Decorative line */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 32 }}>
              <div style={{ width: 40, height: 1, background: "rgba(217,197,161,.4)" }} />
              <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#D9C5A1" }} />
              <div style={{ width: 40, height: 1, background: "rgba(217,197,161,.4)" }} />
            </div>

            {/* Names */}
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 48, color: "#F8F6F2", fontWeight: 600, lineHeight: 1.1, marginBottom: 8 }}>
              {name1 || "שם 1"}
            </div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: 20, color: "#D9C5A1", marginBottom: 8 }}>
              &amp;
            </div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 48, color: "#F8F6F2", fontWeight: 600, lineHeight: 1.1, marginBottom: 40 }}>
              {name2 || "שם 2"}
            </div>

            {/* Invitation text */}
            <div style={{ fontSize: 15, color: "rgba(248,246,242,.75)", marginBottom: 40, fontStyle: "italic" }}>
              מתכבדים להזמינכם לחגוג עמם את יומם הגדול
            </div>

            {/* Details */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "center", marginBottom: 40 }}>
              {weddingDate && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#F8F6F2" }}>
                  <span style={{ width: 18, height: 18, color: "#D9C5A1" }}><IcoCalendar /></span>
                  <span style={{ fontSize: 17, fontFamily: "'Frank Ruhl Libre', serif" }}>
                    {formatHebrewDate(weddingDate)}
                  </span>
                </div>
              )}
              {time && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#F8F6F2" }}>
                  <span style={{ width: 18, height: 18, color: "#D9C5A1" }}><IcoClock /></span>
                  <span style={{ fontSize: 17, fontFamily: "'Frank Ruhl Libre', serif" }}>בשעה {time}</span>
                </div>
              )}
              {location && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#F8F6F2" }}>
                  <span style={{ width: 18, height: 18, color: "#D9C5A1" }}><IcoLocation /></span>
                  <span style={{ fontSize: 17, fontFamily: "'Frank Ruhl Libre', serif" }}>{location}</span>
                </div>
              )}
            </div>

            {/* Custom text */}
            {customText && (
              <div style={{ fontSize: 14, color: "rgba(248,246,242,.7)", fontStyle: "italic", maxWidth: 420, margin: "0 auto 32px", lineHeight: 1.7 }}>
                "{customText}"
              </div>
            )}

            {/* Decorative line */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 32 }}>
              <div style={{ width: 40, height: 1, background: "rgba(217,197,161,.4)" }} />
              <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#D9C5A1" }} />
              <div style={{ width: 40, height: 1, background: "rgba(217,197,161,.4)" }} />
            </div>

            {/* RSVP button */}
            {shareUrl && (
              <div>
                <div style={{ fontSize: 12, color: "rgba(217,197,161,.6)", marginBottom: 12, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  {form.rsvpDeadline ? `אישור הגעה עד ${new Date(form.rsvpDeadline).toLocaleDateString("he-IL")}` : "אישור הגעה"}
                </div>
                <div style={{ display: "inline-block", background: "#D9C5A1", color: "#3F4842", borderRadius: 9999, padding: "12px 32px", fontSize: 14, fontWeight: 600, fontFamily: "inherit" }}>
                  אשרו הגעה כאן
                </div>
              </div>
            )}

            {/* Empty state */}
            {!weddingDate && !location && !time && (
              <div style={{ fontSize: 13, color: "rgba(248,246,242,.4)", marginTop: 16 }}>
                לחצו "עריכה" כדי להוסיף פרטים
              </div>
            )}
          </div>
        </div>

        {/* Share link card */}
        <div style={{ ...CARD_STYLE, padding: 24, gridColumn: "1 / -1" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#EFEDE7", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ width: 16, height: 16, color: "#5D6861" }}><IcoShare /></span>
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15, color: "#3F4842" }}>קישור שיתוף</div>
              <div style={{ fontSize: 12, color: "#5D6861" }}>שלחו לאורחים לצפייה באישור הגעה</div>
            </div>
          </div>

          {shareUrl ? (
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{ flex: 1, background: "#F8F6F2", border: "1px solid #EFEDE7", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#5D6861", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", direction: "ltr" }}>
                {shareUrl}
              </div>
              <button
                onClick={handleCopy}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  background: copied ? "#A8C3B0" : "#3F4842",
                  color: "#F8F6F2", border: "none", borderRadius: 9999,
                  padding: "10px 18px", fontSize: 13, fontWeight: 500, cursor: "pointer",
                  fontFamily: "inherit", flexShrink: 0, transition: "all 0.15s",
                }}
              >
                <span style={{ width: 13, height: 13 }}>{copied ? <IcoCheck /> : <IcoCopy />}</span>
                {copied ? "הועתק!" : "העתק"}
              </button>
            </div>
          ) : (
            <div style={{ background: "#F8F6F2", border: "1px dashed #EFEDE7", borderRadius: 10, padding: "16px 20px", textAlign: "center", fontSize: 13, color: "#8B8B85" }}>
              שמרו את ההזמנה כדי לקבל קישור שיתוף
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
