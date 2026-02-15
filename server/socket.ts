import { Server as SocketIOServer } from "socket.io";
import { type Server as HttpServer } from "http";
import { createAdapter } from "@socket.io/redis-adapter";
import Redis from "ioredis";

export let io: SocketIOServer;

export function setupSocket(httpServer: HttpServer) {
    io = new SocketIOServer(httpServer, {
        cors: {
            origin: "*", // Adjust in production
            credentials: true,
        },
        path: "/socket.io",
        transports: ["websocket", "polling"],
    });

    const redisUrl = process.env.REDIS_URL;
    if (redisUrl) {
        console.log("[Socket] Configuring Redis adapter for scaling.");
        const pubClient = new Redis(redisUrl);
        const subClient = pubClient.duplicate();
        io.adapter(createAdapter(pubClient, subClient));
    }

    io.on("connection", (socket) => {
        console.log(`[Socket] Client connected: ${socket.id}`);

        socket.on("disconnect", () => {
            console.log(`[Socket] Client disconnected: ${socket.id}`);
        });
    });

    return io;
}

export function emitEvent(event: string, data: any) {
    if (io) {
        io.emit(event, data);
        console.log(`[Socket] Emitted event: ${event}`);
    } else {
        console.warn("[Socket] IO server not initialized, event missed:", event);
    }
}
