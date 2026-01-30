import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useProfile, useUpdateRole, useDeleteAccount, useLogoutAll } from "@/hooks/use-profiles";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { ArrowLeft, Building2, Mail, Briefcase, Shield, AlertTriangle, LogOut, Trash2, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Clock } from "lucide-react";

export default function Profile() {
  const { logout } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const updateRoleMutation = useUpdateRole();
  const deleteAccountMutation = useDeleteAccount();
  const logoutAllMutation = useLogoutAll();
  const { toast } = useToast();

  const [isEditingRole, setIsEditingRole] = useState(false);
  const [newRole, setNewRole] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const handleUpdateRole = () => {
    if (newRole.length < 2 || newRole.length > 50) {
      toast({ title: "Invalid role", description: "Role must be 2-50 characters", variant: "destructive" });
      return;
    }
    updateRoleMutation.mutate({ role: newRole }, {
      onSuccess: () => {
        toast({ title: "Role updated", description: "Your role has been updated for future posts." });
        setIsEditingRole(false);
        setNewRole("");
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to update role", variant: "destructive" });
      }
    });
  };

  const handleLogoutAll = () => {
    logoutAllMutation.mutate(undefined, {
      onSuccess: () => {
        toast({ title: "Sessions cleared", description: "All sessions have been logged out." });
        window.location.href = "/api/logout";
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to log out sessions", variant: "destructive" });
      }
    });
  };

  const handleDeleteAccount = () => {
    if (deleteConfirmation !== "DELETE") {
      toast({ title: "Confirmation required", description: "Please type DELETE to confirm", variant: "destructive" });
      return;
    }
    deleteAccountMutation.mutate({ confirmation: "DELETE" }, {
      onSuccess: () => {
        toast({ title: "Account deleted", description: "Your account has been deleted. Posts remain anonymous." });
        setIsDeleteDialogOpen(false);
        window.location.href = "/api/logout";
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to delete account", variant: "destructive" });
      }
    });
  };

  const getStatusBadge = () => {
    switch (profile?.accountStatus) {
      case "active":
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200"><CheckCircle2 className="w-3 h-3 mr-1" /> Active</Badge>;
      case "under_review":
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200"><Clock className="w-3 h-3 mr-1" /> Under Review</Badge>;
      case "restricted":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><AlertCircle className="w-3 h-3 mr-1" /> Restricted</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-muted/20 pb-20">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Feed</span>
          </Link>
          <Button variant="ghost" size="sm" onClick={() => logout()} className="text-muted-foreground hover:text-destructive">
            <LogOut className="w-4 h-4 mr-2" />
            Log out
          </Button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 pt-8 space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Your Profile</h1>
          <p className="text-muted-foreground">Private information only visible to you.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="w-5 h-5 text-primary" />
              Company Information
            </CardTitle>
            <CardDescription>Your verified workplace</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-muted-foreground text-sm">Company</Label>
              <p className="font-medium text-foreground">{profile?.companyName || "Not set"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-sm flex items-center gap-1">
                <Mail className="w-3 h-3" /> Verified Email
              </Label>
              <p className="font-mono text-sm text-foreground">{profile?.maskedEmail}</p>
              <p className="text-xs text-muted-foreground mt-1">Email is partially hidden for your privacy</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Briefcase className="w-5 h-5 text-primary" />
              Role / Title
            </CardTitle>
            <CardDescription>Shown next to your posts and comments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditingRole ? (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="role">New Role (2-50 characters)</Label>
                  <Input 
                    id="role"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value.slice(0, 50))}
                    placeholder="e.g., Frontend Engineer, HR Ops"
                    className="mt-1"
                    data-testid="input-role"
                  />
                  <p className="text-xs text-muted-foreground mt-1">{newRole.length}/50 characters</p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleUpdateRole} disabled={updateRoleMutation.isPending} data-testid="button-save-role">
                    {updateRoleMutation.isPending ? "Saving..." : "Save"}
                  </Button>
                  <Button variant="outline" onClick={() => { setIsEditingRole(false); setNewRole(""); }} data-testid="button-cancel-role">
                    Cancel
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Changes apply only to future posts.</p>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{profile?.role || "Not set"}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => { setIsEditingRole(true); setNewRole(profile?.role || ""); }} data-testid="button-edit-role">
                  Edit
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="w-5 h-5 text-primary" />
              Account Status
            </CardTitle>
            <CardDescription>Current status of your account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Status</span>
              {getStatusBadge()}
            </div>
            {profile?.accountStatus === "restricted" && profile?.statusReason && (
              <div className="bg-red-50 border border-red-100 rounded-lg p-4">
                <p className="text-sm text-red-800">{profile.statusReason}</p>
              </div>
            )}
            <Separator />
            <div>
              <Button 
                variant="outline" 
                className="w-full justify-start text-muted-foreground hover:text-foreground"
                onClick={handleLogoutAll}
                disabled={logoutAllMutation.isPending}
                data-testid="button-logout-all"
              >
                <Lock className="w-4 h-4 mr-2" />
                {logoutAllMutation.isPending ? "Logging out..." : "Log out of all sessions"}
              </Button>
              <p className="text-xs text-muted-foreground mt-2">This will sign you out everywhere.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-destructive">
              <Trash2 className="w-5 h-5" />
              Delete Account
            </CardTitle>
            <CardDescription>Permanently remove your account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 space-y-2">
              <p className="text-sm text-amber-900 font-medium">What happens when you delete:</p>
              <ul className="text-sm text-amber-800 space-y-1 ml-4 list-disc">
                <li>Your identity is permanently removed</li>
                <li>Your posts remain but show as "Anonymous"</li>
                <li>Your comments show as "Deleted User"</li>
                <li>You cannot recover your account</li>
              </ul>
            </div>
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive" className="w-full" data-testid="button-delete-account">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete My Account
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="w-5 h-5" />
                    Confirm Account Deletion
                  </DialogTitle>
                  <DialogDescription>
                    This action cannot be undone. Your posts will remain but be fully anonymized.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="confirm-delete">Type DELETE to confirm</Label>
                    <Input 
                      id="confirm-delete"
                      value={deleteConfirmation}
                      onChange={(e) => setDeleteConfirmation(e.target.value)}
                      placeholder="DELETE"
                      className="mt-1 font-mono"
                      data-testid="input-delete-confirmation"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => { setIsDeleteDialogOpen(false); setDeleteConfirmation(""); }} data-testid="button-cancel-delete">
                    Cancel
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={handleDeleteAccount}
                    disabled={deleteConfirmation !== "DELETE" || deleteAccountMutation.isPending}
                    data-testid="button-confirm-delete"
                  >
                    {deleteAccountMutation.isPending ? "Deleting..." : "Delete Account"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Eye className="w-5 h-5 text-primary" />
              Privacy & Safety
            </CardTitle>
            <CardDescription>How we protect your information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Lock className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">What we store</p>
                  <p>Your email (for verification), company, and role. This data is encrypted and never shared publicly.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <EyeOff className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">What is anonymous</p>
                  <p>All your posts and comments. Other users only see "Coworker" - never your name or email.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Shield className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">When moderators see identity</p>
                  <p>Only if content violates our guidelines (threats, harassment, illegal activity). We review reports carefully and never share identity without cause.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
