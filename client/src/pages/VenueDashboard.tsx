import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import CreateWeddingModal from "@/components/CreateWeddingModal";
import InviteLinkModal from "@/components/InviteLinkModal";

/* ── SVG Icons ── */
const IcoWedding = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" /><path d="M8 12l3 3 5-5" /></svg>;
const IcoGuests = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="7" r="4" /><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" /><path d="M16 3.13a4 4 0 0 1 0 7.75M21 21v-2a4 4 0 0 0-3-3.87" /></svg>;
const IcoMsg = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>;
const IcoPlus = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>;
const IcoChef = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6z" /><line x1="6" y1="17" x2="18" y2="17" /></svg>;
const IcoSettings = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>;
const IcoLogout = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>;
const IcoCalendar = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>;
const IcoVendors = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>;
const IcoLink = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>;

const CARD_STYLE = {
  background: "#fff",
  border: "1px solid #EFEDE7",
  borderRadius: 18,
  boxShadow: "0 1px 2px rgba(45,45,45,.04), 0 8px 24px rgba(63,72,66,.06)",
};

const STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  prep: { bg: "#EEF4FF", color: "#3B5BDB", label: "בהכנה" },
  active: { bg: "#DDEAE0", color: "#2F6B3E", label: "יום החתונה" },
  done: { bg: "#F5F5F5", color: "#6B7280", label: "הסתיים" },
};

