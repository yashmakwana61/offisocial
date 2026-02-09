import { createApp } from "../server/app";
import type { IncomingMessage, ServerResponse } from "http";

// Cache the app instance
let app: any;

export default async function handler(req: IncomingMessage, res: ServerResponse) {
    if (!app) {
        app = await createApp();
    }

    // Express app is a function (req, res, next)
    // We need to return a promise if async? No, app(req, res) handles it.
    app(req, res);
}
