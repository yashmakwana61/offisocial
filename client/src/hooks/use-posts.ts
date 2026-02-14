import { useInfiniteQuery, useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type CreatePostInput, type CreateCommentInput } from "@shared/schema";

export function usePosts(category?: string, enabled = true, searchQuery?: string) {
  return useInfiniteQuery({
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
}

export function usePublicPosts(category?: string, enabled = true, searchQuery?: string) {
  return useInfiniteQuery({
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
}

export function usePost(id: number) {
  return useQuery({
    queryKey: [api.posts.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.posts.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch post");
      return api.posts.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function usePublicPost(id: number) {
  return useQuery({
    queryKey: [api.posts.publicGet.path, id],
    queryFn: async () => {
      const url = buildUrl(api.posts.publicGet.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch public post");
      return api.posts.publicGet.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreatePostInput & { attachments?: any[] }) => {
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
      queryClient.invalidateQueries({ queryKey: [api.posts.list.path] });
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
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: [api.posts.list.path] });
      await queryClient.cancelQueries({ queryKey: [api.posts.publicList.path] });
      if (variables.targetType === 'post') {
        await queryClient.cancelQueries({ queryKey: [api.posts.get.path, variables.targetId] });
      }

      // Snapshot the previous values for all matching queries
      console.log(`[DEBUG] Mutation started for ${variables.targetType}:${variables.targetId}, type=${variables.type}`);
      const previousQueries = queryClient.getQueriesData({ queryKey: [api.posts.list.path] });
      const previousPublicQueries = queryClient.getQueriesData({ queryKey: [api.posts.publicList.path] });
      console.log(`[DEBUG] Found ${previousQueries.length} member queries and ${previousPublicQueries.length} public queries in cache`);
      const previousPostDetail = variables.targetType === 'post'
        ? queryClient.getQueryData([api.posts.get.path, variables.targetId])
        : null;

      // Helper function to optimistic update a post object
      const updatePost = (post: any) => {
        if (!post) return post;
        if (post.id !== variables.targetId) {
          // console.log(`[DEBUG] ID mismatch: post.id=${post.id} (${typeof post.id}) != targetId=${variables.targetId} (${typeof variables.targetId})`);
          return post;
        }
        console.log(`[DEBUG] Found target post! Current supportCount=${post.reactionCounts?.support}`);

        const newReactionCounts = {
          support: post.reactionCounts?.support ?? 0,
          helpful: post.reactionCounts?.helpful ?? 0,
          ...post.reactionCounts
        };
        let newUserReaction = post.userReaction;

        if (post.userReaction === variables.type) {
          // Toggle off
          newReactionCounts[variables.type] = Math.max(0, (newReactionCounts[variables.type] || 0) - 1);
          newUserReaction = null;
        } else {
          // Change type or add new
          if (post.userReaction) {
            newReactionCounts[post.userReaction] = Math.max(0, (newReactionCounts[post.userReaction] || 0) - 1);
          }
          newReactionCounts[variables.type] = (newReactionCounts[variables.type] || 0) + 1;
          newUserReaction = variables.type;
        }

        return {
          ...post,
          reactionCounts: newReactionCounts,
          userReaction: newUserReaction,
        };
      };

      // Optimistically update Infinite Queries
      const updateInfiniteData = (oldData: any) => {
        if (!oldData || !oldData.pages) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map((page: any[]) => page.map(updatePost)),
        };
      };

      queryClient.setQueriesData({ queryKey: [api.posts.list.path] }, updateInfiniteData);
      queryClient.setQueriesData({ queryKey: [api.posts.publicList.path] }, updateInfiniteData);

      // Optimistically update Single Post Query
      if (variables.targetType === 'post') {
        queryClient.setQueryData([api.posts.get.path, variables.targetId], (old: any) => {
          if (!old) return old;
          return updatePost(old);
        });
      }

      return { previousQueries, previousPublicQueries, previousPostDetail };
    },
    onError: (err, variables, context: any) => {
      // Rollback on error
      if (context) {
        context.previousQueries?.forEach(([queryKey, oldData]: [any, any]) => {
          queryClient.setQueryData(queryKey, oldData);
        });
        context.previousPublicQueries?.forEach(([queryKey, oldData]: [any, any]) => {
          queryClient.setQueryData(queryKey, oldData);
        });
        if (variables.targetType === 'post') {
          queryClient.setQueryData([api.posts.get.path, variables.targetId], context.previousPostDetail);
        }
      }
    },
    onSettled: (data, error, variables) => {
      // Refresh to ensure server sync
      queryClient.invalidateQueries({ queryKey: [api.posts.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.posts.publicList.path] });
      if (variables.targetType === 'post') {
        queryClient.invalidateQueries({ queryKey: [api.posts.get.path, variables.targetId] });
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
  return useQuery({
    queryKey: [api.messages.list.path, chatRequestId],
    queryFn: async () => {
      const url = buildUrl(api.messages.list.path, { id: chatRequestId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch messages");
      return api.messages.list.responses[200].parse(await res.json());
    },
    enabled: !!chatRequestId,
    refetchInterval: 5000, // Poll for new messages every 5s
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