export default function VenueDashboard() {
  const { user, logout } = useAuth({ redirectOnUnauthenticated: true });
  const { data: venue, isLoading: loadingVenue } = trpc.venue.me.useQuery(undefined, { enabled: !!user });
  const { data: weddingList, isLoading: loadingWeddings } = trpc.wedding.list.useQuery(undefined, { enabled: !!user });

  const [showCreate, setShowCreate] = useState(false);
  const [inviteModal, setInviteModal] = useState<{ url: string; names: string } | null>(null);

  const handleLogout = async () => { await logout(); window.location.href = "/login"; };

  const navItems = [
    { label: "לוח בקרה", icon: <IcoWedding />, active: true },
    { label: "חתונות", icon: <IcoCalendar /> },
    { label: "אורחים", icon: <IcoGuests /> },
    { label: "ספקים", icon: <IcoVendors /> },
    { label: "דוח שף", icon: <IcoChef /> },
    { label: "הודעות", icon: <IcoMsg /> },
    { label: "הגדרות", icon: <IcoSettings /> },
  ];

  if (loadingVenue) {
    return (
      <div style={{ minHeight: "100vh", background: "#F8F6F2", padding: 24 }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  const activeWeddings = weddingList?.filter(w => w.status !== "done") ?? [];
  const linkedWeddings = weddingList?.filter(w => w.coupleId !== null) ?? [];

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", minHeight: "100vh" }} dir="rtl">
        {/* ── Sidebar ── */}
        <aside style={{ background: "#3F4842", padding: "28px 18px", display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh", overflowY: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 36 }}>
            <svg width="24" height="24" viewBox="0 0 40 40" fill="none" stroke="#D9C5A1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 10 L20 30 L32 10" /><path d="M14 14 L20 22 L26 14" opacity="0.6" />
            </svg>
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: "#F8F6F2", letterSpacing: 6 }}>VEYA</span>
          </div>

          <nav style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: "rgba(248,246,242,.45)", letterSpacing: "1.5px", textTransform: "uppercase", padding: "0 12px", marginBottom: 8 }}>ניהול</div>
            {navItems.map((item) => (
              <div
                key={item.label}
                onClick={() => !item.active && toast.info(`${item.label} — בקרוב`)}
                style={{
                  padding: "10px 12px", color: item.active ? "#F8F6F2" : "rgba(248,246,242,.65)",
                  borderRadius: 4, display: "flex", alignItems: "center", gap: 11, fontSize: 13.5, marginBottom: 2,
                  cursor: "pointer", background: item.active ? "rgba(168,195,176,.18)" : "transparent",
                  borderRight: item.active ? "2px solid #D9C5A1" : "2px solid transparent", transition: "all 0.15s",
                }}
              >
                <span style={{ width: 16, height: 16, flexShrink: 0 }}>{item.icon}</span>
                {item.label}
              </div>
            ))}
          </nav>

          <div style={{ borderTop: "1px solid rgba(248,246,242,.1)", paddingTop: 16, display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#D9C5A1", color: "#3F4842", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, flexShrink: 0 }}>
              {(venue?.name || user?.name || "A").charAt(0)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, color: "#F8F6F2", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{venue?.name || user?.name}</div>
              <div style={{ fontSize: 11, color: "rgba(248,246,242,.5)" }}>
                {venue?.subStatus === "trial" ? "ניסיון חינם" : "אולם פעיל"}
              </div>
            </div>
            <button onClick={handleLogout} title="יציאה" style={{ background: "transparent", border: "none", color: "rgba(248,246,242,.5)", cursor: "pointer", padding: 4, width: 18, height: 18 }}>
              <IcoLogout />
            </button>
          </div>
        </aside>

        {/* ── Main ── */}
        <main style={{ background: "#F8F6F2", padding: "36px 44px 60px", overflowX: "hidden" }}>
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: 13, color: "#8B8B85", letterSpacing: 1.5, marginBottom: 4 }}>• Dashboard</div>
            <h1 style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 32, color: "#3F4842", fontWeight: 400, marginBottom: 4 }}>
              שלום, {venue?.name || user?.name}
            </h1>
            <p style={{ fontSize: 14, color: "#5D6861" }}>
              {venue?.subStatus === "trial"
                ? `ניסיון חינם — ${venue?.trialEndsAt ? `עד ${new Date(venue.trialEndsAt).toLocaleDateString("he-IL")}` : "14 יום"}`
                : "חשבון פעיל"}
            </p>
          </div>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
            {[
              { label: "חתונות פעילות", value: String(activeWeddings.length), icon: <IcoWedding /> },
              { label: "זוגות מקושרים", value: String(linkedWeddings.length), icon: <IcoGuests /> },
              { label: "הודעות חדשות", value: "0", icon: <IcoMsg /> },
            ].map((stat, i) => (
              <div key={i} style={{ ...CARD_STYLE, padding: "18px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#8B8B85", letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: 10 }}>
                  <span style={{ width: 13, height: 13, opacity: 0.6 }}>{stat.icon}</span>
                  {stat.label}
                </div>
                <div style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 32, color: "#3F4842", fontWeight: 400, lineHeight: 1 }}>{stat.value}</div>
              </div>
            ))}
          </div>

          {/* Quick actions */}
          <div style={{ ...CARD_STYLE, padding: "24px 28px", marginBottom: 24 }}>
            <h2 style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 22, color: "#3F4842", fontWeight: 500, marginBottom: 16 }}>פעולות מהירות</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              {[
                { label: "חתונה חדשה", icon: <IcoPlus />, action: () => setShowCreate(true) },
                { label: "ניהול אורחים", icon: <IcoGuests />, action: () => toast.info("בקרוב — שלב 5") },
                { label: "דוח שף", icon: <IcoChef />, action: () => toast.info("בקרוב — שלב 5") },
                { label: "הגדרות", icon: <IcoSettings />, action: () => toast.info("בקרוב") },
              ].map((item, i) => (
                <button
                  key={i}
                  onClick={item.action}
                  style={{ padding: "16px 12px", border: "1px solid #EFEDE7", borderRadius: 12, background: "#fff", cursor: "pointer", textAlign: "center", transition: "all 0.15s", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, fontFamily: "inherit" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#3F4842"; (e.currentTarget as HTMLButtonElement).style.background = "#DDEAE0"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#EFEDE7"; (e.currentTarget as HTMLButtonElement).style.background = "#fff"; }}
                >
                  <span style={{ width: 22, height: 22, color: "#3F4842" }}>{item.icon}</span>
                  <span style={{ fontSize: 12.5, fontWeight: 500, color: "#3F4842" }}>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Wedding list */}
          <div style={{ ...CARD_STYLE, padding: "24px 28px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 22, color: "#3F4842", fontWeight: 500 }}>חתונות</h2>
              <button
                onClick={() => setShowCreate(true)}
                style={{ background: "#3F4842", color: "#F8F6F2", border: "none", borderRadius: 9999, padding: "9px 18px", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 7, transition: "background 0.18s" }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#2D2D2D")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#3F4842")}
              >
                <span style={{ width: 14, height: 14 }}><IcoPlus /></span>
                חתונה חדשה
              </button>
            </div>

            {loadingWeddings ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[1, 2].map(i => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : weddingList && weddingList.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {weddingList.map((w) => {
                  const statusInfo = STATUS_COLORS[w.status] ?? STATUS_COLORS.prep;
                  // Extract couple names from timeline note
                  const namesNote = w.timeline?.[0]?.label ?? "—";
                  return (
                    <div
                      key={w.id}
                      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", border: "1px solid #EFEDE7", borderRadius: 10, background: "#FAFAF8", transition: "border-color 0.15s" }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = "#A8C3B0")}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = "#EFEDE7")}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <div style={{ width: 38, height: 38, borderRadius: 8, background: "#EFEDE7", color: "#3F4842", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ width: 18, height: 18 }}><IcoCalendar /></span>
                        </div>
                        <div>
                          <div style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 16, color: "#3F4842", fontWeight: 500 }}>{namesNote}</div>
                          <div style={{ fontSize: 12, color: "#8B8B85", marginTop: 2 }}>
                            {w.date ? new Date(w.date).toLocaleDateString("he-IL") : "תאריך לא נקבע"}
                            {" · "}
                            {w.coupleId ? "זוג מקושר" : "ממתין לזוג"}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 11.5, padding: "3px 10px", borderRadius: 9999, background: statusInfo.bg, color: statusInfo.color, fontWeight: 500 }}>
                          {statusInfo.label}
                        </span>
                        {!w.coupleId && w.inviteToken && (
                          <button
                            onClick={() => {
                              const url = `${window.location.origin}/join/${w.inviteToken}`;
                              setInviteModal({ url, names: namesNote });
                            }}
                            title="שליחת קישור לזוג"
                            style={{ background: "transparent", border: "1px solid #EFEDE7", borderRadius: 9999, padding: "5px 12px", fontSize: 12, color: "#5D6861", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 5, transition: "all 0.15s" }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#3F4842"; (e.currentTarget as HTMLButtonElement).style.color = "#3F4842"; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#EFEDE7"; (e.currentTarget as HTMLButtonElement).style.color = "#5D6861"; }}
                          >
                            <span style={{ width: 12, height: 12 }}><IcoLink /></span>
                            קישור לזוג
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "40px 0", color: "#8B8B85" }}>
                <div style={{ width: 48, height: 48, margin: "0 auto 12px", color: "#EFEDE7" }}><IcoCalendar /></div>
                <p style={{ fontSize: 14, marginBottom: 4 }}>עדיין אין חתונות מתוכננות</p>
                <p style={{ fontSize: 12, opacity: 0.7 }}>לחצו "חתונה חדשה" כדי להתחיל</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modals */}
      <CreateWeddingModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={(url, names) => {
          setShowCreate(false);
          setInviteModal({ url, names });
        }}
      />
      {inviteModal && (
        <InviteLinkModal
          open={true}
          inviteUrl={inviteModal.url}
          coupleNames={inviteModal.names}
          onClose={() => setInviteModal(null)}
        />
      )}
    </>
  );
}
