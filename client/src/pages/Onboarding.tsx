import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateProfile } from "@/hooks/use-profiles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Building2, UserCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const schema = z.object({
  role: z.string().min(2, "Role is required"),
  companyName: z.string().min(2, "Company name is required"),
});

export default function Onboarding() {
  const createProfile = useCreateProfile();
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { role: "", companyName: "" },
  });

  const onSubmit = (data: z.infer<typeof schema>) => {
    createProfile.mutate(data, {
      onError: (err) => {
        toast({
          title: "Setup failed",
          description: err.message,
          variant: "destructive",
        });
      },
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display font-bold text-foreground">Welcome to SafeSpace</h1>
          <p className="text-muted-foreground mt-2">Let's set up your anonymous profile.</p>
        </div>

        <Card className="p-8 rounded-3xl shadow-xl border-border/50">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-base">What is your role?</Label>
              <div className="relative">
                <UserCircle className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input 
                  className="pl-10 h-11 rounded-xl" 
                  placeholder="e.g. Product Designer" 
                  {...form.register("role")}
                />
              </div>
              {form.formState.errors.role && (
                <p className="text-sm text-destructive">{form.formState.errors.role.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-base">Company Name</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input 
                  className="pl-10 h-11 rounded-xl" 
                  placeholder="e.g. Acme Corp" 
                  {...form.register("companyName")}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                We'll group you with verified emails from this domain later.
              </p>
              {form.formState.errors.companyName && (
                <p className="text-sm text-destructive">{form.formState.errors.companyName.message}</p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 rounded-xl text-lg font-medium shadow-lg hover:shadow-xl transition-all"
              disabled={createProfile.isPending}
            >
              {createProfile.isPending ? "Creating Space..." : "Enter Safe Space"}
            </Button>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
