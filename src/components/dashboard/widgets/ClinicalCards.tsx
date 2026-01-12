"use client";

import { AlertCircle, CheckCircle2, Pill, Stethoscope, Clock, ShieldCheck } from "lucide-react";
import { Condition, Medication } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export function ConditionsCard({ conditions }: { conditions: Condition[] }) {
    return (
        <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-4 flex flex-col">
            <div className="flex items-center gap-2 mb-3 shrink-0">
                <div className="p-1.5 rounded-md bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400">
                    <Stethoscope className="h-3.5 w-3.5" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Active Conditions</h3>
            </div>

            <div className="space-y-2">
                {conditions.map((condition) => (
                    <div key={condition.id} className="p-2.5 rounded-lg border border-slate-100 dark:border-zinc-800/50 bg-slate-50 dark:bg-zinc-950/50">
                        <div className="flex items-start justify-between mb-0.5">
                            <h4 className="text-xs font-medium text-slate-900 dark:text-zinc-200">{condition.name}</h4>
                            <span className={cn(
                                "text-[10px] px-1.5 py-0 rounded-full font-medium border",
                                condition.severity === 'moderate' ? "bg-amber-50 dark:bg-amber-900/10 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/30" :
                                    condition.severity === 'severe' ? "bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/30" :
                                        "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-700"
                            )}>
                                {condition.severity}
                            </span>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-slate-500 dark:text-zinc-500">
                            <span>Since: {new Date(condition.diagnosedDate).toLocaleDateString()}</span>
                            <span className="w-0.5 h-0.5 rounded-full bg-slate-300 dark:bg-zinc-700"></span>
                            <span className="capitalize">{condition.status}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function MedicationsCard({ medications }: { medications: Medication[] }) {
    return (
        <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-4 flex flex-col">
            <div className="flex items-center justify-between mb-3 shrink-0">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">
                        <Pill className="h-3.5 w-3.5" />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Current Medications</h3>
                </div>
                <button className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded-md transition-colors">
                    + Add New
                </button>
            </div>

            <div className="space-y-2">
                {medications.map((med) => (
                    <div key={med.id} className="group p-2.5 rounded-lg border border-slate-100 dark:border-zinc-800/50 bg-slate-50 dark:bg-zinc-950/50 hover:border-indigo-200 dark:hover:border-indigo-900/30 transition-colors">
                        <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                                <h4 className="text-xs font-medium text-slate-900 dark:text-zinc-200">{med.name}</h4>
                                <span className="text-[10px] text-slate-500 dark:text-zinc-500 px-1 py-0 rounded bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
                                    {med.dosage}
                                </span>
                            </div>
                            <div className="flex items-center gap-1" title="Adherence Rate">
                                <ShieldCheck className={cn("h-3 w-3", med.adherence >= 90 ? "text-emerald-500" : "text-amber-500")} />
                                <span className={cn("text-[10px] font-medium", med.adherence >= 90 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400")}>
                                    {med.adherence}%
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 text-[10px] text-slate-500 dark:text-zinc-500 mb-1.5">
                            <div className="flex items-center gap-1">
                                <Clock className="h-2.5 w-2.5" />
                                {med.frequency}
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/50 dark:border-zinc-800/50">
                            <span className="text-[9px] text-slate-400 dark:text-zinc-600">Rx: {med.prescribedBy}</span>
                            <span className={cn(
                                "text-[9px] font-medium",
                                med.refillsRemaining <= 1 ? "text-red-500" : "text-slate-500 dark:text-zinc-500"
                            )}>
                                {med.refillsRemaining} refills left
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
