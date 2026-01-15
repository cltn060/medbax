import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Helper to generate nanoid-like IDs
function generateId(prefix: string): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = prefix + "_";
    for (let i = 0; i < 10; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// ============================================================================
// QUERIES
// ============================================================================

/**
 * List all knowledge bases (admin only)
 */
export const list = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!user || user.role !== "admin") return [];

        const knowledgeBases = await ctx.db
            .query("knowledgeBases")
            .withIndex("by_status", (q) => q.eq("status", "active"))
            .collect();

        return knowledgeBases;
    },
});

/**
 * List public knowledge bases (for patient chat selector)
 */
export const listPublic = query({
    args: {},
    handler: async (ctx) => {
        const knowledgeBases = await ctx.db
            .query("knowledgeBases")
            .withIndex("by_public", (q) => q.eq("isPublic", true).eq("status", "active"))
            .collect();

        return knowledgeBases.map((kb) => ({
            _id: kb._id,
            name: kb.name,
            description: kb.description,
            chromaCollectionId: kb.chromaCollectionId,
            documentCount: kb.documentCount,
            isDefault: kb.isDefault,
        }));
    },
});

/**
 * List documents in a PUBLIC knowledge base (for KB Browser panel)
 */
export const listPublicDocuments = query({
    args: { knowledgeBaseId: v.id("knowledgeBases") },
    handler: async (ctx, args) => {
        // Verify the KB is public
        const kb = await ctx.db.get(args.knowledgeBaseId);
        if (!kb || !kb.isPublic || kb.status !== "active") return [];

        const documents = await ctx.db
            .query("knowledgeBaseDocuments")
            .withIndex("by_knowledge_base", (q) => q.eq("knowledgeBaseId", args.knowledgeBaseId))
            .collect();

        return documents.map(doc => ({
            _id: doc._id,
            filename: doc.filename,
            pageCount: doc.pageCount,
            uploadedAt: doc.uploadedAt,
        }));
    },
});

/**
 * Get a single knowledge base by ID
 */
export const get = query({
    args: { id: v.id("knowledgeBases") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});

/**
 * List documents in a knowledge base
 */
export const listDocuments = query({
    args: { knowledgeBaseId: v.id("knowledgeBases") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!user || user.role !== "admin") return [];

        const documents = await ctx.db
            .query("knowledgeBaseDocuments")
            .withIndex("by_knowledge_base", (q) => q.eq("knowledgeBaseId", args.knowledgeBaseId))
            .collect();

        return documents;
    },
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create a new knowledge base
 */
export const create = mutation({
    args: {
        name: v.string(),
        description: v.optional(v.string()),
        isPublic: v.boolean(),
        isDefault: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!user || user.role !== "admin") {
            throw new Error("Only admins can create knowledge bases");
        }

        // Enforce single default logic
        if (args.isDefault) {
            const existingDefaults = await ctx.db
                .query("knowledgeBases")
                .filter(q => q.eq(q.field("isDefault"), true))
                .collect();

            for (const kb of existingDefaults) {
                await ctx.db.patch(kb._id, { isDefault: false });
            }
        }

        const chromaCollectionId = generateId("kb");
        const now = Date.now();

        const id = await ctx.db.insert("knowledgeBases", {
            name: args.name,
            description: args.description,
            chromaCollectionId,
            createdBy: user._id,
            createdAt: now,
            updatedAt: now,
            documentCount: 0,
            isPublic: args.isPublic,
            isDefault: args.isDefault,
            status: "active",
        });

        return { id, chromaCollectionId };
    },
});

/**
 * Update a knowledge base
 */
export const update = mutation({
    args: {
        id: v.id("knowledgeBases"),
        name: v.optional(v.string()),
        description: v.optional(v.string()),
        isPublic: v.optional(v.boolean()),
        isDefault: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!user || user.role !== "admin") {
            throw new Error("Only admins can update knowledge bases");
        }

        const kb = await ctx.db.get(args.id);
        if (!kb) throw new Error("Knowledge base not found");

        // Enforce single default logic
        if (args.isDefault) {
            const existingDefaults = await ctx.db
                .query("knowledgeBases")
                .filter(q => q.eq(q.field("isDefault"), true))
                .collect();

            for (const existing of existingDefaults) {
                if (existing._id !== args.id) {
                    await ctx.db.patch(existing._id, { isDefault: false });
                }
            }
        }

        await ctx.db.patch(args.id, {
            ...(args.name !== undefined && { name: args.name }),
            ...(args.description !== undefined && { description: args.description }),
            ...(args.isPublic !== undefined && { isPublic: args.isPublic }),
            ...(args.isDefault !== undefined && { isDefault: args.isDefault }),
            updatedAt: Date.now(),
        });

        return { success: true };
    },
});

