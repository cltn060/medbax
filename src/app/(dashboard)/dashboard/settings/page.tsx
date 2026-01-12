"use client";

import { useClerk, useUser } from "@clerk/nextjs";
import { useQuery, useAction } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useSubscription } from "@/hooks/useSubscription";
import { Zap, User, Settings } from "lucide-react";
import Link from "next/link";
import { PatientNotFound } from "@/components/ui/PatientNotFound";
import { ContentSkeleton } from "@/components/ui/skeleton";

export default function SettingsPage() {
    const patient = useQuery(api.patients.getMyPatient);
    const { tier, queryLimit, isLoading } = useSubscription();
    const usage = useQuery(api.subscriptionUsage.getCurrentUsage);
    const { openUserProfile } = useClerk();

    // Loading state
    if (patient === undefined) {
        return <ContentSkeleton />;
    }

    // Not logged in / no patient
    if (patient === null) {
        return <PatientNotFound />;
    }

    const tierNames = { free: "Free", pro: "Pro", premium: "Premium" };
    const tierColors = {
        free: "bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300",
        pro: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
        premium: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    };

    const queryCount = usage?.queryCount ?? 0;
    const percentage = Math.min((queryCount / queryLimit) * 100, 100);
    const isNearLimit = percentage >= 80;
    const isAtLimit = percentage >= 100;

    return (
        <div className="w-full space-y-6 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Settings</h1>
                    <p className="text-sm text-slate-500 dark:text-zinc-400">Manage your account and subscription</p>
                </div>
                {!isLoading && (
                    <span className={`px-3 py-1.5 rounded-lg text-sm font-medium ${tierColors[tier]}`}>
                        {tierNames[tier]} Plan
                    </span>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Account Settings Card */}
                <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-6 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2.5 bg-slate-100 dark:bg-zinc-800 rounded-xl">
                                <User className="w-6 h-6 text-slate-600 dark:text-zinc-400" />
                            </div>
                            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Profile & Security</h3>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-zinc-400 mb-6">
                            Manage your personal information, security settings, and connected accounts.
                        </p>
                    </div>
                    <button
                        onClick={() => openUserProfile()}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-700 text-slate-900 dark:text-white rounded-xl text-sm font-medium transition-colors"
                    >
                        <Settings className="w-4 h-4" />
                        Manage Account
                    </button>
                </div>

                {/* Subscription Card */}
                <div className="space-y-6">
                    {/* Usage Stats - Moved here */}
                </div>

                {/* Manage Subscription Button */}
                <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-6 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
                                <Zap className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Subscription</h3>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-zinc-400 mb-6">
                            Manage your billing, invoices, and plan details.
                        </p>
                    </div>
                    <ManageSubscriptionButton />
                </div>
            </div>

            {/* Separate section for usage stats if needed, or keep it inside the grid */}

        </div>
    );
}

function ManageSubscriptionButton() {
    const createPortalSession = useAction(api.stripe.createPortalSession);
    const { user } = useUser();

    // We need to fetch the user (or trust the backend to find by token)
    // The action takes stripeCustomerId, but actually the action could look it up internally 
    // if we stored it in users table. 
    // My implemented `createPortalSession` action in `convex/stripe.ts` takes `stripeCustomerId`.
    // I should update it to take nothing and look up by auth user if possible, or I need to query the user here first.
    // The `useSubscription` hook now returns a stub.
    // Let's modify the action `createPortalSession` in `stripe.ts` to be smarter or query user here.
    // Querying user here is easier if I export the query.
    // But for now, let's assume I modify the action to not require arg and look up user.
    // OR, I pass the ID if I have it. I don't have it easily available in frontend yet without a query.
    // I'll update the action `stripe.ts` to NOT require stripeCustomerId and look it up.
    // For now, I'll write the button assuming the action handles it or I'll pass a placeholder and fix the action.

    const handleManage = async () => {
        try {
            const url = await createPortalSession({});
            if (url) window.location.href = url;
        } catch (error) {
            console.error("Error creating portal session:", error);
        }
    };

    return (
        <button
            onClick={handleManage}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-700 text-slate-900 dark:text-white rounded-xl text-sm font-medium transition-colors"
        >
            <Settings className="w-4 h-4" />
            Manage Subscription
        </button>
    );
}

