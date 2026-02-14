import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useChatRequests } from "@/hooks/use-posts";
import { ChatRequestItem } from "@/components/chat/ChatRequestItem";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, MessageSquareOff } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";

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
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    Messages
                </h1>
                <p className="text-muted-foreground">Manage your private chats and requests</p>
            </div>

            <Card className="border-none shadow-sm bg-background/50 backdrop-blur-sm">
                <CardHeader className="pb-4 px-0">
                    <Tabs defaultValue="active" className="w-full">
                        <TabsList className="grid w-full grid-cols-3 mb-6 p-1 bg-muted/50 rounded-xl">
                            <TabsTrigger value="active" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                Active ({activeChats.length})
                            </TabsTrigger>
                            <TabsTrigger value="pending" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                Requests ({incomingPending.length})
                            </TabsTrigger>
                            <TabsTrigger value="history" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                History
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="active" className="space-y-4 min-h-[400px]">
                            {activeChats.length > 0 ? (
                                <div className="grid gap-3">
                                    {activeChats.map((req: any) => (
                                        <ChatRequestItem key={req.id} request={req} currentUserId={user!.id} />
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                                    <div className="bg-muted/50 p-6 rounded-full mb-4">
                                        <MessageSquareOff className="h-10 w-10 opacity-50" />
                                    </div>
                                    <h3 className="font-semibold text-lg mb-1">No active chats</h3>
                                    <p className="text-sm">Start a conversation from the feed!</p>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="pending" className="space-y-4 min-h-[400px]">
                            {incomingPending.length > 0 ? (
                                <div className="grid gap-3">
                                    {incomingPending.map((req: any) => (
                                        <ChatRequestItem key={req.id} request={req} currentUserId={user!.id} />
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                                    <div className="bg-muted/50 p-6 rounded-full mb-4">
                                        <MessageSquareOff className="h-10 w-10 opacity-50" />
                                    </div>
                                    <h3 className="font-semibold text-lg mb-1">No pending requests</h3>
                                    <p className="text-sm">You're all caught up!</p>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="history" className="space-y-4 min-h-[400px]">
                            {pastRequests.length > 0 ? (
                                <div className="grid gap-3">
                                    {pastRequests.map((req: any) => (
                                        <ChatRequestItem key={req.id} request={req} currentUserId={user!.id} />
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                                    <div className="bg-muted/50 p-6 rounded-full mb-4">
                                        <MessageSquareOff className="h-10 w-10 opacity-50" />
                                    </div>
                                    <h3 className="font-semibold text-lg mb-1">No chat history</h3>
                                    <p className="text-sm">Past conversations will appear here.</p>
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </CardHeader>
            </Card>
        </div>
    );
}
