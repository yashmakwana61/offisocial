import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { type Profile } from "@shared/schema";

export function useProfile() {
  return useQuery({
    queryKey: [api.profiles.me.path],
    queryFn: async () => {
      const res = await fetch(api.profiles.me.path, { credentials: "include" });
      if (res.status === 401) throw new Error("Unauthorized");
      if (!res.ok) throw new Error("Failed to fetch profile");
      // The API returns nullable profile, so we handle null in component logic
      return api.profiles.me.responses[200].parse(await res.json());
    },
    retry: false,
  });
}

export function useCreateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { role: string; companyName: string }) => {
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
    mutationFn: async (data: { isExitMode: boolean }) => {
      const res = await fetch(api.profiles.me.path, {
        method: 'PATCH',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to update exit mode");
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

export function useVerificationStatus() {
  return useQuery({
    queryKey: ["/api/verification/status"],
    queryFn: async () => {
      const res = await fetch("/api/verification/status", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch verification status");
      return res.json() as Promise<{ status: string; step: string; reason?: string }>;
    },
    refetchInterval: (query) => {
      // Poll if verification is in progress
      const data = query.state.data;
      return (data?.step === "url_submitted" || data?.step === "extraction_pending") ? 2000 : false;
    }
  });
}

export function useSubmitLinkedInUrl() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (url: string) => {
      const res = await fetch("/api/verification/submit-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to submit LinkedIn URL");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/verification/status"] });
      queryClient.invalidateQueries({ queryKey: [api.profiles.me.path] });
    },
  });
}
