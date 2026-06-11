import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function Gifts() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const [search, setSearch] = useState("");

  const { data: guests = [], isLoading } = trpc.guest.list.useQuery();
  const updateGuest = trpc.guest.update.useMutation({
    onSuccess: () => { utils.guest.list.invalidate(); toast.success("עודכן"); },
    onError: (e) => toast.error(e.message),
  });

  if (!user) { navigate("/"); return null; }

  // Only show guests who attended (yes) or have a gift recorded
  const giftGuests = guests.filter(g =>
    g.rsvpStatus === "yes" || g.giftAmount || g.giftNote
  );

  const filtered = giftGuests.filter(g =>
    !search || g.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalGifts = giftGuests.filter(g => g.giftAmount).reduce((s, g) => s + parseFloat(g.giftAmount ?? "0"), 0);
  const thankedCount = giftGuests.filter(g => g.thanked).length;
  const notThanked = giftGuests.filter(g => g.giftAmount && !g.thanked).length;

  const fmt = (n: number) => n.toLocaleString("he-IL", { style: "currency", currency: "ILS", maximumFractionDigits: 0 });

  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: "#F8F6F2", fontFamily: "'Heebo', sans-serif" }}>
      <div style={{ background: "#3F4842", padding: "16px 24px", display: "flex", alignItems: "center", gap: 16 }}>
        <button onClick={() => navigate("/couple/dashboard")} style={{ background: "none", border: "none", color: "#A8C3B0", cursor: "pointer" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <h1 style={{ color: "#F8F6F2", fontFamily: "'Frank Ruhl Libre', serif", fontSize: 22, margin: 0 }}>מתנות</h1>
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "24px 16px" }}>
        {/* Note */}
        <div style={{ background: "#fff8e8", border: "1px solid #D9C5A1", borderRadius: 12, padding: "10px 16px", marginBottom: 20, fontSize: 13, color: "#5D6861" }}>
          <strong>שימי לב:</strong> VEYA לא מסלקת כסף. מעקב המתנות הוא לשימושך האישי בלבד — הסכומים לא עוברים דרך המערכת.
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
          {[
            { label: "סה\"כ מתנות (מדווח)", value: fmt(totalGifts) },
            { label: "תודה נשלחה", value: `${thankedCount}` },
            { label: "ממתינים לתודה", value: `${notThanked}`, alert: notThanked > 0 },
          ].map(s => (
            <div key={s.label} style={{ background: "#fff", borderRadius: 18, padding: 16, textAlign: "center", boxShadow: "0 1px 2px rgba(45,45,45,.04), 0 8px 24px rgba(63,72,66,.06)" }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: s.alert ? "#c0392b" : "#3F4842" }}>{s.value}</div>
              <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="חיפוש לפי שם..."
          style={{ width: "100%", padding: "10px 14px", borderRadius: 9999, border: "1px solid #e8e2d9", background: "#fff", fontSize: 14, fontFamily: "'Heebo', sans-serif", marginBottom: 16, boxSizing: "border-box" }}
        />

        {isLoading ? (
          <div style={{ textAlign: "center", padding: 40, color: "#888" }}>טוען...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: "#888" }}>
            {guests.length === 0 ? "עדיין לא הוספת אורחים" : "אין אורחים מגיעים עדיין"}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filtered.map(g => (
              <div key={g.id} style={{
                background: "#fff", borderRadius: 18, padding: "14px 18px",
                boxShadow: "0 1px 2px rgba(45,45,45,.04), 0 8px 24px rgba(63,72,66,.06)",
                display: "flex", alignItems: "center", gap: 12,
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: "#3F4842", fontSize: 15 }}>{g.name}</div>
                  {g.giftNote && <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{g.giftNote}</div>}
                </div>

                {/* Gift amount input */}
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 13, color: "#888" }}>₪</span>
                  <input
                    type="number"
                    defaultValue={g.giftAmount ?? ""}
                    placeholder="סכום"
                    onBlur={e => {
                      const val = e.target.value;
                      if (val !== (g.giftAmount ?? "")) {
                        updateGuest.mutate({ id: g.id, giftAmount: val || undefined });
                      }
                    }}
                    style={{ width: 80, padding: "4px 8px", borderRadius: 9999, border: "1px solid #e8e2d9", fontSize: 13, textAlign: "center", fontFamily: "'Heebo', sans-serif" }}
                  />
                </div>

                {/* Thanked toggle */}
                <button onClick={() => updateGuest.mutate({ id: g.id, thanked: !g.thanked })} style={{
                  background: g.thanked ? "#A8C3B0" : "#F8F6F2",
                  border: "1px solid #e8e2d9", borderRadius: 9999,
                  padding: "4px 12px", cursor: "pointer", fontSize: 12, color: "#3F4842",
                  transition: "background 0.15s",
                }}>
                  {g.thanked ? "תודה נשלחה ✓" : "סמן כ\"תודה נשלחה\""}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
