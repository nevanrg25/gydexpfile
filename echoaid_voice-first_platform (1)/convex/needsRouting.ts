import { action, internalAction, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// Define proper types for needs routing
const entityValidator = v.object({
  type: v.string(),
  value: v.string(),
  confidence: v.number()
});

const locationValidator = v.object({
  state: v.string(),
  district: v.string()
});

// Main routing engine that matches user needs to appropriate services
export const routeUserNeeds = action({
  args: {
    sessionId: v.string(),
    intent: v.string(),
    entities: v.array(entityValidator),
    userLocation: v.optional(locationValidator)
  },
  handler: async (ctx, args): Promise<any> => {
    try {
      // Get user session context
      const session: any = await ctx.runQuery(internal.needsRouting.getSessionContext, {
        sessionId: args.sessionId
      });

      // Route based on intent
      let routingResult;
      switch (args.intent) {
        case "employment":
          routingResult = await ctx.runAction(internal.needsRouting.routeEmploymentNeeds, {
            entities: args.entities,
            userProfile: session?.userProfile,
            location: args.userLocation || session?.location
          });
          break;
        
        case "shelter":
          routingResult = await ctx.runAction(internal.needsRouting.routeShelterNeeds, {
            entities: args.entities,
            userProfile: session?.userProfile,
            location: args.userLocation || session?.location
          });
          break;
        
        case "food":
          routingResult = await ctx.runAction(internal.needsRouting.routeFoodAssistance, {
            entities: args.entities,
            userProfile: session?.userProfile,
            location: args.userLocation || session?.location
          });
          break;
        
        case "healthcare":
          routingResult = await ctx.runAction(internal.needsRouting.routeHealthcareNeeds, {
            entities: args.entities,
            userProfile: session?.userProfile,
            location: args.userLocation || session?.location
          });
          break;
        
        case "legal_aid":
          routingResult = await ctx.runAction(internal.needsRouting.routeLegalAid, {
            entities: args.entities,
            userProfile: session?.userProfile,
            location: args.userLocation || session?.location
          });
          break;
        
        case "emergency":
          routingResult = await ctx.runAction(internal.needsRouting.routeEmergency, {
            entities: args.entities,
            userProfile: session?.userProfile,
            location: args.userLocation || session?.location
          });
          break;
        
        default:
          routingResult = await ctx.runAction(internal.needsRouting.routeGeneralHelp, {
            entities: args.entities,
            userProfile: session?.userProfile,
            location: args.userLocation || session?.location
          });
      }

      return routingResult;
    } catch (error) {
      console.error("Routing error:", error);
      return {
        success: false,
        message: "I'm having trouble understanding your request. Let me connect you with someone who can help.",
        actions: ["transfer_to_human"]
      };
    }
  }
});

// Employment needs routing
export const routeEmploymentNeeds = internalAction({
  args: {
    entities: v.array(entityValidator),
    userProfile: v.optional(v.any()),
    location: v.optional(locationValidator)
  },
  handler: async (ctx, args): Promise<any> => {
    // Find relevant employment schemes
    const schemes: any = await ctx.runQuery(internal.needsRouting.findWelfareSchemes, {
      category: "employment",
      location: args.location,
      userProfile: args.userProfile
    });

    // Find employment service providers
    const providers: any = await ctx.runQuery(internal.needsRouting.findServiceProviders, {
      services: ["employment", "job_placement", "skill_training"],
      location: args.location,
      userCategory: args.userProfile?.category
    });

    const response = generateEmploymentResponse(schemes, providers, args.userProfile);
    
    return {
      success: true,
      intent: "employment",
      schemes,
      providers,
      response,
      actions: ["provide_schemes", "connect_to_provider", "schedule_callback"]
    };
  }
});

// Shelter needs routing
export const routeShelterNeeds = internalAction({
  args: {
    entities: v.array(entityValidator),
    userProfile: v.optional(v.any()),
    location: v.optional(locationValidator)
  },
  handler: async (ctx, args): Promise<any> => {
    // Check for urgency
    const isUrgent = args.entities.some(e => 
      e.type === "urgency" && ["urgent", "immediate", "tonight"].includes(e.value.toLowerCase())
    );

    // Find shelter providers
    const providers: any = await ctx.runQuery(internal.needsRouting.findServiceProviders, {
      services: ["shelter", "temporary_housing", "night_shelter"],
      location: args.location,
      userCategory: args.userProfile?.category,
      emergency: isUrgent
    });

    // Find relevant housing schemes
    const schemes: any = await ctx.runQuery(internal.needsRouting.findWelfareSchemes, {
      category: "shelter",
      location: args.location,
      userProfile: args.userProfile
    });

    const response = generateShelterResponse(providers, schemes, isUrgent, args.userProfile);
    
    return {
      success: true,
      intent: "shelter",
      urgent: isUrgent,
      providers,
      schemes,
      response,
      actions: isUrgent ? ["immediate_transfer", "provide_directions"] : ["provide_options", "schedule_visit"]
    };
  }
});

// Emergency routing
export const routeEmergency = internalAction({
  args: {
    entities: v.array(entityValidator),
    userProfile: v.optional(v.any()),
    location: v.optional(locationValidator)
  },
  handler: async (ctx, args): Promise<any> => {
    // Determine emergency type
    const emergencyType = determineEmergencyType(args.entities);
    
    // Get emergency contacts
    const emergencyContacts: any = await ctx.runQuery(internal.needsRouting.findEmergencyContacts, {
      category: emergencyType,
      location: args.location
    });

    const response = generateEmergencyResponse(emergencyType, emergencyContacts);
    
    return {
      success: true,
      intent: "emergency",
      emergencyType,
      contacts: emergencyContacts,
      response,
      actions: ["immediate_transfer", "provide_emergency_numbers"]
    };
  }
});

// Helper functions for response generation
function generateEmploymentResponse(schemes: any[], providers: any[], userProfile: any): string {
  const category = userProfile?.category || "job seeker";
  let response = `I understand you're looking for employment opportunities. `;
  
  if (schemes.length > 0) {
    response += `There are ${schemes.length} government schemes that might help you. `;
  }
  
  if (providers.length > 0) {
    response += `I've also found ${providers.length} organizations nearby that provide job placement services. `;
  }
  
  response += `Would you like me to connect you with someone who can help, or would you prefer to hear about specific programs first?`;
  
  return response;
}

function generateShelterResponse(providers: any[], schemes: any[], isUrgent: boolean, userProfile: any): string {
  if (isUrgent) {
    return `I understand you need shelter urgently. Let me immediately connect you with the nearest shelter that has availability. Please stay on the line.`;
  }
  
  let response = `I can help you find shelter options. `;
  
  if (providers.length > 0) {
    response += `There are ${providers.length} shelters and housing services in your area. `;
  }
  
  response += `Would you like me to check availability and connect you with the nearest one?`;
  
  return response;
}

function generateEmergencyResponse(emergencyType: string, contacts: any[]): string {
  return `This sounds like an emergency situation. I'm going to connect you immediately with the appropriate helpline. Please stay on the line while I transfer your call.`;
}

function determineEmergencyType(entities: any[]): string {
  const emergencyKeywords = {
    "medical": ["sick", "injured", "hospital", "doctor", "pain", "bleeding"],
    "police": ["crime", "theft", "violence", "assault", "robbery", "harassment"],
    "mental_health": ["suicide", "depression", "anxiety", "mental", "counseling"],
    "domestic_violence": ["abuse", "violence", "domestic", "beaten", "threatened"],
    "legal": ["arrest", "detention", "legal", "court", "lawyer"]
  };

  for (const entity of entities) {
    for (const [type, keywords] of Object.entries(emergencyKeywords)) {
      if (keywords.some(keyword => entity.value.toLowerCase().includes(keyword))) {
        return type;
      }
    }
  }
  
  return "general";
}

// Internal queries
export const getSessionContext = internalQuery({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("voiceSessions")
      .withIndex("by_session_id", (q) => q.eq("sessionId", args.sessionId))
      .unique();
  }
});

