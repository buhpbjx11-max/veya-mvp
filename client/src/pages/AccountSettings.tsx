import React, { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { toast } from "sonner";

const CARD = {
  background: "#fff",
  border: "1px solid #EFEDE7",
  borderRadius: 18,
  boxShadow: "0 1px 2px rgba(45,45,45,.04), 0 8px 24px rgba(63,72,66,.06)",
};

const IcoBack = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>;
const IcoSave = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>;
const IcoUser = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
const IcoSettings = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>;
const IcoTools = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>;

type Tab = "profile" | "preferences" | "tools";

const TOOLS = [
  { key: "guests", label: "אורחים", desc: "ניהול רשימת האורחים, RSVP, תפריטים" },
  { key: "seating", label: "הושבה", desc: "קנבס ויזואלי לסידור שולחנות" },
  { key: "budget", label: "תקציב", desc: "מעקב הוצאות ותכנון תקציב" },
  { key: "gifts", label: "קופת מתנות", desc: "פרטי העברה לאורחים" },
  { key: "thanks", label: "תודות", desc: "מעקב תודות לאורחים" },
  { key: "photos", label: "תמונות", desc: "גלריה ו-QR לאורחים" },
  { key: "vendors", label: "ספקים", desc: "ניהול ספקי החתונה" },
  { key: "timeline", label: "לוח זמנים", desc: "לוח זמנים של יום החתונה" },
  { key: "family", label: "שיתוף משפחה", desc: "גישה מוגבלת לבני משפחה" },
  { key: "documents", label: "מסמכים", desc: "חוזים ומסמכים משפטיים" },
];

export default function AccountSettings() {
  const { user } = useAuth({ redirectOnUnauthenticated: true });
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<Tab>("profile");

  // Profile state
  const [name1, setName1] = useState("");
  const [name2, setName2] = useState("");
  const [phone1, setPhone1] = useState("");
  const [phone2, setPhone2] = useState("");
  const [email, setEmail] = useState("");
  const [primaryContact, setPrimaryContact] = useState<"1" | "2">("1");
  const [weddingDate, setWeddingDate] = useState("");
  const [sideLabel1, setSideLabel1] = useState("");
  const [sideLabel2, setSideLabel2] = useState("");
  const [profileDirty, setProfileDirty] = useState(false);

  // Tool settings state
  const [toolStates, setToolStates] = useState<Record<string, boolean>>({});
  const [toolsDirty, setToolsDirty] = useState(false);

  const utils = trpc.useUtils();

  const { data: profile, isLoading: profileLoading } = trpc.couple.me.useQuery(undefined, { enabled: !!user });
  const { data: toolSettingsList, isLoading: toolsLoading } = trpc.toolSettings.list.useQuery(undefined, { enabled: !!user });

  useEffect(() => {
    if (profile) {
      setName1(profile.name1 ?? "");
      setName2(profile.name2 ?? "");
      setPhone1(profile.phone1 ?? "");
      setPhone2(profile.phone2 ?? "");
      setEmail(profile.email ?? "");
      setPrimaryContact((profile.primaryContact as "1" | "2") ?? "1");
      setWeddingDate(profile.weddingDate ? new Date(profile.weddingDate).toISOString().split("T")[0] : "");
      const labels = profile.sideLabels as [string, string] | null;
      setSideLabel1(labels?.[0] ?? "");
      setSideLabel2(labels?.[1] ?? "");
    }
  }, [profile]);

  useEffect(() => {
    if (toolSettingsList) {
      const map: Record<string, boolean> = {};
      TOOLS.forEach((t) => { map[t.key] = true; }); // default all enabled
      toolSettingsList.forEach((ts) => { map[ts.toolName] = ts.enabled; });
      setToolStates(map);
    } else {
      // Default all enabled if no settings yet
      const map: Record<string, boolean> = {};
      TOOLS.forEach((t) => { map[t.key] = true; });
      setToolStates(map);
    }
  }, [toolSettingsList]);

  const updateProfile = trpc.couple.update.useMutation({
    onSuccess: () => {
      utils.couple.me.invalidate();
      setProfileDirty(false);
      toast.success("הפרופיל עודכן בהצלחה");
    },
    onError: (err: { message: string }) => toast.error(err.message),
  });

  const bulkUpsertTools = trpc.toolSettings.bulkUpsert.useMutation({
    onSuccess: () => {
      utils.toolSettings.list.invalidate();
      setToolsDirty(false);
      toast.success("הגדרות הכלים עודכנו");
    },
    onError: (err: { message: string }) => toast.error(err.message),
  });

  const handleSaveProfile = () => {
    updateProfile.mutate({
      name1: name1 || undefined,
      name2: name2 || undefined,
      phone1: phone1 || undefined,
      phone2: phone2 || undefined,
      weddingDate: weddingDate || undefined,
      sideLabel1: sideLabel1 || undefined,
      sideLabel2: sideLabel2 || undefined,
    });
  };

  const handleSaveTools = () => {
    const items = TOOLS.map((t, i) => ({
      toolName: t.key,
      enabled: toolStates[t.key] ?? true,
      sortOrder: i,
    }));
    bulkUpsertTools.mutate(items);
  };

  const toggleTool = (key: string) => {
    setToolStates((prev) => ({ ...prev, [key]: !prev[key] }));
    setToolsDirty(true);
  };

  const inputStyle = {
    width: "100%",
    padding: "10px 14px",
    border: "1px solid #EFEDE7",
    borderRadius: 10,
    fontFamily: "Heebo, sans-serif",
    fontSize: 14,
    color: "#3F4842",
    background: "#F8F6F2",
    outline: "none",
    boxSizing: "border-box" as const,
  };

  const labelStyle = {
    fontFamily: "Heebo, sans-serif",
    fontSize: 12,
    color: "#A8C3B0",
    marginBottom: 6,
    display: "block" as const,
    letterSpacing: 0.3,
  };

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "profile", label: "פרופיל הזוג", icon: <IcoUser /> },
    { key: "preferences", label: "העדפות", icon: <IcoSettings /> },
    { key: "tools", label: "כלים פעילים", icon: <IcoTools /> },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#F8F6F2", padding: "36px 44px 60px", direction: "rtl" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
        <button
          onClick={() => navigate("/couple/dashboard")}
          style={{ background: "transparent", border: "none", cursor: "pointer", color: "#5D6861", width: 20, height: 20, padding: 0 }}
        >
          <IcoBack />
        </button>
        <div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: 13, color: "#A8C3B0", letterSpacing: 1 }}>
            חשבון
          </div>
          <h1 style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 28, color: "#3F4842", margin: 0, fontWeight: 500 }}>
            הגדרות
          </h1>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 24, alignItems: "start" }}>
        {/* Sidebar tabs */}
        <div style={{ ...CARD, padding: "8px 0", position: "sticky", top: 24 }}>
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                width: "100%", padding: "12px 20px", background: "transparent", border: "none",
                cursor: "pointer", display: "flex", alignItems: "center", gap: 10,
                fontFamily: "Heebo, sans-serif", fontSize: 14,
                color: tab === t.key ? "#3F4842" : "#5D6861",
                fontWeight: tab === t.key ? 600 : 400,
                borderRight: tab === t.key ? "3px solid #3F4842" : "3px solid transparent",
                transition: "all 0.15s",
              }}
            >
              <span style={{ width: 16, height: 16 }}>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div>
          {/* ── Profile Tab ── */}
          {tab === "profile" && (
            <div style={{ ...CARD, padding: "28px 32px" }}>
              <h2 style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 20, color: "#3F4842", margin: "0 0 24px", fontWeight: 500 }}>
                פרופיל הזוג
              </h2>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={labelStyle}>שם בן/בת הזוג הראשון/ה</label>
                  <input value={name1} onChange={(e) => { setName1(e.target.value); setProfileDirty(true); }} style={inputStyle} placeholder="שם מלא" />
                </div>
                <div>
                  <label style={labelStyle}>שם בן/בת הזוג השני/ה</label>
                  <input value={name2} onChange={(e) => { setName2(e.target.value); setProfileDirty(true); }} style={inputStyle} placeholder="שם מלא" />
                </div>
                <div>
                  <label style={labelStyle}>טלפון — בן/בת הזוג הראשון/ה</label>
                  <input value={phone1} onChange={(e) => { setPhone1(e.target.value); setProfileDirty(true); }} style={inputStyle} placeholder="05X-XXXXXXX" />
                </div>
                <div>
                  <label style={labelStyle}>טלפון — בן/בת הזוג השני/ה</label>
                  <input value={phone2} onChange={(e) => { setPhone2(e.target.value); setProfileDirty(true); }} style={inputStyle} placeholder="05X-XXXXXXX" />
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>אימייל ליצירת קשר</label>
                <input value={email} onChange={(e) => { setEmail(e.target.value); setProfileDirty(true); }} style={inputStyle} placeholder="email@example.com" type="email" />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>איש/אשת קשר ראשי/ת</label>
                <div style={{ display: "flex", gap: 12 }}>
                  {(["1", "2"] as const).map((v) => (
                    <button
                      key={v}
                      onClick={() => { setPrimaryContact(v); setProfileDirty(true); }}
                      style={{
                        flex: 1, padding: "10px 16px", borderRadius: 10, border: "1px solid",
                        borderColor: primaryContact === v ? "#3F4842" : "#EFEDE7",
                        background: primaryContact === v ? "#3F4842" : "#fff",
                        color: primaryContact === v ? "#F8F6F2" : "#5D6861",
                        fontFamily: "Heebo, sans-serif", fontSize: 14, cursor: "pointer",
                      }}
                    >
                      {v === "1" ? (name1 || "בן/בת הזוג הראשון/ה") : (name2 || "בן/בת הזוג השני/ה")}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={labelStyle}>תאריך החתונה</label>
                <input value={weddingDate} onChange={(e) => { setWeddingDate(e.target.value); setProfileDirty(true); }} style={inputStyle} type="date" />
              </div>

              <div style={{ borderTop: "1px solid #EFEDE7", paddingTop: 20, marginBottom: 24 }}>
                <div style={{ fontFamily: "Heebo, sans-serif", fontSize: 14, color: "#3F4842", fontWeight: 600, marginBottom: 4 }}>תוויות "הצד שלי"</div>
                <div style={{ fontFamily: "Heebo, sans-serif", fontSize: 13, color: "#A8C3B0", marginBottom: 12 }}>
                  כך יופיע בפילטר האורחים — למשל "צד עדן" / "צד נועה"
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={labelStyle}>תווית צד 1 (של {name1 || "בן/בת הזוג הראשון/ה"})</label>
                    <input value={sideLabel1} onChange={(e) => { setSideLabel1(e.target.value); setProfileDirty(true); }} style={inputStyle} placeholder={`צד ${name1 || "..."}`} />
                  </div>
                  <div>
                    <label style={labelStyle}>תווית צד 2 (של {name2 || "בן/בת הזוג השני/ה"})</label>
                    <input value={sideLabel2} onChange={(e) => { setSideLabel2(e.target.value); setProfileDirty(true); }} style={inputStyle} placeholder={`צד ${name2 || "..."}`} />
                  </div>
                </div>
              </div>

              <button
                onClick={handleSaveProfile}
                disabled={!profileDirty || updateProfile.isPending}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "12px 28px", background: profileDirty ? "#3F4842" : "#EFEDE7",
                  color: profileDirty ? "#F8F6F2" : "#A8C3B0",
                  border: "none", borderRadius: 99, fontFamily: "Heebo, sans-serif", fontSize: 14,
                  fontWeight: 600, cursor: profileDirty ? "pointer" : "default", transition: "all 0.2s",
                }}
              >
                <span style={{ width: 16, height: 16 }}><IcoSave /></span>
                {updateProfile.isPending ? "שומר..." : "שמור שינויים"}
              </button>
            </div>
          )}

          {/* ── Preferences Tab ── */}
          {tab === "preferences" && (
            <div style={{ ...CARD, padding: "28px 32px" }}>
              <h2 style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 20, color: "#3F4842", margin: "0 0 24px", fontWeight: 500 }}>
                העדפות
              </h2>
              <div style={{ padding: "40px 0", textAlign: "center", color: "#A8C3B0", fontFamily: "Heebo, sans-serif", fontSize: 14 }}>
                הגדרות נוספות יתווספו בקרוב
              </div>
            </div>
          )}

          {/* ── Tools Tab ── */}
          {tab === "tools" && (
            <div style={{ ...CARD, padding: "28px 32px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
                <div>
                  <h2 style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 20, color: "#3F4842", margin: "0 0 4px", fontWeight: 500 }}>
                    כלים פעילים
                  </h2>
                  <p style={{ fontFamily: "Heebo, sans-serif", fontSize: 13, color: "#A8C3B0", margin: 0 }}>
                    הפעילו או כבו כלים לפי הצורך — תמיד ניתן לשנות
                  </p>
                </div>
                <button
                  onClick={handleSaveTools}
                  disabled={!toolsDirty || bulkUpsertTools.isPending}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "10px 20px", background: toolsDirty ? "#3F4842" : "#EFEDE7",
                    color: toolsDirty ? "#F8F6F2" : "#A8C3B0",
                    border: "none", borderRadius: 99, fontFamily: "Heebo, sans-serif", fontSize: 13,
                    fontWeight: 600, cursor: toolsDirty ? "pointer" : "default", transition: "all 0.2s",
                  }}
                >
                  <span style={{ width: 14, height: 14 }}><IcoSave /></span>
                  {bulkUpsertTools.isPending ? "שומר..." : "שמור"}
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {TOOLS.map((tool) => {
                  const enabled = toolStates[tool.key] ?? true;
                  return (
                    <div
                      key={tool.key}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "16px 20px", borderRadius: 12,
                        background: enabled ? "rgba(168,195,176,.06)" : "rgba(200,196,188,.04)",
                        border: `1px solid ${enabled ? "rgba(168,195,176,.2)" : "#EFEDE7"}`,
                        transition: "all 0.2s",
                      }}
                    >
                      <div>
                        <div style={{ fontFamily: "Heebo, sans-serif", fontSize: 14, color: enabled ? "#3F4842" : "#A8C3B0", fontWeight: 500, marginBottom: 2 }}>
                          {tool.label}
                        </div>
                        <div style={{ fontFamily: "Heebo, sans-serif", fontSize: 12, color: "#A8C3B0" }}>
                          {tool.desc}
                        </div>
                      </div>
                      {/* Toggle switch */}
                      <button
                        onClick={() => toggleTool(tool.key)}
                        style={{
                          width: 48, height: 26, borderRadius: 99, border: "none", cursor: "pointer",
                          background: enabled ? "#3F4842" : "#EFEDE7",
                          position: "relative", transition: "background 0.2s", flexShrink: 0,
                        }}
                        title={enabled ? "כבה כלי" : "הפעל כלי"}
                      >
                        <span style={{
                          position: "absolute", top: 3, width: 20, height: 20, borderRadius: "50%",
                          background: "#fff", transition: "right 0.2s, left 0.2s",
                          right: enabled ? 3 : "auto",
                          left: enabled ? "auto" : 3,
                        }} />
                      </button>
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: 16, padding: "12px 16px", background: "rgba(217,197,161,.08)", borderRadius: 10, border: "1px solid rgba(217,197,161,.2)" }}>
                <p style={{ fontFamily: "Heebo, sans-serif", fontSize: 12, color: "#A8C3B0", margin: 0, lineHeight: 1.6 }}>
                  כיבוי כלי מסתיר אותו מהתפריט אך לא מוחק נתונים. ניתן להפעיל מחדש בכל עת.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
