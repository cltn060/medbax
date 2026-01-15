"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { useParams, useRouter } from "next/navigation";
import { api } from "../../../../../../convex/_generated/api";
import { Id } from "../../../../../../convex/_generated/dataModel";
import {
    ArrowLeft,
    Upload,
    FileText,
    Trash2,
    Loader2,
    Eye,
    EyeOff,
    Database,
    CheckCircle,
    XCircle,
    Zap,
    Clock,
    Pencil,
    Save,
} from "lucide-react";
import Link from "next/link";
import { Modal } from "@/components/ui/modal";
import { ContentSkeleton } from "@/components/ui/skeleton";
import { deleteDocument, uploadDocument, TaskStatusResponse } from "@/lib/rag-api";

export default function KnowledgeBaseDetailPage() {
    const params = useParams();
    const router = useRouter();
    const kbId = params.id as string;

    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteDocModalOpen, setIsDeleteDocModalOpen] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState<{
        _id: string;
        filename: string;
        chromaDocumentId: string;
    } | null>(null);
    const [isDeletingDoc, setIsDeletingDoc] = useState(false);

    const knowledgeBase = useQuery(api.knowledgeBases.get, {
        id: kbId as Id<"knowledgeBases">,
    });
    const documents = useQuery(api.knowledgeBases.listDocuments, {
        knowledgeBaseId: kbId as Id<"knowledgeBases">,
    });

    const markDocumentDeleting = useMutation(api.knowledgeBases.markDocumentDeleting);
    const completeDocumentDelete = useMutation(api.knowledgeBases.completeDocumentDelete);

    const handleDeleteDocument = async () => {
        if (!selectedDoc || !knowledgeBase) return;

        setIsDeletingDoc(true);
        try {
            // 1. Mark as deleting
            await markDocumentDeleting({ documentId: selectedDoc._id as Id<"knowledgeBaseDocuments"> });

            // 2. Delete from FastAPI/LanceDB
            await deleteDocument(knowledgeBase.chromaCollectionId, selectedDoc.chromaDocumentId);

            // 3. Complete deletion
            await completeDocumentDelete({ documentId: selectedDoc._id as Id<"knowledgeBaseDocuments"> });

            setIsDeleteDocModalOpen(false);
            setSelectedDoc(null);
        } catch (error) {
            console.error("Error deleting document:", error);
            alert("Failed to delete document. Please try again.");
        } finally {
            setIsDeletingDoc(false);
        }
    };

    if (knowledgeBase === undefined || documents === undefined) {
        return <ContentSkeleton />;
    }

    if (knowledgeBase === null) {
        return (
            <div className="w-full space-y-6 pb-10">
                <div className="text-center py-12">
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                        Knowledge Base Not Found
                    </h2>
                    <Link href="/admin/knowledge-base">
                        <button className="mt-4 text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
                            ← Back to Knowledge Bases
                        </button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full space-y-6 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/admin/knowledge-base">
                        <button className="p-2 text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                                {knowledgeBase.name}
                            </h1>
                            {knowledgeBase.isPublic ? (
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
                        <p className="text-sm text-slate-500 dark:text-zinc-400">
                            {knowledgeBase.description || "No description"}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsEditModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-lg text-sm font-medium transition-colors"
                    >
                        <Pencil className="h-4 w-4" />
                        Edit
                    </button>
                    <button
                        onClick={() => setIsUploadModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        <Upload className="h-4 w-4" />
                        Upload Document
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">
                        {knowledgeBase.documentCount}
                    </div>
                    <div className="text-sm text-slate-500 dark:text-zinc-400">Documents</div>
                </div>
                <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">
                        {documents.reduce((sum, d) => sum + d.chunkCount, 0)}
                    </div>
                    <div className="text-sm text-slate-500 dark:text-zinc-400">Total Chunks</div>
                </div>
                <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
                    <div className="text-xs font-mono text-slate-600 dark:text-zinc-400 truncate">
                        {knowledgeBase.chromaCollectionId}
                    </div>
                    <div className="text-sm text-slate-500 dark:text-zinc-400">Collection ID</div>
                </div>
            </div>

            {/* Documents List */}
            <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-200 dark:border-zinc-800">
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                        Documents
                    </h3>
                </div>

                {documents.length === 0 ? (
                    <div className="p-8 text-center">
                        <FileText className="h-12 w-12 mx-auto text-slate-400 dark:text-zinc-600" />
                        <h4 className="mt-4 text-base font-semibold text-slate-900 dark:text-white">
                            No documents yet
                        </h4>
                        <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
                            Upload your first PDF document to this knowledge base.
                        </p>
                        <button
                            onClick={() => setIsUploadModalOpen(true)}
                            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                            <Upload className="h-4 w-4" />
                            Upload Document
                        </button>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100 dark:divide-zinc-800">
                        {documents.map((doc) => (
                            <div
                                key={doc._id}
                                className="px-5 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
                                        <FileText className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <div className="font-medium text-slate-900 dark:text-white">
                                            {doc.filename}
                                        </div>
                                        <div className="text-xs text-slate-500 dark:text-zinc-500 flex items-center gap-2">
                                            <span>{doc.chunkCount} chunks</span>
                                            {doc.pageCount && (
                                                <>
                                                    <span>•</span>
                                                    <span>{doc.pageCount} pages</span>
                                                </>
                                            )}
                                            <span>•</span>
                                            <span>{(doc.fileSize / 1024).toFixed(1)} KB</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <StatusBadge status={doc.status} />
                                    <button
                                        onClick={() => {
                                            setSelectedDoc({
                                                _id: doc._id,
                                                filename: doc.filename,
                                                chromaDocumentId: doc.chromaDocumentId,
                                            });
                                            setIsDeleteDocModalOpen(true);
                                        }}
                                        disabled={doc.status === "deleting"}
                                        className="p-1.5 text-slate-400 hover:text-red-500 dark:text-zinc-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md transition-colors disabled:opacity-50"
                                        title="Delete"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Upload Modal */}
            <UploadModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                knowledgeBaseId={kbId as Id<"knowledgeBases">}
                chromaCollectionId={knowledgeBase.chromaCollectionId}
            />

            {/* Edit Modal */}
            <EditKBModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                kb={knowledgeBase}
            />

            {/* Delete Document Confirmation Modal */}
            <Modal
                isOpen={isDeleteDocModalOpen}
                onClose={() => {
                    if (!isDeletingDoc) {
                        setIsDeleteDocModalOpen(false);
                        setSelectedDoc(null);
                    }
                }}
                title="Delete Document"
            >
                <div className="space-y-4">
                    <p className="text-sm text-slate-600 dark:text-zinc-400">
                        Are you sure you want to delete{" "}
                        <span className="font-semibold text-slate-900 dark:text-white">
                            {selectedDoc?.filename}
                        </span>
                        ?
                    </p>
                    <p className="text-sm text-slate-500 dark:text-zinc-500">
                        This will permanently delete all embeddings for this document.
                    </p>
                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            onClick={() => {
                                setIsDeleteDocModalOpen(false);
                                setSelectedDoc(null);
                            }}
                            disabled={isDeletingDoc}
                            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDeleteDocument}
                            disabled={isDeletingDoc}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
                        >
                            {isDeletingDoc ? (
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
// Status Badge Component
// ============================================================================

function StatusBadge({ status }: { status: string }) {
    switch (status) {
        case "ready":
            return (
                <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full">
                    <CheckCircle className="h-3 w-3" />
                    Ready
                </span>
            );
        case "processing":
            return (
                <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-full">
                    <Clock className="h-3 w-3" />
                    Processing
                </span>
            );
        case "failed":
            return (
                <span className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 px-2 py-0.5 rounded-full">
                    <XCircle className="h-3 w-3" />
                    Failed
                </span>
            );
        case "deleting":
            return (
                <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-zinc-500 bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Deleting
                </span>
            );
        default:
            return null;
    }
}

// ============================================================================
// Upload Modal Component
// ============================================================================

function UploadModal({
    isOpen,
    onClose,
    knowledgeBaseId,
    chromaCollectionId,
}: {
    isOpen: boolean;
    onClose: () => void;
    knowledgeBaseId: Id<"knowledgeBases">;
    chromaCollectionId: string;
}) {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState("");
    const [fastMode, setFastMode] = useState(true); // Default to fast mode
    const fileInputRef = useRef<HTMLInputElement>(null);

    const generateDocumentId = useMutation(api.knowledgeBases.generateDocumentId);
    const generateUploadUrl = useMutation(api.knowledgeBases.generateUploadUrl);
    const addDocument = useMutation(api.knowledgeBases.addDocument);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile && selectedFile.type === "application/pdf") {
            setFile(selectedFile);
        } else {
            alert("Please select a PDF file.");
            e.target.value = "";
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setIsUploading(true);
        try {
            // 1. Upload to Convex Storage
            setUploadProgress("Uploading to storage...");

            // Get upload URL
            const postUrl = await generateUploadUrl();

            // Upload file
            const storageResult = await fetch(postUrl, {
                method: "POST",
                headers: { "Content-Type": file.type },
                body: file,
            });

            if (!storageResult.ok) {
                throw new Error(`Failed to upload to storage: ${storageResult.statusText}`);
            }

            const { storageId } = await storageResult.json();

            // 2. Generate document ID for RAG
            setUploadProgress("Preparing RAG processing...");
            const { chromaDocumentId } = await generateDocumentId();

            // 3. Upload to FastAPI (V2 async with progress)
            setUploadProgress("Submitting for processing...");

            const result = await uploadDocument(
                chromaCollectionId,
                file,
                chromaDocumentId,
                (status: TaskStatusResponse) => {
                    // Update progress based on task status
                    if (status.state === "PENDING") {
                        setUploadProgress("Queued for processing...");
                    } else if (status.state === "PROCESSING") {
                        const step = status.progress?.step || "processing";
                        const message = status.progress?.message || "Processing document...";
                        setUploadProgress(message);
                    }
                },
                fastMode // Pass fast mode parameter
            );

            // 4. Record in Convex
            setUploadProgress("Finalizing...");
            await addDocument({
                knowledgeBaseId,
                filename: file.name,
                chromaDocumentId,
                storageId: storageId as Id<"_storage">,
                fileSize: file.size,
                pageCount: result.page_count,
                chunkCount: result.chunks_created,
            });

            // Reset and close
            setFile(null);
            setUploadProgress("");
            if (fileInputRef.current) fileInputRef.current.value = "";
            onClose();
        } catch (error: any) {
            console.error("Error uploading:", error);
            alert(`Failed to upload: ${error.message}`);
        } finally {
            setIsUploading(false);
            setUploadProgress("");
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={() => {
                if (!isUploading) {
                    setFile(null);
                    setUploadProgress("");
                    onClose();
                }
            }}
            title="Upload Document"
        >
            <div className="space-y-4">
                {/* Drop Zone */}
                <div
                    onClick={() => !isUploading && fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${file
                        ? "border-indigo-300 bg-indigo-50 dark:border-indigo-700 dark:bg-indigo-950/30"
                        : "border-slate-300 dark:border-zinc-700 hover:border-indigo-300 dark:hover:border-indigo-700"
                        } ${isUploading ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf"
                        onChange={handleFileChange}
                        className="hidden"
                        disabled={isUploading}
                    />
                    {file ? (
                        <div className="flex items-center justify-center gap-3">
                            <FileText className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                            <div className="text-left">
                                <div className="font-medium text-slate-900 dark:text-white">
                                    {file.name}
                                </div>
                                <div className="text-sm text-slate-500 dark:text-zinc-400">
                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            <Upload className="h-10 w-10 mx-auto text-slate-400 dark:text-zinc-600" />
                            <p className="mt-2 text-sm text-slate-600 dark:text-zinc-400">
                                Click to select a PDF file
                            </p>
                            <p className="text-xs text-slate-400 dark:text-zinc-600">
                                Only PDF files are supported
                            </p>
                        </>
                    )}
                </div>

                {/* Progress */}
                {uploadProgress && (
                    <div className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {uploadProgress}
                    </div>
                )}

                {/* Fast Mode Toggle */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700">
                    <div className="flex items-center gap-2">
                        <Zap className={`h-4 w-4 ${fastMode ? "text-amber-500" : "text-slate-400 dark:text-zinc-500"}`} />
                        <div>
                            <div className="text-sm font-medium text-slate-700 dark:text-zinc-300">Fast Mode</div>
                            <div className="text-xs text-slate-500 dark:text-zinc-500">
                                {fastMode ? "Text-only extraction (faster)" : "Full extraction with images (slower)"}
                            </div>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => setFastMode(!fastMode)}
                        disabled={isUploading}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${fastMode ? "bg-amber-500" : "bg-slate-200 dark:bg-zinc-700"
                            }`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${fastMode ? "translate-x-6" : "translate-x-1"
                                }`}
                        />
                    </button>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-2">
                    <button
                        onClick={() => {
                            setFile(null);
                            setUploadProgress("");
                            onClose();
                        }}
                        disabled={isUploading}
                        className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleUpload}
                        disabled={isUploading || !file}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50"
                    >
                        {isUploading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Uploading...
                            </>
                        ) : (
                            <>
                                <Upload className="h-4 w-4" />
                                Upload
                            </>
                        )}
                    </button>
                </div>
            </div>
        </Modal>
    );
}

// ============================================================================
// Edit KB Modal Component
// ============================================================================

function EditKBModal({
    isOpen,
    onClose,
    kb,
}: {
    isOpen: boolean;
    onClose: () => void;
    kb: {
        _id: Id<"knowledgeBases">;
        name: string;
        description?: string;
        isPublic: boolean;
        isDefault?: boolean;
    };
}) {
    const [name, setName] = useState(kb.name);
    const [description, setDescription] = useState(kb.description || "");
    const [isPublic, setIsPublic] = useState(kb.isPublic);
    const [isDefault, setIsDefault] = useState(kb.isDefault || false);
    const [isSaving, setIsSaving] = useState(false);

    const updateKB = useMutation(api.knowledgeBases.update);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsSaving(true);
        try {
            await updateKB({
                id: kb._id,
                name: name.trim(),
                description: description.trim() || undefined,
                isPublic,
                isDefault,
            });

            onClose();
        } catch (error) {
            console.error("Error updating KB:", error);
            alert("Failed to update knowledge base. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Knowledge Base">
            <form onSubmit={handleUpdate} className="space-y-4">
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
                        Public (visible to patients)
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => setIsDefault(!isDefault)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isDefault
                            ? "bg-indigo-600"
                            : "bg-slate-200 dark:bg-zinc-700"
                            }`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isDefault ? "translate-x-6" : "translate-x-1"
                                }`}
                        />
                    </button>
                    <span className="text-sm text-slate-700 dark:text-zinc-300">
                        <b>Set as Default</b> (auto-selected for new chats)
                    </span>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSaving}
                        className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSaving || !name.trim()}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4" />
                                Save Changes
                            </>
                        )}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
