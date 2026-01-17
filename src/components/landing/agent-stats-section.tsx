"use client";

import { MessageSquare, FileText, Database, Sparkles, LucideIcon } from "lucide-react";
import { ScrollReveal } from "./scroll-reveal";

interface Stat {
    label: string;
    value: string;
    description: string;
    icon: LucideIcon;
}

const stats: Stat[] = [
    { label: "Questions Answered", value: "50K+", description: "Health queries processed", icon: MessageSquare },
    { label: "Medical Records", value: "10K+", description: "Documents analyzed", icon: FileText },
    { label: "Knowledge Sources", value: "100+", description: "Medical references", icon: Database },
    { label: "Personalized Insights", value: "25K+", description: "Tailored deductions", icon: Sparkles },
];

export function AgentStatsSection() {
    return (
        <section className="w-full py-24 bg-white dark:bg-black text-slate-900 dark:text-white border-t border-slate-200 dark:border-zinc-900 z-0 relative">
            <div className="max-w-7xl mx-auto px-4 relative z-20">
                <ScrollReveal>
                    <h2 className="text-4xl md:text-5xl text-center font-medium mb-4 font-serif">
                        Trusted by users <span className="italic text-slate-500 dark:text-zinc-400">worldwide</span>
                    </h2>
                    <p className="text-center text-slate-500 dark:text-zinc-500 text-sm mb-16 max-w-xl mx-auto">
                        Our RAG-powered platform helps people understand their health with personalized, evidence-based insights.
                    </p>
                </ScrollReveal>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {stats.map((stat, index) => (
                        <ScrollReveal key={index} delay={index * 100}>
                            <div className="bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 p-6 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-900 transition-colors group text-center">
                                <div className="flex justify-center mb-4">
                                    <div className="p-3 bg-white dark:bg-black rounded-xl border border-slate-200 dark:border-zinc-700 group-hover:border-indigo-400 dark:group-hover:border-indigo-500/50 transition-colors">
                                        <stat.icon size={20} className="text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                </div>
                                <p className="text-4xl font-light text-slate-900 dark:text-white mb-2 tracking-tight">{stat.value}</p>
                                <p className="text-sm font-semibold text-slate-700 dark:text-zinc-300 mb-1">{stat.label}</p>
                                <p className="text-[10px] text-slate-500 dark:text-zinc-500 uppercase tracking-wider">{stat.description}</p>
                            </div>
                        </ScrollReveal>
                    ))}
                </div>
            </div>
        </section>
    );
}
