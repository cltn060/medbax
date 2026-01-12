"use client";

import Link from "next/link";
import { Database, FileText, Settings, ChevronRight } from "lucide-react";

export default function AdminPage() {
    const adminSections = [
        {
            title: "Knowledge Bases",
            description: "Manage RAG knowledge bases and uploaded documents",
            icon: Database,
            href: "/admin/knowledge-base",
            count: null,
        },
        {
            title: "Document Review",
            description: "Review and approve patient-uploaded documents",
            icon: FileText,
            href: "/admin/documents",
            count: null,
        },
        {
            title: "Settings",
            description: "Configure system settings and preferences",
            icon: Settings,
            href: "/admin/settings",
            count: null,
        },
    ];

    return (
        <div className="w-full space-y-6 pb-10">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    Admin Dashboard
                </h1>
                <p className="text-sm text-slate-500 dark:text-zinc-400">
                    Manage knowledge bases, documents, and system settings
                </p>
            </div>

            {/* Admin Sections Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {adminSections.map((section) => (
                    <Link key={section.href} href={section.href}>
                        <div className="group p-5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all cursor-pointer">
                            <div className="flex items-start justify-between">
                                <div className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                                    <section.icon className="h-5 w-5" />
                                </div>
                                <ChevronRight className="h-5 w-5 text-slate-300 dark:text-zinc-600 group-hover:text-indigo-500 transition-colors" />
                            </div>
                            <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-white">
                                {section.title}
                            </h3>
                            <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
                                {section.description}
                            </p>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
