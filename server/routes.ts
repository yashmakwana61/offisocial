import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup Auth first
  await setupAuth(app);
  registerAuthRoutes(app);

  // === PROFILES ===
  app.get(api.profiles.me.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const profile = await storage.getProfileWithDetails(userId);
    res.json(profile || null);
  });

  app.post(api.profiles.create.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
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

  app.patch(api.profiles.updateRole.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
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

  app.delete(api.profiles.delete.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
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

  app.post(api.profiles.logoutAll.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    try {
      await storage.clearUserSessions(userId);
      res.json({ success: true, message: "All sessions have been logged out" });
    } catch (err) {
      console.error("Logout all error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // === POSTS ===
  app.get(api.posts.list.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
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

  app.get(api.posts.get.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const postId = Number(req.params.id);
    
    const post = await storage.getPost(postId, userId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const comments = await storage.getPostComments(postId, userId);
    res.json({ ...post, comments });
  });

  app.post(api.posts.create.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
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
  app.post(api.comments.create.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
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
  app.post(api.reactions.toggle.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
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

  return httpServer;
}
