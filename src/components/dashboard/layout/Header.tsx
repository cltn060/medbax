"use client";

import { UserButton } from "@clerk/nextjs";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Bell, CreditCard } from "lucide-react";
import { useAction } from "convex/react";
import { api } from "../../../../convex/_generated/api";

export function Header() {
    const createPortalSession = useAction(api.stripe.createPortalSession);

    const handleManageSubscription = async () => {
        try {
            const url = await createPortalSession({});
            if (url) window.open(url, '_blank');
        } catch (error) {
            console.error("Error creating portal session:", error);
        }
    };

    return (
        <header className="flex h-14 items-center justify-between border-b border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-6">
            <div className="flex flex-1">
            </div>
            <div className="flex items-center gap-4">



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
                    <UserButton.Action
                        label="Manage Subscription"
                        labelIcon={<CreditCard className="h-4 w-4" />}
                        onClick={handleManageSubscription}
                    />
                </UserButton>
            </div>
        </header>
    );
}
