import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function AdminDashboard() {
  const { user, logout } = useAuth({ redirectOnUnauthenticated: true });

  const handleLogout = async () => {
    await logout();
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-background animate-fade-in" dir="rtl">
      {/* Header */}
      <header
        className="border-b border-border px-6 py-4"
        style={{ background: "var(--veya-green-deep)" }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span
              className="font-display text-2xl font-light tracking-widest"
              style={{ color: "var(--veya-cream)", letterSpacing: "0.3em" }}
            >
              VEYA
            </span>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: "var(--veya-sand)", color: "var(--veya-green-deep)" }}
            >
              HQ
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm" style={{ color: "var(--veya-cream)", opacity: 0.8 }}>
              {user?.name}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="text-xs"
              style={{ borderColor: "var(--veya-cream)", color: "var(--veya-cream)", background: "transparent" }}
            >
              יציאה
            </Button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto p-6 space-y-6 animate-slide-up">
        <div>
          <h1 className="font-display text-3xl font-medium text-foreground">
            VEYA HQ — לוח בקרה
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            ניהול מלא של המערכת — אולמות, זוגות, מנויים, לידים
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "אולמות פעילים", value: "—", icon: "🏛️" },
            { label: "זוגות רשומים", value: "—", icon: "💑" },
            { label: "חתונות החודש", value: "—", icon: "🎊" },
            { label: "לידים פתוחים", value: "—", icon: "📋" },
          ].map((stat, i) => (
            <div key={i} className="veya-card p-5 flex items-center gap-4">
              <span className="text-3xl">{stat.icon}</span>
              <div>
                <p className="text-2xl font-display font-medium text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Admin modules */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { title: "ניהול אולמות", desc: "רישום, מנויים, נעילה, kill-switch", icon: "🏛️" },
            { title: "ניהול זוגות", desc: "assignment_locked, סוג חשבון, מחיקה", icon: "💑" },
            { title: "מנויים וחשבוניות", desc: "תשלומים, חידושים, חובות", icon: "💳" },
            { title: "CRM לידים", desc: "פגישות, הצעות מחיר, סגירות", icon: "📋" },
            { title: "גישות חיצוניות", desc: "עורך דין, רואה חשבון — approvedByBar", icon: "🔐" },
            { title: "משוב ואנליטיקה", desc: "דירוגים, תגובות, סטטיסטיקות", icon: "📊" },
          ].map((module, i) => (
            <button
              key={i}
              onClick={() => toast.info(`${module.title} — בקרוב (שלב 6)`)}
              className="veya-card p-5 text-right hover:border-primary transition-all duration-200 space-y-2"
            >
              <span className="text-3xl block">{module.icon}</span>
              <h3 className="font-display text-lg font-medium text-foreground">{module.title}</h3>
              <p className="text-sm text-muted-foreground">{module.desc}</p>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
