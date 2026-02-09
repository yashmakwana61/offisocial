import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profiles";
import { Loader2 } from "lucide-react";

import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Feed from "@/pages/Feed";
import PostDetail from "@/pages/PostDetail";
import Onboarding from "@/pages/Onboarding";
import BlockedRole from "@/pages/BlockedRole";
import Profile from "@/pages/Profile";
import Stories from "@/pages/Stories";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();

  if (authLoading || (user && profileLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Landing />;

  // If authenticated but no profile or profile is pending verification, force onboarding
  const isPending = profile?.accountStatus === "pending";
  const isRestricted = profile?.accountStatus === "restricted";

  if (user && (!profile || isPending || isRestricted)) {
    return <Onboarding />;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/">
        <ProtectedRoute component={Feed} />
      </Route>
      <Route path="/posts/:id">
        <ProtectedRoute component={PostDetail} />
      </Route>
      <Route path="/profile">
        <ProtectedRoute component={Profile} />
      </Route>
      <Route path="/stories">
        <ProtectedRoute component={Stories} />
      </Route>
      <Route path="/blocked-role" component={BlockedRole} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
