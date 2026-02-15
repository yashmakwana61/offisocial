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
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { BarChart2, CheckCircle2, PlusCircle, MinusCircle } from "lucide-react";

export function CreatePostDialog() {
  const [open, setOpen] = useState(false);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [showPoll, setShowPoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [mentionQuery, setMentionQuery] = useState("");
  const [isMentioning, setIsMentioning] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [filteredCategories, setFilteredCategories] = useState<string[]>([]);
  const [content, setContent] = useState("");

  const { toast } = useToast();
  const createPost = useCreatePost();

  const form = useForm({
    resolver: zodResolver(insertPostSchema),
    defaultValues: {
      content: "",
      category: "",
    },
  });

  const handleAddOption = () => {
    if (pollOptions.length < 5) {
      setPollOptions([...pollOptions, ""]);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  const onTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setContent(value);

    // Simple @ mention logic for categories
    const lastAtPos = value.lastIndexOf("@");
    if (lastAtPos !== -1 && lastAtPos >= value.length - 20) {
      const query = value.substring(lastAtPos + 1).toLowerCase();
      const filtered = POST_CATEGORIES.filter(cat => cat.toLowerCase().includes(query));
      setFilteredCategories(filtered as unknown as string[]);
      setIsMentioning(true);
    } else {
      setIsMentioning(false);
    }
  };

  const selectCategory = (cat: string) => {
    const lastAtPos = content.lastIndexOf("@");
    const newContent = content.substring(0, lastAtPos) + cat + " ";
    setContent(newContent);
    form.setValue("content", newContent);
    form.setValue("category", cat);
    setIsMentioning(false);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'file') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Mock upload - in real app would upload to S3/Cloudinary
    const reader = new FileReader();
    reader.onloadend = () => {
      setAttachments([...attachments, { type, name: file.name, url: reader.result }]);
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = (data: any) => {
    if (!data.category) {
      data.category = "General Experience";
    }

    const pollData = showPoll && pollQuestion && pollOptions.every(o => o.trim())
      ? { question: pollQuestion, options: pollOptions.filter(o => o.trim()) }
      : undefined;

    createPost.mutate({ ...data, attachments, pollData }, {
      onSuccess: () => {
        setOpen(false);
        setAttachments([]);
        setShowPoll(false);
        setPollQuestion("");
        setPollOptions(["", ""]);
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
      <DialogContent className="sm:max-w-xl rounded-2xl border-none shadow-2xl overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display text-primary">Share your thoughts</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
          <div className="space-y-2 relative">
            <Label>Your Message</Label>
            <Textarea
              placeholder="What's on your mind? Type @ to select a community (Mental Stress, Toxic Culture, etc.)..."
              className="min-h-[120px] resize-none rounded-xl border-2 p-4 focus:ring-primary/20"
              value={content}
              {...form.register("content", { onChange: onTextareaChange })}
              ref={(e) => {
                form.register("content").ref(e);
                (textareaRef as any).current = e;
              }}
            />

            {showPoll && (
              <div className="mt-4 p-4 rounded-xl border-2 border-primary/20 bg-primary/5 space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-primary font-bold flex items-center gap-2">
                    <BarChart2 className="w-4 h-4" />
                    Interactive Poll
                  </Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs text-muted-foreground hover:text-destructive"
                    onClick={() => setShowPoll(false)}
                  >
                    Remove Poll
                  </Button>
                </div>

                <div className="space-y-3">
                  <Input
                    placeholder="Poll Question"
                    className="bg-background border-primary/10"
                    value={pollQuestion}
                    onChange={(e) => setPollQuestion(e.target.value)}
                  />

                  {pollOptions.map((option, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder={`Option ${index + 1}`}
                        className="bg-background border-primary/5"
                        value={option}
                        onChange={(e) => handleOptionChange(index, e.target.value)}
                      />
                      {pollOptions.length > 2 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0"
                          onClick={() => handleRemoveOption(index)}
                        >
                          <MinusCircle className="w-4 h-4 text-muted-foreground" />
                        </Button>
                      )}
                    </div>
                  ))}

                  {pollOptions.length < 5 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full gap-2 border-dashed border-primary/30 text-primary hover:bg-primary/5"
                      onClick={handleAddOption}
                    >
                      <PlusCircle className="w-4 h-4" />
                      Add Option
                    </Button>
                  )}
                </div>
              </div>
            )}

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
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Label className="cursor-pointer">
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, 'image')}
              />
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border hover:bg-muted transition-colors text-sm font-medium">
                <Image className="w-4 h-4 text-primary" />
                Image
              </div>
            </Label>

            <Button
              type="button"
              variant="outline"
              className={cn("gap-2 border rounded-lg", showPoll && "bg-primary/10 border-primary text-primary")}
              onClick={() => setShowPoll(!showPoll)}
            >
              <BarChart2 className="w-4 h-4" />
              Poll
            </Button>
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
