import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

/* ── SVG Icons ── */
const IcoShare = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>;
const IcoCheck = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>;
const IcoCopy = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>;
const IcoTrash = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>;
const IcoArrowRight = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 5 5 12 12 19" /></svg>;
const IcoWhatsapp = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>;

const CARD_STYLE = {
  background: "#FAFAF8",
  border: "1px solid #EFEDE7",
  borderRadius: 18,
  boxShadow: "0 1px 2px rgba(45,45,45,.04), 0 8px 24px rgba(63,72,66,.06)",
};

const SECTION_LABELS: Record<string, string> = {
  guests: "אורחים ו-RSVP",
  meals: "מנות ודיאטות",
  seating: "סידור הושבה",
  schedule: "לוח זמנים",
  vendors: "ספקים",
};

const SECTION_DESCRIPTIONS: Record<string, string> = {
  guests: "סיכום אישרו / ממתינים / לא מגיעים",
  meals: "פירוט לפי סוג מנה ודיאטות מיוחדות",
  seating: "תצוגת שולחנות (קריאה בלבד, מקובע)",
  schedule: "לוח זמנים של יום החתונה",
  vendors: "רשימת ספקים ואנשי קשר",
};

export default function VenueShareSetup() {
  useAuth({ redirectOnUnauthenticated: true });

  const { data: shares, isLoading, refetch } = trpc.venueShare.list.useQuery();
  const createShare = trpc.venueShare.create.useMutation();
  const revokeShare = trpc.venueShare.revoke.useMutation();

  const [step, setStep] = useState<"list" | "create">("list");
  const [venueName, setVenueName] = useState("");
  const [venuePhone, setVenuePhone] = useState("");
  const [venueWhatsapp, setVenueWhatsapp] = useState("");
  const [sections, setSections] = useState({
    guests: true,
    meals: true,
    seating: true,
    schedule: false,
    vendors: false,
  });
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const activeShares = shares?.filter(s => !s.revoked) ?? [];
  const hasActiveShare = activeShares.length > 0;

  const handleCreate = async () => {
    if (!venueName.trim()) {
      toast.error("יש להזין שם האולם");
      return;
    }
    try {
      const result = await createShare.mutateAsync({
        venueName: venueName.trim(),
        venuePhone: venuePhone.trim() || undefined,
        venueWhatsapp: venueWhatsapp.trim() || undefined,
        sharedSections: sections,
      });
      setCreatedToken(result.shareToken);
      await refetch();
      toast.success("קישור שיתוף נוצר בהצלחה");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "שגיאה ביצירת קישור";
      toast.error(msg);
    }
  };

  const handleCopy = async (token: string) => {
    const url = `${window.location.origin}/venue-view/${token}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("הקישור הועתק");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsapp = (token: string, name: string) => {
    const url = `${window.location.origin}/venue-view/${token}`;
    const text = encodeURIComponent(`שלום, הנה קישור לצפייה בפרטי החתונה שלנו דרך VEYA:\n${url}`);
    window.open(`https://wa.me/${name.replace(/\D/g, "")}?text=${text}`, "_blank");
  };

  const handleRevoke = async (shareId: number) => {
    if (!confirm("לבטל את הגישה לאולם? הקישור יפסיק לעבוד מיד.")) return;
    try {
      await revokeShare.mutateAsync({ shareId });
      await refetch();
      toast.success("הגישה בוטלה");
    } catch {
      toast.error("שגיאה בביטול הגישה");
    }
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "#F8F6F2", padding: 24 }} dir="rtl">
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <Skeleton className="h-10 w-48 mb-4" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F8F6F2", padding: "40px 24px" }} dir="rtl">
      <div style={{ maxWidth: 640, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <button
            onClick={() => window.history.back()}
            style={{ background: "transparent", border: "none", color: "#5D6861", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13, marginBottom: 20, padding: 0, fontFamily: "inherit" }}
          >
            <span style={{ width: 16, height: 16 }}><IcoArrowRight /></span>
            חזרה לדשבורד
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "#DDEAE0", color: "#3F4842", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ width: 20, height: 20 }}><IcoShare /></span>
            </div>
            <h1 style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 28, color: "#3F4842", fontWeight: 400 }}>שיתוף עם האולם</h1>
          </div>
          <p style={{ fontSize: 14, color: "#5D6861", lineHeight: 1.6 }}>
            שלחו לאולם קישור לצפייה בנתוני החתונה שלכם — ללא עריכה, ללא חשבון. אתם בוחרים מה לשתף.
          </p>
        </div>

        {/* Active share exists */}
        {hasActiveShare && step !== "create" && (
          <div style={{ marginBottom: 24 }}>
            {activeShares.map(share => {
              const url = `${window.location.origin}/venue-view/${share.shareToken}`;
              return (
                <div key={share.id} style={{ ...CARD_STYLE, padding: "24px 28px", marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
                    <div>
                      <div style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 18, color: "#3F4842", fontWeight: 500, marginBottom: 4 }}>{share.venueName}</div>
                      {share.venuePhone && <div style={{ fontSize: 12.5, color: "#8B8B85" }}>{share.venuePhone}</div>}
                    </div>
                    <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 9999, background: "#DDEAE0", color: "#2F6B3E", fontWeight: 500 }}>פעיל</span>
                  </div>

                  {/* Shared sections */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
                    {Object.entries(share.sharedSections as Record<string, boolean>).filter(([, v]) => v).map(([k]) => (
                      <span key={k} style={{ fontSize: 11.5, padding: "3px 10px", borderRadius: 9999, background: "#F0EDE7", color: "#5D6861", border: "1px solid #E5E0D8" }}>
                        {SECTION_LABELS[k] ?? k}
                      </span>
                    ))}
                  </div>

                  {/* URL */}
                  <div style={{ background: "#F8F6F2", border: "1px solid #EFEDE7", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#8B8B85", fontFamily: "monospace", wordBreak: "break-all", marginBottom: 16 }}>
                    {url}
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 10 }}>
                    <button
                      onClick={() => handleCopy(share.shareToken)}
                      style={{ flex: 1, padding: "10px 16px", background: "#3F4842", color: "#F8F6F2", border: "none", borderRadius: 9999, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "background 0.15s" }}
                    >
                      <span style={{ width: 14, height: 14 }}>{copied ? <IcoCheck /> : <IcoCopy />}</span>
                      {copied ? "הועתק!" : "העתק קישור"}
                    </button>
                    {share.venueWhatsapp && (
                      <button
                        onClick={() => handleWhatsapp(share.shareToken, share.venueWhatsapp!)}
                        style={{ padding: "10px 16px", background: "#25D366", color: "#fff", border: "none", borderRadius: 9999, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6 }}
                      >
                        <span style={{ width: 14, height: 14 }}><IcoWhatsapp /></span>
                        WhatsApp
                      </button>
                    )}
                    <button
                      onClick={() => handleRevoke(share.id)}
                      title="ביטול גישה"
                      style={{ padding: "10px 14px", background: "transparent", color: "#C0392B", border: "1px solid #EFEDE7", borderRadius: 9999, fontSize: 13, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 5 }}
                    >
                      <span style={{ width: 14, height: 14 }}><IcoTrash /></span>
                      ביטול
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Created token success */}
        {createdToken && (
          <div style={{ ...CARD_STYLE, padding: "20px 24px", marginBottom: 24, borderColor: "#A8C3B0", background: "#F0F7F2" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ width: 18, height: 18, color: "#2F6B3E" }}><IcoCheck /></span>
              <span style={{ fontWeight: 600, color: "#2F6B3E", fontSize: 14 }}>הקישור נוצר בהצלחה!</span>
            </div>
            <p style={{ fontSize: 13, color: "#5D6861", marginBottom: 12 }}>שלחו את הקישור לאולם — הם יוכלו לצפות בנתונים ללא חשבון.</p>
            <button
              onClick={() => handleCopy(createdToken)}
              style={{ width: "100%", padding: "11px 16px", background: "#3F4842", color: "#F8F6F2", border: "none", borderRadius: 9999, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
            >
              <span style={{ width: 14, height: 14 }}>{copied ? <IcoCheck /> : <IcoCopy />}</span>
              {copied ? "הועתק!" : "העתק קישור"}
            </button>
          </div>
        )}

        {/* Create form */}
        {step === "create" ? (
          <div style={{ ...CARD_STYLE, padding: "28px 32px" }}>
            <h2 style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 22, color: "#3F4842", fontWeight: 400, marginBottom: 20 }}>יצירת קישור שיתוף</h2>

            {/* Venue details */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#3F4842", marginBottom: 6 }}>שם האולם *</label>
              <input
                value={venueName}
                onChange={e => setVenueName(e.target.value)}
                placeholder="לדוגמה: אולם הגן"
                style={{ width: "100%", padding: "10px 14px", border: "1px solid #EFEDE7", borderRadius: 8, fontSize: 14, fontFamily: "inherit", background: "#fff", outline: "none", boxSizing: "border-box" }}
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#3F4842", marginBottom: 6 }}>טלפון האולם</label>
                <input
                  value={venuePhone}
                  onChange={e => setVenuePhone(e.target.value)}
                  placeholder="050-0000000"
                  style={{ width: "100%", padding: "10px 14px", border: "1px solid #EFEDE7", borderRadius: 8, fontSize: 14, fontFamily: "inherit", background: "#fff", outline: "none", boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#3F4842", marginBottom: 6 }}>WhatsApp לשליחה</label>
                <input
                  value={venueWhatsapp}
                  onChange={e => setVenueWhatsapp(e.target.value)}
                  placeholder="050-0000000"
                  style={{ width: "100%", padding: "10px 14px", border: "1px solid #EFEDE7", borderRadius: 8, fontSize: 14, fontFamily: "inherit", background: "#fff", outline: "none", boxSizing: "border-box" }}
                />
              </div>
            </div>

            {/* Sections */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: "#3F4842", marginBottom: 12 }}>מה לשתף עם האולם?</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {Object.entries(SECTION_LABELS).map(([key, label]) => (
                  <label
                    key={key}
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", border: `1px solid ${sections[key as keyof typeof sections] ? "#A8C3B0" : "#EFEDE7"}`, borderRadius: 10, cursor: "pointer", background: sections[key as keyof typeof sections] ? "#F0F7F2" : "#fff", transition: "all 0.15s" }}
                  >
                    <input
                      type="checkbox"
                      checked={sections[key as keyof typeof sections]}
                      onChange={e => setSections(prev => ({ ...prev, [key]: e.target.checked }))}
                      style={{ width: 16, height: 16, accentColor: "#3F4842" }}
                    />
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 500, color: "#3F4842" }}>{label}</div>
                      <div style={{ fontSize: 12, color: "#8B8B85", marginTop: 1 }}>{SECTION_DESCRIPTIONS[key]}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={handleCreate}
                disabled={createShare.isPending}
                style={{ flex: 1, padding: "12px 20px", background: "#3F4842", color: "#F8F6F2", border: "none", borderRadius: 9999, fontSize: 14, fontWeight: 500, cursor: createShare.isPending ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: createShare.isPending ? 0.7 : 1 }}
              >
                {createShare.isPending ? "יוצר קישור..." : "צור קישור שיתוף"}
              </button>
              <button
                onClick={() => setStep("list")}
                style={{ padding: "12px 20px", background: "transparent", color: "#5D6861", border: "1px solid #EFEDE7", borderRadius: 9999, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}
              >
                ביטול
              </button>
            </div>
          </div>
        ) : (
          !hasActiveShare && (
            <div style={{ ...CARD_STYLE, padding: "40px 32px", textAlign: "center" }}>
              <div style={{ width: 48, height: 48, margin: "0 auto 16px", color: "#A8C3B0" }}><IcoShare /></div>
              <h2 style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 22, color: "#3F4842", fontWeight: 400, marginBottom: 8 }}>שתפו את האולם בנתונים</h2>
              <p style={{ fontSize: 14, color: "#5D6861", lineHeight: 1.7, marginBottom: 24, maxWidth: 400, margin: "0 auto 24px" }}>
                צרו קישור ייחודי לאולם שלכם — הם יוכלו לראות את נתוני החתונה בזמן אמת, ללא עריכה וללא חשבון.
              </p>
              <button
                onClick={() => setStep("create")}
                style={{ padding: "12px 28px", background: "#3F4842", color: "#F8F6F2", border: "none", borderRadius: 9999, fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}
              >
                יצירת קישור שיתוף
              </button>
            </div>
          )
        )}

        {/* Add another share button */}
        {hasActiveShare && step === "list" && (
          <button
            onClick={() => setStep("create")}
            style={{ width: "100%", padding: "12px", background: "transparent", color: "#5D6861", border: "1px dashed #EFEDE7", borderRadius: 10, fontSize: 13, cursor: "pointer", fontFamily: "inherit", marginTop: 8 }}
          >
            + שיתוף עם אולם נוסף
          </button>
        )}
      </div>
    </div>
  );
}
