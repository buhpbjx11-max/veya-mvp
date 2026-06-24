/**
 * GuestRsvp — /rsvp?token=...
 * Public page (no auth). Guest confirms attendance via their personal invite token.
 * Uses guest.updateRsvp procedure.
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";

const VeyaLogo = () => (
  <svg width="32" height="32" viewBox="0 0 40 40" fill="none" stroke="#D9C5A1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 10 L20 30 L32 10" /><path d="M14 14 L20 22 L26 14" opacity="0.6" />
  </svg>
);

const DIET_LABELS: Record<string, string> = {
  regular: "רגיל",
  vegetarian: "צמחוני",
  vegan: "טבעוני",
  child: "ילדים",
};

export default function GuestRsvp() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token") ?? "";

  const [rsvpStatus, setRsvpStatus] = useState<"yes" | "no" | "maybe" | null>(null);
  const [dietType, setDietType] = useState<"regular" | "vegetarian" | "vegan" | "child">("regular");
  const [allergies, setAllergies] = useState("");
  const [name, setName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [guestName, setGuestName] = useState("");

  const updateRsvp = trpc.guest.updateRsvp.useMutation({
    onSuccess: (data) => {
      setGuestName(data.guestName ?? "");
      setSubmitted(true);
    },
  });

  if (!token) {
    return (
      <div style={{ minHeight: "100vh", background: "#F8F6F2", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Heebo', sans-serif" }} dir="rtl">
        <div style={{ textAlign: "center", color: "#8B8B85" }}>
          <p style={{ fontSize: 16 }}>קישור לא תקין.</p>
        </div>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rsvpStatus) return;
    updateRsvp.mutate({
      token,
      rsvpStatus,
      diet: rsvpStatus === "yes" ? { type: dietType, allergies: allergies || undefined } : undefined,
      name: name || undefined,
    });
  };

  if (submitted) {
    return (
      <div style={{ minHeight: "100vh", background: "#F8F6F2", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px", fontFamily: "'Heebo', sans-serif" }} dir="rtl">
        <div style={{ maxWidth: 420, width: "100%", textAlign: "center" }}>
          <VeyaLogo />
          <div style={{ marginTop: 24, fontSize: 32 }}>
            {rsvpStatus === "yes" ? "🎉" : rsvpStatus === "no" ? "💌" : "🤍"}
          </div>
          <h2 style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 28, color: "#3F4842", marginTop: 16, marginBottom: 8 }}>
            {rsvpStatus === "yes" ? "נשמח לראות אתכם!" : rsvpStatus === "no" ? "תודה על ההודעה" : "מחכים לתשובתכם"}
          </h2>
          <p style={{ fontSize: 15, color: "#8B8B85", lineHeight: 1.7 }}>
            {guestName ? `${guestName}, ` : ""}
            {rsvpStatus === "yes"
              ? "אישרתם הגעה לחתונה. נתראה שם!"
              : rsvpStatus === "no"
              ? "קיבלנו את הודעתכם. נחשוב עליכם ביום המיוחד."
              : "קיבלנו את תשובתכם. נשמח לדעת בהקדם."}
          </p>
          <div style={{ marginTop: 32, padding: "16px 20px", background: "#fff", borderRadius: 12, border: "1px solid #EFEDE7", fontSize: 13, color: "#8B8B85" }}>
            מופעל על ידי <span style={{ fontFamily: "'Cormorant Garamond', serif", letterSpacing: 3, color: "#3F4842" }}>VEYA</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F8F6F2", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px", fontFamily: "'Heebo', sans-serif" }} dir="rtl">
      <div style={{ maxWidth: 460, width: "100%" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <VeyaLogo />
          <h1 style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 26, color: "#3F4842", marginTop: 12, marginBottom: 4 }}>
            אישור הגעה
          </h1>
          <p style={{ fontSize: 14, color: "#8B8B85" }}>אנא אשרו את השתתפותכם בחתונה</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Card */}
          <div style={{ background: "#fff", borderRadius: 18, border: "1px solid #EFEDE7", boxShadow: "0 1px 2px rgba(45,45,45,.04), 0 8px 24px rgba(63,72,66,.06)", padding: "28px 28px 24px" }}>

            {/* Optional name override */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 13, color: "#5D6861", marginBottom: 6, fontWeight: 500 }}>
                שם (אופציונלי — לעדכון)
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="השם שלך"
                style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #EFEDE7", fontSize: 14, color: "#3F4842", outline: "none", boxSizing: "border-box", background: "#FAFAF8" }}
                onFocus={(e) => (e.target.style.borderColor = "#A8C3B0")}
                onBlur={(e) => (e.target.style.borderColor = "#EFEDE7")}
              />
            </div>

            {/* RSVP choice */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontSize: 13, color: "#5D6861", marginBottom: 10, fontWeight: 500 }}>
                האם תגיעו לחתונה?
              </label>
              <div style={{ display: "flex", gap: 10 }}>
                {(["yes", "no", "maybe"] as const).map((status) => {
                  const labels = { yes: "✓ כן, נגיע", no: "✗ לא נגיע", maybe: "? אולי" };
                  const colors = {
                    yes: { bg: rsvpStatus === "yes" ? "#3F4842" : "#FAFAF8", text: rsvpStatus === "yes" ? "#F8F6F2" : "#3F4842", border: rsvpStatus === "yes" ? "#3F4842" : "#EFEDE7" },
                    no: { bg: rsvpStatus === "no" ? "#8B8B85" : "#FAFAF8", text: rsvpStatus === "no" ? "#F8F6F2" : "#3F4842", border: rsvpStatus === "no" ? "#8B8B85" : "#EFEDE7" },
                    maybe: { bg: rsvpStatus === "maybe" ? "#A8C3B0" : "#FAFAF8", text: rsvpStatus === "maybe" ? "#F8F6F2" : "#3F4842", border: rsvpStatus === "maybe" ? "#A8C3B0" : "#EFEDE7" },
                  };
                  const c = colors[status];
                  return (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setRsvpStatus(status)}
                      style={{ flex: 1, padding: "10px 8px", borderRadius: 8, border: `1px solid ${c.border}`, background: c.bg, color: c.text, fontSize: 13, cursor: "pointer", fontWeight: 500, transition: "all 0.15s", fontFamily: "'Heebo', sans-serif" }}
                    >
                      {labels[status]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Diet — only if attending */}
            {rsvpStatus === "yes" && (
              <div style={{ marginBottom: 24, padding: "16px", background: "#F8F6F2", borderRadius: 10 }}>
                <label style={{ display: "block", fontSize: 13, color: "#5D6861", marginBottom: 10, fontWeight: 500 }}>
                  העדפות תפריט
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                  {(["regular", "vegetarian", "vegan", "child"] as const).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDietType(d)}
                      style={{ padding: "6px 14px", borderRadius: 9999, border: `1px solid ${dietType === d ? "#A8C3B0" : "#EFEDE7"}`, background: dietType === d ? "#DDEAE0" : "#fff", color: "#3F4842", fontSize: 12.5, cursor: "pointer", transition: "all 0.15s", fontFamily: "'Heebo', sans-serif" }}
                    >
                      {DIET_LABELS[d]}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  placeholder="אלרגיות או הגבלות תזונתיות (אופציונלי)"
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #EFEDE7", fontSize: 13, color: "#3F4842", outline: "none", boxSizing: "border-box", background: "#fff" }}
                  onFocus={(e) => (e.target.style.borderColor = "#A8C3B0")}
                  onBlur={(e) => (e.target.style.borderColor = "#EFEDE7")}
                />
              </div>
            )}

            {/* Error */}
            {updateRsvp.error && (
              <div style={{ marginBottom: 16, padding: "10px 14px", background: "#FFF0F0", borderRadius: 8, color: "#C0392B", fontSize: 13 }}>
                {updateRsvp.error.message}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={!rsvpStatus || updateRsvp.isPending}
              style={{ width: "100%", padding: "13px", borderRadius: 9999, border: "none", background: !rsvpStatus ? "#EFEDE7" : "#3F4842", color: !rsvpStatus ? "#8B8B85" : "#F8F6F2", fontSize: 15, fontWeight: 500, cursor: !rsvpStatus ? "not-allowed" : "pointer", transition: "all 0.15s", fontFamily: "'Heebo', sans-serif" }}
            >
              {updateRsvp.isPending ? "שולח..." : "שלח תשובה"}
            </button>
          </div>

          {/* Footer */}
          <div style={{ textAlign: "center", marginTop: 20, fontSize: 12, color: "#B0ADA6" }}>
            מופעל על ידי <span style={{ fontFamily: "'Cormorant Garamond', serif", letterSpacing: 3, color: "#5D6861" }}>VEYA</span>
          </div>
        </form>
      </div>
    </div>
  );
}
