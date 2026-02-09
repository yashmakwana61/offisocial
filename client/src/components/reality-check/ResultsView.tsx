import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useAggregatedCheckins } from "@/hooks/use-features";
import { Loader2 } from "lucide-react";

interface ResultData {
    label: string;
    percentage: number;
    color: string;
}

const MOOD_LABELS: Record<string, { label: string, color: string }> = {
    "5": { label: "Optimistic", color: "bg-green-500" },
    "3": { label: "Just Okay", color: "bg-blue-500" },
    "2": { label: "Drained", color: "bg-orange-500" },
    "1": { label: "Toxic", color: "bg-red-500" },
};

export default function ResultsView() {
    const { data: results, isLoading, isError } = useAggregatedCheckins();

    if (isLoading) {
        return (
            <Card className="p-4 sm:p-6 flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary/50" />
            </Card>
        );
    }

    if (isError || !results) {
        return (
            <Card className="p-4 sm:p-6 text-center">
                <p className="text-sm text-muted-foreground">Unable to load team vibes.</p>
            </Card>
        );
    }

    const moodCounts = results.moodCounts || [];
    const total = moodCounts.reduce((acc: number, r: any) => acc + r.count, 0);
    const chartData: ResultData[] = moodCounts.map((r: any) => ({
        label: MOOD_LABELS[String(r.moodScore)]?.label || "Unknown",
        percentage: total > 0 ? Math.round((r.count / total) * 100) : 0,
        color: MOOD_LABELS[String(r.moodScore)]?.color || "bg-muted",
    }));

    return (
        <Card className="p-4 sm:p-6">
            <h3 className="font-display font-semibold text-base sm:text-lg mb-4 sm:mb-6">Company Vibe Check</h3>

            <div className="space-y-3 sm:space-y-4">
                {chartData.map((result, index) => (
                    <div key={result.label} className="space-y-1 sm:space-y-1.5">
                        <div className="flex justify-between text-xs sm:text-sm">
                            <span className="font-medium text-foreground/80">{result.label}</span>
                            <span className="text-muted-foreground">{result.percentage}%</span>
                        </div>
                        <div className="h-2 sm:h-2.5 w-full bg-muted rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${result.percentage}%` }}
                                transition={{ duration: 1, delay: index * 0.1 }}
                                className={`h-full rounded-full ${result.color}`}
                            />
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-border/50 text-center">
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                    Based on {total} anonymous check-ins this week.
                </p>
            </div>
        </Card>
    );
}

