"use client";

import { UserButton } from "@clerk/nextjs";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Menu, CreditCard } from "lucide-react";
import { useAction } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useSidebar } from "./SidebarContext";

export function Header() {
    const createPortalSession = useAction(api.stripe.createPortalSession);
    const { openMobileSidebar } = useSidebar();

    const handleManageSubscription = async () => {
        try {
            const url = await createPortalSession({});
            if (url) window.open(url, '_blank');
        } catch (error) {
            console.error("Error creating portal session:", error);
        }
    };

    return (
        <header className="flex h-14 items-center justify-between border-b border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 md:px-6">
            {/* Left side - Hamburger on mobile */}
            <div className="flex items-center gap-3">
                {/* Mobile Menu Button */}
                <button
                    onClick={openMobileSidebar}
                    className="md:hidden p-2 -ml-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 transition-colors touch-target"
                    aria-label="Open menu"
                >
                    <Menu className="h-5 w-5" />
                </button>
            </div>

            {/* Right side - Actions */}
            <div className="flex items-center gap-3 md:gap-4">
                {/* Theme Toggle */}
                <ThemeToggle />

                {/* User Profile */}
                <UserButton
                    afterSignOutUrl="/"
                    appearance={{
                        elements: {
                            avatarBox: "h-8 w-8"
                        }
                    }}
                >
                    <UserButton.MenuItems>
                        <UserButton.Action
                            label="Manage Subscription"
                            labelIcon={<CreditCard className="h-4 w-4" />}
                            onClick={handleManageSubscription}
                        />
                    </UserButton.MenuItems>
                </UserButton>
            </div>
        </header>
    );
}
