import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";

/**
 * VEYA Couple Dashboard — exact prototype match (couple_dashboard.html)
 * Moss sidebar with couple banner + countdown hero + tools grid
 */
export default function CoupleDashboard() {
  const { user, logout } = useAuth({ redirectOnUnauthenticated: true });
  const [, navigate] = useLocation();
  const { data: couple, isLoading } = trpc.couple.me.useQuery(undefined, { enabled: !!user });

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  if (isLoading || !user) {
    return <CoupleSkeleton />;
  }

  const name1 = couple?.name1 ?? "שם 1";
  const name2 = couple?.name2 ?? "שם 2";
  const weddingDate = couple?.weddingDate ? new Date(couple.weddingDate) : null;
  const daysLeft = weddingDate
    ? Math.max(0, Math.ceil((weddingDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;
  const isVenueLinked = couple?.type === "venue_linked";

  return (
    <div className="veya-app-shell">
      {/* ── Sidebar ── */}
      <aside className="veya-sidebar" style={{ position: "relative" }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, padding: "0 6px" }}>
          <VeyaLogoSvg size={26} color="var(--sand)" />
          <span className="veya-wordmark">VEYA</span>
        </div>

        {/* Couple banner */}
        <div style={{
          background: "rgba(216, 197, 161, 0.12)",
          border: "1px solid rgba(216, 197, 161, 0.2)",
          borderRadius: 6,
          padding: "14px 12px",
          marginBottom: 20,
        }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: 11, color: "rgba(248, 246, 242, 0.55)", letterSpacing: 1, marginBottom: 4 }}>
            החתונה שלנו
          </div>
          <div style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 17, color: "var(--cream)", fontWeight: 500, lineHeight: 1.2 }}>
            {name1}{" "}
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", color: "var(--sand)" }}>&amp;</span>
            {" "}{name2}
          </div>
          {weddingDate && (
            <div style={{ fontSize: 11.5, color: "rgba(248, 246, 242, 0.6)", marginTop: 4 }}>
              {weddingDate.toLocaleDateString("he-IL")} · בעוד {daysLeft} ימים
            </div>
          )}
        </div>

        {/* Nav */}
        <div className="veya-nav-section" style={{ marginTop: 0 }}>המסך שלי</div>
        <NavItem icon={<IconHome />} label="דשבורד" active />

        <div className="veya-nav-section">החתונה</div>
        <NavItem icon={<IconGuests />} label="אורחים" />
        <NavItem icon={<IconTable />} label="שולחנות" />
        <NavItem icon={<IconBudget />} label="תקציב" />
        <NavItem icon={<IconVendor />} label="ספקים" />
        <NavItem icon={<IconGift />} label="קופת מתנות" />
        <NavItem icon={<IconClock />} label="לוח זמנים" />
        <NavItem icon={<IconEnvelope />} label="הזמנה" />
        <NavItem icon={<IconPhoto />} label="תמונות" />

        <div className="veya-nav-section">משפחה ואחרי</div>
        <NavItem icon={<IconFamily />} label="שיתוף עם המשפחה" />
        <NavItem icon={<IconHeart />} label="תודות אחרי החתונה" />

        {/* Botanical */}
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
            <div className="veya-avatar">{name1.slice(0, 1)}{name2.slice(0, 1)}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, color: "var(--cream)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {name1} &amp; {name2}
              </div>
              <div style={{ fontSize: 11, color: "rgba(248, 246, 242, 0.5)" }}>
                {isVenueLinked ? "מחובר לאולם" : "עצמאי"}
              </div>
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
            <div className="veya-page-eyebrow">הדשבורד שלנו</div>
            <h1 style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 32, color: "var(--moss)", fontWeight: 400, lineHeight: 1.2, marginBottom: 6 }}>
              {name1}{" "}
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", color: "var(--sand)" }}>&amp;</span>
              {" "}{name2}
            </h1>
            <p className="veya-page-subtitle">
              {weddingDate
                ? <>החתונה שלכם בעוד <strong>{daysLeft} ימים</strong> · {weddingDate.toLocaleDateString("he-IL")}</>
                : "קבעו תאריך חתונה כדי לראות ספירה לאחור"}
            </p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="veya-btn-secondary" style={{ fontSize: 13 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 20 C4 16 7 14 12 14 C17 14 20 16 20 20" /></svg>
              הגדרות
            </button>
          </div>
        </div>

        {/* Countdown hero */}
        {daysLeft !== null && (
          <div className="veya-hero-card" style={{ marginBottom: 32 }}>
            <div style={{ position: "relative", zIndex: 2 }}>
              <div className="veya-eyebrow">ספירה לאחור</div>
              <div style={{ display: "flex", gap: 24, marginBottom: 20, flexWrap: "wrap" }}>
                {[
                  { value: Math.floor(daysLeft / 30), label: "חודשים" },
                  { value: daysLeft % 30, label: "ימים" },
                  { value: new Date().getHours(), label: "שעות" },
                ].map((block) => (
                  <div key={block.label} style={{ textAlign: "center" }}>
                    <div style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 48, color: "var(--cream)", fontWeight: 400, lineHeight: 1 }}>
                      {String(block.value).padStart(2, "0")}
                    </div>
                    <div style={{ fontSize: 11, color: "rgba(248, 246, 242, 0.55)", letterSpacing: "1px", textTransform: "uppercase", marginTop: 6 }}>
                      {block.label}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button style={{ background: "var(--sand)", color: "var(--moss)", border: "none", borderRadius: 4, padding: "11px 22px", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>
                  הוסיפו אורחים
                </button>
                {isVenueLinked && (
                  <button style={{ background: "transparent", color: "var(--cream)", border: "1px solid rgba(248,246,242,0.3)", borderRadius: 4, padding: "10px 18px", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>
                    צ'אט עם האולם
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tools grid */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <h2 className="veya-section-title">הכלים שלנו</h2>
              <div className="veya-section-sub">כל מה שצריך לחתונה מושלמת</div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
            {[
              { label: "אורחים", sub: "ניהול רשימת האורחים", icon: <IconGuests />, progress: 72 },
              { label: "שולחנות", sub: "סידור ישיבה", icon: <IconTable />, progress: 45 },
              { label: "תקציב", sub: "מעקב הוצאות", icon: <IconBudget />, progress: 60 },
              { label: "ספקים", sub: "צוות ונותני שירות", icon: <IconVendor />, progress: 30 },
              { label: "קופת מתנות", sub: "מעקב מתנות", icon: <IconGift />, progress: 0 },
              { label: "לוח זמנים", sub: "תכנון יום החתונה", icon: <IconClock />, progress: 20 },
            ].map((tool) => (
              <ToolCard key={tool.label} {...tool} />
            ))}
          </div>
        </div>

        {/* Venue linked notice */}
        {isVenueLinked && (
          <div style={{ background: "var(--mist)", border: "1px solid var(--sage)", borderRadius: 6, padding: "14px 18px", display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div style={{ width: 28, height: 28, borderRadius: 4, background: "var(--sage)", color: "var(--moss)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9 L12 3 L21 9 V20 H3 Z" />
              </svg>
            </div>
            <div style={{ fontSize: 12.5, color: "var(--forest)", lineHeight: 1.6 }}>
              <strong style={{ color: "var(--moss)" }}>מחוברים לאולם</strong> — חלק מהנתונים מסונכרנים אוטומטית עם האולם שלכם.
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

/* ── Tool Card ── */
function ToolCard({ label, sub, icon, progress }: { label: string; sub: string; icon: React.ReactNode; progress: number }) {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "16px 18px", cursor: "pointer", transition: "all 0.15s" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 4, background: "var(--mist)", color: "var(--moss)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <div style={{ width: 14, height: 14 }}>{icon}</div>
        </div>
        <div>
          <div style={{ fontSize: 13.5, color: "var(--moss)", fontWeight: 500 }}>{label}</div>
          <div style={{ fontSize: 11, color: "var(--muted)" }}>{sub}</div>
        </div>
      </div>
      <div style={{ height: 3, background: "var(--border)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${progress}%`, background: progress > 0 ? "var(--sage)" : "transparent", borderRadius: 2 }} />
      </div>
      <div style={{ fontSize: 10.5, color: "var(--muted)", marginTop: 5 }}>{progress}% הושלם</div>
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
function CoupleSkeleton() {
  return (
    <div className="veya-app-shell">
      <aside className="veya-sidebar" />
      <main className="veya-main">
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {[200, 120, 80].map((w) => (
            <div key={w} style={{ height: w, background: "var(--whisper)", borderRadius: 8 }} />
          ))}
        </div>
      </main>
    </div>
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
function IconGuests() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="9" r="3" /><circle cx="16" cy="9" r="3" /><path d="M3 21 C3 17 5 14 8 14 M21 21 C21 17 19 14 16 14" /></svg>; }
function IconTable() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8" cy="8" r="2" /><circle cx="16" cy="8" r="2" /><circle cx="8" cy="16" r="2" /><circle cx="16" cy="16" r="2" /></svg>; }
function IconBudget() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="14" rx="2" /><path d="M2 10 H22" /></svg>; }
function IconVendor() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7 L12 3 L21 7 V17 L12 21 L3 17 Z" /><path d="M3 7 L12 11 L21 7 M12 11 V21" /></svg>; }
function IconGift() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="8" width="18" height="13" rx="1" /><path d="M3 12 H21 M12 8 V21" /><path d="M12 8 C12 5 14 4 16 6 C18 8 16 10 12 8" /><path d="M12 8 C12 5 10 4 8 6 C6 8 8 10 12 8" /></svg>; }
function IconClock() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7 V12 L15 14" /></svg>; }
function IconEnvelope() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7 L12 13 L21 7" /></svg>; }
function IconPhoto() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="12" cy="12" r="3" /></svg>; }
function IconFamily() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="8" r="3" /><circle cx="16" cy="9" r="2" /><path d="M3 21 C3 17 5 14 9 14 M21 21 C21 18 19 16 16 16" /></svg>; }
function IconHeart() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21 L4 13 A5 5 0 0 1 12 6 A5 5 0 0 1 20 13 Z" /></svg>; }
