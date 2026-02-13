import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Heart, Loader2 } from "lucide-react";
import { useState, memo } from "react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { useToggleReaction } from "@/hooks/use-posts";
import { useAuth } from "@/hooks/use-auth";

interface Story {
    id: number;
    content: string;
    createdAt: string | Date | null;
    reactions?: any[];
}

interface StoryCardProps {
    story: Story;
}

const StoryCard = memo(function StoryCard({ story }: StoryCardProps) {
    const { user } = useAuth();
    const toggleReaction = useToggleReaction();

    const reactions = (story.reactions as any[]) || [];
    const relateCount = reactions.filter(r => r.type === 'support').length;
    const hasRelated = reactions.some(r => r.userId === user?.id && r.type === 'support');

    const handleRelate = () => {
        toggleReaction.mutate({
            targetType: 'post',
            targetId: story.id,
            type: 'support'
        });
    };

    return (
        <Card className="p-4 sm:p-6 bg-card/50 backdrop-blur-sm border-border/50 hover:border-border/80 transition-all">
            <div className="mb-3 sm:mb-4">
                <p className="text-base sm:text-lg font-medium leading-relaxed font-display">
                    "{story.content}"
                </p>
            </div>

            <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] sm:text-xs text-muted-foreground">
                    {story.createdAt ? formatDistanceToNow(new Date(story.createdAt), { addSuffix: true }) : 'Just now'}
                </span>

                <Button
                    variant="ghost"
                    size="sm"
                    disabled={toggleReaction.isPending}
                    onClick={handleRelate}
                    className={cn(
                        "rounded-full gap-1.5 sm:gap-2 transition-all h-8 sm:h-9 px-3 sm:px-4",
                        hasRelated ? "text-blue-500 bg-blue-500/10" : "text-muted-foreground hover:text-blue-500"
                    )}
                >
                    {toggleReaction.isPending ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                        <Heart className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4", hasRelated && "fill-current")} />
                    )}
                    <span className="text-[10px] sm:text-xs font-medium">
                        {relateCount > 0 ? `${relateCount} relate` : "I relate"}
                    </span>
                </Button>
            </div>
        </Card>
    );
});

export default StoryCard;

