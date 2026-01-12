"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import {
    MessageSquare,
    Search,
    Trash2,
    Plus,
    ArrowRight,
    Calendar,
    Command,
    CornerDownLeft,
    Loader2,
    X
} from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

interface ChatHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    patientId: string;
}

export function ChatHistoryModal({ isOpen, onClose, patientId }: ChatHistoryModalProps) {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Fetch all chats
    const chats = useQuery(api.chats.listChats, { patientId: patientId as Id<"patients"> });
    const createChat = useMutation(api.chats.createChat);
    const deleteChat = useMutation(api.chats.deleteChat);

    // Reset state when opening
    useEffect(() => {
        if (isOpen) {
            setSearchQuery("");
            setTimeout(() => searchInputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    // Derived state: Filtered chats
    const filteredChats = useMemo(() => {
        if (!chats) return [];
        return chats.filter(c =>
            c.title.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [chats, searchQuery]);


    const handleCreateChat = async () => {
        const newChatId = await createChat({
            patientId: patientId as Id<"patients">,
            title: "New Conversation"
        });
        onClose();
        router.push(`/dashboard/chat/${newChatId}`);
    };

    const handleOpenChat = (chatId: Id<"chats">) => {
        onClose();
        router.push(`/dashboard/chat/${chatId}`);
    };

    const handleDeleteChat = async (e: React.MouseEvent, chatId: Id<"chats">) => {
        e.stopPropagation();
        if (confirm("Delete this conversation?")) {
            await deleteChat({ chatId });
        }
    };

    // Grouping Logic
    const groupedChats = useMemo(() => {
        const groups: Record<string, typeof filteredChats> = {
            "Today": [],
            "Yesterday": [],
            "Previous 7 Days": [],
            "Older": []
        };

        filteredChats.forEach(chat => {
            const date = new Date(chat.lastMessageAt);
            const now = new Date();
            const daysDiff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

            if (daysDiff === 0) groups["Today"].push(chat);
            else if (daysDiff === 1) groups["Yesterday"].push(chat);
            else if (daysDiff <= 7) groups["Previous 7 Days"].push(chat);
            else groups["Older"].push(chat);
        });

        // Remove empty groups
        return Object.entries(groups).filter(([_, list]) => list.length > 0);
    }, [filteredChats]);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            className="max-w-2xl h-[70vh] p-0 overflow-hidden bg-white dark:bg-zinc-950 border-0 rounded-2xl shadow-2xl"
            title="" // We'll use custom header
        >
            <div className="flex flex-col h-full">
                {/* Combined Header: Title + Search + Close */}
                <div className="px-5 py-4 border-b border-slate-100 dark:border-zinc-800 space-y-3 shrink-0">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                            Conversation History
                        </h3>
                        <button
                            onClick={onClose}
                            className="p-1 rounded-md text-slate-400 hover:text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            ref={searchInputRef}
                            type="text"
                            placeholder="Search conversations..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-zinc-900 border-0 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white placeholder:text-slate-500"
                        />
                    </div>
                </div>

                {/* Scrollable List */}
                <div className="flex-1 overflow-y-auto p-2 space-y-4">
                    {/* Actions */}
                    <div className="px-2">
                        <div className="text-xs font-semibold text-slate-400 dark:text-zinc-600 mb-2 px-2 uppercase tracking-wider">Actions</div>
                        <button
                            onClick={handleCreateChat}
                            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-900 rounded-lg transition-colors text-left"
                        >
                            <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-md">
                                <Plus className="h-4 w-4" />
                            </div>
                            <span>New Chat</span>
                        </button>
                    </div>

                    {/* History Groups */}
                    {groupedChats.map(([groupName, groupList]) => (
                        <div key={groupName} className="px-2">
                            <div className="text-xs font-semibold text-slate-400 dark:text-zinc-600 mb-2 px-2 uppercase tracking-wider sticky top-0 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-sm z-10 py-1">
                                {groupName}
                            </div>
                            <div className="space-y-0.5">
                                {groupList.map(chat => (
                                    <div
                                        key={chat._id}
                                        onClick={() => handleOpenChat(chat._id)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                handleOpenChat(chat._id);
                                            }
                                        }}
                                        role="button"
                                        tabIndex={0}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 border border-transparent hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:border-indigo-100 dark:hover:border-indigo-500/20 hover:shadow-sm group cursor-pointer"
                                    >
                                        <div className="shrink-0 p-1.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 group-hover:bg-indigo-100 group-hover:dark:bg-indigo-500/20 group-hover:text-indigo-600 group-hover:dark:text-indigo-300 transition-colors">
                                            <MessageSquare className="h-4 w-4" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="text-sm font-medium truncate text-slate-900 dark:text-zinc-200">
                                                {chat.title}
                                            </div>
                                            <div className="text-xs text-slate-500 truncate flex items-center gap-1.5 mt-0.5">
                                                <span className="opacity-75">{new Date(chat.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        </div>
                                        <div className="shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => handleDeleteChat(e, chat._id)}
                                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                            <div className="p-1.5 text-indigo-500">
                                                <CornerDownLeft className="h-3.5 w-3.5" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    {filteredChats.length === 0 && searchQuery && (
                        <div className="px-8 py-12 text-center text-slate-500 dark:text-zinc-500">
                            <Search className="h-8 w-8 mx-auto mb-3 opacity-20" />
                            <p>No chats found matching "{searchQuery}"</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-3 bg-slate-50 dark:bg-zinc-900/50 border-t border-slate-100 dark:border-zinc-800 flex items-center gap-4 text-[10px] text-slate-400 dark:text-zinc-500 font-medium">
                    <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded shadow-sm">↵</span>
                        <span>to open</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded shadow-sm">esc</span>
                        <span>to close</span>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
