import { useInfiniteQuery, useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type CreatePostInput, type CreateCommentInput } from "@shared/schema";
import { useSocket } from "../lib/socket";
import { useEffect } from "react";

export function usePosts(category?: string, enabled = true, searchQuery?: string) {
  const query = useInfiniteQuery({
    queryKey: [api.posts.list.path, category, searchQuery],
    queryFn: async ({ pageParam = 0 }) => {
      const url = new URL(window.location.origin + api.posts.list.path);
      if (category) url.searchParams.set("category", category);
      if (searchQuery) url.searchParams.set("search", searchQuery);
      url.searchParams.set("limit", "20");
      url.searchParams.set("offset", pageParam.toString());

      const res = await fetch(url.toString(), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch posts");
      return api.posts.list.responses[200].parse(await res.json());
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage || lastPage.length < 20) return undefined;
      return allPages.length * 20;
    },
    enabled,
  });

  const { socket } = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket) return;
    const onPostCreated = (newPost: any) => {
      queryClient.invalidateQueries({ queryKey: [api.posts.list.path] });
    };
    const onReactionUpdated = (data: any) => {
      if (data.targetType === 'post') {
        queryClient.invalidateQueries({ queryKey: [api.posts.list.path] });
      }
    };
    const onCommentCreated = (data: any) => {
      queryClient.invalidateQueries({ queryKey: [api.posts.list.path] });
    };

    socket.on("post:created", onPostCreated);
    socket.on("reaction:updated", onReactionUpdated);
    socket.on("comment:created", onCommentCreated);
    socket.on("poll:voted", (data: any) => {
      queryClient.invalidateQueries({ queryKey: [api.posts.list.path] });
    });

    return () => {
      socket.off("post:created", onPostCreated);
      socket.off("reaction:updated", onReactionUpdated);
      socket.off("comment:created", onCommentCreated);
    };
  }, [socket, queryClient]);

  return query;
}

export function usePublicPosts(category?: string, enabled = true, searchQuery?: string) {
  const query = useInfiniteQuery({
    queryKey: [api.posts.publicList.path, category, searchQuery],
    queryFn: async ({ pageParam = 0 }) => {
      const url = new URL(window.location.origin + api.posts.publicList.path);
      if (category) url.searchParams.set("category", category);
      if (searchQuery) url.searchParams.set("search", searchQuery);
      url.searchParams.set("limit", "20");
      url.searchParams.set("offset", pageParam.toString());

      const res = await fetch(url.toString(), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch public posts");
      return api.posts.publicList.responses[200].parse(await res.json());
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage || lastPage.length < 20) return undefined;
      return allPages.length * 20;
    },
    enabled,
  });

  const { socket } = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket) return;
    const onPostCreated = (newPost: any) => {
      queryClient.invalidateQueries({ queryKey: [api.posts.publicList.path] });
    };
    const onReactionUpdated = (data: any) => {
      if (data.targetType === 'post') {
        queryClient.invalidateQueries({ queryKey: [api.posts.publicList.path] });
      }
    };
    const onCommentCreated = (data: any) => {
      queryClient.invalidateQueries({ queryKey: [api.posts.publicList.path] });
    };

    socket.on("post:created", onPostCreated);
    socket.on("reaction:updated", onReactionUpdated);
    socket.on("comment:created", onCommentCreated);
    socket.on("poll:voted", (data: any) => {
      queryClient.invalidateQueries({ queryKey: [api.posts.publicList.path] });
    });

    return () => {
      socket.off("post:created", onPostCreated);
      socket.off("reaction:updated", onReactionUpdated);
      socket.off("comment:created", onCommentCreated);
    };
  }, [socket, queryClient]);

  return query;
}

export function usePost(id: number) {
  const query = useQuery({
    queryKey: [api.posts.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.posts.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch post");
      return api.posts.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });

  const { socket } = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket || !id) return;

    const onCommentCreated = (comment: any) => {
      if (comment.postId === id) {
        queryClient.invalidateQueries({ queryKey: [api.posts.get.path, id] });
      }
    };

    const onReactionUpdated = (data: any) => {
      if (data.targetType === 'post' && data.targetId === id) {
        queryClient.invalidateQueries({ queryKey: [api.posts.get.path, id] });
      }
    };

    socket.on("comment:created", onCommentCreated);
    socket.on("reaction:updated", onReactionUpdated);
    socket.on("poll:voted", (data: any) => {
      if (data.postId === id) {
        queryClient.invalidateQueries({ queryKey: [api.posts.get.path, id] });
      }
    });

    return () => {
      socket.off("comment:created", onCommentCreated);
      socket.off("reaction:updated", onReactionUpdated);
    };
  }, [socket, id, queryClient]);

  return query;
}

