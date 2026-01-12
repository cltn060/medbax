"use client";

import { FileText, ArrowRight, Download } from "lucide-react";
import { LabResult } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export function LabResultsCard({ labs }: { labs: LabResult[] }) {
    return (
        <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-5">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400">
                        <FileText className="h-4 w-4" />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Recent Lab Results</h3>
                </div>
                <button className="flex items-center gap-1 text-xs text-slate-500 dark:text-zinc-500 hover:text-slate-800 dark:hover:text-zinc-300 transition-colors">
                    View All <ArrowRight className="h-3 w-3" />
                </button>
            </div>

            <div className="overflow-x-auto max-h-[300px] scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-zinc-700">
                <table className="w-full text-left border-collapse relative">
                    <thead className="sticky top-0 z-10 bg-white dark:bg-zinc-900 shadow-sm">
                        <tr className="border-b border-slate-100 dark:border-zinc-800">
                            <th className="py-2 text-[11px] font-semibold text-slate-500 dark:text-zinc-500 uppercase tracking-wider">Test Name</th>
                            <th className="py-2 text-[11px] font-semibold text-slate-500 dark:text-zinc-500 uppercase tracking-wider text-right">Value</th>
                            <th className="py-2 text-[11px] font-semibold text-slate-500 dark:text-zinc-500 uppercase tracking-wider text-right lg:table-cell hidden">Reference</th>
                            <th className="py-2 text-[11px] font-semibold text-slate-500 dark:text-zinc-500 uppercase tracking-wider text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-zinc-800/50">
                        {labs.map((lab) => (
                            <tr key={lab.id} className="group hover:bg-slate-50 dark:hover:bg-zinc-900/30 transition-colors">
                                <td className="py-3 text-sm font-medium text-slate-700 dark:text-zinc-300">{lab.testName}</td>
                                <td className="py-3 text-sm text-right font-mono text-slate-600 dark:text-zinc-400">
                                    {lab.value} <span className="text-[10px] text-slate-400">{lab.unit}</span>
                                </td>
                                <td className="py-3 text-xs text-right text-slate-400 dark:text-zinc-600 lg:table-cell hidden">{lab.range}</td>
                                <td className="py-3 text-center">
                                    <span className={cn(
                                        "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium capitalize",
                                        lab.status === 'normal' ? "bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 dark:text-emerald-400" :
                                            lab.status === 'critical' ? "bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400" :
                                                "bg-amber-50 dark:bg-amber-900/10 text-amber-600 dark:text-amber-400"
                                    )}>
                                        {lab.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
