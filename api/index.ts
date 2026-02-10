
import type { IncomingMessage, ServerResponse } from "http";

let app: any;

export default async function handler(req: IncomingMessage, res: ServerResponse) {
    const logs: string[] = [];
    const addLog = (msg: string) => {
        const line = `[${new Date().toISOString()}] ${msg}`;
        logs.push(line);
        console.log(line);
    };

    try {
        addLog("Vercel Handler Start");

        if (!app) {
            addLog("Attempting to import ../server/app.js...");
            const { createApp } = await import("../server/app.js");
            addLog("Import successful. Attempting to createApp()...");

            app = await createApp();
            addLog("createApp() successful.");
        }

        addLog("Forwarding request to Express app...");
        return app(req, res);

    } catch (err: any) {
        addLog(`CRITICAL ERROR: ${err?.message || String(err)}`);
        if (err?.stack) addLog(`Stack: ${err.stack}`);

        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({
            error: "Vercel Diagnostic Error",
            message: err?.message || String(err),
            phase: app ? "request_handling" : "bootstrapping",
            logs: logs,
            env: {
                has_db: !!process.env.DATABASE_URL
            }
        }));
    }
}