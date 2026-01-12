"use client";

import { useState } from "react";
import { Check, Zap } from "lucide-react";
import { ScrollReveal } from "./scroll-reveal";
import { SignInButton, useUser } from "@clerk/nextjs";
import Link from "next/link";

type BillingPeriod = "monthly" | "annually";

interface PricingPlan {
    name: string;
    slug: string;
    description: string;
    price: { monthly: number; annually: number };
    queryLimit: number;
    popular?: boolean;
    cta: string;
}

const plans: PricingPlan[] = [
    {
        name: "Free",
        slug: "free",
        description: "Explore your health companion",
        price: { monthly: 0, annually: 0 },
        queryLimit: 20,
        cta: "Get Started",
    },
    {
        name: "Pro",
        slug: "pro",
        description: "For regular health queries",
        price: { monthly: 9.99, annually: 99 },
        queryLimit: 100,
        popular: true,
        cta: "Start Pro",
    },
    {
        name: "Premium",
        slug: "premium",
        description: "For comprehensive health management",
        price: { monthly: 29.99, annually: 299 },
        queryLimit: 1000,
        cta: "Go Premium",
    },
];

import { useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";

export function PricingSection() {
    const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("monthly");
    const { isSignedIn } = useUser();
    const createCheckoutSession = useAction(api.stripe.createCheckoutSession);

    const handleCheckout = async (slug: string) => {
        if (slug === "free") return;
        try {
            const url = await createCheckoutSession({ plan: slug as "pro" | "premium" });
            if (url) window.location.href = url;
        } catch (error) {
            console.error("Error creating checkout session:", error);
        }
    };

    return (
        <section className="w-full py-24 px-4 md:px-16 relative">
            <div className="max-w-6xl mx-auto">
                <ScrollReveal>
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl text-slate-900 dark:text-white font-medium mb-4 tracking-tight">
                            Simple pricing
                        </h2>
                        <p className="text-lg text-slate-600 dark:text-zinc-400 max-w-xl mx-auto">
                            Pay only for what you use. Get personalized health insights with every query.
                        </p>

                        {/* Billing Toggle */}
                        <div className="flex items-center justify-center gap-4 mt-8">
                            <button
                                onClick={() => setBillingPeriod("monthly")}
                                className={`text-sm font-medium transition-colors ${billingPeriod === "monthly"
                                    ? "text-slate-900 dark:text-white"
                                    : "text-slate-400 dark:text-zinc-500"
                                    }`}
                            >
                                Monthly
                            </button>
                            <div
                                className="relative w-14 h-7 bg-slate-200 dark:bg-zinc-800 rounded-full cursor-pointer"
                                onClick={() => setBillingPeriod(billingPeriod === "monthly" ? "annually" : "monthly")}
                            >
                                <div
                                    className={`absolute top-1 w-5 h-5 bg-indigo-600 rounded-full transition-all duration-300 ${billingPeriod === "annually" ? "left-8" : "left-1"
                                        }`}
                                />
                            </div>
                            <button
                                onClick={() => setBillingPeriod("annually")}
                                className={`text-sm font-medium transition-colors flex items-center gap-2 ${billingPeriod === "annually"
                                    ? "text-slate-900 dark:text-white"
                                    : "text-slate-400 dark:text-zinc-500"
                                    }`}
                            >
                                Annually
                                <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">
                                    Save 17%
                                </span>
                            </button>
                        </div>
                    </div>
                </ScrollReveal>

                {/* Pricing Cards - Three Columns */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {plans.map((plan, index) => (
                        <ScrollReveal key={plan.slug} delay={index * 100}>
                            <div
                                className={`relative rounded-2xl p-8 h-full flex flex-col ${plan.popular
                                    ? "bg-gradient-to-b from-indigo-700 to-indigo-800 text-white ring-4 ring-indigo-700/20 shadow-xl"
                                    : "bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800"
                                    }`}
                            >
                                {plan.popular && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                        <span className="bg-white text-indigo-600 text-xs font-bold px-3 py-1 rounded-full shadow">
                                            Most Popular
                                        </span>
                                    </div>
                                )}

                                <h3 className={`text-xl font-semibold mb-1 ${plan.popular ? "text-white" : "text-slate-900 dark:text-white"
                                    }`}>
                                    {plan.name}
                                </h3>
                                <p className={`text-sm mb-6 ${plan.popular ? "text-indigo-200" : "text-slate-500 dark:text-zinc-400"
                                    }`}>
                                    {plan.description}
                                </p>

                                {/* Price */}
                                <div className="mb-6">
                                    <div className="flex items-baseline gap-1">
                                        <span className={`text-4xl font-bold ${plan.popular ? "text-white" : "text-slate-900 dark:text-white"
                                            }`}>
                                            ${billingPeriod === "monthly"
                                                ? plan.price.monthly
                                                : Math.round(plan.price.annually / 12 * 100) / 100}
                                        </span>
                                        <span className={`text-sm ${plan.popular ? "text-indigo-200" : "text-slate-500 dark:text-zinc-400"
                                            }`}>
                                            /month
                                        </span>
                                    </div>
                                    {billingPeriod === "annually" && plan.price.annually > 0 && (
                                        <p className={`text-xs mt-1 ${plan.popular ? "text-indigo-200" : "text-slate-400 dark:text-zinc-500"
                                            }`}>
                                            ${plan.price.annually} billed annually
                                        </p>
                                    )}
                                </div>

                                {/* Query Limit Highlight */}
                                <div className={`flex items-center gap-3 p-4 rounded-xl mb-6 ${plan.popular
                                    ? "bg-white/10"
                                    : "bg-indigo-50 dark:bg-indigo-900/20"
                                    }`}>
                                    <Zap className={`w-5 h-5 ${plan.popular ? "text-white" : "text-indigo-600 dark:text-indigo-400"
                                        }`} />
                                    <div>
                                        <p className={`font-semibold ${plan.popular ? "text-white" : "text-slate-900 dark:text-white"
                                            }`}>
                                            {plan.queryLimit.toLocaleString()} queries/month
                                        </p>
                                        <p className={`text-xs ${plan.popular ? "text-indigo-200" : "text-slate-500 dark:text-zinc-400"
                                            }`}>
                                            AI chat messages
                                        </p>
                                    </div>
                                </div>

                                {/* Features */}
                                <ul className="space-y-3 mb-8 flex-grow">
                                    {[
                                        "Personalized RAG responses",
                                        "Unlimited medical records",
                                        "All body system knowledge bases",
                                        "Source citations included",
                                    ].map((feature, i) => (
                                        <li key={i} className="flex items-center gap-2">
                                            <Check className={`w-4 h-4 ${plan.popular ? "text-white" : "text-indigo-600 dark:text-indigo-400"
                                                }`} />
                                            <span className={`text-sm ${plan.popular ? "text-white" : "text-slate-700 dark:text-zinc-300"
                                                }`}>
                                                {feature}
                                            </span>
                                        </li>
                                    ))}
                                </ul>

                                {/* CTA */}
                                {isSignedIn ? (
                                    <button
                                        onClick={async () => {
                                            if (plan.slug === "free") return;
                                            try {
                                                // Assuming we have a useAction or similar available. 
                                                // Since this is a client component, we need to pass the action or import it.
                                                // But we can't easily import `api` inside the map if not at top level.
                                                // We will handle the click in a wrapper or just use the hook at top level.
                                                await handleCheckout(plan.slug);
                                            } catch (error) {
                                                console.error("Checkout failed:", error);
                                            }
                                        }}
                                        className={`w-full py-3 px-6 rounded-xl font-semibold transition-all ${plan.popular
                                            ? "bg-white text-indigo-600 hover:bg-indigo-50"
                                            : "bg-slate-900 dark:bg-white text-white dark:text-black hover:bg-slate-800 dark:hover:bg-zinc-200"
                                            }`}
                                    >
                                        {plan.slug === "free" ? "Current Plan" : "Upgrade"}
                                    </button>
                                ) : (
                                    <SignInButton mode="modal" forceRedirectUrl={`/onboarding?plan=${plan.slug}`}>
                                        <button className={`w-full py-3 px-6 rounded-xl font-semibold transition-all ${plan.popular
                                            ? "bg-white text-indigo-600 hover:bg-indigo-50"
                                            : "bg-slate-900 dark:bg-white text-white dark:text-black hover:bg-slate-800 dark:hover:bg-zinc-200"
                                            }`}>
                                            {plan.cta}
                                        </button>
                                    </SignInButton>
                                )}
                            </div>
                        </ScrollReveal>
                    ))}
                </div>
            </div>
        </section>
    );
}
