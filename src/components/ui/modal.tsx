"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    className?: string;
}

export function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
    const overlayRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };

        if (isOpen) {
            document.body.style.overflow = "hidden";
            window.addEventListener("keydown", handleKeyDown);
        }

        return () => {
            document.body.style.overflow = "unset";
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const content = (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Modal Panel */}
            <div
                className={cn(
                    "relative w-full max-w-lg transform rounded-xl bg-white dark:bg-zinc-900 shadow-2xl transition-all border border-slate-200 dark:border-zinc-800 flex flex-col max-h-[85vh]",
                    className
                )}
                role="dialog"
                aria-modal="true"
            >
                {/* Header */}
                {title && (
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-zinc-800 shrink-0">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                            {title}
                        </h3>
                        <button
                            onClick={onClose}
                            className="p-1 rounded-md text-slate-400 hover:text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors focus:outline-none"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-5">
                    {children}
                </div>
            </div>
        </div>
    );

    // Render to body
    if (typeof document === "undefined") return null;
    return createPortal(content, document.body);
}
