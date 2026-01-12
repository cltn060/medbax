"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { ContentSkeleton } from "@/components/ui/skeleton";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { PatientNotFound } from "@/components/ui/PatientNotFound";

export default function ChatListPage() {
    const patient = useQuery(api.patients.getMyPatient);

    if (patient === undefined) {
        return <ContentSkeleton />;
    }

    if (patient === null) {
        return <PatientNotFound />;
    }

    // Render ChatInterface without a chatId to indicate "New Chat" mode
    return (
        <div className="h-full flex flex-col">
            <ChatInterface key="welcome" patientId={patient._id} />
        </div>
    );
}
