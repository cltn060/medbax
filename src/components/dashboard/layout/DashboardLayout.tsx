"use client";

import { ReactNode, useEffect } from "react";
import { useQuery } from "convex/react";
import { useRouter, usePathname } from "next/navigation";
import { api } from "../../../../convex/_generated/api";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { ContentSkeleton } from "@/components/ui/skeleton";
import { SidebarProvider } from "./SidebarContext";

interface DashboardLayoutProps {
    children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
    const router = useRouter();
    const pathname = usePathname();
    const currentUser = useQuery(api.users.current);

    // Redirect to onboarding if not complete
    useEffect(() => {
        if (currentUser && !currentUser.onboardingComplete) {
            router.push("/onboarding");
        }
    }, [currentUser, router]);

    // If user hasn't completed onboarding, show nothing (will redirect)
    if (currentUser && !currentUser.onboardingComplete) {
        return null;
    }

    // Content to show - either skeleton or children
    const content = children;
    const isChatWelcome = pathname === "/dashboard/chat";

    return (
        <SidebarProvider>
            <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/40 dark:from-black dark:via-zinc-900 dark:to-indigo-950">
                <Sidebar />
                <div className="flex flex-1 flex-col overflow-hidden relative">
                    {/* Decorative elements - visible in both modes */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute -top-1/4 -right-1/4 w-[80%] h-[80%] rounded-full border border-indigo-200/30 dark:border-white/5"></div>
                        <div className="absolute -bottom-1/4 -left-1/4 w-[60%] h-[60%] rounded-full border border-blue-100/40 dark:border-white/[0.03]"></div>
                        <div className="absolute top-1/4 right-1/4 w-32 h-32 bg-indigo-500/20 rounded-full blur-[80px]"></div>
                        <div className="absolute bottom-1/3 left-1/3 w-24 h-24 bg-indigo-400/15 rounded-full blur-[60px]"></div>
                        <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-[120px]"></div>
                    </div>

                    <Header />
                    <main className={`flex-1 overflow-hidden relative z-10 ${pathname?.startsWith('/dashboard/chat') ? '' : 'p-6 overflow-y-auto'}`}>
                        {content}
                    </main>
                </div>
            </div>
        </SidebarProvider>
    );
}

