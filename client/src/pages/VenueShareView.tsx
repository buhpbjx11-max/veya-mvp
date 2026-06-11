import { trpc } from "@/lib/trpc";
import { useParams } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";

/* ── SVG Icons ── */
const IcoGuests = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="7" r="4" /><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" /><path d="M16 3.13a4 4 0 0 1 0 7.75M21 21v-2a4 4 0 0 0-3-3.87" /></svg>;
const IcoMeals = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1" /><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" /><line x1="6" y1="1" x2="6" y2="4" /><line x1="10" y1="1" x2="10" y2="4" /><line x1="14" y1="1" x2="14" y2="4" /></svg>;
const IcoSeating = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>;
const IcoLock = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>;
const IcoVeya = () => <svg width="28" height="28" viewBox="0 0 40 40" fill="none" stroke="#D9C5A1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 10 L20 30 L32 10" /><path d="M14 14 L20 22 L26 14" opacity="0.6" /></svg>;

const CARD_STYLE = {
  background: "#FAFAF8",
  border: "1px solid #EFEDE7",
  borderRadius: 18,
  boxShadow: "0 1px 2px rgba(45,45,45,.04), 0 8px 24px rgba(63,72,66,.06)",
};

const MEAL_LABELS: Record<string, string> = {
  standard: "רגיל",
  vegetarian: "צמחוני",
  vegan: "טבעוני",
  gluten_free: "ללא גלוטן / צליאק",
  child: "ילדים",
};

