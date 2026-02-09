import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useCreateReport } from "@/hooks/use-features";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    targetId: number;
    targetType: "post" | "comment";
}

const REASONS = [
    "Harassment or bullying",
    "Compromises anonymity",
    "Hate speech",
    "Spam or self-promotion",
    "Other"
];

export default function ReportModal({ isOpen, onClose, targetId, targetType }: ReportModalProps) {
    const [step, setStep] = useState<"reason" | "confirm">("reason");
    const [selectedReason, setSelectedReason] = useState("");
    const [details, setDetails] = useState("");
    const { toast } = useToast();
    const reportMutation = useCreateReport();

    const handleSubmit = () => {
        const reason = selectedReason === "Other" ? `Other: ${details}` : selectedReason;

        reportMutation.mutate({
            targetId,
            targetType,
            reason
        }, {
            onSuccess: () => {
                setStep("confirm");
                toast({
                    title: "Report Submitted",
                    description: "Thank you for helping keep the community safe."
                });
            },
            onError: (error) => {
                toast({
                    title: "Report Failed",
                    description: error.message,
                    variant: "destructive"
                });
            }
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md mx-4 sm:mx-auto rounded-xl sm:rounded-lg">
                {step === "reason" ? (
                    <>
                        <DialogHeader>
                            <DialogTitle className="text-base sm:text-lg">Report this content</DialogTitle>
                            <DialogDescription className="text-xs sm:text-sm">
                                We keep the community safe together. Your report is anonymous.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-3 sm:py-4 space-y-3 sm:space-y-4">
                            <RadioGroup value={selectedReason} onValueChange={setSelectedReason}>
                                {REASONS.map((reason) => (
                                    <div key={reason} className="flex items-center space-x-2">
                                        <RadioGroupItem value={reason} id={reason} className="h-4 w-4" />
                                        <Label htmlFor={reason} className="text-sm">{reason}</Label>
                                    </div>
                                ))}
                            </RadioGroup>

                            {selectedReason === "Other" && (
                                <Textarea
                                    placeholder="Please provide more details..."
                                    className="text-sm h-20"
                                    value={details}
                                    onChange={(e) => setDetails(e.target.value)}
                                />
                            )}
                        </div>
                        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                            <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">Cancel</Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={!selectedReason || reportMutation.isPending}
                                className="w-full sm:w-auto"
                            >
                                {reportMutation.isPending && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Submit Report
                            </Button>
                        </DialogFooter>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center py-6 sm:py-8 text-center space-y-3">
                        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-2">
                            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h3 className="font-semibold text-base sm:text-lg">Thanks for letting us know</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground max-w-xs px-4">
                            We've received your report and will review it shortly. We've hidden this content for you.
                        </p>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
