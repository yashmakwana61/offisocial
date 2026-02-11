import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { MessageCircle, Heart, Lightbulb, MoreHorizontal, FileText } from "lucide-react";
import { POST_CATEGORIES } from "@shared/schema";

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
    attachments?: { type: 'image' | 'document'; url: string; name: string }[];
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

  const renderContent = (content: string) => {
    // Regex that matches any of the post categories starting with @
    const categoryPattern = POST_CATEGORIES
      .map((cat: string) => cat.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) // Escape special characters

      .join('|');
    const regex = new RegExp(`(@(?:${categoryPattern}))`, 'g');

    const parts = content.split(regex);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        return <span key={i} className="text-primary font-bold">{part}</span>;
      }
      return part;
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
          {renderContent(post.content)}
        </p>
      </Link>

      {post.attachments && post.attachments.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-3">
          {post.attachments.map((file, i) => (
            <div key={i} className="max-w-full">
              {file.type === 'image' ? (
                <img
                  src={file.url}
                  alt={file.name}
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

        <div className="ml-auto">
          {compact ? (
            <Link href={`/posts/${post.id}`}>
              <Button variant="ghost" size="sm" className="gap-2 rounded-full px-3 text-muted-foreground hover:text-primary hover:bg-primary/5">
                <MessageCircle className="w-4 h-4" />
                <span className="text-xs font-medium">{post.commentCount > 0 ? `${post.commentCount} Comments` : "Discuss"}</span>
              </Button>
            </Link>
          ) : (
            <div className="flex items-center gap-2 px-3 text-muted-foreground">
              <MessageCircle className="w-4 h-4" />
              <span className="text-xs font-medium">{post.commentCount} {post.commentCount === 1 ? 'Comment' : 'Comments'}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
