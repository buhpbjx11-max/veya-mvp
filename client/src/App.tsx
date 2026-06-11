import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

// Auth & onboarding
import Login from "./pages/Login";
import AuthRedirect from "./pages/AuthRedirect";
import Onboarding from "./pages/Onboarding";

// Dashboards
import VenueDashboard from "./pages/VenueDashboard";
import CoupleDashboard from "./pages/CoupleDashboard";
import AdminDashboard from "./pages/AdminDashboard";

// Wedding invite
import JoinWedding from "./pages/JoinWedding";

// Venue Share
import VenueShareSetup from "./pages/VenueShareSetup";
import VenueShareView from "./pages/VenueShareView";

function Router() {
  return (
    <Switch>
      {/* Root → login */}
      <Route path="/" component={Login} />

      {/* Auth flow */}
      <Route path="/login" component={Login} />
      <Route path="/auth/redirect" component={AuthRedirect} />
      <Route path="/onboarding" component={Onboarding} />

      {/* Dashboards */}
      <Route path="/venue/dashboard" component={VenueDashboard} />
      <Route path="/couple/dashboard" component={CoupleDashboard} />
      <Route path="/admin" component={AdminDashboard} />

      {/* Wedding invite — public, no auth required */}
      <Route path="/join/:token" component={JoinWedding} />

      {/* Venue Share */}
      <Route path="/couple/venue-share" component={VenueShareSetup} />
      {/* Public read-only view for venue — no auth required */}
      <Route path="/venue-view/:token" component={VenueShareView} />

      {/* Fallback */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster richColors position="top-center" />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
