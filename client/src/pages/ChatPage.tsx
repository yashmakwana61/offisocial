import { useState, useEffect, useRef } from "react";
import { useRoute, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { usePrivateMessages, useSendPrivateMessage, useChatRequests } from "@/hooks/use-posts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, ArrowLeft, Send, MoreVertical, ShieldAlert } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useBlockUser } from "@/hooks/use-posts";
import { useToast } from "@/hooks/use-toast";

export default function ChatPage() {
    const [match, params] = useRoute("/chat/:id");
    const chatRequestId = match ? parseInt(params.id) : 0;

    const { user } = useAuth();
    const { data: messages, isLoading: messagesLoading } = usePrivateMessages(chatRequestId);
    const { data: requests } = useChatRequests();
    const sendMessage = useSendPrivateMessage();
    const blockUser = useBlockUser();
    const { toast } = useToast();

    const [newMessage, setNewMessage] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const request = requests?.find(r => r.id === chatRequestId);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    if (!user || !chatRequestId) return null;

    if (messagesLoading || !request) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const otherUserRole = request.otherUserRole || "Anonymous User";
    const otherUserName = (request.senderIdentityRevealed && request.receiverIdentityRevealed && request.otherUserProfile)
        ? `${request.otherUserProfile.firstName} ${request.otherUserProfile.lastName}`
        : otherUserRole;

    const otherUserId = request.recipientId === user.id ? request.requesterId : request.recipientId;

    const handleSend = () => {
        if (!newMessage.trim()) return;
        sendMessage.mutate({ chatRequestId, content: newMessage }, {
            onSuccess: () => {
                setNewMessage("");
            }
        });
    };

    const handleBlock = () => {
        if (confirm("Are you sure you want to block this user? You won't be able to message each other anymore.")) {
            blockUser.mutate(otherUserId, {
                onSuccess: () => {
                    toast({ title: "User blocked", description: "You have blocked this user." });
                    window.location.href = "/chat-requests";
                },
                onError: (err) => {
                    toast({ title: "Failed to block", description: err.message, variant: "destructive" });
                }
            });
        }
    };

    return (
        <div className="flex flex-col h-screen max-w-3xl mx-auto border-x border-border/50 bg-background">
            {/* Header */}
            <div className="flex items-center justify-between p-3 sm:p-4 border-b border-border/50 bg-background/95 backdrop-blur z-10 sticky top-0 shadow-sm">
                <div className="flex items-center gap-2 sm:gap-4">
                    <Link href="/chat-requests">
                        <Button variant="ghost" className="gap-2 pl-2 pr-3 text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="w-5 h-5" />
                            <span className="hidden sm:inline font-medium">Back</span>
                        </Button>
                    </Link>
                    <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 sm:h-10 sm:w-10 border border-border">
                            <AvatarFallback>{otherUserName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <h2 className="font-semibold text-sm sm:text-base leading-tight">{otherUserName}</h2>
                            <p className="text-[10px] sm:text-xs text-muted-foreground">
                                {request.senderIdentityRevealed && request.receiverIdentityRevealed
                                    ? "Identity Revealed"
                                    : "Anonymous Chat"}
                            </p>
                        </div>
                    </div>
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9">
                            <MoreVertical className="w-5 h-5 text-muted-foreground" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={handleBlock}>
                            <ShieldAlert className="w-4 h-4 mr-2" />
                            Block User
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50/50 dark:bg-background/50">
                {messages?.length === 0 && (
                    <div className="text-center py-10 opacity-50 space-y-2">
                        <p>No messages yet.</p>
                        <p className="text-xs">Send a message to start the conversation.</p>
                    </div>
                )}

                {messages?.map((msg, index) => {
                    const isMine = msg.senderId === user.id;
                    const showTime = index === 0 ||
                        new Date(msg.createdAt).getTime() - new Date(messages[index - 1].createdAt).getTime() > 1000 * 60 * 5;

                    return (
                        <div key={msg.id} className="space-y-1">
                            {showTime && (
                                <div className="flex justify-center my-2">
                                    <span className="text-[10px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                                        {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                                    </span>
                                </div>
                            )}
                            <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                                <div
                                    className={`max-w-[75%] px-4 py-2.5 shadow-sm text-sm break-words ${isMine
                                        ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm"
                                        : "bg-white dark:bg-card border border-border/50 text-foreground rounded-2xl rounded-tl-sm"
                                        }`}
                                >
                                    {msg.content}
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border/50 bg-background">
                <form
                    className="flex gap-2"
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSend();
                    }}
                >
                    <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1"
                    />
                    <Button type="submit" size="icon" disabled={!newMessage.trim() || sendMessage.isPending}>
                        {sendMessage.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                </form>
            </div>
        </div>
    );
}
