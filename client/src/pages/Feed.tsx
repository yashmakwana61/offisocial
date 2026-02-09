import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profiles";
import CategoryFilter from "@/components/feed/CategoryFilter";
import PostList from "@/components/feed/PostList";
import WeeklyPrompt from "@/components/reality-check/WeeklyPrompt";
import ResultsView from "@/components/reality-check/ResultsView";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useLocation } from "wouter";
import { AnimatePresence, motion } from "framer-motion";

import { CreatePostDialog } from "@/components/CreatePostDialog";

export default function Feed() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const [category, setCategory] = useState<string | null>(null);
  const [hasSubmittedCheck, setHasSubmittedCheck] = useState(false);
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-20">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border/40">
        <div className="max-w-2xl lg:max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <h1 className="font-display font-bold text-xl sm:text-2xl tracking-tight">Feed</h1>
          <div
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center cursor-pointer hover:bg-primary/20 transition-colors"
            onClick={() => setLocation("/profile")}
          >
            <span className="font-medium text-xs sm:text-sm text-primary">
              {profile?.role ? profile.role.charAt(0).toUpperCase() : "M"}
            </span>
          </div>
        </div>

        <div className="max-w-2xl lg:max-w-4xl mx-auto px-4 sm:px-6 pb-3">
          <CategoryFilter selected={category} onSelect={setCategory} />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl lg:max-w-4xl mx-auto px-4 sm:px-6 pt-6 space-y-6 md:space-y-8">
        {/* Reality Check Section */}
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

        <PostList category={category} />
      </main>

      {/* Floating Action Button - responsive positioning */}
      <div className="fixed bottom-6 right-4 sm:right-6 md:bottom-8 md:right-8 lg:right-[calc(50%-20rem)] z-40">
        <CreatePostDialog />
      </div>
    </div>
  );
}
