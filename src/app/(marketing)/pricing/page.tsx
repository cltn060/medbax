"use client";

import { SignInButton, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { ArrowLeft } from "lucide-react";
import { PricingSection } from "@/components/landing";

export default function PricingPage() {
    const { isSignedIn } = useUser();

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/40 dark:from-black dark:via-zinc-900 dark:to-indigo-950">
            {/* Navbar */}
            <nav className="relative z-50 w-full px-8 md:px-16 py-6 flex items-center justify-between border-b border-slate-200/50 dark:border-zinc-800/50 bg-white/50 dark:bg-black/50 backdrop-blur-sm">
                <Link href="/" className="flex items-center gap-3">
                    <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">MedBax</span>
                </Link>
                <div className="hidden md:flex items-center gap-12 text-sm font-light tracking-wide text-slate-600 dark:text-zinc-300 absolute left-1/2 -translate-x-1/2">
                    <Link href="/" className="hover:text-slate-900 dark:hover:text-white transition-opacity">Home</Link>
                    <Link href="/pricing" className="text-slate-900 dark:text-white font-medium">Pricing</Link>
                    <Link href="/about" className="hover:text-slate-900 dark:hover:text-white transition-opacity">About</Link>
                </div>
                <div className="flex items-center gap-4">
                    <LanguageSwitcher />
                    <ThemeToggle />
                    {isSignedIn ? (
                        <Link href="/dashboard/chat">
                            <button className="bg-slate-900 dark:bg-white dark:text-black hover:bg-slate-800 dark:hover:bg-zinc-200 text-white text-xs font-semibold px-5 py-2.5 rounded-lg transition-colors">Dashboard</button>
                        </Link>
                    ) : (
                        <SignInButton mode="modal" forceRedirectUrl="/onboarding">
                            <button className="bg-slate-900 dark:bg-white dark:text-black hover:bg-slate-800 dark:hover:bg-zinc-200 text-white text-xs font-semibold px-5 py-2.5 rounded-lg transition-colors">Sign In</button>
                        </SignInButton>
                    )}
                </div>
            </nav>



            {/* Pricing Cards - Three Columns */}
            <PricingSection />

            {/* FAQ Section */}
            <div className="max-w-3xl mx-auto px-6 pb-24 mt-16">
                <h2 className="text-2xl font-medium text-slate-900 dark:text-white mb-8 text-center">
                    Frequently Asked Questions
                </h2>
                <div className="space-y-4">
                    {[
                        {
                            q: "Can I switch plans later?",
                            a: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately."
                        },
                        {
                            q: "What happens when I hit my query limit?",
                            a: "You'll receive a notification as you approach your limit. You can upgrade your plan to continue using AI queries."
                        },
                        {
                            q: "Is there a free trial for paid plans?",
                            a: "Yes, both Pro and Pro+ plans come with a 14-day free trial. No credit card required to start."
                        },
                        {
                            q: "How do I cancel my subscription?",
                            a: "You can cancel anytime from your account settings. Your access continues until the end of the billing period."
                        }
                    ].map((faq, i) => (
                        <div key={i} className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 p-6">
                            <h3 className="font-medium text-slate-900 dark:text-white mb-2">{faq.q}</h3>
                            <p className="text-sm text-slate-500 dark:text-zinc-400">{faq.a}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer */}
            <footer className="py-8 text-center text-slate-500 dark:text-zinc-600 text-sm border-t border-slate-200 dark:border-zinc-800">
                © 2025 MedBax AI. All rights reserved.
            </footer>
        </div>
    );
}
