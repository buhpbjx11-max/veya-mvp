import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

type Step = "choose" | "venue-form" | "couple-form";

/**
 * VEYA Onboarding — exact prototype match (couple_signup.html + venue_signup)
 * Split-screen: brand panel (moss) + form panel (cream)
 */
export default function Onboarding() {
  const [, navigate] = useLocation();
  const { user } = useAuth({ redirectOnUnauthenticated: true });
  const [step, setStep] = useState<Step>("choose");

  // Venue form state
  const [venueName, setVenueName] = useState("");
  const [venueRegion, setVenueRegion] = useState("");
  const [venuePhone, setVenuePhone] = useState("");

  // Couple form state
  const [name1, setName1] = useState("");
  const [name2, setName2] = useState("");
  const [phone1, setPhone1] = useState("");
  const [phone2, setPhone2] = useState("");
  const [weddingDate, setWeddingDate] = useState("");

  const registerVenue = trpc.venue.register.useMutation({
    onSuccess: () => {
      toast.success("האולם נרשם בהצלחה!");
      navigate("/venue/dashboard", { replace: true });
    },
    onError: (err) => toast.error(err.message || "שגיאה בהרשמת האולם"),
  });

  const registerCouple = trpc.couple.register.useMutation({
    onSuccess: () => {
      toast.success("הפרופיל נוצר בהצלחה!");
      navigate("/couple/dashboard", { replace: true });
    },
    onError: (err) => toast.error(err.message || "שגיאה ביצירת הפרופיל"),
  });

  const handleVenueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!venueName.trim()) { toast.error("יש להזין שם אולם"); return; }
    registerVenue.mutate({ name: venueName.trim(), region: venueRegion.trim() || undefined, phone: venuePhone.trim() || undefined });
  };

  const handleCoupleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name1.trim() || !name2.trim()) { toast.error("יש להזין את שמות שני בני/בנות הזוג"); return; }
    registerCouple.mutate({ name1: name1.trim(), name2: name2.trim(), phone1: phone1.trim() || undefined, phone2: phone2.trim() || undefined, weddingDate: weddingDate || undefined });
  };

  return (
    <div className="veya-auth-shell">
      {/* ── RIGHT: Brand Panel ── */}
      <div className="veya-brand-panel">
        <div style={{ display: "flex", alignItems: "center", gap: 12, position: "relative", zIndex: 2 }}>
          <VeyaLogoSvg size={28} color="var(--sand)" />
          <span className="veya-wordmark">VEYA</span>
        </div>

        <div style={{ position: "relative", zIndex: 2, maxWidth: 420 }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: 14, color: "var(--sand)", letterSpacing: "2.5px", marginBottom: 14 }}>
            {step === "choose" ? "Welcome" : step === "venue-form" ? "Venue Setup" : "Your Wedding"}
          </div>
          <h1 style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 36, color: "var(--cream)", fontWeight: 500, lineHeight: 1.25, marginBottom: 20 }}>
            {step === "choose"
              ? "מתחילים את המסע"
              : step === "venue-form"
              ? "האולם שלכם ב-VEYA"
              : "החתונה שלכם, כולה במקום אחד"}
          </h1>
          <p style={{ fontSize: 15, color: "rgba(248, 246, 242, 0.75)", lineHeight: 1.8 }}>
            {step === "choose"
              ? "בחרו את סוג החשבון שלכם — אולם שמנהל חתונות, או זוג שמתכנן את היום הגדול."
              : step === "venue-form"
              ? "הגדירו את פרטי האולם ותתחילו לנהל חתונות בצורה חכמה יותר."
              : "כל האורחים, ההושבה, התקציב, המתנות — הכל במסך אחד שקט."}
          </p>
        </div>

        {/* Feature list */}
        <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", gap: 10, maxWidth: 420 }}>
          {(step === "venue-form"
            ? ["שליחת קישור ייחודי לכל זוג", "דוח שף אוטומטי בבוקר החתונה", "ניהול ספקים ולוחות זמנים", "ניסיון חינם 14 יום"]
            : ["ניהול אורחים ו-RSVP", "הושבה ויזואלית", "מעקב תקציב ומתנות", "שיתוף עם המשפחה"]
          ).map((feat) => (
            <div key={feat} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13.5, color: "rgba(248, 246, 242, 0.8)" }}>
              <div style={{ width: 18, height: 18, borderRadius: "50%", border: "1px solid var(--sage)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--sage)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              {feat}
            </div>
          ))}
        </div>
      </div>

      {/* ── LEFT: Form Panel ── */}
      <div className="veya-form-panel">
        <div className="veya-form-stage">

          {/* Progress indicator */}
          <div style={{ display: "flex", gap: 6, marginBottom: 28 }}>
            {(["choose", "venue-form", "couple-form"] as Step[]).slice(0, step === "choose" ? 1 : 2).map((_, i) => (
              <div key={i} style={{ height: 3, flex: 1, borderRadius: 2, background: i === 0 ? "var(--moss)" : "var(--border)" }} />
            ))}
          </div>

          {/* ── Step: Choose ── */}
          {step === "choose" && (
            <>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: 12, color: "var(--muted)", letterSpacing: 2, marginBottom: 6 }}>
                • Step 1 of 2
              </div>
              <h2 style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 28, color: "var(--moss)", fontWeight: 400, marginBottom: 6 }}>
                ברוכים הבאים{user?.name ? `, ${user.name}` : ""}
              </h2>
              <p style={{ fontSize: 13.5, color: "var(--forest)", lineHeight: 1.7, marginBottom: 28 }}>
                בחרו את סוג החשבון שלכם כדי להמשיך
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <ChoiceCard
                  icon={<IconVenue />}
                  title="אולם / מקום אירועים"
                  sub="ניהול חתונות, שליחת קישורים לזוגות, דוחות שף, ניהול ספקים"
                  badge="B2B"
                  onClick={() => setStep("venue-form")}
                />
                <ChoiceCard
                  icon={<IconCouple />}
                  title="זוג מתחתן"
                  sub="ניהול אורחים, הושבה, תקציב, מתנות, תמונות — הכל במקום אחד"
                  badge="B2C"
                  onClick={() => setStep("couple-form")}
                />
              </div>
            </>
          )}

          {/* ── Step: Venue form ── */}
          {step === "venue-form" && (
            <>
              <button onClick={() => setStep("choose")} style={{ background: "transparent", border: "none", color: "var(--forest)", cursor: "pointer", fontSize: 12.5, display: "inline-flex", alignItems: "center", gap: 5, marginBottom: 20, padding: 0, fontFamily: "inherit" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                חזרה
              </button>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: 12, color: "var(--muted)", letterSpacing: 2, marginBottom: 6 }}>• Venue Registration</div>
              <h2 style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 28, color: "var(--moss)", fontWeight: 400, marginBottom: 6 }}>פרטי האולם</h2>
              <p style={{ fontSize: 13.5, color: "var(--forest)", lineHeight: 1.7, marginBottom: 24 }}>מתחילים עם ניסיון חינם של 14 יום — ללא כרטיס אשראי</p>

              <form onSubmit={handleVenueSubmit}>
                <div style={{ marginBottom: 14 }}>
                  <label className="veya-label">שם האולם *</label>
                  <input className="veya-input" value={venueName} onChange={(e) => setVenueName(e.target.value)} placeholder="למשל: אולמי הגן הקסום" required />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label className="veya-label">אזור</label>
                  <input className="veya-input" value={venueRegion} onChange={(e) => setVenueRegion(e.target.value)} placeholder="מרכז, צפון, ירושלים..." />
                </div>
                <div style={{ marginBottom: 22 }}>
                  <label className="veya-label">טלפון</label>
                  <input className="veya-input" value={venuePhone} onChange={(e) => setVenuePhone(e.target.value)} placeholder="050-0000000" dir="ltr" style={{ textAlign: "right" }} />
                </div>
                <PrimaryButton loading={registerVenue.isPending} label="יצירת חשבון אולם" loadingLabel="רושמים..." />
              </form>
            </>
          )}

          {/* ── Step: Couple form ── */}
          {step === "couple-form" && (
            <>
              <button onClick={() => setStep("choose")} style={{ background: "transparent", border: "none", color: "var(--forest)", cursor: "pointer", fontSize: 12.5, display: "inline-flex", alignItems: "center", gap: 5, marginBottom: 20, padding: 0, fontFamily: "inherit" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                חזרה
              </button>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: 12, color: "var(--muted)", letterSpacing: 2, marginBottom: 6 }}>• Couple Registration</div>
              <h2 style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 28, color: "var(--moss)", fontWeight: 400, marginBottom: 6 }}>פרטי הזוג</h2>
              <p style={{ fontSize: 13.5, color: "var(--forest)", lineHeight: 1.7, marginBottom: 24 }}>נטרלי מגדרית — שם 1 ושם 2 בלבד</p>

              <form onSubmit={handleCoupleSubmit}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                  <div>
                    <label className="veya-label">שם 1 *</label>
                    <input className="veya-input" value={name1} onChange={(e) => setName1(e.target.value)} placeholder="שם פרטי" required />
                  </div>
                  <div>
                    <label className="veya-label">שם 2 *</label>
                    <input className="veya-input" value={name2} onChange={(e) => setName2(e.target.value)} placeholder="שם פרטי" required />
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                  <div>
                    <label className="veya-label">טלפון (שם 1)</label>
                    <input className="veya-input" value={phone1} onChange={(e) => setPhone1(e.target.value)} placeholder="050-0000000" dir="ltr" style={{ textAlign: "right" }} />
                  </div>
                  <div>
                    <label className="veya-label">טלפון (שם 2)</label>
                    <input className="veya-input" value={phone2} onChange={(e) => setPhone2(e.target.value)} placeholder="050-0000000" dir="ltr" style={{ textAlign: "right" }} />
                  </div>
                </div>
                <div style={{ marginBottom: 22 }}>
                  <label className="veya-label">תאריך החתונה</label>
                  <input className="veya-input" type="date" value={weddingDate} onChange={(e) => setWeddingDate(e.target.value)} dir="ltr" style={{ textAlign: "right" }} />
                </div>
                <PrimaryButton loading={registerCouple.isPending} label="יצירת פרופיל זוג" loadingLabel="יוצרים פרופיל..." />
              </form>
            </>
          )}

          <div style={{ marginTop: 20, fontSize: 11.5, color: "var(--muted)", textAlign: "center" }}>
            VEYA © 2026 — כל הזכויות שמורות
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ── */
function ChoiceCard({ icon, title, sub, badge, onClick }: { icon: React.ReactNode; title: string; sub: string; badge: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "var(--cream)",
        border: "1.5px solid var(--border)",
        borderRadius: 8,
        padding: "18px 20px",
        cursor: "pointer",
        textAlign: "right",
        transition: "all 0.15s",
        display: "flex",
        alignItems: "flex-start",
        gap: 14,
        width: "100%",
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--moss)"; (e.currentTarget as HTMLButtonElement).style.background = "var(--mist)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLButtonElement).style.background = "var(--cream)"; }}
    >
      <div style={{ width: 40, height: 40, borderRadius: 8, background: "var(--mist)", color: "var(--moss)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <div style={{ width: 18, height: 18 }}>{icon}</div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 16, color: "var(--moss)", fontWeight: 500 }}>{title}</span>
          <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 3, background: "var(--whisper)", color: "var(--forest)", fontWeight: 500 }}>{badge}</span>
        </div>
        <p style={{ fontSize: 12.5, color: "var(--forest)", lineHeight: 1.6, margin: 0 }}>{sub}</p>
      </div>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 4 }}>
        <path d="M15 18l-6-6 6-6" />
      </svg>
    </button>
  );
}

function PrimaryButton({ loading, label, loadingLabel }: { loading: boolean; label: string; loadingLabel: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      style={{
        width: "100%",
        background: loading ? "var(--sage)" : "var(--moss)",
        color: "var(--cream)",
        border: "none",
        borderRadius: 4,
        padding: "13px",
        fontSize: 14,
        fontWeight: 500,
        fontFamily: "inherit",
        cursor: loading ? "not-allowed" : "pointer",
        transition: "background 0.2s",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
      }}
    >
      {loading ? (
        <><SpinnerSvg />{loadingLabel}</>
      ) : (
        <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>{label}</>
      )}
    </button>
  );
}

function SpinnerSvg() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 1s linear infinite" }}>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}

/* ── SVG Icons ── */
function VeyaLogoSvg({ size = 26, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 10 L20 30 L32 10" />
      <path d="M14 14 L20 22 L26 14" opacity="0.6" />
    </svg>
  );
}
function IconVenue() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9 L12 3 L21 9 V20 H3 Z" /></svg>; }
function IconCouple() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="9" r="3" /><circle cx="16" cy="9" r="3" /><path d="M3 21 C3 17 5 14 8 14 M21 21 C21 17 19 14 16 14" /></svg>; }
