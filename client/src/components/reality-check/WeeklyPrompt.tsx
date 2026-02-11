import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useState } from "react";
import { BarChart3, Check, Loader2 } from "lucide-react";
import { useWeeklyCheckin, useSubmitCheckin } from "@/hooks/use-features";
import { useToast } from "@/hooks/use-toast";

interface WeeklyPromptProps {
    onSubmit: (answer: string) => void;
    hasSubmitted?: boolean;
}

const OPTIONS = [
    { id: "great", label: "Optimistic", emoji: "🚀" },
    { id: "meh", label: "Just Okay", emoji: "😐" },
    { id: "bad", label: "Drained", emoji: "😫" },
    { id: "toxic", label: "Toxic", emoji: "☣️" },
];

export default function WeeklyPrompt({ onSubmit, hasSubmitted: propHasSubmitted = false }: WeeklyPromptProps) {
    const [selected, setSelected] = useState<string | null>(null);
    const { data: existingCheckin } = useWeeklyCheckin();
    const submitCheckin = useSubmitCheckin();
    const { toast } = useToast();

    const hasSubmitted = propHasSubmitted || !!existingCheckin;

    const handleSubmit = (optionId: string) => {
        setSelected(optionId);
        submitCheckin.mutate(optionId, {
            onSuccess: () => {
                toast({ title: "Check-in submitted!", description: "Your response is anonymous." });
                onSubmit(optionId);
            },
            onError: (err) => {
                toast({ title: "Already checked in", description: err.message, variant: "destructive" });
                // Still call onSubmit to transition UI if user already checked in
                onSubmit(optionId);
            },
        });
    };

    if (hasSubmitted) {
        return (
            <Card className="p-4 sm:p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                            <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-base sm:text-lg">Thanks for checking in!</h3>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                                See how your team is feeling this week.
                            </p>
                        </div>
                    </div>
                    <Button variant="outline" className="sm:ml-auto w-full sm:w-auto" onClick={() => onSubmit(selected || 'view')}>
                        View Results
                    </Button>
                </div>
            </Card>
        );
    }

    return (
        <Card className="p-4 sm:p-6 overflow-hidden relative">
            <div className="relative z-10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 sm:mb-4">
                    <h3 className="font-display font-semibold text-base sm:text-lg">Weekly Reality Check</h3>
                    <span className="text-[10px] sm:text-xs font-medium bg-muted px-2 py-1 rounded-md text-muted-foreground self-start sm:self-auto">
                        Private & Anonymous
                    </span>
                </div>

                <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6">
                    How is the vibe at work this week?
                </p>

                <div className="grid grid-cols-4 gap-2 sm:gap-3">
                    {OPTIONS.map((option) => (
                        <Button
                            key={option.id}
                            variant="outline"
                            disabled={submitCheckin.isPending}
                            className={`h-auto py-3 sm:py-4 flex flex-col gap-1 sm:gap-2 hover:bg-muted/50 transition-all px-2 sm:px-4 ${selected === option.id ? "border-primary bg-primary/5 ring-1 ring-primary" : ""
                                }`}
                            onClick={() => handleSubmit(option.id)}
                        >
                            {submitCheckin.isPending && selected === option.id ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <span className="text-xl sm:text-2xl">{option.emoji}</span>
                            )}
                            <span className="text-[9px] sm:text-xs font-medium leading-tight">{option.label}</span>
                        </Button>
                    ))}
                </div>
            </div>
        </Card>
    );
}

