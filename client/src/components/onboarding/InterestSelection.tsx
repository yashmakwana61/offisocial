import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { useState } from "react";

const INTERESTS = [
    "Salary & Compensation",
    "Workplace Culture",
    "Interview Tips",
    "Job Referrals",
    "Career Growth",
    "Tech Stack",
    "Remote Work",
    "Office Politics",
    "Management Style",
    "Burnout Support",
];

interface InterestSelectionProps {
    onComplete: (data: { interests: string[] }) => void;
}

export default function InterestSelection({ onComplete }: InterestSelectionProps) {
    const [selected, setSelected] = useState<string[]>([]);

    const toggleInterest = (interest: string) => {
        setSelected((prev) =>
            prev.includes(interest)
                ? prev.filter((i) => i !== interest)
                : [...prev, interest]
        );
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
        >
            <div className="text-center space-y-2">
                <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">What interests you?</h2>
                <p className="text-muted-foreground text-xs sm:text-sm">
                    Select at least 3 topics to personalize your feed.
                </p>
            </div>

            <div className="flex flex-wrap justify-center gap-2 pt-2">
                {INTERESTS.map((interest) => {
                    const isSelected = selected.includes(interest);
                    return (
                        <Badge
                            key={interest}
                            variant={isSelected ? "default" : "outline"}
                            className={`px-4 py-2 text-sm rounded-full cursor-pointer transition-all ${isSelected ? "scale-105 shadow-md" : "hover:bg-muted"
                                }`}
                            onClick={() => toggleInterest(interest)}
                        >
                            {interest}
                            {isSelected && <Check className="ml-1.5 h-3 w-3" />}
                        </Badge>
                    );
                })}
            </div>

            <Button
                onClick={() => onComplete({ interests: selected })}
                disabled={selected.length < 3}
                className="w-full h-11 sm:h-12 rounded-xl text-base sm:text-lg font-medium shadow-md transition-all"
            >
                Continue ({selected.length}/3)
            </Button>
        </motion.div>
    );
}
