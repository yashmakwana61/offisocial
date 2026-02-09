import CommentItem from "./CommentItem";
import { Skeleton } from "@/components/ui/skeleton";

interface CommentListProps {
    comments: any[]; // Using any[] for now as the full type isn't fully strictly matched yet
    isLoading?: boolean;
}

export default function CommentList({ comments, isLoading }: CommentListProps) {
    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {comments.map((comment) => (
                <CommentItem key={comment.id} comment={comment} />
            ))}

            {comments.length === 0 && (
                <div className="text-center py-12 text-muted-foreground italic bg-muted/30 rounded-2xl">
                    No comments yet. Start the conversation.
                </div>
            )}
        </div>
    );
}
