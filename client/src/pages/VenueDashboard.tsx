import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";

/**
 * VEYA Venue Dashboard — exact prototype match (venue_dashboard.html)
 * Moss sidebar + cream main area + KPI cards + next wedding hero card
 */
export default function VenueDashboard() {
  const { user, logout } = useAuth({ redirectOnUnauthenticated: true });
  const [, navigate] = useLocation();
  const { data: venue, isLoading } = trpc.venue.me.useQuery(undefined, { enabled: !!user });

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  if (isLoading || !user) {
    return <VenueSkeleton />;
  }

  const venueName = venue?.name ?? user.name ?? "האולם שלי";
  const initials = venueName.slice(0, 2);

  return (
    <div className="veya-app-shell">
      {/* ── Sidebar ── */}
      <aside className="veya-sidebar" style={{ position: "relative" }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 36, padding: "0 6px" }}>
          <VeyaLogoSvg size={26} color="var(--sand)" />
          <span className="veya-wordmark">VEYA</span>
        </div>

        {/* Nav */}
        <div className="veya-nav-section" style={{ marginTop: 0 }}>המסך שלי</div>
        <NavItem icon={<IconHome />} label="דשבורד" active />

        <div className="veya-nav-section">ניהול האולם</div>
        <NavItem icon={<IconTable />} label="תבנית סידור שולחנות" />
        <NavItem icon={<IconReport />} label="דוחות אוטומטיים" />
        <NavItem icon={<IconClock />} label="לוח זמנים יום החתונה" />
        <NavItem icon={<IconDoc />} label="מסמכים" />
        <NavItem icon={<IconVendor />} label="ספקים מועדפים" />
        <NavItem icon={<IconChart />} label="סטטיסטיקות" />

        {/* Botanical decoration */}
        <svg className="veya-botanical" width="80" height="50" viewBox="0 0 80 50" fill="none">
          <path d="M4 44 Q30 28, 76 6" stroke="#A8C3B0" strokeWidth="1.2" fill="none" />
          <ellipse cx="14" cy="38" rx="6" ry="3" fill="#A8C3B0" transform="rotate(-30 14 38)" />
          <ellipse cx="30" cy="28" rx="5.5" ry="2.5" fill="#A8C3B0" transform="rotate(-25 30 28)" />
          <ellipse cx="48" cy="18" rx="5" ry="2.5" fill="#A8C3B0" transform="rotate(-20 48 18)" />
          <ellipse cx="62" cy="11" rx="4.5" ry="2" fill="#A8C3B0" transform="rotate(-15 62 11)" />
        </svg>

        {/* Profile */}
        <div style={{ marginTop: "auto", paddingTop: 20, borderTop: "1px solid rgba(248, 246, 242, 0.1)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 6px" }}>
            <div className="veya-avatar">{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, color: "var(--cream)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {venueName}
              </div>
              <div style={{ fontSize: 11, color: "rgba(248, 246, 242, 0.5)" }}>
                {venue?.plan ?? "Trial"}
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="יציאה"
              style={{ background: "transparent", border: "none", color: "rgba(248,246,242,0.5)", cursor: "pointer", padding: 4, borderRadius: 4 }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="veya-main">
        {/* Page header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32, gap: 20, flexWrap: "wrap" }}>
          <div>
            <div className="veya-page-eyebrow">Venue Dashboard</div>
            <h1 className="veya-page-title">{venueName}</h1>
            <p className="veya-page-subtitle">
              ברוכים הבאים · <strong>יש לכם 3 חתונות החודש</strong>
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="veya-btn-secondary" style={{ fontSize: 13 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
              הגדרות אולם
            </button>
            <button className="veya-btn-primary" style={{ fontSize: 13 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
              חתונה חדשה
            </button>
          </div>
        </div>

        {/* KPI Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 32 }}>
          {[
            { label: "חתונות החודש", value: "3", trend: "+1 מהחודש שעבר", up: true },
            { label: "אורחים מוזמנים", value: "847", trend: "ב-3 חתונות", up: null },
            { label: "אישורי הגעה", value: "612", trend: "72% מהמוזמנים", up: true },
            { label: "הכנסה חזויה", value: "₪284K", trend: "החודש", up: null },
            { label: "שביעות רצון", value: "4.9", trend: "מ-5 · 23 ביקורות", up: true },
          ].map((stat) => (
            <div key={stat.label} className="veya-stat-card">
              <div className="veya-stat-label">
                <span>{stat.label}</span>
              </div>
              <div className="veya-stat-value">{stat.value}</div>
              <div className="veya-stat-trend" style={{ color: stat.up === true ? "var(--success)" : stat.up === false ? "var(--danger)" : "var(--forest)" }}>
                {stat.trend}
              </div>
            </div>
          ))}
        </div>

        {/* Next wedding hero card */}
        <div className="veya-hero-card" style={{ display: "flex", alignItems: "stretch", gap: 24, marginBottom: 32 }}>
          <div style={{ flex: 1, minWidth: 0, position: "relative", zIndex: 2 }}>
            <div className="veya-eyebrow">החתונה הקרובה</div>
            <div style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 28, fontWeight: 500, marginBottom: 4, lineHeight: 1.2 }}>
              נועה{" "}
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", color: "var(--sand)", margin: "0 4px" }}>·</span>
              {" "}אורי
            </div>
            <div style={{ fontSize: 14, color: "rgba(248, 246, 242, 0.85)", marginBottom: 18 }}>
              יום שישי, <strong style={{ color: "var(--sand)" }}>27.06.2025</strong> · בעוד 17 ימים
            </div>
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
              {[
                { label: "מוזמנים", value: "280" },
                { label: "מאשרים", value: "241" },
                { label: "שולחנות", value: "28" },
              ].map((s) => (
                <div key={s.label} style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: 11, color: "rgba(248, 246, 242, 0.55)", letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: 4 }}>{s.label}</span>
                  <span style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 22, color: "var(--cream)", fontWeight: 500, lineHeight: 1.1 }}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, justifyContent: "center", position: "relative", zIndex: 2 }}>
            <button style={{ background: "var(--sand)", color: "var(--moss)", border: "none", borderRadius: 4, padding: "11px 22px", fontSize: 13, fontWeight: 500, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8, fontFamily: "inherit", transition: "background 0.2s" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12 C3 7 7 4 12 4 C17 4 21 7 23 12 C21 17 17 20 12 20 C7 20 3 17 1 12 Z" /><circle cx="12" cy="12" r="3" /></svg>
              פתח חתונה
            </button>
            <button style={{ background: "transparent", color: "var(--cream)", border: "1px solid rgba(248, 246, 242, 0.3)", borderRadius: 4, padding: "10px 18px", fontSize: 13, fontWeight: 500, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 7, fontFamily: "inherit", transition: "all 0.2s" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2 H6 V22 H18 V8 L14 2 Z" /><path d="M14 2 V8 H18" /></svg>
              דוחות
            </button>
          </div>
        </div>

        {/* Weddings list */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 16, gap: 16 }}>
            <div>
              <h2 className="veya-section-title">חתונות קרובות</h2>
              <div className="veya-section-sub">3 חתונות ב-30 הימים הקרובים</div>
            </div>
            <a href="#" style={{ fontSize: 12.5, color: "var(--moss)", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 5, textDecoration: "underline", textDecorationColor: "var(--sage)", textUnderlineOffset: 3 }}>
              כל החתונות
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </a>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
            {[
              { name1: "נועה", name2: "אורי", date: "27.06.2025", guests: 280, confirmed: 241, daysLeft: 17, status: "active" },
              { name1: "שירה", name2: "יונתן", date: "04.07.2025", guests: 320, confirmed: 198, daysLeft: 24, status: "prep" },
              { name1: "מיכל", name2: "דוד", date: "11.07.2025", guests: 247, confirmed: 0, daysLeft: 31, status: "prep" },
            ].map((w) => (
              <WeddingCard key={w.name1} {...w} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

/* ── Wedding Card ── */
function WeddingCard({ name1, name2, date, guests, confirmed, daysLeft, status }: {
  name1: string; name2: string; date: string; guests: number; confirmed: number; daysLeft: number; status: string;
}) {
  const pct = guests > 0 ? Math.round((confirmed / guests) * 100) : 0;
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "18px 20px", transition: "all 0.15s", cursor: "pointer" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
        <div>
          <div style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 18, color: "var(--moss)", fontWeight: 500, lineHeight: 1.2 }}>
            {name1}{" "}
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", color: "var(--sand)" }}>·</span>
            {" "}{name2}
          </div>
          <div style={{ fontSize: 12.5, color: "var(--forest)", marginTop: 3 }}>{date}</div>
        </div>
        <span style={{
          fontSize: 10,
          padding: "3px 8px",
          borderRadius: 3,
          fontWeight: 500,
          background: status === "active" ? "var(--success-bg)" : "var(--whisper)",
          color: status === "active" ? "var(--success)" : "var(--forest)",
        }}>
          {daysLeft} ימים
        </span>
      </div>
      <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 20, color: "var(--moss)", lineHeight: 1 }}>{guests}</div>
          <div style={{ fontSize: 10, color: "var(--muted)", letterSpacing: "0.5px", marginTop: 2 }}>מוזמנים</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 20, color: "var(--success)", lineHeight: 1 }}>{confirmed}</div>
          <div style={{ fontSize: 10, color: "var(--muted)", letterSpacing: "0.5px", marginTop: 2 }}>מאשרים</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 20, color: "var(--moss)", lineHeight: 1 }}>{pct}%</div>
          <div style={{ fontSize: 10, color: "var(--muted)", letterSpacing: "0.5px", marginTop: 2 }}>אישורים</div>
        </div>
      </div>
      {/* Progress bar */}
      <div style={{ height: 3, background: "var(--border)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: "var(--sage)", borderRadius: 2, transition: "width 0.5s" }} />
      </div>
    </div>
  );
}

