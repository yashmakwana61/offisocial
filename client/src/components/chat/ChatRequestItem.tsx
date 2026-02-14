import { formatDistanceToNow } from "date-fns";
import { Check, X, Ban, MessageCircle, Lock, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useRespondToChatRequest, useRevealIdentity, useRemindProfile } from "@/hooks/use-posts";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

import { ChatRequest } from "@shared/schema";

interface ChatRequestItemProps {
    request: ChatRequest & {
        otherUserRole?: string | null;
        otherUserId: string;
        otherUserProfile?: {
            firstName: string | null;
            lastName: string | null;
            headline?: string | null;
            companyName: string;
            linkedinUrlEncrypted?: string | null;
        };
    };
    currentUserId: string;
}

export function ChatRequestItem({ request, currentUserId }: ChatRequestItemProps) {
    const respond = useRespondToChatRequest();
    const reveal = useRevealIdentity();
    const remindProfile = useRemindProfile();
    const { toast } = useToast();

    const isIncoming = request.recipientId === currentUserId;
    const isAccepted = request.status === 'accepted';
    const isPending = request.status === 'pending';

    const handleRespond = (status: 'accepted' | 'rejected' | 'ignored') => {
        respond.mutate({ id: request.id, status }, {
            onSuccess: () => {
                toast({ title: `Request ${status}` });
            }
        });
    };

    const handleReveal = (agree: boolean) => {
        reveal.mutate({ requestId: request.id, agree }, {
            onSuccess: (data) => {
                if (data.mutualReveal) {
                    toast({ title: "Identity Revealed!", description: "You can now see each other's profiles." });
                } else {
                    toast({ title: "Preference Updated", description: "Waiting for the other person to agree." });
                }
            }
        });
    };

    const hasRevealedCombined = !!(request.senderIdentityRevealed && request.receiverIdentityRevealed);
    const myRevealStatus = isIncoming ? !!request.receiverIdentityRevealed : !!request.senderIdentityRevealed;

    return (
        <div className="bg-card border border-border/50 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-start">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-lg">
                            {hasRevealedCombined && request.otherUserProfile
                                ? `${request.otherUserProfile.firstName} ${request.otherUserProfile.lastName}`
                                : request.otherUserRole || "Anonymous User"}
                        </span>
                        {hasRevealedCombined && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Identity Revealed</span>}
                    </div>
                    {hasRevealedCombined && request.otherUserProfile && (
                        <p className="text-sm text-muted-foreground">{request.otherUserProfile.headline} at {request.otherUserProfile.companyName}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                        {isIncoming ? "Received" : "Sent"} {request.createdAt ? formatDistanceToNow(new Date(request.createdAt), { addSuffix: true }) : "Unknown time"}
                    </p>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-medium capitalize ${request.status === 'accepted' ? 'bg-green-50 text-green-700' :
                    request.status === 'rejected' ? 'bg-red-50 text-red-700' :
                        request.status === 'ignored' ? 'bg-gray-100 text-gray-600' :
                            request.status === 'expired' ? 'bg-orange-50 text-orange-700' :
                                'bg-blue-50 text-blue-700'
                    }`}>
                    {request.status || 'Unknown'}
                </div>
            </div>

            <div className="bg-muted/30 p-3 rounded-lg text-sm italic text-foreground/80">
                "{request.introMessage}"
            </div>

            {isIncoming && isPending && (
                <div className="flex gap-2 justify-end">
                    <Button size="sm" variant="ghost" onClick={() => handleRespond('ignored')}>
                        Ignore
                    </Button>
                    <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => handleRespond('rejected')}>
                        Decline
                    </Button>
                    <Button size="sm" onClick={() => handleRespond('accepted')}>
                        Accept Chat
                    </Button>
                </div>
            )}

            {isAccepted && (
                <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-border/50">
                    <div className="flex-1 flex items-center gap-2">
                        <Link href={`/chat/${request.id}`}>
                            <Button size="sm" className="w-full sm:w-auto gap-2">
                                <MessageCircle className="w-4 h-4" />
                                Open Chat
                            </Button>
                        </Link>
                        {hasRevealedCombined && (
                            <Button
                                size="sm"
                                variant="outline"
                                className="gap-2"
                                onClick={() => {
                                    if (request.otherUserProfile?.linkedinUrlEncrypted) {
                                        window.open(request.otherUserProfile.linkedinUrlEncrypted, '_blank');
                                    } else {
                                        remindProfile.mutate(request.id, {
                                            onSuccess: () => {
                                                toast({ title: "Reminder Sent", description: "We've sent a message reminding them to update their LinkedIn profile." });
                                            },
                                            onError: () => {
                                                toast({ title: "Error", description: "Failed to send reminder.", variant: "destructive" });
                                            }
                                        });
                                    }
                                }}
                            >
                                <Unlock className="w-3 h-3" />
                                View Profile
                            </Button>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {hasRevealedCombined ? (
                            <div className="flex items-center gap-2 text-sm text-green-600">
                                <span className="text-xs">Identities Revealed</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <span className="text-xs text-muted-foreground">
                                    {myRevealStatus ? "Waiting for other party..." : "Reveal your identity?"}
                                </span>
                                <Button
                                    size="sm"
                                    variant={myRevealStatus ? "outline" : "secondary"}
                                    onClick={() => handleReveal(!myRevealStatus)}
                                    className={cn("gap-2", myRevealStatus && "bg-green-50 text-green-700 border-green-200 hover:bg-green-100")}
                                >
                                    {myRevealStatus ? <Check className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                                    {myRevealStatus ? "Consented" : "Reveal Identity"}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
