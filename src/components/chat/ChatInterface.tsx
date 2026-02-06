"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "../../../convex/_generated/api";
import { Bot, Sparkles, Plus, Image, ArrowUp, History, Loader2, Database, ChevronDown, ExternalLink, ArrowLeft, X, Zap, User, Trash2, Info, Pill, Heart, FileText, Microscope, AlertCircle, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Id } from "../../../convex/_generated/dataModel";
import { HealthSnapshotPanel } from "./HealthSnapshotPanel";
import { KnowledgeBaseBrowser } from "./KnowledgeBaseBrowser";
import { queryKnowledgeBaseStream, generalChatStream } from "@/lib/rag-api";
import ReactMarkdown from 'react-markdown';
import { useSubscription } from "@/hooks/useSubscription";
import { UpgradePrompt } from "@/components/subscription";
import dynamic from "next/dynamic";
const PDFViewer = dynamic(() => import("./PDFViewer").then(mod => mod.PDFViewer), {
    ssr: false,
    loading: () => null
});

interface ChatInterfaceProps {
    chatId?: string;
    patientId: string;
    landingPrompt?: string; // Prompt from landing page before login
}

interface Source {
    title: string;
    snippet?: string;
    sourceType?: "kb_document" | "patient_document" | "chat_attachment";
    kbDocumentId?: Id<"knowledgeBaseDocuments">;
    patientDocumentId?: Id<"documents">;
    chatAttachmentId?: string;
    pageNumber?: number;
    chromaDocumentId?: string; // For indexed KB doc lookup
}