export const findWelfareSchemes = internalQuery({
  args: {
    category: v.string(),
    location: v.optional(locationValidator),
    userProfile: v.optional(v.any())
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("welfareSchemes")
      .withIndex("by_category", (q) => q.eq("category", args.category))
      .filter((q) => q.eq(q.field("isActive"), true));

    const schemes = await query.collect();
    
    // Filter by user eligibility and location if available
    return schemes.filter(scheme => {
      // Add eligibility and location filtering logic here
      return true;
    }).slice(0, 5); // Limit to top 5 relevant schemes
  }
});

export const findServiceProviders = internalQuery({
  args: {
    services: v.array(v.string()),
    location: v.optional(locationValidator),
    userCategory: v.optional(v.string()),
    emergency: v.optional(v.boolean())
  },
  handler: async (ctx, args) => {
    let providers = await ctx.db
      .query("serviceProviders")
      .withIndex("by_verified", (q) => q.eq("verification.isVerified", true))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Filter by services, location, and specialization
    providers = providers.filter(provider => {
      const hasService = provider.services.some((service: string) => 
        args.services.includes(service)
      );
      
      const locationMatch = !args.location || 
        (provider.location.state === args.location.state && 
         provider.location.district === args.location.district);
      
      const specializationMatch = !args.userCategory || 
        provider.specializations.includes(args.userCategory);
      
      const emergencyAvailable = !args.emergency || 
        provider.availability.emergency24x7;
      
      return hasService && locationMatch && specializationMatch && emergencyAvailable;
    });

    // Sort by capacity and rating
    providers.sort((a, b) => {
      const aScore = (a.verification.rating * 0.7) + 
                    ((a.capacity.maxCapacity - a.capacity.currentLoad) / a.capacity.maxCapacity * 0.3);
      const bScore = (b.verification.rating * 0.7) + 
                    ((b.capacity.maxCapacity - b.capacity.currentLoad) / b.capacity.maxCapacity * 0.3);
      return bScore - aScore;
    });

    return providers.slice(0, 3); // Return top 3 providers
  }
});

