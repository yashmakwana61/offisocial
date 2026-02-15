import { Link, useLocation } from "wouter";
import {
    Home,
    TrendingUp,
    MessageSquare,
    User,
    Settings,
    HelpCircle,
    Briefcase,
    DollarSign,
    ShieldCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profiles";

interface SidebarProps {
    className?: string;
}

export function SidebarContent({ onClose }: { onClose?: () => void }) {
    const { user } = useAuth();
    const { data: profile } = useProfile();
    const [location] = useLocation();

    const NavLink = ({ href, icon: Icon, children }: { href: string; icon: any; children: React.ReactNode }) => {
        const isActive = location === href;

        return (
            <Link href={href}>
                <a
                    className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors mb-1",
                        isActive
                            ? "bg-secondary text-foreground font-semibold"
                            : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                    )}
                    onClick={onClose}
                >
                    <Icon className={cn("h-5 w-5", isActive ? "text-primary" : "")} />
                    {children}
                </a>
            </Link>
        );
    };

    return (
        <div className="h-full flex flex-col py-4">
            {/* Mobile Header (only visible in sheet) */}
            <div className="px-6 mb-6 md:hidden">
                <div className="flex items-center gap-2 font-bold text-xl text-primary">
                    <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground">
                        <span className="text-lg">O</span>
                    </div>
                    <span>Offisocial</span>
                </div>
            </div>

            <div className="px-4 flex-1">
                <div className="mb-2 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Feed
                </div>
                <NavLink href="/" icon={Home}>Home</NavLink>
                <NavLink href="/stories" icon={TrendingUp}>Stories</NavLink>

                <div className="mt-6 mb-2 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Social
                </div>
                <NavLink href="/chat-requests" icon={MessageSquare}>Messages</NavLink>
                <NavLink href="/profile" icon={User}>Profile</NavLink>
                <NavLink href="/salaries" icon={DollarSign}>Salaries</NavLink>
                <NavLink href="/interviews" icon={Briefcase}>Interviews</NavLink>
                <NavLink href="/jobs" icon={Briefcase}>Jobs</NavLink>
                <NavLink href="/settings" icon={Settings}>Settings</NavLink>

                {profile?.isAdmin && (
                    <NavLink href="/admin" icon={ShieldCheck}>Admin Terminal</NavLink>
                )}

                <div className="mt-6 mb-2 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Resources
                </div>
                <NavLink href="/settings" icon={Settings}>Settings</NavLink>
                <NavLink href="/help" icon={HelpCircle}>Help</NavLink>
            </div>

            <div className="px-4 mt-auto">
                <div className="bg-muted/50 rounded-xl p-4">
                    <p className="text-xs text-muted-foreground mb-3">
                        Offisocial © 2024. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function Sidebar({ className }: SidebarProps) {
    return (
        <aside className={cn("hidden md:block sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto no-scrollbar py-6 border-r bg-background/50 backdrop-blur-sm", className)}>
            <SidebarContent />
        </aside>
    );
}
