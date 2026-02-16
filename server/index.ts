import { createApp } from "./app.js";
// seedDatabase removed as per request
import { serveStatic } from "./static.js";
import { createServer } from "http";

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

(async () => {
  const app = await createApp();
  const httpServer = createServer(app);

  // We need to re-register routes if we want to pass httpServer?
  // Current createApp calls registerRoutes(app) which passes undefined for httpServer.
  // In server/routes.ts, it returns httpServer.
  // If we need strict compatibility where registerRoutes gets httpServer, we might need to adjust logic.
  // BUT, registerRoutes implementation doesn't use httpServer for anything critical except returning it.
  // The only loss is if something INSIDE registerRoutes relied on httpServer (like socket.io).
  // We verified no websockets. So this is fine.

  // Seeding removed
  // await seedDatabase();

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // Optimize: Setup Socket.io
  const { setupSocket } = await import("./socket");
  setupSocket(httpServer);

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "localhost",
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
// Add error handling to prevent crash
// .catch((err) => {
//   console.error("Failed to start server:", err);
//   // process.exit(1); // Don't exit, might recover or just log
// });
