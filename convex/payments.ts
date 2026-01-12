import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const fulfillCheckout = mutation({
    args: {
        tokenIdentifier: v.string(),
        stripeCustomerId: v.string(),
        stripeSubscriptionId: v.string(),
        stripePriceId: v.string(),
        stripeCurrentPeriodEnd: v.number(),
        plan: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", args.tokenIdentifier))
            .first();

        if (!user) {
            console.error("User not found for fulfillment:", args.tokenIdentifier);
            return;
        }

        await ctx.db.patch(user._id, {
            stripeCustomerId: args.stripeCustomerId,
            stripeSubscriptionId: args.stripeSubscriptionId,
            stripePriceId: args.stripePriceId,
            stripeCurrentPeriodEnd: args.stripeCurrentPeriodEnd,
            plan: args.plan,
            stripeStatus: "active",
        });
    },
});

export const updateSubscription = mutation({
    args: {
        stripeSubscriptionId: v.string(),
        stripePriceId: v.string(),
        stripeCurrentPeriodEnd: v.number(),
        status: v.string(),
        plan: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_stripe_subscription_id", (q) =>
                q.eq("stripeSubscriptionId", args.stripeSubscriptionId)
            )
            .first();

        if (!user) {
            console.error("User not found for subscription update:", args.stripeSubscriptionId);
            return;
        }

        await ctx.db.patch(user._id, {
            stripePriceId: args.stripePriceId,
            stripeCurrentPeriodEnd: args.stripeCurrentPeriodEnd,
            stripeStatus: args.status,
            plan: args.plan,
        });
    },
});

export const cancelSubscription = mutation({
    args: { stripeSubscriptionId: v.string() },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_stripe_subscription_id", (q) =>
                q.eq("stripeSubscriptionId", args.stripeSubscriptionId)
            )
            .first();

        if (user) {
            await ctx.db.patch(user._id, {
                plan: "free",
                stripeStatus: "canceled",
            });
        }
    },
});
