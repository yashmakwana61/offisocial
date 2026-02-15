import { useVotePoll } from "@/hooks/use-posts";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

interface PollCardProps {
    postId: number;
    pollResults: {
        options: { label: string; count: number }[];
        totalVotes: number;
        userVoteIndex?: number | null;
    };
}

export function PollCard({ postId, pollResults }: PollCardProps) {
    const votePoll = useVotePoll();
    const hasVoted = pollResults.userVoteIndex !== null && pollResults.userVoteIndex !== undefined;

    const handleVote = (index: number) => {
        if (votePoll.isPending) return;
        votePoll.mutate({ postId, optionIndex: index });
    };

    return (
        <div className="mt-4 space-y-3 bg-muted/20 p-4 rounded-2xl border border-border/40">
            {pollResults.options.map((option, index) => {
                const percentage = pollResults.totalVotes > 0
                    ? Math.round((option.count / pollResults.totalVotes) * 100)
                    : 0;
                const isWinner = hasVoted && option.count === Math.max(...pollResults.options.map(o => o.count));
                const isUserVote = pollResults.userVoteIndex === index;

                return (
                    <button
                        key={index}
                        disabled={votePoll.isPending}
                        onClick={() => handleVote(index)}
                        className={cn(
                            "relative w-full h-12 rounded-xl border transition-all overflow-hidden group text-left",
                            isUserVote
                                ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                                : "border-border/60 bg-background hover:border-border hover:bg-muted/30"
                        )}
                    >
                        {hasVoted && (
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${percentage}%` }}
                                className={cn(
                                    "absolute inset-y-0 left-0 transition-all duration-1000",
                                    isUserVote ? "bg-primary/10" : "bg-muted"
                                )}
                            />
                        )}

                        <div className="absolute inset-0 px-4 flex items-center justify-between z-10">
                            <span className={cn(
                                "text-sm font-medium transition-colors",
                                isUserVote ? "text-primary" : "text-foreground/80"
                            )}>
                                {option.label}
                                {isUserVote && <CheckCircle2 className="w-3.5 h-3.5 inline ml-2" />}
                            </span>

                            {hasVoted && (
                                <span className="text-xs font-bold text-muted-foreground">
                                    {percentage}%
                                </span>
                            )}
                        </div>
                    </button>
                );
            })}

            <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    {pollResults.totalVotes} {pollResults.totalVotes === 1 ? 'vote' : 'votes'}
                </span>
                {!hasVoted && (
                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
                        Results hidden until you vote
                    </span>
                )}
            </div>
        </div>
    );
}
