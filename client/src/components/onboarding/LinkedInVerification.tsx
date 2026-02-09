import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Linkedin, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useSubmitLinkedInUrl, useVerificationStatus } from "@/hooks/use-profiles";
import { useToast } from "@/hooks/use-toast";

interface LinkedInVerificationProps {
    onComplete: () => void;
}

export default function LinkedInVerification({ onComplete }: LinkedInVerificationProps) {
    const [url, setUrl] = useState("");
    const { data: status, isLoading: statusLoading } = useVerificationStatus();
    const submitUrl = useSubmitLinkedInUrl();
    const { toast } = useToast();

    const isPending = status?.step === "url_submitted";
    const isCompleted = status?.status === "verified_full" || status?.status === "verified_limited";
    const isRestricted = status?.status === "restricted";

    useEffect(() => {
        if (isCompleted) {
            const timer = setTimeout(onComplete, 2000);
            return () => clearTimeout(timer);
        }
    }, [isCompleted, onComplete]);

    const handleOAuth = () => {
        window.location.href = "/api/auth/linkedin";
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!url.includes("linkedin.com/in/")) {
            toast({
                title: "Invalid URL",
                description: "Please enter a valid LinkedIn profile URL.",
                variant: "destructive",
            });
            return;
        }

        try {
            await submitUrl.mutateAsync(url);
            toast({
                title: "URL Submitted",
                description: "We are now verifying your professional role.",
            });
        } catch (err: any) {
            toast({
                title: "Submission failed",
                description: err.message,
                variant: "destructive",
            });
        }
    };

    if (statusLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                <p className="text-sm text-muted-foreground">Checking verification status...</p>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
        >
            <div className="text-center space-y-2">
                <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">
                    {isCompleted ? "Success!" : isRestricted ? "Access Restricted" : "Verify your identity"}
                </h2>
                <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                    {isCompleted
                        ? "Your professional role has been verified anonymously."
                        : isRestricted
                            ? status?.reason
                            : "Sign in with LinkedIn, then provide your profile URL to verify your role."}
                </p>
            </div>

            <div className="space-y-4">
                {/* OAuth Login (Only shown if not logged in or status missing) */}
                {!status?.status && (
                    <Button
                        size="lg"
                        className="w-full h-12 rounded-xl bg-[#0077B5] hover:bg-[#006396] text-white"
                        onClick={handleOAuth}
                    >
                        <Linkedin className="w-5 h-5 mr-2 fill-current" />
                        Step 1: Sign in with LinkedIn
                    </Button>
                )}

                {/* URL Submission (Only shown after OAuth) */}
                {status?.status === "pending" && status?.step === "oauth_completed" && (
                    <form onSubmit={handleSubmit} className="space-y-3">
                        <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground px-1">
                            Step 2: Submit Public Profile URL
                        </label>
                        <Input
                            placeholder="https://www.linkedin.com/in/your-profile"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            disabled={submitUrl.isPending}
                            className="h-12 rounded-xl"
                        />
                        <Button
                            type="submit"
                            className="w-full h-12 rounded-xl"
                            disabled={submitUrl.isPending || !url}
                        >
                            {submitUrl.isPending ? "Submitting..." : "Verify Role"}
                        </Button>
                    </form>
                )}

                {/* Verification Status Feedback */}
                {isPending && (
                    <div className="bg-primary/5 border border-primary/10 rounded-2xl p-6 text-center space-y-3">
                        <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
                        <div className="space-y-1">
                            <p className="font-medium">Verifying Role...</p>
                            <p className="text-xs text-muted-foreground">Our systems are extracting your professional data anonymously.</p>
                        </div>
                    </div>
                )}

                {isCompleted && (
                    <div className="bg-green-500/5 border border-green-500/10 rounded-2xl p-6 text-center space-y-3">
                        <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
                        <p className="font-medium text-green-600">Employee Verified</p>
                    </div>
                )}

                {isRestricted && (
                    <div className="bg-destructive/5 border border-destructive/10 rounded-2xl p-6 text-center space-y-3">
                        <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
                        <p className="font-medium text-destructive">Restricted Access</p>
                        <p className="text-xs text-muted-foreground">Leadership and HR roles are restricted from this platform.</p>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
