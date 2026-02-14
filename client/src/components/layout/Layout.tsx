import { ReactNode } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

interface LayoutProps {
    children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
    return (
        <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
            <Navbar />

            <div className="layout-container layout-grid pt-6 px-4">
                {/* Left Sidebar */}
                <Sidebar className="hidden md:block" />

                {/* Main Content */}
                <main className="min-w-0 pb-10">
                    {children}
                </main>

                {/* Right Sidebar - Widgets (Hidden on smaller screens, can be populated later) */}
                <aside className="hidden lg:block sticky top-20 h-fit space-y-6">
                    <div className="card-base p-4">
                        <h3 className="font-semibold text-sm text-foreground mb-4">About Community</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            The premier social network for professionals to connect, share insights, and discuss industry trends anonymously.
                        </p>
                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Members</span>
                                <span className="font-medium">14.2k</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Online</span>
                                <span className="font-medium text-green-500">● 420</span>
                            </div>
                        </div>
                        <hr className="my-4 border-muted" />
                        <div className="text-xs text-muted-foreground">
                            Created Jun 14, 2024
                        </div>
                    </div>

                    <div className="card-base p-4">
                        <h3 className="font-semibold text-sm text-foreground mb-4">Popular Topics</h3>
                        <div className="flex flex-wrap gap-2">
                            {['Tech', 'Career', 'Remote Work', 'Salary'].map(tag => (
                                <span key={tag} className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-xs font-medium cursor-pointer hover:bg-secondary/80">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}
