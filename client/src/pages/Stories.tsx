import { useAuth } from "@/hooks/use-auth";
import StoryCard from "@/components/stories/StoryCard";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { usePosts } from "@/hooks/use-posts";
import { CreatePostDialog } from "@/components/CreatePostDialog";

export default function Stories() {
    const { user } = useAuth();
    const [, setLocation] = useLocation();
    const { data: postsData, isLoading } = usePosts();

    // In a real app, we might have a specific 'story' type or category.
    // For now, we'll show recent interesting posts as "stories".
    const stories = postsData?.pages.flat().slice(0, 10) || [];

    return (
        <div className="min-h-screen bg-background pb-24 md:pb-20">
            <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border/40">
                <div className="max-w-2xl lg:max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
                    <Button variant="ghost" size="icon" className="-ml-2" onClick={() => setLocation("/")}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <h1 className="font-display font-bold text-xl sm:text-2xl tracking-tight">Anonymous Stories</h1>
                </div>
            </header>

            <main className="max-w-2xl lg:max-w-3xl mx-auto px-4 sm:px-6 pt-6 pb-20 space-y-4">
                <div className="p-4 sm:p-5 bg-muted/30 rounded-2xl mb-6">
                    <p className="text-sm sm:text-base text-muted-foreground text-center">
                        Short, ephemeral stories. No comments, no history. <br className="hidden sm:block" />
                        Just pure venting and relating.
                    </p>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary/30" />
                    </div>
                ) : stories.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground">No stories yet. Be the first to share.</p>
                    </div>
                ) : (
                    <div className="space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
                        {stories.map((story, i) => (
                            <motion.div
                                key={story.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="md:first:col-span-2"
                            >
                                <StoryCard story={story} />
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>

            {/* Floating Action Button */}
            <div className="fixed bottom-6 right-4 sm:right-6 md:bottom-8 md:right-8 lg:right-[calc(50%-18rem)] z-40">
                <CreatePostDialog />
            </div>
        </div>
    );
}

