import { useLocation } from "wouter";

export default function NotFound() {
  const [, navigate] = useLocation();

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--cream)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 24px",
      textAlign: "center",
    }}>
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 40 }}>
        <svg width="26" height="26" viewBox="0 0 40 40" fill="none" stroke="var(--sand)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 10 L20 30 L32 10" />
          <path d="M14 14 L20 22 L26 14" opacity="0.6" />
        </svg>
        <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "var(--moss)", letterSpacing: 6 }}>VEYA</span>
      </div>

      {/* 404 number */}
      <div style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 96, color: "var(--border)", fontWeight: 400, lineHeight: 1, marginBottom: 16 }}>
        404
      </div>

      <h1 style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 28, color: "var(--moss)", fontWeight: 400, marginBottom: 10 }}>
        הדף לא נמצא
      </h1>
      <p style={{ fontSize: 14, color: "var(--forest)", lineHeight: 1.7, maxWidth: 320, marginBottom: 32 }}>
        הדף שחיפשתם לא קיים או שהקישור שגוי. נסו לחזור לדף הבית.
      </p>

      <button
        onClick={() => navigate("/")}
        style={{
          background: "var(--moss)",
          color: "var(--cream)",
          border: "none",
          borderRadius: 4,
          padding: "12px 28px",
          fontSize: 14,
          fontWeight: 500,
          cursor: "pointer",
          fontFamily: "inherit",
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          transition: "background 0.2s",
        }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "var(--charcoal)")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "var(--moss)")}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12 L12 4 L21 12 M5 10 V20 H19 V10" />
        </svg>
        חזרה לדף הבית
      </button>
    </div>
  );
}