/**
 * Archive a knowledge base (soft delete)
 */
export const archive = mutation({
    args: { id: v.id("knowledgeBases") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!user || user.role !== "admin") {
            throw new Error("Only admins can archive knowledge bases");
        }

        await ctx.db.patch(args.id, {
            status: "archived",
            updatedAt: Date.now(),
        });

        return { success: true };
    },
});

/**
 * Mark KB as deleting (called before FastAPI deletion)
 */
export const markDeleting = mutation({
    args: { id: v.id("knowledgeBases") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!user || user.role !== "admin") {
            throw new Error("Only admins can delete knowledge bases");
        }

        const kb = await ctx.db.get(args.id);
        if (!kb) throw new Error("Knowledge base not found");

        await ctx.db.patch(args.id, {
            status: "deleting",
            updatedAt: Date.now(),
        });

        return { chromaCollectionId: kb.chromaCollectionId };
    },
});

/**
 * Complete KB deletion (called after FastAPI confirms deletion)
 */
export const completeDelete = mutation({
    args: { id: v.id("knowledgeBases") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!user || user.role !== "admin") {
            throw new Error("Only admins can delete knowledge bases");
        }

        // Delete all associated documents
        const documents = await ctx.db
            .query("knowledgeBaseDocuments")
            .withIndex("by_knowledge_base", (q) => q.eq("knowledgeBaseId", args.id))
            .collect();

        for (const doc of documents) {
            await ctx.db.delete(doc._id);
        }

        // Delete the knowledge base
        await ctx.db.delete(args.id);

        return { success: true, documentsDeleted: documents.length };
    },
});

/**
 * Generate a short-lived upload URL for saving PDF to Convex Storage
 */
export const generateUploadUrl = mutation(async (ctx) => {
    return await ctx.storage.generateUploadUrl();
});

/**
 * Get a download URL for a file in storage
 */
export const getDocumentUrl = query({
    args: { storageId: v.id("_storage") },
    handler: async (ctx, args) => {
        return await ctx.storage.getUrl(args.storageId);
    },
});

/**
 * Get document by filename (for citation clicks)
 */
export const getDocumentByFilename = query({
    args: {
        knowledgeBaseId: v.id("knowledgeBases"),
        filename: v.string(),
    },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("knowledgeBaseDocuments")
            .withIndex("by_knowledge_base", (q) => q.eq("knowledgeBaseId", args.knowledgeBaseId))
            .filter((q) => q.eq(q.field("filename"), args.filename))
            .first();
    },
});

/**
 * Get KB document URL by document ID (for citation resolution)
 * This is the preferred method over filename-based lookup
 */
export const getKbDocumentUrlById = query({
    args: { id: v.id("knowledgeBaseDocuments") },
    handler: async (ctx, args) => {
        const doc = await ctx.db.get(args.id);
        if (!doc || !doc.storageId) return null;
        return await ctx.storage.getUrl(doc.storageId);
    },
});

/**
 * Get KB document URL by chromaDocumentId (indexed lookup)
 * This is THE preferred method for citation resolution - uses by_chroma_id index
 */
