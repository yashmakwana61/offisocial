import { useState, useEffect } from "react";
import { useCreateProfile, useVerificationStatus } from "@/hooks/use-profiles";
import { Card } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

// Steps
import LinkedInVerification from "@/components/onboarding/LinkedInVerification";
import CompanyConfirmation from "@/components/onboarding/CompanyConfirmation";
import RoleInput from "@/components/onboarding/RoleInput";

// Restricted words logic
const RESTRICTED_ROLES = ["hr", "human resources", "ceo", "cto", "cfo", "coo", "founder", "executive", "vp of people", "head of people"];

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    companyName: "",
    role: "",
  });

  const { data: status } = useVerificationStatus();
  const createProfile = useCreateProfile();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const nextStep = () => setStep((s) => s + 1);

  const handleVerifyComplete = () => {
    if (status?.status === "verified_full") {
      toast({
        title: "Verification Successful",
        description: "You've been fully verified via LinkedIn.",
      });
      setLocation("/");
    } else {
      nextStep();
    }
  };

  const handleCompanySubmit = (data: { companyName: string }) => {
    setFormData((prev) => ({ ...prev, ...data }));
    nextStep();
  };

  const handleRoleSubmit = (data: { role: string }) => {
    const roleLower = data.role.toLowerCase();
    const isRestricted = RESTRICTED_ROLES.some(r => roleLower.includes(r));

    if (isRestricted) {
      setLocation("/blocked-role");
      return;
    }

    const finalData = { ...formData, ...data };

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
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground tracking-tight">SafeSpace</h1>

          {/* Progress Indicator */}
          <div className="flex items-center justify-center gap-2 mt-5 sm:mt-6">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-300 ${s === step ? "w-6 sm:w-8 bg-primary" : s < step ? "w-6 sm:w-8 bg-primary/40" : "w-2 bg-muted-foreground/20"
                  }`}
              />
            ))}
          </div>
        </div>

        <Card className="p-6 sm:p-8 md:p-10 rounded-2xl sm:rounded-[2rem] shadow-2xl shadow-black/5 border-white/20 dark:border-white/10 backdrop-blur-sm bg-card/80">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <LinkedInVerification key="step1" onComplete={handleVerifyComplete} />
            )}
            {step === 2 && (
              <CompanyConfirmation key="step2" onComplete={handleCompanySubmit} />
            )}
            {step === 3 && (
              <RoleInput key="step3" onComplete={handleRoleSubmit} isLoading={createProfile.isPending} />
            )}
          </AnimatePresence>
        </Card>
      </motion.div>
    </div>
  );
}