export function usePublicPost(id: number) {
  const query = useQuery({
    queryKey: [api.posts.publicGet.path, id],
    queryFn: async () => {
      const url = buildUrl(api.posts.publicGet.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch public post");
      return api.posts.publicGet.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });

  const { socket } = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket || !id) return;

    const onCommentCreated = (comment: any) => {
      if (comment.postId === id) {
        queryClient.invalidateQueries({ queryKey: [api.posts.publicGet.path, id] });
      }
    };

    const onReactionUpdated = (data: any) => {
      if (data.targetType === 'post' && data.targetId === id) {
        queryClient.invalidateQueries({ queryKey: [api.posts.publicGet.path, id] });
      }
    };

    socket.on("comment:created", onCommentCreated);
    socket.on("reaction:updated", onReactionUpdated);
    socket.on("poll:voted", (data: any) => {
      if (data.postId === id) {
        queryClient.invalidateQueries({ queryKey: [api.posts.publicGet.path, id] });
      }
    });

    return () => {
      socket.off("comment:created", onCommentCreated);
      socket.off("reaction:updated", onReactionUpdated);
    };
  }, [socket, id, queryClient]);

  return query;
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreatePostInput & { attachments?: any[], pollData?: any }) => {
      const res = await fetch(api.posts.create.path, {
        method: api.posts.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to create post");
      return api.posts.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.posts.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.posts.publicList.path] });
    },
  });
}

export function useVotePoll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, optionIndex }: { postId: number; optionIndex: number }) => {
      const url = buildUrl(api.posts.vote.path, { id: postId });
      const res = await fetch(url, {
        method: api.posts.vote.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optionIndex }),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to vote");
      return api.posts.vote.responses[200].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.posts.get.path, variables.postId] });
      queryClient.invalidateQueries({ queryKey: [api.posts.publicGet.path, variables.postId] });
      queryClient.invalidateQueries({ queryKey: [api.posts.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.posts.publicList.path] });
    },
  });
}

export function useCreateComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, content, parentId }: { postId: number; content: string; parentId?: number }) => {
      const url = buildUrl(api.comments.create.path, { id: postId });
      const payload: any = { content, parentId };

      const res = await fetch(url, {
        method: api.comments.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to create comment");
      return api.comments.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.posts.get.path, variables.postId] });
      queryClient.invalidateQueries({ queryKey: [api.posts.publicGet.path, variables.postId] });
      queryClient.invalidateQueries({ queryKey: [api.posts.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.posts.publicList.path] });
    },
  });
}

export function useToggleReaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { targetType: 'post' | 'comment'; targetId: number; type: 'support' | 'helpful' }) => {
      const res = await fetch(api.reactions.toggle.path, {
        method: api.reactions.toggle.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (res.status === 401) {
        window.location.href = "/api/auth/linkedin";
        throw new Error("Unauthorized");
      }
      if (!res.ok) throw new Error("Failed to toggle reaction");
      return res.json();
    },
    onMutate: async (variables) => {
      const targetId = String(variables.targetId);
      console.log(`[REACTIONS] Start mutate: ${variables.targetType}:${targetId}, type=${variables.type}`);

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: [api.posts.list.path] });
      await queryClient.cancelQueries({ queryKey: [api.posts.publicList.path] });
      if (variables.targetType === 'post') {
        await queryClient.cancelQueries({ queryKey: [api.posts.get.path] });
        await queryClient.cancelQueries({ queryKey: [api.posts.publicGet.path] });
      }

      // Snapshot previous values
      const previousQueries = queryClient.getQueriesData({ queryKey: [api.posts.list.path] });
      const previousPublicQueries = queryClient.getQueriesData({ queryKey: [api.posts.publicList.path] });
      const previousDetails = queryClient.getQueriesData({ queryKey: [api.posts.get.path] });
      const previousPublicDetails = queryClient.getQueriesData({ queryKey: [api.posts.publicGet.path] });

      // Unified update logic for a single post object
      const updatePostObject = (post: any) => {
        if (!post || String(post.id) !== targetId) return post;

        const oldReaction = post.userReaction;
        const newReaction = oldReaction === variables.type ? null : variables.type;

        const counts = {
          support: Number(post.reactionCounts?.support || 0),
          helpful: Number(post.reactionCounts?.helpful || 0)
        };

        // If we had a previous reaction, decrement that count
        if (oldReaction) {
          (counts as any)[oldReaction] = Math.max(0, (counts as any)[oldReaction] - 1);
        }

        // If we have a new reaction, increment that count
        if (newReaction) {
          (counts as any)[newReaction] = ((counts as any)[newReaction] || 0) + 1;
        }

        return {
          ...post,
          userReaction: newReaction,
          reactionCounts: counts
        };
      };

      // Updater for infinite queries
      const infiniteUpdater = (oldData: any) => {
        if (!oldData || !oldData.pages) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map((page: any[]) => page.map(updatePostObject)),
        };
      };

      // Apply optimistic updates to all matching feed queries
      queryClient.setQueriesData({ queryKey: [api.posts.list.path] }, infiniteUpdater);
      queryClient.setQueriesData({ queryKey: [api.posts.publicList.path] }, infiniteUpdater);

      // Apply optimistic updates to all matching detail queries
      if (variables.targetType === 'post') {
        queryClient.setQueriesData({ queryKey: [api.posts.get.path] }, (old: any) => updatePostObject(old));
        queryClient.setQueriesData({ queryKey: [api.posts.publicGet.path] }, (old: any) => updatePostObject(old));
      }

      return { previousQueries, previousPublicQueries, previousDetails, previousPublicDetails };
    },
    onError: (err, variables, context) => {
      console.error(`[REACTIONS] Mutate error:`, err);
      if (context) {
        context.previousQueries?.forEach(([key, val]: any) => queryClient.setQueryData(key, val));
        context.previousPublicQueries?.forEach(([key, val]: any) => queryClient.setQueryData(key, val));
        context.previousDetails?.forEach(([key, val]: any) => queryClient.setQueryData(key, val));
        context.previousPublicDetails?.forEach(([key, val]: any) => queryClient.setQueryData(key, val));
      }
    },
    onSettled: (data, error, variables) => {
      // Final invalidations to ensure sync
      queryClient.invalidateQueries({ queryKey: [api.posts.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.posts.publicList.path] });
      if (variables.targetType === 'post') {
        const targetId = variables.targetId;
        // Invalidate specific detail queries
        queryClient.invalidateQueries({ queryKey: [api.posts.get.path, targetId] });
        queryClient.invalidateQueries({ queryKey: [api.posts.publicGet.path, targetId] });
      }
    },
  });
}

