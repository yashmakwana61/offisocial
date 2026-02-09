import type { IncomingMessage, ServerResponse } from "http";
import { createApp } from "../server/app";

let appPromise: ReturnType<typeof createApp> | null = null;

async function getApp() {
    if (!appPromise) {
        appPromise = createApp();
    }

    return appPromise;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
        status: "ok",
        message: "Minimal Vercel handler works",
        env: process.env.NODE_ENV,
        time: new Date().toISOString()
    }));
    const app = await getApp();
    return app(req, res);
}