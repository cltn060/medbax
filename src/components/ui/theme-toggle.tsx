"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/providers/theme-provider";

export function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="p-2 rounded-lg transition-colors hover:bg-slate-200 dark:hover:bg-zinc-800"
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
            {theme === "light" ? (
                <Moon size={18} className="text-indigo-600 dark:text-indigo-400" />
            ) : (
                <Sun size={18} className="text-indigo-400" />
            )}
        </button>
    );
}
