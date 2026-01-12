"use client";

import { use } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { ChatSkeleton } from "@/components/ui/skeleton";
import { Id } from "../../../../../../convex/_generated/dataModel";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { PatientNotFound } from "@/components/ui/PatientNotFound";

interface ChatPageProps {
    params: Promise<{ chatId: string }>;
}

export default function ChatPage({ params }: ChatPageProps) {
    const { chatId } = use(params);
    const patient = useQuery(api.patients.getMyPatient);
    const chat = useQuery(api.chats.getChat, { chatId: chatId as Id<"chats"> });

    // Only show skeleton if patient is still loading
    if (patient === undefined) {
        return <ChatSkeleton />;
    }

    if (patient === null) {
        return <PatientNotFound />;
    }

    // Chat is explicitly not found (null, not undefined which means loading)
    if (chat === null) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <p className="text-sm text-slate-500 dark:text-zinc-400 mb-4">Chat not found</p>
                <Link
                    href="/dashboard/chat"
                    className="inline-flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                    <ArrowLeft className="h-3 w-3" />
                    Back to chats
                </Link>
            </div>
        );
    }

    // Show chat interface
    // Header will be rendered inside ChatInterface to avoid overlapping PDF viewer
    return (
        <div className="h-full">
            <ChatInterface chatId={chatId} patientId={patient._id} />
        </div>
    );
}
