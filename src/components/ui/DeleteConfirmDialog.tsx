"use client";

import { AlertTriangle, X } from "lucide-react";

interface DeleteConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    isDeleting?: boolean;
}

export function DeleteConfirmDialog({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel,
    isDeleting = false,
}: DeleteConfirmDialogProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onCancel}
            />

            {/* Dialog */}
            <div className="relative bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-slate-200 dark:border-zinc-700 w-full max-w-sm mx-4 animate-scale-in">
                {/* Close button */}
                <button
                    onClick={onCancel}
                    className="absolute right-3 top-3 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 rounded-md transition-colors"
                >
                    <X className="h-4 w-4" />
                </button>

                {/* Content */}
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                            {title}
                        </h3>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-zinc-400 mb-6">
                        {message}
                    </p>

                    {/* Actions */}
                    <div className="flex gap-3 justify-end">
                        <button
                            onClick={onCancel}
                            disabled={isDeleting}
                            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-lg transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isDeleting}
                            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {isDeleting ? (
                                <>
                                    <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                "Delete"
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
