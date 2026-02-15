import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Shield, Users, Lock, ChevronRight } from "lucide-react";
import { useState } from "react";

const slides = [
    {
        title: "Welcome to Offisocial",
        description: "The private, anonymous space for your organization. Discuss work, share experiences, and connect without the fear of judgment.",
        icon: Shield,
        color: "text-blue-500",
        bg: "bg-blue-500/10",
    },
    {
        title: "True Anonymity",
        description: "Your identity is hidden by default. We use zero-knowledge principles to ensure your company never knows who posted what.",
        icon: Lock,
        color: "text-purple-500",
        bg: "bg-purple-500/10",
    },
    {
        title: "Community Driven",
        description: "Connect with verified colleagues across departments. Share salaries, interview experiences, and support each other's growth.",
        icon: Users,
        color: "text-amber-500",
        bg: "bg-amber-500/10",
    },
];

interface IntroSlidesProps {
    onComplete: () => void;
}

export default function IntroSlides({ onComplete }: IntroSlidesProps) {
    const [currentSlide, setCurrentSlide] = useState(0);

    const nextSlide = () => {
        if (currentSlide < slides.length - 1) {
            setCurrentSlide(currentSlide + 1);
        } else {
            onComplete();
        }
    };

    const slide = slides[currentSlide];
    const Icon = slide.icon;

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
        >
            <div className="flex flex-col items-center text-center space-y-6">
                <motion.div
                    key={currentSlide}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={`p-6 rounded-3xl ${slide.bg} ${slide.color}`}
                >
                    <Icon size={48} />
                </motion.div>

                <div className="space-y-2">
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{slide.title}</h2>
                    <p className="text-muted-foreground text-sm sm:text-base leading-relaxed max-w-xs mx-auto">
                        {slide.description}
                    </p>
                </div>

                <div className="flex gap-2">
                    {slides.map((_, i) => (
                        <div
                            key={i}
                            className={`h-1.5 rounded-full transition-all duration-300 ${i === currentSlide ? "w-6 bg-primary" : "w-1.5 bg-muted"
                                }`}
                        />
                    ))}
                </div>
            </div>

            <Button
                onClick={nextSlide}
                className="w-full h-12 rounded-xl text-lg font-medium shadow-md transition-all group"
            >
                {currentSlide === slides.length - 1 ? "Get Started" : "Next"}
                <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
        </motion.div>
    );
}
