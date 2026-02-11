import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { UserCircle, Linkedin, CornerDownRight, MessageSquare } from "lucide-react";
import { useState } from "react";
import RequestLinkedInModal from "./RequestLinkedInModal";
import { useCreateComment } from "@/hooks/use-posts";
import { Textarea } from "@/components/ui/textarea";

interface Comment {
    id: number;
    postId: number;
    authorRole: string;
    content: string;
    createdAt: string;
    isAuthor: boolean;
    authorId: string;
    replies?: Comment[];
}

interface CommentItemProps {
    comment: Comment;
    depth?: number;
}

export default function CommentItem({ comment, depth = 0 }: CommentItemProps) {
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    const [isReplyOpen, setIsReplyOpen] = useState(false);
    const [replyContent, setReplyContent] = useState("");
    const createComment = useCreateComment();

    const handleReply = () => {
        if (!replyContent.trim()) return;
        createComment.mutate({
            postId: comment.postId,
            content: replyContent,
            parentId: comment.id
        }, {
            onSuccess: () => {
                setReplyContent("");
                setIsReplyOpen(false);
            }
        });
    };

    return (
        <div className="space-y-4">
            <div className={`flex gap-2.5 sm:gap-3 ${depth > 0 ? "ml-4 sm:ml-8 border-l-2 pl-4 sm:pl-6 border-muted" : ""}`}>
                <div className="flex-shrink-0">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-muted flex items-center justify-center">
                        <UserCircle className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                    </div>
                </div>
                <div className="flex-1 space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-1 sm:gap-2">
                        <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                            <span className="text-xs sm:text-sm font-medium text-foreground">
                                {comment.isAuthor ? "You" : comment.authorRole || "Employee"}
                            </span>
                            <span className="text-[10px] sm:text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 sm:h-6 gap-1 sm:gap-1.5 text-[10px] sm:text-xs text-muted-foreground hover:text-primary px-1.5 sm:px-2"
                                onClick={() => setIsReplyOpen(!isReplyOpen)}
                            >
                                <MessageSquare className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                <span>Reply</span>
                            </Button>
                            {!comment.isAuthor && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-5 sm:h-6 gap-1 sm:gap-1.5 text-[10px] sm:text-xs text-muted-foreground hover:text-[#0077B5] px-1.5 sm:px-2"
                                    onClick={() => setIsRequestModalOpen(true)}
                                >
                                    <Linkedin className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                    <span className="hidden xs:inline">Connect</span>
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="p-2.5 sm:p-3 bg-muted/30 rounded-lg text-xs sm:text-sm leading-relaxed text-foreground/90">
                        {comment.content}
                    </div>

                    {isReplyOpen && (
                        <div className="mt-3 space-y-2">
                            <Textarea
                                placeholder="Write a reply..."
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                className="min-h-[80px] text-xs sm:text-sm rounded-xl"
                            />
                            <div className="flex justify-end gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsReplyOpen(false)}
                                    className="text-xs h-8"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    size="sm"
                                    disabled={!replyContent.trim() || createComment.isPending}
                                    onClick={handleReply}
                                    className="text-xs h-8"
                                >
                                    {createComment.isPending ? "Replying..." : "Post Reply"}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {comment.replies && comment.replies.length > 0 && (
                <div className="space-y-4">
                    {comment.replies.map((reply) => (
                        <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
                    ))}
                </div>
            )}

            <RequestLinkedInModal
                isOpen={isRequestModalOpen}
                onClose={() => setIsRequestModalOpen(false)}
                targetUserRole={comment.authorRole || "Employee"}
                recipientId={comment.authorId}
            />
        </div>
    );
}
