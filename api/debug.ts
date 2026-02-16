import fs from "fs";
import path from "path";

export default function handler(req: any, res: any) {
    const cwd = process.cwd();
    let files: string[] = [];
    try {
        files = fs.readdirSync(cwd);
    } catch (e: any) {
        files = [e.message];
    }

    res.json({
        ok: true,
        cwd,
        files,
        nodeVersion: process.version,
        env: {
            NODE_ENV: process.env.NODE_ENV,
            VERCEL: process.env.VERCEL
        }
    });
}
