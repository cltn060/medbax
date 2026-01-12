import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// --- CHATS ---

export const createChat = mutation({
    args: {
        patientId: v.id("patients"),
        title: v.string(),
        knowledgeBaseId: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const chatId = await ctx.db.insert("chats", {
            patientId: args.patientId,
            title: args.title,
            createdAt: Date.now(),
            lastMessageAt: Date.now(),
            status: "active",
            knowledgeBaseId: args.knowledgeBaseId,
        });
        return chatId;
    },
});

export const listChats = query({
    args: {
        patientId: v.id("patients"),
    },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("chats")
            .withIndex("by_patient_status", (q) =>
                q.eq("patientId", args.patientId).eq("status", "active")
            )
            .order("desc")
            .collect();
    },
});

export const getChat = query({
    args: { chatId: v.id("chats") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.chatId);
    },
});

// --- MESSAGES ---

export const getMessages = query({
    args: { chatId: v.id("chats") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("messages")
            .withIndex("by_chat", (q) => q.eq("chatId", args.chatId))
            .collect();
    },
});

export const sendMessage = mutation({
    args: {
        chatId: v.id("chats"),
        role: v.union(v.literal("user"), v.literal("assistant")),
        content: v.string(),
        sources: v.optional(
            v.array(
                v.object({
                    title: v.string(),
                    snippet: v.string(),
                    sourceType: v.union(
                        v.literal("kb_document"),
                        v.literal("patient_document"),
                        v.literal("chat_attachment")
                    ),
                    kbDocumentId: v.optional(v.id("knowledgeBaseDocuments")),
                    patientDocumentId: v.optional(v.id("documents")),
                    chatAttachmentId: v.optional(v.string()),
                    pageNumber: v.optional(v.number()),
                    chromaDocumentId: v.optional(v.string()),
                })
            )
        ),
    },
    handler: async (ctx, args) => {
        // 1. Check Usage Limit
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        // Helper to check limit internally (reusing logic or calling internal query helper if possible, 
        // but queries can't be called from mutations directly in the same transaction easily without `ctx.runQuery` which might be overhead?
        // Actually, we can just duplicate the check logic or use a shared helper function (not an API query).
        // Since we are in a mutation, we can read.

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .first();

        if (!user) throw new Error("User not found");

        // Simple limit check (duplicating logic for speed/simplicity in mutation)
        // Ideally import QUERY_LIMITS from a shared file.
        const QUERY_LIMITS = { free: 20, pro: 100, premium: 1000 };
        const plan = (user.plan as keyof typeof QUERY_LIMITS) || "free";
        const limit = QUERY_LIMITS[plan] || 20;

        // Get current usage
        // We need to calculate period start same as subscriptionUsage.ts
        const now = new Date();
        const start = new Date(user._creationTime);
        const months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
        const periodStart = new Date(start);
        periodStart.setMonth(start.getMonth() + months);
        if (now.getDate() < start.getDate()) periodStart.setMonth(periodStart.getMonth() - 1);

        const usage = await ctx.db
            .query("subscriptionUsage")
            .withIndex("by_user_period", (q) => q.eq("userId", user._id).eq("periodStart", periodStart.getTime()))
            .first();

        if ((usage?.queryCount ?? 0) >= limit) {
            throw new Error("QUERY_LIMIT_REACHED");
        }

        // 2. Insert message
        await ctx.db.insert("messages", {
            chatId: args.chatId,
            role: args.role,
            content: args.content,
            sources: args.sources,
            createdAt: Date.now(),
        });

        // 3. Update chat timestamp
        await ctx.db.patch(args.chatId, {
            lastMessageAt: Date.now(),
        });

        // 4. Increment Usage
        if (usage) {
            await ctx.db.patch(usage._id, { queryCount: usage.queryCount + 1 });
        } else {
            const periodEnd = new Date(periodStart);
            periodEnd.setMonth(periodEnd.getMonth() + 1);
            await ctx.db.insert("subscriptionUsage", {
                userId: user._id,
                periodStart: periodStart.getTime(),
                periodEnd: periodEnd.getTime(),
                queryCount: 1,
            });
        }
    },
});

export const deleteChat = mutation({
    args: { chatId: v.id("chats") },
    handler: async (ctx, args) => {
        // 1. Delete all messages associated with the chat
        const messages = await ctx.db
            .query("messages")
            .withIndex("by_chat", (q) => q.eq("chatId", args.chatId))
            .collect();

        for (const msg of messages) {
            await ctx.db.delete(msg._id);
        }

        // 2. Delete the chat itself
        await ctx.db.delete(args.chatId);
    },
});

export const updateChatKB = mutation({
    args: {
        chatId: v.id("chats"),
        knowledgeBaseId: v.optional(v.string()), // null to clear
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.chatId, {
            knowledgeBaseId: args.knowledgeBaseId,
        });
    },
});