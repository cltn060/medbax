"use client";

import { Upload, MessageSquare, Brain, FileCheck, Sparkles } from "lucide-react";
import { ScrollReveal } from "./scroll-reveal";
import { SignInButton, useUser } from "@clerk/nextjs";
import Link from "next/link";

export function OrbitalTeamSection() {
    const { isSignedIn } = useUser();

    return (
        <section className="w-full py-32 bg-slate-50 dark:bg-zinc-950 overflow-hidden relative border-t border-slate-200 dark:border-zinc-900 z-0">
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-100 dark:bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="max-w-7xl mx-auto px-4 relative z-20 flex flex-col md:flex-row items-center">

                {/* Left Text */}
                <div className="md:w-1/2 mb-16 md:mb-0">
                    <ScrollReveal>
                        <p className="text-slate-500 dark:text-zinc-500 mb-4 text-sm font-medium tracking-wide">How MedBax works</p>
                        <h2 className="text-5xl md:text-7xl text-slate-900 dark:text-white font-medium leading-[1.1] mb-8">
                            Your health, <br />
                            <span className="text-slate-500 dark:text-zinc-400 italic font-serif">understood</span> by AI
                        </h2>
                        <p className="text-slate-600 dark:text-zinc-400 max-w-md mb-10 font-light">
                            Build your complete medical profile and get personalized insights powered by RAG technology and comprehensive medical knowledge.
                        </p>
                        {isSignedIn ? (
                            <Link href="/dashboard/chat">
                                <button className="bg-slate-900 dark:bg-white text-white dark:text-black px-8 py-3 rounded-lg text-sm font-bold hover:bg-slate-800 dark:hover:bg-zinc-200 transition-colors flex items-center gap-2">
                                    Go to Dashboard <Sparkles size={14} />
                                </button>
                            </Link>
                        ) : (
                            <SignInButton mode="modal" forceRedirectUrl="/onboarding">
                                <button className="bg-slate-900 dark:bg-white text-white dark:text-black px-8 py-3 rounded-lg text-sm font-bold hover:bg-slate-800 dark:hover:bg-zinc-200 transition-colors flex items-center gap-2">
                                    Get Started Free <Sparkles size={14} />
                                </button>
                            </SignInButton>
                        )}
                    </ScrollReveal>
                </div>

                {/* Right - How It Works Steps */}
                <div className="md:w-1/2 relative w-full flex items-center justify-center">
                    <ScrollReveal delay={200} className="w-full">
                        <div className="space-y-6 max-w-md mx-auto">
                            {/* Step 1 */}
                            <div className="bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 p-6 rounded-xl shadow-lg">
                                <div className="flex items-center gap-4 mb-3">
                                    <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                                        <Upload size={20} className="text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-500 dark:text-zinc-500 uppercase tracking-wider">Step 1</p>
                                        <h3 className="text-slate-900 dark:text-white font-bold text-sm">Build Your Profile</h3>
                                    </div>
                                </div>
                                <p className="text-slate-600 dark:text-zinc-400 text-xs">
                                    Upload medical records, lab results, prescriptions, and any health documents.
                                </p>
                            </div>

                            {/* Step 2 */}
                            <div className="bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 p-6 rounded-xl shadow-lg ml-8">
                                <div className="flex items-center gap-4 mb-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                        <MessageSquare size={20} className="text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-500 dark:text-zinc-500 uppercase tracking-wider">Step 2</p>
                                        <h3 className="text-slate-900 dark:text-white font-bold text-sm">Ask About Your Health</h3>
                                    </div>
                                </div>
                                <p className="text-slate-600 dark:text-zinc-400 text-xs">
                                    Chat naturally about symptoms, conditions, medications, or any health questions.
                                </p>
                            </div>

                            {/* Step 3 */}
                            <div className="bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 p-6 rounded-xl shadow-lg">
                                <div className="flex items-center gap-4 mb-3">
                                    <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                        <Brain size={20} className="text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-500 dark:text-zinc-500 uppercase tracking-wider">Step 3</p>
                                        <h3 className="text-slate-900 dark:text-white font-bold text-sm">Get Personalized Deductions</h3>
                                    </div>
                                </div>
                                <p className="text-slate-600 dark:text-zinc-400 text-xs">
                                    AI analyzes YOUR medical history + comprehensive knowledge bases for tailored insights.
                                </p>
                            </div>

                            {/* Step 4 */}
                            <div className="bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 p-6 rounded-xl shadow-lg ml-8">
                                <div className="flex items-center gap-4 mb-3">
                                    <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                        <FileCheck size={20} className="text-green-600 dark:text-green-400" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-500 dark:text-zinc-500 uppercase tracking-wider">Step 4</p>
                                        <h3 className="text-slate-900 dark:text-white font-bold text-sm">Trust the Sources</h3>
                                    </div>
                                </div>
                                <p className="text-slate-600 dark:text-zinc-400 text-xs">
                                    Every response includes citations from medical knowledge sources you can verify.
                                </p>
                            </div>
                        </div>
                    </ScrollReveal>
                </div>
            </div>
        </section>
    );
}
