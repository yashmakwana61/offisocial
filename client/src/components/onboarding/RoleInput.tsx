import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const roleSchema = z.object({
    role: z.string().min(2, "Role is required"),
});

interface RoleInputProps {
    onComplete: (data: { role: string }) => void;
    isLoading?: boolean;
}

export default function RoleInput({ onComplete, isLoading }: RoleInputProps) {
    const form = useForm({
        resolver: zodResolver(roleSchema),
        defaultValues: { role: "" },
    });

    const onSubmit = (data: z.infer<typeof roleSchema>) => {
        onComplete(data);
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-5 sm:space-y-6"
        >
            <div className="text-center space-y-2">
                <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">What do you do?</h2>
                <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                    This helps context, but stays private if you choose.
                </p>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 sm:space-y-6 pt-1 sm:pt-2">
                <div className="space-y-2">
                    <Label className="text-sm sm:text-base text-foreground/80">Your Role / Job Title</Label>
                    <div className="relative group">
                        <UserCircle className="absolute left-3 top-3 sm:top-3.5 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                            className="pl-9 sm:pl-10 h-11 sm:h-12 rounded-xl bg-muted/30 border-border/50 focus-visible:ring-primary/20 transition-all font-medium text-sm sm:text-base"
                            placeholder="e.g. Product Designer"
                            {...form.register("role")}
                            autoFocus
                        />
                    </div>
                    {form.formState.errors.role && (
                        <p className="text-xs sm:text-sm text-destructive">{form.formState.errors.role.message}</p>
                    )}
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5 sm:p-3 mt-3 sm:mt-4">
                        <p className="text-[10px] sm:text-xs text-amber-600 dark:text-amber-400 leading-tight">
                            <strong>Note:</strong> C-Level Executives and HR professionals are not permitted to join this space to ensure employee psychological safety.
                        </p>
                    </div>
                </div>

                <Button
                    type="submit"
                    className="w-full h-11 sm:h-12 rounded-xl text-base sm:text-lg font-medium shadow-md transition-all"
                    disabled={isLoading}
                >
                    {isLoading ? "Creating..." : "Complete Setup"}
                </Button>
            </form>
        </motion.div>
    );
}