// === CHAT REQUESTS & MESSAGING HOOKS ===

export function useChatRequests() {
  return useQuery({
    queryKey: [api.exchange.list.path],
    queryFn: async () => {
      const res = await fetch(api.exchange.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch chat requests");
      return api.exchange.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateChatRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ recipientId, introMessage }: { recipientId: string; introMessage: string }) => {
      const res = await fetch(api.exchange.request.path, {
        method: api.exchange.request.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId, introMessage }),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = api.exchange.request.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to send chat request");
      }
      return api.exchange.request.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.exchange.list.path] });
    },
  });
}

export function useRespondToChatRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: 'accepted' | 'rejected' | 'ignored' }) => {
      const url = buildUrl(api.exchange.respond.path, { id });
      const res = await fetch(url, {
        method: api.exchange.respond.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to respond to request");
      return api.exchange.respond.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.exchange.list.path] });
    },
  });
}

export function useRevealIdentity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ requestId, agree }: { requestId: number; agree: boolean }) => {
      const url = buildUrl(api.exchange.reveal.path, { id: requestId });
      const res = await fetch(url, {
        method: api.exchange.reveal.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agree }),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to update identity reveal status");
      return api.exchange.reveal.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.exchange.list.path] });
    },
  });
}

export function usePrivateMessages(chatRequestId: number) {
  const { socket } = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket || !chatRequestId) return;

    const onMessageCreated = (message: any) => {
      if (message.chatRequestId === chatRequestId) {
        queryClient.invalidateQueries({ queryKey: [api.messages.list.path, chatRequestId] });
      }
    };

    socket.on("message:created", onMessageCreated);
    return () => {
      socket.off("message:created", onMessageCreated);
    };
  }, [socket, chatRequestId, queryClient]);

  return useQuery({
    queryKey: [api.messages.list.path, chatRequestId],
    queryFn: async () => {
      const url = buildUrl(api.messages.list.path, { id: chatRequestId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch messages");
      return api.messages.list.responses[200].parse(await res.json());
    },
    enabled: !!chatRequestId,
  });
}

export function useSendPrivateMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ chatRequestId, content }: { chatRequestId: number; content: string }) => {
      const url = buildUrl(api.messages.send.path, { id: chatRequestId });
      const res = await fetch(url, {
        method: api.messages.send.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to send message");
      return api.messages.send.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.messages.list.path, variables.chatRequestId] });
    },
  });
}

export function useBlockUser() {
  return useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(api.safety.block.path, {
        method: api.safety.block.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = api.safety.block.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to block user");
      }
      return api.safety.block.responses[201].parse(await res.json());
    },
  });
}

export function useRemindProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (chatRequestId: number) => {
      const res = await fetch(`/api/exchange/${chatRequestId}/remind-profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to send profile reminder");
      }
      return await res.json();
    },
    onSuccess: (_, chatRequestId) => {
      // Invalidate messages list to show the new automated message
      queryClient.invalidateQueries({ queryKey: [api.messages.list.path, chatRequestId] });
      queryClient.invalidateQueries({ queryKey: [api.exchange.list.path] });
    },
  });
}