/* ── Nav Item ── */
function NavItem({ icon, label, active = false }: { icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <a href="#" className={`veya-nav-item${active ? " active" : ""}`}>
      {icon}
      {label}
    </a>
  );
}

/* ── Skeleton ── */
function VenueSkeleton() {
  return (
    <div className="veya-app-shell">
      <aside className="veya-sidebar" />
      <main className="veya-main">
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {[200, 120, 80].map((w) => (
            <div key={w} style={{ height: w, background: "var(--whisper)", borderRadius: 8, animation: "pulse 1.5s ease-in-out infinite" }} />
          ))}
        </div>
      </main>
    </div>
  );
}

/* ── SVG Icons (stroke, 16×16) ── */
function VeyaLogoSvg({ size = 26, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 10 L20 30 L32 10" />
      <path d="M14 14 L20 22 L26 14" opacity="0.6" />
    </svg>
  );
}
function IconHome() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12 L12 4 L21 12 M5 10 V20 H19 V10" /></svg>; }
function IconTable() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8" cy="8" r="2" /><circle cx="16" cy="8" r="2" /></svg>; }
function IconReport() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2 H6 V22 H18 V8 L14 2 Z" /><path d="M14 2 V8 H18" /></svg>; }
function IconClock() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7 V12 L15 14" /></svg>; }
function IconDoc() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 3 H15 L19 7 V21 H5 Z" /></svg>; }
function IconVendor() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9 L7 5 H17 L21 9 V19 H3 Z" /></svg>; }
function IconChart() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 17 L9 11 L13 15 L21 7" /></svg>; }
