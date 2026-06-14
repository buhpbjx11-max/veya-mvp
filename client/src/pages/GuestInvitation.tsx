import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";

const IcoCalendar = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);
const IcoLocation = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
  </svg>
);
const IcoClock = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);

function formatHebrewDate(d: Date | string | null | undefined) {
  if (!d) return null;
  const date = new Date(d);
  return date.toLocaleDateString("he-IL", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

export default function GuestInvitation() {
  const params = useParams<{ token: string }>();
  const token = params.token;

  const invQuery = trpc.invitation.getPublic.useQuery({ token }, { enabled: !!token });
  const inv = invQuery.data;

  if (invQuery.isLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "#3F4842", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Heebo', sans-serif" }}>
        <div style={{ color: "rgba(248,246,242,.6)", fontSize: 15 }}>טוען הזמנה...</div>
      </div>
    );
  }

  if (invQuery.isError || !inv) {
    return (
      <div style={{ minHeight: "100vh", background: "#3F4842", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Heebo', sans-serif", direction: "rtl", gap: 16 }}>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: 22, color: "#D9C5A1" }}>VEYA</div>
        <div style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 24, color: "#F8F6F2" }}>ההזמנה לא נמצאה</div>
        <div style={{ fontSize: 14, color: "rgba(248,246,242,.5)" }}>הקישור אינו תקין או שפג תוקפו</div>
      </div>
    );
  }

  const rsvpUrl = `/rsvp?token=${token}`;

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #3F4842 0%, #2C3330 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Heebo', sans-serif", direction: "rtl", padding: "40px 20px" }}>

      {/* Card */}
      <div style={{ maxWidth: 480, width: "100%", position: "relative" }}>
        {/* Decorative circles */}
        <div style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: "50%", background: "rgba(217,197,161,.05)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -60, left: -60, width: 200, height: 200, borderRadius: "50%", background: "rgba(168,195,176,.04)", pointerEvents: "none" }} />

        {/* VEYA mark */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: 16, color: "rgba(217,197,161,.5)", letterSpacing: "0.25em" }}>VEYA</span>
        </div>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 40 }}>
          <div style={{ width: 60, height: 1, background: "rgba(217,197,161,.3)" }} />
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#D9C5A1", opacity: 0.6 }} />
          <div style={{ width: 60, height: 1, background: "rgba(217,197,161,.3)" }} />
        </div>

        {/* Names */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 52, color: "#F8F6F2", fontWeight: 600, lineHeight: 1.05 }}>
            {inv.name1}
          </div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: 22, color: "#D9C5A1", margin: "10px 0" }}>
            &amp;
          </div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 52, color: "#F8F6F2", fontWeight: 600, lineHeight: 1.05 }}>
            {inv.name2}
          </div>
          <div style={{ fontSize: 15, color: "rgba(248,246,242,.65)", marginTop: 20, fontStyle: "italic" }}>
            מתכבדים להזמינכם לחגוג עמם את יומם הגדול
          </div>
        </div>

        {/* Details */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18, alignItems: "center", marginBottom: 48 }}>
          {inv.weddingDate && (
            <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#F8F6F2" }}>
              <span style={{ width: 20, height: 20, color: "#D9C5A1", flexShrink: 0 }}><IcoCalendar /></span>
              <span style={{ fontSize: 18, fontFamily: "'Frank Ruhl Libre', serif" }}>
                {formatHebrewDate(inv.weddingDate)}
              </span>
            </div>
          )}
          {inv.time && (
            <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#F8F6F2" }}>
              <span style={{ width: 20, height: 20, color: "#D9C5A1", flexShrink: 0 }}><IcoClock /></span>
              <span style={{ fontSize: 18, fontFamily: "'Frank Ruhl Libre', serif" }}>בשעה {String(inv.time ?? "")}</span>
            </div>
          )}
          {inv.location && (
            <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#F8F6F2" }}>
              <span style={{ width: 20, height: 20, color: "#D9C5A1", flexShrink: 0 }}><IcoLocation /></span>
              <span style={{ fontSize: 18, fontFamily: "'Frank Ruhl Libre', serif" }}>{String(inv.location ?? "")}</span>
            </div>
          )}
        </div>

        {/* Custom text */}
        {inv.customText && (
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div style={{ fontSize: 14, color: "rgba(248,246,242,.6)", fontStyle: "italic", lineHeight: 1.8, maxWidth: 360, margin: "0 auto" }}>
              "{String(inv.customText ?? "")}"
            </div>
          </div>
        )}

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 36 }}>
          <div style={{ width: 60, height: 1, background: "rgba(217,197,161,.3)" }} />
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#D9C5A1", opacity: 0.6 }} />
          <div style={{ width: 60, height: 1, background: "rgba(217,197,161,.3)" }} />
        </div>

        {/* RSVP */}
        <div style={{ textAlign: "center" }}>
          {inv.rsvpDeadline && (
            <div style={{ fontSize: 12, color: "rgba(217,197,161,.55)", marginBottom: 14, letterSpacing: "0.08em" }}>
              אישור הגעה עד {new Date(inv.rsvpDeadline as string).toLocaleDateString("he-IL")}
            </div>
          )}
          <a
            href={rsvpUrl}
            style={{
              display: "inline-block",
              background: "#D9C5A1",
              color: "#3F4842",
              borderRadius: 9999,
              padding: "14px 40px",
              fontSize: 15,
              fontWeight: 700,
              fontFamily: "'Heebo', sans-serif",
              textDecoration: "none",
              letterSpacing: "0.03em",
              boxShadow: "0 4px 16px rgba(217,197,161,.25)",
              transition: "all 0.15s",
            }}
          >
            אשרו הגעה
          </a>
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: 48 }}>
          <span style={{ fontSize: 11, color: "rgba(248,246,242,.2)", letterSpacing: "0.1em" }}>
            נשלח דרך VEYA · פלטפורמת ניהול חתונות
          </span>
        </div>
      </div>
    </div>
  );
}
