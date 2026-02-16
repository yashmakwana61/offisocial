// Static import to ensure bundling
import { createApp } from "../server/app.js";

let app: any;

export default async function handler(req: any, res: any) {
    try {
        if (!app) {
            console.log("[API] Initializing app...");
            try {
                app = await createApp();
                console.log("[API] App initialized successfully.");
            } catch (e: any) {
                console.error("[API] Failed to initialize app:", e);
                throw e;
            }
        }
        return app(req, res);
    } catch (err: any) {
        console.error("[API] Request Error:", err);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
            error: "Internal Server Error",
            message: err?.message || String(err),
            // Only show stack in non-prod or if needed
            stack: process.env.NODE_ENV === 'production' ? undefined : err?.stack
        }));
    }
}