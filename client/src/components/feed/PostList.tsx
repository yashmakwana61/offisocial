import { usePosts, usePublicPosts } from "@/hooks/use-posts";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profiles";
import PostItem from "./PostItem";
import { Loader2, MessageSquareDashed } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";
import { useInView } from "react-intersection-observer";

interface PostListProps {
    category: string | null;
}

export default function PostList({ category }: PostListProps) {
    const { user, isLoading: authLoading } = useAuth();
    const { data: profile, isLoading: profileLoading } = useProfile();
    const { ref, inView } = useInView();

    // A "full member" is someone who is authenticated AND has a completed profile
    const isFullMember = !!user && !!profile && profile.companyId;
    const isResolving = authLoading || (!!user && profileLoading);

    const {
        data: memberPages,
        isLoading: memberLoading,
        isError: memberError,
        fetchNextPage: fetchNextMemberPage,
        hasNextPage: hasNextMemberPage,
        isFetchingNextPage: isFetchingNextMemberPage
    } = usePosts(category || undefined, !isResolving && !!isFullMember);

    const {
        data: publicPages,
        isLoading: publicLoading,
        isError: publicError,
        fetchNextPage: fetchNextPublicPage,
        hasNextPage: hasNextPublicPage,
        isFetchingNextPage: isFetchingNextPublicPage
    } = usePublicPosts(category || undefined, !isResolving && !isFullMember);

    useEffect(() => {
        if (inView) {
            if (isFullMember && hasNextMemberPage) {
                fetchNextMemberPage();
            } else if (!isFullMember && hasNextPublicPage) {
                fetchNextPublicPage();
            }
        }
    }, [inView, isFullMember, hasNextMemberPage, hasNextPublicPage, fetchNextMemberPage, fetchNextPublicPage]);

    const pages = isFullMember ? memberPages : publicPages;
    const posts = pages?.pages.flat() || [];
    const isLoading = isResolving || (isFullMember ? memberLoading : publicLoading);
    const isError = isFullMember ? memberError : publicError;
    const isFetchingNextPage = isFullMember ? isFetchingNextMemberPage : isFetchingNextPublicPage;
    const hasNextPage = isFullMember ? hasNextMemberPage : hasNextPublicPage;

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

    if (posts.length === 0) {
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
            <AnimatePresence mode="popLayout" initial={false}>
                {posts.map((post) => (
                    <motion.div
                        key={post.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <PostItem post={post} />
                    </motion.div>
                ))}
            </AnimatePresence>

            {/* Infinite Scroll Trigger */}
            <div ref={ref} className="py-4 flex justify-center">
                {isFetchingNextPage ? (
                    <Loader2 className="w-6 h-6 animate-spin text-primary/40" />
                ) : hasNextPage ? (
                    <div className="h-10" /> // Spacer for observer
                ) : (
                    <p className="text-xs text-muted-foreground/50 italic">You've reached the end of the feed</p>
                )}
            </div>
        </div>
    );
}
