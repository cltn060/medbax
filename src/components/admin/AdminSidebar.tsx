"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Database,
    FileText,
    Settings,
    ArrowLeft,
    Users,
    Shield,
    X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminSidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

export function AdminSidebar({ isOpen = true, onClose }: AdminSidebarProps) {
    const pathname = usePathname();

    const navItems = [
        {
            label: "Overview",
            href: "/admin",
            icon: LayoutDashboard,
            exact: true,
        },
        {
            label: "Knowledge Bases",
            href: "/admin/knowledge-base",
            icon: Database,
        },
        {
            label: "Documents",
            href: "/admin/documents",
            icon: FileText,
        },
        {
            label: "Users",
            href: "/admin/users",
            icon: Users,
        },
        {
            label: "Settings",
            href: "/admin/settings",
            icon: Settings,
        },
    ];

    const isActive = (href: string, exact?: boolean) => {
        if (exact) return pathname === href;
        return pathname.startsWith(href);
    };

    const handleNavClick = () => {
        // Close sidebar on mobile after navigation
        if (onClose) {
            onClose();
        }
    };

    const sidebarContent = (
        <div className="flex h-full w-60 flex-col bg-slate-900 dark:bg-zinc-950 border-r border-slate-800 dark:border-zinc-800">
            {/* Header */}
            <div className="flex h-14 items-center justify-between px-4 border-b border-slate-800 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-indigo-600">
                        <Shield className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-sm font-bold tracking-tight text-white">
                        Admin Panel
                    </span>
                </div>
                {/* Close button - mobile only */}
                {onClose && (
                    <button
                        onClick={onClose}
                        className="md:hidden p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
                {navItems.map((item) => {
                    const active = isActive(item.href, item.exact);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={handleNavClick}
                            className={cn(
                                "group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                                active
                                    ? "bg-indigo-600 text-white"
                                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                            )}
                        >
                            <div
                                className={cn(
                                    "mr-3 p-1.5 rounded-md transition-colors",
                                    active
                                        ? "bg-indigo-500 text-white"
                                        : "bg-slate-800 text-slate-500 group-hover:bg-slate-700 group-hover:text-slate-300"
                                )}
                            >
                                <item.icon className="h-4 w-4" />
                            </div>
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            {/* Back to Dashboard */}
            <div className="p-4 border-t border-slate-800 dark:border-zinc-800">
                <Link
                    href="/dashboard/chat"
                    onClick={handleNavClick}
                    className="flex items-center gap-3 px-4 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Dashboard
                </Link>
            </div>
        </div>
    );

    // Mobile: Render as overlay drawer
    // Desktop: Always visible, no overlay needed (handled by parent)
    if (onClose !== undefined) {
        return (
            <>
                {/* Mobile Backdrop */}
                {isOpen && (
                    <div
                        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden animate-fade-in-backdrop"
                        onClick={onClose}
                        aria-hidden="true"
                    />
                )}
                {/* Mobile Sidebar Drawer */}
                <div
                    className={cn(
                        "fixed inset-y-0 left-0 z-50 md:hidden transform transition-transform duration-300 ease-out",
                        isOpen ? "translate-x-0" : "-translate-x-full"
                    )}
                >
                    {sidebarContent}
                </div>
            </>
        );
    }

    // Desktop: Static sidebar
    return sidebarContent;
}
