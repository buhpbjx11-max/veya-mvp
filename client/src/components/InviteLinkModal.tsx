import { useState } from "react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  inviteUrl: string;
  coupleNames: string;
  onClose: () => void;
}

export default function InviteLinkModal({ open, inviteUrl, coupleNames, onClose }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      toast.success("הקישור הועתק!");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("לא ניתן להעתיק — העתיקו ידנית");
    }
  };

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1100,
        background: "rgba(45,45,45,.45)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20,
        backdropFilter: "blur(2px)",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      dir="rtl"
    >
      <div style={{
        background: "#fff",
        borderRadius: 18,
        boxShadow: "0 2px 4px rgba(45,45,45,.08), 0 20px 60px rgba(63,72,66,.18)",
        padding: "36px 40px",
        width: "100%",
        maxWidth: 480,
        textAlign: "center",
      }}>
        {/* Success icon */}
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#DDEAE0", color: "#3F4842", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: 12, color: "#8B8B85", letterSpacing: 2, marginBottom: 6 }}>
          • Invite Link
        </div>
        <h2 style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 26, color: "#3F4842", fontWeight: 400, marginBottom: 6 }}>
          החתונה נוצרה!
        </h2>
        <p style={{ fontSize: 14, color: "#5D6861", marginBottom: 24, lineHeight: 1.7 }}>
          שלחו את הקישור הבא ל<strong>{coupleNames}</strong> כדי שיוכלו להצטרף ולקבל גישה לכל הכלים.
        </p>

        {/* Link box */}
        <div style={{
          background: "#F8F6F2",
          border: "1.5px solid #EFEDE7",
          borderRadius: 10,
          padding: "12px 16px",
          fontSize: 12.5,
          color: "#3F4842",
          wordBreak: "break-all",
          textAlign: "right",
          marginBottom: 16,
          fontFamily: "monospace",
          lineHeight: 1.6,
        }}>
          {inviteUrl}
        </div>

        {/* Copy button */}
        <button
          onClick={handleCopy}
          style={{
            width: "100%",
            background: copied ? "#DDEAE0" : "#3F4842",
            color: copied ? "#3F4842" : "#F8F6F2",
            border: "none",
            borderRadius: 9999,
            padding: "13px",
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer",
            fontFamily: "inherit",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            transition: "all 0.18s",
            marginBottom: 12,
          }}
        >
          {copied ? (
            <>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              הועתק!
            </>
          ) : (
            <>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              העתקת קישור
            </>
          )}
        </button>

        <button
          onClick={onClose}
          style={{
            width: "100%",
            background: "transparent",
            border: "1px solid #EFEDE7",
            borderRadius: 9999,
            padding: "11px",
            fontSize: 13.5,
            color: "#5D6861",
            cursor: "pointer",
            fontFamily: "inherit",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#F8F6F2")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "transparent")}
        >
          סגירה
        </button>

        <p style={{ fontSize: 11.5, color: "#8B8B85", marginTop: 16, lineHeight: 1.6 }}>
          ניתן לשלוח את הקישור ב-WhatsApp, SMS או אימייל. הקישור תקף ללא הגבלת זמן.
        </p>
      </div>
    </div>
  );
}
