"use client";

import { FileText, Upload } from "lucide-react";

export default function DocumentsPage() {
    return (
        <div className="w-full space-y-6 pb-10">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    Document Review
                </h1>
                <p className="text-sm text-slate-500 dark:text-zinc-400">
                    Review and approve patient-uploaded documents
                </p>
            </div>

            {/* Empty State */}
            <div className="rounded-xl border border-dashed border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/30 p-12 text-center">
                <FileText className="h-12 w-12 mx-auto text-slate-400 dark:text-zinc-600" />
                <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-white">
                    Coming Soon
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
                    Document review functionality will be available here.
                </p>
            </div>
        </div>
    );
}
