import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function VenueDashboard() {
  const { user, logout } = useAuth({ redirectOnUnauthenticated: true });
  const { data: venue, isLoading } = trpc.venue.me.useQuery(undefined, {
    enabled: !!user,
  });

  const handleLogout = async () => {
    await logout();
    window.location.href = "/login";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6 animate-fade-in">
        <div className="max-w-4xl mx-auto space-y-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background animate-fade-in" dir="rtl">
      {/* Header */}
      <header
        className="border-b border-border px-6 py-4"
        style={{ background: "var(--veya-green-deep)" }}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span
              className="font-display text-2xl font-light tracking-widest"
              style={{ color: "var(--veya-cream)", letterSpacing: "0.3em" }}
            >
              VEYA
            </span>
            <span className="text-sm opacity-60" style={{ color: "var(--veya-cream)" }}>
              | אולם
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

      {/* Main content */}
      <main className="max-w-6xl mx-auto p-6 space-y-6 animate-slide-up">
        {/* Welcome */}
        <div className="space-y-1">
          <h1 className="font-display text-3xl font-medium text-foreground">
            שלום, {venue?.name || user?.name}
          </h1>
          <p className="text-muted-foreground text-sm">
            {venue?.subStatus === "trial"
              ? `ניסיון חינם — ${venue.trialEndsAt ? `עד ${new Date(venue.trialEndsAt).toLocaleDateString("he-IL")}` : "14 יום"}`
              : "חשבון פעיל"}
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "חתונות פעילות", value: "0", icon: "🎊" },
            { label: "אורחים סה״כ", value: "0", icon: "👥" },
            { label: "הודעות חדשות", value: "0", icon: "💬" },
          ].map((stat, i) => (
            <div
              key={i}
              className="veya-card p-5 flex items-center gap-4"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <span className="text-3xl">{stat.icon}</span>
              <div>
                <p className="text-2xl font-display font-medium text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="veya-card p-6 space-y-4">
          <h2 className="font-display text-xl font-medium">פעולות מהירות</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "חתונה חדשה", icon: "➕", action: () => toast.info("בקרוב — שלב 3") },
              { label: "ניהול אורחים", icon: "👥", action: () => toast.info("בקרוב — שלב 5") },
              { label: "דוח שף", icon: "🍽️", action: () => toast.info("בקרוב — שלב 5") },
              { label: "הגדרות", icon: "⚙️", action: () => toast.info("בקרוב") },
            ].map((item, i) => (
              <button
                key={i}
                onClick={item.action}
                className="p-4 rounded-xl border border-border hover:border-primary hover:bg-secondary/30 transition-all duration-200 text-center space-y-2"
              >
                <span className="text-2xl block">{item.icon}</span>
                <span className="text-sm font-medium text-foreground">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Upcoming weddings placeholder */}
        <div className="veya-card p-6 space-y-4">
          <h2 className="font-display text-xl font-medium">חתונות קרובות</h2>
          <div className="text-center py-10 text-muted-foreground">
            <p className="text-4xl mb-3">🎊</p>
            <p className="font-body text-sm">עדיין אין חתונות מתוכננות</p>
            <p className="text-xs mt-1 opacity-70">צרו חתונה חדשה ושלחו קישור לזוג</p>
          </div>
        </div>
      </main>
    </div>
  );
}
