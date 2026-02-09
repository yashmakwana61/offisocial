import { useState } from "react";
import { useParams, Link } from "wouter";
import { usePost, useCreateComment } from "@/hooks/use-posts";
import PostItem from "@/components/feed/PostItem";
import CommentList from "@/components/comments/CommentList";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, MessageCircle } from "lucide-react";
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
      <div className="max-w-2xl lg:max-w-3xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
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
    <div className="min-h-screen bg-background pb-24 md:pb-20">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-2xl lg:max-w-3xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center">
          <Link href="/">
            <Button variant="ghost" className="gap-2 pl-0 hover:bg-transparent hover:text-primary text-sm sm:text-base">
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Back to Feed</span>
              <span className="sm:hidden">Back</span>
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-2xl lg:max-w-3xl mx-auto px-4 sm:px-6 py-6">
        <PostItem post={post} fullView />

        {/* Comments Section */}
        <div className="mt-8 sm:mt-10 space-y-6 sm:space-y-8">
          <h3 className="text-lg sm:text-xl font-bold font-display flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Discussion ({post.comments?.length || 0})
          </h3>

          <form onSubmit={handleComment} className="flex flex-col gap-3">
            <Textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add to the discussion..."
              className="min-h-[100px] sm:min-h-[120px] rounded-xl border resize-none focus:ring-primary/20 bg-background text-sm sm:text-base"
            />
            <Button
              type="submit"
              className="self-end px-5 sm:px-6 rounded-xl"
              disabled={!commentText.trim() || createComment.isPending}
            >
              Reply
            </Button>
          </form>

          <CommentList comments={post.comments || []} isLoading={false} />
        </div>
      </main>
    </div>
  );
}
