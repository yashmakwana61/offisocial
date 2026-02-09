import { motion } from "framer-motion";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export default function BlockedRole() {
    const { logout } = useAuth();

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 sm:p-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-sm sm:max-w-md text-center space-y-6"
            >
                <div className="flex justify-center">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-destructive/10 rounded-full flex items-center justify-center">
                        <ShieldAlert className="w-8 h-8 sm:w-10 sm:h-10 text-destructive" />
                    </div>
                </div>

                <div className="space-y-3 px-2">
                    <h1 className="text-2xl sm:text-3xl font-display font-medium text-foreground">
                        This space isn't for you.
                    </h1>
                    <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                        To maintain a truly safe environment for employees to voice concerns,
                        we restrict access for C-level executives and HR professionals.
                    </p>
                    <p className="text-muted-foreground text-xs sm:text-sm">
                        We believe this separation is necessary for honest dialogue.
                    </p>
                </div>

                <div className="pt-4 sm:pt-6">
                    <Button
                        variant="outline"
                        className="w-full h-11 sm:h-12 rounded-xl"
                        onClick={() => logout()}
                    >
                        Sign Out
                    </Button>
                </div>
            </motion.div>
        </div>
    );
}
