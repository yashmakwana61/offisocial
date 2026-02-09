import { setupAuth, isAuthenticated } from "./auth";
import passport from "passport";
import { VerificationService } from "./services/verification";
import { api } from "@shared/routes";
import { storage } from "./storage";
import { z } from "zod";
import type { Express, Request, Response } from "express";
import type { Server } from "http";

export async function registerRoutes(
  app: Express,
  httpServer?: Server,
): Promise<Server | undefined> {
  // Setup Auth first
  // Setup Auth
  await setupAuth(app);

  // Health check
  app.get("/api/health", (_req, res) => res.json({ status: "ok", message: "Backend is running" }));

  // LinkedIn Auth Routes
  app.get("/api/auth/linkedin", passport.authenticate("linkedin", { state: 'SOME_STATE_VAL' }));
  app.get("/api/auth/linkedin/callback",
    passport.authenticate("linkedin", { failureRedirect: "/login" }),
    (req: Request, res: Response) => {
      res.redirect("/"); // Redirect to feed (or onboarding via ProtectedRoute if needed)
    }
  );

  // === PROFILES ===
  app.get(api.profiles.me.path, isAuthenticated, async (req: any, res: Response) => {
    const userId = req.user.id;
    const profile = await storage.getProfileWithDetails(userId);
    res.json(profile || null);
  });

  app.post(api.profiles.create.path, isAuthenticated, async (req: any, res: Response) => {
    const userId = req.user.id;
    try {
      const input = api.profiles.create.input.parse(req.body);

      // Check if profile exists
      const existing = await storage.getProfile(userId);
      if (existing) {
        return res.status(400).json({ message: "Profile already exists" });
      }

      const profile = await storage.createProfile(userId, input.role, input.companyName);
      res.status(201).json(profile);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.patch(api.profiles.updateRole.path, isAuthenticated, async (req: any, res: Response) => {
    const userId = req.user.id;
    try {
      const input = api.profiles.updateRole.input.parse(req.body);
      const profile = await storage.updateRole(userId, input.role);
      res.json(profile);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.delete(api.profiles.delete.path, isAuthenticated, async (req: any, res: Response) => {
    const userId = req.user.id;
    try {
      const input = api.profiles.delete.input.parse(req.body);
      if (input.confirmation !== 'DELETE') {
        return res.status(400).json({ message: "Please type DELETE to confirm" });
      }

      await storage.deleteAccount(userId);
      res.json({ success: true, message: "Account deleted. Your posts remain anonymous." });
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        console.error("Delete account error:", err);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.post(api.profiles.logoutAll.path, isAuthenticated, async (req: any, res: Response) => {
    const userId = req.user.id;
    try {
      await storage.clearUserSessions(userId);
      res.json({ success: true, message: "All sessions have been logged out" });
    } catch (err) {
      console.error("Logout all error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // === POSTS ===
  app.get(api.posts.list.path, isAuthenticated, async (req: any, res: Response) => {
    const userId = req.user.id;
    const profile = await storage.getProfile(userId);

    if (!profile) {
      return res.status(403).json({ message: "Complete profile first" });
    }

    // Ensure companyId is not null
    if (!profile.companyId) {
      return res.status(403).json({ message: "No company associated with profile" });
    }

    const category = req.query.category as string | undefined;
    const posts = await storage.getCompanyPosts(profile.companyId, userId, category);
    res.json(posts);
  });

  app.get(api.posts.get.path, isAuthenticated, async (req: any, res: Response) => {
    const userId = req.user.id;
    const postId = Number(req.params.id);

    const post = await storage.getPost(postId, userId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const comments = await storage.getPostComments(postId, userId);
    res.json({ ...post, comments });
  });

  app.post(api.posts.create.path, isAuthenticated, async (req: any, res: Response) => {
    const userId = req.user.id;
    const profile = await storage.getProfile(userId);

    if (!profile || !profile.companyId) {
      return res.status(403).json({ message: "Complete profile first" });
    }

    try {
      const input = api.posts.create.input.parse(req.body);
      const post = await storage.createPost(userId, profile.companyId, input);
      res.status(201).json(post);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  // === COMMENTS ===
  app.post(api.comments.create.path, isAuthenticated, async (req: any, res: Response) => {
    const userId = req.user.id;
    try {
      const postId = Number(req.params.id);
      const input = api.comments.create.input.parse(req.body);
      const comment = await storage.createComment(userId, postId, input);
      res.status(201).json(comment);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  // === REACTIONS ===
  app.post(api.reactions.toggle.path, isAuthenticated, async (req: any, res: Response) => {
    const userId = req.user.id;
    try {
      const input = api.reactions.toggle.input.parse(req.body);
      const result = await storage.toggleReaction(userId, input.targetType, input.targetId, input.type);
      res.json({ success: true, ...result });
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  // === WEEKLY CHECK-INS ===
  app.post(api.weeklyCheckins.create.path, isAuthenticated, async (req: any, res: Response) => {
    const userId = req.user.id;
    const profile = await storage.getProfile(userId);

    if (!profile || !profile.companyId) {
      return res.status(403).json({ message: "Complete profile first" });
    }

    try {
      const input = api.weeklyCheckins.create.input.parse(req.body);

      // Check for existing checkin this week
      // Logic: Get current week start (Monday)
      const now = new Date();
      const day = now.getDay();
      const diff = now.getDate() - day + (day == 0 ? -6 : 1); // adjust when day is sunday
      const monday = new Date(now.setDate(diff));
      monday.setHours(0, 0, 0, 0);

      const existing = await storage.getWeeklyCheckin(userId, monday);
      if (existing) {
        return res.status(400).json({ message: "You have already checked in this week." });
      }

      const checkin = await storage.createWeeklyCheckin(userId, profile.companyId, {
        ...input,
        weekStartDate: monday
      });
      res.status(201).json(checkin);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.get(api.weeklyCheckins.getMine.path, isAuthenticated, async (req: any, res: Response) => {
    const userId = req.user.id;
    // Logic: Get current week start
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day == 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    monday.setHours(0, 0, 0, 0);

    const checkin = await storage.getWeeklyCheckin(userId, monday);
    res.json(checkin || null);
  });

  app.get(api.weeklyCheckins.getAggregated.path, isAuthenticated, async (req: any, res: Response) => {
    const userId = req.user.id;
    const profile = await storage.getProfile(userId);
    if (!profile || !profile.companyId) {
      return res.status(403).json({ message: "Complete profile first" });
    }

    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day == 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    monday.setHours(0, 0, 0, 0);

    const aggregated = await storage.getAggregatedCheckins(profile.companyId, monday);
    res.json(aggregated);
  });

  // === LINKEDIN EXCHANGE ===
  app.post(api.exchange.request.path, isAuthenticated, async (req: any, res: Response) => {
    const userId = req.user.id;
    try {
      const input = api.exchange.request.input.parse(req.body);
      if (input.recipientId === userId) {
        return res.status(400).json({ message: "Cannot request exchange with yourself" });
      }

      const request = await storage.createExchangeRequest(userId, input.recipientId);
      res.status(201).json(request);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.post(api.exchange.respond.path, isAuthenticated, async (req: any, res: Response) => {
    const userId = req.user.id;
    const requestId = Number(req.params.id);
    try {
      const input = api.exchange.respond.input.parse(req.body);

      const request = await storage.getExchangeRequest(requestId);
      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }

      if (request.recipientId !== userId) {
        return res.status(403).json({ message: "Not authorized to respond to this request" });
      }

      const updated = await storage.respondToExchange(requestId, input.status);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  // === REPORTS ===
  app.post(api.reports.create.path, isAuthenticated, async (req: any, res: Response) => {
    const userId = req.user.id;
    try {
      const input = api.reports.create.input.parse(req.body);
      const report = await storage.createReport(userId, input.targetType, input.targetId, input.reason);

      if (input.reason.toLowerCase().includes("management") || input.reason.toLowerCase().includes("hr")) {
        console.log(`[TRUST SYSTEM] Community flag raised for user ${userId}`);
      }

      res.status(201).json(report);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  // === VERIFICATION FLOW ===
  app.post("/api/verification/submit-url", isAuthenticated, async (req: any, res: Response) => {
    const userId = req.user.id;
    const { url } = req.body;

    if (!VerificationService.validateUrl(url)) {
      return res.status(400).json({ message: "Invalid LinkedIn URL" });
    }

    try {
      await storage.updateProfileVerification(userId, {
        linkedinUrlEncrypted: url,
        verificationStep: "url_submitted",
        accountStatus: "pending"
      });

      res.json({ message: "URL submitted", step: "url_submitted" });

      (async () => {
        const data = await VerificationService.extractProfileData(url);
        if (data) {
          const classification = VerificationService.classifyRole(data.role);
          if (classification.isBlocked) {
            await storage.updateProfileVerification(userId, {
              extractedRole: data.role,
              extractedCompany: data.company,
              accountStatus: "restricted",
              verificationStep: "completed",
              statusReason: `Account restricted: ${classification.matchedKeyword} roles are not allowed.`
            });
          } else {
            await storage.updateProfileVerification(userId, {
              extractedRole: data.role,
              extractedCompany: data.company,
              role: data.role,
              accountStatus: "verified_full",
              verificationStep: "completed"
            });
          }
        } else {
          await storage.updateProfileVerification(userId, {
            verificationStep: "extraction_pending"
          });
        }
      })();
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/verification/status", isAuthenticated, async (req: any, res: Response) => {
    const userId = req.user.id;
    const profile = await storage.getProfile(userId);
    res.json({
      status: profile?.accountStatus,
      step: profile?.verificationStep,
      reason: profile?.statusReason
    });
  });

  return httpServer;
}
