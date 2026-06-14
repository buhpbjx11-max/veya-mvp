import { useState, useRef } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function GuestPhotoUpload() {
  const { token } = useParams<{ token: string }>();
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(0);
  const [caption, setCaption] = useState("");
  const [done, setDone] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const guestUpload = trpc.photo.guestUpload.useMutation({
    onError: (e) => toast.error(e.message),
  });

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0 || !token) return;
    setUploading(true);
    let count = 0;
    for (const file of Array.from(files)) {
      if (file.size > 16 * 1024 * 1024) { toast.error(`${file.name} גדול מ-16MB`); continue; }
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/upload/photo-direct", { method: "POST", body: formData });
        if (!res.ok) throw new Error("שגיאת העלאה");
        const { key, url } = await res.json();
        await guestUpload.mutateAsync({ token, fileKey: key, url, caption: caption || undefined });
        count++;
        setUploaded(c => c + 1);
      } catch (e: any) {
        toast.error(`שגיאה: ${e.message}`);
      }
    }
    setUploading(false);
    if (count > 0) setDone(true);
  }

  if (done) {
    return (
      <div dir="rtl" style={{ minHeight: "100vh", background: "#F8F6F2", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Heebo', sans-serif" }}>
        <div style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
          <div style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 28, color: "#3F4842", marginBottom: 8 }}>תודה!</div>
          <div style={{ fontSize: 15, color: "#5D6861", marginBottom: 24 }}>
            {uploaded} תמונות הועלו בהצלחה לגלריית החתונה
          </div>
          <button onClick={() => { setDone(false); setUploaded(0); setCaption(""); }}
            style={{ background: "#3F4842", color: "#F8F6F2", border: "none", borderRadius: 9999, padding: "10px 24px", cursor: "pointer", fontSize: 14, fontFamily: "'Heebo', sans-serif" }}>
            העלה עוד תמונות
          </button>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: "#F8F6F2", fontFamily: "'Heebo', sans-serif" }}>
      <div style={{ background: "#3F4842", padding: "20px 24px", textAlign: "center" }}>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: 13, color: "#A8C3B0", letterSpacing: 2, marginBottom: 4 }}>VEYA</div>
        <h1 style={{ color: "#F8F6F2", fontFamily: "'Frank Ruhl Libre', serif", fontSize: 24, margin: 0 }}>שתפו תמונות מהחתונה</h1>
        <div style={{ color: "rgba(248,246,242,0.6)", fontSize: 13, marginTop: 6 }}>התמונות שלכם יצטרפו לגלריית הזוג</div>
      </div>

      <div style={{ maxWidth: 480, margin: "32px auto", padding: "0 16px" }}>
        <div
          style={{ border: "2px dashed #A8C3B0", borderRadius: 16, padding: "40px 24px", textAlign: "center", cursor: "pointer", background: "#fff", transition: "all 0.15s" }}
          onDragOver={e => { e.preventDefault(); e.currentTarget.style.background = "#EFF5F1"; }}
          onDragLeave={e => { e.currentTarget.style.background = "#fff"; }}
          onDrop={e => { e.preventDefault(); e.currentTarget.style.background = "#fff"; handleFiles(e.dataTransfer.files); }}
          onClick={() => fileInputRef.current?.click()}>
          <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={e => handleFiles(e.target.files)} />
          <div style={{ fontSize: 48, marginBottom: 12 }}>📷</div>
          <div style={{ fontSize: 18, color: "#3F4842", fontFamily: "'Frank Ruhl Libre', serif", marginBottom: 6 }}>
            {uploading ? `מעלה... (${uploaded} הועלו)` : "לחצו לבחירת תמונות"}
          </div>
          <div style={{ fontSize: 13, color: "#8B8B85" }}>או גרור לכאן · JPG/PNG/WebP · עד 16MB לתמונה</div>
        </div>

        <div style={{ marginTop: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#5D6861", display: "block", marginBottom: 4 }}>הוסיפו כיתוב (אופציונלי)</label>
          <input value={caption} onChange={e => setCaption(e.target.value)} placeholder="למשל: מהריקוד, ברכות..."
            style={{ width: "100%", padding: "8px 12px", borderRadius: 10, border: "1px solid #DDD8CE", fontSize: 14, fontFamily: "'Heebo', sans-serif", boxSizing: "border-box" }} />
        </div>

        <div style={{ marginTop: 20, textAlign: "center", fontSize: 12, color: "#B0ADA5" }}>
          התמונות נשמרות בצורה מאובטחת ומוצגות לזוג בלבד
        </div>
      </div>
    </div>
  );
}
