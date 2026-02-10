
export default function handler(req: any, res: any) {
    res.json({
        ok: true,
        message: "AESTHETIC DIAGNOSTIC: Minimal handler is working!",
        env: {
            NODE_ENV: process.env.NODE_ENV,
            HAS_DB: !!process.env.DATABASE_URL
        },
        time: new Date().toISOString()
    });
}