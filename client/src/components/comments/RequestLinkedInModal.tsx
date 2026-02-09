import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { Linkedin } from "lucide-react";

interface RequestLinkedInModalProps {
    isOpen: boolean;
    onClose: () => void;
    targetUserRole: string;
}

export default function RequestLinkedInModal({ isOpen, onClose, targetUserRole }: RequestLinkedInModalProps) {
    const [message, setMessage] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [isSent, setIsSent] = useState(false);

    const handleSend = () => {
        setIsSending(true);
        setTimeout(() => {
            setIsSending(false);
            setIsSent(true);
            setTimeout(() => {
                onClose();
                setIsSent(false);
                setMessage("");
            }, 2000);
        }, 1000);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md mx-4 sm:mx-auto rounded-xl sm:rounded-lg">
                {!isSent ? (
                    <>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                                <Linkedin className="w-4 h-4 sm:w-5 sm:h-5 text-[#0077B5]" />
                                Connect on LinkedIn?
                            </DialogTitle>
                            <DialogDescription className="text-xs sm:text-sm">
                                Request to reveal identities with this {targetUserRole}.
                                They will see your profile if they accept.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-3 sm:py-4">
                            <Textarea
                                placeholder="Optional: Add a note about why you want to connect..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                className="h-20 sm:h-24 resize-none text-sm"
                            />
                            <p className="text-[10px] sm:text-xs text-muted-foreground mt-2">
                                Your LinkedIn URL will be shared securely only if they accept.
                            </p>
                        </div>
                        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                            <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">Cancel</Button>
                            <Button onClick={handleSend} disabled={isSending} className="w-full sm:w-auto">
                                {isSending ? "Sending Request..." : "Send Request"}
                            </Button>
                        </DialogFooter>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center py-6 text-center space-y-3">
                        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-blue-100 flex items-center justify-center mb-2">
                            <Linkedin className="w-5 h-5 sm:w-6 sm:h-6 text-[#0077B5]" />
                        </div>
                        <h3 className="font-semibold text-base sm:text-lg">Request Sent!</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                            We'll notify you if they decide to connect.
                        </p>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
