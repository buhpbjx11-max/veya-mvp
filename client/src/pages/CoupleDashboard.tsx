import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { toast } from "sonner";

/* ── SVG Icons ── */
const VeyaLogo = () => (
  <svg width="26" height="26" viewBox="0 0 40 40" fill="none" stroke="#D9C5A1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 10 L20 30 L32 10" /><path d="M14 14 L20 22 L26 14" opacity="0.6" />
  </svg>
);
const IcoHome = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12 L12 4 L21 12 M5 10 V20 H19 V10" /></svg>;
const IcoGuests = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="9" r="3" /><circle cx="16" cy="9" r="3" /><path d="M3 21 C3 17 5 14 8 14 M21 21 C21 17 19 14 16 14" /></svg>;
const IcoTable = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8" cy="8" r="2" /><circle cx="16" cy="8" r="2" /><circle cx="8" cy="16" r="2" /><circle cx="16" cy="16" r="2" /></svg>;
const IcoBudget = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="14" rx="2" /><path d="M2 10 H22" /></svg>;
const IcoVendor = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7 L12 3 L21 7 V17 L12 21 L3 17 Z" /><path d="M3 7 L12 11 L21 7 M12 11 V21" /></svg>;
const IcoGift = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12" /><rect x="2" y="7" width="20" height="5" /><line x1="12" y1="22" x2="12" y2="7" /><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" /><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" /></svg>;
const IcoClock = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>;
const IcoPhoto = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>;
const IcoChat = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>;
const IcoVenue = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9 L12 3 L21 9 V20 H3 Z" /><rect x="9" y="14" width="6" height="6" /></svg>;
const IcoFamily = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="7" r="4" /><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" /><circle cx="17" cy="9" r="3" /><path d="M21 21v-2a3 3 0 0 0-3-3" /></svg>;
const IcoHeart = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>;
const IcoLogout = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>;
const IcoLink = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>;
const IcoSend = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>;

const CARD_STYLE = {
  background: "#fff",
  border: "1px solid #EFEDE7",
  borderRadius: 18,
  boxShadow: "0 1px 2px rgba(45,45,45,.04), 0 8px 24px rgba(63,72,66,.06)",
};