export function ChatInterface({ chatId, patientId, landingPrompt }: ChatInterfaceProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Query messages only if we have a chatId
    const messages = useQuery(
        api.chats.getMessages,
        chatId ? { chatId: chatId as Id<"chats"> } : "skip"
    ) || [];

    const sendMessageMutation = useMutation(api.chats.sendMessage);
    const createChatMutation = useMutation(api.chats.createChat);
    const incrementQueryCount = useMutation(api.subscriptionUsage.incrementQueryCount);
    const deleteChat = useMutation(api.chats.deleteChat);
    const updateChatKB = useMutation(api.chats.updateChatKB);
    const currentUser = useQuery(api.users.current);
    const currentChat = useQuery(api.chats.getChat, chatId ? { chatId: chatId as Id<"chats"> } : "skip");
    const chatsList = useQuery(api.chats.listChats, { patientId: patientId as Id<"patients"> });

    // Subscription & Usage
    const { tier, queryLimit } = useSubscription();
    const usage = useQuery(api.subscriptionUsage.getCurrentUsage);
    const queryCount = usage?.queryCount ?? 0;
    const isAtLimit = queryCount >= queryLimit;
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const kbDropdownRef = useRef<HTMLDivElement>(null);

    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const [selectedKB, setSelectedKB] = useState<string | null>(null);
    const [isKBDropdownOpen, setIsKBDropdownOpen] = useState(false);
    const [streamingResponse, setStreamingResponse] = useState("");
    const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);

    // Optimistic UI with stable clientId
    const [optimisticUserMessage, setOptimisticUserMessage] = useState<{ content: string; clientId: string } | null>(null);
    const [failedMessages, setFailedMessages] = useState<Set<string>>(new Set());
    const [pendingAssistantClientId, setPendingAssistantClientId] = useState<string | null>(null);


    // PDF Viewer State
    const [viewingDocument, setViewingDocument] = useState<{ filename: string; page: number } | null>(null);

    // KB Browser Panel State - collapsed by default
    const isNewChat = searchParams.get('new') === 'true';
    const [kbBrowserOpen, setKbBrowserOpen] = useState(false);

    // Health Snapshot Panel State - collapsed by default
    const [healthPanelOpen, setHealthPanelOpen] = useState(false);

    // Include MedBax Profile toggle - when enabled, includes patient context in prompts
    const [includeProfile, setIncludeProfile] = useState(true);

    // Query patient data for health snapshot
    const patient = useQuery(api.patients.get, { id: patientId as Id<"patients"> });

    // Find the specific source object from message history
    const viewingSource = viewingDocument ?
        messages.flatMap(m => m.sources || []).find(s => s.title === viewingDocument.filename)
        : null;

    // Determine document type from explicit sourceType field
    const sourceType = viewingSource?.sourceType || "kb_document"; // Default to kb_document

    // Strategy A: Fetch Patient Document (by ID)
    const patientDoc = useQuery(api.documents.getDocument,
        sourceType === "patient_document" && viewingSource?.patientDocumentId
            ? { id: viewingSource.patientDocumentId }
            : "skip"
    );

    // Strategy B: Fetch KB Document by chromaDocumentId (preferred - uses index)
    const kbDocByChroma = useQuery(api.knowledgeBases.getKbDocumentByChromaId,
        viewingSource?.chromaDocumentId
            ? { chromaDocumentId: viewingSource.chromaDocumentId }
            : "skip"
    );

    // Strategy C: Fallback - Fetch KB Document by filename (always try when viewing a document)
    const kbDocUrlFallback = useQuery(api.knowledgeBases.getDocumentUrlByFilename,
        viewingDocument
            ? { filename: viewingDocument.filename }
            : "skip"
    );

    // Resolve URL based on source type (chromaId lookup preferred over filename)
    const resolvedUrl =
        sourceType === "patient_document" ? patientDoc?.fileUrl :
            (kbDocByChroma?.url || kbDocUrlFallback);

    // Calculate loading state specifically for the URL resolution
    // If resolvedUrl is null, it means we finished loading but found nothing.
    // We only want to show loading if the specific queries we depend on are still undefined (Convex loading state)
    const isLoadingUrl = sourceType === "patient_document"
        ? patientDoc === undefined
        : (
            viewingSource?.chromaDocumentId
                ? (kbDocByChroma === undefined || (kbDocByChroma === null && kbDocUrlFallback === undefined))
                : (kbDocUrlFallback === undefined)
        );

    // Query public knowledge bases for selector
    const publicKBs = useQuery(api.knowledgeBases.listPublic);

    // Combine real messages with optimistic/pending messages for display
    const [showPendingAssistant, setShowPendingAssistant] = useState(false);

    // Show assistant response indicator immediately
    useEffect(() => {
        if (chatId && (isWaitingForResponse || streamingResponse)) {
            setShowPendingAssistant(true);
        } else {
            setShowPendingAssistant(false);
        }
    }, [chatId, isWaitingForResponse, streamingResponse]);

    // Check if the pending assistant message has already been saved to DB
    const pendingAssistantSaved = pendingAssistantClientId
        ? messages.some(m => m.clientId === pendingAssistantClientId)
        : false;

    const displayMessages = [
        ...messages,
        ...(chatId && optimisticUserMessage ? [{
            role: "user" as const,
            content: optimisticUserMessage.content,
            clientId: optimisticUserMessage.clientId,
            _id: `optimistic-${optimisticUserMessage.clientId}`
        }] : []),
        // Only show pending assistant if not already saved to DB
        ...(chatId && showPendingAssistant && (isWaitingForResponse || streamingResponse) && !pendingAssistantSaved ? [{
            role: "assistant" as const,
            content: streamingResponse || "__TYPING__",
            clientId: pendingAssistantClientId,
            _id: `pending-${pendingAssistantClientId || 'assistant'}`
        }] : []),
    ];

    // Auto-scroll to bottom on new messages (including optimistic)
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [displayMessages.length, streamingResponse, viewingDocument]); // Scroll when any message appears

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [input]);

    // Close KB dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (kbDropdownRef.current && !kbDropdownRef.current.contains(event.target as Node)) {
                setIsKBDropdownOpen(false);
            }
        };

        if (isKBDropdownOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isKBDropdownOpen]);

    // Initialize selectedKB from chat's persisted knowledgeBaseId
    // Only update if the chat has an explicitly set KB (null means "no KB", undefined means "not loaded yet")
    useEffect(() => {
        if (currentChat && currentChat.knowledgeBaseId !== undefined) {
            // Chat has an explicitly set KB (could be null for "no KB" or a string for a specific KB)
            setSelectedKB(currentChat.knowledgeBaseId);
        }
    }, [currentChat]);

    // Default to isDefault KB for new intent
    useEffect(() => {
        if (!chatId && publicKBs && publicKBs.length > 0 && !selectedKB) {
            // Find default KB or fallback to first one
            const defaultKB = publicKBs.find(kb => kb.isDefault);

            if (defaultKB) {
                setSelectedKB(defaultKB.chromaCollectionId);
            } else {
                setSelectedKB(publicKBs[0].chromaCollectionId);
            }
        }
    }, [chatId, publicKBs, selectedKB]);

    // Auto-send landing prompt from pre-login landing page
    const landingPromptSent = useRef(false);
    useEffect(() => {
        if (landingPrompt && !landingPromptSent.current && !sending && publicKBs !== undefined) {
            landingPromptSent.current = true;
            // Clean up the URL by removing the query parameter
            router.replace('/dashboard/chat');
            // Auto-send the prompt
            handleSend(landingPrompt);
        }
    }, [landingPrompt, sending, publicKBs]);

    // Handle pending AI response after navigation
    const pendingQueryProcessed = useRef(false);
    useEffect(() => {
        const pendingQuery = searchParams.get('pending');
        const pendingKB = searchParams.get('kb');

        if (!pendingQuery || !chatId || pendingQueryProcessed.current) return;

        // Mark as processed to prevent duplicate execution
        pendingQueryProcessed.current = true;

        router.replace(`/dashboard/chat/${chatId}`);

        const fetchAIResponse = async () => {
            // Generate stable clientId for assistant response
            const assistantClientId = crypto.randomUUID();
            setPendingAssistantClientId(assistantClientId);
            setIsWaitingForResponse(true);

            let fullResponse = "";

            const handleChunk = (chunk: string) => {
                fullResponse += chunk;
                setStreamingResponse(fullResponse);
                setIsWaitingForResponse(false);
            };

            const handleError = (error: Error) => {
                console.error("Chat error:", error);
                setIsWaitingForResponse(false);
                setPendingAssistantClientId(null);
            };

            const handleComplete = async (sources?: { title: string; snippet: string; sourceType: "kb_document" | "patient_document" | "chat_attachment"; chromaDocumentId?: string; pageNumber?: number }[]) => {
                // Convert RAG sources to schema-compatible format
                const formattedSources = sources?.map(s => ({
                    title: s.title,
                    snippet: s.snippet,
                    sourceType: s.sourceType,
                    chromaDocumentId: s.chromaDocumentId, // For indexed lookup
                    pageNumber: s.pageNumber,
                }));

                await sendMessageMutation({
                    chatId: chatId as Id<"chats">,
                    role: "assistant",
                    content: fullResponse,
                    clientId: assistantClientId,
                    sources: formattedSources,
                });
                setStreamingResponse("");
                setIsWaitingForResponse(false);
                setPendingAssistantClientId(null);
            };

            if (pendingKB) {
                await queryKnowledgeBaseStream(pendingKB, pendingQuery, handleChunk, handleError, handleComplete);
            } else {
                await generalChatStream(pendingQuery, handleChunk, handleError, handleComplete);
            }
        };

        // Start AI fetch immediately
        fetchAIResponse();
    }, [chatId, searchParams, router, sendMessageMutation]);

    // Build medical context string from patient data
    const buildMedicalContext = () => {
        if (!patient || !includeProfile) return "";

        const sections = [];

        if (patient.dateOfBirth) {
            sections.push(`Date of Birth: ${patient.dateOfBirth}`);
        }
        if (patient.bloodType) {
            sections.push(`Blood Type: ${patient.bloodType}`);
        }
        if (patient.chronicConditions && patient.chronicConditions.length > 0) {
            sections.push(`Medical Conditions: ${patient.chronicConditions.map((c: any) => c.condition).join(", ")}`);
        }
        if (patient.allergies && patient.allergies.length > 0) {
            sections.push(`Allergies: ${patient.allergies.map((a: any) => `${a.agent} (${a.reactionType})`).join(", ")}`);
        }
        if (patient.medications && patient.medications.length > 0) {
            sections.push(`Current Medications: ${patient.medications.map((m: any) => `${m.name} ${m.dosage}`).join(", ")}`);
        }
        if (patient.surgeries && patient.surgeries.length > 0) {
            sections.push(`Surgical History: ${patient.surgeries.map((s: any) => `${s.procedure} (${s.date || 'unknown date'})`).join(", ")}`);
        }
        if (patient.familyHistory && patient.familyHistory.length > 0) {
            sections.push(`Family History: ${patient.familyHistory.map((f: any) => `${f.relation}: ${f.condition}`).join(", ")}`);
        }
        if (patient.socialHistory) {
            const lifestyleItems = [];
            if (patient.socialHistory.smokingStatus) lifestyleItems.push(`Smoking: ${patient.socialHistory.smokingStatus}`);
            if (patient.socialHistory.alcoholConsumption) lifestyleItems.push(`Alcohol: ${patient.socialHistory.alcoholConsumption}`);
            if (patient.socialHistory.occupation) lifestyleItems.push(`Occupation: ${patient.socialHistory.occupation}`);
            if (lifestyleItems.length > 0) {
                sections.push(`Social History: ${lifestyleItems.join("; ")}`);
            }
        }

        if (sections.length === 0) return "";

        return `[PATIENT MEDICAL CONTEXT]\n${sections.join("\n")}\n[END CONTEXT]\n\n`;
    };

    const handleSend = async (messageOverride?: string, retryClientId?: string) => {
        const messageContent = messageOverride?.trim() || input.trim();
        if (!messageContent || sending) return;

        // Check query limit before sending
        if (isAtLimit) {
            return; // UI should show upgrade prompt
        }

        // Build the full message with optional medical context
        const medicalContext = buildMedicalContext();
        const fullMessage = medicalContext + messageContent;

        // Generate stable clientIds upfront (or reuse if retrying)
        const clientId = retryClientId || crypto.randomUUID();
        const assistantClientId = crypto.randomUUID(); // For the AI response

        setSending(true);
        setStreamingResponse("");
        setIsWaitingForResponse(true);
        setPendingAssistantClientId(assistantClientId); // Set BEFORE typing indicator appears

        // Clear from failed if retrying
        if (retryClientId) {
            setFailedMessages(prev => {
                const next = new Set(prev);
                next.delete(retryClientId);
                return next;
            });
        }

        setOptimisticUserMessage({ content: messageContent, clientId });
        setInput("");

        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }

        try {
            let chatIdToUse = chatId;

            if (!chatIdToUse) {
                const title = messageContent.length > 40
                    ? messageContent.substring(0, 40) + '...'
                    : messageContent;

                const newChatId = await createChatMutation({
                    patientId: patientId as Id<"patients">,
                    title: title,
                    knowledgeBaseId: selectedKB || undefined, // Persist KB selection
                });

                chatIdToUse = newChatId;

                await sendMessageMutation({
                    chatId: newChatId as Id<"chats">,
                    role: "user",
                    content: messageContent,
                    clientId,
                });

                setOptimisticUserMessage(null);
                router.push(`/dashboard/chat/${newChatId}?pending=${encodeURIComponent(fullMessage)}&kb=${selectedKB || ''}&new=true`);
                return;
            }

            await sendMessageMutation({
                chatId: chatIdToUse as Id<"chats">,
                role: "user",
                content: messageContent,
                clientId,
            });

            setOptimisticUserMessage(null);

            if (selectedKB) {
                let fullResponse = "";
                const conversationHistory = messages.map(m => ({
                    role: m.role as "user" | "assistant",
                    content: m.content
                }));

                await queryKnowledgeBaseStream(
                    selectedKB,
                    fullMessage,
                    (chunk) => {
                        fullResponse += chunk;
                        setStreamingResponse(fullResponse);
                        setIsWaitingForResponse(false);
                    },
                    (error) => {
                        console.error("RAG error:", error);
                        setIsWaitingForResponse(false);
                        setPendingAssistantClientId(null);
                    },
                    async (sources) => {
                        // Convert RAG sources to schema-compatible format
                        const formattedSources = sources?.map(s => ({
                            title: s.title,
                            snippet: s.snippet,
                            sourceType: s.sourceType,
                            chromaDocumentId: s.chromaDocumentId, // For indexed lookup
                            pageNumber: s.pageNumber,
                        }));

                        await sendMessageMutation({
                            chatId: chatIdToUse as Id<"chats">,
                            role: "assistant",
                            content: fullResponse,
                            clientId: assistantClientId,
                            sources: formattedSources,
                        });
                        await incrementQueryCount(); // Track usage
                        setStreamingResponse("");
                        setIsWaitingForResponse(false);
                        setPendingAssistantClientId(null);
                    },
                    conversationHistory
                );
            } else {
                let fullResponse = "";
                const conversationHistory = messages.map(m => ({
                    role: m.role as "user" | "assistant",
                    content: m.content
                }));

                await generalChatStream(
                    fullMessage,
                    (chunk) => {
                        fullResponse += chunk;
                        setStreamingResponse(fullResponse);
                        setIsWaitingForResponse(false);
                    },
                    (error) => {
                        console.error("Chat error:", error);
                        setIsWaitingForResponse(false);
                        setPendingAssistantClientId(null);
                    },
                    async () => {
                        await sendMessageMutation({
                            chatId: chatIdToUse as Id<"chats">,
                            role: "assistant",
                            content: fullResponse,
                            clientId: assistantClientId,
                        });
                        await incrementQueryCount(); // Track usage
                        setStreamingResponse("");
                        setIsWaitingForResponse(false);
                        setPendingAssistantClientId(null);
                    },
                    conversationHistory
                );
            }

        } catch (err) {
            console.error("Failed to send:", err);
            // Mark message as failed (keep optimistic message visible with error indicator)
            if (optimisticUserMessage?.clientId) {
                setFailedMessages(prev => new Set(prev).add(optimisticUserMessage.clientId));
            }
        } finally {
            setSending(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // Helper to preprocess content for clickable citations
    const preprocessContent = (content: string) => {
        // Replace [Source: filename.pdf, Page: X, Y, Z] with markdown link
        return content.replace(
            /\[Source: (.*?), Page: ([\d,\s]+)\]/g,
            (match, filename, pages) => {
                // Get first page number for the link
                const firstPage = pages.split(',')[0].trim();
                return `**[${match}](citation:${encodeURIComponent(filename)}?page=${firstPage})**`;
            }
        );
    };

    const isWelcomeMode = !chatId;
    const isLoadingMessages = chatId && messages === undefined;

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-transparent overflow-hidden min-h-0">
            <div className="flex-1 flex overflow-hidden min-h-0">
                {/* Knowledge Base Browser Panel - Left Side */}
                <KnowledgeBaseBrowser
                    isOpen={kbBrowserOpen}
                    onClose={() => setKbBrowserOpen(false)}
                    selectedKB={selectedKB}
                    onSelectKB={(kbId) => {
                        setSelectedKB(kbId);
                        // Persist KB selection to chat if we have an existing chat
                        if (chatId) {
                            updateChatKB({
                                chatId: chatId as Id<"chats">,
                                knowledgeBaseId: kbId ?? undefined
                            });
                        }
                    }}
                />

                {/* Main Chat Area */}
                <div className={cn(
                    "flex flex-col h-full transition-all duration-300 ease-in-out flex-1",
                    viewingDocument && "border-r border-slate-200 dark:border-zinc-800"
                )}>
                    {/* Header - only when in a specific chat */}
                    {!isWelcomeMode && (
                        <div className="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 border-b border-slate-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm shrink-0">
                            <button
                                onClick={() => {
                                    setKbBrowserOpen(!kbBrowserOpen);
                                }}
                                className={cn(
                                    "p-1.5 rounded-md transition-colors",
                                    kbBrowserOpen
                                        ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                                        : "text-slate-400 dark:text-zinc-500 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-600 dark:hover:text-zinc-300"
                                )}
                                title="Knowledge bases"
                            >
                                <Database className="h-4 w-4" />
                            </button>
                            <div className="flex-1 min-w-0">
                                {currentChat ? (
                                    <h1 className="text-sm font-medium text-slate-900 dark:text-white truncate">{currentChat.title}</h1>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="h-3 w-3 text-indigo-500 animate-spin" />
                                        <span className="text-sm text-slate-400">Loading...</span>
                                    </div>
                                )}
                            </div>
                            {/* Health Snapshot Toggle Button */}
                            <button
                                onClick={() => setHealthPanelOpen(!healthPanelOpen)}
                                className={cn(
                                    "p-1.5 rounded-md transition-colors",
                                    healthPanelOpen
                                        ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                                        : "text-slate-400 dark:text-zinc-500 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-600 dark:hover:text-zinc-300"
                                )}
                                title="Health context"
                            >
                                <User className="h-4 w-4" />
                            </button>
                        </div>
                    )}

                    {/* Messages Area */}
                    <div className={cn(
                        "flex-1 scrollbar-hide px-2 md:px-4 py-2 md:py-4 space-y-6",
                        isWelcomeMode ? "overflow-hidden" : (messages.length > 0 ? "overflow-y-auto" : "overflow-hidden")
                    )}>
                        {/* Welcome Screen - ONLY when no chatId */}
                        {isWelcomeMode && (
                            <div className="flex flex-col h-full max-w-3xl mx-auto w-full justify-center px-2 md:px-4">
                                <h1 className="text-2xl sm:text-3xl md:text-5xl font-medium text-slate-900 dark:text-white mb-1 md:mb-2 font-kalice tracking-tight animate-fade-in-up">
                                    Hi there, <span className="text-slate-500 dark:text-zinc-500">{currentUser?.name?.split(' ')[0] || 'User'}</span>
                                </h1>
                                <h2 className="text-2xl sm:text-3xl md:text-5xl font-medium text-slate-400 dark:text-zinc-500 mb-4 md:mb-8 font-kalice tracking-tight animate-fade-in-up [animation-delay:100ms]">
                                    Your Personal Healthcare Companion
                                </h2>

                                <div className="text-xs md:text-sm text-slate-500 dark:text-zinc-500 mb-3 md:mb-6 animate-fade-in-up [animation-delay:200ms]">
                                    I analyze your health records and trusted medical knowledge bases to provide personalized answers to your health questions.
                                </div>

                                {/* Prompt Suggestions - 2 on mobile, 4 on desktop */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3 mb-4 md:mb-8">
                                    {[
                                        {
                                            title: "Review my recent lab results",
                                            subtitle: "and explain what they mean",
                                            icon: <Microscope className="w-5 h-5 text-slate-500 dark:text-zinc-400" />,
                                            prompt: "Can you review my recent lab results and explain what they mean in simple terms?"
                                        },
                                        {
                                            title: "Explain my medications",
                                            subtitle: "and potential interactions",
                                            icon: <Pill className="w-5 h-5 text-slate-500 dark:text-zinc-400" />,
                                            prompt: "Can you explain my current medications, their purposes, and any potential interactions I should be aware of?"
                                        },
                                        {
                                            title: "Help me understand my",
                                            subtitle: "chronic condition better",
                                            icon: <Heart className="w-5 h-5 text-slate-500 dark:text-zinc-400" />,
                                            prompt: "I'd like to better understand my chronic condition. Can you provide information about management strategies and lifestyle considerations?",
                                            hideOnMobile: true
                                        },
                                        {
                                            title: "Create a health summary",
                                            subtitle: "for my upcoming appointment",
                                            icon: <FileText className="w-5 h-5 text-slate-500 dark:text-zinc-400" />,
                                            prompt: "Can you create a summary of my health history and current concerns for my upcoming doctor's appointment?",
                                            hideOnMobile: true
                                        }
                                    ].map((prompt, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handleSend(prompt.prompt)}
                                            className={cn(
                                                "text-left p-3 md:p-4 rounded-xl border border-slate-200/60 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-md hover:bg-white/80 dark:hover:bg-white/10 transition-all duration-200 group hover:scale-[1.02] hover:shadow-lg hover:shadow-indigo-500/10 animate-fade-in-up",
                                                (prompt as any).hideOnMobile && "hidden sm:block"
                                            )}
                                            style={{ animationDelay: `${300 + i * 75}ms` }}
                                        >
                                            <div className="text-xs md:text-sm font-medium text-slate-800 dark:text-zinc-200">{prompt.title}</div>
                                            <div className="text-xs md:text-sm text-slate-500 dark:text-zinc-500 mb-2 md:mb-4">{prompt.subtitle}</div>
                                            <div className="flex justify-between items-end">
                                                <span className="text-base md:text-lg opacity-60 group-hover:opacity-100 transition-opacity">{prompt.icon}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                <div className="hidden md:flex items-center gap-4">
                                    <button className="flex items-center gap-2 text-xs text-slate-500 dark:text-zinc-500 hover:text-slate-800 dark:hover:text-zinc-300 transition-colors w-fit">
                                        <Sparkles className="h-3.5 w-3.5" />
                                        Refresh Prompts
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Loading indicator when chatId exists but messages loading */}
                        {isLoadingMessages && (
                            <div className="flex items-center justify-center h-full">
                                <Loader2 className="h-6 w-6 text-indigo-500 animate-spin" />
                            </div>
                        )}

                        {/* Empty state for new chats */}
                        {chatId && messages && messages.length === 0 && !streamingResponse && (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                                <h3 className="text-lg font-medium text-slate-800 dark:text-zinc-200 mb-1">Start a conversation</h3>
                                <p className="text-sm text-slate-500 dark:text-zinc-500 max-w-xs">
                                    Ask me anything about your patient's health or medical questions.
                                </p>
                            </div>
                        )}

                        {/* Messages List */}
                        <div className="max-w-3xl mx-auto w-full space-y-6">
                            {displayMessages.map((msg, idx) => {
                                // Use clientId as stable key to prevent re-animation
                                const messageKey = ('clientId' in msg && msg.clientId) || msg._id || idx;
                                const isFailed = 'clientId' in msg && msg.clientId && failedMessages.has(msg.clientId);

                                return (
                                    <div
                                        key={messageKey}
                                        className={cn(
                                            "flex w-full items-end gap-2",
                                            msg.role === "user" ? "justify-end animate-slide-in-right" : "justify-start animate-slide-in-left"
                                        )}
                                    >
                                        {/* Error indicator for failed messages (iMessage style) */}
                                        {msg.role === "user" && isFailed && (
                                            <button
                                                onClick={() => handleSend(msg.content, 'clientId' in msg ? msg.clientId : undefined)}
                                                className="flex items-center gap-1 p-1.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors group"
                                                title="Failed to send. Tap to retry."
                                            >
                                                <AlertCircle className="h-4 w-4" />
                                                <RotateCcw className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </button>
                                        )}
                                        <div className={cn(
                                            "rounded-2xl px-4 py-2.5 transition-all duration-200 overflow-hidden",
                                            msg.role === "user" ? "max-w-[85%]" : "max-w-full",
                                            msg.role === "user"
                                                ? isFailed
                                                    ? "bg-indigo-400 text-white/80" // Dimmed for failed
                                                    : "bg-indigo-600 text-white"
                                                : "bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white"
                                        )}>
                                            {msg.role === "assistant" && (
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">MedBax AI</span>
                                                    {msg.content === "__TYPING__" || msg._id === "pending-assistant" && streamingResponse ? (
                                                        <Loader2 className="h-3 w-3 text-indigo-500 animate-spin" />
                                                    ) : null}
                                                </div>
                                            )}

                                            {/* Typing indicator dots */}
                                            {msg.content === "__TYPING__" ? (
                                                <div className="flex items-center gap-1 py-1">
                                                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:0ms]"></span>
                                                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:150ms]"></span>
                                                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:300ms]"></span>
                                                </div>
                                            ) : (
                                                <div className="text-sm leading-relaxed markdown-content break-words overflow-x-auto">
                                                    <ReactMarkdown
                                                        urlTransform={(url) => url}
                                                        components={{
                                                            // Handle citation clicks
                                                            a: ({ node, href, children, ...props }) => {
                                                                if (href?.startsWith('citation:')) {
                                                                    // Extract filename and page from href
                                                                    // citation:filename.pdf?page=X
                                                                    const [filePart, queryPart] = href.replace('citation:', '').split('?');
                                                                    const pageMatch = queryPart?.match(/page=(\d+)/);
                                                                    const page = pageMatch ? parseInt(pageMatch[1]) : 1;

                                                                    const decodedFilename = decodeURIComponent(filePart);

                                                                    return (
                                                                        <span
                                                                            role="button"
                                                                            tabIndex={0}
                                                                            onClick={(e) => {
                                                                                e.preventDefault();
                                                                                e.stopPropagation();
                                                                                setViewingDocument({ filename: decodedFilename, page });
                                                                            }}
                                                                            onKeyDown={(e) => {
                                                                                if (e.key === 'Enter' || e.key === ' ') {
                                                                                    e.preventDefault();
                                                                                    setViewingDocument({ filename: decodedFilename, page });
                                                                                }
                                                                            }}
                                                                            className="inline-flex items-center gap-1 px-1.5 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors cursor-pointer font-semibold mx-1 text-xs align-middle transform -translate-y-px"
                                                                        >
                                                                            {children}
                                                                            <ExternalLink className="h-3 w-3" />
                                                                        </span>
                                                                    );
                                                                }
                                                                return <a href={href} {...props} className="text-indigo-600 hover:underline">{children}</a>;
                                                            },
                                                            strong: ({ node, ...props }) => <span className="font-bold text-indigo-700 dark:text-indigo-400" {...props} />,
                                                            ul: ({ node, ...props }) => <ul className="list-disc pl-4 space-y-1 my-2" {...props} />,
                                                            ol: ({ node, ...props }) => <ol className="list-decimal pl-4 space-y-1 my-2" {...props} />,
                                                            li: ({ node, ...props }) => <li className="pl-1" {...props} />,
                                                            p: ({ node, ...props }) => <p className="mb-2 last:mb-0 whitespace-pre-wrap break-words" {...props} />,
                                                            code: ({ node, className, children, ...props }) => {
                                                                const isInline = !className;
                                                                if (isInline) {
                                                                    return <code className="bg-slate-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-xs break-all" {...props}>{children}</code>;
                                                                }
                                                                return (
                                                                    <code className="block bg-slate-100 dark:bg-zinc-800 p-2 rounded text-xs overflow-x-auto whitespace-pre" {...props}>
                                                                        {children}
                                                                    </code>
                                                                );
                                                            },
                                                            pre: ({ node, ...props }) => <pre className="overflow-x-auto my-2 rounded bg-slate-100 dark:bg-zinc-800" {...props} />,
                                                        }}
                                                    >
                                                        {preprocessContent(msg.content)}
                                                    </ReactMarkdown>
                                                </div>
                                            )}

                                            {'sources' in msg && msg.sources && msg.sources.length > 0 && (() => {
                                                // Deduplicate sources by title (book name) - show each book only once
                                                const uniqueBooks = Array.from(
                                                    new Set(msg.sources.map((src: Source) => src.title))
                                                );

                                                return (
                                                    <div className="mt-3 pt-2 border-t border-slate-200 dark:border-zinc-800 animate-fade-in">
                                                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-1.5 block">Sources Used</span>
                                                        <div className="flex flex-wrap gap-1.5 mt-1">
                                                            {uniqueBooks.map((bookName: string, i: number) => (
                                                                <div
                                                                    key={i}
                                                                    className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-zinc-800/50 rounded-full px-2.5 py-1 border border-slate-200 dark:border-zinc-700"
                                                                >
                                                                    <Database className="h-3 w-3 text-indigo-500" />
                                                                    <span className="text-[10px] font-medium text-slate-600 dark:text-zinc-400 truncate max-w-[200px]">
                                                                        {bookName}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>
                    </div>
                    {/* Input Area logic remains same but ensuring it's in the flex col */}
                    {/* Input Area */}
                    <div className="p-3 md:p-6 bg-transparent shrink-0">
                        <div className="max-w-3xl mx-auto rounded-2xl bg-white/70 dark:bg-white/5 backdrop-blur-xl p-3 shadow-lg shadow-slate-200/50 dark:shadow-none border border-slate-200/60 dark:border-white/10 relative">

                            {/* KB Selector */}
                            <div className="absolute top-3 right-3 z-10">
                                <div className="relative" ref={kbDropdownRef}>
                                    <button
                                        onClick={() => setIsKBDropdownOpen(!isKBDropdownOpen)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-zinc-800/50 text-xs font-medium text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors border border-slate-200 dark:border-zinc-700/50"
                                    >
                                        <Database className="h-3 w-3" />
                                        <span className="max-w-[30px] md:max-w-[120px] truncate">
                                            {selectedKB
                                                ? publicKBs?.find(kb => kb.chromaCollectionId === selectedKB)?.name || "Selected"
                                                : "Select KB"}
                                        </span>
                                        <ChevronDown className={cn("h-3 w-3 transition-transform", isKBDropdownOpen && "rotate-180")} />
                                    </button>

                                    {isKBDropdownOpen && (
                                        <div className="absolute bottom-full right-0 mb-2 w-72 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl overflow-hidden z-20 ring-1 ring-zinc-900/5 dark:ring-white/5">
                                            <div className="p-1.5">
                                                <div className="px-3 py-2 text-[11px] font-semibold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider">
                                                    Current Knowledge Base
                                                </div>

                                                {selectedKB && publicKBs?.find(kb => kb.chromaCollectionId === selectedKB) && (() => {
                                                    const currentKB = publicKBs.find(kb => kb.chromaCollectionId === selectedKB);
                                                    return currentKB ? (
                                                        <div className="mx-2 mb-1 p-2 bg-zinc-50/50 dark:bg-zinc-800/40 rounded-lg border border-zinc-200/50 dark:border-zinc-700/50 ring-1 ring-zinc-200/50 dark:ring-zinc-700/50">
                                                            <div className="flex items-center gap-2.5 mb-1.5">
                                                                <div className="p-1.5 rounded-md bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-indigo-600 dark:text-indigo-400 shadow-sm shrink-0">
                                                                    <Database className="h-3.5 w-3.5" />
                                                                </div>
                                                                <div className="font-medium text-sm text-zinc-900 dark:text-zinc-100 truncate">
                                                                    {currentKB.name}
                                                                </div>
                                                            </div>
                                                            {currentKB.description && (
                                                                <div className="text-xs text-zinc-500 dark:text-zinc-400 pl-[34px] line-clamp-2 leading-relaxed">
                                                                    {currentKB.description}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : null;
                                                })()}

                                                <div className="h-px bg-zinc-100 dark:bg-zinc-800/50 my-1 mx-2" />

                                                <button
                                                    onClick={() => {
                                                        setKbBrowserOpen(true);
                                                        setIsKBDropdownOpen(false);
                                                    }}
                                                    className="w-full text-left px-3 py-2.5 rounded-none text-sm text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors flex items-center gap-3 group"
                                                >
                                                    <div className="p-1.5 items-center justify-center flex text-zinc-400 group-hover:text-zinc-600 dark:text-zinc-500 dark:group-hover:text-zinc-300 transition-colors shrink-0">
                                                        <Database className="h-3.5 w-3.5" />
                                                    </div>
                                                    <span className="font-medium">Browse Knowledge Bases...</span>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <textarea
                                ref={textareaRef}
                                rows={1}
                                className="w-full bg-transparent border-0 text-slate-900 dark:text-[#eee] placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:ring-0 focus:outline-none resize-none py-3 px-2 min-h-[60px] max-h-48 scrollbar-hide text-base pt-1 md:pt-3"
                                placeholder={isAtLimit ? "Query limit reached..." : "Ask whatever you want..."}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                disabled={sending || isAtLimit}
                            />

                            {/* Upgrade Prompt when at limit */}
                            {isAtLimit && (
                                <div className="px-2 pb-2">
                                    <UpgradePrompt />
                                </div>
                            )}

                            {/* Bottom Actions */}
                            <div className="flex justify-between items-center mt-2 px-1">
                                <div className="flex items-center gap-2">
                                    {/* Include MedBax Profile Toggle */}
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setIncludeProfile(!includeProfile)}
                                            title="Include Medical Profile"
                                            className={`relative w-9 h-5 rounded-full transition-all duration-200 ${includeProfile
                                                ? "bg-indigo-500"
                                                : "bg-slate-300 dark:bg-zinc-600"
                                                }`}
                                        >
                                            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-200 ${includeProfile
                                                ? "left-[18px]"
                                                : "left-0.5"
                                                }`}
                                            />
                                        </button>
                                        <button
                                            onClick={() => setHealthPanelOpen(true)}
                                            className="p-1 text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors"
                                            title="Include Medical Profile"
                                        >
                                            <Info className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    {/* Query Usage Badge */}
                                    <span className={`text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1 ${isAtLimit
                                        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                                        : queryCount >= queryLimit * 0.8
                                            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                                            : "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400"
                                        }`}>
                                        <Zap className="w-3 h-3" />
                                        {queryCount}/{queryLimit}
                                    </span>
                                    <button
                                        onClick={() => handleSend()}
                                        disabled={sending || !input.trim() || isAtLimit}
                                        className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* PDF Viewer Panel */}
                {viewingDocument && (
                    <>
                        {/* Desktop: Side panel */}
                        <div className="hidden md:block w-1/2 h-full animate-slide-in-right">
                            <PDFViewer
                                url={resolvedUrl || null}
                                fileName={viewingDocument.filename}
                                isLoading={isLoadingUrl}
                                onClose={() => setViewingDocument(null)}
                                initialPage={viewingDocument.page}
                            />
                        </div>
                        {/* Mobile: PDFViewer renders its own full-screen overlay */}
                        <div className="md:hidden">
                            <PDFViewer
                                url={resolvedUrl || null}
                                fileName={viewingDocument.filename}
                                isLoading={isLoadingUrl}
                                onClose={() => setViewingDocument(null)}
                                initialPage={viewingDocument.page}
                            />
                        </div>
                    </>
                )}

                {/* Health Snapshot Panel - Right Side */}
                {healthPanelOpen && patient && (
                    <HealthSnapshotPanel
                        patient={patient}
                        onClose={() => setHealthPanelOpen(false)}
                    />
                )}
            </div>
        </div >
    );
}
