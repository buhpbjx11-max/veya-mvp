import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { toast } from "sonner";

const CARD = {
  background: "#fff",
  border: "1px solid #EFEDE7",
  borderRadius: 18,
  boxShadow: "0 1px 2px rgba(45,45,45,.04), 0 8px 24px rgba(63,72,66,.06)",
};

const IcoBack = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>;
const IcoStar = ({ filled }: { filled: boolean }) => (
  <svg viewBox="0 0 24 24" fill={filled ? "#D9C5A1" : "none"} stroke={filled ? "#D9C5A1" : "#C8C4BC"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);
const IcoCheck = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>;

const QUESTIONS = [
  { key: "overall", label: "חוויה כללית", desc: "כמה הייתם מרוצים מהיום הגדול?" },
  { key: "venue", label: "האולם", desc: "שירות, אווירה, ניהול האירוע" },
  { key: "veya_system", label: "מערכת VEYA", desc: "כמה VEYA עזרה לכם בתכנון?" },
  { key: "seating", label: "כלי ההושבה", desc: "קלות השימוש בסידור השולחנות" },
  { key: "guests", label: "ניהול אורחים", desc: "RSVP, מעקב, ייצוא" },
  { key: "budget", label: "ניהול תקציב", desc: "מעקב הוצאות ותכנון תקציב" },
];

export default function FeedbackSurvey() {
  const { user } = useAuth({ redirectOnUnauthenticated: true });
  const [, navigate] = useLocation();
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [systemFeedback, setSystemFeedback] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const { data: existing, isLoading } = trpc.feedback.get.useQuery(undefined, {
    enabled: !!user,
  });

  useEffect(() => {
    if (existing) {
      setSubmitted(true);
      setRatings((existing.ratings as Record<string, number>) ?? {});
      setSystemFeedback(existing.systemFeedback ?? "");
    }
  }, [existing]);

  const submit = trpc.feedback.submit.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      toast.success("תודה על המשוב! 💚");
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = () => {
    const missing = QUESTIONS.filter((q) => !ratings[q.key]);
    if (missing.length > 0) {
      toast.error(`נא לדרג: ${missing.map((q) => q.label).join(", ")}`);
      return;
    }
    submit.mutate({ ratings, systemFeedback: systemFeedback || undefined });
  };

  if (isLoading) return (
    <div style={{ minHeight: "100vh", background: "#F8F6F2", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#5D6861", fontFamily: "Heebo, sans-serif" }}>טוען...</div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#F8F6F2", padding: "36px 44px 60px", direction: "rtl" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
        <button
          onClick={() => navigate("/couple/dashboard")}
          style={{ background: "transparent", border: "none", cursor: "pointer", color: "#5D6861", width: 20, height: 20, padding: 0 }}
        >
          <IcoBack />
        </button>
        <div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: 13, color: "#A8C3B0", letterSpacing: 1 }}>
            שבוע אחרי
          </div>
          <h1 style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 28, color: "#3F4842", margin: 0, fontWeight: 500 }}>
            משוב על היום הגדול
          </h1>
        </div>
      </div>

      {submitted ? (
        /* ── Submitted state ── */
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <div style={{ ...CARD, padding: "48px 40px", textAlign: "center" }}>
            <div style={{ width: 64, height: 64, background: "rgba(168,195,176,.15)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", color: "#A8C3B0" }}>
              <IcoCheck />
            </div>
            <h2 style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 24, color: "#3F4842", margin: "0 0 12px", fontWeight: 500 }}>
              תודה על המשוב!
            </h2>
            <p style={{ fontFamily: "Heebo, sans-serif", fontSize: 15, color: "#5D6861", lineHeight: 1.7, margin: "0 0 32px" }}>
              המשוב שלכם עוזר לנו לשפר את VEYA עבור זוגות נוספים.
            </p>
            {/* Show submitted ratings */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, textAlign: "right" }}>
              {QUESTIONS.map((q) => (
                <div key={q.key} style={{ padding: "12px 16px", background: "#F8F6F2", borderRadius: 12 }}>
                  <div style={{ fontFamily: "Heebo, sans-serif", fontSize: 12, color: "#A8C3B0", marginBottom: 4 }}>{q.label}</div>
                  <div style={{ display: "flex", gap: 2 }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <span key={s} style={{ width: 16, height: 16 }}>
                        <IcoStar filled={s <= (ratings[q.key] ?? 0)} />
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {systemFeedback && (
              <div style={{ marginTop: 20, padding: "16px 20px", background: "#F8F6F2", borderRadius: 12, textAlign: "right" }}>
                <div style={{ fontFamily: "Heebo, sans-serif", fontSize: 12, color: "#A8C3B0", marginBottom: 6 }}>הערות נוספות</div>
                <p style={{ fontFamily: "Heebo, sans-serif", fontSize: 14, color: "#5D6861", margin: 0, lineHeight: 1.6 }}>{systemFeedback}</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ── Survey form ── */
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <div style={{ ...CARD, padding: "12px 24px", marginBottom: 24, background: "rgba(168,195,176,.08)", border: "1px solid rgba(168,195,176,.3)" }}>
            <p style={{ fontFamily: "Heebo, sans-serif", fontSize: 14, color: "#5D6861", margin: 0, lineHeight: 1.7 }}>
              מזל טוב! 🎉 שבוע אחרי היום הגדול — נשמח לשמוע איך הכל הלך. המשוב שלכם עוזר לנו לשפר את VEYA עבור זוגות נוספים.
            </p>
          </div>

          {/* Rating questions */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
            {QUESTIONS.map((q) => (
              <div key={q.key} style={{ ...CARD, padding: "20px 24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div>
                    <div style={{ fontFamily: "Heebo, sans-serif", fontSize: 15, color: "#3F4842", fontWeight: 600, marginBottom: 2 }}>{q.label}</div>
                    <div style={{ fontFamily: "Heebo, sans-serif", fontSize: 13, color: "#A8C3B0" }}>{q.desc}</div>
                  </div>
                  {ratings[q.key] && (
                    <span style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 22, color: "#D9C5A1", fontWeight: 500 }}>
                      {ratings[q.key]}/5
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRatings((prev) => ({ ...prev, [q.key]: star }))}
                      style={{
                        background: "transparent", border: "none", cursor: "pointer", padding: 2,
                        width: 36, height: 36,
                        transform: ratings[q.key] === star ? "scale(1.15)" : "scale(1)",
                        transition: "transform 0.15s",
                      }}
                      title={`${star} כוכבים`}
                    >
                      <IcoStar filled={star <= (ratings[q.key] ?? 0)} />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Free text */}
          <div style={{ ...CARD, padding: "20px 24px", marginBottom: 24 }}>
            <div style={{ fontFamily: "Heebo, sans-serif", fontSize: 15, color: "#3F4842", fontWeight: 600, marginBottom: 4 }}>
              הערות נוספות (אופציונלי)
            </div>
            <div style={{ fontFamily: "Heebo, sans-serif", fontSize: 13, color: "#A8C3B0", marginBottom: 12 }}>
              מה עבד מצוין? מה אפשר לשפר?
            </div>
            <textarea
              value={systemFeedback}
              onChange={(e) => setSystemFeedback(e.target.value)}
              placeholder="כתבו כאן..."
              rows={4}
              style={{
                width: "100%", padding: "12px 16px", border: "1px solid #EFEDE7", borderRadius: 12,
                fontFamily: "Heebo, sans-serif", fontSize: 14, color: "#3F4842", background: "#F8F6F2",
                resize: "vertical", outline: "none", boxSizing: "border-box", lineHeight: 1.6,
              }}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={submit.isPending}
            style={{
              width: "100%", padding: "16px 24px", background: "#3F4842", color: "#F8F6F2",
              border: "none", borderRadius: 99, fontFamily: "Heebo, sans-serif", fontSize: 15,
              fontWeight: 600, cursor: "pointer", transition: "opacity 0.2s",
              opacity: submit.isPending ? 0.7 : 1,
            }}
          >
            {submit.isPending ? "שולח..." : "שלח משוב"}
          </button>
        </div>
      )}
    </div>
  );
}
