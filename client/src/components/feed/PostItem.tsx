import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { Post } from "@shared/schema";
import Reactions from "./Reactions";
import { UserCircle, MoreHorizontal, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import ReportModal from "@/components/safety/ReportModal";
import { Link } from "wouter";

interface PostItemProps {
    post: any; // Using any because post is enriched with extra fields from storage
    fullView?: boolean;
}

export default function PostItem({ post, fullView = false }: PostItemProps) {
    const [isReportOpen, setIsReportOpen] = useState(false);

    return (
        <>
            <Card className={`p-4 sm:p-5 rounded-xl sm:rounded-2xl border-border/60 shadow-sm bg-card/50 backdrop-blur-sm transition-colors ${!fullView && 'hover:border-border/80'}`}>
                <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center flex-shrink-0">
                            <UserCircle className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-500/70" />
                        </div>
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                                <span className="font-medium text-foreground text-xs sm:text-sm">Anonymous</span>
                                <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-muted-foreground bg-muted px-1 sm:px-1.5 py-0.5 rounded-sm font-semibold truncate max-w-[100px] sm:max-w-none">
                                    {post.authorRole || "Employee"}
                                </span>
                            </div>
                            <p className="text-[10px] sm:text-xs text-muted-foreground/80">
                                {post.createdAt ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }) : 'Just now'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                        <Badge variant="outline" className="text-[9px] sm:text-[10px] font-normal opacity-70 hidden xs:inline-flex">
                            {post.category}
                        </Badge>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 -mr-1 sm:-mr-2">
                                    <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setIsReportOpen(true)} className="text-destructive focus:text-destructive">
                                    <Flag className="w-4 h-4 mr-2" />
                                    Report Content
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Category badge for mobile - shows below header */}
                <Badge variant="outline" className="text-[9px] font-normal opacity-70 mb-3 xs:hidden">
                    {post.category}
                </Badge>

                <div className="sm:pl-[52px]">
                    {fullView ? (
                        <p className="text-foreground/90 leading-relaxed text-sm sm:text-[15px] whitespace-pre-wrap mb-4 font-medium">
                            {post.content}
                        </p>
                    ) : (
                        <Link href={`/posts/${post.id}`}>
                            <p className="text-foreground/90 leading-relaxed text-sm sm:text-[15px] whitespace-pre-wrap mb-4 cursor-pointer hover:text-foreground">
                                {post.content}
                            </p>
                        </Link>
                    )}

                    <Reactions post={post} />
                </div>
            </Card>

            <ReportModal
                isOpen={isReportOpen}
                onClose={() => setIsReportOpen(false)}
                targetId={post.id}
                targetType="post"
            />
        </>
    );
}
