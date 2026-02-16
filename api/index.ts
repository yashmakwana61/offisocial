let app: any;

export default async function handler(req: any, res: any) {
    try {
        if (!app) {
            const { createApp } = await import("../server/app.js");
            app = await createApp();
        }
        return app(req, res);
    } catch (err: any) {
        console.error("Vercel Request Error:", err);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
            error: "Internal Server Error",
            message: err?.message || String(err),
            stack: err?.stack
        }));
    }
}