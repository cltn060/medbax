"use client";

import { UserButton } from "@clerk/nextjs";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { Bell } from "lucide-react";

export function Header() {
    return (
        <header className="flex h-14 items-center justify-between border-b border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-6">
            <div className="flex flex-1">
            </div>
            <div className="flex items-center gap-4">

                {/* Language Switcher */}
                <LanguageSwitcher />

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
                />
            </div>
        </header>
    );
}
