import { useState, useEffect } from "react";
import { useCreateProfile } from "@/hooks/use-profiles";
import { Card } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

// Steps
import IntroSlides from "@/components/onboarding/IntroSlides";
import CompanyConfirmation from "@/components/onboarding/CompanyConfirmation";
import RoleInput from "@/components/onboarding/RoleInput";
import SafetyPledge from "@/components/onboarding/SafetyPledge";
import InterestSelection from "@/components/onboarding/InterestSelection";
import PersonaSelection from "@/components/onboarding/PersonaSelection";

// Restricted words logic
const RESTRICTED_ROLES: string[] = []; // No blocking for anyone

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    companyName: "",
    role: "",
    linkedinUrl: "",
    interests: [] as string[],
    persona: null as any,
  });

  const createProfile = useCreateProfile();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const nextStep = () => setStep((s) => s + 1);

  const handleStepSubmit = (data: Partial<typeof formData>) => {
    const updatedData = { ...formData, ...data };
    setFormData(updatedData);

    // If it's the last step, submit to backend
    if (step === 6) {
      handleFinalSubmit(updatedData);
    } else {
      nextStep();
    }
  };

  const handleFinalSubmit = (finalData: typeof formData) => {
    createProfile.mutate(finalData, {
      onSuccess: () => {
        toast({
          title: "Welcome aboard!",
          description: "Your anonymous profile is ready.",
        });
        setLocation("/");
      },
      onError: (err) => {
        toast({
          title: "Setup failed",
          description: err.message,
          variant: "destructive",
        });
      },
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30 p-4 sm:p-6 relative overflow-hidden">
      {/* Background decoration - hidden on mobile for performance */}
      <div className="hidden sm:block absolute top-[-10%] right-[-10%] w-[400px] md:w-[500px] h-[400px] md:h-[500px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="hidden sm:block absolute bottom-[-10%] left-[-10%] w-[400px] md:w-[500px] h-[400px] md:h-[500px] bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md sm:max-w-lg relative z-10"
      >
        <div className="text-center mb-8 sm:mb-10">
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground tracking-tight">Offisocial</h1>

          {/* Progress Indicator */}
          <div className="flex items-center justify-center gap-2 mt-5 sm:mt-6">
            {[1, 2, 3, 4, 5, 6].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-300 ${s === step ? "w-6 sm:w-8 bg-primary" : s < step ? "w-6 sm:w-8 bg-primary/40" : "w-2 bg-muted-foreground/20"
                  }`}
              />
            ))}
          </div>
        </div>

        <Card className="p-6 sm:p-8 md:p-10 rounded-2xl sm:rounded-[2rem] shadow-2xl shadow-black/5 border-white/20 dark:border-white/10 backdrop-blur-sm bg-card/80 min-h-[400px] flex flex-col justify-center">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <IntroSlides key="step1" onComplete={() => nextStep()} />
            )}
            {step === 2 && (
              <CompanyConfirmation key="step2" onComplete={handleStepSubmit} />
            )}
            {step === 3 && (
              <RoleInput key="step3" onComplete={handleStepSubmit} />
            )}
            {step === 4 && (
              <SafetyPledge key="step4" onComplete={() => nextStep()} />
            )}
            {step === 5 && (
              <InterestSelection key="step5" onComplete={handleStepSubmit} />
            )}
            {step === 6 && (
              <PersonaSelection key="step6" onComplete={handleStepSubmit} isLoading={createProfile.isPending} />
            )}
          </AnimatePresence>
        </Card>
      </motion.div>
    </div>
  );
}
