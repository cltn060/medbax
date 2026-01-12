"use client";

import { SignInButton, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { Sparkles, Heart, Shield, Zap } from "lucide-react";
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

                {/* Hero Section */}
                <div className="relative w-full min-h-[60vh] flex flex-col overflow-hidden">
                    {/* Background Decoration */}
                    <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[120vw] h-[120vw] rounded-[100%] border-[1px] border-indigo-200/50 dark:border-white/10 pointer-events-none"></div>
                    <div className="absolute top-[21%] left-[48%] -translate-x-1/2 w-[118vw] h-[118vw] rounded-[100%] border-[1px] border-blue-200/30 dark:border-white/5 pointer-events-none"></div>
                    <div className="absolute top-[25%] left-1/2 -translate-x-1/2 w-80 h-80 bg-indigo-300/30 dark:bg-indigo-500/30 rounded-full blur-[100px] pointer-events-none"></div>

                    {/* Glowing Star */}
                    <div className="absolute top-[calc(20%-1px)] left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
                        <div className="relative flex items-center justify-center animate-twinkle">
                            <Sparkles className="text-indigo-500 dark:text-white w-6 h-6 fill-indigo-400 dark:fill-white drop-shadow-[0_0_8px_rgba(99,102,241,0.8)] dark:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                            <div className="absolute inset-0 bg-indigo-400/60 dark:bg-white/60 blur-lg rounded-full scale-125"></div>
                            <div className="absolute w-8 h-0.5 bg-indigo-400/50 dark:bg-white/50 blur-[0.5px]"></div>
                            <div className="absolute w-0.5 h-8 bg-indigo-400/50 dark:bg-white/50 blur-[0.5px]"></div>
                        </div>
                    </div>

                    {/* Hero Text */}
                    <main className="relative z-10 w-full px-4 pt-20 md:pt-32 text-center">
                        <ScrollReveal>
                            <h1 className="text-5xl md:text-7xl font-medium tracking-tight mb-6 leading-[1.1] drop-shadow-sm text-slate-900 dark:text-white">
                                About MedBax
                            </h1>
                            <p className="text-lg md:text-xl text-slate-600 dark:text-zinc-400 mb-10 max-w-2xl mx-auto leading-relaxed font-light">
                                We're empowering patients with personalized AI-powered health insights using advanced RAG technology and comprehensive medical knowledge bases.
                            </p>
                        </ScrollReveal>
                    </main>
                </div>

                {/* Mission Section */}
                <div className="relative w-full py-24 px-4 md:px-16">
                    <div className="max-w-6xl mx-auto">
                        <ScrollReveal>
                            <div className="text-center mb-16">
                                <h2 className="text-4xl md:text-5xl text-slate-900 dark:text-white font-medium mb-4 tracking-tight">
                                    Our Mission
                                </h2>
                                <p className="text-lg text-slate-600 dark:text-zinc-400 max-w-3xl mx-auto leading-relaxed">
                                    MedBax was created to give every patient access to personalized, evidence-based health information. By combining your unique medical history with our comprehensive knowledge bases, we provide tailored insights that help you understand and manage your health better.
                                </p>
                            </div>
                        </ScrollReveal>

                        {/* Values Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
                            <ScrollReveal delay={0}>
                                <div className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-200 dark:border-zinc-800">
                                    <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center mb-4">
                                        <Heart className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Your Health, Your Data</h3>
                                    <p className="text-slate-600 dark:text-zinc-400 leading-relaxed">
                                        Upload and securely manage your complete medical history in one place for personalized health insights.
                                    </p>
                                </div>
                            </ScrollReveal>

                            <ScrollReveal delay={100}>
                                <div className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-200 dark:border-zinc-800">
                                    <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center mb-4">
                                        <Shield className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Privacy First</h3>
                                    <p className="text-slate-600 dark:text-zinc-400 leading-relaxed">
                                        Your data and your patients' information is protected with enterprise-grade security and compliance.
                                    </p>
                                </div>
                            </ScrollReveal>

                            <ScrollReveal delay={200}>
                                <div className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-200 dark:border-zinc-800">
                                    <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center mb-4">
                                        <Zap className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Comprehensive Knowledge</h3>
                                    <p className="text-slate-600 dark:text-zinc-400 leading-relaxed">
                                        Access extensive knowledge bases covering all aspects of human health and body systems.
                                    </p>
                                </div>
                            </ScrollReveal>
                        </div>
                    </div>
                </div>

                {/* What We Do Section */}
                <div className="relative w-full py-24 px-4 md:px-16">
                    <div className="max-w-4xl mx-auto">
                        <ScrollReveal>
                            <div className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm rounded-2xl p-12 border border-slate-200 dark:border-zinc-800">
                                <h2 className="text-3xl md:text-4xl text-slate-900 dark:text-white font-medium mb-6 tracking-tight text-center">
                                    What We Do
                                </h2>
                                <div className="space-y-6 text-slate-600 dark:text-zinc-400 leading-relaxed">
                                    <p>
                                        MedBax is a RAG-based (Retrieval-Augmented Generation) medical AI companion that provides personalized health insights. Upload your medical history, and our AI analyzes it using comprehensive knowledge bases covering all aspects of human health.
                                    </p>
                                    <p>
                                        Our platform uses advanced RAG technology to retrieve relevant information from our extensive medical knowledge bases, then generates personalized responses tailored to your specific medical history. Every answer includes citations from our knowledge sources, so you can verify information and understand where it comes from.
                                    </p>
                                    <p>
                                        Whether you're researching symptoms, understanding a diagnosis, exploring treatment options, or managing a chronic condition, MedBax provides evidence-based insights personalized to your unique health profile.
                                    </p>
                                </div>
                            </div>
                        </ScrollReveal>
                    </div>
                </div>

                {/* CTA Section */}
                <div className="relative w-full py-24 px-4 md:px-16">
                    <div className="max-w-4xl mx-auto text-center">
                        <ScrollReveal>
                            <h2 className="text-3xl md:text-4xl text-slate-900 dark:text-white font-medium mb-6 tracking-tight">
                                Ready to get started?
                            </h2>
                            <p className="text-lg text-slate-600 dark:text-zinc-400 mb-8 max-w-2xl mx-auto">
                                Join thousands of patients using MedBax to better understand and manage their health.
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
