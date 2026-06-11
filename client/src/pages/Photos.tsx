import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function Photos() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const { data: photos = [], isLoading } = trpc.photo.list.useQuery();
  const savePhoto = trpc.photo.save.useMutation({
    onSuccess: () => { utils.photo.list.invalidate(); toast.success("תמונה נשמרה"); },
    onError: (e) => toast.error(e.message),
  });
  const deletePhoto = trpc.photo.delete.useMutation({
    onSuccess: () => { utils.photo.list.invalidate(); toast.success("תמונה הוסרה"); },
    onError: (e) => toast.error(e.message),
  });

  if (!user) { navigate("/"); return null; }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 16 * 1024 * 1024) { toast.error("הקובץ גדול מ-16MB"); return; }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("שגיאה בהעלאה");
      const { url, key } = await res.json();
      await savePhoto.mutateAsync({ fileKey: key, url });
    } catch (err) {
      toast.error("שגיאה בהעלאת התמונה");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: "#F8F6F2", fontFamily: "'Heebo', sans-serif" }}>
      <div style={{ background: "#3F4842", padding: "16px 24px", display: "flex", alignItems: "center", gap: 16 }}>
        <button onClick={() => navigate("/couple/dashboard")} style={{ background: "none", border: "none", color: "#A8C3B0", cursor: "pointer" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <h1 style={{ color: "#F8F6F2", fontFamily: "'Frank Ruhl Libre', serif", fontSize: 22, margin: 0 }}>תמונות</h1>
        <button onClick={() => fileInputRef.current?.click()} disabled={uploading} style={{
          marginRight: "auto", background: "#A8C3B0", color: "#3F4842", border: "none",
          borderRadius: 9999, padding: "8px 18px", cursor: uploading ? "not-allowed" : "pointer",
          fontSize: 13, fontWeight: 600, opacity: uploading ? 0.7 : 1,
        }}>
          {uploading ? "מעלה..." : "+ העלאת תמונה"}
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px" }}>
        {isLoading ? (
          <div style={{ textAlign: "center", padding: 40, color: "#888" }}>טוען...</div>
        ) : photos.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: "#888" }}>
            <div style={{ marginBottom: 16 }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#A8C3B0" strokeWidth="1.5" style={{ display: "inline-block" }}>
                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
            </div>
            <div style={{ fontSize: 16, marginBottom: 8 }}>עדיין אין תמונות</div>
            <div style={{ fontSize: 13 }}>לחצי על "העלאת תמונה" כדי להתחיל</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
            {photos.map(photo => (
              <div key={photo.id} style={{ position: "relative", borderRadius: 18, overflow: "hidden", boxShadow: "0 1px 2px rgba(45,45,45,.04), 0 8px 24px rgba(63,72,66,.06)", cursor: "pointer" }}
                onClick={() => setPreview(photo.url)}>
                <img src={photo.url} alt={photo.caption ?? "תמונה"} style={{ width: "100%", height: 180, objectFit: "cover", display: "block" }} />
                {photo.caption && (
                  <div style={{ position: "absolute", bottom: 0, right: 0, left: 0, background: "linear-gradient(transparent, rgba(0,0,0,0.5))", padding: "20px 10px 8px", color: "#fff", fontSize: 12 }}>
                    {photo.caption}
                  </div>
                )}
                <button onClick={e => {
                  e.stopPropagation();
                  if (confirm("להסיר תמונה זו?")) deletePhoto.mutate({ id: photo.id });
                }} style={{
                  position: "absolute", top: 8, left: 8, background: "rgba(0,0,0,0.5)", border: "none",
                  borderRadius: 9999, width: 28, height: 28, cursor: "pointer", color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {preview && (
        <div onClick={() => setPreview(null)} style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex",
          alignItems: "center", justifyContent: "center", zIndex: 200, cursor: "zoom-out",
        }}>
          <img src={preview} style={{ maxWidth: "90vw", maxHeight: "90vh", borderRadius: 12, objectFit: "contain" }} />
        </div>
      )}
    </div>
  );
}
