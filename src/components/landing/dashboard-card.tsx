"use client";

import { ReactNode } from "react";
import { Bot, LucideIcon } from "lucide-react";

interface DashboardCardProps {
    title: string;
    icon?: LucideIcon;
    children: ReactNode;
    className?: string;
}

export function DashboardCard({ title, icon: Icon, children, className = "" }: DashboardCardProps) {
    return (
        <div className={`bg-white rounded-xl p-0 shadow-2xl border border-white/40 overflow-hidden flex flex-col ${className}`}>
            <div className="flex items-center gap-2 px-3 py-2 bg-zinc-50/80 border-b border-zinc-100 backdrop-blur-sm">
                <div className="bg-black/5 p-1 rounded-md">
                    {Icon ? <Icon size={10} className="text-black" /> : <Bot size={10} className="text-black" />}
                </div>
                <h3 className="text-[10px] font-bold text-zinc-700 uppercase tracking-wide">{title}</h3>
                <div className="ml-auto flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-200"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-200"></div>
                </div>
            </div>
            <div className="p-3 flex-1 flex flex-col justify-center">
                {children}
            </div>
        </div>
    );
}
