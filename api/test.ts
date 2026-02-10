
export default function handler(req: any, res: any) {
    res.json({
        ok: true,
        env: {
            NODE_ENV: process.env.NODE_ENV,
            HAS_DB: !!process.env.DATABASE_URL,
            PORT: process.env.PORT,
            VERCEL: process.env.VERCEL
        },
        time: new Date().toISOString()
    });
}