export const findEmergencyContacts = internalQuery({
  args: {
    category: v.string(),
    location: v.optional(locationValidator)
  },
  handler: async (ctx, args) => {
    let contacts = await ctx.db
      .query("emergencyContacts")
      .withIndex("by_category", (q) => q.eq("category", args.category))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Sort by priority and coverage
    contacts.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      
      // Prefer local over state over national
      const getCoverageScore = (coverage: string) => {
        if (coverage === "district") return 3;
        if (coverage === "state") return 2;
        return 1;
      };
      
      return getCoverageScore(b.coverage) - getCoverageScore(a.coverage);
    });

    return contacts.slice(0, 3);
  }
});

// Additional routing functions for other needs...
export const routeFoodAssistance = internalAction({
  args: {
    entities: v.array(entityValidator),
    userProfile: v.optional(v.any()),
    location: v.optional(locationValidator)
  },
  handler: async (ctx, args) => {
    // Implementation for food assistance routing
    return {
      success: true,
      intent: "food",
      response: "I can help you find food assistance programs in your area.",
      actions: ["provide_food_centers", "connect_to_provider"]
    };
  }
});

export const routeHealthcareNeeds = internalAction({
  args: {
    entities: v.array(entityValidator),
    userProfile: v.optional(v.any()),
    location: v.optional(locationValidator)
  },
  handler: async (ctx, args) => {
    // Implementation for healthcare routing
    return {
      success: true,
      intent: "healthcare",
      response: "I can help you access healthcare services and medical assistance.",
      actions: ["provide_health_centers", "connect_to_provider"]
    };
  }
});

export const routeLegalAid = internalAction({
  args: {
    entities: v.array(entityValidator),
    userProfile: v.optional(v.any()),
    location: v.optional(locationValidator)
  },
  handler: async (ctx, args) => {
    // Implementation for legal aid routing
    return {
      success: true,
      intent: "legal_aid",
      response: "I can connect you with legal aid services and assistance.",
      actions: ["provide_legal_contacts", "connect_to_lawyer"]
    };
  }
});

export const routeGeneralHelp = internalAction({
  args: {
    entities: v.array(entityValidator),
    userProfile: v.optional(v.any()),
    location: v.optional(locationValidator)
  },
  handler: async (ctx, args) => {
    // Implementation for general help routing
    return {
      success: true,
      intent: "general_help",
      response: "I'm here to help you access various social services. Can you tell me more about what you need?",
      actions: ["ask_for_clarification", "provide_menu"]
    };
  }
});
