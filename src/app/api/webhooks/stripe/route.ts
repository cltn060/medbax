import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { fetchMutation } from "convex/nextjs";
import { api } from "../../../../../convex/_generated/api";
import Stripe from "stripe";

export async function POST(req: Request) {
    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get("Stripe-Signature") as string;
    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (error: any) {
        console.error("[WEBHOOK] Signature verification failed:", error.message);
        return new Response(`Webhook Error: ${error.message}`, { status: 400 });
    }

    console.log("[WEBHOOK] Received event:", event.type);

    try {
        const session = event.data.object as Stripe.Checkout.Session;

        if (event.type === "checkout.session.completed") {
            console.log("[WEBHOOK] Processing checkout.session.completed");

            const subscription = (await stripe.subscriptions.retrieve(
                session.subscription as string
            )) as any;

            const customerId = session.customer as string;
            const tokenIdentifier = session.metadata?.tokenIdentifier;
            const plan = subscription.items.data[0].price.id === process.env.STRIPE_PRICE_PREMIUM ? "premium" : "pro";

            console.log("[WEBHOOK] Subscription details:", {
                customerId,
                subscriptionId: subscription.id,
                tokenIdentifier,
                plan,
                priceId: subscription.items.data[0].price.id
            });

            if (!tokenIdentifier) {
                console.error("[WEBHOOK] No tokenIdentifier in session metadata!");
                return new Response("No tokenIdentifier in metadata", { status: 400 });
            }

            await fetchMutation(api.payments.fulfillCheckout, {
                tokenIdentifier,
                stripeCustomerId: customerId,
                stripeSubscriptionId: subscription.id,
                stripePriceId: subscription.items.data[0].price.id,
                stripeCurrentPeriodEnd: subscription.current_period_end * 1000,
                plan,
            });

            console.log("[WEBHOOK] Successfully fulfilled checkout");
        }

        if (event.type === "customer.subscription.updated") {
            console.log("[WEBHOOK] Processing subscription update");
            const subscription = event.data.object as any;
            const plan = subscription.items.data[0].price.id === process.env.STRIPE_PRICE_PREMIUM ? "premium" : "pro";

            await fetchMutation(api.payments.updateSubscription, {
                stripeSubscriptionId: subscription.id,
                stripePriceId: subscription.items.data[0].price.id,
                stripeCurrentPeriodEnd: subscription.current_period_end * 1000,
                status: subscription.status,
                plan,
            });

            console.log("[WEBHOOK] Successfully updated subscription");
        }

        if (event.type === "customer.subscription.deleted") {
            console.log("[WEBHOOK] Processing subscription deletion");
            const subscription = event.data.object as any;

            await fetchMutation(api.payments.cancelSubscription, {
                stripeSubscriptionId: subscription.id,
            });

            console.log("[WEBHOOK] Successfully canceled subscription");
        }

        return new Response(JSON.stringify({ received: true }), { status: 200 });
    } catch (error: any) {
        console.error("[WEBHOOK] Error processing webhook:", error);
        return new Response(`Webhook Error: ${error.message}`, { status: 500 });
    }
}
