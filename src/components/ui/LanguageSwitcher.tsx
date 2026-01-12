"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Globe, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Language = "en" | "de";

// Helper to get current language from Google Translate cookie
function getGoogleTranslateLanguage(): Language {
    const match = document.cookie.match(/googtrans=\/en\/(\w+)/);
    if (match && match[1] === "de") return "de";
    return "en";
}

// Helper to set Google Translate cookie
function setGoogleTranslateCookie(lang: Language) {
    const value = lang === "en" ? "" : `/en/${lang}`;
    // Set on current domain and root domain
    document.cookie = `googtrans=${value}; path=/`;
    document.cookie = `googtrans=${value}; path=/; domain=${window.location.hostname}`;
}

export function LanguageSwitcher() {
    const [currentLang, setCurrentLang] = useState<Language>("en");
    const [isLoading, setIsLoading] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const retryCountRef = useRef(0);

    // Check if Google Translate is ready and sync with actual state
    useEffect(() => {
        let attempts = 0;
        const interval = setInterval(() => {
            const googleSelect = document.querySelector(".goog-te-combo") as HTMLSelectElement;
            if (googleSelect) {
                clearInterval(interval);
                setIsReady(true);

                // Sync with saved preference or cookie
                const savedLang = sessionStorage.getItem("translation_lang") as Language | null;
                const cookieLang = getGoogleTranslateLanguage();

                if (savedLang === "de" && cookieLang !== "de") {
                    // Apply saved preference
                    applyLanguage("de", googleSelect);
                } else {
                    // Sync state with actual Google Translate state
                    setCurrentLang(cookieLang);
                }
            }

            attempts++;
            if (attempts > 50) clearInterval(interval);
        }, 100);

        return () => clearInterval(interval);
    }, []);

    // Apply language with multiple methods for reliability
    const applyLanguage = useCallback((targetLang: Language, selectElement?: HTMLSelectElement) => {
        const googleSelect = selectElement || document.querySelector(".goog-te-combo") as HTMLSelectElement;

        if (!googleSelect) {
            console.warn("Google Translate select not found");
            return false;
        }

        try {
            // Method 1: Set cookie first (most reliable for persistence)
            setGoogleTranslateCookie(targetLang);

            // Method 2: Direct select manipulation with multiple event types
            googleSelect.value = targetLang;

            // Fire multiple events to ensure Google picks it up
            googleSelect.dispatchEvent(new Event("change", { bubbles: true }));
            googleSelect.dispatchEvent(new Event("input", { bubbles: true }));

            // Method 3: Simulate user click if available
            const options = googleSelect.querySelectorAll("option");
            options.forEach((option) => {
                if (option.value === targetLang) {
                    option.selected = true;
                }
            });

            // Fire change again after selection
            googleSelect.dispatchEvent(new Event("change", { bubbles: true }));

            return true;
        } catch (error) {
            console.error("Error applying language:", error);
            return false;
        }
    }, []);

    const toggleLanguage = useCallback(() => {
        if (isLoading || !isReady) return;

        const googleSelect = document.querySelector(".goog-te-combo") as HTMLSelectElement;
        if (!googleSelect) {
            // If select disappeared, try to wait for it
            retryCountRef.current++;
            if (retryCountRef.current < 3) {
                setTimeout(() => toggleLanguage(), 200);
            }
            return;
        }

        setIsLoading(true);
        retryCountRef.current = 0;

        const targetLang: Language = currentLang === "en" ? "de" : "en";

        // Apply the language change
        const success = applyLanguage(targetLang, googleSelect);

        if (success) {
            // Save preference
            sessionStorage.setItem("translation_lang", targetLang);
            setCurrentLang(targetLang);
        }

        // Verify change after a delay and retry if needed
        setTimeout(() => {
            const actualLang = getGoogleTranslateLanguage();
            if (actualLang !== targetLang && retryCountRef.current < 2) {
                retryCountRef.current++;
                applyLanguage(targetLang);
            }
        }, 500);

        // Keep loading state for minimum duration to prevent spam
        setTimeout(() => {
            setIsLoading(false);
        }, 1200);
    }, [currentLang, isLoading, isReady, applyLanguage]);

    return (
        <button
            onClick={toggleLanguage}
            disabled={isLoading || !isReady}
            className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all",
                "border border-slate-200 dark:border-zinc-700",
                "bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm",
                "text-slate-600 dark:text-zinc-300",
                "hover:bg-slate-100 dark:hover:bg-zinc-700",
                "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
            title={currentLang === "en" ? "Switch to German" : "Switch to English"}
        >
            {isLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
                <Globe className="h-3.5 w-3.5" />
            )}
            <span className="uppercase">{currentLang === "en" ? "DE" : "EN"}</span>
        </button>
    );
}
