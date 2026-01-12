"use client";

import { useEffect, useState } from "react";
import { Globe } from "lucide-react";

declare global {
    interface Window {
        toggleLanguage: () => void;
    }
}

export function LanguageSwitcher() {
    const [currentLang, setCurrentLang] = useState("en");

    useEffect(() => {
        // Get initial language from session storage
        const savedLang = sessionStorage.getItem("translation_lang") || "en";
        setCurrentLang(savedLang);

        // Listen for language changes
        const handleLanguageChange = (e: CustomEvent<{ lang: string }>) => {
            setCurrentLang(e.detail.lang);
        };

        window.addEventListener("languageChanged", handleLanguageChange as EventListener);
        return () => {
            window.removeEventListener("languageChanged", handleLanguageChange as EventListener);
        };
    }, []);

    const handleToggle = () => {
        if (typeof window.toggleLanguage === "function") {
            window.toggleLanguage();
            // Optimistically update the state
            setCurrentLang((prev) => (prev === "en" ? "fr" : "en"));
        }
    };

    return (
        <button
            onClick={handleToggle}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
            title="Switch language"
        >
            <Globe className="h-4 w-4" />
            <span className="uppercase">{currentLang === "en" ? "FR" : "EN"}</span>
        </button>
    );
}
