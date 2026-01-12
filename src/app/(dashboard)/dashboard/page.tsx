"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Redirect /dashboard to /dashboard/chat for backwards compatibility
export default function DashboardRedirectPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace("/dashboard/chat");
    }, [router]);

    return (
        <div className="flex items-center justify-center h-full">
            <div className="animate-pulse text-slate-500 dark:text-zinc-400">
                Redirecting...
            </div>
        </div>
    );
}
