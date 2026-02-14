import { useState, useRef, useEffect } from "react";
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
import { PenSquare, Image, FileText, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function CreatePostDialog() {
  const [open, setOpen] = useState(false);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [mentionQuery, setMentionQuery] = useState("");
  const [isMentioning, setIsMentioning] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { toast } = useToast();
  const createPost = useCreatePost();

  const form = useForm({
    resolver: zodResolver(insertPostSchema),
    defaultValues: {
      content: "",
      category: "",
    },
  });

  const filteredCategories = POST_CATEGORIES.filter(cat =>
    cat.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'document') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum size is 5MB", variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setAttachments(prev => [...prev, { type, url: base64, name: file.name }]);
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // Reset input
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const onTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = value.slice(0, cursorPosition);
    const mentionMatch = textBeforeCursor.match(/@([\w\s/]*)$/);

    if (mentionMatch) {
      setIsMentioning(true);
      setMentionQuery(mentionMatch[1]);
    } else {
      setIsMentioning(false);
      setMentionQuery("");
    }
  };

  const selectCategory = (category: string) => {
    const value = form.getValues("content");
    const cursorPosition = textareaRef.current?.selectionStart || 0;
    const textBeforeCursor = value.slice(0, cursorPosition);
    const textAfterCursor = value.slice(cursorPosition);

    const newValue = textBeforeCursor.replace(/@([\w\s/]*)$/, `@${category} `) + textAfterCursor;
    form.setValue("content", newValue);
    form.setValue("category", category as any);
    setIsMentioning(false);
    setMentionQuery("");
    textareaRef.current?.focus();
  };

  const onSubmit = (data: any) => {
    // If no category is selected, default to "General Experience"
    if (!data.category) {
      data.category = "General Experience";
    }

    createPost.mutate({ ...data, attachments }, {
      onSuccess: () => {
        setOpen(false);
        setAttachments([]);
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
      <DialogContent className="sm:max-w-xl rounded-2xl border-none shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display text-primary">Share your thoughts</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
          <div className="space-y-2 relative">
            <Label>Your Message</Label>
            <Textarea
              placeholder="What's on your mind? Type @ to select a community (Mental Stress, Toxic Culture, etc.)..."
              className="min-h-[150px] resize-none rounded-xl border-2 p-4 focus:ring-primary/20"
              {...form.register("content", { onChange: onTextareaChange })}
              ref={(e) => {
                form.register("content").ref(e);
                (textareaRef as any).current = e;
              }}
            />

            {isMentioning && filteredCategories.length > 0 && (
              <div className="absolute z-50 bg-popover border rounded-lg shadow-lg w-full max-h-48 overflow-y-auto mt-1 p-1">
                {filteredCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted rounded-md transition-colors"
                    onClick={() => selectCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {form.formState.errors.content && (
              <p className="text-sm text-destructive">{form.formState.errors.content.message}</p>
            )}
            {form.getValues("category") && (
              <p className="text-xs text-primary font-medium">Selected Community: {form.getValues("category")}</p>
            )}
          </div>

          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {attachments.map((file, i) => (
                <div key={i} className="relative group p-2 border rounded-lg bg-muted/30 flex items-center gap-2 pr-8">
                  {file.type === 'image' ? <Image className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                  <span className="text-xs truncate max-w-[150px]">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeAttachment(i)}
                    className="absolute right-1 p-1 rounded-full hover:bg-destructive hover:text-white transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2">
            <Label className="cursor-pointer">
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, 'image')}
              />
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border hover:bg-muted transition-colors text-sm font-medium">
                <Image className="w-4 h-4 text-primary" />
                Add Image
              </div>
            </Label>
            <Label className="cursor-pointer">
              <input
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.txt"
                onChange={(e) => handleFileUpload(e, 'document')}
              />
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border hover:bg-muted transition-colors text-sm font-medium">
                <FileText className="w-4 h-4 text-primary" />
                Add Document
              </div>
            </Label>
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
