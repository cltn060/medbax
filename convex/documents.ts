import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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