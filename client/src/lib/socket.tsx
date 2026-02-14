import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import { useToast } from "@/hooks/use-toast";

type SocketContextType = {
    socket: Socket | null;
    isConnected: boolean;
};

const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false,
});

export function useSocket() {
    return useContext(SocketContext);
}

export function SocketProvider({ children }: { children: ReactNode }) {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        const socketInstance = io(window.location.origin, {
            path: "/socket.io",
            withCredentials: true,
            transports: ["websocket", "polling"], // Try websocket first
        });

        socketInstance.on("connect", () => {
            console.log("[Socket] Connected to server");
            setIsConnected(true);
        });

        socketInstance.on("disconnect", () => {
            console.log("[Socket] Disconnected from server");
            setIsConnected(false);
        });

        socketInstance.on("connect_error", (err) => {
            console.warn("[Socket] Connection error:", err);
            // Optional: Toast on failure? Might be annoying if persistent.
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, []);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
}
