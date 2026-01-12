"use client";

import { Activity, Bot, FileText, FileCode, Users, ClipboardList, LucideIcon } from "lucide-react";
import { ScrollReveal } from "./scroll-reveal";

interface Agent {
    name: string;
    count: string;
    label: string;
    icon: LucideIcon;
}

const agents: Agent[] = [
    { name: "AI Receptionist", count: "965,655", label: "Patient Engagements", icon: Users },
    { name: "AI Scribe", count: "12,512,071", label: "Minutes Scribed", icon: FileText },
    { name: "AI Medical Coder", count: "2,016,446", label: "Autonomous ICD Coding", icon: FileCode },
    { name: "AI Medical Assistant", count: "8,139,096", label: "Charts Prepped", icon: ClipboardList },
    { name: "AI Team", count: "20,090,839", label: "Mins added to workforce", icon: Bot },
];

export function AgentStatsSection() {
    return (
        <section className="w-full py-24 bg-white dark:bg-black text-slate-900 dark:text-white border-t border-slate-200 dark:border-zinc-900 z-0 relative">
            <div className="max-w-7xl mx-auto mb-24 px-4 relative z-20">
                <ScrollReveal>
                    <p className="text-center text-slate-500 dark:text-zinc-500 text-sm mb-8">Trusted by healthcare innovators</p>
                    <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                        <h3 className="text-xl font-serif tracking-tighter">tebra</h3>
                        <h3 className="text-xl font-serif tracking-tighter">Midi</h3>
                        <h3 className="text-xl font-serif tracking-tighter flex items-center gap-1"><div className="w-4 h-4 rounded-full border border-slate-900 dark:border-white"></div> OSHI HEALTH</h3>
                        <h3 className="text-xl font-serif tracking-tighter">Western University</h3>
                    </div>
                </ScrollReveal>
            </div>

            <div className="max-w-7xl mx-auto px-4 relative z-20">
                <ScrollReveal>
                    <h2 className="text-4xl md:text-5xl text-center font-medium mb-16 font-serif">
                        MedBax agents are doing the work <span className="italic text-slate-500 dark:text-zinc-400">autonomously</span>
                    </h2>
                </ScrollReveal>

                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {agents.map((agent, index) => (
                        <ScrollReveal key={index} delay={index * 100}>
                            <div className="bg-slate-100 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 p-6 rounded-xl hover:bg-slate-200 dark:hover:bg-zinc-900 transition-colors group">
                                <div className="flex items-center gap-2 mb-6">
                                    <div className="p-1.5 bg-white dark:bg-black rounded-lg border border-slate-300 dark:border-zinc-700 group-hover:border-slate-400 dark:group-hover:border-white/50 transition-colors">
                                        <agent.icon size={14} className="text-slate-900 dark:text-white" />
                                    </div>
                                    <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">{agent.name}</span>
                                </div>
                                <p className="text-3xl font-light text-slate-900 dark:text-white mb-2 tracking-tight">{agent.count}</p>
                                <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-zinc-500 uppercase tracking-wider font-medium">
                                    {agent.label.includes("Minutes") ? <Activity size={10} /> : <Users size={10} />}
                                    {agent.label}
                                </div>
                            </div>
                        </ScrollReveal>
                    ))}
                </div>
            </div>
        </section>
    );
}
