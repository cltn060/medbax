/**
 * Custom hook for interacting with the FastAPI RAG backend.
 */

const RAG_API_URL = process.env.NEXT_PUBLIC_RAG_API_URL || "http://localhost:8000";

// ============================================================================
// Types
// ============================================================================

export interface CollectionInfo {
    collection_id: string;
    chunk_count: number;
    document_count: number;
}

export interface DocumentInfo {
    document_id: string;
    source: string;
    chunk_count: number;
}

// V1 sync upload response (kept for backwards compatibility)
export interface UploadResponse {
    message: string;
    document_id: string;
    filename: string;
    chunks_created: number;
    page_count: number;
}

// V2 async upload response - returned immediately when upload starts
export interface UploadTaskResponse {
    message: string;
    task_id: string;
    filename: string;
    collection_id: string;
}

// V2 task status response - returned when polling task status
export interface TaskStatusResponse {
    task_id: string;
    state: "PENDING" | "PROCESSING" | "SUCCESS" | "FAILURE";
    result?: {
        status: string;
        document_id?: string;
        filename?: string;
        collection_name?: string;
        chunks_created?: number;
        page_count?: number;
        error?: string;
        message?: string;
    };
    progress?: {
        step?: string;
        filename?: string;
        message?: string;
        blocks_extracted?: number;
        chunks_created?: number;
        page_count?: number;
    };
}

export interface DeleteResponse {
    message: string;
    chunks_deleted: number;
}

// ============================================================================
// Collection Operations
// ============================================================================

// Export RAG_API_URL for use in other files
export { RAG_API_URL };

/**
 * Create a new collection in LanceDB (V2) / ChromaDB (V1)
 */
