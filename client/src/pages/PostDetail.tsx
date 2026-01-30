import { useState } from "react";
import { useParams, Link } from "wouter";
import { usePost, useCreateComment } from "@/hooks/use-posts";
import { PostCard } from "@/components/PostCard";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export default function PostDetail() {
  const { id } = useParams();
  const postId = parseInt(id || "0");
  const { data: post, isLoading } = usePost(postId);
  const createComment = useCreateComment();
  const { toast } = useToast();
  const [commentText, setCommentText] = useState("");

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    createComment.mutate(
      { postId, content: commentText },
      {
        onSuccess: () => {
          setCommentText("");
          toast({ title: "Comment added" });
        },
        onError: () => {
          toast({ title: "Failed to add comment", variant: "destructive" });
        }
      }
    );
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 pt-8 space-y-8">
        <Skeleton className="h-10 w-24 rounded-lg" />
        <Skeleton className="h-64 w-full rounded-2xl" />
        <div className="space-y-4">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!post) return <div className="p-8 text-center">Post not found</div>;

  return (
    <div className="min-h-screen bg-muted/20 pb-20">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center">
          <Link href="/">
            <Button variant="ghost" className="gap-2 pl-0 hover:bg-transparent hover:text-primary">
              <ArrowLeft className="w-5 h-5" />
              Back to Feed
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <PostCard post={post} />

        {/* Comments Section */}
        <div className="mt-12 space-y-8">
          <h3 className="text-xl font-bold font-display flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Discussion ({post.comments.length})
          </h3>

          <form onSubmit={handleComment} className="flex gap-4">
             <Textarea
               value={commentText}
               onChange={(e) => setCommentText(e.target.value)}
               placeholder="Add to the discussion..."
               className="min-h-[100px] rounded-xl border-2 resize-none focus:ring-primary/20 bg-background"
             />
             <Button 
               type="submit" 
               className="h-auto rounded-xl px-6 self-end mb-1"
               disabled={!commentText.trim() || createComment.isPending}
             >
               Reply
             </Button>
          </form>

          <div className="space-y-4">
            {post.comments.map((comment) => (
              <div key={comment.id} className="bg-card p-6 rounded-2xl border border-border/40 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-medium text-foreground/70">Coworker</span>
                  <span className="text-xs text-muted-foreground">
                    {comment.createdAt ? formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true }) : 'Just now'}
                  </span>
                </div>
                <p className="text-foreground leading-relaxed">{comment.content}</p>
              </div>
            ))}
            
            {post.comments.length === 0 && (
              <div className="text-center py-12 text-muted-foreground italic bg-muted/30 rounded-2xl">
                No comments yet. Start the conversation.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
