"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { Database, ChevronRight, FileText, Check, X } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";

interface KnowledgeBaseBrowserProps {
    isOpen: boolean;
    onClose: () => void;
    selectedKB: string | null;
    onSelectKB: (chromaCollectionId: string | null) => void;
}

export function KnowledgeBaseBrowser({
    isOpen,
    onClose,
    selectedKB,
    onSelectKB,
}: KnowledgeBaseBrowserProps) {
    const [expandedKB, setExpandedKB] = useState<Id<"knowledgeBases"> | null>(null);

    // Fetch public knowledge bases
    const knowledgeBases = useQuery(api.knowledgeBases.listPublic);

    // Fetch documents for expanded KB
    const documents = useQuery(
        api.knowledgeBases.listPublicDocuments,
        expandedKB ? { knowledgeBaseId: expandedKB } : "skip"
    );

    if (!isOpen) return null;

    const handleKBClick = (kbId: Id<"knowledgeBases">) => {
        setExpandedKB(expandedKB === kbId ? null : kbId);
    };

    const handleSelectAsContext = (chromaCollectionId: string) => {
        onSelectKB(chromaCollectionId);
        onClose();
    };

    return (
        <div className="w-72 h-full bg-slate-50 dark:bg-zinc-950 border-r border-slate-200 dark:border-zinc-800 flex flex-col animate-slide-in-left shrink-0">
            {/* Panel Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-indigo-500" />
                    <span className="text-sm font-medium text-slate-900 dark:text-white">Knowledge Bases</span>
                </div>
                <button
                    onClick={onClose}
                    className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>

            {/* KB List */}
            <div className="flex-1 overflow-y-auto p-2">
                {!knowledgeBases ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="h-5 w-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : knowledgeBases.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 dark:text-zinc-500 text-sm">
                        No knowledge bases available
                    </div>
                ) : (
                    <div className="space-y-2">
                        {knowledgeBases.map((kb) => {
                            const isExpanded = expandedKB === kb._id;
                            const isSelected = selectedKB === kb.chromaCollectionId;

                            return (
                                <div
                                    key={kb._id}
                                    className={cn(
                                        "rounded-lg border transition-all",
                                        isSelected
                                            ? "border-indigo-400 dark:border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/10"
                                            : "border-slate-200 dark:border-zinc-700 hover:border-slate-300 dark:hover:border-zinc-600"
                                    )}
                                >
                                    {/* KB Header */}
                                    <div
                                        className={cn(
                                            "flex items-center gap-2 px-3 py-2.5 cursor-pointer transition-all",
                                            isExpanded ? "rounded-t-md" : "rounded-md",
                                            isSelected
                                                ? "bg-indigo-50 dark:bg-indigo-900/20"
                                                : "hover:bg-slate-50 dark:hover:bg-zinc-800/50"
                                        )}
                                        onClick={() => handleKBClick(kb._id)}
                                    >
                                        <ChevronRight
                                            className={cn(
                                                "h-4 w-4 text-slate-400 transition-transform shrink-0",
                                                isExpanded && "rotate-90"
                                            )}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className={cn(
                                                    "text-sm font-medium truncate",
                                                    isSelected
                                                        ? "text-indigo-700 dark:text-indigo-300"
                                                        : "text-slate-700 dark:text-zinc-300"
                                                )}>
                                                    {kb.name}
                                                </span>
                                                {isSelected && (
                                                    <Check className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                                                )}
                                            </div>
                                            <div className="text-[10px] text-slate-500 dark:text-zinc-500">
                                                {kb.documentCount} document{kb.documentCount !== 1 ? "s" : ""}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expanded Content */}
                                    {isExpanded && (
                                        <div className="bg-slate-50/50 dark:bg-zinc-900/50 border-t border-slate-200 dark:border-zinc-700">
                                            {/* Use as Context Button */}
                                            <button
                                                onClick={() => handleSelectAsContext(kb.chromaCollectionId)}
                                                className={cn(
                                                    "w-full flex items-center gap-2 px-4 py-2 text-xs font-medium transition-colors border-b border-slate-100 dark:border-zinc-800",
                                                    isSelected
                                                        ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/10"
                                                        : "text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                                                )}
                                            >
                                                {isSelected ? (
                                                    <>
                                                        <Check className="h-3.5 w-3.5" />
                                                        Currently Selected
                                                    </>
                                                ) : (
                                                    <>
                                                        <Database className="h-3.5 w-3.5" />
                                                        Use as Context
                                                    </>
                                                )}
                                            </button>

                                            {/* Documents List */}
                                            <div className="max-h-48 overflow-y-auto">
                                                {!documents ? (
                                                    <div className="flex items-center justify-center py-4">
                                                        <div className="h-4 w-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                                    </div>
                                                ) : documents.length === 0 ? (
                                                    <div className="text-center py-4 text-slate-400 dark:text-zinc-600 text-xs">
                                                        No documents yet
                                                    </div>
                                                ) : (
                                                    <div className="py-1">
                                                        {documents.map((doc) => (
                                                            <div
                                                                key={doc._id}
                                                                className="flex items-center gap-2 px-4 py-1.5 text-xs text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800/50"
                                                            >
                                                                <FileText className="h-3.5 w-3.5 text-slate-400 dark:text-zinc-500 shrink-0" />
                                                                <span className="truncate">{doc.filename}</span>
                                                                {doc.pageCount && (
                                                                    <span className="text-[10px] text-slate-400 dark:text-zinc-600 shrink-0">
                                                                        {doc.pageCount}p
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* KB Description */}
                                            {kb.description && (
                                                <div className="px-4 py-2 border-t border-slate-100 dark:border-zinc-800">
                                                    <p className="text-[10px] text-slate-500 dark:text-zinc-500 line-clamp-2">
                                                        {kb.description}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Footer hint */}
            <div className="px-4 py-2 border-t border-slate-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50">
                <p className="text-[10px] text-slate-400 dark:text-zinc-600 text-center">
                    Click a KB to select it as chat context
                </p>
            </div>
        </div>
    );
}
