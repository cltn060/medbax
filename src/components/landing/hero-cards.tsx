"use client";

import {
    ArrowRight,
    Database,
    FileText,
    Search,
    AlertCircle,
    Check,
    ScrollText,
    BrainCircuit,
} from "lucide-react";

// Card 1: RAG
export function SourceRetrievalCard() {
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between text-[9px] text-zinc-500 mb-1">
                <span>Querying Knowledge Base...</span>
                <span className="text-black font-mono font-bold">42ms</span>
            </div>
            <div className="flex items-center gap-2 p-1.5 bg-zinc-100 rounded border border-zinc-200">
                <div className="bg-white p-1 rounded border border-zinc-200 shadow-sm">
                    <FileText size={8} className="text-black" />
                </div>
                <div className="flex-1">
                    <div className="flex justify-between items-center">
                        <p className="text-[9px] font-bold text-black leading-none">AHA_Hypertension_2024.pdf</p>
                        <span className="text-[8px] bg-black text-white px-1 rounded-full font-bold">98%</span>
                    </div>
                    <p className="text-[8px] text-zinc-500 mt-0.5 leading-none">Pg. 42 • Section 3.2: Beta-blockers</p>
                </div>
            </div>
            <div className="flex items-center gap-2 p-1.5 bg-white rounded border border-zinc-100 opacity-80">
                <div className="bg-zinc-50 p-1 rounded border border-zinc-200">
                    <Database size={8} className="text-zinc-400" />
                </div>
                <div className="flex-1">
                    <div className="flex justify-between items-center">
                        <p className="text-[9px] font-bold text-zinc-700 leading-none">JACC_Asthma_Contra.pdf</p>
                        <span className="text-[8px] bg-zinc-100 text-zinc-600 px-1 rounded-full font-bold">85%</span>
                    </div>
                    <p className="text-[8px] text-zinc-400 mt-0.5 leading-none">Table 4: Adverse Reactions</p>
                </div>
            </div>
        </div>
    );
}

// Card 2: AI Logic
export function AIAnalysisCard() {
    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
                <BrainCircuit size={12} className="text-black" />
                <span className="text-[10px] font-bold text-zinc-700">Clinical Reasoning Engine</span>
            </div>
            <div className="space-y-1.5 relative pl-2 border-l border-zinc-200 ml-1">
                <div className="flex items-center gap-2 relative">
                    <div className="absolute -left-[13px] w-2 h-2 rounded-full bg-zinc-400 border-2 border-white ring-1 ring-zinc-100"></div>
                    <span className="text-[9px] text-zinc-600">Extract Entities: <span className="font-mono bg-zinc-100 px-1 rounded text-zinc-800">&quot;Asthma&quot;</span></span>
                </div>
                <div className="flex items-center gap-2 relative">
                    <div className="absolute -left-[13px] w-2 h-2 rounded-full bg-black border-2 border-white ring-1 ring-black/20 animate-pulse"></div>
                    <span className="text-[9px] font-bold text-black">Checking Contraindications...</span>
                </div>
                <div className="flex items-center gap-2 relative opacity-50">
                    <div className="absolute -left-[13px] w-2 h-2 rounded-full bg-zinc-200 border-2 border-white"></div>
                    <span className="text-[9px] text-zinc-400">Synthesizing Recommendation</span>
                </div>
            </div>
        </div>
    );
}

