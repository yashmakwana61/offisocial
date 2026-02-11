import { usePosts, usePublicPosts } from "@/hooks/use-posts";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profiles";
import PostItem from "./PostItem";
import { Loader2, MessageSquareDashed } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface PostListProps {
    category: string | null;
}

export default function PostList({ category }: PostListProps) {
    const { user, isLoading: authLoading } = useAuth();
    const { data: profile, isLoading: profileLoading } = useProfile();

    // A "full member" is someone who is authenticated AND has a completed profile
    const isFullMember = !!user && !!profile && profile.companyId;
    const isResolving = authLoading || (!!user && profileLoading);

    const { data: memberPosts, isLoading: memberLoading, isError: memberError } = usePosts(category || undefined, !isResolving && !!isFullMember);
    const { data: publicPosts, isLoading: publicLoading, isError: publicError } = usePublicPosts(category || undefined, !isResolving && !isFullMember);

    const posts = isFullMember ? memberPosts : publicPosts;
    const isLoading = isResolving || (isFullMember ? memberLoading : publicLoading);
    const isError = isFullMember ? memberError : publicError;

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="text-center py-12">
                <p className="text-destructive">Failed to load posts. Please try again.</p>
            </div>
        );
    }

    if (!posts || posts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-4 opacity-60">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                    <MessageSquareDashed className="w-8 h-8 text-muted-foreground" />
                </div>
                <div>
                    <h3 className="text-lg font-medium">No posts yet</h3>
                    <p className="text-sm text-muted-foreground">
                        Be the first to share your thoughts in this category.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 pb-20">
            <AnimatePresence mode="popLayout">
                {posts.map((post) => (
                    <motion.div
                        key={post.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <PostItem post={post} />
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