export default function CoupleDashboard() {
  const { user, logout } = useAuth({ redirectOnUnauthenticated: true });
  const [, navigate] = useLocation();
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMsg, setChatMsg] = useState("");

  const { data: couple, isLoading } = trpc.couple.me.useQuery(undefined, { enabled: !!user });

  const isVenueLinked = couple?.type === "venue_linked";

  // Venue info — only for venue_linked
  const { data: venueInfo } = trpc.venue.getById.useQuery(
    { id: couple?.venueId ?? 0 },
    { enabled: isVenueLinked && !!couple?.venueId }
  );

  // Wedding for this couple (to get weddingId for chat)
  const { data: weddingForCouple } = trpc.wedding.forCouple.useQuery(
    undefined,
    { enabled: isVenueLinked }
  );

  // Messages
  const { data: chatMessages, refetch: refetchMessages } = trpc.message.list.useQuery(
    { weddingId: weddingForCouple?.id ?? 0 },
    { enabled: chatOpen && isVenueLinked && !!weddingForCouple?.id }
  );

  const sendMessage = trpc.message.send.useMutation({
    onSuccess: () => {
      setChatMsg("");
      refetchMessages();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleSendMsg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMsg.trim() || !weddingForCouple?.id) return;
    sendMessage.mutate({ weddingId: weddingForCouple.id, content: chatMsg.trim() });
  };

  if (isLoading || !user) return <CoupleSkeleton />;

  const name1 = couple?.name1 ?? "שם 1";
  const name2 = couple?.name2 ?? "שם 2";
  const weddingDate = couple?.weddingDate ? new Date(couple.weddingDate) : null;
  const daysLeft = weddingDate
    ? Math.max(0, Math.ceil((weddingDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  const navItems = [
    { label: "דשבורד", icon: <IcoHome />, active: true, href: "/couple/dashboard" },
    { label: "אורחים", icon: <IcoGuests />, href: "/couple/guests" },
    { label: "שולחנות", icon: <IcoTable />, href: "/couple/seating" },
    { label: "תקציב", icon: <IcoBudget />, href: "/couple/budget" },
    { label: "ספקים", icon: <IcoVendor />, href: "/couple/vendors" },
    { label: "מתנות", icon: <IcoGift />, href: "/couple/gifts" },
    { label: "לוח זמנים", icon: <IcoClock />, href: "/couple/timeline" },
    { label: "תמונות", icon: <IcoPhoto />, href: "/couple/photos" },
  ];

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", minHeight: "100vh" }} dir="rtl">
        {/* ── Sidebar ── */}
        <aside style={{ background: "#3F4842", padding: "28px 18px", display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh", overflowY: "auto" }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <VeyaLogo />
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: "#F8F6F2", letterSpacing: 6 }}>VEYA</span>
          </div>

          {/* Couple banner */}
          <div style={{ background: "rgba(217,197,161,.12)", border: "1px solid rgba(217,197,161,.2)", borderRadius: 6, padding: "14px 12px", marginBottom: 20 }}>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: 11, color: "rgba(248,246,242,.55)", letterSpacing: 1, marginBottom: 4 }}>
              החתונה שלנו
            </div>
            <div style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 17, color: "#F8F6F2", fontWeight: 500, lineHeight: 1.2 }}>
              {name1} <span style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", color: "#D9C5A1" }}>&</span> {name2}
            </div>
            {weddingDate && (
              <div style={{ fontSize: 11.5, color: "rgba(248,246,242,.6)", marginTop: 4 }}>
                {weddingDate.toLocaleDateString("he-IL")} · בעוד {daysLeft} ימים
              </div>
            )}
            {/* Venue badge — only for venue_linked */}
            {isVenueLinked && venueInfo && (
              <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid rgba(217,197,161,.2)", fontSize: 11, color: "#D9C5A1", display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 11, height: 11 }}><IcoVenue /></span>
                {venueInfo.name}
              </div>
            )}
          </div>

          {/* Nav */}
          <div style={{ fontSize: 10, color: "rgba(248,246,242,.45)", letterSpacing: "1.5px", textTransform: "uppercase", padding: "0 12px", marginBottom: 8 }}>החתונה</div>
          {navItems.map((item) => (
            <div
              key={item.label}
              onClick={() => item.href ? navigate(item.href) : toast.info(`${item.label} — בקרוב`)}
              style={{
                padding: "10px 12px", color: item.active ? "#F8F6F2" : "rgba(248,246,242,.65)",
                borderRadius: 4, display: "flex", alignItems: "center", gap: 11, fontSize: 13.5, marginBottom: 2,
                cursor: "pointer", background: item.active ? "rgba(168,195,176,.18)" : "transparent",
                borderRight: item.active ? "2px solid #D9C5A1" : "2px solid transparent", transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { if (!item.active) e.currentTarget.style.background = "rgba(168,195,176,.1)"; }}
              onMouseLeave={(e) => { if (!item.active) e.currentTarget.style.background = "transparent"; }}
            >
              <span style={{ width: 16, height: 16, flexShrink: 0 }}>{item.icon}</span>
              {item.label}
              {!item.href && <span style={{ marginRight: "auto", fontSize: 10, color: "rgba(248,246,242,.35)", background: "rgba(255,255,255,.08)", borderRadius: 9999, padding: "1px 6px" }}>בקרוב</span>}
            </div>
          ))}

          {/* Venue-linked extras */}
          {isVenueLinked && (
            <>
              <div style={{ fontSize: 10, color: "rgba(248,246,242,.45)", letterSpacing: "1.5px", textTransform: "uppercase", padding: "12px 12px 8px", marginTop: 4 }}>האולם</div>
              <div
                onClick={() => setChatOpen(true)}
                style={{ padding: "10px 12px", color: "rgba(248,246,242,.65)", borderRadius: 4, display: "flex", alignItems: "center", gap: 11, fontSize: 13.5, marginBottom: 2, cursor: "pointer", transition: "all 0.15s" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(168,195,176,.1)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <span style={{ width: 16, height: 16, flexShrink: 0 }}><IcoChat /></span>
                צ'אט עם האולם
              </div>
              <div
                onClick={() => toast.info("דוחות — בקרוב")}
                style={{ padding: "10px 12px", color: "rgba(248,246,242,.65)", borderRadius: 4, display: "flex", alignItems: "center", gap: 11, fontSize: 13.5, marginBottom: 2, cursor: "pointer", transition: "all 0.15s" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(168,195,176,.1)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <span style={{ width: 16, height: 16, flexShrink: 0 }}><IcoVenue /></span>
                דוחות האולם
              </div>
            </>
          )}

          {/* Family + Venue Share */}
          <div style={{ fontSize: 10, color: "rgba(248,246,242,.45)", letterSpacing: "1.5px", textTransform: "uppercase", padding: "12px 12px 8px", marginTop: 4 }}>שיתוף</div>
          <div
            onClick={() => navigate("/couple/family-access")}
            style={{ padding: "10px 12px", color: "rgba(248,246,242,.65)", borderRadius: 4, display: "flex", alignItems: "center", gap: 11, fontSize: 13.5, marginBottom: 2, cursor: "pointer", transition: "all 0.15s" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(168,195,176,.1)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <span style={{ width: 16, height: 16 }}><IcoFamily /></span>
            שיתוף עם המשפחה
          </div>
          {/* Venue Share — only for independent couples */}
          {!isVenueLinked && (
            <div
              onClick={() => navigate("/couple/venue-share")}
              style={{ padding: "10px 12px", color: "rgba(248,246,242,.65)", borderRadius: 4, display: "flex", alignItems: "center", gap: 11, fontSize: 13.5, marginBottom: 2, cursor: "pointer" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(168,195,176,.1)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <span style={{ width: 16, height: 16 }}><IcoLink /></span>
              שיתוף עם האולם
            </div>
          )}
          <div onClick={() => toast.info("תודות — בקרוב")} style={{ padding: "10px 12px", color: "rgba(248,246,242,.65)", borderRadius: 4, display: "flex", alignItems: "center", gap: 11, fontSize: 13.5, marginBottom: 2, cursor: "pointer" }}>
            <span style={{ width: 16, height: 16 }}><IcoHeart /></span>
            תודות אחרי החתונה
          </div>

          {/* Profile */}
          <div style={{ marginTop: "auto", paddingTop: 16, borderTop: "1px solid rgba(248,246,242,.1)", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#D9C5A1", color: "#3F4842", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, flexShrink: 0 }}>
              {name1.charAt(0)}{name2.charAt(0)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, color: "#F8F6F2", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name1} & {name2}</div>
              <div style={{ fontSize: 11, color: "rgba(248,246,242,.5)" }}>{isVenueLinked ? "מחוברים לאולם" : "עצמאי"}</div>
            </div>
            <button onClick={handleLogout} title="יציאה" style={{ background: "transparent", border: "none", color: "rgba(248,246,242,.5)", cursor: "pointer", padding: 4, width: 18, height: 18 }}>
              <IcoLogout />
            </button>
          </div>
        </aside>

        {/* ── Main ── */}
        <main style={{ background: "#F8F6F2", padding: "36px 44px 60px", overflowX: "hidden" }}>
          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: 13, color: "#8B8B85", letterSpacing: 1.5, marginBottom: 4 }}>• הדשבורד שלנו</div>
            <h1 style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 32, color: "#3F4842", fontWeight: 400, lineHeight: 1.2, marginBottom: 6 }}>
              {name1} <span style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", color: "#D9C5A1" }}>&</span> {name2}
            </h1>
            <p style={{ fontSize: 14, color: "#5D6861" }}>
              {weddingDate
                ? <>החתונה שלכם בעוד <strong>{daysLeft} ימים</strong> · {weddingDate.toLocaleDateString("he-IL")}</>
                : "קבעו תאריך חתונה כדי לראות ספירה לאחור"}
            </p>
          </div>

          {/* ── Venue-linked banner ── */}
          {isVenueLinked && venueInfo && (
            <div style={{ ...CARD_STYLE, padding: "18px 24px", marginBottom: 24, display: "flex", alignItems: "center", gap: 16, background: "#DDEAE0", border: "1px solid #A8C3B0" }}>
              <div style={{ width: 40, height: 40, borderRadius: 8, background: "#3F4842", color: "#D9C5A1", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ width: 20, height: 20 }}><IcoVenue /></span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 16, color: "#3F4842", fontWeight: 500, marginBottom: 2 }}>
                  מחוברים ל{venueInfo.name}
                </div>
                <div style={{ fontSize: 12.5, color: "#5D6861" }}>
                  חלק מהנתונים מסונכרנים אוטומטית עם האולם
                  {venueInfo.phone && ` · ${venueInfo.phone}`}
                </div>
              </div>
              <button
                onClick={() => setChatOpen(true)}
                style={{ background: "#3F4842", color: "#F8F6F2", border: "none", borderRadius: 9999, padding: "9px 18px", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 7, flexShrink: 0 }}
              >
                <span style={{ width: 14, height: 14 }}><IcoChat /></span>
                צ'אט עם האולם
              </button>
            </div>
          )}

          {/* ── Independent banner (no venue) ── */}
          {!isVenueLinked && (
            <div style={{ ...CARD_STYLE, padding: "18px 24px", marginBottom: 24, display: "flex", alignItems: "center", gap: 16, background: "#FFF9F0", border: "1px solid #E8D9B8" }}>
              <div style={{ width: 40, height: 40, borderRadius: 8, background: "#D9C5A1", color: "#3F4842", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ width: 20, height: 20 }}><IcoLink /></span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 16, color: "#3F4842", fontWeight: 500, marginBottom: 2 }}>
                  אין אולם מקושר
                </div>
                <div style={{ fontSize: 12.5, color: "#5D6861" }}>
                  אתם מנהלים את החתונה באופן עצמאי. אם האולם שלכם משתמש ב-VEYA, בקשו מהם לשלוח לכם קישור.
                </div>
              </div>
              <button
                onClick={() => toast.info("בקשו מהאולם לשלוח לכם קישור VEYA")}
                style={{ background: "transparent", color: "#3F4842", border: "1px solid #D9C5A1", borderRadius: 9999, padding: "9px 18px", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}
              >
                קישור לאולם
              </button>
            </div>
          )}

          {/* Countdown hero */}
          {daysLeft !== null && (
            <div style={{ ...CARD_STYLE, background: "#3F4842", border: "none", padding: "32px 36px", marginBottom: 24, position: "relative", overflow: "hidden" }}>
              {/* Botanical decoration */}
              <svg style={{ position: "absolute", bottom: 0, left: 0, opacity: 0.08 }} width="200" height="120" viewBox="0 0 200 120" fill="none">
                <path d="M10 110 Q80 60 190 15" stroke="#A8C3B0" strokeWidth="2" fill="none" />
                <ellipse cx="35" cy="90" rx="15" ry="7" fill="#A8C3B0" transform="rotate(-30 35 90)" />
                <ellipse cx="75" cy="65" rx="13" ry="6" fill="#A8C3B0" transform="rotate(-25 75 65)" />
                <ellipse cx="120" cy="42" rx="12" ry="5.5" fill="#A8C3B0" transform="rotate(-20 120 42)" />
              </svg>
              <div style={{ position: "relative", zIndex: 2 }}>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: 13, color: "rgba(248,246,242,.55)", letterSpacing: 1.5, marginBottom: 16 }}>ספירה לאחור</div>
                <div style={{ display: "flex", gap: 28, marginBottom: 24, flexWrap: "wrap" }}>
                  {[
                    { value: Math.floor(daysLeft / 30), label: "חודשים" },
                    { value: daysLeft % 30, label: "ימים" },
                    { value: new Date().getHours(), label: "שעות" },
                  ].map((block) => (
                    <div key={block.label} style={{ textAlign: "center" }}>
                      <div style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 52, color: "#F8F6F2", fontWeight: 400, lineHeight: 1 }}>
                        {String(block.value).padStart(2, "0")}
                      </div>
                      <div style={{ fontSize: 11, color: "rgba(248,246,242,.5)", letterSpacing: "1px", textTransform: "uppercase", marginTop: 6 }}>
                        {block.label}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button
                    onClick={() => toast.info("אורחים — בקרוב")}
                    style={{ background: "#D9C5A1", color: "#3F4842", border: "none", borderRadius: 9999, padding: "11px 22px", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}
                  >
                    הוסיפו אורחים
                  </button>
                  {isVenueLinked && (
                    <button
                      onClick={() => setChatOpen(true)}
                      style={{ background: "transparent", color: "#F8F6F2", border: "1px solid rgba(248,246,242,.3)", borderRadius: 9999, padding: "10px 18px", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}
                    >
                      צ'אט עם האולם
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tools grid */}
          <div style={{ ...CARD_STYLE, padding: "24px 28px" }}>
            <h2 style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 22, color: "#3F4842", fontWeight: 500, marginBottom: 4 }}>הכלים שלנו</h2>
            <p style={{ fontSize: 13, color: "#8B8B85", marginBottom: 20 }}>כל מה שצריך לחתונה מושלמת</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 12 }}>
              {[
                { label: "אורחים", sub: "ניהול רשימת האורחים", icon: <IcoGuests />, progress: 0 },
                { label: "שולחנות", sub: "סידור ישיבה", icon: <IcoTable />, progress: 0 },
                { label: "תקציב", sub: "מעקב הוצאות", icon: <IcoBudget />, progress: 0 },
                { label: "ספקים", sub: "צוות ונותני שירות", icon: <IcoVendor />, progress: 0 },
                { label: "קופת מתנות", sub: "מעקב מתנות", icon: <IcoGift />, progress: 0 },
                { label: "תמונות", sub: "גלריית החתונה", icon: <IcoPhoto />, progress: 0 },
              ].map((tool) => (
                <div
                  key={tool.label}
                  onClick={() => toast.info(`${tool.label} — בקרוב`)}
                  style={{ border: "1px solid #EFEDE7", borderRadius: 12, padding: "16px 18px", cursor: "pointer", transition: "all 0.15s", background: "#FAFAF8" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "#A8C3B0"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "#EFEDE7"; }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 6, background: "#DDEAE0", color: "#3F4842", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <div style={{ width: 14, height: 14 }}>{tool.icon}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 13.5, color: "#3F4842", fontWeight: 500 }}>{tool.label}</div>
                      <div style={{ fontSize: 11, color: "#8B8B85" }}>{tool.sub}</div>
                    </div>
                  </div>
                  <div style={{ height: 3, background: "#EFEDE7", borderRadius: 2 }}>
                    <div style={{ height: "100%", width: `${tool.progress}%`, background: "#A8C3B0", borderRadius: 2 }} />
                  </div>
                  <div style={{ fontSize: 10.5, color: "#8B8B85", marginTop: 5 }}>בקרוב</div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>

      {/* ── Chat Drawer (venue_linked only) ── */}
      {chatOpen && isVenueLinked && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "flex-end", justifyContent: "flex-start" }}
          onClick={(e) => { if (e.target === e.currentTarget) setChatOpen(false); }}
        >
          <div style={{ width: 380, height: "70vh", background: "#fff", borderRadius: "18px 18px 0 0", boxShadow: "0 -4px 40px rgba(63,72,66,.15)", display: "flex", flexDirection: "column", margin: "0 0 0 240px" }} dir="rtl">
            {/* Chat header */}
            <div style={{ padding: "18px 20px", borderBottom: "1px solid #EFEDE7", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 17, color: "#3F4842", fontWeight: 500 }}>
                  צ'אט עם {venueInfo?.name ?? "האולם"}
                </div>
                <div style={{ fontSize: 11.5, color: "#8B8B85" }}>הודעות ישירות</div>
              </div>
              <button onClick={() => setChatOpen(false)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#8B8B85", fontSize: 18, padding: 4 }}>✕</button>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
              {!chatMessages || chatMessages.length === 0 ? (
                <div style={{ textAlign: "center", color: "#8B8B85", fontSize: 13, marginTop: 40 }}>
                  <div style={{ marginBottom: 8, opacity: 0.5 }}>
                    <span style={{ width: 32, height: 32, display: "inline-block" }}><IcoChat /></span>
                  </div>
                  אין הודעות עדיין — שלחו הודעה ראשונה!
                </div>
              ) : (
                chatMessages.map((msg) => {
                  // couple is the current user — compare senderId
                  const isMe = msg.senderId === user?.id;
                  return (
                    <div key={msg.id} style={{ display: "flex", justifyContent: isMe ? "flex-start" : "flex-end" }}>
                      <div style={{
                        maxWidth: "75%", padding: "10px 14px", borderRadius: isMe ? "4px 18px 18px 18px" : "18px 4px 18px 18px",
                        background: isMe ? "#DDEAE0" : "#3F4842", color: isMe ? "#3F4842" : "#F8F6F2",
                        fontSize: 13.5, lineHeight: 1.5,
                      }}>
                        {msg.content}
                        <div style={{ fontSize: 10.5, opacity: 0.55, marginTop: 4 }}>
                          {new Date(msg.createdAt).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Input */}
            <form onSubmit={handleSendMsg} style={{ padding: "12px 16px", borderTop: "1px solid #EFEDE7", display: "flex", gap: 10 }}>
              <input
                value={chatMsg}
                onChange={(e) => setChatMsg(e.target.value)}
                placeholder="כתבו הודעה..."
                style={{ flex: 1, border: "1px solid #EFEDE7", borderRadius: 9999, padding: "10px 16px", fontSize: 13.5, fontFamily: "inherit", outline: "none", background: "#F8F6F2", color: "#3F4842" }}
              />
              <button
                type="submit"
                disabled={!chatMsg.trim() || sendMessage.isPending}
                style={{ background: "#3F4842", color: "#F8F6F2", border: "none", borderRadius: 9999, width: 40, height: 40, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, opacity: !chatMsg.trim() ? 0.5 : 1 }}
              >
                <span style={{ width: 16, height: 16 }}><IcoSend /></span>
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

/* ── Skeleton ── */
function CoupleSkeleton() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", minHeight: "100vh" }}>
      <div style={{ background: "#3F4842" }} />
      <div style={{ background: "#F8F6F2", padding: "36px 44px", display: "flex", flexDirection: "column", gap: 16 }}>
        {[200, 120, 80].map((h) => (
          <div key={h} style={{ height: h, background: "#EFEDE7", borderRadius: 18 }} />
        ))}
      </div>
    </div>
  );
}
