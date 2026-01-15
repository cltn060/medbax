"use client";

import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { useClerk, useUser } from "@clerk/nextjs";
import { useQuery, useAction } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useSubscription } from "@/hooks/useSubscription";
import {
    User,
    Settings,
    CreditCard,
    LogOut,
    ChevronUp,
    Heart,
    Loader2,
    Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { EditProfileModal } from "../EditProfileModal";

export function UserMenuDropdown({ isCollapsed }: { isCollapsed: boolean }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isLoadingPortal, setIsLoadingPortal] = useState(false);
    const [position, setPosition] = useState({ left: 0, bottom: 0, width: 0 });
    const dropdownRef = useRef<HTMLDivElement>(null);

    const { user } = useUser();
    const { openUserProfile, signOut } = useClerk();
    const { tier } = useSubscription();
    const createPortalSession = useAction(api.stripe.createPortalSession);

    // Calculate position when opening
    useLayoutEffect(() => {
        if (isOpen && dropdownRef.current) {
            const rect = dropdownRef.current.getBoundingClientRect();
            // Calculate available space above
            const spaceAbove = rect.top;

            setPosition({
                left: isCollapsed ? rect.right + 12 : rect.left + 12, // Add 12px left padding
                bottom: window.innerHeight - rect.top + 8, // Anchor to bottom of the viewport relative to button top
                width: isCollapsed ? 280 : 320, // Slightly narrower if popping out to side
            });
        }
    }, [isOpen, isCollapsed]);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            // Check if click is inside button OR inside the portal content
            const target = event.target as HTMLElement;
            const portalContent = document.getElementById("user-menu-portal");

            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(target) &&
                portalContent &&
                !portalContent.contains(target)
            ) {
                setIsOpen(false);
            }
        }
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            return () => document.removeEventListener("mousedown", handleClickOutside);
        }
    }, [isOpen]);

    // Close dropdown on Escape
    useEffect(() => {
        function handleEscape(event: KeyboardEvent) {
            if (event.key === "Escape") {
                setIsOpen(false);
            }
        }
        if (isOpen) {
            document.addEventListener("keydown", handleEscape);
            return () => document.removeEventListener("keydown", handleEscape);
        }
    }, [isOpen]);

    const handleManageSubscription = async () => {
        setIsLoadingPortal(true);
        try {
            const url = await createPortalSession({});
            if (url) window.open(url, '_blank');
        } catch (error) {
            console.error("Error creating portal session:", error);
        } finally {
            setIsLoadingPortal(false);
        }
    };

    const handleSignOut = async () => {
        await signOut();
    };

    const tierColors = {
        free: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700",
        pro: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 border-indigo-100 dark:border-indigo-500/20",
        premium: "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400 border-purple-100 dark:border-purple-500/20",
    };

    const tierNames = { free: "Free", pro: "Pro", premium: "Premium" };

    if (!user) return null;

    return (
        <>
            <div ref={dropdownRef} className="relative mt-auto">
                {/* User Menu Trigger Button */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={cn(
                        "w-full flex items-center gap-3 py-3 border-t border-zinc-200 dark:border-zinc-800 transition-all duration-200 hover:bg-zinc-50 dark:hover:bg-zinc-900 outline-none group",
                        isCollapsed ? "justify-center px-2" : "justify-between px-4"
                    )}
                >
                    <div className={cn("flex items-center gap-3", isCollapsed && "justify-center")}>
                        {/* Avatar */}
                        <div className="relative shrink-0">
                            {user.imageUrl ? (
                                <img
                                    src={user.imageUrl}
                                    alt={user.fullName || "User"}
                                    className="h-8 w-8 rounded-full object-cover ring-1 ring-zinc-200 dark:ring-zinc-700"
                                />
                            ) : (
                                <div className="h-8 w-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center border border-zinc-200 dark:border-zinc-700">
                                    <User className="h-4 w-4 text-zinc-500" />
                                </div>
                            )}
                            {/* Online indicator */}
                            <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-950" />
                        </div>

                        {/* Name & Tier (hidden when collapsed) */}
                        {!isCollapsed && (
                            <div className="flex flex-col items-start min-w-0 text-left">
                                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate max-w-[140px]">
                                    {user.fullName || "User"}
                                </span>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[11px] text-zinc-500 dark:text-zinc-500">
                                        {user.primaryEmailAddress?.emailAddress ? user.primaryEmailAddress.emailAddress.split('@')[0] : 'User'}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Chevron */}
                    {!isCollapsed && (
                        <ChevronUp
                            className={cn(
                                "h-4 w-4 text-zinc-400 dark:text-zinc-600 transition-transform duration-200 group-hover:text-zinc-600 dark:group-hover:text-zinc-400",
                                isOpen && "rotate-180"
                            )}
                        />
                    )}
                </button>
            </div>

            {/* Dropdown Portal */}
            {isOpen && createPortal(
                <div
                    id="user-menu-portal"
                    style={{
                        position: 'fixed',
                        left: position.left,
                        bottom: position.bottom,
                        width: position.width,
                    }}
                    className="z-[9999] bg-white dark:bg-[#111113] rounded-xl shadow-xl shadow-zinc-200/20 dark:shadow-black/40 border border-zinc-200 dark:border-zinc-800 overflow-hidden animate-in slide-in-from-bottom-2 fade-in duration-200 ring-2 ring-indigo-500/20 dark:ring-indigo-400/20 ring-offset-2 ring-offset-white dark:ring-offset-zinc-950"
                >
                    {/* Header Section */}
                    <div className="p-4 bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800">
                        <div className="flex items-center justify-between mb-3">
                            <span className={cn("text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border", tierColors[tier])}>
                                {tierNames[tier]} Plan
                            </span>
                            {tier === "free" && (
                                <button
                                    onClick={handleManageSubscription}
                                    className="text-[10px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                                >
                                    Upgrade
                                </button>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                                {user.imageUrl ? (
                                    <img src={user.imageUrl} className="h-9 w-9 rounded-full" />
                                ) : (
                                    <User className="h-4 w-4 text-zinc-500" />
                                )}
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                                    {user.fullName}
                                </p>
                                <p className="text-[11px] text-zinc-500 dark:text-zinc-500 truncate">
                                    {user.primaryEmailAddress?.emailAddress}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Menu Items */}
                    <div className="p-1.5 space-y-0.5">
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                setIsProfileModalOpen(true);
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2 text-[13px] font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 rounded-lg transition-colors"
                        >
                            <Heart className="h-4 w-4 text-rose-500 dark:text-rose-400" />
                            Medical Profile
                        </button>

                        <button
                            onClick={() => {
                                setIsOpen(false);
                                openUserProfile();
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2 text-[13px] font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 rounded-lg transition-colors"
                        >
                            <Settings className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                            Account Settings
                        </button>

                        <button
                            onClick={() => {
                                setIsOpen(false);
                                handleManageSubscription();
                            }}
                            disabled={isLoadingPortal}
                            className="w-full flex items-center gap-3 px-3 py-2 text-[13px] font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 rounded-lg transition-colors disabled:opacity-50"
                        >
                            {isLoadingPortal ? (
                                <Loader2 className="h-4 w-4 text-indigo-500 animate-spin" />
                            ) : (
                                <Sparkles className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
                            )}
                            Manage Subscription
                        </button>
                    </div>

                    {/* Footer / Sign Out */}
                    <div className="p-1.5 border-t border-zinc-100 dark:border-zinc-800 mt-1">
                        <button
                            onClick={handleSignOut}
                            className="w-full flex items-center gap-3 px-3 py-2 text-[13px] font-medium text-zinc-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                            <LogOut className="h-4 w-4" />
                            Sign out
                        </button>
                    </div>
                </div>,
                document.body
            )}

            {/* Edit Profile Modal */}
            <EditProfileModal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
            />
        </>
    );
}