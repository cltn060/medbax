import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// --- QUERIES ---

export const getMyPatient = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!user) return null;

        return await ctx.db
            .query("patients")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .unique();
    },
});

export const getByUserId = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("patients")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .unique();
    },
});

export const get = query({
    args: { id: v.id("patients") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});

// --- MUTATIONS ---

export const create = mutation({
    args: {
        // Demographics
        dateOfBirth: v.string(),
        biologicalSex: v.union(v.literal("male"), v.literal("female"), v.literal("intersex")),
        genderIdentity: v.optional(v.string()),
        bloodType: v.optional(v.string()),
        heightCm: v.optional(v.number()),
        weightKg: v.optional(v.number()),

        // Complex Arrays
        chronicConditions: v.array(
            v.object({
                condition: v.string(),
                diagnosedDate: v.optional(v.string()),
                status: v.union(v.literal("active"), v.literal("managed"), v.literal("remission")),
            })
        ),
        medications: v.array(
            v.object({
                name: v.string(),
                dosage: v.string(),
                frequency: v.string(),
                route: v.optional(v.string()),
                type: v.union(v.literal("prescription"), v.literal("supplement"), v.literal("otc")),
                startDate: v.optional(v.string()),
            })
        ),
        allergies: v.array(
            v.object({
                agent: v.string(),
                reactionType: v.union(v.literal("allergy"), v.literal("intolerance")),
                severity: v.optional(v.union(v.literal("mild"), v.literal("moderate"), v.literal("severe"))),
                reactionDetails: v.optional(v.string()),
            })
        ),
        surgeries: v.array(
            v.object({
                procedure: v.string(),
                date: v.optional(v.string()),
                notes: v.optional(v.string()),
                implants: v.optional(v.boolean()),
            })
        ),
        familyHistory: v.array(
            v.object({
                relation: v.string(),
                condition: v.string(),
            })
        ),
        socialHistory: v.object({
            smokingStatus: v.optional(v.string()),
            alcoholConsumption: v.optional(v.string()),
            occupation: v.optional(v.string()),
            recreationalDrugs: v.optional(v.boolean()),
        }),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!user) throw new Error("User not found");

        const existing = await ctx.db
            .query("patients")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .unique();

        if (existing) throw new Error("Patient profile already exists");

        // We can pass args directly because we perfectly matched the schema structure in 'args'
        const patientId = await ctx.db.insert("patients", {
            userId: user._id,
            ...args,
        });
        return patientId;
    },
});

export const update = mutation({
    args: {
        id: v.id("patients"),
        // Everything is optional for updates
        dateOfBirth: v.optional(v.string()),
        biologicalSex: v.optional(v.union(v.literal("male"), v.literal("female"), v.literal("intersex"))),
        genderIdentity: v.optional(v.string()),
        bloodType: v.optional(v.string()),
        heightCm: v.optional(v.number()),
        weightKg: v.optional(v.number()),

        // Note: In a real app, you might want specific "addCondition" mutations
        // instead of replacing the whole array, but for now we replace the list.
        chronicConditions: v.optional(v.array(
            v.object({
                condition: v.string(),
                diagnosedDate: v.optional(v.string()),
                status: v.union(v.literal("active"), v.literal("managed"), v.literal("remission")),
            })
        )),
        medications: v.optional(v.array(
            v.object({
                name: v.string(),
                dosage: v.string(),
                frequency: v.string(),
                route: v.optional(v.string()),
                type: v.union(v.literal("prescription"), v.literal("supplement"), v.literal("otc")),
                startDate: v.optional(v.string()),
            })
        )),
        allergies: v.optional(v.array(
            v.object({
                agent: v.string(),
                reactionType: v.union(v.literal("allergy"), v.literal("intolerance")),
                severity: v.optional(v.union(v.literal("mild"), v.literal("moderate"), v.literal("severe"))),
                reactionDetails: v.optional(v.string()),
            })
        )),
        surgeries: v.optional(v.array(
            v.object({
                procedure: v.string(),
                date: v.optional(v.string()),
                notes: v.optional(v.string()),
                implants: v.optional(v.boolean()),
            })
        )),
        familyHistory: v.optional(v.array(
            v.object({
                relation: v.string(),
                condition: v.string(),
            })
        )),
        socialHistory: v.optional(v.object({
            smokingStatus: v.optional(v.string()),
            alcoholConsumption: v.optional(v.string()),
            occupation: v.optional(v.string()),
            recreationalDrugs: v.optional(v.boolean()),
        })),
    },
    handler: async (ctx, args) => {
        const { id, ...updates } = args;
        await ctx.db.patch(id, updates);
    },
});