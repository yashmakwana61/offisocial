import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profiles";
import CategoryFilter from "@/components/feed/CategoryFilter";
import PostList from "@/components/feed/PostList";
import WeeklyPrompt from "@/components/reality-check/WeeklyPrompt";
import ResultsView from "@/components/reality-check/ResultsView";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";

import { CreatePostDialog } from "@/components/CreatePostDialog";

import { useLocation } from "wouter";

export default function Feed() {
  const { user, isLoading: authLoading } = useAuth();
  const { data: profile } = useProfile();
  const [category, setCategory] = useState<string | null>(null);
  const [hasSubmittedCheck, setHasSubmittedCheck] = useState(false);
  const [showGate, setShowGate] = useState(false);
  const [location] = useLocation();

  const searchParams = new URLSearchParams(window.location.search);
  const searchQuery = searchParams.get("search") || undefined;

  // A "full member" is authenticated WITH a completed profile
  const isFullMember = !!user && !!profile && !!profile.companyId;

  // Engagement gate: Show after scroll
  useEffect(() => {
    if (user) return; // Don't show for any authenticated user
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
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Feed Controls */}
      <div className="bg-card/50 backdrop-blur-sm sticky top-[4rem] z-30 py-2 -mx-4 px-4 border-b md:border-none md:static md:bg-transparent md:p-0">
        <CategoryFilter selected={category} onSelect={setCategory} />
        {searchQuery && (
          <div className="mt-2 text-sm text-muted-foreground">
            Showing results for "<span className="font-semibold text-foreground">{searchQuery}</span>"
            <Button
              variant="ghost"
              size="sm"
              className="ml-2 h-auto p-0 text-primary hover:text-primary/80"
              onClick={() => window.location.href = "/"}
            >
              Clear
            </Button>
          </div>
        )}
      </div>

      {/* Guest Banner */}
      {!isFullMember && !searchQuery && (
        <section className="relative overflow-hidden bg-primary/5 border border-primary/20 rounded-2xl p-6 sm:p-8">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
          <div className="relative z-10 space-y-4">
            <h2 className="text-2xl font-display font-bold text-foreground leading-tight">
              A silent, safe place for <br />
              <span className="text-primary font-extrabold italic">honest work talk.</span>
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-lg">
              Offisocial is where verified employees share real workplace experiences anonymously.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                className="rounded-xl bg-[#0077B5] hover:bg-[#006396] text-white shadow-lg shadow-[#0077B5]/20 font-bold"
                onClick={() => window.location.href = "/api/auth/linkedin"}
              >
                Join via LinkedIn
              </Button>
              <Button
                variant="outline"
                className="rounded-xl border-primary/20 hover:bg-primary/5 font-semibold"
                onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
              >
                Read Public Feed
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Reality Check Section - Member Only */}
      {isFullMember && !searchQuery && (
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

      <PostList category={category} searchQuery={searchQuery} />

      {/* Engagement Gate Overlay - Guest Only */}
      <AnimatePresence>
        {showGate && !user && (
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

      {/* Floating Action Button - Member Only */}
      {isFullMember && (
        <div className="fixed bottom-6 right-4 sm:right-6 md:bottom-8 md:right-8 lg:right-[340px] z-40">
          <CreatePostDialog />
        </div>
      )}
    </div>
  );
}
