import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { POST_CATEGORIES } from "@shared/schema";
import Reactions from "./Reactions";
import { UserCircle, MoreHorizontal, Flag, FileText, MessageCircle, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, memo } from "react";
import ReportModal from "@/components/safety/ReportModal";
import { Link } from "wouter";
import { ChatRequestModal } from "@/components/chat/ChatRequestModal";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useToggleReaction } from "@/hooks/use-posts";
import { motion, AnimatePresence } from "framer-motion";
import { Heart } from "lucide-react";

// Pre-compute category pattern regex
const CATEGORY_REGEX = new RegExp(
    `(@(?:${POST_CATEGORIES
        .map(cat => cat.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
        .join('|')}))`,
    'g'
);

interface PostItemProps {
    post: any;
    fullView?: boolean;
}

const PostItem = memo(function PostItem({ post, fullView = false }: PostItemProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isReportOpen, setIsReportOpen] = useState(false);
    const [isChatRequestOpen, setIsChatRequestOpen] = useState(false);
    const [showHeartOverlay, setShowHeartOverlay] = useState(false);
    const toggleReaction = useToggleReaction();

    const handleChatRequest = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!user) {
            window.location.href = "/api/auth/linkedin";
            return;
        }

        if (post.authorId === user.id) {
            toast({
                title: "Cannot request chat",
                description: "You cannot request a private chat with yourself.",
                variant: "destructive"
            });
            return;
        }

        setIsChatRequestOpen(true);
    };

    const handleDoubleTap = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!user) {
            window.location.href = "/api/auth/linkedin";
            return;
        }

        // Only trigger if not already supported
        if (post.userReaction !== 'support') {
            toggleReaction.mutate({
                targetType: 'post',
                targetId: post.id,
                type: 'support'
            });
        }

        setShowHeartOverlay(true);
        setTimeout(() => setShowHeartOverlay(false), 1000);
    };

    const renderContent = (content: string) => {
        if (!content) return null;
        const parts = content.split(CATEGORY_REGEX);
        return parts.map((part, i) => {
            if (part.startsWith('@')) {
                return <span key={i} className="text-primary font-bold">{part}</span>;
            }
            return part;
        });
    };

    return (
        <>
            <Card className={`p-4 sm:p-5 rounded-xl sm:rounded-2xl border-border/60 shadow-sm bg-card/50 backdrop-blur-sm transition-colors ${!fullView && 'hover:border-border/80'}`}>
                <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center flex-shrink-0">
                            <UserCircle className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-500/70" />
                        </div>
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                                <span className="font-medium text-foreground text-xs sm:text-sm">Anonymous</span>
                                <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-muted-foreground bg-muted px-1 sm:px-1.5 py-0.5 rounded-sm font-semibold truncate max-w-[100px] sm:max-w-none">
                                    {post.authorRole || "Employee"}
                                </span>
                            </div>
                            <p className="text-[10px] sm:text-xs text-muted-foreground/80">
                                {post.createdAt ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }) : 'Just now'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                        <Badge variant="outline" className="text-[9px] sm:text-[10px] font-normal opacity-70 hidden xs:inline-flex">
                            {post.category}
                        </Badge>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 -mr-1 sm:-mr-2">
                                    <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setIsReportOpen(true)} className="text-destructive focus:text-destructive">
                                    <Flag className="w-4 h-4 mr-2" />
                                    Report Content
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                <Badge variant="outline" className="text-[9px] font-normal opacity-70 mb-3 xs:hidden">
                    {post.category}
                </Badge>

                <div className="sm:pl-[52px]">
                    <div
                        className="mb-4 relative cursor-pointer group"
                        onDoubleClick={handleDoubleTap}
                    >
                        <AnimatePresence>
                            {showHeartOverlay && (
                                <motion.div
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 0] }}
                                    exit={{ scale: 0, opacity: 0 }}
                                    transition={{ duration: 0.8, times: [0, 0.4, 1] }}
                                    className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
                                >
                                    <Heart className="w-20 h-20 text-white fill-white drop-shadow-2xl opacity-90" />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {fullView ? (
                            <p className="text-foreground/90 leading-relaxed text-sm sm:text-[15px] whitespace-pre-wrap font-medium">
                                {renderContent(post.content)}
                            </p>
                        ) : (
                            <Link href={`/posts/${post.id}`}>
                                <p className="text-foreground/90 leading-relaxed text-sm sm:text-[15px] whitespace-pre-wrap hover:text-foreground">
                                    {renderContent(post.content)}
                                </p>
                            </Link>
                        )}
                    </div>

                    {post.attachments && post.attachments.length > 0 && (
                        <div className="mb-4 flex flex-wrap gap-3">
                            {post.attachments.map((file: any, i: number) => (
                                <div key={i} className="max-w-full">
                                    {file.type === 'image' ? (
                                        <img
                                            src={file.url}
                                            alt={file.name}
                                            loading="lazy"
                                            className="max-h-[300px] rounded-xl object-contain border bg-muted/10 cursor-pointer hover:opacity-90 transition-opacity"
                                            onClick={() => window.open(file.url, '_blank')}
                                        />
                                    ) : (
                                        <a
                                            href={file.url}
                                            download={file.name}
                                            className="flex items-center gap-3 p-3 rounded-xl border bg-muted/30 hover:bg-muted/50 transition-colors"
                                        >
                                            <FileText className="w-5 h-5 text-primary" />
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium line-clamp-1">{file.name}</span>
                                                <span className="text-[10px] text-muted-foreground uppercase">Document</span>
                                            </div>
                                        </a>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex items-center justify-between gap-4">
                        <Reactions post={post} />

                        <div className="flex items-center gap-2">
                            {(!user || post.authorId !== user?.id) && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleChatRequest}
                                    className={cn(
                                        "gap-2 h-8 px-2 transition-colors",
                                        user ? "text-muted-foreground hover:text-primary hover:bg-primary/5" : "text-muted-foreground/60 opacity-80"
                                    )}
                                >
                                    <Lock className={cn("w-4 h-4", !user && "w-3 h-3 text-muted-foreground/50")} />
                                    <span className="text-xs font-medium">{user ? "Chat" : "Sign in to Chat"}</span>
                                </Button>
                            )}

                            <Link href={`/posts/${post.id}`}>
                                <Button variant="ghost" size="sm" className="gap-2 h-8 px-2 text-muted-foreground hover:text-primary hover:bg-primary/5">
                                    <MessageCircle className="w-4 h-4" />
                                    <span className="text-xs font-medium">
                                        {post.commentCount || 0}
                                    </span>
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </Card>

            <ReportModal
                isOpen={isReportOpen}
                onClose={() => setIsReportOpen(false)}
                targetId={post.id}
                targetType="post"
            />

            <ChatRequestModal
                isOpen={isChatRequestOpen}
                onClose={() => setIsChatRequestOpen(false)}
                recipientId={post.authorId || ""}
            />
        </>
    );
});

export default PostItem;
