import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useChatRequests } from "@/hooks/use-posts";
import { ChatRequestItem } from "@/components/chat/ChatRequestItem";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, MessageSquareOff } from "lucide-react";

export default function ChatRequests() {
    const { user } = useAuth();
    const { data: requests, isLoading } = useChatRequests();

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const incomingPending = requests?.filter(r => r.recipientId === user?.id && r.status === 'pending') || [];
    const activeChats = requests?.filter(r => r.status === 'accepted') || [];
    const pastRequests = requests?.filter(r => r.status !== 'pending' && r.status !== 'accepted') || [];

    return (
        <div className="container max-w-3xl py-8">
            <h1 className="text-3xl font-bold mb-6">Private Chats & Requests</h1>

            <Tabs defaultValue="active" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-8">
                    <TabsTrigger value="active">Active Chats ({activeChats.length})</TabsTrigger>
                    <TabsTrigger value="pending">Pending Requests ({incomingPending.length})</TabsTrigger>
                    <TabsTrigger value="history">History</TabsTrigger>
                </TabsList>

                <TabsContent value="active" className="space-y-4">
                    {activeChats.length > 0 ? (
                        activeChats.map(req => (
                            <ChatRequestItem key={req.id} request={req} currentUserId={user!.id} />
                        ))
                    ) : (
                        <div className="text-center py-12 text-muted-foreground border border-dashed rounded-xl">
                            <MessageSquareOff className="mx-auto h-12 w-12 opacity-50 mb-3" />
                            <p>No active chats yet.</p>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="pending" className="space-y-4">
                    {incomingPending.length > 0 ? (
                        incomingPending.map(req => (
                            <ChatRequestItem key={req.id} request={req} currentUserId={user!.id} />
                        ))
                    ) : (
                        <div className="text-center py-12 text-muted-foreground border border-dashed rounded-xl">
                            <p>No pending requests.</p>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="history" className="space-y-4">
                    {pastRequests.length > 0 ? (
                        pastRequests.map(req => (
                            <ChatRequestItem key={req.id} request={req} currentUserId={user!.id} />
                        ))
                    ) : (
                        <div className="text-center py-12 text-muted-foreground border border-dashed rounded-xl">
                            <p>No chat history.</p>
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
