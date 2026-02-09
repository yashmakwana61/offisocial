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

