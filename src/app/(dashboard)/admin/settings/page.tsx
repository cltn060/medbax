"use client";

import { Settings } from "lucide-react";

export default function SettingsPage() {
    return (
        <div className="w-full space-y-6 pb-10">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    Settings
                </h1>
                <p className="text-sm text-slate-500 dark:text-zinc-400">
                    Configure system settings and preferences
                </p>
            </div>

            {/* Empty State */}
            <div className="rounded-xl border border-dashed border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/30 p-12 text-center">
                <Settings className="h-12 w-12 mx-auto text-slate-400 dark:text-zinc-600" />
                <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-white">
                    Coming Soon
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
                    System settings will be configurable here.
                </p>
            </div>
        </div>
    );
}
