import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // --- USER ACCOUNTS ---
  users: defineTable({
    name: v.string(),
    email: v.string(),
    tokenIdentifier: v.string(),
    image: v.optional(v.string()),
    role: v.union(
      v.literal("admin"),
      v.literal("doctor"),
      v.literal("patient"),
      v.literal("caregiver")
    ),
    onboardingComplete: v.optional(v.boolean()),
    onboardingStep: v.optional(v.number()), // 1-5, tracks current step in onboarding

    // Stripe Subscription
    stripeCustomerId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
    stripePriceId: v.optional(v.string()),
    stripeCurrentPeriodEnd: v.optional(v.number()),
    stripeStatus: v.optional(v.string()),
    // Plan (free, pro, premium) - optional for backward compatibility (treat missing as free)
    plan: v.optional(v.string()),
  })
    .index("by_token", ["tokenIdentifier"])
    .index("by_email", ["email"])
    .index("by_stripe_customer_id", ["stripeCustomerId"])
    .index("by_stripe_subscription_id", ["stripeSubscriptionId"]),

  // --- PATIENT PROFILES ---
  patients: defineTable({
    userId: v.id("users"),
    dateOfBirth: v.string(), // Replaces age
    biologicalSex: v.union(v.literal("male"), v.literal("female"), v.literal("intersex")),
    genderIdentity: v.optional(v.string()),
    bloodType: v.optional(v.string()),
    heightCm: v.optional(v.number()),
    weightKg: v.optional(v.number()),

    // Complex Objects
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
  })
    .index("by_user", ["userId"]),

  // --- DOCUMENTS ---
  documents: defineTable({
    patientId: v.id("patients"),
    title: v.string(),
    category: v.union(
      v.literal("lab_report"),
      v.literal("imaging_report"),
      v.literal("clinical_note")
    ),
    fileUrl: v.string(),
    text_content: v.string(), // New field for OCR text
    embedding: v.optional(v.array(v.float64())),
    uploadedAt: v.number(),
    metadata: v.optional(v.any()),
  })
    .index("by_patient", ["patientId"])
    .index("by_category", ["patientId", "category"]),

  // --- CHATS & MESSAGES ---
  chats: defineTable({
    patientId: v.id("patients"),
    title: v.string(),
    createdAt: v.number(),
    lastMessageAt: v.number(),
    status: v.union(v.literal("active"), v.literal("archived")),
    knowledgeBaseId: v.optional(v.string()), // chromaCollectionId of selected KB
  })
    .index("by_patient_status", ["patientId", "status"]),

  messages: defineTable({
    chatId: v.id("chats"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    sources: v.optional(
      v.array(
        v.object({
          title: v.string(),
          snippet: v.optional(v.string()), // Optional - not all sources have snippets
          // Discriminated source type
          sourceType: v.union(
            v.literal("kb_document"),
            v.literal("patient_document"),
            v.literal("chat_attachment")
          ),
          // Only one should be set based on sourceType
          kbDocumentId: v.optional(v.id("knowledgeBaseDocuments")),
          patientDocumentId: v.optional(v.id("documents")),
          chatAttachmentId: v.optional(v.string()), // Placeholder for future
          pageNumber: v.optional(v.number()),
          chromaDocumentId: v.optional(v.string()), // For KB doc lookup via index
        })
      )
    ),
    createdAt: v.number(),
  })
    .index("by_chat", ["chatId"]),

  // --- KNOWLEDGE BASES (Admin-managed RAG collections) ---
  knowledgeBases: defineTable({
    name: v.string(),                    // e.g., "Cardiology", "Oncology"
    description: v.optional(v.string()), // Brief description for patients
    chromaCollectionId: v.string(),      // Synced ID: "kb_{nanoid}"
    createdBy: v.id("users"),            // Admin who created
    createdAt: v.number(),
    updatedAt: v.number(),
    documentCount: v.number(),           // Cached count
    isPublic: v.boolean(),               // If false, only admins see it
    isDefault: v.optional(v.boolean()),  // [NEW] Controls default selection
    status: v.union(
      v.literal("active"),
      v.literal("archived"),
      v.literal("deleting")              // Soft-lock during deletion
    ),
  })
    .index("by_status", ["status"])
    .index("by_public", ["isPublic", "status"])
    .index("by_chroma_id", ["chromaCollectionId"]),

  // --- KNOWLEDGE BASE DOCUMENTS ---
  knowledgeBaseDocuments: defineTable({
    knowledgeBaseId: v.id("knowledgeBases"),
    filename: v.string(),
    chromaDocumentId: v.string(),        // Synced ID: "doc_{nanoid}"
    storageId: v.id("_storage"),         // Link to Convex Storage file [NEW]
    fileSize: v.number(),
    pageCount: v.optional(v.number()),
    chunkCount: v.number(),
    uploadedBy: v.id("users"),
    uploadedAt: v.number(),
    status: v.union(
      v.literal("processing"),
      v.literal("ready"),
      v.literal("failed"),
      v.literal("deleting")
    ),
    errorMessage: v.optional(v.string()),
  })
    .index("by_knowledge_base", ["knowledgeBaseId"])
    .index("by_status", ["knowledgeBaseId", "status"])
    .index("by_chroma_id", ["chromaDocumentId"]),

  // --- SUBSCRIPTION USAGE TRACKING ---
  subscriptionUsage: defineTable({
    userId: v.id("users"),
    periodStart: v.number(),      // Billing period start (from subscription date)
    periodEnd: v.number(),        // Billing period end
    queryCount: v.number(),       // AI queries used this period
  })
    .index("by_user", ["userId"])
    .index("by_user_period", ["userId", "periodStart"]),
});