import { FileText, ExternalLink, Database, Paperclip } from "lucide-react";
import { Id } from "../../../convex/_generated/dataModel";

interface CitationSource {
    title: string;
    snippet: string;
    sourceType: "kb_document" | "patient_document" | "chat_attachment";
    kbDocumentId?: Id<"knowledgeBaseDocuments">;
    patientDocumentId?: Id<"documents">;
    chatAttachmentId?: string;
    pageNumber?: number;
}

interface CitationPreviewProps {
    source: CitationSource;
    onClose?: () => void;
}

export function CitationPreview({ source }: CitationPreviewProps) {
    const typeLabel = {
        kb_document: "Knowledge Base",
        patient_document: "Patient Record",
        chat_attachment: "Chat Attachment",
    }[source.sourceType];

    const TypeIcon = {
        kb_document: Database,
        patient_document: FileText,
        chat_attachment: Paperclip,
    }[source.sourceType];

    return (
        <div className="rounded-lg border bg-blue-50 p-4 mt-2 mb-4 text-sm">
            <div className="flex items-center gap-2 mb-2 font-semibold text-blue-900">
                <TypeIcon className="h-4 w-4" />
                <span>{source.title}</span>
            </div>
            <p className="text-blue-800 mb-2 italic">&quot;{source.snippet}&quot;</p>
            <span className="flex items-center gap-1 text-blue-600 text-xs">
                <ExternalLink className="h-3 w-3" />
                {typeLabel}
                {source.pageNumber && ` • Page ${source.pageNumber}`}
            </span>
        </div>
    );
}
