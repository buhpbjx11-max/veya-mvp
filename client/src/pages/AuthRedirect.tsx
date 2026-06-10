import { useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Spinner } from "@/components/ui/spinner";

/**
 * AuthRedirect — post-login routing page.
 * After OAuth callback, user lands here.
 * We query accountContext and redirect to the correct dashboard.
 *
 * Routing logic:
 *   admin → /admin
 *   venue (has venue record) → /venue/dashboard
 *   couple (has couple record) → /couple/dashboard
 *   new (no record yet) → /onboarding
 */
export default function AuthRedirect() {
  const [, navigate] = useLocation();
  const { data: user, isLoading: userLoading } = trpc.auth.me.useQuery();
  const { data: context, isLoading: contextLoading } = trpc.auth.accountContext.useQuery(
    undefined,
    { enabled: !!user }
  );

  useEffect(() => {
    if (userLoading || contextLoading) return;

    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    if (!context) return;

    // Check if user arrived from a wedding invite link
    const pendingJoinToken = sessionStorage.getItem("veya_join_token");
    if (pendingJoinToken) {
      // Don't clear yet — JoinWedding page will handle it
      // Redirect to join page regardless of account type
      // If couple not registered yet, JoinWedding will redirect to onboarding
      navigate(`/join/${pendingJoinToken}`, { replace: true });
      return;
    }

    switch (context.accountType) {
      case "admin":
        navigate("/admin", { replace: true });
        break;
      case "venue":
        navigate("/venue/dashboard", { replace: true });
        break;
      case "couple":
        navigate("/couple/dashboard", { replace: true });
        break;
      case "new":
      default:
        navigate("/onboarding", { replace: true });
        break;
    }
  }, [user, context, userLoading, contextLoading, navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 animate-fade-in">
      <Spinner className="w-8 h-8 text-primary" />
      <p className="font-body text-muted-foreground text-sm">
        מעבירים אתכם לחשבון...
      </p>
    </div>
  );
}
