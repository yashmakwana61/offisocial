import { Button } from "@/components/ui/button";
import { Heart, Lightbulb, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToggleReaction } from "@/hooks/use-posts";
import { useAuth } from "@/hooks/use-auth";

interface ReactionsProps {
    post: any;
}

export default function Reactions({ post }: ReactionsProps) {
    const { user } = useAuth();
    const toggleReaction = useToggleReaction();

    const reactions = (post.reactions as any[]) || [];
    const supportCount = reactions.filter(r => r.type === 'support').length;
    const helpfulCount = reactions.filter(r => r.type === 'helpful').length;

    const hasSupported = reactions.some(r => r.userId === user?.id && r.type === 'support');
    const hasFoundHelpful = reactions.some(r => r.userId === user?.id && r.type === 'helpful');

    const handleToggle = (type: 'support' | 'helpful') => {
        toggleReaction.mutate({
            targetType: 'post',
            targetId: post.id,
            type
        });
    };

    return (
        <div className="flex items-center gap-1 sm:gap-2">
            <Button
                variant="ghost"
                size="sm"
                disabled={toggleReaction.isPending}
                onClick={() => handleToggle('support')}
                className={cn(
                    "rounded-full gap-1 sm:gap-1.5 px-2 sm:px-3 h-7 sm:h-8 hover:bg-rose-500/10 hover:text-rose-500 transition-colors",
                    hasSupported && "text-rose-500 bg-rose-500/10"
                )}
            >
                {toggleReaction.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                    <Heart className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4", hasSupported && "fill-current")} />
                )}
                <span className="text-[10px] sm:text-xs font-medium">{supportCount}</span>
                <span className="sr-only">Support</span>
            </Button>

            <Button
                variant="ghost"
                size="sm"
                disabled={toggleReaction.isPending}
                onClick={() => handleToggle('helpful')}
                className={cn(
                    "rounded-full gap-1 sm:gap-1.5 px-2 sm:px-3 h-7 sm:h-8 hover:bg-amber-500/10 hover:text-amber-500 transition-colors",
                    hasFoundHelpful && "text-amber-500 bg-amber-500/10"
                )}
            >
                {toggleReaction.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                    <Lightbulb className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4", hasFoundHelpful && "fill-current")} />
                )}
                <span className="text-[10px] sm:text-xs font-medium">{helpfulCount}</span>
                <span className="sr-only">Helpful</span>
            </Button>
        </div>
    );
}

