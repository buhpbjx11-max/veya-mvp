import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";

/**
 * VEYA HQ Admin Dashboard — charcoal sidebar (prototype: veya_hq.html)
 * Only accessible to users with role === 'admin'
 */
export default function AdminDashboard() {
  const { user, logout } = useAuth({ redirectOnUnauthenticated: true });
  const [, navigate] = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  if (!user) return null;

  return (
    <div className="veya-app-shell">
      {/* ── Sidebar (charcoal for HQ) ── */}
      <aside style={{
        background: "var(--charcoal)",
        padding: "28px 18px",
        position: "sticky",
        top: 0,
        height: "100vh",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 36, padding: "0 6px" }}>
          <VeyaLogoSvg size={26} color="var(--sand)" />
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "var(--cream)", letterSpacing: 5 }}>VEYA</span>
          <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 3, background: "var(--sand)", color: "var(--charcoal)", fontWeight: 600, letterSpacing: 0.5 }}>HQ</span>
        </div>

        <NavSection label="המסך שלי" />
        <HQNavItem icon={<IconHome />} label="דשבורד" active />

        <NavSection label="ניהול" />
        <HQNavItem icon={<IconVenue />} label="אולמות" />
        <HQNavItem icon={<IconCouple />} label="זוגות" />
        <HQNavItem icon={<IconSubscription />} label="מנויים" />
        <HQNavItem icon={<IconInvoice />} label="חשבוניות" />

        <NavSection label="CRM" />
        <HQNavItem icon={<IconLead />} label="לידים" />
        <HQNavItem icon={<IconChart />} label="אנליטיקה" />

        <NavSection label="מערכת" />
        <HQNavItem icon={<IconAccess />} label="הרשאות גישה" />
        <HQNavItem icon={<IconSettings />} label="הגדרות" />

        {/* Profile */}
        <div style={{ marginTop: "auto", paddingTop: 20, borderTop: "1px solid rgba(248, 246, 242, 0.1)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 6px" }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--sand)", color: "var(--charcoal)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, flexShrink: 0 }}>
              {user.name?.slice(0, 2) ?? "AD"}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, color: "var(--cream)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user.name ?? "Admin"}
              </div>
              <div style={{ fontSize: 11, color: "rgba(248, 246, 242, 0.5)" }}>VEYA HQ</div>
            </div>
            <button onClick={handleLogout} title="יציאה" style={{ background: "transparent", border: "none", color: "rgba(248,246,242,0.5)", cursor: "pointer", padding: 4, borderRadius: 4 }}>
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
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: 13, color: "var(--muted)", letterSpacing: "1.5px", marginBottom: 6 }}>
              • VEYA HQ
            </div>
            <h1 style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 32, color: "var(--moss)", fontWeight: 400, lineHeight: 1.2, marginBottom: 6 }}>
              לוח בקרה
            </h1>
            <p style={{ fontSize: 14, color: "var(--forest)", lineHeight: 1.7 }}>
              ברוכים הבאים, <strong style={{ color: "var(--moss)" }}>{user.name}</strong>
            </p>
          </div>
        </div>

        {/* KPI Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 32 }}>
          {[
            { label: "אולמות פעילים", value: "0", trend: "ב-Trial" },
            { label: "זוגות רשומים", value: "0", trend: "סה\"כ" },
            { label: "הכנסה חודשית", value: "₪0", trend: "MRR" },
            { label: "לידים חדשים", value: "0", trend: "השבוע" },
          ].map((stat) => (
            <div key={stat.label} className="veya-stat-card">
              <div className="veya-stat-label">{stat.label}</div>
              <div className="veya-stat-value">{stat.value}</div>
              <div className="veya-stat-trend">{stat.trend}</div>
            </div>
          ))}
        </div>

        {/* Live activity strip */}
        <div style={{ background: "var(--moss)", borderRadius: 8, padding: "16px 24px", marginBottom: 32, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--sage)", animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: 12, color: "var(--cream)", fontWeight: 500 }}>Live</span>
          </div>
          <span style={{ fontSize: 13, color: "rgba(248,246,242,0.75)" }}>
            אין פעילות בזמן אמת כרגע — המערכת פעילה ומוכנה
          </span>
        </div>

        {/* Modules grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
          {[
            { title: "אולמות", sub: "ניהול חשבונות B2B", icon: <IconVenue />, count: "0 אולמות" },
            { title: "זוגות", sub: "ניהול חשבונות B2C", icon: <IconCouple />, count: "0 זוגות" },
            { title: "מנויים", sub: "מנויים וחיובים", icon: <IconSubscription />, count: "0 פעילים" },
            { title: "חשבוניות", sub: "חשבוניות ותשלומים", icon: <IconInvoice />, count: "0 ממתינות" },
            { title: "לידים", sub: "CRM ומכירות", icon: <IconLead />, count: "0 לידים" },
            { title: "הרשאות", sub: "גישת צוות HQ", icon: <IconAccess />, count: "0 גישות" },
          ].map((mod) => (
            <div key={mod.title} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "18px 20px", cursor: "pointer", transition: "all 0.15s" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 6, background: "var(--mist)", color: "var(--moss)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <div style={{ width: 16, height: 16 }}>{mod.icon}</div>
                </div>
                <div>
                  <div style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 16, color: "var(--moss)", fontWeight: 500 }}>{mod.title}</div>
                  <div style={{ fontSize: 11.5, color: "var(--muted)" }}>{mod.sub}</div>
                </div>
              </div>
              <div style={{ fontSize: 12, color: "var(--forest)", fontWeight: 500 }}>{mod.count}</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

/* ── Sub-components ── */
function NavSection({ label }: { label: string }) {
  return (
    <div style={{ fontSize: 10, color: "rgba(248, 246, 242, 0.35)", letterSpacing: "1.5px", textTransform: "uppercase", padding: "0 12px", margin: "20px 0 8px" }}>
      {label}
    </div>
  );
}

function HQNavItem({ icon, label, active = false }: { icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <a href="#" style={{
      padding: "10px 12px",
      color: active ? "var(--cream)" : "rgba(248, 246, 242, 0.65)",
      borderRadius: 4,
      display: "flex",
      alignItems: "center",
      gap: 11,
      fontSize: 13.5,
      marginBottom: 2,
      transition: "all 0.15s ease",
      background: active ? "rgba(168, 195, 176, 0.15)" : "transparent",
      borderRight: active ? "2px solid var(--sand)" : "2px solid transparent",
      textDecoration: "none",
    }}>
      <div style={{ width: 16, height: 16, flexShrink: 0 }}>{icon}</div>
      {label}
    </a>
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
function IconHome() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12 L12 4 L21 12 M5 10 V20 H19 V10" /></svg>; }
function IconVenue() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9 L12 3 L21 9 V20 H3 Z" /></svg>; }
function IconCouple() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="9" r="3" /><circle cx="16" cy="9" r="3" /></svg>; }
function IconSubscription() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="14" rx="2" /><path d="M2 10 H22" /></svg>; }
function IconInvoice() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2 H6 V22 H18 V8 L14 2 Z" /><path d="M14 2 V8 H18" /></svg>; }
function IconLead() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2 L15 8 L21 9 L17 14 L18 20 L12 17 L6 20 L7 14 L3 9 L9 8 Z" /></svg>; }
function IconChart() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 17 L9 11 L13 15 L21 7" /></svg>; }
function IconAccess() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11 V7 A5 5 0 0 1 17 7 V11" /></svg>; }
function IconSettings() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>; }
