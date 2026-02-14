import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import type { User } from "@shared/models/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Search,
    Bell,
    MessageSquare,
    Plus,
    Menu,
    Moon,
    Sun,
    LogOut,
    User as UserIcon
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTheme } from "next-themes";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { SidebarContent } from "./Sidebar";
import { useState } from "react";

export default function Navbar() {
    const { user, logout } = useAuth();
    const typedUser = user as User | null;
    const { theme, setTheme } = useTheme();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-16 items-center px-4 gap-4 layout-container">
                {/* Mobile Menu Trigger */}
                <div className="md:hidden">
                    <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <Menu className="h-5 w-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-[300px] sm:w-[400px] p-0">
                            <SidebarContent onClose={() => setIsMobileMenuOpen(false)} />
                        </SheetContent>
                    </Sheet>
                </div>

                {/* Logo */}
                <Link href="/">
                    <a className="flex items-center gap-2 font-bold text-xl text-primary mr-4">
                        <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground">
                            <span className="text-lg">O</span>
                        </div>
                        <span className="hidden sm:inline-block">Offisocial</span>
                    </a>
                </Link>

                {/* Search Bar - Center */}
                <div className="flex-1 max-w-xl hidden md:block">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search Offisocial"
                            className="pl-10 bg-muted/50 border-transparent focus:bg-background transition-all rounded-full"
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    window.location.href = `/?search=${e.currentTarget.value}`;
                                }
                            }}
                        />
                    </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2 ml-auto">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                        className="rounded-full"
                    >
                        <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                        <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                        <span className="sr-only">Toggle theme</span>
                    </Button>

                    {typedUser ? (
                        <>
                            <Link href="/chat-requests">
                                <Button variant="ghost" size="icon" className="rounded-full relative">
                                    <MessageSquare className="h-5 w-5" />
                                    {/* Notification dot functionality could go here */}
                                </Button>
                            </Link>

                            <Button variant="ghost" size="icon" className="rounded-full">
                                <Bell className="h-5 w-5" />
                            </Button>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="relative h-9 w-9 rounded-full ml-2">
                                        <Avatar className="h-9 w-9 border">
                                            <AvatarImage src={typedUser.role === "guest" ? undefined : undefined} alt={typedUser.username} />
                                            <AvatarFallback>{(typedUser.username || "U").charAt(0).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56" align="end" forceMount>
                                    <DropdownMenuLabel className="font-normal">
                                        <div className="flex flex-col space-y-1">
                                            <p className="text-sm font-medium leading-none">{typedUser.username || "User"}</p>
                                            <p className="text-xs leading-none text-muted-foreground">
                                                {typedUser.role}
                                            </p>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild>
                                        <Link href="/profile">
                                            <div className="flex items-center cursor-pointer w-full">
                                                <UserIcon className="mr-2 h-4 w-4" />
                                                <span>Profile</span>
                                            </div>
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        className="text-destructive focus:text-destructive"
                                        onClick={() => logout()}
                                    >
                                        <LogOut className="mr-2 h-4 w-4" />
                                        <span>Log out</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </>
                    ) : (
                        <Button onClick={() => window.location.href = "/api/auth/linkedin"}>
                            Log In
                        </Button>
                    )}
                </div>
            </div>
        </nav>
    );
}
