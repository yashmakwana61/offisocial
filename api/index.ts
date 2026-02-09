import { createApp } from "../server/app.js";
import type { IncomingMessage, ServerResponse } from "http";

let app: any;

export default async function handler(req: IncomingMessage, res: ServerResponse) {
    try {
        if (!app) {
            console.log("Vercel Startup: Creating Express app...");
            app = await createApp();
        }

        // Express app(req, res) handles the request
        return app(req, res);
    } catch (err: any) {
        console.error("CRITICAL VERCEL BOOT ERROR:", err);

        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({
            error: "Vercel Boot Error",
            message: err?.message || String(err),
            stack: err?.stack || "No stack trace",
            env: {
                node_env: process.env.NODE_ENV,
                has_db: !!process.env.DATABASE_URL,
                has_session_secret: !!process.env.SESSION_SECRET
            }
        }));
    }
}