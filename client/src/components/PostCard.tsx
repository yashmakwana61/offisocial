import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { MessageCircle, Heart, Lightbulb, MoreHorizontal } from "lucide-react";
import { type PostResponse } from "@shared/routes";
import { useToggleReaction } from "@/hooks/use-posts";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface PostCardProps {
  post: {
    id: number;
    content: string;
    category: string;
    createdAt: string | Date | null;
    commentCount: number;
    reactionCounts: { support: number; helpful: number };
    userReaction: 'support' | 'helpful' | null;
  };
  compact?: boolean;
}

export function PostCard({ post, compact = false }: PostCardProps) {
  const toggleReaction = useToggleReaction();

  const handleReaction = (type: 'support' | 'helpful') => {
    toggleReaction.mutate({
      targetType: 'post',
      targetId: post.id,
      type,
    });
  };

  return (
    <div className={cn(
      "group relative bg-card border border-border/50 rounded-2xl overflow-hidden transition-all duration-300",
      compact ? "p-5 hover:border-primary/20 hover:shadow-md" : "p-6 sm:p-8 shadow-sm"
    )}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex flex-col gap-1">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/5 text-primary w-fit">
            {post.category}
          </span>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <span className="font-medium text-foreground/80">Anonymous Coworker</span>
            <span>•</span>
            <span>{post.createdAt ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }) : 'Just now'}</span>
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="text-destructive focus:text-destructive">
              Report Post
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Link href={`/posts/${post.id}`} className={cn("block group-hover:cursor-pointer", !compact && "pointer-events-none")}>
        <p className={cn("text-foreground font-medium leading-relaxed", compact ? "line-clamp-3 text-lg" : "text-xl")}>
          {post.content}
        </p>
      </Link>

      <div className="flex items-center gap-4 mt-6 pt-4 border-t border-border/30">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleReaction('support')}
          className={cn(
            "gap-2 rounded-full px-3 transition-colors",
            post.userReaction === 'support' ? "bg-red-50 text-red-600 hover:bg-red-100" : "text-muted-foreground hover:text-red-500 hover:bg-red-50"
          )}
        >
          <Heart className={cn("w-4 h-4", post.userReaction === 'support' && "fill-current")} />
          <span className="text-xs font-medium">{post.reactionCounts.support || "Support"}</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleReaction('helpful')}
          className={cn(
            "gap-2 rounded-full px-3 transition-colors",
            post.userReaction === 'helpful' ? "bg-amber-50 text-amber-600 hover:bg-amber-100" : "text-muted-foreground hover:text-amber-500 hover:bg-amber-50"
          )}
        >
          <Lightbulb className={cn("w-4 h-4", post.userReaction === 'helpful' && "fill-current")} />
          <span className="text-xs font-medium">{post.reactionCounts.helpful || "Helpful"}</span>
        </Button>

        {compact && (
          <Link href={`/posts/${post.id}`}>
            <Button variant="ghost" size="sm" className="gap-2 rounded-full px-3 text-muted-foreground hover:text-primary hover:bg-primary/5 ml-auto">
              <MessageCircle className="w-4 h-4" />
              <span className="text-xs font-medium">{post.commentCount > 0 ? `${post.commentCount} Comments` : "Discuss"}</span>
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
