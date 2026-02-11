import { setupAuth, isAuthenticated } from "./auth.js";
import passport from "passport";
import { api } from "../shared/routes.js";
import { storage } from "./storage.js";
import { z } from "zod";
import type { Express, Request, Response } from "express";
import type { Server } from "http";

export async function registerRoutes(
  app: Express,
  httpServer?: Server,
): Promise<Server | undefined> {
  // Setup Auth
  await setupAuth(app);

  // LinkedIn Auth Routes
  app.get("/api/auth/linkedin", (req, res, next) => {
    console.log("[AUTH DEBUG] Initiating LinkedIn OAuth redirect...");
    passport.authenticate("linkedin", { state: 'SOME_STATE_VAL' })(req, res, next);
  });

  app.get("/api/auth/linkedin/callback", (req, res, next) => {
    console.log("[AUTH DEBUG] LinkedIn callback received. Parameters:", req.query);
    passport.authenticate("linkedin", { failureRedirect: "/" })(req, res, (err: any) => {
      if (err) {
        console.error("[AUTH DEBUG] Callback authentication error:", err);
        return next(err);
      }
      console.log("[AUTH DEBUG] Callback authentication successful. Redirecting to feed.");
      res.redirect("/");
    });
  });

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
        const company = await storage.findOrCreateCompany(input.companyName);

        // Allow updating/completing the profile
        const updated = await storage.updateProfileVerification(userId, {
          role: input.role,
          companyId: company.id,
          linkedinUrlEncrypted: input.linkedinUrl,
          accountStatus: "verified_full",
          verificationStep: "completed"
        });
        return res.status(200).json(updated);
      }

      const profile = await storage.createProfile(userId, input.role, input.companyName, undefined, "verified_full", input.linkedinUrl);
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

  app.patch(api.profiles.updateLinkedInUrl.path, isAuthenticated, async (req: any, res: Response) => {
    const userId = req.user.id;
    try {
      const input = api.profiles.updateLinkedInUrl.input.parse(req.body);
      const updated = await storage.updateProfileVerification(userId, {
        linkedinUrlEncrypted: input.linkedinUrl
      });
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        console.error("Update LinkedIn URL error:", err);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.patch(api.profiles.me.path, isAuthenticated, async (req: any, res: Response) => {
    const userId = req.user.id;
    try {
      // Allow partial updates for profile settings (isExitMode, isLinkedInVisible)
      const allowedFields = ['isExitMode', 'isLinkedInVisible', 'role'];
      const updates: any = {};

      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ message: "No valid fields provided for update" });
      }

      const updated = await storage.updateProfileVerification(userId, updates);
      res.json(updated);
    } catch (err) {
      console.error("Update profile error:", err);
      res.status(500).json({ message: "Internal server error" });
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
  app.get("/api/posts/public", async (req: Request, res: Response) => {
    const category = req.query.category as string | undefined;
    const posts = await storage.getPublicPosts(category);
    res.json(posts);
  });

  app.get("/api/posts/public/:id", async (req: Request, res: Response) => {
    const postId = Number(req.params.id);
    const post = await storage.getPublicPost(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found or restricted" });
    }
    res.json(post);
  });

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
      const now = new Date();
      const day = now.getDay();
      const diff = now.getDate() - day + (day == 0 ? -6 : 1);
      const monday = new Date(now.setDate(diff));
      monday.setHours(0, 0, 0, 0);

      const existing = await storage.getWeeklyCheckin(userId, monday);
      if (existing) {
        return res.status(400).json({ message: "You have already checked in this week." });
      }

      const checkin = await storage.createWeeklyCheckin(userId, profile.companyId, input, monday);
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

  app.get(api.exchange.list.path, isAuthenticated, async (req: any, res: Response) => {
    const userId = req.user.id;
    try {
      const requests = await storage.getExchangeRequests(userId);
      res.json(requests);
    } catch (err) {
      console.error("List exchange requests error:", err);
      res.status(500).json({ message: "Internal server error" });
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

  return httpServer;
}
