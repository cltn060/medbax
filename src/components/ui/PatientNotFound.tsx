"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function PatientNotFound() {
    return (
        <div className="flex flex-col items-center justify-center h-full">
            <p className="text-sm text-slate-500 dark:text-zinc-400 mb-4">Patient profile not found</p>
            <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
            >
                <ArrowLeft className="h-3 w-3" />
                Go back
            </Link>
        </div>
    );
}
