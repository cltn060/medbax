"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import Stripe from "stripe";

// Initialize Stripe (using env var directly in action as standard practice or import)
// Importing from src/lib/stripe might not work in "use node" convex actions if it has client side stuff?
// Usually better to init here or use a shared helper designed for convex.
// For simplicity, defining here.

// Lazy initialize Stripe to avoid top-level side effects during Convex analysis
let stripeInstance: Stripe | null = null;
function getStripe() {
    if (!stripeInstance) {
        stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder", {
            apiVersion: "2025-12-15.clover" as any,
            typescript: true,
        });
    }
    return stripeInstance;
}

const DOMAIN = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// Price IDs (should be environment variables ideally, or constants)
// For now, hardcoding placeholders or reading from env
const PRICES = {
    pro: process.env.STRIPE_PRICE_PRO!,
    premium: process.env.STRIPE_PRICE_PREMIUM!,
};

export const createCheckoutSession = action({
    args: { plan: v.union(v.literal("pro"), v.literal("premium")) },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const priceId = PRICES[args.plan];
        if (!priceId) throw new Error("Price not configured");

        const stripe = getStripe();
        const session = await stripe.checkout.sessions.create({
            line_items: [{ price: priceId, quantity: 1 }],
            mode: "subscription",
            success_url: `${DOMAIN}/dashboard/chat?success=true`,
            cancel_url: `${DOMAIN}/dashboard/settings?canceled=true`,
            metadata: {
                userId: identity.subject, // Store Convex User ID (tokenIdentifier usually, or look up internal ID)
                // Better to use internal ID? We might need to query first.
                // But action doesn't have db access directly.
                // We'll trust tokenIdentifier or pass it.
                // Actually identity.subject is usually the tokenIdentifier.
                tokenIdentifier: identity.tokenIdentifier,
            },
        });

        return session.url;
    },
});

export const createPortalSession = action({
    args: {},
    handler: async (ctx): Promise<string> => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        // Look up the user by their token identifier to get the stripeCustomerId
        const user = await ctx.runQuery(api.users.current, {});

        if (!user || !user.stripeCustomerId) {
            throw new Error("No stripe customer found for this user");
        }

        const stripe = getStripe();
        const session: Stripe.BillingPortal.Session = await stripe.billingPortal.sessions.create({
            customer: user.stripeCustomerId,
            return_url: `${DOMAIN}/dashboard/settings`,
        });

        return session.url;
    },
});
