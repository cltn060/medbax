// convex/users.ts (or wherever this file is)
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const store = mutation({
  args: {}, // Auth is handled via ctx.auth
  handler: async (ctx) => {
    // 1. Get the authenticated user's identity from Clerk
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated: storeUser called without Clerk identity");
    }

    // 2. Look up existing user by Clerk's unique tokenIdentifier
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    // 3. If user exists → update name/image if they've changed
    if (existingUser) {
      const needsUpdate =
        existingUser.name !== identity.name ||
        existingUser.image !== identity.pictureUrl;

      if (needsUpdate) {
        await ctx.db.patch(existingUser._id, {
          name: identity.name ?? existingUser.name, // fallback if name is null
          image: identity.pictureUrl ?? existingUser.image,
        });
      }

      return existingUser._id;
    }

    // 4. New user → insert with role: "patient" and onboarding not complete
    const newUserId = await ctx.db.insert("users", {
      name: identity.name ?? "Unknown User", // safe fallback
      email: identity.email ?? "", // or throw if email is required
      tokenIdentifier: identity.tokenIdentifier,
      image: identity.pictureUrl,
      role: "patient" as const,
      onboardingComplete: false,
      onboardingStep: 1,
    });

    return newUserId;
  },
});


export const current = query({
  args: {},
  handler: async (ctx) => {
    // 1. Get the identity from Clerk
    const identity = await ctx.auth.getUserIdentity();

    // 2. If not logged in, return null (Frontend handles redirect)
    if (!identity) {
      return null;
    }

    // 3. Fetch the user from the database using the Clerk token
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    // 4. Return the user object (contains .role)
    return user;
  },
});

// --- ONBOARDING MUTATIONS ---

export const updateOnboardingStep = mutation({
  args: { step: v.number() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user) throw new Error("User not found");

    // Only update if the new step is greater (moving forward)
    // Default to 0 if onboardingStep is undefined (new user)
    if (args.step > (user.onboardingStep ?? 0)) {
      await ctx.db.patch(user._id, { onboardingStep: args.step });
    }

    return user._id;
  },
});

export const completeOnboarding = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user) throw new Error("User not found");

    await ctx.db.patch(user._id, {
      onboardingComplete: true,
      onboardingStep: 5, // Mark as fully complete
    });

    return user._id;
  },
});