export const getKbDocumentByChromaId = query({
    args: { chromaDocumentId: v.string() },
    handler: async (ctx, args) => {
        const doc = await ctx.db
            .query("knowledgeBaseDocuments")
            .withIndex("by_chroma_id", (q) => q.eq("chromaDocumentId", args.chromaDocumentId))
            .first();

        if (!doc || !doc.storageId) return null;

        const url = await ctx.storage.getUrl(doc.storageId);
        return { url, documentId: doc._id, filename: doc.filename };
    },
});

/**
 * Get document URL by filename without needing KB ID
 * Useful for resolving citations where we only have the filename
 */
export const getDocumentUrlByFilename = query({
    args: { filename: v.string() },
    handler: async (ctx, args) => {
        const doc = await ctx.db
            .query("knowledgeBaseDocuments")
            .filter((q) => q.eq(q.field("filename"), args.filename))
            .first();

        if (!doc || !doc.storageId) return null;

        return await ctx.storage.getUrl(doc.storageId);
    },
});

/**
 * Add a document to a knowledge base (after FastAPI upload succeeds)
 */
export const addDocument = mutation({
    args: {
        knowledgeBaseId: v.id("knowledgeBases"),
        filename: v.string(),
        chromaDocumentId: v.string(),
        storageId: v.id("_storage"),
        fileSize: v.number(),
        pageCount: v.optional(v.number()),
        chunkCount: v.number(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!user || user.role !== "admin") {
            throw new Error("Only admins can add documents");
        }

        const kb = await ctx.db.get(args.knowledgeBaseId);
        if (!kb) throw new Error("Knowledge base not found");

        const docId = await ctx.db.insert("knowledgeBaseDocuments", {
            knowledgeBaseId: args.knowledgeBaseId,
            filename: args.filename,
            chromaDocumentId: args.chromaDocumentId,
            storageId: args.storageId,
            fileSize: args.fileSize,
            pageCount: args.pageCount,
            chunkCount: args.chunkCount,
            uploadedBy: user._id,
            uploadedAt: Date.now(),
            status: "ready",
        });

        // Update document count
        await ctx.db.patch(args.knowledgeBaseId, {
            documentCount: kb.documentCount + 1,
            updatedAt: Date.now(),
        });

        return { id: docId };
    },
});

/**
 * Mark document as deleting
 */
export const markDocumentDeleting = mutation({
    args: { documentId: v.id("knowledgeBaseDocuments") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!user || user.role !== "admin") {
            throw new Error("Only admins can delete documents");
        }

        const doc = await ctx.db.get(args.documentId);
        if (!doc) throw new Error("Document not found");

        await ctx.db.patch(args.documentId, { status: "deleting" });

        const kb = await ctx.db.get(doc.knowledgeBaseId);

        return {
            chromaCollectionId: kb?.chromaCollectionId,
            chromaDocumentId: doc.chromaDocumentId,
        };
    },
});

/**
 * Complete document deletion
 */
export const completeDocumentDelete = mutation({
    args: { documentId: v.id("knowledgeBaseDocuments") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!user || user.role !== "admin") {
            throw new Error("Only admins can delete documents");
        }

        const doc = await ctx.db.get(args.documentId);
        if (!doc) throw new Error("Document not found");

        const kb = await ctx.db.get(doc.knowledgeBaseId);
        if (kb) {
            await ctx.db.patch(doc.knowledgeBaseId, {
                documentCount: Math.max(0, kb.documentCount - 1),
                updatedAt: Date.now(),
            });
        }

        if (doc.storageId) {
            await ctx.storage.delete(doc.storageId);
        }

        await ctx.db.delete(args.documentId);

        return { success: true };
    },
});

/**
 * Generate a document ID for FastAPI upload
 */
export const generateDocumentId = mutation({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!user || user.role !== "admin") {
            throw new Error("Only admins can generate document IDs");
        }

        return { chromaDocumentId: generateId("doc") };
    },
});