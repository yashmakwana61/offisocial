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

    const buildTree = (items: any[]) => {
        const itemMap = new Map();
        const tree: any[] = [];

        // Sort by date first to ensure order is preserved in tree
        const sorted = [...items].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

        sorted.forEach(item => {
            itemMap.set(item.id, { ...item, replies: [] });
        });

        sorted.forEach(item => {
            if (item.parentId) {
                const parent = itemMap.get(item.parentId);
                if (parent) {
                    parent.replies.push(itemMap.get(item.id));
                } else {
                    tree.push(itemMap.get(item.id));
                }
            } else {
                tree.push(itemMap.get(item.id));
            }
        });

        // For the root, we might want most recent at top? 
        // Or oldest at top for chronological conversation? 
        // Feed usually has newest at bottom. Let's keep it consistent.
        return tree.reverse();
    };

    const tree = buildTree(comments);

    return (
        <div className="space-y-6">
            {tree.map((comment) => (
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
