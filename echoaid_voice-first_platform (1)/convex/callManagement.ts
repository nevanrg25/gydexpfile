import { action, internalAction, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// Define proper types for call management
const transferredToValidator = v.object({
  providerId: v.string(),
  providerName: v.string(),
  contactPerson: v.optional(v.string())
});

// Main call handling system
export const handleIncomingCall = action({
  args: {
    fromNumber: v.string(),
    callSid: v.string(),
    language: v.optional(v.string())
  },
  handler: async (ctx, args): Promise<any> => {
    try {
      // Create or retrieve session
      const session: any = await ctx.runMutation(internal.callManagement.createOrUpdateSession, {
        phoneNumber: args.fromNumber,
        language: args.language || "hi" // Default to Hindi
      });

      // Log the incoming call
      await ctx.runMutation(internal.callManagement.logCall, {
        sessionId: session.sessionId,
        callType: "inbound",
        fromNumber: args.fromNumber,
        callSid: args.callSid,
        status: "connected"
      });

      // Generate welcome message based on user history
      const welcomeMessage: any = await ctx.runAction(internal.callManagement.generateWelcomeMessage, {
        sessionId: session.sessionId,
        language: session.language,
        isReturningUser: session.isReturningUser
      });

      return {
        sessionId: session.sessionId,
        welcomeMessage,
        language: session.language,
        nextAction: "listen_for_input"
      };
    } catch (error) {
      console.error("Call handling error:", error);
      return {
        error: "Failed to handle incoming call",
        fallbackMessage: "नमस्ते, मैं EchoAid हूं। मैं आपकी सहायता करने के लिए यहां हूं।" // Hindi fallback
      };
    }
  }
});

// Transfer call to service provider
export const transferCall = action({
  args: {
    sessionId: v.string(),
    providerId: v.string(),
    transferReason: v.string(),
    urgencyLevel: v.optional(v.string())
  },
  handler: async (ctx, args): Promise<any> => {
    try {
      // Get provider details
      const provider: any = await ctx.runQuery(internal.callManagement.getServiceProvider, {
        providerId: args.providerId
      });

      if (!provider) {
        throw new Error("Service provider not found");
      }

      // Check provider availability
      const availability = await ctx.runAction(internal.callManagement.checkProviderAvailability, {
        providerId: args.providerId,
        urgencyLevel: args.urgencyLevel
      });

      if (!availability.available) {
        // Find alternative provider
        const alternative: any = await ctx.runAction(internal.callManagement.findAlternativeProvider, {
          originalProviderId: args.providerId,
          sessionId: args.sessionId,
          urgencyLevel: args.urgencyLevel
        });

        if (alternative) {
          return await ctx.runAction(internal.callManagement.executeTransfer, {
            sessionId: args.sessionId,
            provider: alternative,
            transferReason: args.transferReason,
            isAlternative: true
          });
        } else {
          return {
            success: false,
            message: "सभी सेवा प्रदाता व्यस्त हैं। कृपया कुछ समय बाद कॉल करें या मैं आपका संदेश रिकॉर्ड कर सकता हूं।",
            alternatives: ["schedule_callback", "record_message", "emergency_transfer"]
          };
        }
      }

      // Execute transfer
      return await ctx.runAction(internal.callManagement.executeTransfer, {
        sessionId: args.sessionId,
        provider,
        transferReason: args.transferReason,
        isAlternative: false
      });
    } catch (error) {
      console.error("Transfer error:", error);
      return {
        success: false,
        message: "कॉल ट्रांसफर में समस्या हुई। कृपया दोबारा कोशिश करें।",
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }
});

// Schedule callback for busy providers
export const scheduleCallback = action({
  args: {
    sessionId: v.string(),
    providerId: v.string(),
    preferredTime: v.optional(v.string()),
    urgencyLevel: v.string()
  },
  handler: async (ctx, args) => {
    try {
      const session = await ctx.runQuery(internal.callManagement.getSession, {
        sessionId: args.sessionId
      });

      if (!session) {
        throw new Error("Session not found");
      }

      // Calculate callback time based on urgency and provider availability
      const callbackTime = calculateCallbackTime(args.urgencyLevel, args.preferredTime);

      // Schedule the callback
      await ctx.scheduler.runAt(callbackTime, internal.callManagement.executeCallback, {
        sessionId: args.sessionId,
        providerId: args.providerId,
        phoneNumber: session.phoneNumber || "",
        urgencyLevel: args.urgencyLevel
      });

      // Log the scheduled callback
      await ctx.runMutation(internal.callManagement.logCall, {
        sessionId: args.sessionId,
        callType: "scheduled_callback",
        fromNumber: session.phoneNumber || "",
        status: "scheduled",
        scheduledTime: callbackTime
      });

      const confirmationMessage = generateCallbackConfirmation(callbackTime, session.language);

      return {
        success: true,
        message: confirmationMessage,
        callbackTime,
        referenceNumber: `CB${Date.now().toString().slice(-6)}`
      };
    } catch (error) {
      console.error("Callback scheduling error:", error);
      return {
        success: false,
        message: "कॉलबैक शेड्यूल करने में समस्या हुई।"
      };
    }
  }
});

// Handle missed call callback system
export const handleMissedCall = action({
  args: {
    phoneNumber: v.string(),
    timestamp: v.number()
  },
  handler: async (ctx, args) => {
    try {
      // Check if this is a known user
      const existingSession = await ctx.runQuery(internal.callManagement.findRecentSession, {
        phoneNumber: args.phoneNumber
      });

      // Create callback session
      const sessionId = `missed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await ctx.runMutation(internal.callManagement.createMissedCallSession, {
        sessionId,
        phoneNumber: args.phoneNumber,
        timestamp: args.timestamp,
        hasHistory: !!existingSession
      });

      // Schedule immediate callback (within 2 minutes)
      const callbackTime = Date.now() + (2 * 60 * 1000);
      
      await ctx.scheduler.runAt(callbackTime, internal.callManagement.executeMissedCallCallback, {
        sessionId,
        phoneNumber: args.phoneNumber,
        hasHistory: !!existingSession
      });

      return {
        success: true,
        sessionId,
        callbackScheduled: true,
        callbackTime
      };
    } catch (error) {
      console.error("Missed call handling error:", error);
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  }
});

// Internal actions and mutations
export const createOrUpdateSession = internalMutation({
  args: {
    phoneNumber: v.string(),
    language: v.string()
  },
  handler: async (ctx, args) => {
    // Check for existing recent session
    const existingSession = await ctx.db
      .query("voiceSessions")
      .withIndex("by_phone", (q) => q.eq("phoneNumber", args.phoneNumber))
      .filter((q) => q.gt(q.field("lastActivity"), Date.now() - 24 * 60 * 60 * 1000)) // Within 24 hours
      .first();

    if (existingSession) {
      // Update existing session
      await ctx.db.patch(existingSession._id, {
        lastActivity: Date.now(),
        status: "active"
      });

      return {
        sessionId: existingSession.sessionId,
        language: existingSession.language,
        isReturningUser: true
      };
    } else {
      // Create new session
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await ctx.db.insert("voiceSessions", {
        sessionId,
        phoneNumber: args.phoneNumber,
        language: args.language,
        status: "active",
        createdAt: Date.now(),
        lastActivity: Date.now()
      });

      return {
        sessionId,
        language: args.language,
        isReturningUser: false
      };
    }
  }
});

export const generateWelcomeMessage = internalAction({
  args: {
    sessionId: v.string(),
    language: v.string(),
    isReturningUser: v.boolean()
  },
  handler: async (ctx, args) => {
    const welcomeMessages: Record<string, {new: string, returning: string}> = {
      "hi": {
        new: "नमस्ते! मैं EchoAid हूं। मैं आपको सरकारी योजनाओं और सहायता सेवाओं से जोड़ने में मदद करता हूं। आप मुझसे हिंदी में बात कर सकते हैं। आपको किस प्रकार की सहायता चाहिए?",
        returning: "नमस्ते! EchoAid में आपका स्वागत है। मैं आपकी पिछली बातचीत याद रखता हूं। आज मैं आपकी कैसे सहायता कर सकता हूं?"
      },
      "en": {
        new: "Hello! I'm EchoAid. I help connect you with government schemes and support services. You can speak to me in English or any Indian language. What kind of help do you need today?",
        returning: "Hello! Welcome back to EchoAid. I remember our previous conversation. How can I help you today?"
      },
      "ta": {
        new: "வணக்கம்! நான் EchoAid. அரசு திட்டங்கள் மற்றும் உதவி சேவைகளுடன் உங்களை இணைக்க உதவுகிறேன். உங்களுக்கு என்ன உதவி தேவை?",
        returning: "வணக்கம்! EchoAid-க்கு மீண்டும் வரவேற்கிறோம். இன்று நான் உங்களுக்கு எப்படி உதவ முடியும்?"
      }
    };

    const messages = welcomeMessages[args.language] || welcomeMessages["hi"];
    return args.isReturningUser ? messages.returning : messages.new;
  }
});

export const executeTransfer = internalAction({
  args: {
    sessionId: v.string(),
    provider: v.object({
      providerId: v.string(),
      name: v.string(),
      contact: v.object({
        phone: v.string(),
        contactPerson: v.optional(v.string())
      })
    }),
    transferReason: v.string(),
    isAlternative: v.boolean()
  },
  handler: async (ctx, args) => {
    try {
      // Log the transfer attempt
      await ctx.runMutation(internal.callManagement.logCall, {
        sessionId: args.sessionId,
        callType: "transfer",
        fromNumber: "",
        toNumber: args.provider.contact.phone,
        status: "attempting",
        transferredTo: {
          providerId: args.provider.providerId,
          providerName: args.provider.name,
          contactPerson: args.provider.contact.contactPerson
        }
      });

      // In a real implementation, this would use Twilio or similar service
      // to actually transfer the call
      const transferResult = await simulateCallTransfer(args.provider.contact.phone);

      // Update call log with result
      await ctx.runMutation(internal.callManagement.updateCallStatus, {
        sessionId: args.sessionId,
        status: transferResult.success ? "connected" : "failed",
        duration: transferResult.duration
      });

      if (transferResult.success) {
        return {
          success: true,
          message: args.isAlternative 
            ? "मैं आपको एक वैकल्पिक सेवा प्रदाता से जोड़ रहा हूं। कृपया लाइन पर रुकें।"
            : "मैं आपको सही व्यक्ति से जोड़ रहा हूं। कृपया लाइन पर रुकें।",
          provider: args.provider.name,
          transferTime: Date.now()
        };
      } else {
        return {
          success: false,
          message: "कनेक्शन में समस्या हुई। क्या मैं आपका संदेश रिकॉर्ड कर सकता हूं?",
          alternatives: ["record_message", "schedule_callback", "try_another_provider"]
        };
      }
    } catch (error) {
      console.error("Transfer execution error:", error);
      return {
        success: false,
        message: "तकनीकी समस्या के कारण कॉल ट्रांसफर नहीं हो सका।"
      };
    }
  }
});

// Helper functions
function calculateCallbackTime(urgencyLevel: string, preferredTime?: string): number {
  const now = Date.now();
  
  switch (urgencyLevel) {
    case "emergency":
      return now + (5 * 60 * 1000); // 5 minutes
    case "urgent":
      return now + (30 * 60 * 1000); // 30 minutes
    case "normal":
      return now + (2 * 60 * 60 * 1000); // 2 hours
    default:
      return now + (4 * 60 * 60 * 1000); // 4 hours
  }
}

function generateCallbackConfirmation(callbackTime: number, language: string): string {
  const time = new Date(callbackTime).toLocaleTimeString('hi-IN');
  
  const messages: Record<string, string> = {
    "hi": `आपका कॉलबैक ${time} बजे शेड्यूल किया गया है। हम आपको कॉल करेंगे।`,
    "en": `Your callback is scheduled for ${time}. We will call you back.`,
    "ta": `உங்கள் கால்பேக் ${time} மணிக்கு திட்டமிடப்பட்டுள்ளது। நாங்கள் உங்களை அழைப்போம்।`
  };
  
  return messages[language] || messages["hi"];
}

async function simulateCallTransfer(phoneNumber: string): Promise<{success: boolean, duration?: number}> {
  // In a real implementation, this would use Twilio's call transfer API
  // For simulation, we'll randomly succeed/fail based on realistic scenarios
  const success = Math.random() > 0.2; // 80% success rate
  const duration = success ? Math.floor(Math.random() * 300) + 60 : undefined; // 1-5 minutes if successful
  
  return { success, duration };
}

// Additional internal functions
export const getSession = internalQuery({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("voiceSessions")
      .withIndex("by_session_id", (q) => q.eq("sessionId", args.sessionId))
      .unique();
  }
});

export const getServiceProvider = internalQuery({
  args: { providerId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("serviceProviders")
      .filter((q) => q.eq(q.field("providerId"), args.providerId))
      .unique();
  }
});

export const logCall = internalMutation({
  args: {
    sessionId: v.string(),
    callType: v.string(),
    fromNumber: v.string(),
    toNumber: v.optional(v.string()),
    status: v.string(),
    transferredTo: v.optional(transferredToValidator),
    scheduledTime: v.optional(v.number()),
    callSid: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const logId = `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await ctx.db.insert("callLogs", {
      logId,
      sessionId: args.sessionId,
      callType: args.callType,
      fromNumber: args.fromNumber,
      toNumber: args.toNumber,
      status: args.status,
      transferredTo: args.transferredTo,
      followUpRequired: args.status === "failed",
      timestamp: args.scheduledTime || Date.now()
    });
  }
});

export const updateCallStatus = internalMutation({
  args: {
    sessionId: v.string(),
    status: v.string(),
    duration: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const callLog = await ctx.db
      .query("callLogs")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .order("desc")
      .first();
    
    if (callLog) {
      await ctx.db.patch(callLog._id, {
        status: args.status,
        duration: args.duration
      });
    }
  }
});

// Additional helper functions for missed calls and callbacks...
export const findRecentSession = internalQuery({
  args: { phoneNumber: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("voiceSessions")
      .withIndex("by_phone", (q) => q.eq("phoneNumber", args.phoneNumber))
      .filter((q) => q.gt(q.field("lastActivity"), Date.now() - 7 * 24 * 60 * 60 * 1000)) // Within 7 days
      .first();
  }
});

export const createMissedCallSession = internalMutation({
  args: {
    sessionId: v.string(),
    phoneNumber: v.string(),
    timestamp: v.number(),
    hasHistory: v.boolean()
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("voiceSessions", {
      sessionId: args.sessionId,
      phoneNumber: args.phoneNumber,
      language: "hi", // Default language for missed calls
      status: "missed_call_pending",
      createdAt: args.timestamp,
      lastActivity: args.timestamp
    });
  }
});

export const executeCallback = internalAction({
  args: {
    sessionId: v.string(),
    providerId: v.string(),
    phoneNumber: v.string(),
    urgencyLevel: v.string()
  },
  handler: async (ctx, args) => {
    // Implementation for executing scheduled callbacks
    console.log(`Executing callback for session ${args.sessionId}`);
    // In real implementation, this would initiate an outbound call
  }
});

export const executeMissedCallCallback = internalAction({
  args: {
    sessionId: v.string(),
    phoneNumber: v.string(),
    hasHistory: v.boolean()
  },
  handler: async (ctx, args) => {
    // Implementation for missed call callbacks
    console.log(`Executing missed call callback for ${args.phoneNumber}`);
    // In real implementation, this would initiate an outbound call
  }
});

export const checkProviderAvailability = internalAction({
  args: {
    providerId: v.string(),
    urgencyLevel: v.optional(v.string())
  },
  handler: async (ctx, args): Promise<any> => {
    const provider: any = await ctx.runQuery(internal.callManagement.getServiceProvider, {
      providerId: args.providerId
    });
    
    if (!provider) {
      return { available: false, reason: "Provider not found" };
    }
    
    // Check capacity and availability
    const capacityAvailable: boolean = provider.capacity.currentLoad < provider.capacity.maxCapacity;
    const isEmergencyTime = args.urgencyLevel === "emergency";
    const isWithinHours = checkBusinessHours(provider.availability.hours);
    
    const available: boolean = capacityAvailable && (isEmergencyTime || provider.availability.emergency24x7 || isWithinHours);
    
    return {
      available,
      reason: !available ? "Provider busy or outside hours" : undefined,
      waitTime: provider.capacity.waitTime
    };
  }
});

export const findAlternativeProvider = internalAction({
  args: {
    originalProviderId: v.string(),
    sessionId: v.string(),
    urgencyLevel: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    // Get session context to find similar providers
    const session = await ctx.runQuery(internal.callManagement.getSession, {
      sessionId: args.sessionId
    });
    
    // Find alternative providers with similar services
    // This would be implemented based on the routing logic
    return null; // Placeholder
  }
});

function checkBusinessHours(hours: string): boolean {
  // Simple business hours check - in real implementation would be more sophisticated
  const now = new Date();
  const currentHour = now.getHours();
  
  if (hours === "24x7") return true;
  if (hours === "business_hours") return currentHour >= 9 && currentHour <= 18;
  
  return true; // Default to available
}
