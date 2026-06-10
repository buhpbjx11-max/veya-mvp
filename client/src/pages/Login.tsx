import { getLoginUrl } from "@/const";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

/**
 * VEYA Login Page — split-screen, exact prototype match (venue_login.html)
 * Brand panel (moss) on right (RTL), form panel (white) on left.
 */
export default function Login() {
  const [, navigate] = useLocation();
  const { data: user, isLoading } = trpc.auth.me.useQuery();

  useEffect(() => {
    if (!isLoading && user) {
      navigate("/auth/redirect", { replace: true });
    }
  }, [user, isLoading, navigate]);

  const handleLogin = () => {
    window.location.href = getLoginUrl();
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <VeyaLogoSvg size={32} color="var(--sand)" />
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "var(--moss)", letterSpacing: 6 }}>VEYA</span>
        </div>
      </div>
    );
  }

  return (
    <div className="veya-auth-shell">

      {/* ── RIGHT: Brand Panel (moss) ── */}
      <div className="veya-brand-panel">
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, position: "relative", zIndex: 2 }}>
          <VeyaLogoSvg size={28} color="var(--sand)" />
          <span className="veya-wordmark">VEYA</span>
        </div>

        {/* Main content */}
        <div style={{ position: "relative", zIndex: 2, maxWidth: 420 }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: 14, color: "var(--sand)", letterSpacing: "2.5px", marginBottom: 14 }}>
            Events, Perfectly Yours
          </div>
          <h1 style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 38, color: "var(--cream)", fontWeight: 500, lineHeight: 1.25, marginBottom: 20 }}>
            האירוע שלכם{" "}
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", color: "var(--sand)" }}>·</span>
            {" "}במקום אחד שקט
          </h1>
          <p style={{ fontSize: 15, color: "rgba(248, 246, 242, 0.75)", lineHeight: 1.8 }}>
            העדכון של רותי שולח את עצמו, התפריט הסופי כבר אצל יוסי, וכל זוג יודע איפה הוא עומד. כל זה — מבלי שלכם תצטרכו לזכור.
          </p>
        </div>

        {/* Quote */}
        <blockquote style={{ position: "relative", zIndex: 2, paddingTop: 22, borderTop: "1px solid rgba(248, 246, 242, 0.15)", maxWidth: 420 }}>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: 17, color: "rgba(248, 246, 242, 0.85)", lineHeight: 1.6, marginBottom: 8 }}>
            "מאז שעברנו ל-VEYA, כל זוג מגיע מוכן ליום החתונה. אנחנו פחות מטלפנים, יותר מתכננים אירועים מדויקים."
          </p>
          <cite style={{ fontSize: 12, color: "var(--sand)", fontStyle: "normal", letterSpacing: 1 }}>
            רותי, אחוזת הגליל · 7 חודשים ב-VEYA
          </cite>
        </blockquote>
      </div>

      {/* ── LEFT: Form Panel ── */}
      <div className="veya-form-panel">
        <div className="veya-form-stage">

          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: 12, color: "var(--muted)", letterSpacing: 2, marginBottom: 6 }}>
            • Welcome back
          </div>
          <h2 style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 30, color: "var(--moss)", fontWeight: 400, marginBottom: 6 }}>
            כניסה ל-VEYA
          </h2>
          <p style={{ fontSize: 13.5, color: "var(--forest)", lineHeight: 1.7, marginBottom: 28 }}>
            היכנסו כדי להמשיך לדשבורד שלכם — חתונות, אורחים, צוות, הכל מסונכרן.
          </p>

          {/* User type tabs */}
          <UserTypeTabs />

          {/* OAuth buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 22 }}>
            <button className="veya-oauth-btn" onClick={handleLogin}>
              <GoogleSvg />
              המשך עם Google
            </button>
          </div>

          <div className="veya-divider">או</div>

          {/* Email form */}
          <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
            <div style={{ marginBottom: 14 }}>
              <label className="veya-label">אימייל</label>
              <input type="email" className="veya-input" placeholder="venue@veya.co.il" />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label className="veya-label">סיסמה</label>
              <input type="password" className="veya-input" placeholder="••••••••" />
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "8px 0 22px", fontSize: 12.5 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", color: "var(--forest)" }}>
                <input type="checkbox" style={{ width: 14, height: 14, accentColor: "var(--moss)" }} />
                זכור אותי
              </label>
              <a href="#" style={{ color: "var(--moss)", textDecoration: "underline", textDecorationColor: "var(--sage)", textUnderlineOffset: 3, fontWeight: 500 }}>
                שכחתי סיסמה
              </a>
            </div>

            <SubmitButton onClick={handleLogin} />
          </form>

          <div style={{ marginTop: 26, paddingTop: 22, borderTop: "1px solid var(--border)", textAlign: "center", fontSize: 13, color: "var(--forest)" }}>
            אין לכם חשבון?{" "}
            <a href="/onboarding" style={{ color: "var(--moss)", fontWeight: 500, textDecoration: "underline", textDecorationColor: "var(--sage)", textUnderlineOffset: 3 }}>
              הכניסה הראשונה יוצרת חשבון אוטומטית
            </a>
          </div>

          <div style={{ marginTop: 16, fontSize: 11.5, color: "var(--muted)", textAlign: "center", lineHeight: 1.7 }}>
            בכניסה לאחר אתם מאשרים את{" "}
            <a href="#" style={{ color: "var(--forest)", textDecoration: "underline", textDecorationColor: "var(--border)", textUnderlineOffset: 2 }}>תנאי השימוש</a>
            {" "}ו
            <a href="#" style={{ color: "var(--forest)", textDecoration: "underline", textDecorationColor: "var(--border)", textUnderlineOffset: 2 }}>מדיניות הפרטיות</a>
            {" "}של VEYA
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ── */

function UserTypeTabs() {
  return (
    <div style={{ display: "flex", gap: 4, background: "var(--cream)", border: "1px solid var(--border)", padding: 4, borderRadius: 4, marginBottom: 22 }}>
      {[
        { label: "אולם", active: true },
        { label: "מתכנן", active: false },
        { label: "זוג", active: false },
      ].map(({ label, active }) => (
        <button
          key={label}
          style={{
            flex: 1,
            background: active ? "var(--moss)" : "transparent",
            border: "none",
            padding: "8px 10px",
            fontSize: 12.5,
            fontWeight: 500,
            color: active ? "var(--cream)" : "var(--forest)",
            cursor: "pointer",
            borderRadius: 4,
            fontFamily: "inherit",
            transition: "all 0.15s",
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function SubmitButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="submit"
      onClick={onClick}
      style={{
        width: "100%",
        background: "var(--moss)",
        color: "var(--cream)",
        border: "none",
        borderRadius: 4,
        padding: "13px",
        fontSize: 14,
        fontWeight: 500,
        fontFamily: "inherit",
        cursor: "pointer",
        transition: "background 0.2s",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
      }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "var(--charcoal)")}
      onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "var(--moss)")}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14M12 5l7 7-7 7" />
      </svg>
      כניסה
    </button>
  );
}

function VeyaLogoSvg({ size = 26, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 10 L20 30 L32 10" />
      <path d="M14 14 L20 22 L26 14" opacity="0.6" />
    </svg>
  );
}

function GoogleSvg() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.5 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.22-4.74 3.22-8.32z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18A11 11 0 0 0 1 12c0 1.78.43 3.46 1.18 4.93l3.66-2.83z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83c.87-2.6 3.3-4.52 6.16-4.52z" />
    </svg>
  );
}
