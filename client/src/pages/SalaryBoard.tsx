import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useSalaries, useSubmitSalary } from "@/hooks/use-features";
import { useProfile } from "@/hooks/use-profiles";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Plus,
    Search,
    Briefcase,
    MapPin,
    DollarSign,
    TrendingUp,
    Loader2,
    Building2,
    Calendar
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
import { Salary } from "@shared/schema";

export default function SalaryBoard() {
    const { user } = useAuth();
    const { toast } = useToast();
    const { data: profile } = useProfile();
    const [searchRole, setSearchRole] = useState("");
    const { data: salaries, isLoading } = useSalaries(undefined, searchRole || undefined);
    const submitSalary = useSubmitSalary();
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = {
            role: formData.get("role") as string,
            baseSalary: parseInt(formData.get("baseSalary") as string),
            bonus: parseInt(formData.get("bonus") as string) || 0,
            equity: parseInt(formData.get("equity") as string) || 0,
            location: formData.get("location") as string,
            companyId: profile?.companyId,
            currency: "USD",
            yearsOfExperience: parseInt(formData.get("experience") as string) || 0,
        };

        try {
            await submitSalary.mutateAsync(data);
            toast({ title: "Salary submitted!", description: "Your entry is completely anonymous." });
            setIsDialogOpen(false);
        } catch (err: any) {
            toast({ title: "Submission failed", description: err.message, variant: "destructive" });
        }
    };

    return (
        <div className="min-h-screen bg-background pb-20">
            <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border/40 mb-6">
                <div className="max-w-4xl mx-auto px-4 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h1 className="font-display font-bold text-2xl tracking-tight">Salary Board</h1>

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
                                    Post Salary
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                    <DialogTitle>Share Your Compensation</DialogTitle>
                                    <DialogDescription>
                                        Help your colleagues benchmark. Everything is 100% anonymous.
                                    </DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Role</label>
                                            <Input name="role" placeholder="e.g. Senior Software Engineer" required />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Location</label>
                                            <Input name="location" placeholder="e.g. New York, NY" required />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Base Salary (Annual)</label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input name="baseSalary" type="number" className="pl-9" placeholder="120000" required />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Annual Bonus</label>
                                            <Input name="bonus" type="number" placeholder="15000" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Equity (Annual Value)</label>
                                            <Input name="equity" type="number" placeholder="20000" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Years of Experience</label>
                                        <Input name="experience" type="number" placeholder="5" />
                                    </div>
                                    <Button type="submit" className="w-full h-11 rounded-xl" disabled={submitSalary.isPending}>
                                        {submitSalary.isPending ? <Loader2 className="animate-spin" /> : "Submit Anonymously"}
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
                ) : !salaries || salaries.length === 0 ? (
                    <div className="text-center py-20 bg-muted/10 rounded-3xl border border-dashed">
                        <DollarSign className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
                        <h3 className="text-lg font-medium">No salaries shared yet</h3>
                        <p className="text-muted-foreground max-w-xs mx-auto mt-2">
                            Be the first to help your community by sharing your anonymized compensation.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        <AnimatePresence mode="popLayout">
                            {salaries.map((salary: any, i: number) => (
                                <motion.div
                                    key={salary.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                >
                                    <Card className="overflow-hidden border-border/50 hover:border-primary/30 transition-all group">
                                        <CardContent className="p-0">
                                            <div className="flex flex-col md:flex-row md:items-center">
                                                <div className="p-5 flex-1 space-y-3">
                                                    <div className="flex items-start justify-between">
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <h3 className="font-bold text-lg leading-none">{salary.role}</h3>
                                                                {salary.isVerified && (
                                                                    <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-bold">VERIFIED</span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                                                <span className="flex items-center gap-1">
                                                                    <Building2 className="w-3.5 h-3.5" />
                                                                    {salary.companyName}
                                                                </span>
                                                                <span className="flex items-center gap-1">
                                                                    <MapPin className="w-3.5 h-3.5" />
                                                                    {salary.location}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-2xl font-black text-primary">
                                                                ${(salary.baseSalary / 1000).toFixed(0)}k
                                                                <span className="text-xs font-medium text-muted-foreground ml-1">base</span>
                                                            </div>
                                                            <div className="text-xs font-semibold text-muted-foreground">
                                                                TC: ${((salary.baseSalary + (salary.bonus ?? 0) + (salary.equity ?? 0)) / 1000).toFixed(0)}k
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-4 pt-2 border-t border-border/30">
                                                        <div className="flex items-center gap-1.5 text-xs font-medium">
                                                            <Briefcase className="w-3.5 h-3.5 text-muted-foreground" />
                                                            {salary.yearsOfExperience}y Exp
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-xs font-medium">
                                                            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                                                            {salary.createdAt ? new Date(salary.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : "N/A"}
                                                        </div>
                                                    </div>
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
