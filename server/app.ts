import express, { type Request, type Response, type NextFunction } from "express";
import { registerRoutes } from "./routes.js";

declare module "http" {
    interface IncomingMessage {
        rawBody: unknown;
    }
}

export async function createApp() {
    const app = express();

    // Diagnostic route - no dependencies
    // Diagnostic route - no dependencies
    let dbStatus = "not_connected";
    let dbUrlFormat = "none";
    try {
        if (process.env.DATABASE_URL) {
            const databaseUrl = process.env.DATABASE_URL.trim();
            dbUrlFormat = databaseUrl.length > 20
                ? `${databaseUrl.slice(0, 8)}...${databaseUrl.slice(-5)} (len: ${databaseUrl.length})`
                : "too_short";

            const { db } = await import("./db.js");
            const { sql } = await import("drizzle-orm");
            await db.execute(sql`SELECT 1`);
            dbStatus = "ok";
        }
    } catch (err: any) {
        console.error("[HEALTH CHECK] DB Error:", err.message);
        dbStatus = `error: ${err.message}`;
    }

    res.json({
        status: "ok",
        db: dbStatus,
        dbUrlFormat,
        env: process.env.NODE_ENV,
        hasDbUrl: !!process.env.DATABASE_URL,
        time: new Date().toISOString()
    });
});

app.use(
    express.json({
        verify: (req, _res, buf) => {
            req.rawBody = buf;
        },
    }),
);

app.use(express.urlencoded({ extended: false }));

// Logging middleware
app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse: Record<string, any> | undefined = undefined;

    const originalResJson = res.json;
    res.json = function (bodyJson, ...args) {
        capturedJsonResponse = bodyJson;
        return originalResJson.apply(res, [bodyJson, ...args]);
    };

    res.on("finish", () => {
        const duration = Date.now() - start;
        if (path.startsWith("/api")) {
            let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
            if (capturedJsonResponse) {
                logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
            }

            if (logLine.length > 80) {
                logLine = logLine.slice(0, 79) + "…";
            }

            console.log(logLine);
        }
    });

    next();
});

// Register routes
// httpServer is optional, so we can pass undefined or let the caller attach it if they have it
// For Vercel, we don't have an httpServer in the same way, so we leave it.
await registerRoutes(app);

// Error handling middleware
app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    if (status === 500) {
        console.error("CRITICAL 500 ERROR STACK:", err.stack || err);
    }

    return res.status(status).json({
        message,
        stack: err.stack,
        details: err.toString()
    });
});

return app;
}
