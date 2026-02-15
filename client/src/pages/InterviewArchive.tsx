import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { SEO } from "@/components/SEO";
import { useInterviews, useSubmitInterview } from "@/hooks/use-features";
import { useProfile } from "@/hooks/use-profiles";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Plus,
    Search,
    Briefcase,
    MapPin,
    Star,
    MessageSquare,
    Loader2,
    Building2,
    Calendar,
    CheckCircle2,
    XCircle,
    Clock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Interview } from "@shared/schema";

export default function InterviewArchive() {
    const { user } = useAuth();
    const { toast } = useToast();
    const { data: profile } = useProfile();
    const [searchRole, setSearchRole] = useState("");
    const { data: interviews, isLoading } = useInterviews(undefined, searchRole || undefined);
    const submitInterview = useSubmitInterview();
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = {
            role: formData.get("role") as string,
            companyId: profile?.companyId,
            location: formData.get("location") as string,
            difficulty: parseInt(formData.get("difficulty") as string),
            status: formData.get("status") as string,
            content: formData.get("content") as string,
        };

        try {
            await submitInterview.mutateAsync(data);
            toast({ title: "Experience shared!", description: "Your interview experience has been archived anonymously." });
            setIsDialogOpen(false);
        } catch (err: any) {
            toast({ title: "Submission failed", description: err.message, variant: "destructive" });
        }
    };

    return (
        <div className="min-h-screen bg-background pb-20">
            <SEO
                title="Interview Archive"
                description="Read anonymous interview experiences and questions shared by professionals to help you prepare."
            />
            <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border/40 mb-6">
                <div className="max-w-4xl mx-auto px-4 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h1 className="font-display font-bold text-2xl tracking-tight">Interview Archive</h1>

                    <div className="flex items-center gap-3">
                        <div className="relative flex-1 sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Filter by role..."
                                className="pl-9 bg-muted/50"
                                value={searchRole}
                                onChange={(e) => setSearchRole(e.target.value)}
                            />
                        </div>

                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="rounded-xl gap-2">
                                    <Plus className="h-4 w-4" />
                                    Share Experience
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-lg">
                                <DialogHeader>
                                    <DialogTitle>Share Interview Experience</DialogTitle>
                                    <DialogDescription>
                                        Help others prepare by sharing your anonymous interview details.
                                    </DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Role</label>
                                            <Input name="role" placeholder="e.g. Frontend Developer" required />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Location</label>
                                            <Input name="location" placeholder="e.g. Remote / London" required />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Difficulty (1-5)</label>
                                            <select name="difficulty" className="w-full h-10 px-3 rounded-md border border-input bg-background" required>
                                                <option value="1">1 - Very Easy</option>
                                                <option value="2">2 - Easy</option>
                                                <option value="3">3 - Moderate</option>
                                                <option value="4">4 - Hard</option>
                                                <option value="5">5 - Very Hard</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Outcome</label>
                                            <select name="status" className="w-full h-10 px-3 rounded-md border border-input bg-background" required>
                                                <option value="offered">Offered</option>
                                                <option value="rejected">Rejected</option>
                                                <option value="pending">Pending</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Experience Details</label>
                                        <Textarea
                                            name="content"
                                            placeholder="Describe the process, questions asked, and any tips..."
                                            className="min-h-[120px] resize-none"
                                            required
                                        />
                                    </div>

                                    <Button type="submit" className="w-full h-11 rounded-xl" disabled={submitInterview.isPending}>
                                        {submitInterview.isPending ? <Loader2 className="animate-spin" /> : "Post Anonymously"}
                                    </Button>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4">
                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-primary/30" />
                    </div>
                ) : !interviews || interviews.length === 0 ? (
                    <div className="text-center py-20 bg-muted/10 rounded-3xl border border-dashed">
                        <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
                        <h3 className="text-lg font-medium">No experiences shared yet</h3>
                        <p className="text-muted-foreground max-w-xs mx-auto mt-2">
                            Share your interview journey and help fellow job seekers.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        <AnimatePresence mode="popLayout">
                            {interviews.map((interview: any, i: number) => (
                                <motion.div
                                    key={interview.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                >
                                    <Card className="overflow-hidden border-border/50 hover:border-primary/20 transition-all">
                                        <CardContent className="p-6">
                                            <div className="flex flex-col gap-4">
                                                <div className="flex items-start justify-between">
                                                    <div className="space-y-1">
                                                        <h3 className="font-bold text-xl leading-tight text-primary">
                                                            {interview.role}
                                                        </h3>
                                                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                                                            <span className="flex items-center gap-1.5 px-2 py-0.5 bg-muted rounded-full">
                                                                <Building2 className="w-3.5 h-3.5" />
                                                                {interview.companyName}
                                                            </span>
                                                            <span className="flex items-center gap-1.5">
                                                                <MapPin className="w-3.5 h-3.5" />
                                                                {interview.location}
                                                            </span>
                                                            <span className="flex items-center gap-1.5">
                                                                <Calendar className="w-3.5 h-3.5" />
                                                                {new Date(interview.createdAt).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col items-end gap-2">
                                                        <div className={cn(
                                                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5",
                                                            interview.status === 'offered' ? "bg-green-100 text-green-700" :
                                                                interview.status === 'rejected' ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                                                        )}>
                                                            {interview.status === 'offered' ? <CheckCircle2 className="w-3 h-3" /> :
                                                                interview.status === 'rejected' ? <XCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                                            {interview.status}
                                                        </div>
                                                        <div className="flex items-center gap-0.5">
                                                            {[...Array(5)].map((_, idx) => (
                                                                <Star
                                                                    key={idx}
                                                                    className={cn(
                                                                        "w-3.5 h-3.5",
                                                                        idx < interview.difficulty ? "fill-amber-400 text-amber-400" : "text-muted/30"
                                                                    )}
                                                                />
                                                            ))}
                                                            <span className="text-[10px] font-bold text-muted-foreground ml-1 uppercase">Difficulty</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="prose prose-sm max-w-none text-foreground/80 leading-relaxed bg-muted/20 p-4 rounded-xl italic">
                                                    "{interview.content}"
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </main>
        </div>
    );
}