export default function VenueShareView() {
  const params = useParams<{ token: string }>();
  const token = params.token ?? "";

  const { data, isLoading, error } = trpc.venueShare.getByToken.useQuery(
    { token },
    { enabled: !!token, retry: false }
  );

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "#F8F6F2", padding: 24 }} dir="rtl">
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <Skeleton className="h-16 w-full mb-6" />
          <Skeleton className="h-40 w-full mb-4" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ minHeight: "100vh", background: "#F8F6F2", display: "flex", alignItems: "center", justifyContent: "center" }} dir="rtl">
        <div style={{ textAlign: "center", maxWidth: 400, padding: 32 }}>
          <div style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 28, color: "#3F4842", marginBottom: 12 }}>קישור לא תקין</div>
          <p style={{ fontSize: 14, color: "#5D6861", lineHeight: 1.6 }}>
            הקישור שהזנתם לא תקין, פג תוקפו, או בוטל על ידי הזוג.
          </p>
        </div>
      </div>
    );
  }

  const { share, couple, guestSummary, mealSummary } = data;
  const sections = share.sharedSections as Record<string, boolean>;

  const weddingDateStr = couple.weddingDate
    ? new Date(couple.weddingDate).toLocaleDateString("he-IL", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
    : null;

  return (
    <div style={{ minHeight: "100vh", background: "#F8F6F2" }} dir="rtl">
      {/* Top bar */}
      <header style={{ background: "#3F4842", padding: "14px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <IcoVeya />
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: "#F8F6F2", letterSpacing: 6 }}>VEYA</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "rgba(248,246,242,.6)" }}>
          <span style={{ width: 14, height: 14, display: "inline-block" }}><IcoLock /></span>
          צפייה בלבד — ללא עריכה
        </div>
      </header>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 24px 80px" }}>

        {/* Wedding header */}
        <div style={{ marginBottom: 32, textAlign: "center" }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: 14, color: "#8B8B85", letterSpacing: 1.5, marginBottom: 8 }}>חתונת</div>
          <h1 style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 36, color: "#3F4842", fontWeight: 400, marginBottom: 8 }}>
            {couple.name1} & {couple.name2}
          </h1>
          {weddingDateStr && (
            <p style={{ fontSize: 15, color: "#5D6861" }}>{weddingDateStr}</p>
          )}
          <div style={{ marginTop: 12, fontSize: 12, color: "#8B8B85" }}>
            שותף על ידי הזוג דרך VEYA · נתונים מתעדכנים בזמן אמת
          </div>
        </div>

        {/* Sections */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Guests summary */}
          {sections.guests && guestSummary && (
            <div style={{ ...CARD_STYLE, padding: "24px 28px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <span style={{ width: 20, height: 20, color: "#3F4842" }}><IcoGuests /></span>
                <h2 style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 20, color: "#3F4842", fontWeight: 500 }}>אורחים ו-RSVP</h2>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                {[
                  { label: "סה\"כ", value: guestSummary.total, color: "#3F4842" },
                  { label: "אישרו", value: guestSummary.confirmed, color: "#2F6B3E" },
                  { label: "ממתינים", value: guestSummary.pending, color: "#B8860B" },
                  { label: "לא מגיעים", value: guestSummary.declined, color: "#C0392B" },
                ].map((stat, i) => (
                  <div key={i} style={{ textAlign: "center", padding: "16px 8px", background: "#F8F6F2", borderRadius: 12, border: "1px solid #EFEDE7" }}>
                    <div style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 32, color: stat.color, fontWeight: 400, lineHeight: 1 }}>{stat.value}</div>
                    <div style={{ fontSize: 11.5, color: "#8B8B85", marginTop: 6 }}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Meals summary */}
          {sections.meals && mealSummary && (
            <div style={{ ...CARD_STYLE, padding: "24px 28px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <span style={{ width: 20, height: 20, color: "#3F4842" }}><IcoMeals /></span>
                <h2 style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 20, color: "#3F4842", fontWeight: 500 }}>מנות ודיאטות</h2>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {Object.entries(mealSummary).map(([type, count]) => (
                  <div key={type} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "#F8F6F2", borderRadius: 10, border: "1px solid #EFEDE7" }}>
                    <span style={{ fontSize: 14, color: "#3F4842" }}>{MEAL_LABELS[type] ?? type}</span>
                    <span style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 22, color: "#3F4842", fontWeight: 400 }}>{count}</span>
                  </div>
                ))}
                {Object.keys(mealSummary).length === 0 && (
                  <p style={{ fontSize: 13, color: "#8B8B85", textAlign: "center", padding: "20px 0" }}>אין נתוני מנות עדיין</p>
                )}
              </div>
            </div>
          )}

          {/* Seating placeholder */}
          {sections.seating && (
            <div style={{ ...CARD_STYLE, padding: "24px 28px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <span style={{ width: 20, height: 20, color: "#3F4842" }}><IcoSeating /></span>
                <h2 style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 20, color: "#3F4842", fontWeight: 500 }}>סידור הושבה</h2>
                <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 9999, background: "#F5F5F5", color: "#8B8B85", border: "1px solid #EFEDE7" }}>קריאה בלבד</span>
              </div>
              <div style={{ background: "#F8F6F2", border: "1px dashed #EFEDE7", borderRadius: 10, padding: "32px", textAlign: "center", color: "#8B8B85", fontSize: 13 }}>
                תצוגת שולחנות תופיע כאן כשהזוג יסיים את סידור ההושבה
              </div>
            </div>
          )}

          {/* Schedule placeholder */}
          {sections.schedule && (
            <div style={{ ...CARD_STYLE, padding: "24px 28px" }}>
              <h2 style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 20, color: "#3F4842", fontWeight: 500, marginBottom: 16 }}>לוח זמנים</h2>
              <div style={{ background: "#F8F6F2", border: "1px dashed #EFEDE7", borderRadius: 10, padding: "32px", textAlign: "center", color: "#8B8B85", fontSize: 13 }}>
                לוח הזמנים יופיע כאן כשהזוג יעדכן אותו
              </div>
            </div>
          )}

          {/* Vendors placeholder */}
          {sections.vendors && (
            <div style={{ ...CARD_STYLE, padding: "24px 28px" }}>
              <h2 style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 20, color: "#3F4842", fontWeight: 500, marginBottom: 16 }}>ספקים</h2>
              <div style={{ background: "#F8F6F2", border: "1px dashed #EFEDE7", borderRadius: 10, padding: "32px", textAlign: "center", color: "#8B8B85", fontSize: 13 }}>
                רשימת הספקים תופיע כאן
              </div>
            </div>
          )}
        </div>

        {/* ── Conversion CTA (ערוץ המרה) ── */}
        <div style={{ marginTop: 48, background: "#3F4842", borderRadius: 18, padding: "36px 40px", textAlign: "center" }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: 13, color: "rgba(248,246,242,.55)", letterSpacing: 2, marginBottom: 10 }}>
            מנוהל דרך VEYA
          </div>
          <h3 style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 26, color: "#F8F6F2", fontWeight: 400, marginBottom: 12 }}>
            רוצים לנהל חתונות כך?
          </h3>
          <p style={{ fontSize: 14, color: "rgba(248,246,242,.7)", lineHeight: 1.7, marginBottom: 24, maxWidth: 420, margin: "0 auto 24px" }}>
            VEYA מאפשרת לאולמות לנהל חתונות, לתקשר עם זוגות, לקבל דוחות אוטומטיים ועוד — הכל במקום אחד.
          </p>
          <a
            href="https://veya.co.il"
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "inline-block", padding: "12px 32px", background: "#D9C5A1", color: "#3F4842", borderRadius: 9999, fontSize: 14, fontWeight: 600, textDecoration: "none", fontFamily: "inherit" }}
          >
            גלו את VEYA לאולמות
          </a>
          <div style={{ marginTop: 16, fontSize: 12, color: "rgba(248,246,242,.4)" }}>
            ללא התחייבות · ניסיון חינם 14 יום
          </div>
        </div>

      </div>
    </div>
  );
}
