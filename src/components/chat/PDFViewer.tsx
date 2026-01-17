"use client";

import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { X, ExternalLink, Loader2, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure PDF worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
    url: string | null;
    fileName: string;
    isLoading?: boolean;
    onClose: () => void;
    className?: string;
    initialPage?: number;
}

export function PDFViewer({ url, fileName, isLoading, onClose, className, initialPage = 1 }: PDFViewerProps) {
    const [numPages, setNumPages] = useState<number>(0);
    const [pageNumber, setPageNumber] = useState<number>(initialPage);
    const [scale, setScale] = useState<number>(1.3);
    const [isDocumentLoaded, setIsDocumentLoaded] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Detect mobile viewport
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Prevent body scroll on mobile when viewer is open
    useEffect(() => {
        if (isMobile) {
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isMobile]);

    // Adjust initial scale for mobile
    useEffect(() => {
        if (isMobile) {
            setScale(1.0);
        } else {
            setScale(1.3);
        }
    }, [isMobile]);

    // Reset loading state when URL changes
    useEffect(() => {
        setIsDocumentLoaded(false);
        setNumPages(0); // Reset page count when URL changes
    }, [url]);

    // Update page number if initialPage changes (e.g. clicking different citations)
    // Clamp to valid range when numPages is known
    useEffect(() => {
        if (numPages > 0) {
            setPageNumber(Math.min(Math.max(1, initialPage), numPages));
        } else {
            setPageNumber(initialPage);
        }
    }, [initialPage, numPages]);

    function onDocumentLoadSuccess({ numPages: loadedNumPages }: { numPages: number }) {
        setNumPages(loadedNumPages);
        // Clamp current page number to valid range
        setPageNumber(prev => Math.min(Math.max(1, prev), loadedNumPages));
        setIsDocumentLoaded(true);
    }

    const changePage = (offset: number) => {
        setPageNumber(prevPageNumber => prevPageNumber + offset);
    };

    const previousPage = () => changePage(-1);
    const nextPage = () => changePage(1);

    const zoomIn = () => setScale(prev => Math.min(prev + 0.2, 2.0));
    const zoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));

    const viewerContent = (
        <>
            {/* Header */}
            <div className="flex items-center justify-between px-3 md:px-4 py-2 border-b border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 z-10 shrink-0">
                <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0">
                    <div className="p-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg shrink-0">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <span className="text-sm font-medium text-slate-700 dark:text-zinc-200 truncate" title={fileName}>
                        {fileName}
                    </span>
                    {isDocumentLoaded && (
                        <span className="hidden md:inline text-xs text-slate-400 dark:text-zinc-500 ml-2 whitespace-nowrap">
                            ({pageNumber} / {numPages})
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-1 ml-2 shrink-0">
                    {/* Zoom controls - hidden on small mobile */}
                    <div className="hidden sm:flex items-center bg-slate-100 dark:bg-zinc-800 rounded-lg p-0.5 mr-2">
                        <button onClick={zoomOut} className="p-1.5 md:p-1 text-slate-500 hover:text-slate-700 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-700 rounded transition-all" title="Zoom Out">
                            <ZoomOut className="h-4 w-4" />
                        </button>
                        <span className="text-[10px] w-8 text-center text-slate-500 dark:text-zinc-400 selection:bg-none">
                            {Math.round(scale * 100)}%
                        </span>
                        <button onClick={zoomIn} className="p-1.5 md:p-1 text-slate-500 hover:text-slate-700 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-700 rounded transition-all" title="Zoom In">
                            <ZoomIn className="h-4 w-4" />
                        </button>
                    </div>

                    {url && (
                        <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 md:p-1.5 text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                            title="Open in new tab"
                        >
                            <ExternalLink className="h-4 w-4" />
                        </a>
                    )}
                    <button
                        onClick={onClose}
                        className="p-2 md:p-1.5 text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                        title="Close viewer"
                    >
                        <X className="h-5 w-5 md:h-4 md:w-4" />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 relative bg-slate-200/50 dark:bg-black/20 overflow-hidden flex flex-col">
                <div className="flex-1 overflow-auto flex justify-center p-2 md:p-4">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full w-full">
                            <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
                        </div>
                    ) : url ? (
                        <div className={cn("duration-500", isDocumentLoaded && "shadow-xl")}>
                            <div className="max-w-full">
                                <Document
                                    file={url}
                                    onLoadSuccess={onDocumentLoadSuccess}
                                    loading={
                                        <div className="flex items-center justify-center p-10">
                                            <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
                                        </div>
                                    }
                                    error={
                                        <div className="p-4 text-center text-red-500 text-sm">
                                            Failed to load PDF.
                                        </div>
                                    }
                                    className="flex justify-center"
                                >
                                    <Page
                                        pageNumber={pageNumber}
                                        scale={scale}
                                        className="shadow-sm"
                                        renderTextLayer={false}
                                        renderAnnotationLayer={false}
                                        width={isMobile ? window.innerWidth - 32 : undefined}
                                    />
                                </Document>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full w-full text-slate-400 dark:text-zinc-600">
                            <p className="text-sm">Document not loaded</p>
                        </div>
                    )}
                </div>

                {/* Fixed Navigation Controls at bottom */}
                {numPages > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 md:gap-4 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm px-4 py-2.5 md:py-2 rounded-full shadow-lg border border-slate-200 dark:border-zinc-700 z-10">
                        <button
                            disabled={pageNumber <= 1}
                            onClick={previousPage}
                            className="p-1.5 md:p-1 text-slate-600 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 disabled:opacity-30 transition-colors touch-target md:min-w-0 md:min-h-0"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                        <span className="text-sm font-medium text-slate-700 dark:text-zinc-200 min-w-[3.5rem] text-center">
                            {pageNumber} of {numPages}
                        </span>
                        <button
                            disabled={pageNumber >= numPages}
                            onClick={nextPage}
                            className="p-1.5 md:p-1 text-slate-600 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 disabled:opacity-30 transition-colors touch-target md:min-w-0 md:min-h-0"
                        >
                            <ChevronRight className="h-5 w-5" />
                        </button>
                    </div>
                )}
            </div>
        </>
    );

    return (
        <>
            {/* Mobile: Full-screen overlay */}
            {isMobile ? (
                <div className="fixed inset-0 z-50 flex flex-col bg-slate-50 dark:bg-zinc-900 animate-slide-in-left">
                    {viewerContent}
                </div>
            ) : (
                /* Desktop: Side panel */
                <div className={cn("flex flex-col h-full bg-slate-50 dark:bg-zinc-900 border-l border-slate-200 dark:border-zinc-800 shadow-xl w-full", className)}>
                    {viewerContent}
                </div>
            )}
        </>
    );
}
