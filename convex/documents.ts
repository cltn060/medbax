import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Generate a short-lived upload URL for patient documents
 */
export const generateUploadUrl = mutation(async (ctx) => {
    return await ctx.storage.generateUploadUrl();
});

/**
 * Add a patient document after upload to storage
 */
export const addPatientDocument = mutation({
    args: {
        patientId: v.id("patients"),
        title: v.string(),
        category: v.union(
            v.literal("lab_report"),
            v.literal("imaging_report"),
            v.literal("clinical_note")
        ),
        storageId: v.id("_storage"),
        fileSize: v.number(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        // Verify patient belongs to user
        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!user) throw new Error("User not found");

        const patient = await ctx.db.get(args.patientId);
        if (!patient || patient.userId !== user._id) {
            throw new Error("Unauthorized access to patient");
        }

        const docId = await ctx.db.insert("documents", {
            patientId: args.patientId,
            title: args.title,
            category: args.category,
            fileUrl: "", // Will use storageId instead
            text_content: "", // OCR can be added later
            uploadedAt: Date.now(),
            metadata: {
                storageId: args.storageId,
                fileSize: args.fileSize,
            },
        });
        return docId;
    },
});

/**
 * Get document download URL from storage
 */
export const getDocumentUrl = query({
    args: { storageId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.storage.getUrl(args.storageId as any);
    },
});

/**
 * Delete a patient document
 */
export const deleteDocument = mutation({
    args: { id: v.id("documents") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!user) throw new Error("User not found");

        const doc = await ctx.db.get(args.id);
        if (!doc) throw new Error("Document not found");

        // Verify ownership through patient
        const patient = await ctx.db.get(doc.patientId);
        if (!patient || patient.userId !== user._id) {
            throw new Error("Unauthorized");
        }

        // Delete from storage if storageId exists
        const storageId = doc.metadata?.storageId;
        if (storageId) {
            await ctx.storage.delete(storageId);
        }

        await ctx.db.delete(args.id);
        return { success: true };
    },
});

export const uploadDocument = mutation({
    args: {
        patientId: v.id("patients"), // Made strictly required for medical safety
        title: v.string(),
        category: v.union(
            v.literal("lab_report"),
            v.literal("imaging_report"),
            v.literal("clinical_note")
        ),
        content: v.string(), // Raw content or file path
        fileUrl: v.string(),
        text_content: v.string(), // OCR extracted text
        embedding: v.optional(v.array(v.float64())),
        metadata: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        const docId = await ctx.db.insert("documents", {
            patientId: args.patientId,
            title: args.title,
            category: args.category,
            fileUrl: args.fileUrl,
            text_content: args.text_content, // Make sure you pass this from frontend
            embedding: args.embedding,
            metadata: args.metadata,
            uploadedAt: Date.now(),
        });
        return docId;
    },
});

export const listDocuments = query({
    args: {
        patientId: v.id("patients"),
        category: v.optional(v.union(
            v.literal("lab_report"),
            v.literal("imaging_report"),
            v.literal("clinical_note")
        )),
    },
    handler: async (ctx, args) => {
        const baseQuery = ctx.db
            .query("documents")
            .withIndex("by_patient", (q) => q.eq("patientId", args.patientId));

        const docs = await baseQuery.collect();

        // In-memory filter if category is provided (since we don't have a specific compound index for every option)
        // Or you can use the "by_category" index if you defined it in schema.ts
        if (args.category) {
            return docs.filter(doc => doc.category === args.category);
        }
        return docs;
    },
});

export const getDocument = query({
    args: { id: v.id("documents") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});

/**
 * Get all documents for a patient with storage URLs resolved
 */
export const getPatientDocuments = query({
    args: { patientId: v.id("patients") },
    handler: async (ctx, args) => {
        const docs = await ctx.db
            .query("documents")
            .withIndex("by_patient", (q) => q.eq("patientId", args.patientId))
            .collect();

        // Enrich with storage URLs
        return await Promise.all(
            docs.map(async (doc) => {
                let fileUrl = doc.fileUrl;
                const storageId = doc.metadata?.storageId;
                if (storageId) {
                    fileUrl = await ctx.storage.getUrl(storageId) || "";
                }
                return {
                    _id: doc._id,
                    title: doc.title,
                    category: doc.category,
                    fileUrl,
                    fileSize: doc.metadata?.fileSize || 0,
                    storageId: storageId || null,
                    uploadedAt: doc.uploadedAt,
                };
            })
        );
    },
});
