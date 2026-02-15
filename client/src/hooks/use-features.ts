import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";

// === WEEKLY CHECK-INS ===

// Map UI mood to API moodScore
const MOOD_SCORE_MAP: Record<string, number> = {
    "great": 5,
    "meh": 3,
    "bad": 2,
    "toxic": 1,
};

export function useWeeklyCheckin() {
    return useQuery({
        queryKey: [api.weeklyCheckins.getMine.path],
        queryFn: async () => {
            const res = await fetch(api.weeklyCheckins.getMine.path, { credentials: "include" });
            if (!res.ok) throw new Error("Failed to fetch check-in");
            return res.json();
        },
    });
}

export function useSubmitCheckin() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (mood: string) => {
            const moodScore = MOOD_SCORE_MAP[mood] || 3;
            const res = await fetch(api.weeklyCheckins.create.path, {
                method: api.weeklyCheckins.create.method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ moodScore }),
                credentials: "include",
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || "Failed to submit check-in");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [api.weeklyCheckins.getMine.path] });
        },
    });
}

// === LINKEDIN EXCHANGE ===

export function useRequestExchange() {
    return useMutation({
        mutationFn: async (recipientId: string) => {
            const res = await fetch(api.exchange.request.path, {
                method: api.exchange.request.method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ recipientId }),
                credentials: "include",
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || "Failed to request exchange");
            }
            return res.json();
        },
    });
}

export function useRespondToExchange() {
    return useMutation({
        mutationFn: async ({ exchangeId, status }: { exchangeId: number; status: 'accepted' | 'rejected' }) => {
            const url = api.exchange.respond.path.replace(':id', String(exchangeId));
            const res = await fetch(url, {
                method: api.exchange.respond.method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
                credentials: "include",
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || "Failed to respond to exchange");
            }
            return res.json();
        },
    });
}

// === REPORTS ===

export function useCreateReport() {
    return useMutation({
        mutationFn: async (data: { targetType: 'post' | 'comment'; targetId: number; reason: string }) => {
            const res = await fetch(api.reports.create.path, {
                method: api.reports.create.method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
                credentials: "include",
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || "Failed to create report");
            }
            return res.json();
        },
    });
}

// === AGGREGATED DATA ===

export function useAggregatedCheckins() {
    return useQuery({
        queryKey: [api.weeklyCheckins.getAggregated.path],
        queryFn: async () => {
            const res = await fetch(api.weeklyCheckins.getAggregated.path, { credentials: "include" });
            if (!res.ok) throw new Error("Failed to fetch aggregated check-ins");
            return res.json();
        },
    });
}

// === SALARIES ===

export function useSalaries(companyId?: number, role?: string) {
    const queryKey = [api.salaries.list.path, companyId, role];
    return useQuery({
        queryKey,
        queryFn: async () => {
            const params = new URLSearchParams();
            if (companyId) params.append("companyId", String(companyId));
            if (role) params.append("role", role);

            const url = `${api.salaries.list.path}${params.toString() ? `?${params.toString()}` : ""}`;
            const res = await fetch(url, { credentials: "include" });
            if (!res.ok) throw new Error("Failed to fetch salaries");
            return res.json();
        },
    });
}

export function useSubmitSalary() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: any) => {
            const res = await fetch(api.salaries.create.path, {
                method: api.salaries.create.method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
                credentials: "include",
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || "Failed to submit salary");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [api.salaries.list.path] });
        },
    });
}

// === INTERVIEWS ===

export function useInterviews(companyId?: number, role?: string) {
    const queryKey = [api.interviews.list.path, companyId, role];
    return useQuery({
        queryKey,
        queryFn: async () => {
            const params = new URLSearchParams();
            if (companyId) params.append("companyId", String(companyId));
            if (role) params.append("role", role);

            const url = `${api.interviews.list.path}${params.toString() ? `?${params.toString()}` : ""}`;
            const res = await fetch(url, { credentials: "include" });
            if (!res.ok) throw new Error("Failed to fetch interviews");
            return res.json();
        },
    });
}

export function useSubmitInterview() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: any) => {
            const res = await fetch(api.interviews.create.path, {
                method: api.interviews.create.method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
                credentials: "include",
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || "Failed to submit interview");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [api.interviews.list.path] });
        },
    });
}

// === ADMIN ===

export function useAdminStats() {
    return useQuery({
        queryKey: [api.admin.stats.get.path],
        queryFn: async () => {
            const res = await fetch(api.admin.stats.get.path, { credentials: "include" });
            if (!res.ok) throw new Error("Failed to fetch admin stats");
            return res.json();
        },
    });
}

export function useAdminReports() {
    return useQuery({
        queryKey: [api.admin.reports.list.path],
        queryFn: async () => {
            const res = await fetch(api.admin.reports.list.path, { credentials: "include" });
            if (!res.ok) throw new Error("Failed to fetch reports");
            return res.json();
        },
    });
}

export function useResolveReport() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, resolution }: { id: number; resolution: 'dismissed' | 'resolved' }) => {
            const url = api.admin.reports.resolve.path.replace(":id", String(id));
            const res = await fetch(url, {
                method: api.admin.reports.resolve.method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ resolution }),
                credentials: "include",
            });
            if (!res.ok) throw new Error("Failed to resolve report");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [api.admin.reports.list.path] });
            queryClient.invalidateQueries({ queryKey: [api.admin.stats.get.path] });
        },
    });
}

// === SETTINGS ===

export function useSettings() {
    return useQuery({
        queryKey: [api.settings.get.path],
        queryFn: async () => {
            const res = await fetch(api.settings.get.path, { credentials: "include" });
            if (!res.ok) throw new Error("Failed to fetch settings");
            return res.json();
        },
    });
}

export function useUpdateSettings() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (settings: any) => {
            const res = await fetch(api.settings.update.path, {
                method: api.settings.update.method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(settings),
                credentials: "include",
            });
            if (!res.ok) throw new Error("Failed to update settings");
            return res.json();
        },
        onSuccess: (newSettings) => {
            queryClient.setQueryData([api.settings.get.path], newSettings);
        },
    });
}

