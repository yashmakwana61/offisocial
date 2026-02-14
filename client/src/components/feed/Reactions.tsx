import { Button } from "@/components/ui/button";
import { Heart, Lightbulb, Loader2, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToggleReaction } from "@/hooks/use-posts";
import { useAuth } from "@/hooks/use-auth";
import { motion, AnimatePresence } from "framer-motion";

interface ReactionsProps {
    post: any;
}

export default function Reactions({ post }: ReactionsProps) {
    const { user } = useAuth();
    const toggleReaction = useToggleReaction();

    const reactions = (post.reactions as any[]) || [];
    const supportCount = post.reactionCounts?.support ?? reactions.filter(r => r.type === 'support').length;
    const helpfulCount = post.reactionCounts?.helpful ?? reactions.filter(r => r.type === 'helpful').length;

    const hasSupported = post.userReaction === 'support';
    const hasFoundHelpful = post.userReaction === 'helpful';

    const handleToggle = (e: React.MouseEvent, type: 'support' | 'helpful') => {
        e.preventDefault();
        e.stopPropagation();

        if (!user) {
            window.location.href = "/api/auth/linkedin";
            return;
        }

        // Remove rapid toggle block for smoother feel
        // if (toggleReaction.isPending) return;

        toggleReaction.mutate({
            targetType: 'post',
            targetId: post.id,
            type
        });
    };

    const isSupportPending = toggleReaction.isPending && toggleReaction.variables?.type === 'support';
    const isHelpfulPending = toggleReaction.isPending && toggleReaction.variables?.type === 'helpful';

    return (
        <div className="flex items-center gap-1 sm:gap-2">
            <Button
                variant="ghost"
                size="sm"
                onClick={(e) => handleToggle(e, 'support')}
                disabled={toggleReaction.isPending && !isSupportPending}
                className={cn(
                    "rounded-full gap-1 sm:gap-1.5 px-2 sm:px-3 h-7 sm:h-8 transition-all duration-200",
                    hasSupported
                        ? "text-[#ff3040] bg-[#ff3040]/10"
                        : "hover:bg-rose-500/10 hover:text-[#ff3040]",
                    !user && "opacity-60 cursor-pointer"
                )}
            >
                <AnimatePresence mode="popLayout" initial={false}>
                    {isSupportPending ? (
                        <motion.div
                            key="loader"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                        >
                            <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                        </motion.div>
                    ) : (
                        <motion.div
                            key={hasSupported ? "filled" : "outline"}
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            whileTap={{ scale: 1.25 }}
                            transition={{ type: "spring", stiffness: 400, damping: 17 }}
                        >
                            {user ? (
                                <Heart
                                    className={cn(
                                        "w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors",
                                        hasSupported && "fill-current text-[#ff3040]"
                                    )}
                                />
                            ) : (
                                <Lock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-muted-foreground/70" />
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
                <span className="text-[10px] sm:text-xs font-medium">{supportCount}</span>
                <span className="sr-only">Support</span>
            </Button>

            <Button
                variant="ghost"
                size="sm"
                onClick={(e) => handleToggle(e, 'helpful')}
                disabled={toggleReaction.isPending && !isHelpfulPending}
                className={cn(
                    "rounded-full gap-1 sm:gap-1.5 px-2 sm:px-3 h-7 sm:h-8 transition-all duration-200",
                    hasFoundHelpful ? "text-amber-500 bg-amber-500/10" : "hover:bg-amber-500/10 hover:text-amber-500",
                    !user && "opacity-60 cursor-pointer"
                )}
            >
                <AnimatePresence mode="popLayout" initial={false}>
                    {isHelpfulPending ? (
                        <motion.div
                            key="loader"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                        >
                            <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                        </motion.div>
                    ) : (
                        <motion.div
                            key={hasFoundHelpful ? "filled" : "outline"}
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            whileTap={{ scale: 1.25 }}
                            transition={{ type: "spring", stiffness: 400, damping: 17 }}
                        >
                            {user ? (
                                <Lightbulb className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4", hasFoundHelpful && "fill-current")} />
                            ) : (
                                <Lock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-muted-foreground/70" />
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
                <span className="text-[10px] sm:text-xs font-medium">{helpfulCount}</span>
                <span className="sr-only">Helpful</span>
            </Button>
        </div>
    );
}

