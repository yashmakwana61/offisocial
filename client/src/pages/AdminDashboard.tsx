import { useAdminStats, useAdminReports, useResolveReport } from "@/hooks/use-features";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Users,
    MessageSquare,
    AlertTriangle,
    TrendingUp,
    CheckCircle,
    XCircle,
    Loader2,
    ShieldCheck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function AdminDashboard() {
    const { data: stats, isLoading: statsLoading } = useAdminStats();
    const { data: reports, isLoading: reportsLoading } = useAdminReports();
    const resolveReport = useResolveReport();

    if (statsLoading || reportsLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-20 pt-10 px-4 sm:px-6">
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-2xl">
                        <ShieldCheck className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Admin Terminal</h1>
                        <p className="text-muted-foreground">Monitor platform health and curate professional content.</p>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <StatCard
                        title="Total Users"
                        value={stats?.userCount || 0}
                        icon={Users}
                        color="text-blue-600"
                        bg="bg-blue-50"
                    />
                    <StatCard
                        title="Total Posts"
                        value={stats?.postCount || 0}
                        icon={MessageSquare}
                        color="text-indigo-600"
                        bg="bg-indigo-50"
                    />
                    <StatCard
                        title="Pending Reports"
                        value={stats?.reportCount || 0}
                        icon={AlertTriangle}
                        color="text-red-600"
                        bg="bg-red-50"
                    />
                </div>

                {/* Moderation Queue */}
                <Card className="rounded-[2rem] overflow-hidden border-border/50">
                    <CardHeader className="bg-muted/50 border-b">
                        <CardTitle className="text-xl">Moderation Queue</CardTitle>
                        <CardDescription>Review and resolve content flagged by the community.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        {!reports || reports.length === 0 ? (
                            <div className="text-center py-20">
                                <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500/20" />
                                <h3 className="font-medium text-foreground/50">All caught up!</h3>
                                <p className="text-sm text-muted-foreground">No pending reports at this time.</p>
                            </div>
                        ) : (
                            <div className="divide-y">
                                <AnimatePresence mode="popLayout">
                                    {reports.map((report: any) => (
                                        <motion.div
                                            key={report.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/30 transition-colors"
                                        >
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold uppercase tracking-wider">
                                                        {report.targetType}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        Reported on {new Date(report.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <p className="text-sm font-medium leading-relaxed">
                                                    Reason: <span className="text-foreground">{report.reason}</span>
                                                </p>
                                                <p className="text-xs text-muted-foreground italic">
                                                    Target ID: {report.targetId}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="rounded-lg gap-2 text-red-600 hover:bg-red-50 hover:text-red-700"
                                                    onClick={() => resolveReport.mutate({ id: report.id, resolution: 'resolved' })}
                                                    disabled={resolveReport.isPending}
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                    Remove Content
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="rounded-lg gap-2"
                                                    onClick={() => resolveReport.mutate({ id: report.id, resolution: 'dismissed' })}
                                                    disabled={resolveReport.isPending}
                                                >
                                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                                    Dismiss
                                                </Button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon: Icon, color, bg }: any) {
    return (
        <Card className="rounded-2xl border-border/50 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
                        <p className="text-3xl font-bold tracking-tight">{value}</p>
                    </div>
                    <div className={cn("p-4 rounded-xl", bg)}>
                        <Icon className={cn("w-6 h-6", color)} />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
