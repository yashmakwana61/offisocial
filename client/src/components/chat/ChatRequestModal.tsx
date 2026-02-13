import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useCreateChatRequest } from "@/hooks/use-posts";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Lock } from "lucide-react";

interface ChatRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    recipientId: string;
    recipientRole?: string;
}

export function ChatRequestModal({ isOpen, onClose, recipientId, recipientRole = "Anonymous Coworker" }: ChatRequestModalProps) {
    const [message, setMessage] = useState("");
    const createRequest = useCreateChatRequest();
    const { toast } = useToast();

    const handleSubmit = () => {
        if (!message.trim()) return;

        createRequest.mutate(
            { recipientId, introMessage: message },
            {
                onSuccess: () => {
                    toast({
                        title: "Request Sent",
                        description: "Your private chat request has been sent anonymously."
                    });
                    setMessage("");
                    onClose();
                },
                onError: (error) => {
                    toast({
                        title: "Failed to send request",
                        description: error.message,
                        variant: "destructive"
                    });
                }
            }
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Lock className="w-5 h-5 text-primary" />
                        Request Private Chat
                    </DialogTitle>
                    <DialogDescription>
                        Send a request to chat with {recipientRole}. Your identity will remain anonymous until you both agree to reveal it.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Intro Message (Anonymous)
                        </label>
                        <Textarea
                            placeholder="Hi, I'd like to discuss your recent post about..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="resize-none min-h-[100px]"
                            maxLength={500}
                        />
                        <p className="text-xs text-muted-foreground text-right">
                            {message.length}/500 characters
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">
                            Quick Intros
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {[
                                "I'd like to ask about your experience.",
                                "Can we connect to discuss this?",
                                "I have a similar situation...",
                                "Great post! I have a question."
                            ].map((text) => (
                                <button
                                    key={text}
                                    onClick={() => setMessage(text)}
                                    className="text-xs bg-secondary hover:bg-secondary/80 text-secondary-foreground px-3 py-1.5 rounded-full transition-colors border border-transparent hover:border-border"
                                >
                                    {text}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!message.trim() || createRequest.isPending}
                    >
                        {createRequest.isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Sending...
                            </>
                        ) : (
                            "Send Request"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
