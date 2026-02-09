import { createApp } from "../server/app";
import type { IncomingMessage, ServerResponse } from "http";

// Cache the app instance
let app: any;

export default async function handler(req: IncomingMessage, res: ServerResponse) {
    try {
        if (!app) {
            console.log("Initializing Express app for Vercel...");
            app = await createApp();
        }

        app(req, res);
    } catch (err) {
        console.error("Vercel Serverless Function Error:", err);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
            error: "Internal Server Error",
            message: err instanceof Error ? err.message : String(err)
        }));
    }
}
