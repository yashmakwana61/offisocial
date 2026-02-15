import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ShieldAlert, CheckCircle2 } from "lucide-react";
import { useState } from "react";

const guidelines = [
    "I will be respectful to all community members.",
    "I will not post toxic, hateful, or discriminatory content.",
    "I will respect the anonymity of others and not attempt to 'dox'.",
    "I understand that C-Level/HR are excluded for safety.",
];

interface SafetyPledgeProps {
    onComplete: () => void;
}

export default function SafetyPledge({ onComplete }: SafetyPledgeProps) {
    const [checked, setChecked] = useState<boolean[]>(new Array(guidelines.length).fill(false));

    const toggleCheck = (index: number) => {
        const newChecked = [...checked];
        newChecked[index] = !newChecked[index];
        setChecked(newChecked);
    };

    const allChecked = checked.every(Boolean);

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
        >
            <div className="text-center space-y-2">
                <div className="inline-flex p-3 rounded-2xl bg-amber-500/10 text-amber-500 mb-2">
                    <ShieldAlert size={32} />
                </div>
                <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">Community Safety Pledge</h2>
                <p className="text-muted-foreground text-xs sm:text-sm">
                    To maintain a safe and productive space, we ask all members to commit to these guidelines.
                </p>
            </div>

            <div className="space-y-3 pt-2">
                {guidelines.map((guideline, i) => (
                    <div
                        key={i}
                        className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${checked[i] ? "bg-primary/5 border-primary/20" : "bg-muted/30 border-transparent hover:border-muted-foreground/20"
                            }`}
                        onClick={() => toggleCheck(i)}
                    >
                        <Checkbox
                            checked={checked[i]}
                            onCheckedChange={() => toggleCheck(i)}
                            className="mt-0.5"
                        />
                        <span className="text-sm leading-snug">{guideline}</span>
                    </div>
                ))}
            </div>

            <Button
                onClick={onComplete}
                disabled={!allChecked}
                className="w-full h-11 sm:h-12 rounded-xl text-base sm:text-lg font-medium shadow-md transition-all"
            >
                I Agree & Commit
                {allChecked && <CheckCircle2 className="ml-2 h-5 w-5" />}
            </Button>
        </motion.div>
    );
}
