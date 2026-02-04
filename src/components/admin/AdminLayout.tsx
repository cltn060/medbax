"use client";

import { useState } from "react";
import { ReactNode } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import AdminGate from "@/components/auth/admin-gate";
import { Menu, Shield } from "lucide-react";

interface AdminLayoutProps {
    children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <AdminGate>
            <div className="flex h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-indigo-50/30 dark:from-black dark:via-zinc-900 dark:to-zinc-950">
                {/* Desktop Sidebar - always visible */}
                <div className="hidden md:block">
                    <AdminSidebar />
                </div>

                {/* Mobile Sidebar - drawer behavior */}
                <AdminSidebar
                    isOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)}
                />

                <div className="flex flex-1 flex-col overflow-hidden relative">
                    {/* Decorative elements */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute -top-1/4 -right-1/4 w-[80%] h-[80%] rounded-full border border-indigo-200/20 dark:border-white/5"></div>
                        <div className="absolute -bottom-1/4 -left-1/4 w-[60%] h-[60%] rounded-full border border-slate-200/30 dark:border-white/[0.03]"></div>
                        <div className="absolute top-1/4 right-1/4 w-32 h-32 bg-indigo-400/10 dark:bg-indigo-500/5 rounded-full blur-[80px]"></div>
                    </div>

                    {/* Header */}
                    <header className="h-14 flex items-center justify-between px-4 md:px-6 border-b border-slate-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm relative z-10">
                        {/* Mobile: Hamburger + Title */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setIsSidebarOpen(true)}
                                className="md:hidden p-2 -ml-2 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                                aria-label="Open menu"
                            >
                                <Menu className="h-5 w-5" />
                            </button>
                            {/* Mobile title */}
                            <div className="md:hidden flex items-center gap-2">
                                <div className="p-1 rounded-md bg-indigo-600">
                                    <Shield className="h-3 w-3 text-white" />
                                </div>
                                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                                    Admin
                                </span>
                            </div>
                            {/* Desktop title */}
                            <div className="hidden md:block text-sm font-medium text-slate-600 dark:text-zinc-400">
                                Administration
                            </div>
                        </div>
                    </header>

                    {/* Main Content */}
                    <main className="flex-1 overflow-y-auto p-4 md:p-6 relative z-10">
                        {children}
                    </main>
                </div>
            </div>
        </AdminGate>
    );
}

