import { createApp } from "../server/app.js";
import type { IncomingMessage, ServerResponse } from "http";

let app: any;

export default async function handler(req: IncomingMessage, res: ServerResponse) {
    try {
        if (!app) {
            app = await createApp();
        }
        return app(req, res);
    } catch (err: any) {
        console.error("Vercel Request Error:", err);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
            error: "Internal Server Error",
            message: process.env.NODE_ENV === "development" ? (err?.message || String(err)) : "An unexpected error occurred."
        }));
    }
}