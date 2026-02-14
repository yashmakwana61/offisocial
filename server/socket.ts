import { Server as SocketIOServer } from "socket.io";
import { type Server as HttpServer } from "http";

export let io: SocketIOServer;

export function setupSocket(httpServer: HttpServer) {
    io = new SocketIOServer(httpServer, {
        cors: {
            origin: "*", // Adjust in production
            credentials: true,
        },
        path: "/socket.io",
    });

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
