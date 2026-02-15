import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { User, Check } from "lucide-react";
import { useState } from "react";

const PERSONAS = [
    { id: "ghost", label: "Midnight Ghost", bg: "bg-slate-900", color: "text-white" },
    { id: "neon", label: "Neon Pulse", bg: "bg-cyan-500", color: "text-white" },
    { id: "emerald", label: "Emerald Scribe", bg: "bg-emerald-500", color: "text-white" },
    { id: "sunset", label: "Sunset Whisper", bg: "bg-orange-500", color: "text-white" },
    { id: "royal", label: "Royal Secret", bg: "bg-indigo-600", color: "text-white" },
    { id: "rose", label: "Rose Petal", bg: "bg-rose-500", color: "text-white" },
];

interface PersonaSelectionProps {
    onComplete: (data: { persona: { themeColor: string } }) => void;
    isLoading?: boolean;
}

export default function PersonaSelection({ onComplete, isLoading }: PersonaSelectionProps) {
    const [selected, setSelected] = useState<string>("ghost");

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
        >
            <div className="text-center space-y-2">
                <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">Pick your persona</h2>
                <p className="text-muted-foreground text-xs sm:text-sm">
                    Select a theme that represents your anonymous presence.
                </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
                {PERSONAS.map((persona) => {
                    const isSelected = selected === persona.id;
                    return (
                        <div
                            key={persona.id}
                            className={`relative flex flex-col items-center p-4 rounded-2xl border transition-all cursor-pointer group ${isSelected ? "border-primary bg-primary/5 shadow-lg" : "border-transparent bg-muted/30 hover:bg-muted/50"
                                }`}
                            onClick={() => setSelected(persona.id)}
                        >
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-transform group-hover:scale-110 ${persona.bg} ${persona.color}`}>
                                <User size={24} />
                            </div>
                            <span className="text-xs font-medium text-center">{persona.label}</span>
                            {isSelected && (
                                <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                                    <Check size={12} className="text-primary-foreground" />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <Button
                onClick={() => onComplete({ persona: { themeColor: selected } })}
                disabled={isLoading}
                className="w-full h-11 sm:h-12 rounded-xl text-base sm:text-lg font-medium shadow-md transition-all"
            >
                {isLoading ? "Setting up..." : "Complete Setup"}
            </Button>
        </motion.div>
    );
}
