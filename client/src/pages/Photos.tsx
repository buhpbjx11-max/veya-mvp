import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";

type Photo = {
  id: number;
  fileKey: string;
  url: string;
  caption?: string | null;
  uploadedBy: string;
  createdAt: Date;
};

export default function Photos() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const [activeTab, setActiveTab] = useState<"gallery" | "upload" | "qr">("gallery");
  const [uploading, setUploading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [caption, setCaption] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: photos = [], isLoading } = trpc.photo.list.useQuery();
  const savePhoto = trpc.photo.save.useMutation({
    onSuccess: () => { utils.photo.list.invalidate(); toast.success("התמונה נשמרה"); },
    onError: (e) => toast.error(e.message),
  });
  const deletePhoto = trpc.photo.delete.useMutation({
    onSuccess: () => { utils.photo.list.invalidate(); setSelectedPhoto(null); toast.success("התמונה נמחקה"); },
    onError: (e) => toast.error(e.message),
  });
  const getQrToken = trpc.photo.getOrCreateQrToken.useMutation({
    onError: (e) => toast.error(e.message),
  });

  const [qrToken, setQrToken] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);

  async function loadQr() {
    if (qrToken) return;
    setQrLoading(true);
    try {
      const result = await getQrToken.mutateAsync();
      setQrToken(result.token);
    } finally {
      setQrLoading(false);
    }
  }

  const guestUploadUrl = qrToken ? `${window.location.origin}/guest-photos/${qrToken}` : null;

  async function handleFileUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    let successCount = 0;
    for (const file of Array.from(files)) {
      if (file.size > 16 * 1024 * 1024) { toast.error(`${file.name} גדול מ-16MB`); continue; }
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/upload/photo-direct", { method: "POST", body: formData });
        if (!res.ok) throw new Error("שגיאת העלאה");
        const { key, url } = await res.json();
        await savePhoto.mutateAsync({ fileKey: key, url, caption: caption || undefined });
        successCount++;
      } catch (e: any) {
        toast.error(`שגיאה בהעלאת ${file.name}: ${e.message}`);
      }
    }
    if (successCount > 0) toast.success(`${successCount} תמונות הועלו בהצלחה`);
    setUploading(false);
    setCaption("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const photoList = photos as Photo[];
  const couplePhotos = photoList.filter(p => p.uploadedBy === "couple");
  const guestPhotos = photoList.filter(p => p.uploadedBy === "guest");

  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: "#F8F6F2", fontFamily: "'Heebo', sans-serif" }}>
      <style>{`
        .photos-tab { padding: 10px 20px; border: none; background: transparent; font-size: 14px; font-weight: 500; cursor: pointer; border-bottom: 2px solid transparent; color: #8B8B85; font-family: 'Heebo', sans-serif; transition: all 0.15s; }
        .photos-tab.active { color: #3F4842; border-bottom-color: #3F4842; }
        .photos-tab:hover:not(.active) { color: #5D6861; }
        .photo-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 8px; }
        .photo-tile { aspect-ratio: 1; border-radius: 12px; overflow: hidden; cursor: pointer; position: relative; background: #E8E2D9; }
        .photo-tile img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.2s; }
        .photo-tile:hover img { transform: scale(1.04); }
        .photo-tile-overlay { position: absolute; inset: 0; background: rgba(63,72,66,0); transition: background 0.15s; display: flex; align-items: flex-end; padding: 8px; }
        .photo-tile:hover .photo-tile-overlay { background: rgba(63,72,66,0.35); }
        .photo-tile-caption { color: #fff; font-size: 11px; opacity: 0; transition: opacity 0.15s; }
        .photo-tile:hover .photo-tile-caption { opacity: 1; }
        .upload-zone { border: 2px dashed #A8C3B0; border-radius: 16px; padding: 40px 24px; text-align: center; cursor: pointer; transition: all 0.15s; background: #fff; }
        .upload-zone:hover { background: #EFF5F1; border-color: #3F4842; }
        .upload-zone.drag-over { background: #EFF5F1; border-color: #3F4842; }
        .qr-box { background: #fff; border-radius: 18px; padding: 32px; text-align: center; max-width: 420px; margin: 0 auto; box-shadow: 0 4px 24px rgba(63,72,66,0.12); }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.75); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .modal-inner { background: #fff; border-radius: 18px; max-width: 600px; width: 100%; max-height: 90vh; overflow: auto; }
      `}</style>

      {/* Header */}
      <div style={{ background: "#3F4842", padding: "16px 24px", display: "flex", alignItems: "center", gap: 16 }}>
        <button onClick={() => navigate("/couple/dashboard")} style={{ background: "none", border: "none", color: "#A8C3B0", cursor: "pointer" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <h1 style={{ color: "#F8F6F2", fontFamily: "'Frank Ruhl Libre', serif", fontSize: 22, margin: 0 }}>תמונות</h1>
        <div style={{ marginRight: "auto", display: "flex", gap: 8 }}>
          <span style={{ background: "rgba(168,195,176,0.25)", color: "#A8C3B0", borderRadius: 9999, padding: "4px 12px", fontSize: 12 }}>{photoList.length} תמונות</span>
          {guestPhotos.length > 0 && <span style={{ background: "rgba(212,180,131,0.25)", color: "#D4B483", borderRadius: 9999, padding: "4px 12px", fontSize: 12 }}>{guestPhotos.length} מאורחים</span>}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: "#fff", borderBottom: "1px solid #E8E2D9", display: "flex", paddingRight: 24 }}>
        {[{ id: "gallery", label: "גלריה" }, { id: "upload", label: "העלאה" }, { id: "qr", label: "QR לאורחים" }].map(t => (
          <button key={t.id} className={`photos-tab${activeTab === t.id ? " active" : ""}`}
            onClick={() => { setActiveTab(t.id as any); if (t.id === "qr") loadQr(); }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px" }}>

        {/* ─── Gallery ───────────────────────────────────────────────────────── */}
        {activeTab === "gallery" && (
          <>
            {isLoading ? (
              <div style={{ textAlign: "center", padding: 60, color: "#888" }}>טוען...</div>
            ) : photoList.length === 0 ? (
              <div style={{ textAlign: "center", padding: 60 }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📷</div>
                <div style={{ fontSize: 18, color: "#3F4842", fontFamily: "'Frank Ruhl Libre', serif", marginBottom: 8 }}>עדיין אין תמונות</div>
                <div style={{ fontSize: 13, color: "#8B8B85", marginBottom: 20 }}>העלי תמונות ראשונות או שתפי QR לאורחים</div>
                <button onClick={() => setActiveTab("upload")} style={{ background: "#3F4842", color: "#F8F6F2", border: "none", borderRadius: 9999, padding: "10px 24px", cursor: "pointer", fontSize: 14, fontFamily: "'Heebo', sans-serif" }}>
                  העלאת תמונות
                </button>
              </div>
            ) : (
              <>
                {guestPhotos.length > 0 && (
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#3F4842", marginBottom: 12 }}>תמונות מאורחים ({guestPhotos.length})</div>
                    <div className="photo-grid">
                      {guestPhotos.map(p => (
                        <div key={p.id} className="photo-tile" onClick={() => setSelectedPhoto(p)}>
                          <img src={p.url} alt={p.caption ?? ""} loading="lazy" />
                          <div className="photo-tile-overlay">
                            {p.caption && <span className="photo-tile-caption">{p.caption}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {couplePhotos.length > 0 && (
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#3F4842", marginBottom: 12 }}>התמונות שלנו ({couplePhotos.length})</div>
                    <div className="photo-grid">
                      {couplePhotos.map(p => (
                        <div key={p.id} className="photo-tile" onClick={() => setSelectedPhoto(p)}>
                          <img src={p.url} alt={p.caption ?? ""} loading="lazy" />
                          <div className="photo-tile-overlay">
                            {p.caption && <span className="photo-tile-caption">{p.caption}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ─── Upload ────────────────────────────────────────────────────────── */}
        {activeTab === "upload" && (
          <div style={{ maxWidth: 560, margin: "0 auto" }}>
            <div className="upload-zone"
              onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add("drag-over"); }}
              onDragLeave={e => e.currentTarget.classList.remove("drag-over")}
              onDrop={e => { e.preventDefault(); e.currentTarget.classList.remove("drag-over"); handleFileUpload(e.dataTransfer.files); }}
              onClick={() => fileInputRef.current?.click()}>
              <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={e => handleFileUpload(e.target.files)} />
              <div style={{ fontSize: 40, marginBottom: 12 }}>🖼️</div>
              <div style={{ fontSize: 17, color: "#3F4842", fontFamily: "'Frank Ruhl Libre', serif", marginBottom: 6 }}>
                {uploading ? "מעלה..." : "גרור תמונות לכאן"}
              </div>
              <div style={{ fontSize: 13, color: "#8B8B85" }}>או לחצי לבחירה · עד 16MB לתמונה · JPG/PNG/WebP</div>
            </div>

            <div style={{ marginTop: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#5D6861", display: "block", marginBottom: 4 }}>כיתוב (אופציונלי)</label>
              <input value={caption} onChange={e => setCaption(e.target.value)} placeholder="למשל: צילומי אירוסים, יוני 2026"
                style={{ width: "100%", padding: "8px 12px", borderRadius: 10, border: "1px solid #DDD8CE", fontSize: 14, fontFamily: "'Heebo', sans-serif", boxSizing: "border-box" }} />
            </div>

            {uploading && (
              <div style={{ marginTop: 16, textAlign: "center", color: "#5D8A6A", fontSize: 14 }}>
                <div style={{ width: 32, height: 32, border: "3px solid #A8C3B0", borderTopColor: "#3F4842", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 8px" }} />
                מעלה תמונות...
              </div>
            )}
          </div>
        )}

        {/* ─── QR ────────────────────────────────────────────────────────────── */}
        {activeTab === "qr" && (
          <div>
            <div className="qr-box">
              <div style={{ fontFamily: "'Frank Ruhl Libre', serif", fontSize: 22, color: "#3F4842", marginBottom: 6 }}>QR לאורחים</div>
              <div style={{ fontSize: 13, color: "#8B8B85", marginBottom: 24, lineHeight: 1.6 }}>
                שתפו את הקוד הזה בהזמנה הדיגיטלית — האורחים יוכלו לסרוק ולהעלות תמונות ישירות לגלריה שלכם
              </div>

              {qrLoading ? (
                <div style={{ padding: 40, color: "#888" }}>יוצר קישור...</div>
              ) : qrToken && guestUploadUrl ? (
                <>
                  <div style={{ display: "inline-block", padding: 16, background: "#fff", borderRadius: 12, border: "1px solid #E8E2D9", marginBottom: 20 }}>
                    <QRCodeSVG value={guestUploadUrl} size={200} fgColor="#3F4842" bgColor="#fff" />
                  </div>
                  <div style={{ fontSize: 12, color: "#8B8B85", marginBottom: 16 }}>סרקו עם הטלפון</div>
                  <div style={{ background: "#F8F6F2", borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "#5D6861", wordBreak: "break-all", marginBottom: 16, direction: "ltr", textAlign: "left" }}>
                    {guestUploadUrl}
                  </div>
                  <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                    <button onClick={() => { navigator.clipboard.writeText(guestUploadUrl); toast.success("הקישור הועתק!"); }}
                      style={{ background: "#3F4842", color: "#F8F6F2", border: "none", borderRadius: 9999, padding: "8px 20px", cursor: "pointer", fontSize: 13, fontFamily: "'Heebo', sans-serif" }}>
                      📋 העתק קישור
                    </button>
                    <button onClick={() => { const a = document.createElement("a"); a.href = `https://wa.me/?text=${encodeURIComponent("העלו תמונות מהחתונה שלנו: " + guestUploadUrl)}`; a.target = "_blank"; a.click(); }}
                      style={{ background: "#25D366", color: "#fff", border: "none", borderRadius: 9999, padding: "8px 20px", cursor: "pointer", fontSize: 13, fontFamily: "'Heebo', sans-serif" }}>
                      📲 שתף ב-WhatsApp
                    </button>
                  </div>
                </>
              ) : (
                <button onClick={loadQr} style={{ background: "#3F4842", color: "#F8F6F2", border: "none", borderRadius: 9999, padding: "10px 24px", cursor: "pointer", fontSize: 14, fontFamily: "'Heebo', sans-serif" }}>
                  צור QR
                </button>
              )}
            </div>

            <div style={{ maxWidth: 420, margin: "20px auto 0", background: "#EFF5F1", borderRadius: 12, padding: "14px 18px", fontSize: 13, color: "#3F4842", lineHeight: 1.7 }}>
              <strong>איך זה עובד?</strong><br />
              האורח סורק את הקוד → נפתח דף העלאה פשוט → האורח מעלה תמונות → הן מופיעות כאן בגלריה שלכם בלשונית "תמונות מאורחים".
            </div>
          </div>
        )}
      </div>

      {/* Photo modal */}
      {selectedPhoto && (
        <div className="modal-overlay" onClick={() => setSelectedPhoto(null)}>
          <div className="modal-inner" onClick={e => e.stopPropagation()}>
            <img src={selectedPhoto.url} alt={selectedPhoto.caption ?? ""} style={{ width: "100%", maxHeight: "60vh", objectFit: "contain", borderRadius: "18px 18px 0 0" }} />
            <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                {selectedPhoto.caption && <div style={{ fontSize: 14, color: "#3F4842", marginBottom: 4 }}>{selectedPhoto.caption}</div>}
                <div style={{ fontSize: 12, color: "#888" }}>
                  {selectedPhoto.uploadedBy === "guest" ? "הועלה על ידי אורח" : "הועלה על ידך"} · {new Date(selectedPhoto.createdAt).toLocaleDateString("he-IL")}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <a href={selectedPhoto.url} download target="_blank" rel="noreferrer"
                  style={{ background: "#3F4842", color: "#F8F6F2", borderRadius: 9999, padding: "7px 16px", fontSize: 13, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}>
                  ⬇ הורדה
                </a>
                <button onClick={() => { if (confirm("למחוק תמונה זו?")) deletePhoto.mutate({ id: selectedPhoto.id }); }}
                  style={{ background: "#fff", color: "#c0392b", border: "1px solid #e8e2d9", borderRadius: 9999, padding: "7px 16px", fontSize: 13, cursor: "pointer", fontFamily: "'Heebo', sans-serif" }}>
                  🗑 מחיקה
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
