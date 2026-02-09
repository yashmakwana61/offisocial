import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, CheckCircle2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const companySchema = z.object({
    companyName: z.string().min(2, "Company name is required"),
});

interface CompanyConfirmationProps {
    onComplete: (data: { companyName: string }) => void;
    defaultEmailDomain?: string;
}

export default function CompanyConfirmation({ onComplete, defaultEmailDomain = "acme.com" }: CompanyConfirmationProps) {
    const form = useForm({
        resolver: zodResolver(companySchema),
        defaultValues: { companyName: "" },
    });

    const onSubmit = (data: z.infer<typeof companySchema>) => {
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
                <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">Confirm your workspace</h2>
                <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                    We detected <strong>@{defaultEmailDomain}</strong> from your email.
                    Which organization is this associated with?
                </p>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 sm:space-y-6 pt-1 sm:pt-2">
                <div className="space-y-2">
                    <Label className="text-sm sm:text-base text-foreground/80">Company Name</Label>
                    <div className="relative group">
                        <Building2 className="absolute left-3 top-3 sm:top-3.5 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                            className="pl-9 sm:pl-10 h-11 sm:h-12 rounded-xl bg-muted/30 border-border/50 focus-visible:ring-primary/20 transition-all font-medium text-sm sm:text-base"
                            placeholder="e.g. Acme Corp"
                            {...form.register("companyName")}
                            autoFocus
                        />
                        {form.watch("companyName").length > 2 && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute right-3 top-3 sm:top-3.5"
                            >
                                <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                            </motion.div>
                        )}
                    </div>
                    {form.formState.errors.companyName && (
                        <p className="text-xs sm:text-sm text-destructive">{form.formState.errors.companyName.message}</p>
                    )}
                    <p className="text-[11px] sm:text-[13px] text-muted-foreground pt-1">
                        This will be your private community.
                    </p>
                </div>

                <Button
                    type="submit"
                    className="w-full h-11 sm:h-12 rounded-xl text-base sm:text-lg font-medium shadow-md transition-all"
                >
                    Continue
                </Button>
            </form>
        </motion.div>
    );
}
