import { useState } from "react";
import { usePosts } from "@/hooks/use-posts";
import { useAuth } from "@/hooks/use-auth";
import { PostCard } from "@/components/PostCard";
import { CreatePostDialog } from "@/components/CreatePostDialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { POST_CATEGORIES } from "@shared/schema";
import { LogOut, LayoutGrid, Filter, User } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

export default function Feed() {
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const { data: posts, isLoading } = usePosts(selectedCategory);
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-muted/20 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LayoutGrid className="w-6 h-6 text-primary" />
            <span className="font-display font-bold text-lg">Company Feed</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/profile">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" data-testid="button-profile">
                <User className="w-4 h-4 mr-2" />
                Profile
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={() => logout()} className="text-muted-foreground hover:text-destructive" data-testid="button-logout">
              <LogOut className="w-4 h-4 mr-2" />
              Log out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-8">
        <div className="flex flex-col sm:flex-row gap-6 mb-8 items-start sm:items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Community</h1>
            <p className="text-muted-foreground">Anonymous discussions from your company.</p>
          </div>
          <CreatePostDialog />
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
          <Button 
            variant={!selectedCategory ? "secondary" : "outline"}
            className={cn("rounded-full whitespace-nowrap", !selectedCategory && "bg-primary text-primary-foreground hover:bg-primary/90")}
            onClick={() => setSelectedCategory(undefined)}
          >
            All Posts
          </Button>
          {POST_CATEGORIES.map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? "secondary" : "outline"}
              className={cn("rounded-full whitespace-nowrap", selectedCategory === cat && "bg-primary text-primary-foreground hover:bg-primary/90")}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </Button>
          ))}
        </div>

        {/* Feed List */}
        <div className="space-y-6">
          {isLoading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="p-6 bg-card rounded-2xl border border-border/50 space-y-4">
                <div className="flex justify-between">
                   <Skeleton className="h-4 w-24 rounded-full" />
                   <Skeleton className="h-4 w-12 rounded-full" />
                </div>
                <Skeleton className="h-20 w-full rounded-xl" />
                <div className="flex gap-4 pt-2">
                  <Skeleton className="h-8 w-16 rounded-full" />
                  <Skeleton className="h-8 w-16 rounded-full" />
                </div>
              </div>
            ))
          ) : posts?.length === 0 ? (
            <div className="text-center py-20 bg-card rounded-3xl border border-border/50 border-dashed">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Filter className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-2">No posts yet</h3>
              <p className="text-muted-foreground mb-6">Be the first to share your thoughts.</p>
              <CreatePostDialog />
            </div>
          ) : (
            posts?.map((post) => (
              <PostCard key={post.id} post={post} compact />
            ))
          )}
        </div>
      </main>
    </div>
  );
}
