import { useState } from "react";
import { useParams, Link } from "wouter";
import { usePost, usePublicPost, useCreateComment } from "@/hooks/use-posts";
import { useAuth } from "@/hooks/use-auth";
import PostItem from "@/components/feed/PostItem";
import CommentList from "@/components/comments/CommentList";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SEO } from "@/components/SEO";

export default function PostDetail() {
  const { id } = useParams();
  const postId = parseInt(id || "0");
  const { user, isLoading: authLoading } = useAuth();

  const { data: memberPost, isLoading: memberLoading } = usePost(!authLoading && user ? postId : 0);
  const { data: publicPost, isLoading: publicLoading } = usePublicPost(!authLoading && !user ? postId : 0);

  const post = user ? memberPost : publicPost;
  const isLoading = authLoading || (user ? memberLoading : publicLoading);

  const createComment = useCreateComment();
  const { toast } = useToast();
  const [commentText, setCommentText] = useState("");

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      window.location.href = "/api/auth/linkedin";
      return;
    }
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
      <div className="space-y-8">
        <Skeleton className="h-10 w-24 rounded-lg" />
        <Skeleton className="h-64 w-full rounded-2xl" />
        <div className="space-y-4">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!post) return <div className="p-8 text-center text-muted-foreground">Post not found or restricted.</div>;

  return (
    <div className="space-y-6">
      <SEO
        title={post.content.length > 50 ? post.content.slice(0, 50) + "..." : post.content}
        description={post.content.length > 150 ? post.content.slice(0, 150) + "..." : post.content}
      />
      <Link href="/">
        <Button variant="ghost" className="gap-2 pl-0 hover:bg-transparent hover:text-primary text-sm sm:text-base -ml-2">
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>Back to Feed</span>
        </Button>
      </Link>

      <PostItem post={post} fullView />

      {/* Comments Section */}
      <div className="mt-8 space-y-6">
        <h3 className="text-xl font-bold font-display flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          Discussion ({post.comments?.length || 0})
        </h3>

        <form onSubmit={handleComment} className="flex flex-col gap-3">
          <Textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder={user ? "Add to the discussion..." : "Sign in to join the discussion..."}
            className="min-h-[100px] rounded-xl border resize-none focus:ring-primary/20 bg-background"
            readOnly={!user}
            onClick={() => { if (!user) window.location.href = "/api/auth/linkedin"; }}
          />
          <Button
            type="submit"
            className="self-end px-6 rounded-xl"
            disabled={(!user ? false : !commentText.trim()) || createComment.isPending}
          >
            {user ? "Reply" : "Sign In to Reply"}
          </Button>
        </form>

        <CommentList comments={post.comments || []} isLoading={false} />
      </div>
    </div>
  );
}
