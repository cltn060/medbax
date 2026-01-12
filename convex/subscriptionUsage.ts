import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Query limits per tier
const QUERY_LIMITS = {
    free: 20,
    pro: 100,
    premium: 1000,
} as const;

type SubscriptionTier = keyof typeof QUERY_LIMITS;

/**
 * Calculate billing period based on a start date
 * Returns current period start/end timestamps
 */
function getBillingPeriod(subscriptionStartDate: number): { start: number; end: number } {
    const startDate = new Date(subscriptionStartDate);
    const now = new Date();

    // Calculate months elapsed since subscription start
    const monthsElapsed =
        (now.getFullYear() - startDate.getFullYear()) * 12 +
        (now.getMonth() - startDate.getMonth());

    // Current period starts on the subscription day of the current billing month
    const periodStart = new Date(startDate);
    periodStart.setMonth(startDate.getMonth() + monthsElapsed);

    // If we haven't reached the billing day this month yet, go back one month
    if (now.getDate() < startDate.getDate()) {
        periodStart.setMonth(periodStart.getMonth() - 1);
    }

    // Period end is one month after start
    const periodEnd = new Date(periodStart);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    return {
        start: periodStart.getTime(),
        end: periodEnd.getTime(),
    };
}

/**
 * Get current usage for the authenticated user
 */
export const getCurrentUsage = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .first();

        if (!user) return null;

        // Use user creation time as subscription start (simplified)
        const subscriptionStart = user._creationTime;
        const { start: periodStart, end: periodEnd } = getBillingPeriod(subscriptionStart);

        const usage = await ctx.db
            .query("subscriptionUsage")
            .withIndex("by_user_period", (q) =>
                q.eq("userId", user._id).eq("periodStart", periodStart)
            )
            .first();

        return {
            queryCount: usage?.queryCount ?? 0,
            periodStart,
            periodEnd,
        };
    },
});

/**
 * Check if user can send a query (hasn't hit limit)
 */
export const canSendQuery = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return { allowed: false, reason: "Not authenticated" };

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .first();

        if (!user) return { allowed: false, reason: "User not found" };

        const subscriptionStart = user._creationTime;
        const { start: periodStart } = getBillingPeriod(subscriptionStart);

        const usage = await ctx.db
            .query("subscriptionUsage")
            .withIndex("by_user_period", (q) =>
                q.eq("userId", user._id).eq("periodStart", periodStart)
            )
            .first();

        const queryCount = usage?.queryCount ?? 0;

        // Use plan from user record, default to 'free'
        const plan = (user.plan as SubscriptionTier) || "free";
        const limit = QUERY_LIMITS[plan] || QUERY_LIMITS.free;

        if (queryCount >= limit) {
            return {
                allowed: false,
                reason: "Monthly query limit reached",
                current: queryCount,
                limit,
                plan,
            };
        }

        return {
            allowed: true,
            current: queryCount,
            limit,
            remaining: limit - queryCount,
            plan,
        };
    },
});

/**
 * Increment query count after successful message send
 */
export const incrementQueryCount = mutation({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .first();

        if (!user) throw new Error("User not found");

        const subscriptionStart = user._creationTime;
        const { start: periodStart, end: periodEnd } = getBillingPeriod(subscriptionStart);

        const existingUsage = await ctx.db
            .query("subscriptionUsage")
            .withIndex("by_user_period", (q) =>
                q.eq("userId", user._id).eq("periodStart", periodStart)
            )
            .first();

        if (existingUsage) {
            await ctx.db.patch(existingUsage._id, {
                queryCount: existingUsage.queryCount + 1,
            });
            return existingUsage.queryCount + 1;
        } else {
            await ctx.db.insert("subscriptionUsage", {
                userId: user._id,
                periodStart,
                periodEnd,
                queryCount: 1,
            });
            return 1;
        }
    },
});

/**
 * Reset query count (called when user upgrades)
 */
export const resetQueryCount = mutation({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .first();

        if (!user) throw new Error("User not found");

        const subscriptionStart = user._creationTime;
        const { start: periodStart } = getBillingPeriod(subscriptionStart);

        const existingUsage = await ctx.db
            .query("subscriptionUsage")
            .withIndex("by_user_period", (q) =>
                q.eq("userId", user._id).eq("periodStart", periodStart)
            )
            .first();

        if (existingUsage) {
            await ctx.db.patch(existingUsage._id, { queryCount: 0 });
        }

        return { success: true };
    },
});
