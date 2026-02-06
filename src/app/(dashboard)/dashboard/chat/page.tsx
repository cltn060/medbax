"use client";

import { useQuery } from "convex/react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { api } from "../../../../../convex/_generated/api";
import { ContentSkeleton } from "@/components/ui/skeleton";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { PatientNotFound } from "@/components/ui/PatientNotFound";

function ChatPageContent() {
    const patient = useQuery(api.patients.getMyPatient);
    const searchParams = useSearchParams();
    const landingPromptFromUrl = searchParams.get('landingPrompt');

    // Check localStorage for pending prompt (handles premium/Stripe path)
    const [landingPrompt, setLandingPrompt] = useState<string | undefined>(undefined);

    useEffect(() => {
        // Priority: URL param > localStorage
        if (landingPromptFromUrl) {
            setLandingPrompt(landingPromptFromUrl);
        } else {
            const storedPrompt = localStorage.getItem('pendingPrompt');
            if (storedPrompt) {
                localStorage.removeItem('pendingPrompt');
                setLandingPrompt(storedPrompt);
            }
        }
    }, [landingPromptFromUrl]);

    if (patient === undefined) {
        return <ContentSkeleton />;
    }

    if (patient === null) {
        return <PatientNotFound />;
    }

    // Render ChatInterface without a chatId to indicate "New Chat" mode
    // Pass landingPrompt if present to auto-send after loading
    return (
        <div className="h-full flex flex-col">
            <ChatInterface
                key={landingPrompt ? `landing-${landingPrompt}` : "welcome"}
                patientId={patient._id}
                landingPrompt={landingPrompt}
            />
        </div>
    );
}

export default function ChatListPage() {
    return (
        <Suspense fallback={<ContentSkeleton />}>
            <ChatPageContent />
        </Suspense>
    );
}
