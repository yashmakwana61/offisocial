import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useSettings, useUpdateSettings } from "@/hooks/use-features";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
    User,
    Bell,
    Shield,
    Moon,
    Sun,
    Monitor,
    Loader2,
    CheckCircle2,
    Linkedin,
    LogOut,
    Trash2
} from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

export default function Settings() {
    const { logout, isLoggingOut } = useAuth();
    const { data: settings, isLoading } = useSettings();
    const updateSettings = useUpdateSettings();
    const { toast } = useToast();
    const { theme, setTheme } = useTheme();

    // Local state for optimistic UI or just to manage form
    const [localSettings, setLocalSettings] = useState<any>(null);

    useEffect(() => {
        if (settings) {
            setLocalSettings(settings);
        }
    }, [settings]);

    const handleToggle = async (category: string, key: string, value: boolean) => {
        const newSettings = {
            ...localSettings,
            [category]: {
                ...localSettings[category],
                [key]: value
            }
        };
        setLocalSettings(newSettings);
        try {
            await updateSettings.mutateAsync(newSettings);
        } catch (err: any) {
            toast({ title: "Update failed", description: err.message, variant: "destructive" });
        }
    };

    if (isLoading || !localSettings) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-20 pt-10">
            <div className="max-w-3xl mx-auto px-4 space-y-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                    <p className="text-muted-foreground mt-1">Manage your professional identity and platform experience.</p>
                </div>

                <div className="grid gap-6">
                    {/* Privacy Settings */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Shield className="w-5 h-5 text-primary" />
                                <CardTitle>Privacy & Identity</CardTitle>
                            </div>
                            <CardDescription>Control how you appear to others on Offisocial.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <Label className="text-base">LinkedIn Visibility</Label>
                                    <p className="text-sm text-muted-foreground">Allow others to see your LinkedIn profile after a mutual reveal.</p>
                                </div>
                                <Switch
                                    checked={localSettings.privacy?.showLinkedin}
                                    onCheckedChange={(v) => handleToggle('privacy', 'showLinkedin', v)}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <Label className="text-base">Anonymous Contributor</Label>
                                    <p className="text-sm text-muted-foreground">Always show your role and company on posts (vetted anonymity).</p>
                                </div>
                                <Switch
                                    checked={localSettings.privacy?.dataSharing}
                                    onCheckedChange={(v) => handleToggle('privacy', 'dataSharing', v)}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Notification Settings */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Bell className="w-5 h-5 text-primary" />
                                <CardTitle>Notifications</CardTitle>
                            </div>
                            <CardDescription>Choose when you want to be notified.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <Label className="text-base">Mentions & Tags</Label>
                                    <p className="text-sm text-muted-foreground">Notify me when someone mentions me in a post or comment.</p>
                                </div>
                                <Switch
                                    checked={localSettings.notifications?.mentions}
                                    onCheckedChange={(v) => handleToggle('notifications', 'mentions', v)}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <Label className="text-base">Direct Message Requests</Label>
                                    <p className="text-sm text-muted-foreground">Notify me of new professional chat requests.</p>
                                </div>
                                <Switch
                                    checked={localSettings.notifications?.replies}
                                    onCheckedChange={(v) => handleToggle('notifications', 'replies', v)}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Appearance */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                {theme === 'dark' ? <Moon className="w-5 h-5 text-primary" /> : <Sun className="w-5 h-5 text-primary" />}
                                <CardTitle>Appearance</CardTitle>
                            </div>
                            <CardDescription>Customize how Offisocial looks on your screen.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-3 gap-4">
                            {[
                                { id: 'light', icon: Sun, label: 'Light' },
                                { id: 'dark', icon: Moon, label: 'Dark' },
                                { id: 'system', icon: Monitor, label: 'System' }
                            ].map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setTheme(item.id)}
                                    className={cn(
                                        "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                                        theme === item.id ? "border-primary bg-primary/5" : "border-transparent bg-muted/50 hover:bg-muted"
                                    )}
                                >
                                    <item.icon className={cn("w-6 h-6", theme === item.id ? "text-primary" : "text-muted-foreground")} />
                                    <span className="text-xs font-medium">{item.label}</span>
                                </button>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Account Actions */}
                    <div className="flex flex-col gap-4 pt-4">
                        <Button
                            variant="outline"
                            className="h-12 rounded-xl justify-start gap-3 border-red-100 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200"
                            disabled={isLoggingOut}
                            onClick={() => logout()}
                        >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                        </Button>
                        <Button
                            variant="ghost"
                            className="h-12 rounded-xl justify-start gap-3 text-muted-foreground hover:text-red-600 hover:bg-red-50"
                        >
                            <Trash2 className="w-4 h-4" />
                            Delete Account
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
