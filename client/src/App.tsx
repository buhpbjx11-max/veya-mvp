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

// Tools
import Guests from "./pages/Guests";
import Seating from "./pages/Seating";
import Budget from "./pages/Budget";
import Gifts from "./pages/Gifts";
import Photos from "./pages/Photos";
import GuestPhotoUpload from "./pages/GuestPhotoUpload";
import Vendors from "./pages/Vendors";
import Timeline from "./pages/Timeline";
import FamilyAccess from "./pages/FamilyAccess";
import Thanks from "./pages/Thanks";
import FeedbackSurvey from "./pages/FeedbackSurvey";
import AccountSettings from "./pages/AccountSettings";
import Chat from "./pages/Chat";
import Invitation from "./pages/Invitation";
import GuestInvitation from "./pages/GuestInvitation";
import GuestRsvp from "./pages/GuestRsvp";

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

      {/* Couple tools */}
      <Route path="/couple/guests" component={Guests} />
      <Route path="/couple/seating" component={Seating} />
      <Route path="/couple/budget" component={Budget} />
      <Route path="/couple/gifts" component={Gifts} />
      <Route path="/couple/photos" component={Photos} />
      <Route path="/guest-photos/:token" component={GuestPhotoUpload} />

      {/* Couple tools */}
      <Route path="/couple/vendors" component={Vendors} />
      <Route path="/couple/timeline" component={Timeline} />
      <Route path="/couple/family-access" component={FamilyAccess} />
      <Route path="/couple/thanks" component={Thanks} />
      <Route path="/couple/feedback" component={FeedbackSurvey} />
      <Route path="/couple/settings" component={AccountSettings} />
      <Route path="/couple/chat" component={Chat} />
      <Route path="/couple/invitation" component={Invitation} />

      {/* Public invitation — no auth required */}
      <Route path="/invitation/:token" component={GuestInvitation} />
      {/* Public RSVP — no auth required */}
      <Route path="/rsvp" component={GuestRsvp} />

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
