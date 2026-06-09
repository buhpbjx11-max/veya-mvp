import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function CoupleDashboard() {
  const { user, logout } = useAuth({ redirectOnUnauthenticated: true });
  const { data: couple, isLoading } = trpc.couple.me.useQuery(undefined, {
    enabled: !!user,
  });

  const handleLogout = async () => {
    await logout();
    window.location.href = "/login";
  };

  const daysUntilWedding = couple?.weddingDate
    ? Math.ceil(
        (new Date(couple.weddingDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
    : null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6 animate-fade-in">
        <div className="max-w-4xl mx-auto space-y-4">
          <Skeleton className="h-10 w-64" />
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
        style={{
          background: "linear-gradient(135deg, var(--veya-green-deep) 0%, var(--veya-green-dark) 100%)",
        }}
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
              | זוג
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm" style={{ color: "var(--veya-cream)", opacity: 0.8 }}>
              {couple ? `${couple.name1} & ${couple.name2}` : user?.name}
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
        {/* Welcome + countdown */}
        <div className="veya-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-medium text-foreground mb-1">
              {couple ? (
                <>
                  <span className="font-decorative italic">{couple.name1}</span>
                  {" & "}
                  <span className="font-decorative italic">{couple.name2}</span>
                </>
              ) : (
                "ברוכים הבאים"
              )}
            </h1>
            {couple?.weddingDate && (
              <p className="text-muted-foreground text-sm">
                {new Date(couple.weddingDate).toLocaleDateString("he-IL", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            )}
            <div className="flex items-center gap-2 mt-2">
              <Badge
                variant={couple?.type === "venue_linked" ? "default" : "secondary"}
                className="text-xs"
              >
                {couple?.type === "venue_linked" ? "מקושר לאולם" : "עצמאי"}
              </Badge>
              {couple?.plan === "premium" && (
                <Badge className="text-xs bg-amber-100 text-amber-800 border-amber-200">
                  פרמיום
                </Badge>
              )}
            </div>
          </div>

          {daysUntilWedding !== null && daysUntilWedding > 0 && (
            <div
              className="text-center p-4 rounded-xl min-w-[100px]"
              style={{ background: "var(--veya-green-light)" }}
            >
              <p className="font-display text-4xl font-light text-foreground">{daysUntilWedding}</p>
              <p className="text-xs text-muted-foreground mt-1">ימים לחתונה</p>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "אורחים", value: "0", icon: "👥" },
            { label: "אישרו הגעה", value: "0", icon: "✅" },
            { label: "לא אישרו", value: "0", icon: "❌" },
            { label: "ממתינים", value: "0", icon: "⏳" },
          ].map((stat, i) => (
            <div
              key={i}
              className="veya-card p-4 text-center"
            >
              <span className="text-2xl block mb-1">{stat.icon}</span>
              <p className="text-2xl font-display font-medium text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Tools grid */}
        <div className="veya-card p-6 space-y-4">
          <h2 className="font-display text-xl font-medium">הכלים שלכם</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: "אורחים ו-RSVP", icon: "👥", path: "/couple/guests" },
              { label: "הושבה", icon: "🪑", path: "/couple/seating" },
              { label: "מתנות", icon: "🎁", path: "/couple/gifts" },
              { label: "תקציב", icon: "💰", path: "/couple/budget" },
              { label: "תמונות", icon: "📸", path: "/couple/photos" },
              { label: "מסמכים", icon: "📄", path: "/couple/documents" },
            ].map((tool, i) => (
              <button
                key={i}
                onClick={() => toast.info(`${tool.label} — בקרוב (שלב 5)`)}
                className="p-5 rounded-xl border border-border hover:border-primary hover:bg-secondary/20 transition-all duration-200 text-center space-y-2"
              >
                <span className="text-3xl block">{tool.icon}</span>
                <span className="text-sm font-medium text-foreground">{tool.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Venue chat — only for venue_linked */}
        {couple?.type === "venue_linked" && (
          <div className="veya-card p-6 space-y-3">
            <h2 className="font-display text-xl font-medium">צ׳אט עם האולם</h2>
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-3xl mb-2">💬</p>
              <p className="text-sm">אין הודעות עדיין</p>
            </div>
            <Button
              onClick={() => toast.info("צ׳אט עם האולם — בקרוב (שלב 4)")}
              variant="outline"
              className="w-full"
            >
              פתיחת צ׳אט עם האולם
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
