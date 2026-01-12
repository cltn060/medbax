"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

// Query limits per tier
export const QUERY_LIMITS = {
    free: 20,
    pro: 100,
    premium: 1000,
} as const;

export type SubscriptionTier = keyof typeof QUERY_LIMITS;

/**
 * Hook to get the current user's subscription tier and query limit
 * Currently defaults to 'free' until Stripe integration is connected
 */
export function useSubscription() {
    const user = useQuery(api.users.current);

    // Determine tier from user data, default to free
    const tier: SubscriptionTier = (user?.plan as SubscriptionTier) || "free";

    return {
        tier,
        queryLimit: QUERY_LIMITS[tier],
        isLoading: user === undefined,
        isSignedIn: !!user,
    };
}

/**
 * Hook to check if user has at least a specific plan
 */
export function useHasPlan(plan: SubscriptionTier) {
    const { tier } = useSubscription();

    // Simple hierarchy check
    const levels = { free: 0, pro: 1, premium: 2 };
    const hasPlan = levels[tier] >= levels[plan];

    return {
        hasPlan,
        isLoading: false,
    };
}