export async function createCollection(collectionId: string, name: string): Promise<void> {
    const response = await fetch(`${RAG_API_URL}/collections/${collectionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to create collection");
    }
}

/**
 * Delete a collection from LanceDB (V2) / ChromaDB (V1)
 */
export async function deleteCollection(collectionId: string): Promise<DeleteResponse> {
    const response = await fetch(`${RAG_API_URL}/collections/${collectionId}`, {
        method: "DELETE",
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to delete collection");
    }

    return response.json();
}

/**
 * Get stats for a collection
 */
export async function getCollectionStats(collectionId: string): Promise<CollectionInfo> {
    const response = await fetch(`${RAG_API_URL}/collections/${collectionId}/stats`);

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to get collection stats");
    }

    return response.json();
}

// ============================================================================
// Document Operations
// ============================================================================

/**
 * Get the status of an async upload task (V2)
 */
export async function getTaskStatus(taskId: string): Promise<TaskStatusResponse> {
    const response = await fetch(`${RAG_API_URL}/tasks/${taskId}`);

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to get task status");
    }

    return response.json();
}

/**
 * Poll task status until completion or failure
 * @param taskId - The task ID to poll
 * @param onProgress - Optional callback for progress updates
 * @param pollInterval - Polling interval in ms (default: 2000)
 * @param maxAttempts - Maximum polling attempts (default: 300 = 10 minutes)
 */
export async function pollTaskCompletion(
    taskId: string,
    onProgress?: (status: TaskStatusResponse) => void,
    pollInterval: number = 2000,
    maxAttempts: number = 300
): Promise<TaskStatusResponse> {
    let attempts = 0;

    while (attempts < maxAttempts) {
        const status = await getTaskStatus(taskId);
        onProgress?.(status);

        if (status.state === "SUCCESS") {
            return status;
        }

        if (status.state === "FAILURE") {
            const errorMessage = status.result?.error || "Task failed";
            throw new Error(errorMessage);
        }

        // Wait before next poll
        await new Promise((resolve) => setTimeout(resolve, pollInterval));
        attempts++;
    }

    throw new Error("Task polling timed out");
}

/**
 * Upload a PDF document to a collection (V2 async workflow)
 * 
 * V2 uploads are non-blocking:
 * 1. Submit upload request -> returns task_id immediately
 * 2. Poll task status until SUCCESS/FAILURE
 * 3. Return final result with document_id and chunks_created
 */
export async function uploadDocument(
    collectionId: string,
    file: File,
    documentId?: string,
    onProgress?: (status: TaskStatusResponse) => void
): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append("file", file);

    const url = documentId
        ? `${RAG_API_URL}/upload/${collectionId}?document_id=${documentId}`
        : `${RAG_API_URL}/upload/${collectionId}`;

    // Step 1: Submit upload (returns immediately with task_id)
    const response = await fetch(url, {
        method: "POST",
        body: formData,
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to upload document");
    }

    const uploadTask: UploadTaskResponse = await response.json();

    // Step 2: Poll for completion
    const finalStatus = await pollTaskCompletion(uploadTask.task_id, onProgress);

    // Step 3: Return V1-compatible response format
    return {
        message: finalStatus.result?.message || "Document processed successfully",
        document_id: finalStatus.result?.document_id || documentId || "",
        filename: finalStatus.result?.filename || file.name,
        chunks_created: finalStatus.result?.chunks_created || 0,
        page_count: finalStatus.result?.page_count || 0,
    };
}

/**
 * Delete a document from a collection
 */
export async function deleteDocument(
    collectionId: string,
    documentId: string
): Promise<DeleteResponse> {
    const response = await fetch(
        `${RAG_API_URL}/embeddings/${collectionId}/${documentId}`,
        { method: "DELETE" }
    );

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to delete document");
    }

    return response.json();
}

/**
 * List documents in a collection
 */
export async function listDocuments(collectionId: string): Promise<DocumentInfo[]> {
    const response = await fetch(`${RAG_API_URL}/embeddings/${collectionId}`);

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to list documents");
    }

    const data = await response.json();
    return data.documents;
}

// ============================================================================
// Chat Operations
// ============================================================================

/**
 * Query the RAG system (non-streaming)
 */
export async function queryKnowledgeBase(
    collectionId: string,
    query: string
): Promise<string> {
    const response = await fetch(`${RAG_API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            query,
            collection_id: collectionId,
            include_sources: true,
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to query knowledge base");
    }

    const data = await response.json();
    return data.answer;
}

// Delimiter used by FastAPI to separate AI response from source metadata
const SOURCE_METADATA_DELIMITER = "\n\n<<<SOURCES_JSON>>>";

export interface RagSource {
    title: string;
    snippet: string;
    sourceType: "kb_document" | "patient_document" | "chat_attachment";
    chromaDocumentId?: string;
    pageNumber?: number;
}

/**
 * Query the RAG system with streaming
 * Supports conversation history for context
 * 
 * The FastAPI backend appends structured source metadata after the AI response.
 * This function parses both the streaming content and the source metadata.
 */
export async function queryKnowledgeBaseStream(
    collectionId: string,
    query: string,
    onChunk: (text: string) => void,
    onError?: (error: Error) => void,
    onComplete?: (sources?: RagSource[]) => void,
    conversationHistory?: { role: "user" | "assistant"; content: string }[]
): Promise<void> {
    try {
        const response = await fetch(`${RAG_API_URL}/chat/stream`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                query,
                collection_id: collectionId,
                include_sources: true,
                conversation_history: conversationHistory || [],
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || "Failed to query knowledge base");
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
            throw new Error("No response body");
        }

        let fullResponse = "";
        let emittedLength = 0; // Track how much we've already emitted

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const text = decoder.decode(value);
            fullResponse += text;

            // Check if the delimiter is in fullResponse
            const delimiterIndex = fullResponse.indexOf(SOURCE_METADATA_DELIMITER);

            if (delimiterIndex === -1) {
                // No delimiter yet, emit all new content
                const newContent = fullResponse.substring(emittedLength);
                if (newContent) {
                    onChunk(newContent);
                    emittedLength = fullResponse.length;
                }
            } else {
                // Delimiter found - emit any remaining content before it
                const contentBeforeDelimiter = fullResponse.substring(0, delimiterIndex);
                const unEmittedContent = contentBeforeDelimiter.substring(emittedLength);
                if (unEmittedContent) {
                    onChunk(unEmittedContent);
                    emittedLength = delimiterIndex;
                }
                // Stop streaming once we hit the delimiter
            }
        }

        // Parse sources from the response if delimiter is present
        let sources: RagSource[] | undefined;
        if (fullResponse.includes(SOURCE_METADATA_DELIMITER)) {
            const [, sourcesJson] = fullResponse.split(SOURCE_METADATA_DELIMITER);

            try {
                sources = JSON.parse(sourcesJson.trim());
            } catch (e) {
                console.warn("Failed to parse source metadata:", e);
            }
        }

        onComplete?.(sources);
    } catch (error) {
        onError?.(error as Error);
    }
}

export interface ChatMessage {
    role: "user" | "assistant";
    content: string;
}

/**
 * General chat with AI (no RAG, no KB required)
 * Supports conversation history for context
 */
export async function generalChatStream(
    query: string,
    onChunk: (text: string) => void,
    onError?: (error: Error) => void,
    onComplete?: () => void,
    conversationHistory?: ChatMessage[]
): Promise<void> {
    try {
        const response = await fetch(`${RAG_API_URL}/chat/general/stream`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                query,
                conversation_history: conversationHistory || []
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || "Failed to get AI response");
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
            throw new Error("No response body");
        }

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const text = decoder.decode(value);
            onChunk(text);
        }

        onComplete?.();
    } catch (error) {
        onError?.(error as Error);
    }
}

// ============================================================================
// Health Check
// ============================================================================

/**
 * Check if the RAG backend is healthy
 */
export async function checkHealth(): Promise<{
    status: string;
    total_collections: number;
}> {
    const response = await fetch(`${RAG_API_URL}/`);

    if (!response.ok) {
        throw new Error("RAG backend is not available");
    }

    return response.json();
}
