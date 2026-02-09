import { useProfile, useUpdateRole, useDeleteAccount, useUpdateProfile } from "@/hooks/use-profiles";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ArrowLeft, LogOut, Shield, UserCircle, EyeOff, Lock, Trash2, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Profile() {
  const { user, logout } = useAuth();
  const { data: profile } = useProfile();
  const updateRole = useUpdateRole();
  const updateProfile = useUpdateProfile();
  const deleteAccount = useDeleteAccount();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [exitMode, setExitMode] = useState(profile?.isExitMode || false);
  const [linkedinVisible, setLinkedinVisible] = useState(profile?.isLinkedInVisible || false);
  const [isEditingRole, setIsEditingRole] = useState(false);
  const [newRole, setNewRole] = useState(profile?.role || "");

  const handleSaveRole = () => {
    updateRole.mutate({ role: newRole }, {
      onSuccess: () => {
        setIsEditingRole(false);
        toast({ title: "Role updated" });
      },
      onError: (err) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      },
    });
  };

  const handleToggleSetting = (field: 'isExitMode' | 'isLinkedInVisible', value: boolean) => {
    // Explicitly construct the update object to satisfy type checker
    const update = field === 'isExitMode' ? { isExitMode: value } : { isLinkedInVisible: value };
    updateProfile.mutate(update as any, {
      onSuccess: () => {
        if (field === 'isExitMode') setExitMode(value);
        if (field === 'isLinkedInVisible') setLinkedinVisible(value);
        toast({ title: "Setting updated" });
      },
      onError: (err: any) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    });
  };

  const handleDeleteAccount = () => {
    if (confirm("Are you sure you want to delete your account? This cannot be undone.")) {
      deleteAccount.mutate({ confirmation: "DELETE" }, {
        onSuccess: () => {
          toast({ title: "Account deleted", description: "Your posts remain anonymous." });
          logout();
        },
        onError: (err) => {
          toast({ title: "Error", description: err.message, variant: "destructive" });
        },
      });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-20">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border/40">
        <div className="max-w-2xl lg:max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" className="-ml-2" onClick={() => setLocation("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-display font-bold text-xl sm:text-2xl tracking-tight">Your Profile</h1>
        </div>
      </header>

      <main className="max-w-2xl lg:max-w-3xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Profile Card */}
        <Card className="p-5 sm:p-6 overflow-hidden relative border-primary/10 bg-primary/5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <UserCircle className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
            </div>
            <div className="flex-1 w-full">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                {isEditingRole ? (
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <Input
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                      className="h-9 text-sm flex-1"
                      placeholder="Enter your role"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSaveRole}>Save</Button>
                      <Button size="sm" variant="outline" onClick={() => setIsEditingRole(false)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h2 className="font-semibold text-lg sm:text-xl">{newRole || profile?.role || "Team Member"}</h2>
                    <Button variant="ghost" size="sm" className="h-6 px-2 self-start sm:self-auto" onClick={() => setIsEditingRole(true)}>
                      <span className="text-xs text-muted-foreground hover:text-primary">Edit</span>
                    </Button>
                  </>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span>{profile?.companyName || "Acme Corp"}</span>
                {profile?.accountStatus === 'verified_full' && <Badge variant="secondary" className="text-[10px] h-5">Verified</Badge>}
              </div>
            </div>
          </div>
        </Card>

        {/* Settings - Grid on larger screens */}
        <div className="space-y-6 md:grid md:grid-cols-2 md:gap-6 md:space-y-0">
          <section className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Privacy & Exchange</h3>

            <Card className="p-4 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5 flex-1">
                  <Label className="text-base">LinkedIn Exchange</Label>
                  <p className="text-xs text-muted-foreground">Allow others to request your LinkedIn.</p>
                </div>
                <Switch
                  checked={linkedinVisible}
                  onCheckedChange={(checked) => handleToggleSetting('isLinkedInVisible', checked)}
                  disabled={updateProfile.isPending}
                />
              </div>
            </Card>
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Wellbeing</h3>

            <Card className="p-4 border-amber-500/20 bg-amber-500/5">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5 flex-1">
                  <Label className="text-base flex flex-wrap items-center gap-2">
                    Exit with Dignity Mode
                    <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-600">Beta</Badge>
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Prioritizes content about policies, legal rights, and exit strategies.
                  </p>
                </div>
                <Switch
                  checked={exitMode}
                  onCheckedChange={(checked) => handleToggleSetting('isExitMode', checked)}
                  disabled={updateProfile.isPending}
                />
              </div>
            </Card>
          </section>
        </div>


        <section className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Account</h3>

          <Card className="divide-y divide-border/50">
            <Button variant="ghost" className="w-full justify-start h-12 sm:h-14 text-muted-foreground hover:text-foreground rounded-none first:rounded-t-lg">
              <Shield className="w-4 h-4 mr-3" />
              Privacy Policy
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start h-12 sm:h-14 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-none last:rounded-b-lg"
              onClick={() => logout()}
            >
              <LogOut className="w-4 h-4 mr-3" />
              Log Out
            </Button>
          </Card>

          <div className="text-center pt-2">
            <Button
              variant="ghost"
              className="text-destructive/60 text-xs hover:text-destructive"
              onClick={handleDeleteAccount}
              disabled={deleteAccount.isPending}
            >
              {deleteAccount.isPending ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Trash2 className="w-3 h-3 mr-1" />}
              Delete Account
            </Button>
          </div>
        </section>

        <Card className="md:col-span-2">
          <div className="p-4 sm:p-5 space-y-4 sm:grid sm:grid-cols-2 sm:gap-6 sm:space-y-0">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm text-foreground">What we store</p>
                <p className="text-xs text-muted-foreground">Your email (for verification), company, and role. This data is encrypted.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <EyeOff className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm text-foreground">What is anonymous</p>
                <p className="text-xs text-muted-foreground">All your posts and comments. Other users only see "Coworker".</p>
              </div>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}
