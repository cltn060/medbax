"use client";

import { Bot, Check, Users, MessageSquare, Sparkles } from "lucide-react";
import { ScrollReveal } from "./scroll-reveal";

export function OrbitalTeamSection() {
    return (
        <section className="w-full py-32 bg-slate-50 dark:bg-zinc-950 overflow-hidden relative border-t border-slate-200 dark:border-zinc-900 z-0">
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-100 dark:bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="max-w-7xl mx-auto px-4 relative z-20 flex flex-col md:flex-row items-center">

                {/* Left Text */}
                <div className="md:w-1/2 mb-16 md:mb-0">
                    <ScrollReveal>
                        <p className="text-slate-500 dark:text-zinc-500 mb-4 text-sm font-medium tracking-wide">MedBax is the most integrated</p>
                        <h2 className="text-5xl md:text-7xl text-slate-900 dark:text-white font-medium leading-[1.1] mb-8">
                            Superhuman team <br />
                            of <span className="text-slate-500 dark:text-zinc-400 italic font-serif">AI-employees</span> for <br />
                            healthcare
                        </h2>
                        <p className="text-slate-600 dark:text-zinc-400 max-w-md mb-10 font-light">
                            Loved by healthcare organizations and platforms with over 100,000 providers.
                        </p>
                        <button className="bg-slate-900 dark:bg-white text-white dark:text-black px-8 py-3 rounded-lg text-sm font-bold hover:bg-slate-800 dark:hover:bg-zinc-200 transition-colors flex items-center gap-2">
                            Book a demo <Sparkles size={14} />
                        </button>
                    </ScrollReveal>
                </div>

                {/* Right Orbit Diagram */}
                <div className="md:w-1/2 relative h-[600px] w-full flex items-center justify-center">
                    <ScrollReveal delay={200} className="w-full h-full flex items-center justify-center">

                        {/* Rings */}
                        <div className="absolute border border-slate-300 dark:border-white/10 rounded-full w-[300px] h-[300px]"></div>
                        <div className="absolute border border-slate-200 dark:border-white/10 rounded-full w-[500px] h-[500px]"></div>

                        {/* Center Card */}
                        <div className="bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 p-6 rounded-xl shadow-2xl relative z-20 w-64">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-slate-400 dark:from-indigo-600 to-slate-900 dark:to-blue-100 flex items-center justify-center">
                                    <Bot size={20} className="text-white dark:text-indigo-950" />
                                </div>
                                <div>
                                    <h3 className="text-slate-900 dark:text-white font-bold text-sm">AI Receptionist</h3>
                                    <p className="text-[10px] text-slate-500 dark:text-zinc-500">Active Now</p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-slate-600 dark:text-zinc-400 text-[10px]">
                                    <Check size={10} className="text-slate-900 dark:text-white" /> Appointment scheduling
                                </div>
                                <div className="flex items-center gap-2 text-slate-600 dark:text-zinc-400 text-[10px]">
                                    <Users size={10} className="text-slate-900 dark:text-white" /> Patient check-in
                                </div>
                                <div className="flex items-center gap-2 text-slate-600 dark:text-zinc-400 text-[10px]">
                                    <MessageSquare size={10} className="text-slate-900 dark:text-white" /> Front desk support
                                </div>
                            </div>
                            <button className="w-full mt-4 bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white text-[10px] py-2 rounded hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors">
                                Explore AI Receptionist
                            </button>
                        </div>

                        {/* Orbit Nodes */}
                        <div className="absolute top-[50px] bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg animate-pulse">
                            <div className="w-2 h-2 bg-slate-900 dark:bg-white rounded-full"></div>
                            <span className="text-[10px] text-slate-900 dark:text-white font-medium">AI Triage Nurse</span>
                        </div>
                        <div className="absolute right-[10px] bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg">
                            <div className="w-2 h-2 bg-slate-400 dark:bg-zinc-400 rounded-full"></div>
                            <span className="text-[10px] text-slate-900 dark:text-white font-medium">AI Medical Coder</span>
                        </div>
                        <div className="absolute bottom-[50px] bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg">
                            <div className="w-2 h-2 bg-slate-400 dark:bg-zinc-400 rounded-full"></div>
                            <span className="text-[10px] text-slate-900 dark:text-white font-medium">AI Researcher</span>
                        </div>
                        <div className="absolute left-[10px] bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg">
                            <div className="w-2 h-2 bg-slate-400 dark:bg-zinc-400 rounded-full"></div>
                            <span className="text-[10px] text-slate-900 dark:text-white font-medium">AI Consultant</span>
                        </div>
                        <div className="absolute top-[120px] right-[60px] bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg">
                            <div className="w-2 h-2 bg-slate-400 dark:bg-zinc-400 rounded-full"></div>
                            <span className="text-[10px] text-slate-900 dark:text-white font-medium">AI Pharmacist</span>
                        </div>
                    </ScrollReveal>
                </div>
            </div>
        </section>
    );
}
