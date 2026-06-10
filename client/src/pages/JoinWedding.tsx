import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";

const CARD_STYLE = {
  background: "#fff",
  border: "1px solid #EFEDE7",
  borderRadius: 18,
  boxShadow: "0 1px 2px rgba(45,45,45,.04), 0 8px 24px rgba(63,72,66,.06)",
};

const PILL_BTN = (bg: string, color: string): React.CSSProperties => ({
  background: bg,
  color,
  border: "none",
  borderRadius: 9999,
  padding: "13px 28px",
  fontSize: 14,
  fontWeight: 500,
  cursor: "pointer",
  fontFamily: "inherit",
  transition: "background 0.18s",
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
});

export default function JoinWedding() {
  const { token } = useParams<{ token: string }>();
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth({});
  const [accepted, setAccepted] = useState(false);

  // Fetch wedding details by token (public)
  const { data: wedding, isLoading: loadingWedding, error: weddingError } = trpc.wedding.getByToken.useQuery(
    { token: token ?? "" },
    { enabled: !!token }
  );

  // Get couple profile (to check if they're registered)
  const { data: couple, isLoading: loadingCouple } = trpc.couple.me.useQuery(undefined, {
    enabled: !!user,
    retry: false,
  });

  const acceptMutation = trpc.wedding.acceptInvite.useMutation({
    onSuccess: () => {
      setAccepted(true);
      toast.success("שויכתם לחתונה בהצלחה!");
      setTimeout(() => navigate("/couple/dashboard", { replace: true }), 2000);
    },
    onError: (err) => {
      toast.error(err.message || "שגיאה בקבלת ההזמנה");
    },
  });

  const handleAccept = () => {
    if (!token) return;
    acceptMutation.mutate({ token });
  };

  const handleLogin = () => {
    // Store token in sessionStorage so we can redirect back after login
    sessionStorage.setItem("veya_join_token", token ?? "");
    window.location.href = getLoginUrl();
  };

  // After login, if there's a stored token, redirect back to join page
  useEffect(() => {
    const stored = sessionStorage.getItem("veya_join_token");
    if (stored && user) {
      sessionStorage.removeItem("veya_join_token");
      // Already on the right page
    }
  }, [user]);

  if (!token) {
    return (
      <div style={{ minHeight: "100vh", background: "#F8F6F2", display: "flex", alignItems: "center", justifyContent: "center" }} dir="rtl">
        <div style={{ ...CARD_STYLE, padding: "40px 48px", textAlign: "center", maxWidth: 420 }}>
          <h2 style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 26, color: "#3F4842", marginBottom: 12 }}>קישור לא תקין</h2>
          <p style={{ color: "#5D6861", fontSize: 14 }}>הקישור שהתקבל אינו תקין. בקשו מהאולם לשלוח קישור חדש.</p>
        </div>
      </div>
    );
  }

  if (loadingWedding) {
    return (
      <div style={{ minHeight: "100vh", background: "#F8F6F2", display: "flex", alignItems: "center", justifyContent: "center" }} dir="rtl">
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 32, height: 32, border: "2px solid #EFEDE7", borderTopColor: "#3F4842", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ color: "#5D6861", fontSize: 14 }}>טוען פרטי חתונה...</p>
        </div>
      </div>
    );
  }

  if (weddingError || !wedding) {
    return (
      <div style={{ minHeight: "100vh", background: "#F8F6F2", display: "flex", alignItems: "center", justifyContent: "center" }} dir="rtl">
        <div style={{ ...CARD_STYLE, padding: "40px 48px", textAlign: "center", maxWidth: 420 }}>
          <div style={{ width: 48, height: 48, margin: "0 auto 16px", color: "#D9C5A1" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2 style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 26, color: "#3F4842", marginBottom: 12 }}>קישור לא תקין</h2>
          <p style={{ color: "#5D6861", fontSize: 14 }}>הקישור פג תוקף או אינו תקין. בקשו מהאולם לשלוח קישור חדש.</p>
        </div>
      </div>
    );
  }

  if (accepted) {
    return (
      <div style={{ minHeight: "100vh", background: "#F8F6F2", display: "flex", alignItems: "center", justifyContent: "center" }} dir="rtl">
        <div style={{ ...CARD_STYLE, padding: "48px 56px", textAlign: "center", maxWidth: 460 }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#DDEAE0", color: "#3F4842", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 28, color: "#3F4842", marginBottom: 10 }}>ברוכים הבאים!</h2>
          <p style={{ color: "#5D6861", fontSize: 14, lineHeight: 1.8 }}>שויכתם לחתונה בהצלחה. מעבירים אתכם לדשבורד...</p>
        </div>
      </div>
    );
  }

  const weddingDate = wedding.date
    ? new Date(wedding.date).toLocaleDateString("he-IL", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
    : null;

  return (
    <div style={{ minHeight: "100vh", background: "#F8F6F2", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px" }} dir="rtl">
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 36 }}>
        <svg width="22" height="22" viewBox="0 0 40 40" fill="none" stroke="#3F4842" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 10 L20 30 L32 10" /><path d="M14 14 L20 22 L26 14" opacity="0.6" />
        </svg>
        <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: "#3F4842", letterSpacing: 6 }}>VEYA</span>
      </div>

      <div style={{ ...CARD_STYLE, padding: "44px 52px", maxWidth: 520, width: "100%", textAlign: "center" }}>
        {/* Invite header */}
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: 13, color: "#8B8B85", letterSpacing: 2, marginBottom: 10 }}>
          • הזמנה לחתונה
        </div>

        <h1 style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 32, color: "#3F4842", fontWeight: 400, marginBottom: 8 }}>
          הוזמנתם להצטרף
        </h1>

        {weddingDate && (
          <div style={{ display: "inline-block", background: "#F8F6F2", border: "1px solid #EFEDE7", borderRadius: 8, padding: "8px 18px", fontSize: 14, color: "#5D6861", marginBottom: 24 }}>
            {weddingDate}
          </div>
        )}

        {wedding.alreadyLinked ? (
          <div style={{ background: "#FFF8E7", border: "1px solid #F0E0A0", borderRadius: 10, padding: "16px 20px", marginBottom: 24, fontSize: 13.5, color: "#7A6A20" }}>
            קישור זה כבר שויך לזוג. אם אתם הזוג, היכנסו לדשבורד שלכם.
          </div>
        ) : (
          <p style={{ fontSize: 14, color: "#5D6861", lineHeight: 1.8, marginBottom: 28 }}>
            האולם שלכם שלח לכם קישור ייחודי. לחצו "הצטרפות" כדי לקשר את החשבון שלכם לחתונה ולקבל גישה לכל הכלים.
          </p>
        )}

        {/* Action area */}
        {!isAuthenticated ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
            <p style={{ fontSize: 13, color: "#8B8B85", marginBottom: 4 }}>
              יש להיכנס לחשבון VEYA כדי לקבל את ההזמנה
            </p>
            <button
              onClick={handleLogin}
              style={PILL_BTN("#3F4842", "#F8F6F2")}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#2D2D2D")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#3F4842")}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" />
              </svg>
              כניסה / הרשמה
            </button>
          </div>
        ) : !couple ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
            {loadingCouple ? (
              <p style={{ fontSize: 13, color: "#8B8B85" }}>טוען פרופיל...</p>
            ) : (
              <>
                <p style={{ fontSize: 13, color: "#8B8B85", marginBottom: 4 }}>
                  יש להשלים הרשמה כזוג לפני קבלת ההזמנה
                </p>
                <button
                  onClick={() => navigate("/onboarding")}
                  style={PILL_BTN("#3F4842", "#F8F6F2")}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#2D2D2D")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#3F4842")}
                >
                  השלמת הרשמה
                </button>
              </>
            )}
          </div>
        ) : wedding.alreadyLinked && couple ? (
          <button
            onClick={() => navigate("/couple/dashboard")}
            style={PILL_BTN("#3F4842", "#F8F6F2")}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#2D2D2D")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#3F4842")}
          >
            מעבר לדשבורד
          </button>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
            <p style={{ fontSize: 13, color: "#5D6861", marginBottom: 4 }}>
              מחוברים כ: <strong>{couple.name1} & {couple.name2}</strong>
            </p>
            <button
              onClick={handleAccept}
              disabled={acceptMutation.isPending}
              style={{
                ...PILL_BTN(acceptMutation.isPending ? "#A8C3B0" : "#3F4842", "#F8F6F2"),
                opacity: acceptMutation.isPending ? 0.7 : 1,
              }}
              onMouseEnter={(e) => { if (!acceptMutation.isPending) (e.currentTarget as HTMLButtonElement).style.background = "#2D2D2D"; }}
              onMouseLeave={(e) => { if (!acceptMutation.isPending) (e.currentTarget as HTMLButtonElement).style.background = "#3F4842"; }}
            >
              {acceptMutation.isPending ? (
                <>
                  <div style={{ width: 14, height: 14, border: "2px solid rgba(248,246,242,.4)", borderTopColor: "#F8F6F2", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                  מקשר...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  הצטרפות לחתונה
                </>
              )}
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
