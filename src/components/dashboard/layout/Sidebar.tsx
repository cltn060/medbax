"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { User, MessageSquare, Settings, ChevronLeft, ChevronRight, ChevronDown, Plus, Search, X, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "../../../../convex/_generated/api";
import { MedBaxLogo } from "../../Logo";
import { DeleteConfirmDialog } from "../../ui/DeleteConfirmDialog";
import { Id } from "../../../../convex/_generated/dataModel";

export function Sidebar() {
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isExpanded, setIsExpanded] = useState(false);
    const [chatToDelete, setChatToDelete] = useState<{ id: Id<"chats">; title: string } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const sidebarRef = useRef<HTMLDivElement>(null);

    // Collapse expanded list when clicking outside sidebar
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
                setIsExpanded(false);
            }
        }

        if (isExpanded) {
            document.addEventListener("mousedown", handleClickOutside);
            return () => document.removeEventListener("mousedown", handleClickOutside);
        }
    }, [isExpanded]);

    // Fetch patient and chats
    const patient = useQuery(api.patients.getMyPatient);
    const chats = useQuery(
        api.chats.listChats,
        patient?._id ? { patientId: patient._id } : "skip"
    );
    const deleteChat = useMutation(api.chats.deleteChat);

    // Filter chats based on search
    const filteredChats = useMemo(() => {
        if (!chats) return [];
        if (!searchQuery.trim()) return chats;
        return chats.filter(chat =>
            chat.title.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [chats, searchQuery]);

    // Show 10 by default, all when expanded or searching
    const displayChats = searchQuery.trim()
        ? filteredChats
        : isExpanded
            ? filteredChats
            : filteredChats.slice(0, 10);

    const isChatActive = pathname.startsWith("/dashboard/chat") || pathname === "/dashboard";
    const isProfile = pathname.startsWith("/dashboard/profile");
    const isSettings = pathname.startsWith("/dashboard/settings");

    // Check if current chat is active
    const getCurrentChatId = () => {
        const match = pathname.match(/\/dashboard\/chat\/(.+)/);
        return match ? match[1] : null;
    };
    const currentChatId = getCurrentChatId();

    return (
        <div
            ref={sidebarRef}
            className={cn(
                "flex h-full flex-col bg-white dark:bg-zinc-950 border-r border-slate-300 dark:border-zinc-800 transition-all duration-300 relative",
                isCollapsed ? "w-[70px]" : "w-[70px] md:w-60"
            )}
        >
            {/* Toggle Button (Desktop Only) */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="hidden md:flex absolute -right-3 top-7 -translate-y-1/2 h-6 w-6 items-center justify-center rounded-full border border-slate-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white shadow-sm z-50"
            >
                {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
            </button>

            {/* Logo */}
            <Link
                href="/dashboard/chat"
                className={cn(
                    "flex h-14 items-center border-b border-slate-300 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer",
                    isCollapsed ? "justify-center px-0" : "justify-center md:justify-start px-0 md:px-6"
                )}
            >
                <div className={cn("shrink-0", isCollapsed ? "mx-auto" : "md:mr-3")}>
                    <MedBaxLogo size={22} />
                </div>
                {!isCollapsed && (
                    <span className="hidden md:block text-lg font-bold tracking-tight text-slate-900 dark:text-white truncate mt-0.5">
                        MedBax
                    </span>
                )}
            </Link>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col">
                {/* New Chat Link - Primary */}
                <Link
                    href="/dashboard/chat"
                    className={cn(
                        "group flex items-center py-2.5 text-sm font-medium border-b border-slate-200 dark:border-zinc-800 transition-all duration-200",
                        isCollapsed ? "justify-center px-0" : "justify-center md:justify-start px-0 md:px-6",
                        pathname === "/dashboard/chat" || pathname === "/dashboard"
                            ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300"
                            : "bg-white dark:bg-zinc-900/50 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white"
                    )}
                    title={isCollapsed ? "New Chat" : undefined}
                >
                    <div className={cn(
                        "shrink-0 p-1 rounded-md transition-colors",
                        !isCollapsed && "md:mr-3",
                        pathname === "/dashboard/chat" || pathname === "/dashboard"
                            ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400"
                            : "bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-500 group-hover:bg-slate-200 dark:group-hover:bg-zinc-700"
                    )}>
                        <Plus className="h-4 w-4" aria-hidden="true" />
                    </div>
                    {!isCollapsed && (
                        <span className="hidden md:block truncate">New Chat</span>
                    )}
                </Link>

                {/* Search Input - Desktop Expanded Only */}
                {!isCollapsed && (
                    <div className="hidden md:block px-3 pt-3">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 dark:text-zinc-500" />
                            <input
                                type="text"
                                placeholder="Search chats..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-8 pr-8 py-1.5 text-xs bg-slate-100 dark:bg-zinc-800 border-0 rounded-lg text-slate-700 dark:text-zinc-300 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:ring-1 focus:ring-indigo-500/50 focus:outline-none"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery("")}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Chats Section */}
                {!isCollapsed && displayChats.length > 0 && (
                    <div className="hidden md:flex md:flex-col px-3 pt-3 flex-1 min-h-0 overflow-y-auto">
                        <div className="text-[10px] font-semibold text-slate-400 dark:text-zinc-600 uppercase tracking-wider px-3 mb-2">
                            {searchQuery.trim() ? `Results (${filteredChats.length})` : "Recent"}
                        </div>
                        <div className="space-y-0.5">
                            {displayChats.map((chat) => {
                                const isActive = currentChatId === chat._id;
                                return (
                                    <div
                                        key={chat._id}
                                        className={cn(
                                            "group relative flex items-center rounded-lg transition-all duration-200",
                                            isActive
                                                ? "bg-indigo-50 dark:bg-indigo-900/20"
                                                : "hover:bg-slate-50 dark:hover:bg-zinc-800"
                                        )}
                                    >
                                        <Link
                                            href={`/dashboard/chat/${chat._id}`}
                                            className={cn(
                                                "flex-1 flex items-center gap-2 px-3 py-2 text-sm min-w-0",
                                                isActive
                                                    ? "text-indigo-700 dark:text-indigo-300"
                                                    : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
                                            )}
                                            title={chat.title}
                                        >
                                            <MessageSquare className={cn(
                                                "h-3.5 w-3.5 shrink-0",
                                                isActive
                                                    ? "text-indigo-500 dark:text-indigo-400"
                                                    : "text-slate-400 dark:text-zinc-500"
                                            )} />
                                            <span className="truncate text-xs">{chat.title}</span>
                                        </Link>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setChatToDelete({ id: chat._id, title: chat.title });
                                            }}
                                            className="shrink-0 opacity-0 group-hover:opacity-100 p-1.5 mr-1 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-all"
                                            title="Delete"
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                        {/* View All / Show Less toggle when not searching */}
                        {!searchQuery.trim() && chats && chats.length > 10 && (
                            <button
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="w-full flex items-center justify-center gap-1 px-3 py-2 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors mt-1"
                            >
                                <ChevronDown className={cn(
                                    "h-3.5 w-3.5 transition-transform",
                                    isExpanded && "rotate-180"
                                )} />
                                {isExpanded ? "Show Less" : `View All (${chats.length})`}
                            </button>
                        )}
                        {/* No results message */}
                        {searchQuery.trim() && filteredChats.length === 0 && (
                            <div className="px-3 py-4 text-xs text-slate-400 dark:text-zinc-500 text-center">
                                No chats found
                            </div>
                        )}
                    </div>
                )}

                {/* Collapsed State: Show chat icons */}
                {isCollapsed && chats && chats.length > 0 && (
                    <div className="flex flex-col items-center pt-2 space-y-1">
                        {chats.slice(0, 3).map((chat) => {
                            const isActive = currentChatId === chat._id;
                            return (
                                <Link
                                    key={chat._id}
                                    href={`/dashboard/chat/${chat._id}`}
                                    className={cn(
                                        "p-2 rounded-lg transition-colors",
                                        isActive
                                            ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400"
                                            : "text-slate-400 dark:text-zinc-500 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-600 dark:hover:text-zinc-300"
                                    )}
                                    title={chat.title}
                                >
                                    <MessageSquare className="h-4 w-4" />
                                </Link>
                            );
                        })}
                    </div>
                )}


                {/* Bottom Navigation Items */}
                <div className="mt-auto">
                    {/* Patient Profile Link */}
                    <Link
                        href="/dashboard/profile"
                        className={cn(
                            "group flex items-center py-2.5 text-sm font-medium border-t border-slate-300 dark:border-zinc-700 border-b border-b-slate-200 dark:border-b-zinc-800 transition-all duration-200",
                            isCollapsed ? "justify-center px-0" : "justify-center md:justify-start px-0 md:px-6",
                            isProfile
                                ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300"
                                : "bg-white dark:bg-zinc-900/50 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white"
                        )}
                        title={isCollapsed ? "Patient Profile" : undefined}
                    >
                        <div className={cn(
                            "shrink-0 p-1 rounded-md transition-colors",
                            !isCollapsed && "md:mr-3",
                            isProfile
                                ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400"
                                : "bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-500 group-hover:bg-slate-200 dark:group-hover:bg-zinc-700"
                        )}>
                            <User className="h-4 w-4" aria-hidden="true" />
                        </div>
                        {!isCollapsed && (
                            <span className="hidden md:block truncate">Patient Profile</span>
                        )}
                    </Link>

                    {/* Settings Link */}
                    <Link
                        href="/dashboard/settings"
                        className={cn(
                            "group flex items-center py-2.5 text-sm font-medium border-b border-slate-200 dark:border-zinc-800 transition-all duration-200",
                            isCollapsed ? "justify-center px-0" : "justify-center md:justify-start px-0 md:px-6",
                            isSettings
                                ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300"
                                : "bg-white dark:bg-zinc-900/50 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white"
                        )}
                        title={isCollapsed ? "Settings" : undefined}
                    >
                        <div className={cn(
                            "shrink-0 p-1 rounded-md transition-colors",
                            !isCollapsed && "md:mr-3",
                            isSettings
                                ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400"
                                : "bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-500 group-hover:bg-slate-200 dark:group-hover:bg-zinc-700"
                        )}>
                            <Settings className="h-4 w-4" aria-hidden="true" />
                        </div>
                        {!isCollapsed && (
                            <span className="hidden md:block truncate">Settings</span>
                        )}
                    </Link>
                </div>
            </nav>

            {/* Delete Confirmation Dialog */}
            <DeleteConfirmDialog
                isOpen={!!chatToDelete}
                title="Delete Conversation"
                message={`Are you sure you want to delete "${chatToDelete?.title}"? This action cannot be undone.`}
                isDeleting={isDeleting}
                onCancel={() => setChatToDelete(null)}
                onConfirm={async () => {
                    if (!chatToDelete) return;
                    setIsDeleting(true);
                    try {
                        await deleteChat({ chatId: chatToDelete.id });
                    } finally {
                        setIsDeleting(false);
                        setChatToDelete(null);
                    }
                }}
            />
        </div>
    );
}
