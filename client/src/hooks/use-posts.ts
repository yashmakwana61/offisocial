import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type CreatePostInput, type CreateCommentInput } from "@shared/schema";

export function usePosts(category?: string, enabled = true) {
  return useQuery({
    queryKey: [api.posts.list.path, category],
    queryFn: async () => {
      const url = category
        ? `${api.posts.list.path}?category=${encodeURIComponent(category)}`
        : api.posts.list.path;

      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch posts");
      return api.posts.list.responses[200].parse(await res.json());
    },
    enabled,
  });
}

export function usePublicPosts(category?: string, enabled = true) {
  return useQuery({
    queryKey: [api.posts.publicList.path, category],
    queryFn: async () => {
      const url = category
        ? `${api.posts.publicList.path}?category=${encodeURIComponent(category)}`
        : api.posts.publicList.path;

      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch public posts");
      return api.posts.publicList.responses[200].parse(await res.json());
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
    mutationFn: async (data: CreatePostInput) => {
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
    mutationFn: async ({ postId, content }: { postId: number; content: string }) => {
      const url = buildUrl(api.comments.create.path, { id: postId });
      // Construct CreateCommentInput explicitly (omitting auto-generated fields)
      const payload: CreateCommentInput = { content };

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

      if (!res.ok) throw new Error("Failed to toggle reaction");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.posts.list.path] });
      if (variables.targetType === 'post') {
        queryClient.invalidateQueries({ queryKey: [api.posts.get.path, variables.targetId] });
      } else {
        // Ideally we'd know the post ID for comment invalidation, but this is okay for now
        // React Query's exact: false matching could help if structured hierarchically
        queryClient.invalidateQueries({ queryKey: [api.posts.get.path] });
      }
    },
  });
}