// Card 3: Chat
export function LiveChatCard() {
    return (
        <div className="flex flex-col h-full justify-between">
            <div className="space-y-3">
                <div className="flex justify-end">
                    <div className="bg-black text-white text-[10px] py-2 px-3 rounded-2xl rounded-tr-sm max-w-[92%] shadow-md">
                        Patient has stage 2 HTN and history of severe asthma. Is Propranolol safe?
                    </div>
                </div>
                <div className="flex justify-start items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-black to-zinc-600 flex-shrink-0 flex items-center justify-center text-[8px] text-white font-bold">MB</div>
                    <div className="bg-white text-zinc-700 text-[10px] p-2.5 rounded-2xl rounded-tl-sm max-w-[95%] border border-zinc-100 shadow-sm">
                        <div className="flex items-center gap-1.5 text-zinc-800 font-bold mb-1.5 text-[9px]">
                            <AlertCircle size={10} />
                            <span>Contraindication Alert</span>
                        </div>
                        <p className="leading-relaxed mb-2">
                            Non-selective beta-blockers like <strong>Propranolol</strong> are contraindicated.
                        </p>
                        <div className="bg-zinc-50 border border-zinc-200 rounded p-1.5">
                            <span className="text-[9px] font-semibold text-black">Recommendation:</span>
                            <p className="text-[9px] text-zinc-600">Consider cardio-selective agents (e.g., Metoprolol).</p>
                        </div>
                    </div>
                </div>
            </div>
            <div className="mt-1 relative">
                <div className="h-8 w-full bg-zinc-50 rounded-full border border-zinc-200 flex items-center px-3 text-[10px] text-zinc-400">
                    Ask a follow up...
                </div>
                <div className="absolute right-1 top-1 bottom-1 aspect-square bg-black rounded-full flex items-center justify-center hover:bg-zinc-800 transition-colors cursor-pointer">
                    <ArrowRight size={10} className="text-white" />
                </div>
            </div>
        </div>
    );
}

// Card 4: Verification
export function CitationCard() {
    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2 border-b border-zinc-50 pb-1">
                <Search size={10} className="text-zinc-400" />
                <span className="text-[9px] text-zinc-500 font-medium">Fact Verification Layer</span>
            </div>
            <div className="space-y-1.5">
                <div className="flex items-start gap-2 p-1.5 bg-zinc-50 border border-zinc-200 rounded">
                    <div className="bg-white rounded-full p-0.5 shadow-sm mt-0.5">
                        <Check size={8} className="text-black" />
                    </div>
                    <div>
                        <p className="text-[9px] font-bold text-black leading-tight">Propranolol causes bronchoconstriction</p>
                        <p className="text-[8px] text-zinc-500 mt-0.5">Source: FDA Label (Inderal) • Section 5.1</p>
                    </div>
                </div>
                <div className="flex items-start gap-2 p-1.5 bg-white border border-zinc-100 rounded opacity-60">
                    <div className="bg-white rounded-full p-0.5 shadow-sm mt-0.5">
                        <Check size={8} className="text-zinc-400" />
                    </div>
                    <div>
                        <p className="text-[9px] font-medium text-zinc-600 leading-tight">Asthma Precaution</p>
                        <p className="text-[8px] text-zinc-500 mt-0.5">Source: NIH Guidelines 2023</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Card 5: Summary
export function SummaryCard() {
    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-1.5">
                <span className="text-[9px] text-zinc-500 font-medium">Auto-Drafted Note</span>
                <ScrollText size={10} className="text-black" />
            </div>
            <div className="flex-1 bg-zinc-50 rounded border border-zinc-200 p-2 font-mono text-[9px] text-zinc-600 leading-relaxed overflow-hidden relative">
                <p><span className="font-bold text-zinc-900">S:</span> Hx asthma, new HTN.</p>
                <p><span className="font-bold text-zinc-900">O:</span> BP Uncontrolled.</p>
                <p><span className="font-bold text-zinc-900">A:</span> Contraindication identified for non-selective BB.</p>
                <p><span className="font-bold text-zinc-900">P:</span> Avoid Propranolol.</p>
                <div className="absolute bottom-0 left-0 w-full h-4 bg-gradient-to-t from-zinc-50 to-transparent"></div>
            </div>
            <button className="mt-1.5 w-full bg-black hover:bg-zinc-800 text-white text-[9px] font-bold py-1 rounded transition-colors">
                Export to EHR
            </button>
        </div>
    );
}
