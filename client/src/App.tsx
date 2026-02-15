import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth, AuthProvider } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profiles";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { ThemeProvider } from "next-themes";
import Layout from "./components/layout/Layout";
import { SocketProvider } from "@/lib/socket";

import NotFound from "@/pages/not-found";
import Feed from "@/pages/Feed";
import PostDetail from "@/pages/PostDetail";
import Onboarding from "@/pages/Onboarding";
import Profile from "@/pages/Profile";
import Stories from "@/pages/Stories";
import ChatRequests from "@/pages/ChatRequests";
import ChatPage from "@/pages/ChatPage";
import SalaryBoard from "@/pages/SalaryBoard";
import InterviewArchive from "@/pages/InterviewArchive";
import AdminDashboard from "@/pages/AdminDashboard";
import Settings from "@/pages/Settings";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/");
    }
  }, [user, authLoading, setLocation]);

  if (authLoading || (user && profileLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const isIncomplete = !profile?.companyId || !profile?.role;

  // Onboarding should not have the main layout
  if (user && (!profile || isIncomplete)) {
    return <Onboarding />;
  }

  // Wrap authenticated pages in the main Layout
  return (
    <Layout>
      <Component />
    </Layout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/">
        <Layout>
          <Feed />
        </Layout>
      </Route>
      <Route path="/posts/:id">
        {(params) => (
          <Layout>
            <PostDetail />
          </Layout>
        )}
      </Route>
      <Route path="/profile">
        <ProtectedRoute component={Profile} />
      </Route>
      <Route path="/stories">
        <ProtectedRoute component={Stories} />
      </Route>
      <Route path="/chat-requests">
        <ProtectedRoute component={ChatRequests} />
      </Route>
      <Route path="/salaries">
        <ProtectedRoute component={SalaryBoard} />
      </Route>
      <Route path="/interviews">
        <ProtectedRoute component={InterviewArchive} />
      </Route>
      <Route path="/admin">
        <ProtectedRoute component={AdminDashboard} />
      </Route>
      <Route path="/settings">
        <ProtectedRoute component={Settings} />
      </Route>
      <Route path="/chat/:id">
        <ProtectedRoute component={ChatPage} />
      </Route>
      {/* Route for testing layout without auth, if needed, or just public feed */}
      {/* <Route path="/public-feed" component={Feed} /> */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SocketProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </ThemeProvider>
        </SocketProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
