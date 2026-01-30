import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPostSchema, POST_CATEGORIES } from "@shared/schema";
import { useCreatePost } from "@/hooks/use-posts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PenSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function CreatePostDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const createPost = useCreatePost();
  
  const form = useForm({
    resolver: zodResolver(insertPostSchema),
    defaultValues: {
      content: "",
      category: "",
    },
  });

  const onSubmit = (data: any) => {
    createPost.mutate(data, {
      onSuccess: () => {
        setOpen(false);
        form.reset();
        toast({
          title: "Posted successfully",
          description: "Your voice has been heard.",
        });
      },
      onError: (err) => {
        toast({
          title: "Error",
          description: err.message,
          variant: "destructive",
        });
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 rounded-xl shadow-md hover:shadow-lg transition-all" size="lg">
          <PenSquare className="w-4 h-4" />
          Start a Discussion
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg rounded-2xl border-none shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display text-primary">Share your thoughts</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
          <div className="space-y-2">
            <Label>Category</Label>
            <Select 
              onValueChange={(val) => form.setValue("category", val as any)}
            >
              <SelectTrigger className="w-full h-12 rounded-xl border-2 focus:ring-primary/20">
                <SelectValue placeholder="Select a topic..." />
              </SelectTrigger>
              <SelectContent>
                {POST_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.category && (
              <p className="text-sm text-destructive">{form.formState.errors.category.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Your Message</Label>
            <Textarea
              placeholder="What's on your mind? (Your identity is protected)"
              className="min-h-[150px] resize-none rounded-xl border-2 p-4 focus:ring-primary/20"
              {...form.register("content")}
            />
            {form.formState.errors.content && (
              <p className="text-sm text-destructive">{form.formState.errors.content.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button 
              type="submit" 
              disabled={createPost.isPending}
              className="w-full sm:w-auto rounded-xl h-11 px-8"
            >
              {createPost.isPending ? "Posting..." : "Post Anonymously"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
