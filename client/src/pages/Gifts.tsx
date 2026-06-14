import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { toast } from "sonner";

type GiftSettings = {
  displayName?: string;
  bankAccount?: string;
  bitPhone?: string;
  payboxUser?: string;
  paypalEmail?: string;
  thankYouMessage?: string;
  enabledMethods?: string[];
};

const ALL_METHODS = [
  { id: "bit",    label: "Bit",              meta: "העברה מיידית",      icon: "📱" },
  { id: "bank",   label: "העברה בנקאית",    meta: "1-3 ימי עסקים",    icon: "🏦" },
  { id: "paybox", label: "PayBox",           meta: "העברה מיידית",      icon: "💳" },
  { id: "paypal", label: "PayPal",           meta: 'לאורחים מחו"ל',    icon: "🌐" },
];

const DEFAULT_METHODS = ["bit", "bank", "paybox"];

function fmt(n: number) {
  return n.toLocaleString("he-IL", { style: "currency", currency: "ILS", maximumFractionDigits: 0 });
}

function GuestPreviewCard({ settings, coupleName }: { settings: GiftSettings; coupleName: string }) {
  const enabledMethods = settings.enabledMethods ?? DEFAULT_METHODS;

  function getMethodDetail(id: string): string | null {
    if (id === "bit") return settings.bitPhone ?? null;
    if (id === "bank") return settings.bankAccount ?? null;
    if (id === "paybox") return settings.payboxUser ?? null;
    if (id === "paypal") return settings.paypalEmail ?? null;
    return null;
  }

  const activeWithDetails = ALL_METHODS.filter(m => enabledMethods.includes(m.id) && getMethodDetail(m.id));
  const activeNoDetails = ALL_METHODS.filter(m => enabledMethods.includes(m.id) && !getMethodDetail(m.id));

  return (
    <div style={{ background: "#fff", borderRadius: 18, padding: 28, maxWidth: 420, margin: "0 auto", boxShadow: "0 4px 24px rgba(63,72,66,0.12)" }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 28, color: "#3F4842", marginBottom: 4 }}>
          {coupleName || "שם הזוג"}
        </div>
        <div style={{ fontSize: 13, color: "#8B8B85" }}>בחרו את שיטת המתנה המועדפת עליכם</div>
      </div>

      {activeWithDetails.length === 0 && activeNoDetails.length === 0 ? (
        <div style={{ textAlign: "center", color: "#B0ADA5", padding: 24, fontSize: 13 }}>
          לא הוגדרו שיטות תשלום עדיין.<br />עברו ל"הגדרות קופה" כדי להוסיף.
        </div>
      ) : (
        <>
          {activeWithDetails.map(m => {
            const detail = getMethodDetail(m.id)!;
            return (
              <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 12, border: "1px solid #DDD8CE", marginBottom: 8 }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#EFF5F1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{m.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#2D2D2D" }}>{m.label}</div>
                  <div style={{ fontSize: 12, color: "#5D6861", marginTop: 2 }}>{detail}</div>
                </div>
                <button onClick={() => { navigator.clipboard.writeText(detail); toast.success("הועתק!"); }}
                  style={{ padding: "4px 12px", borderRadius: 20, border: "1px solid #DDD8CE", background: "#F8F6F2", fontSize: 12, cursor: "pointer", color: "#5D6861", fontFamily: "'Heebo', sans-serif" }}>
                  העתק
                </button>
              </div>
            );
          })}
          {activeNoDetails.map(m => (
            <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 12, border: "1px solid #DDD8CE", marginBottom: 8, opacity: 0.5 }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#EFF5F1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{m.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#2D2D2D" }}>{m.label}</div>
                <div style={{ fontSize: 12, color: "#c0392b", marginTop: 2 }}>פרטים לא הוגדרו</div>
              </div>
            </div>
          ))}
        </>
      )}

      {settings.thankYouMessage && (
        <div style={{ marginTop: 20, padding: "14px 16px", background: "#EFF5F1", borderRadius: 12, fontSize: 13, color: "#3F4842", lineHeight: 1.7, textAlign: "center" }}>
          {settings.thankYouMessage}
        </div>
      )}

      <div style={{ marginTop: 16, textAlign: "center", fontSize: 11, color: "#B0ADA5" }}>
        VEYA לא מסלקת כסף — ההעברה מתבצעת ישירות
      </div>
    </div>
  );
}

