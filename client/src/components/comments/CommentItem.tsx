import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { UserCircle, Linkedin } from "lucide-react";
import { useState } from "react";
import RequestLinkedInModal from "./RequestLinkedInModal";

interface Comment {
    id: number;
    authorRole: string;
    content: string;
    createdAt: string;
    isAuthor: boolean;
    authorId: string;
}

interface CommentItemProps {
    comment: Comment;
}

export default function CommentItem({ comment }: CommentItemProps) {
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

    return (
        <>
            <div className="flex gap-2.5 sm:gap-3">
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

                    <div className="p-2.5 sm:p-3 bg-muted/30 rounded-lg text-xs sm:text-sm leading-relaxed text-foreground/90">
                        {comment.content}
                    </div>
                </div>
            </div>

            <RequestLinkedInModal
                isOpen={isRequestModalOpen}
                onClose={() => setIsRequestModalOpen(false)}
                targetUserRole={comment.authorRole || "Employee"}
                recipientId={comment.authorId}
            />
        </>
    );
}
