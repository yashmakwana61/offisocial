import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profiles";
import CategoryFilter from "@/components/feed/CategoryFilter";
import PostList from "@/components/feed/PostList";
import WeeklyPrompt from "@/components/reality-check/WeeklyPrompt";
import ResultsView from "@/components/reality-check/ResultsView";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { useLocation } from "wouter";
import { AnimatePresence, motion } from "framer-motion";

import { CreatePostDialog } from "@/components/CreatePostDialog";

export default function Feed() {
  const { user, isLoading: authLoading } = useAuth();
  const { data: profile } = useProfile();
  const [category, setCategory] = useState<string | null>(null);
  const [hasSubmittedCheck, setHasSubmittedCheck] = useState(false);
  const [, setLocation] = useLocation();
  const [showGate, setShowGate] = useState(false);

  // A "full member" is authenticated WITH a completed profile
  const isFullMember = !!user && !!profile && !!profile.companyId;

  // Engagement gate: Show after scroll
  useEffect(() => {
    if (isFullMember) return;
    const handleScroll = () => {
      if (window.scrollY > 1200) { // roughly after 3-4 posts
        setShowGate(true);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [user]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-20">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border/40">
        <div className="max-w-2xl lg:max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="font-display font-bold text-xl sm:text-2xl tracking-tight">Feed</h1>
            {!isFullMember && <Badge variant="secondary" className="text-[10px] uppercase tracking-wider font-bold bg-primary/10 text-primary border-none">Public</Badge>}
          </div>

          {isFullMember ? (
            <div
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center cursor-pointer hover:bg-primary/20 transition-colors"
              onClick={() => setLocation("/profile")}
            >
              <span className="font-medium text-xs sm:text-sm text-primary">
                {profile?.role ? profile.role.charAt(0).toUpperCase() : "M"}
              </span>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="rounded-full border-primary/30 text-primary hover:bg-primary/5 px-4 font-semibold"
              onClick={() => window.location.href = "/api/auth/linkedin"}
            >
              Join / Sign In
            </Button>
          )}
        </div>

        <div className="max-w-2xl lg:max-w-4xl mx-auto px-4 sm:px-6 pb-3">
          <CategoryFilter selected={category} onSelect={setCategory} />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl lg:max-w-4xl mx-auto px-4 sm:px-6 pt-6 space-y-6 md:space-y-8">

        {/* Why this exists - Guest Only */}
        {!isFullMember && (
          <section className="relative overflow-hidden bg-primary/5 border border-primary/20 rounded-[2.5rem] p-8 sm:p-12">
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
            <div className="relative z-10 space-y-6 max-w-2xl">
              <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground leading-tight">
                A silent, safe place for <br />
                <span className="text-primary font-extrabold italic">honest work talk.</span>
              </h2>
              <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">
                SafeSpace is where verified employees share real workplace experiences anonymously.
                Join 1,000+ coworkers already discussing management, culture, and salaries openly.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button
                  className="rounded-2xl h-14 px-8 bg-[#0077B5] hover:bg-[#006396] text-white shadow-lg shadow-[#0077B5]/20 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 font-bold text-lg"
                  onClick={() => window.location.href = "/api/auth/linkedin"}
                >
                  Join via LinkedIn
                </Button>
                <Button
                  variant="outline"
                  className="rounded-2xl h-14 px-8 border-primary/20 hover:bg-primary/5 transition-all duration-300 font-semibold"
                  onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
                >
                  Read Public Feed
                </Button>
              </div>
            </div>
          </section>
        )}

        {/* Reality Check Section - Member Only */}
        {isFullMember && (
          <section>
            <AnimatePresence mode="wait">
              {!hasSubmittedCheck ? (
                <motion.div
                  key="prompt"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <WeeklyPrompt onSubmit={() => setHasSubmittedCheck(true)} />
                </motion.div>
              ) : (
                <motion.div
                  key="results"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <ResultsView />
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        )}

        <PostList category={category} />

        {/* Engagement Gate Overlay */}
        <AnimatePresence>
          {showGate && (
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-8 bg-gradient-to-t from-background via-background to-transparent pt-12"
            >
              <div className="max-w-md mx-auto bg-card border border-primary/20 rounded-3xl p-6 shadow-2xl text-center space-y-4">
                <h3 className="text-xl font-bold">Enjoying the conversation?</h3>
                <p className="text-sm text-muted-foreground">Join 1,000+ others sharing real experiences. Verification keeps the community safe.</p>
                <Button
                  className="w-full h-12 rounded-2xl bg-[#0077B5] hover:bg-[#006396]"
                  onClick={() => window.location.href = "/api/auth/linkedin"}
                >
                  Join via LinkedIn
                </Button>
                <Button variant="ghost" onClick={() => setShowGate(false)} className="text-xs text-muted-foreground underline">Keep reading for now</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Floating Action Button - Member Only */}
      {isFullMember && (
        <div className="fixed bottom-6 right-4 sm:right-6 md:bottom-8 md:right-8 lg:right-[calc(50%-20rem)] z-40">
          <CreatePostDialog />
        </div>
      )}
    </div>
  );
}
