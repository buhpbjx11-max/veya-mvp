import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

// ─── Icons ───────────────────────────────────────────────────────────────────
const IcoSend = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);
const IcoBack = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);
const IcoVenue = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9 L12 3 L21 9 V20 H3 Z" /><rect x="9" y="14" width="6" height="6" />
  </svg>
);

const CARD_STYLE: React.CSSProperties = {
  background: "#FFFFFF",
  borderRadius: 18,
  boxShadow: "0 2px 12px rgba(63,72,66,.07), 0 1px 3px rgba(63,72,66,.05)",
  border: "1px solid #EFEDE7",
};

export default function Chat() {
  const [, navigate] = useLocation();
  const [msg, setMsg] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const coupleQuery = trpc.couple.me.useQuery();
  const couple = coupleQuery.data;
  const isVenueLinked = couple?.type === "venue_linked";

  // Get wedding id for venue_linked couples
  const weddingQuery = trpc.wedding.forCouple.useQuery(undefined, {
    enabled: isVenueLinked,
  });
  const weddingId = (weddingQuery.data as { id?: number } | undefined)?.id;

  const messagesQuery = trpc.message.list.useQuery(
    { weddingId: weddingId! },
    { enabled: !!weddingId, refetchInterval: 5000 }
  );
  const messages = messagesQuery.data ?? [];

  const sendMutation = trpc.message.send.useMutation({
    onSuccess: () => {
      setMsg("");
      messagesQuery.refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!msg.trim() || !weddingId) return;
    sendMutation.mutate({ weddingId, content: msg.trim() });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (ts: Date | string) => {
    const d = new Date(ts);
    return d.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
  };
  const formatDate = (ts: Date | string) => {
    const d = new Date(ts);
    return d.toLocaleDateString("he-IL", { day: "numeric", month: "long" });
  };

  // Group messages by date
  const grouped: { date: string; msgs: typeof messages }[] = [];
  for (const m of messages) {
    const dateStr = formatDate(m.createdAt);
    const last = grouped[grouped.length - 1];
    if (last && last.date === dateStr) last.msgs.push(m);
    else grouped.push({ date: dateStr, msgs: [m] });
  }

  const myUserId = couple?.userId;

  return (
    <div style={{ minHeight: "100vh", background: "#F8F6F2", display: "flex", flexDirection: "column", fontFamily: "'Heebo', sans-serif", direction: "rtl" }}>
      {/* Header */}
      <div style={{ background: "#3F4842", padding: "0 28px", height: 64, display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
        <button
          onClick={() => navigate("/couple/dashboard")}
          style={{ background: "transparent", border: "none", color: "rgba(248,246,242,.7)", cursor: "pointer", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6 }}
        >
          <IcoBack />
        </button>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: "#D9C5A1", color: "#3F4842", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ width: 18, height: 18 }}><IcoVenue /></span>
        </div>
        <div>
          <div style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 16, color: "#F8F6F2", fontWeight: 500 }}>
            {isVenueLinked ? "צ'אט עם האולם" : "הודעות"}
          </div>
          <div style={{ fontSize: 11.5, color: "rgba(248,246,242,.55)" }}>
            {isVenueLinked ? "שיחה פרטית עם צוות האולם" : "זמין לזוגות מקושרים לאולם"}
          </div>
        </div>
        <div style={{ marginRight: "auto" }}>
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: 18, color: "#D9C5A1" }}>VEYA</span>
        </div>
      </div>

      {/* Not venue_linked state */}
      {!isVenueLinked && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40, gap: 16 }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: "#EFEDE7", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ width: 28, height: 28, color: "#A8C3B0" }}><IcoVenue /></span>
          </div>
          <div style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 22, color: "#3F4842", textAlign: "center" }}>
            הצ'אט זמין לזוגות מקושרים לאולם
          </div>
          <div style={{ fontSize: 14, color: "#5D6861", textAlign: "center", maxWidth: 360 }}>
            כשהאולם שלכם ישלח לכם קישור VEYA ותתחברו, תוכלו לשלוח הודעות ישירות לצוות האולם מכאן.
          </div>
          <button
            onClick={() => navigate("/couple/dashboard")}
            style={{ background: "#3F4842", color: "#F8F6F2", border: "none", borderRadius: 9999, padding: "10px 24px", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", marginTop: 8 }}
          >
            חזרה לדשבורד
          </button>
        </div>
      )}

      {/* Chat area */}
      {isVenueLinked && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", maxWidth: 760, width: "100%", margin: "0 auto", padding: "24px 24px 0" }}>
          {/* Messages */}
          <div style={{ ...CARD_STYLE, flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", marginBottom: 16 }}>
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 4 }}>
              {messagesQuery.isLoading && (
                <div style={{ textAlign: "center", color: "#8B8B85", fontSize: 13, padding: 20 }}>טוען הודעות...</div>
              )}
              {!messagesQuery.isLoading && messages.length === 0 && (
                <div style={{ textAlign: "center", padding: "40px 0", color: "#8B8B85" }}>
                  <div style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 18, color: "#3F4842", marginBottom: 8 }}>
                    אין הודעות עדיין
                  </div>
                  <div style={{ fontSize: 13 }}>שלחו הודעה ראשונה לצוות האולם</div>
                </div>
              )}
              {grouped.map((group) => (
                <div key={group.date}>
                  {/* Date separator */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "16px 0 12px" }}>
                    <div style={{ flex: 1, height: 1, background: "#EFEDE7" }} />
                    <span style={{ fontSize: 11, color: "#8B8B85", background: "#F8F6F2", padding: "2px 10px", borderRadius: 9999, border: "1px solid #EFEDE7" }}>
                      {group.date}
                    </span>
                    <div style={{ flex: 1, height: 1, background: "#EFEDE7" }} />
                  </div>
                  {group.msgs.map((m) => {
                    const isMe = m.senderId === myUserId;
                    return (
                      <div
                        key={m.id}
                        style={{ display: "flex", flexDirection: isMe ? "row-reverse" : "row", alignItems: "flex-end", gap: 8, marginBottom: 8 }}
                      >
                        {/* Avatar */}
                        <div style={{
                          width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                          background: isMe ? "#A8C3B0" : "#D9C5A1",
                          color: "#3F4842",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 11, fontWeight: 600,
                        }}>
                          {isMe ? "א" : "ו"}
                        </div>
                        {/* Bubble */}
                        <div style={{
                          maxWidth: "68%",
                          background: isMe ? "#3F4842" : "#FFFFFF",
                          color: isMe ? "#F8F6F2" : "#3F4842",
                          borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                          padding: "10px 14px",
                          fontSize: 14,
                          lineHeight: 1.55,
                          boxShadow: "0 1px 4px rgba(63,72,66,.08)",
                          border: isMe ? "none" : "1px solid #EFEDE7",
                        }}>
                          {!isMe && (
                            <div style={{ fontSize: 11, color: "#8B8B85", marginBottom: 3, fontWeight: 500 }}>
                              {m.senderName ?? "האולם"}
                            </div>
                          )}
                          <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{m.content}</div>
                          <div style={{ fontSize: 10.5, color: isMe ? "rgba(248,246,242,.5)" : "#8B8B85", marginTop: 4, textAlign: "left" }}>
                            {formatTime(m.createdAt)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={{ borderTop: "1px solid #EFEDE7", padding: "14px 20px", display: "flex", gap: 10, alignItems: "flex-end" }}>
              <textarea
                ref={inputRef}
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="כתבו הודעה... (Enter לשליחה, Shift+Enter לשורה חדשה)"
                rows={1}
                style={{
                  flex: 1, border: "1px solid #EFEDE7", borderRadius: 12, padding: "10px 14px",
                  fontSize: 14, fontFamily: "inherit", resize: "none", outline: "none",
                  background: "#FAFAF8", color: "#3F4842", direction: "rtl",
                  minHeight: 42, maxHeight: 120, overflowY: "auto",
                  transition: "border-color 0.15s",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#A8C3B0")}
                onBlur={(e) => (e.target.style.borderColor = "#EFEDE7")}
              />
              <button
                onClick={handleSend}
                disabled={!msg.trim() || sendMutation.isPending}
                style={{
                  width: 42, height: 42, borderRadius: "50%", border: "none",
                  background: msg.trim() ? "#3F4842" : "#EFEDE7",
                  color: msg.trim() ? "#F8F6F2" : "#8B8B85",
                  cursor: msg.trim() ? "pointer" : "default",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, transition: "all 0.15s",
                }}
              >
                <span style={{ width: 16, height: 16 }}><IcoSend /></span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
