import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    description?: string;
    className?: string;
}

export function StatCard({ title, value, icon: Icon, description, className }: StatCardProps) {
    return (
        <div className={cn(
            "rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-6 transition-all duration-200 hover:border-indigo-200 dark:hover:border-indigo-800/50 hover:shadow-lg hover:shadow-indigo-500/5",
            className
        )}>
            <div className="flex flex-row items-start justify-between">
                <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">{title}</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{value}</p>
                    {description && (
                        <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">{description}</p>
                    )}
                </div>
                <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">
                    <Icon className="h-5 w-5" />
                </div>
            </div>
        </div>
    );
}
