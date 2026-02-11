import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { type Profile } from "@shared/schema";

export function useProfile() {
  return useQuery({
    queryKey: [api.profiles.me.path],
    queryFn: async () => {
      const res = await fetch(api.profiles.me.path, { credentials: "include" });
      if (res.status === 401) return null;
      if (!res.ok) throw new Error("Failed to fetch profile");
      return api.profiles.me.responses[200].parse(await res.json());
    },
    retry: false,
  });
}

export function useCreateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { role: string; companyName: string; linkedinUrl?: string }) => {
      const res = await fetch(api.profiles.create.path, {
        method: api.profiles.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = api.profiles.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to create profile");
      }
      return api.profiles.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.profiles.me.path] });
    },
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { role: string }) => {
      const res = await fetch(api.profiles.updateRole.path, {
        method: api.profiles.updateRole.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = api.profiles.updateRole.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to update role");
      }
      return api.profiles.updateRole.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.profiles.me.path] });
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Profile>) => {
      const res = await fetch(api.profiles.me.path, {
        method: api.profiles.me.method === 'GET' ? 'PATCH' : api.profiles.me.method, // In this case path is same but method in api contract might be GET for 'me'
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to update profile");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.profiles.me.path] });
    },
  });
}


export function useDeleteAccount() {
  return useMutation({
    mutationFn: async (data: { confirmation: "DELETE" }) => {
      const res = await fetch(api.profiles.delete.path, {
        method: api.profiles.delete.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = api.profiles.delete.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to delete account");
      }
      return api.profiles.delete.responses[200].parse(await res.json());
    },
  });
}

export function useLogoutAll() {
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(api.profiles.logoutAll.path, {
        method: api.profiles.logoutAll.method,
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to logout all sessions");
      }
      return api.profiles.logoutAll.responses[200].parse(await res.json());
    },
  });
}

export function useUpdateLinkedInUrl() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (linkedinUrl: string) => {
      const res = await fetch(api.profiles.updateLinkedInUrl.path, {
        method: api.profiles.updateLinkedInUrl.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linkedinUrl }),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = api.profiles.updateLinkedInUrl.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to update LinkedIn URL");
      }
      return api.profiles.updateLinkedInUrl.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.profiles.me.path] });
    },
  });
}

export function useExchangeRequests() {
  return useQuery({
    queryKey: [api.exchange.list.path],
    queryFn: async () => {
      const res = await fetch(api.exchange.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch exchange requests");
      return api.exchange.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateExchangeRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (recipientId: string) => {
      const res = await fetch(api.exchange.request.path, {
        method: api.exchange.request.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId }),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = api.exchange.request.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to request exchange");
      }
      return api.exchange.request.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.exchange.list.path] });
    },
  });
}

export function useRespondToExchange() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: 'accepted' | 'rejected' }) => {
      const url = api.exchange.respond.path.replace(':id', String(id));
      const res = await fetch(url, {
        method: api.exchange.respond.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to respond to exchange");
      return api.exchange.respond.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.exchange.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.profiles.me.path] }); // Refresh to see new LinkedIn URLs if any
    },
  });
}
