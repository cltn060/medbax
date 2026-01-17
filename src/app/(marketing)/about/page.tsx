"use client";

import { SignInButton, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { Sparkles, Upload, Brain, FileCheck, Shield } from "lucide-react";
import { ScrollReveal } from "@/components/landing";

export default function AboutPage() {
    const { isSignedIn } = useUser();

    return (
        <>
            <style>{`
                @font-face {
                    font-family: 'Kalice Regular';
                    src: local('Kalice Regular'), local('Kalice-Regular');
                }
                * {
                    font-family: "Kalice Regular", "Inter", sans-serif !important;
                }
                @keyframes twinkle {
                    0%, 100% { opacity: 1; scale: 1; }
                    50% { opacity: 0.7; scale: 0.9; }
                }
                .animate-twinkle {
                    animation: twinkle 3s ease-in-out infinite;
                }
            `}</style>

            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/40 dark:from-black dark:via-zinc-900 dark:to-indigo-950">

                {/* Navbar */}
                <nav className="relative z-50 w-full px-8 md:px-16 py-6 flex items-center justify-between border-b border-slate-200/50 dark:border-zinc-800/50 bg-white/50 dark:bg-black/50 backdrop-blur-sm">
                    <Link href="/" className="flex items-center gap-3">
                        <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">MedBax</span>
                    </Link>
                    <div className="hidden md:flex items-center gap-12 text-sm font-light tracking-wide text-slate-600 dark:text-zinc-300 absolute left-1/2 -translate-x-1/2">
                        <Link href="/" className="hover:text-slate-900 dark:hover:text-white transition-opacity">Home</Link>
                        <Link href="/pricing" className="hover:text-slate-900 dark:hover:text-white transition-opacity">Pricing</Link>
                        <Link href="/about" className="text-slate-900 dark:text-white font-medium">About</Link>
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

                {/* Main Content */}
                <div className="relative w-full py-20 md:py-32 px-4 md:px-16">
                    {/* Background Decoration */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-indigo-200/30 dark:bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"></div>

                    <div className="max-w-4xl mx-auto relative z-10">
                        <ScrollReveal>
                            {/* Hero */}
                            <div className="text-center mb-16">
                                <div className="inline-flex items-center gap-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-4 py-2 rounded-full text-sm font-medium mb-6">
                                    <Sparkles size={16} />
                                    About MedBax
                                </div>
                                <h1 className="text-4xl md:text-6xl font-medium tracking-tight mb-6 leading-[1.1] text-slate-900 dark:text-white">
                                    Your complete medical profile, <br />
                                    <span className="text-slate-500 dark:text-zinc-400">powered by AI</span>
                                </h1>
                                <p className="text-lg text-slate-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
                                    MedBax is a RAG-powered healthcare companion that combines your medical history with comprehensive knowledge bases to deliver personalized, evidence-based health insights.
                                </p>
                            </div>
                        </ScrollReveal>

                        {/* How It Works - Single Card */}
                        <ScrollReveal delay={100}>
                            <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-sm rounded-2xl p-8 md:p-12 border border-slate-200 dark:border-zinc-800 mb-12">
                                <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-8 text-center">How It Works</h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="flex gap-4">
                                        <div className="w-10 h-10 shrink-0 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                                            <Upload size={18} className="text-indigo-600 dark:text-indigo-400" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Build Your Profile</h3>
                                            <p className="text-sm text-slate-600 dark:text-zinc-400">Upload medical records, lab results, and prescriptions to create your complete health profile.</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <div className="w-10 h-10 shrink-0 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                            <Brain size={18} className="text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Get Personalized Insights</h3>
                                            <p className="text-sm text-slate-600 dark:text-zinc-400">Our AI analyzes YOUR data + medical knowledge bases for tailored deductions.</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <div className="w-10 h-10 shrink-0 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                            <FileCheck size={18} className="text-purple-600 dark:text-purple-400" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Trust the Sources</h3>
                                            <p className="text-sm text-slate-600 dark:text-zinc-400">Every response includes citations from medical knowledge sources you can verify.</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <div className="w-10 h-10 shrink-0 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                            <Shield size={18} className="text-green-600 dark:text-green-400" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Privacy First</h3>
                                            <p className="text-sm text-slate-600 dark:text-zinc-400">Your data is protected with enterprise-grade security and never shared.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </ScrollReveal>

                        {/* CTA */}
                        <ScrollReveal delay={200}>
                            <div className="text-center">
                                <p className="text-slate-600 dark:text-zinc-400 mb-6">
                                    Ready to take control of your health information?
                                </p>
                                {isSignedIn ? (
                                    <Link href="/dashboard/chat">
                                        <button className="bg-slate-900 dark:bg-white dark:text-black hover:bg-slate-800 dark:hover:bg-zinc-200 text-white text-sm font-semibold px-8 py-3 rounded-lg transition-colors">
                                            Go to Dashboard
                                        </button>
                                    </Link>
                                ) : (
                                    <SignInButton mode="modal" forceRedirectUrl="/onboarding">
                                        <button className="bg-slate-900 dark:bg-white dark:text-black hover:bg-slate-800 dark:hover:bg-zinc-200 text-white text-sm font-semibold px-8 py-3 rounded-lg transition-colors">
                                            Get Started Free
                                        </button>
                                    </SignInButton>
                                )}
                            </div>
                        </ScrollReveal>
                    </div>
                </div>

                {/* Footer */}
                <footer className="py-8 text-center text-slate-500 dark:text-zinc-600 text-sm border-t border-slate-200 dark:border-zinc-800">
                    <div className="mb-4 flex items-center justify-center gap-2 opacity-50">
                        <span className="font-bold">MedBax</span>
                    </div>
                    &copy; 2025 MedBax AI. All rights reserved.
                </footer>

            </div>
        </>
    );
}