export default function Gifts() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"list" | "settings" | "preview">("list");
  const [settings, setSettings] = useState<GiftSettings | null>(null);
  const [settingsDirty, setSettingsDirty] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const { data: coupleData } = trpc.couple.me.useQuery(undefined, {
    onSuccess: (d: any) => {
      if (!settings) {
        const s = (d.giftSettings as GiftSettings | null) ?? {};
        setSettings({ enabledMethods: DEFAULT_METHODS, ...s });
      }
    },
  } as any);

  const { data: guestData = [], isLoading: guestsLoading } = trpc.guest.list.useQuery();

  const updateGiftSettings = trpc.couple.updateGiftSettings.useMutation({
    onSuccess: () => { utils.couple.me.invalidate(); setSettingsDirty(false); toast.success("ההגדרות נשמרו"); },
    onError: (e) => toast.error(e.message),
  });

  const updateGuest = trpc.guest.update.useMutation({
    onSuccess: () => utils.guest.list.invalidate(),
    onError: (e) => toast.error(e.message),
  });

  const guests = (guestData as any[]).filter((g) => g.rsvpStatus === "yes" || g.giftAmount || g.giftNote);
  const filtered = guests.filter((g) => !search || g.name.toLowerCase().includes(search.toLowerCase()));
  const totalGifts = guests.reduce((s, g) => s + (parseFloat(g.giftAmount ?? "0") || 0), 0);
  const thankedCount = guests.filter((g) => g.thanked).length;
  const notThanked = guests.filter((g) => g.giftAmount && !g.thanked).length;

  const currentSettings: GiftSettings = settings ?? {};
  const enabledMethods = currentSettings.enabledMethods ?? DEFAULT_METHODS;

  function toggleMethod(id: string) {
    const updated = enabledMethods.includes(id) ? enabledMethods.filter(m => m !== id) : [...enabledMethods, id];
    setSettings(s => ({ ...s, enabledMethods: updated }));
    setSettingsDirty(true);
  }

  async function saveSettings() {
    if (!settings) return;
    setIsSavingSettings(true);
    try { await updateGiftSettings.mutateAsync(settings); }
    finally { setIsSavingSettings(false); }
  }

  const coupleName = coupleData
    ? currentSettings.displayName || `${(coupleData as any).name1} & ${(coupleData as any).name2}`
    : "";

  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: "#F8F6F2", fontFamily: "'Heebo', sans-serif" }}>
      <style>{`
        .gifts-tab { padding: 10px 20px; border: none; background: transparent; font-size: 14px; font-weight: 500; cursor: pointer; border-bottom: 2px solid transparent; color: #8B8B85; font-family: 'Heebo', sans-serif; transition: all 0.15s; }
        .gifts-tab.active { color: #3F4842; border-bottom-color: #3F4842; }
        .gifts-tab:hover:not(.active) { color: #5D6861; }
        .method-card { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: 12px; border: 1.5px solid #DDD8CE; background: #fff; cursor: pointer; transition: all 0.15s; }
        .method-card.active { background: #EFF5F1; border-color: #A8C3B0; }
        .method-toggle { width: 20px; height: 20px; border-radius: 50%; border: 2px solid #DDD8CE; flex-shrink: 0; transition: all 0.15s; display: flex; align-items: center; justify-content: center; }
        .method-card.active .method-toggle { background: #3F4842; border-color: #3F4842; }
        .method-card.active .method-toggle::after { content: "✓"; color: #fff; font-size: 11px; }
        .g-field-label { font-size: 12px; font-weight: 700; color: #5D6861; display: block; margin-bottom: 4px; }
        .g-field-input { width: 100%; border: 1px solid #DDD8CE; border-radius: 10px; padding: 8px 12px; font-size: 14px; font-family: 'Heebo', sans-serif; background: #fff; box-sizing: border-box; }
        .g-field-input:focus { outline: none; border-color: #A8C3B0; box-shadow: 0 0 0 3px rgba(168,195,176,0.2); }
        .g-field-help { font-size: 11px; color: #B0ADA5; margin-top: 3px; }
      `}</style>

      {/* Header */}
      <div style={{ background: "#3F4842", padding: "16px 24px", display: "flex", alignItems: "center", gap: 16 }}>
        <button onClick={() => navigate("/couple/dashboard")} style={{ background: "none", border: "none", color: "#A8C3B0", cursor: "pointer" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <h1 style={{ color: "#F8F6F2", fontFamily: "'Frank Ruhl Libre', serif", fontSize: 22, margin: 0 }}>מתנות</h1>
        {settingsDirty && activeTab === "settings" && (
          <button onClick={saveSettings} disabled={isSavingSettings} style={{ marginRight: "auto", background: "#A8C3B0", color: "#3F4842", border: "none", borderRadius: 9999, padding: "7px 18px", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
            {isSavingSettings ? "שומר..." : "💾 שמירה"}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ background: "#fff", borderBottom: "1px solid #E8E2D9", display: "flex", paddingRight: 24 }}>
        {[{ id: "list", label: "מעקב מתנות" }, { id: "settings", label: "הגדרות קופה" }, { id: "preview", label: "תצוגת אורח" }].map(t => (
          <button key={t.id} className={`gifts-tab${activeTab === t.id ? " active" : ""}`} onClick={() => setActiveTab(t.id as any)}>{t.label}</button>
        ))}
      </div>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "24px 16px" }}>

        {/* ─── Tab: List ─────────────────────────────────────────────────────── */}
        {activeTab === "list" && (
          <>
            <div style={{ background: "#fff8e8", border: "1px solid #D9C5A1", borderRadius: 12, padding: "10px 16px", marginBottom: 20, fontSize: 13, color: "#5D6861", display: "flex", gap: 8 }}>
              <span>ℹ️</span>
              <span><strong>VEYA לא מסלקת כסף.</strong> מעקב המתנות הוא לשימושך האישי בלבד — הסכומים לא עוברים דרך המערכת.</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
              {[
                { label: 'סה"כ מתנות (מדווח)', value: fmt(totalGifts), color: "#3F4842" },
                { label: "תודה נשלחה", value: `${thankedCount}`, color: "#5D8A6A" },
                { label: "ממתינים לתודה", value: `${notThanked}`, color: notThanked > 0 ? "#c0392b" : "#3F4842" },
              ].map(s => (
                <div key={s.label} style={{ background: "#fff", borderRadius: 18, padding: 16, textAlign: "center", boxShadow: "0 1px 2px rgba(45,45,45,.04), 0 8px 24px rgba(63,72,66,.06)" }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: s.color, fontFamily: "'Frank Ruhl Libre', serif" }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="חיפוש לפי שם..."
              style={{ width: "100%", padding: "10px 14px", borderRadius: 9999, border: "1px solid #e8e2d9", background: "#fff", fontSize: 14, fontFamily: "'Heebo', sans-serif", marginBottom: 16, boxSizing: "border-box" }} />
            {guestsLoading ? (
              <div style={{ textAlign: "center", padding: 40, color: "#888" }}>טוען...</div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40, color: "#888" }}>{guests.length === 0 ? "עדיין לא הוספת אורחים" : "אין אורחים מגיעים עדיין"}</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {filtered.map((g: any) => (
                  <div key={g.id} style={{ background: "#fff", borderRadius: 18, padding: "14px 18px", boxShadow: "0 1px 2px rgba(45,45,45,.04), 0 8px 24px rgba(63,72,66,.06)", display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: "#3F4842", fontSize: 15 }}>{g.name}</div>
                      {g.giftNote && <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{g.giftNote}</div>}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 13, color: "#888" }}>₪</span>
                      <input type="number" defaultValue={g.giftAmount ?? ""} placeholder="סכום"
                        onBlur={e => { const val = e.target.value; if (val !== (g.giftAmount ?? "")) updateGuest.mutate({ id: g.id, giftAmount: val || undefined }); }}
                        style={{ width: 80, padding: "4px 8px", borderRadius: 9999, border: "1px solid #e8e2d9", fontSize: 13, textAlign: "center", fontFamily: "'Heebo', sans-serif" }} />
                    </div>
                    <button onClick={() => updateGuest.mutate({ id: g.id, thanked: !g.thanked })} style={{ background: g.thanked ? "#A8C3B0" : "#F8F6F2", border: "1px solid #e8e2d9", borderRadius: 9999, padding: "5px 14px", cursor: "pointer", fontSize: 12, color: "#3F4842", transition: "background 0.15s" }}>
                      {g.thanked ? "✓ תודה נשלחה" : 'סמן כ"תודה נשלחה"'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ─── Tab: Settings ─────────────────────────────────────────────────── */}
        {activeTab === "settings" && settings && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ background: "#fff", borderRadius: 18, padding: 24, boxShadow: "0 1px 2px rgba(45,45,45,.04), 0 8px 24px rgba(63,72,66,.06)" }}>
              <div style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 20, color: "#3F4842", marginBottom: 4 }}>הגדרות הקופה</div>
              <div style={{ fontSize: 13, color: "#8B8B85", marginBottom: 20 }}>מי מקבל · איך · ומה רואים האורחים</div>

              <div style={{ marginBottom: 14 }}>
                <label className="g-field-label">שם להצגה לאורחים</label>
                <input className="g-field-input" value={settings.displayName ?? ""} placeholder={coupleName}
                  onChange={e => { setSettings(s => ({ ...s, displayName: e.target.value })); setSettingsDirty(true); }} />
                <div className="g-field-help">השם הזה יוצג בעמוד התשלום של האורח</div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label className="g-field-label">חשבון בנק (להעברה ישירה)</label>
                <input className="g-field-input" value={settings.bankAccount ?? ""} placeholder="בנק לאומי · 10-805-432109"
                  onChange={e => { setSettings(s => ({ ...s, bankAccount: e.target.value })); setSettingsDirty(true); }} />
                <div className="g-field-help">מספר בנק · סניף · חשבון</div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label className="g-field-label">Bit · מספר טלפון</label>
                <input className="g-field-input" value={settings.bitPhone ?? ""} placeholder="050-432-1246"
                  onChange={e => { setSettings(s => ({ ...s, bitPhone: e.target.value })); setSettingsDirty(true); }} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label className="g-field-label">PayBox · משתמש</label>
                <input className="g-field-input" value={settings.payboxUser ?? ""} placeholder="@yourname-wedding"
                  onChange={e => { setSettings(s => ({ ...s, payboxUser: e.target.value })); setSettingsDirty(true); }} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label className="g-field-label">PayPal · אימייל (לאורחים מחו"ל)</label>
                <input className="g-field-input" value={settings.paypalEmail ?? ""} placeholder="your@email.com"
                  onChange={e => { setSettings(s => ({ ...s, paypalEmail: e.target.value })); setSettingsDirty(true); }} />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label className="g-field-label">מסר תודה אישי</label>
                <textarea className="g-field-input" value={settings.thankYouMessage ?? ""} rows={3}
                  placeholder="תודה ענקית שבאתם לחגוג איתנו!"
                  onChange={e => { setSettings(s => ({ ...s, thankYouMessage: e.target.value })); setSettingsDirty(true); }}
                  style={{ resize: "vertical" }} />
                <div className="g-field-help">יוצג לאורח אחרי שמסר פרטי מתנה</div>
              </div>
              <div>
                <label className="g-field-label" style={{ marginBottom: 10 }}>שיטות תשלום פעילות</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {ALL_METHODS.map(m => (
                    <div key={m.id} className={`method-card${enabledMethods.includes(m.id) ? " active" : ""}`} onClick={() => toggleMethod(m.id)}>
                      <div className="method-toggle" />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#2D2D2D" }}>{m.label}</div>
                        <div style={{ fontSize: 11, color: "#8B8B85" }}>{m.meta}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {settingsDirty && (
                <button onClick={saveSettings} disabled={isSavingSettings} style={{ marginTop: 20, width: "100%", background: "#3F4842", color: "#F8F6F2", border: "none", borderRadius: 9999, padding: "10px 0", cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: "'Heebo', sans-serif" }}>
                  {isSavingSettings ? "שומר..." : "💾 שמירת הגדרות"}
                </button>
              )}
            </div>
            <div>
              <div style={{ fontSize: 12, color: "#8B8B85", textAlign: "center", marginBottom: 12 }}>תצוגה מקדימה — כך יראה האורח</div>
              <GuestPreviewCard settings={settings} coupleName={coupleName} />
            </div>
          </div>
        )}

        {/* ─── Tab: Preview ──────────────────────────────────────────────────── */}
        {activeTab === "preview" && (
          <div>
            <div style={{ fontSize: 13, color: "#8B8B85", textAlign: "center", marginBottom: 20 }}>
              כך נראה עמוד המתנה לאורח — הוא מגיע אליו דרך הזמנה דיגיטלית
            </div>
            <GuestPreviewCard settings={currentSettings} coupleName={coupleName} />
          </div>
        )}
      </div>
    </div>
  );
}
