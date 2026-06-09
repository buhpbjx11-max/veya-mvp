import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

type Step = "choose" | "venue-form" | "couple-form";

export default function Onboarding() {
  const [, navigate] = useLocation();
  const { user } = useAuth({ redirectOnUnauthenticated: true });
  const [step, setStep] = useState<Step>("choose");

  // Venue form state
  const [venueName, setVenueName] = useState("");
  const [venueRegion, setVenueRegion] = useState("");
  const [venuePhone, setVenuePhone] = useState("");

  // Couple form state
  const [name1, setName1] = useState("");
  const [name2, setName2] = useState("");
  const [phone1, setPhone1] = useState("");
  const [phone2, setPhone2] = useState("");
  const [weddingDate, setWeddingDate] = useState("");

  const registerVenue = trpc.venue.register.useMutation({
    onSuccess: () => {
      toast.success("האולם נרשם בהצלחה!");
      navigate("/venue/dashboard", { replace: true });
    },
    onError: (err) => {
      toast.error(err.message || "שגיאה בהרשמת האולם");
    },
  });

  const registerCouple = trpc.couple.register.useMutation({
    onSuccess: () => {
      toast.success("הפרופיל נוצר בהצלחה!");
      navigate("/couple/dashboard", { replace: true });
    },
    onError: (err) => {
      toast.error(err.message || "שגיאה ביצירת הפרופיל");
    },
  });

  const handleVenueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!venueName.trim()) {
      toast.error("יש להזין שם אולם");
      return;
    }
    registerVenue.mutate({
      name: venueName.trim(),
      region: venueRegion.trim() || undefined,
      phone: venuePhone.trim() || undefined,
    });
  };

  const handleCoupleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name1.trim() || !name2.trim()) {
      toast.error("יש להזין את שמות שני בני/בנות הזוג");
      return;
    }
    registerCouple.mutate({
      name1: name1.trim(),
      name2: name2.trim(),
      phone1: phone1.trim() || undefined,
      phone2: phone2.trim() || undefined,
      weddingDate: weddingDate || undefined,
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 animate-fade-in">
      {/* Background */}
      <div
        className="fixed inset-0 pointer-events-none opacity-25"
        style={{
          backgroundImage: `radial-gradient(circle at 15% 60%, var(--veya-green-light) 0%, transparent 45%),
                            radial-gradient(circle at 85% 30%, var(--veya-sand) 0%, transparent 40%)`,
        }}
      />

      <div className="relative w-full max-w-lg animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1
            className="font-display text-4xl font-light tracking-widest mb-1"
            style={{ color: "var(--veya-green-deep)", letterSpacing: "0.3em" }}
          >
            VEYA
          </h1>
        </div>

        {/* Step: Choose account type */}
        {step === "choose" && (
          <div className="veya-card p-8 space-y-6">
            <div className="text-center">
              <h2 className="font-display text-2xl font-medium mb-2">
                ברוכים הבאים{user?.name ? `, ${user.name}` : ""}
              </h2>
              <p className="text-muted-foreground text-sm">
                בחרו את סוג החשבון שלכם כדי להמשיך
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {/* Venue option */}
              <button
                onClick={() => setStep("venue-form")}
                className="group relative p-6 rounded-xl border-2 border-border hover:border-primary transition-all duration-200 text-right"
                style={{ background: "var(--veya-cream)" }}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: "var(--veya-green-light)" }}
                  >
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display text-lg font-medium mb-1">אולם / מקום אירועים</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      ניהול חתונות, שליחת קישורים לזוגות, דוחות שף, ניהול ספקים
                    </p>
                  </div>
                </div>
              </button>

              {/* Couple option */}
              <button
                onClick={() => setStep("couple-form")}
                className="group relative p-6 rounded-xl border-2 border-border hover:border-primary transition-all duration-200 text-right"
                style={{ background: "var(--veya-cream)" }}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: "var(--veya-sand)", opacity: 0.8 }}
                  >
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display text-lg font-medium mb-1">זוג מתחתן</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      ניהול אורחים, הושבה, תקציב, מתנות, תמונות — הכל במקום אחד
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Step: Venue registration form */}
        {step === "venue-form" && (
          <div className="veya-card p-8 space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <button
                onClick={() => setStep("choose")}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                ← חזרה
              </button>
            </div>
            <div className="text-center">
              <h2 className="font-display text-2xl font-medium mb-1">פרטי האולם</h2>
              <p className="text-muted-foreground text-sm">מתחילים עם ניסיון חינם של 14 יום</p>
            </div>

            <form onSubmit={handleVenueSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="venue-name">שם האולם *</Label>
                <Input
                  id="venue-name"
                  value={venueName}
                  onChange={(e) => setVenueName(e.target.value)}
                  placeholder="למשל: אולמי הגן הקסום"
                  required
                  dir="rtl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="venue-region">אזור</Label>
                <Input
                  id="venue-region"
                  value={venueRegion}
                  onChange={(e) => setVenueRegion(e.target.value)}
                  placeholder="למשל: מרכז, צפון, ירושלים..."
                  dir="rtl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="venue-phone">טלפון</Label>
                <Input
                  id="venue-phone"
                  value={venuePhone}
                  onChange={(e) => setVenuePhone(e.target.value)}
                  placeholder="050-0000000"
                  dir="ltr"
                  className="text-right"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base mt-2"
                disabled={registerVenue.isPending}
              >
                {registerVenue.isPending ? "רושמים..." : "יצירת חשבון אולם"}
              </Button>
            </form>
          </div>
        )}

        {/* Step: Couple registration form */}
        {step === "couple-form" && (
          <div className="veya-card p-8 space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <button
                onClick={() => setStep("choose")}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                ← חזרה
              </button>
            </div>
            <div className="text-center">
              <h2 className="font-display text-2xl font-medium mb-1">פרטי הזוג</h2>
              <p className="text-muted-foreground text-sm">נטרלי מגדרית — שם 1 ושם 2</p>
            </div>

            <form onSubmit={handleCoupleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="name1">שם 1 *</Label>
                  <Input
                    id="name1"
                    value={name1}
                    onChange={(e) => setName1(e.target.value)}
                    placeholder="שם פרטי"
                    required
                    dir="rtl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name2">שם 2 *</Label>
                  <Input
                    id="name2"
                    value={name2}
                    onChange={(e) => setName2(e.target.value)}
                    placeholder="שם פרטי"
                    required
                    dir="rtl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="phone1">טלפון (שם 1)</Label>
                  <Input
                    id="phone1"
                    value={phone1}
                    onChange={(e) => setPhone1(e.target.value)}
                    placeholder="050-0000000"
                    dir="ltr"
                    className="text-right"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone2">טלפון (שם 2)</Label>
                  <Input
                    id="phone2"
                    value={phone2}
                    onChange={(e) => setPhone2(e.target.value)}
                    placeholder="050-0000000"
                    dir="ltr"
                    className="text-right"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="wedding-date">תאריך החתונה</Label>
                <Input
                  id="wedding-date"
                  type="date"
                  value={weddingDate}
                  onChange={(e) => setWeddingDate(e.target.value)}
                  dir="ltr"
                  className="text-right"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base mt-2"
                disabled={registerCouple.isPending}
              >
                {registerCouple.isPending ? "יוצרים פרופיל..." : "יצירת פרופיל זוג"}
              </Button>
            </form>
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground mt-4">
          VEYA © 2026 — כל הזכויות שמורות
        </p>
      </div>
    </div>
  );
}
