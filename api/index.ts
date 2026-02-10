import { createApp } from "../server/app";
import type { IncomingMessage, ServerResponse } from "http";

let app: any;

export default async function handler(req: IncomingMessage, res: ServerResponse) {
    try {
        if (!app) {
            console.log("Vercel Startup: Creating Express app...");
            try {
                app = await createApp();
                console.log("Vercel Startup: Express app created successfully.");
            } catch (createError: any) {
                console.error("Vercel Startup: createApp FAILED:", createError);
                throw createError;
            }
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
            phase: app ? "request_handling" : "bootstrapping",
            env: {
                node_env: process.env.NODE_ENV,
                has_db: !!process.env.DATABASE_URL,
                has_session_secret: !!process.env.SESSION_SECRET
            }
        }));
    }
}