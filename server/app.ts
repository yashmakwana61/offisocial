import express, { type Request, type Response, type NextFunction } from "express";
import { registerRoutes } from "./routes";

declare module "http" {
    interface IncomingMessage {
        rawBody: unknown;
    }
}

export async function createApp() {
    const app = express();

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

        console.error("Internal Server Error:", err);

        if (res.headersSent) {
            return next(err);
        }

        return res.status(status).json({ message });
    });

    return app;
}
