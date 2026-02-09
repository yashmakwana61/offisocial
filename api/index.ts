import type { IncomingMessage, ServerResponse } from "http";

export default async function handler(req: IncomingMessage, res: ServerResponse) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
        status: "ok",
        message: "Minimal Vercel handler works",
        env: process.env.NODE_ENV,
        time: new Date().toISOString()
    }));
}
