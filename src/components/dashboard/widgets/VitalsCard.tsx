"use client";

import { Activity, ArrowDown, ArrowUp, Heart, Minus, Thermometer, Weight } from "lucide-react";
import { PatientVital } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

interface VitalsCardProps {
    vitals: PatientVital[];
}

export function VitalsCard({ vitals }: VitalsCardProps) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {vitals.map((vital) => (
                <div
                    key={vital.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:border-indigo-300 dark:hover:border-indigo-700/50 transition-colors group"
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-slate-500 dark:text-zinc-500 truncate">{vital.label}</span>
                        {getIconForVital(vital.label)}
                    </div>

                    <div className="flex items-baseline gap-1 mb-1">
                        <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{vital.value}</span>
                        <span className="text-[10px] text-slate-400 dark:text-zinc-600 font-medium">{vital.unit}</span>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className={cn(
                            "flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full w-fit",
                            vital.status === 'warning' ? "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400" :
                                vital.status === 'critical' ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400" :
                                    "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
                        )}>
                            {vital.trend === 'up' && <ArrowUp className="h-2.5 w-2.5" />}
                            {vital.trend === 'down' && <ArrowDown className="h-2.5 w-2.5" />}
                            {vital.trend === 'neutral' && <Minus className="h-2.5 w-2.5" />}
                            <span>{vital.change ? `${Math.abs(vital.change)}%` : 'Stable'}</span>
                        </div>
                        <span className="text-[9px] text-slate-400 dark:text-zinc-600">{vital.lastUpdated}</span>
                    </div>
                </div>
            ))}
        </div>
    );
}

function getIconForVital(label: string) {
    const className = "h-3.5 w-3.5 text-slate-400 dark:text-zinc-600 group-hover:text-indigo-500 transition-colors";

    if (label.includes("Heart")) return <Heart className={className} />;
    if (label.includes("Temperature")) return <Thermometer className={className} />;
    if (label.includes("Weight")) return <Weight className={className} />;
    return <Activity className={className} />;
}
