import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  // User sessions and interactions
  voiceSessions: defineTable({
    sessionId: v.string(),
    phoneNumber: v.optional(v.string()),
    language: v.string(),
    location: v.optional(v.object({
      state: v.string(),
      district: v.string(),
      coordinates: v.optional(v.object({
        lat: v.number(),
        lng: v.number()
      }))
    })),
    userProfile: v.optional(v.object({
      name: v.optional(v.string()),
      age: v.optional(v.number()),
      gender: v.optional(v.string()),
      category: v.optional(v.string()), // migrant, homeless, trans, undocumented
      verificationMethod: v.optional(v.string()),
      communityReferral: v.optional(v.string()),
      verifiedAt: v.optional(v.number()),
      verificationId: v.optional(v.string()),
      trustLevel: v.optional(v.string())
    })),
    status: v.string(), // active, completed, transferred
    createdAt: v.number(),
    lastActivity: v.number()
  }).index("by_session_id", ["sessionId"])
    .index("by_phone", ["phoneNumber"])
    .index("by_status", ["status"]),

  // Voice interactions and transcripts
  voiceInteractions: defineTable({
    sessionId: v.string(),
    interactionId: v.string(),
    userInput: v.object({
      audioUrl: v.optional(v.string()),
      transcript: v.string(),
      language: v.string(),
      confidence: v.number()
    }),
    aiResponse: v.object({
      intent: v.string(),
      entities: v.array(v.object({
        type: v.string(),
        value: v.string(),
        confidence: v.number()
      })),
      responseText: v.string(),
      audioUrl: v.optional(v.string()),
      actions: v.array(v.string())
    }),
    timestamp: v.number()
  }).index("by_session", ["sessionId"])
    .index("by_intent", ["aiResponse.intent"]),

  // Welfare schemes and services database
  welfareSchemes: defineTable({
    schemeId: v.string(),
    name: v.object({
      en: v.string(),
      hi: v.string(),
      ta: v.optional(v.string()),
      bn: v.optional(v.string()),
      te: v.optional(v.string()),
      mr: v.optional(v.string()),
      kn: v.optional(v.string())
    }),
    description: v.object({
      en: v.string(),
      hi: v.string(),
      ta: v.optional(v.string()),
      bn: v.optional(v.string()),
      te: v.optional(v.string()),
      mr: v.optional(v.string()),
      kn: v.optional(v.string())
    }),
    category: v.string(), // employment, shelter, food, healthcare, legal, education
    eligibility: v.array(v.string()),
    targetGroups: v.array(v.string()),
    applicationProcess: v.object({
      steps: v.array(v.string()),
      documentsRequired: v.array(v.string()),
      alternativeVerification: v.array(v.string())
    }),
    contactInfo: v.object({
      helpline: v.optional(v.string()),
      website: v.optional(v.string()),
      offices: v.array(v.object({
        location: v.string(),
        address: v.string(),
        phone: v.string(),
        coordinates: v.optional(v.object({
          lat: v.number(),
          lng: v.number()
        }))
      }))
    }),
    isActive: v.boolean(),
    lastUpdated: v.number()
  }).index("by_category", ["category"])
    .index("by_target_group", ["targetGroups"])
    .index("by_active", ["isActive"]),

  // NGO and service provider directory
  serviceProviders: defineTable({
    providerId: v.string(),
    name: v.string(),
    type: v.string(), // ngo, government, helpline, emergency
    services: v.array(v.string()),
    languages: v.array(v.string()),
    location: v.object({
      state: v.string(),
      district: v.string(),
      address: v.string(),
      coordinates: v.optional(v.object({
        lat: v.number(),
        lng: v.number()
      }))
    }),
    contact: v.object({
      phone: v.string(),
      whatsapp: v.optional(v.string()),
      email: v.optional(v.string()),
      website: v.optional(v.string())
    }),
    availability: v.object({
      hours: v.string(),
      days: v.array(v.string()),
      emergency24x7: v.boolean()
    }),
    capacity: v.object({
      currentLoad: v.number(),
      maxCapacity: v.number(),
      waitTime: v.string()
    }),
    verification: v.object({
      isVerified: v.boolean(),
      verifiedBy: v.string(),
      verificationDate: v.number(),
      rating: v.number()
    }),
    specializations: v.array(v.string()), // migrant, homeless, trans, women, children
    isActive: v.boolean()
  }).index("by_type", ["type"])
    .index("by_location", ["location.state", "location.district"])
    .index("by_services", ["services"])
    .index("by_specialization", ["specializations"])
    .index("by_verified", ["verification.isVerified"]),

  // Emergency contacts and helplines
  emergencyContacts: defineTable({
    contactId: v.string(),
    name: v.object({
      en: v.string(),
      hi: v.string(),
      ta: v.optional(v.string()),
      bn: v.optional(v.string()),
      te: v.optional(v.string()),
      mr: v.optional(v.string()),
      kn: v.optional(v.string())
    }),
    category: v.string(), // police, medical, mental_health, legal, domestic_violence
    phone: v.string(),
    shortCode: v.optional(v.string()), // like 100, 108, 181
    coverage: v.string(), // national, state, district
    location: v.optional(v.object({
      state: v.optional(v.string()),
      district: v.optional(v.string())
    })),
    languages: v.array(v.string()),
    availability: v.string(), // 24x7, business_hours
    description: v.object({
      en: v.string(),
      hi: v.string(),
      ta: v.optional(v.string()),
      bn: v.optional(v.string()),
      te: v.optional(v.string()),
      mr: v.optional(v.string()),
      kn: v.optional(v.string())
    }),
    priority: v.number(), // 1 = highest priority
    isActive: v.boolean()
  }).index("by_category", ["category"])
    .index("by_coverage", ["coverage"])
    .index("by_priority", ["priority"]),

  // Call logs and transfers
  callLogs: defineTable({
    logId: v.string(),
    sessionId: v.string(),
    callType: v.string(), // inbound, outbound, transfer
    fromNumber: v.string(),
    toNumber: v.optional(v.string()),
    duration: v.optional(v.number()),
    status: v.string(), // connected, failed, busy, no_answer
    transferredTo: v.optional(v.object({
      providerId: v.string(),
      providerName: v.string(),
      contactPerson: v.optional(v.string())
    })),
    outcome: v.optional(v.string()),
    followUpRequired: v.boolean(),
    notes: v.optional(v.string()),
    timestamp: v.number()
  }).index("by_session", ["sessionId"])
    .index("by_status", ["status"])
    .index("by_call_type", ["callType"]),

  // Analytics and insights
  analytics: defineTable({
    date: v.string(), // YYYY-MM-DD
    metrics: v.object({
      totalCalls: v.number(),
      uniqueUsers: v.number(),
      successfulConnections: v.number(),
      averageCallDuration: v.number(),
      topIntents: v.array(v.object({
        intent: v.string(),
        count: v.number()
      })),
      languageDistribution: v.object({
        hi: v.number(),
        en: v.number(),
        ta: v.number(),
        bn: v.number(),
        te: v.number(),
        mr: v.number(),
        kn: v.number()
      }),
      categoryDistribution: v.object({
        employment: v.number(),
        shelter: v.number(),
        food: v.number(),
        healthcare: v.number(),
        legal: v.number(),
        emergency: v.number()
      }),
      userCategories: v.object({
        migrant: v.number(),
        homeless: v.number(),
        trans: v.number(),
        undocumented: v.number(),
        other: v.number()
      })
    })
  }).index("by_date", ["date"])
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
