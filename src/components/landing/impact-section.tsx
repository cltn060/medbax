"use client";

import { Activity, FileCode, Users, ClipboardList } from "lucide-react";
import { ScrollReveal } from "./scroll-reveal";

export function ImpactSection() {
    return (
        <section className="w-full py-24 px-4 md:px-16 bg-slate-100 dark:bg-black relative border-t border-slate-200 dark:border-zinc-900 z-0">
            <div className="max-w-7xl mx-auto relative z-20">
                <ScrollReveal>
                    <h2 className="text-4xl md:text-6xl text-slate-900 dark:text-white font-medium mb-16 tracking-tight">
                        Autonomous impact <br />
                        <span className="text-slate-500 dark:text-zinc-500">on Hospitals</span>
                    </h2>
                </ScrollReveal>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 relative">
                    <ScrollReveal delay={100}>
                        <div className="space-y-2">
                            <p className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-zinc-500 font-bold">Midi Health</p>
                            <p className="text-5xl text-slate-900 dark:text-white font-light">93.8%</p>
                            <div className="flex items-center gap-2 text-slate-600 dark:text-zinc-400 text-xs">
                                <FileCode size={14} />
                                <span>Accurate ICD-10 coding</span>
                            </div>
                        </div>
                    </ScrollReveal>

                    <ScrollReveal delay={200}>
                        <div className="space-y-2">
                            <p className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-zinc-500 font-bold">Ascend Medical</p>
                            <p className="text-5xl text-slate-900 dark:text-white font-light">11%</p>
                            <div className="flex items-center gap-2 text-slate-600 dark:text-zinc-400 text-xs">
                                <Activity size={14} />
                                <span>Increase in additional visits</span>
                            </div>
                        </div>
                    </ScrollReveal>

                    <ScrollReveal delay={300}>
                        <div className="space-y-2">
                            <p className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-zinc-500 font-bold">ACG</p>
                            <p className="text-5xl text-slate-900 dark:text-white font-light">98%</p>
                            <div className="flex items-center gap-2 text-slate-600 dark:text-zinc-400 text-xs">
                                <Users size={14} />
                                <span>Drop in call abandonment</span>
                            </div>
                        </div>
                    </ScrollReveal>

                    <ScrollReveal delay={400}>
                        <div className="space-y-2">
                            <p className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-zinc-500 font-bold">Pure Psych</p>
                            <p className="text-5xl text-slate-900 dark:text-white font-light">$200k</p>
                            <div className="flex items-center gap-2 text-slate-600 dark:text-zinc-400 text-xs">
                                <ClipboardList size={14} />
                                <span>Generated from missed appts</span>
                            </div>
                        </div>
                    </ScrollReveal>
                </div>

                {/* Rising Bar Visual */}
                <div className="absolute bottom-0 right-0 w-full h-64 flex items-end justify-end gap-4 pointer-events-none opacity-20 pr-16 z-0">
                    {[20, 35, 45, 60, 75, 90, 110, 130, 160].map((height, i) => (
                        <div key={i} style={{ height: `${height}px` }} className="w-[1px] bg-slate-900 dark:bg-white"></div>
                    ))}
                </div>
            </div>
        </section>
    );
}
