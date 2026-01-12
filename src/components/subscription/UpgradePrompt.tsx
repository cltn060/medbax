"use client";

import { Zap, ArrowRight } from "lucide-react";
import Link from "next/link";

interface UpgradePromptProps {
    className?: string;
}

export function UpgradePrompt({ className = "" }: UpgradePromptProps) {
    return (
        <div className={`rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-900/20 p-6 ${className}`}>
            <div className="flex items-start gap-4">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg shrink-0">
                    <Zap className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1">
                    <h3 className="font-semibold text-amber-900 dark:text-amber-200 mb-1">
                        Query limit reached
                    </h3>
                    <p className="text-sm text-amber-700 dark:text-amber-300/80 mb-4">
                        You've used all your monthly queries. Upgrade for more.
                    </p>
                    <Link href="/pricing">
                        <button className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
                            Upgrade Plan
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
}

interface UsageBadgeProps {
    current: number;
    limit: number;
}

export function UsageBadge({ current, limit }: UsageBadgeProps) {
    const percentage = (current / limit) * 100;
    const isNearLimit = percentage >= 80;
    const isAtLimit = percentage >= 100;

    return (
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${isAtLimit
                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                : isNearLimit
                    ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                    : "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400"
            }`}>
            {current}/{limit} queries
        </span>
    );
}
