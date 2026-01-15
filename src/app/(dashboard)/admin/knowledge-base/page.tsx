"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Plus, Database, MoreVertical, Trash2, Archive, Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { Modal } from "@/components/ui/modal";
import { ContentSkeleton } from "@/components/ui/skeleton";
import { deleteCollection, createCollection, RAG_API_URL } from "@/lib/rag-api";

export default function KnowledgeBasePage() {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedKB, setSelectedKB] = useState<{
        _id: string;
        name: string;
        chromaCollectionId: string;
    } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const knowledgeBases = useQuery(api.knowledgeBases.list);
    const markDeleting = useMutation(api.knowledgeBases.markDeleting);
    const completeDelete = useMutation(api.knowledgeBases.completeDelete);

    const handleDeleteKB = async () => {
        if (!selectedKB) return;

        setIsDeleting(true);
        try {
            // 1. Mark as deleting in Convex
            const { chromaCollectionId } = await markDeleting({ id: selectedKB._id as any });

            // 2. Delete from FastAPI/LanceDB
            await deleteCollection(chromaCollectionId);

            // 3. Complete deletion in Convex
            await completeDelete({ id: selectedKB._id as any });

            setIsDeleteModalOpen(false);
            setSelectedKB(null);
        } catch (error) {
            console.error("Error deleting KB:", error);
            alert("Failed to delete knowledge base. Please try again.");
        } finally {
            setIsDeleting(false);
        }
    };

    if (knowledgeBases === undefined) {
        return <ContentSkeleton />;
    }

    return (
        <div className="w-full space-y-6 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                        Knowledge Bases
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-zinc-400">
                        Manage RAG knowledge bases and uploaded documents
                    </p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    Create Knowledge Base
                </button>
            </div>

            {/* Knowledge Bases Grid */}
            {knowledgeBases.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/30 p-12 text-center">
                    <Database className="h-12 w-12 mx-auto text-slate-400 dark:text-zinc-600" />
                    <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-white">
                        No knowledge bases yet
                    </h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
                        Create your first knowledge base to start uploading documents.
                    </p>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                        Create Knowledge Base
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {knowledgeBases.map((kb) => (
                        <div
                            key={kb._id}
                            className="group p-5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all"
                        >
                            <div className="flex items-start justify-between">
                                <div className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                                    <Database className="h-5 w-5" />
                                </div>
                                <div className="flex items-center gap-1">
                                    {kb.isPublic ? (
                                        <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full">
                                            <Eye className="h-3 w-3" />
                                            Public
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-zinc-500 bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                                            <EyeOff className="h-3 w-3" />
                                            Private
                                        </span>
                                    )}
                                </div>
                            </div>

                            <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-white">
                                {kb.name}
                            </h3>
                            <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400 line-clamp-2">
                                {kb.description || "No description"}
                            </p>

                            <div className="mt-4 flex items-center justify-between">
                                <span className="text-xs text-slate-500 dark:text-zinc-500">
                                    {kb.documentCount} document{kb.documentCount !== 1 ? "s" : ""}
                                </span>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => {
                                            setSelectedKB({
                                                _id: kb._id,
                                                name: kb.name,
                                                chromaCollectionId: kb.chromaCollectionId,
                                            });
                                            setIsDeleteModalOpen(true);
                                        }}
                                        className="p-1.5 text-slate-400 hover:text-red-500 dark:text-zinc-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                    <Link href={`/admin/knowledge-base/${kb._id}`}>
                                        <button className="px-3 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-md transition-colors">
                                            Manage
                                        </button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            <CreateKBModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
            />

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => {
                    if (!isDeleting) {
                        setIsDeleteModalOpen(false);
                        setSelectedKB(null);
                    }
                }}
                title="Delete Knowledge Base"
            >
                <div className="space-y-4">
                    <p className="text-sm text-slate-600 dark:text-zinc-400">
                        Are you sure you want to delete{" "}
                        <span className="font-semibold text-slate-900 dark:text-white">
                            {selectedKB?.name}
                        </span>
                        ?
                    </p>
                    <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg">
                        <p className="text-sm text-red-700 dark:text-red-400">
                            ⚠️ This will permanently delete all documents and embeddings in this
                            knowledge base. This action cannot be undone.
                        </p>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            onClick={() => {
                                setIsDeleteModalOpen(false);
                                setSelectedKB(null);
                            }}
                            disabled={isDeleting}
                            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDeleteKB}
                            disabled={isDeleting}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="h-4 w-4" />
                                    Delete
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

// ============================================================================
// Create KB Modal Component
// ============================================================================

function CreateKBModal({
    isOpen,
    onClose,
}: {
    isOpen: boolean;
    onClose: () => void;
}) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [isPublic, setIsPublic] = useState(true);
    const [isCreating, setIsCreating] = useState(false);

    const createKB = useMutation(api.knowledgeBases.create);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsCreating(true);
        try {
            // 1. Create in Convex (generates chromaCollectionId)
            const { chromaCollectionId } = await createKB({
                name: name.trim(),
                description: description.trim() || undefined,
                isPublic,
            });

            // 2. Create collection in FastAPI/LanceDB
            await createCollection(chromaCollectionId, name.trim());

            // Reset form and close
            setName("");
            setDescription("");
            setIsPublic(true);
            onClose();
        } catch (error) {
            console.error("Error creating KB:", error);
            alert("Failed to create knowledge base. Please try again.");
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Create Knowledge Base">
            <form onSubmit={handleCreate} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1">
                        Name *
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g., Cardiology, Oncology"
                        className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1">
                        Description
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Brief description of this knowledge base..."
                        rows={3}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                    />
                </div>

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => setIsPublic(!isPublic)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isPublic
                            ? "bg-indigo-600"
                            : "bg-slate-200 dark:bg-zinc-700"
                            }`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isPublic ? "translate-x-6" : "translate-x-1"
                                }`}
                        />
                    </button>
                    <span className="text-sm text-slate-700 dark:text-zinc-300">
                        Public (visible to patients in chat)
                    </span>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isCreating}
                        className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isCreating || !name.trim()}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50"
                    >
                        {isCreating ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            <>
                                <Plus className="h-4 w-4" />
                                Create
                            </>
                        )}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
