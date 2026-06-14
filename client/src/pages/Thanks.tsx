import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { toast } from "sonner";

/* ── Icons ── */
const IcoBack = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>;
const IcoCheck = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>;
const IcoEdit = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>;
const IcoGift = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12" /><rect x="2" y="7" width="20" height="5" /><line x1="12" y1="22" x2="12" y2="7" /><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" /><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" /></svg>;
const IcoSearch = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>;
const IcoFilter = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>;
const IcoHeart = () => <svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>;

const CARD = {
  background: "#fff",
  border: "1px solid #EFEDE7",
  borderRadius: 18,
  boxShadow: "0 1px 2px rgba(45,45,45,.04), 0 8px 24px rgba(63,72,66,.06)",
};

type Filter = "all" | "pending" | "thanked" | "with_gift";

export default function Thanks() {
  const { user } = useAuth({ redirectOnUnauthenticated: true });
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editNote, setEditNote] = useState("");

  const utils = trpc.useUtils();
  const { data: guests = [], isLoading } = trpc.thanks.list.useQuery(undefined, { enabled: !!user });

  const markThanked = trpc.thanks.markThanked.useMutation({
    onMutate: async ({ guestId, thanked }) => {
      await utils.thanks.list.cancel();
      const prev = utils.thanks.list.getData();
      utils.thanks.list.setData(undefined, (old) =>
        old?.map((g) => g.id === guestId ? { ...g, thanked } : g)
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      utils.thanks.list.setData(undefined, ctx?.prev);
      toast.error("שגיאה בעדכון");
    },
    onSettled: () => utils.thanks.list.invalidate(),
  });

  const updateGift = trpc.thanks.updateGift.useMutation({
    onSuccess: () => {
      utils.thanks.list.invalidate();
      setEditingId(null);
      toast.success("פרטי המתנה עודכנו");
    },
    onError: (err) => toast.error(err.message),
  });

  const filtered = useMemo(() => {
    let list = guests;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((g) => g.name.toLowerCase().includes(q));
    }
    if (filter === "pending") list = list.filter((g) => !g.thanked);
    if (filter === "thanked") list = list.filter((g) => g.thanked);
    if (filter === "with_gift") list = list.filter((g) => g.giftAmount && Number(g.giftAmount) > 0);
    return list;
  }, [guests, search, filter]);

  const stats = useMemo(() => {
    const total = guests.length;
    const thanked = guests.filter((g) => g.thanked).length;
    const withGift = guests.filter((g) => g.giftAmount && Number(g.giftAmount) > 0).length;
    const totalGifts = guests.reduce((sum, g) => sum + (g.giftAmount ? Number(g.giftAmount) : 0), 0);
    return { total, thanked, withGift, totalGifts };
  }, [guests]);

  const startEdit = (g: (typeof guests)[0]) => {
    setEditingId(g.id);
    setEditAmount(g.giftAmount ? String(g.giftAmount) : "");
    setEditNote(g.giftNote ?? "");
  };

  const saveEdit = () => {
    if (!editingId) return;
    updateGift.mutate({
      guestId: editingId,
      giftAmount: editAmount || null,
      giftNote: editNote || null,
    });
  };

  if (isLoading) return (
    <div style={{ minHeight: "100vh", background: "#F8F6F2", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#5D6861", fontFamily: "Heebo, sans-serif" }}>טוען...</div>
    </div>
  );

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
            ניהול תודות
          </div>
          <h1 style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 28, color: "#3F4842", margin: 0, fontWeight: 500 }}>
            תודות לאורחים
          </h1>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        {[
          { label: "סה״כ אורחים", value: stats.total, color: "#3F4842" },
          { label: "תודות נשלחו", value: stats.thanked, color: "#A8C3B0" },
          { label: "ממתינים לתודה", value: stats.total - stats.thanked, color: "#D9C5A1" },
          { label: "סה״כ מתנות", value: `₪${stats.totalGifts.toLocaleString("he-IL")}`, color: "#5D6861" },
        ].map((s) => (
          <div key={s.label} style={{ ...CARD, padding: "20px 24px" }}>
            <div style={{ fontFamily: "Heebo, sans-serif", fontSize: 11, color: "#A8C3B0", letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 28, color: s.color, fontWeight: 500 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      {stats.total > 0 && (
        <div style={{ ...CARD, padding: "16px 24px", marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontFamily: "Heebo, sans-serif", fontSize: 13, color: "#5D6861" }}>התקדמות תודות</span>
            <span style={{ fontFamily: "Heebo, sans-serif", fontSize: 13, color: "#3F4842", fontWeight: 600 }}>
              {Math.round((stats.thanked / stats.total) * 100)}%
            </span>
          </div>
          <div style={{ height: 8, background: "#EFEDE7", borderRadius: 99 }}>
            <div style={{ height: "100%", background: "linear-gradient(90deg, #A8C3B0, #5D6861)", borderRadius: 99, width: `${(stats.thanked / stats.total) * 100}%`, transition: "width 0.4s ease" }} />
          </div>
        </div>
      )}

      {/* Filters + Search */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "#A8C3B0" }}><IcoSearch /></span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="חיפוש לפי שם..."
            style={{ width: "100%", padding: "10px 40px 10px 16px", border: "1px solid #EFEDE7", borderRadius: 99, fontFamily: "Heebo, sans-serif", fontSize: 14, background: "#fff", outline: "none", boxSizing: "border-box" }}
          />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {(["all", "pending", "thanked", "with_gift"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "8px 16px", borderRadius: 99, border: "1px solid",
                borderColor: filter === f ? "#3F4842" : "#EFEDE7",
                background: filter === f ? "#3F4842" : "#fff",
                color: filter === f ? "#F8F6F2" : "#5D6861",
                fontFamily: "Heebo, sans-serif", fontSize: 13, cursor: "pointer",
              }}
            >
              {{ all: "הכל", pending: "ממתינים", thanked: "נשלחה תודה", with_gift: "עם מתנה" }[f]}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={CARD}>
        {filtered.length === 0 ? (
          <div style={{ padding: "60px 24px", textAlign: "center", color: "#A8C3B0", fontFamily: "Heebo, sans-serif" }}>
            {search ? "לא נמצאו אורחים תואמים" : "אין אורחים להצגה"}
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #EFEDE7" }}>
                {["שם", "מספר אורחים", "סכום מתנה", "הערה", "תודה נשלחה", "פעולות"].map((h) => (
                  <th key={h} style={{ padding: "14px 20px", fontFamily: "Heebo, sans-serif", fontSize: 12, color: "#A8C3B0", fontWeight: 600, textAlign: "right", letterSpacing: 0.5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((guest) => (
                <tr
                  key={guest.id}
                  style={{ borderBottom: "1px solid #EFEDE7", background: guest.thanked ? "rgba(168,195,176,.04)" : "transparent", transition: "background 0.15s" }}
                  onMouseEnter={(e) => { if (!guest.thanked) e.currentTarget.style.background = "rgba(168,195,176,.06)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = guest.thanked ? "rgba(168,195,176,.04)" : "transparent"; }}
                >
                  <td style={{ padding: "14px 20px", fontFamily: "Heebo, sans-serif", fontSize: 14, color: "#3F4842", fontWeight: 500 }}>
                    {guest.name}
                  </td>
                  <td style={{ padding: "14px 20px", fontFamily: "Heebo, sans-serif", fontSize: 14, color: "#5D6861" }}>
                    {guest.count}
                  </td>
                  <td style={{ padding: "14px 20px", fontFamily: "Heebo, sans-serif", fontSize: 14, color: "#3F4842" }}>
                    {editingId === guest.id ? (
                      <input
                        type="number"
                        value={editAmount}
                        onChange={(e) => setEditAmount(e.target.value)}
                        placeholder="₪"
                        style={{ width: 90, padding: "4px 8px", border: "1px solid #D9C5A1", borderRadius: 6, fontFamily: "Heebo, sans-serif", fontSize: 13 }}
                      />
                    ) : (
                      guest.giftAmount ? `₪${Number(guest.giftAmount).toLocaleString("he-IL")}` : <span style={{ color: "#C8C4BC", fontSize: 12 }}>לא צוין</span>
                    )}
                  </td>
                  <td style={{ padding: "14px 20px", fontFamily: "Heebo, sans-serif", fontSize: 13, color: "#5D6861", maxWidth: 180 }}>
                    {editingId === guest.id ? (
                      <input
                        value={editNote}
                        onChange={(e) => setEditNote(e.target.value)}
                        placeholder="הערה..."
                        style={{ width: "100%", padding: "4px 8px", border: "1px solid #D9C5A1", borderRadius: 6, fontFamily: "Heebo, sans-serif", fontSize: 13 }}
                      />
                    ) : (
                      guest.giftNote || <span style={{ color: "#C8C4BC", fontSize: 12 }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: "14px 20px" }}>
                    <button
                      onClick={() => markThanked.mutate({ guestId: guest.id, thanked: !guest.thanked })}
                      style={{
                        width: 32, height: 32, borderRadius: "50%", border: "none", cursor: "pointer",
                        background: guest.thanked ? "#A8C3B0" : "#EFEDE7",
                        color: guest.thanked ? "#fff" : "#A8C3B0",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "all 0.2s",
                      }}
                      title={guest.thanked ? "בטל תודה" : "סמן כנשלחה תודה"}
                    >
                      <span style={{ width: 14, height: 14 }}>{guest.thanked ? <IcoCheck /> : <IcoHeart />}</span>
                    </button>
                  </td>
                  <td style={{ padding: "14px 20px" }}>
                    {editingId === guest.id ? (
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          onClick={saveEdit}
                          disabled={updateGift.isPending}
                          style={{ padding: "6px 14px", background: "#3F4842", color: "#F8F6F2", border: "none", borderRadius: 99, fontFamily: "Heebo, sans-serif", fontSize: 12, cursor: "pointer" }}
                        >
                          שמור
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          style={{ padding: "6px 14px", background: "transparent", color: "#5D6861", border: "1px solid #EFEDE7", borderRadius: 99, fontFamily: "Heebo, sans-serif", fontSize: 12, cursor: "pointer" }}
                        >
                          ביטול
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEdit(guest)}
                        style={{ background: "transparent", border: "none", cursor: "pointer", color: "#A8C3B0", width: 18, height: 18, padding: 0 }}
                        title="עריכת פרטי מתנה"
                      >
                        <IcoEdit />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Summary */}
      {stats.total > 0 && (
        <div style={{ marginTop: 20, padding: "14px 20px", background: "rgba(168,195,176,.08)", borderRadius: 12, display: "flex", gap: 24, flexWrap: "wrap" }}>
          <span style={{ fontFamily: "Heebo, sans-serif", fontSize: 13, color: "#5D6861" }}>
            <strong style={{ color: "#3F4842" }}>{stats.thanked}</strong> מתוך <strong style={{ color: "#3F4842" }}>{stats.total}</strong> אורחים קיבלו תודה
          </span>
          {stats.withGift > 0 && (
            <span style={{ fontFamily: "Heebo, sans-serif", fontSize: 13, color: "#5D6861" }}>
              <strong style={{ color: "#3F4842" }}>{stats.withGift}</strong> אורחים שלחו מתנה · סה״כ <strong style={{ color: "#3F4842" }}>₪{stats.totalGifts.toLocaleString("he-IL")}</strong>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
