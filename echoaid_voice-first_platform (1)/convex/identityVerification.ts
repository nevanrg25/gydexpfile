import { action, internalAction, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// Define proper types for verification data
const selfDeclarationValidator = v.object({
  name: v.string(),
  age: v.optional(v.number()),
  location: v.optional(v.string()),
  situation: v.string(),
  needsDescription: v.string(),
  consentToHelp: v.boolean()
});

const communityReferralValidator = v.object({
  referrerName: v.string(),
  referrerContact: v.string(),
  referrerOrganization: v.optional(v.string()),
  userDetails: v.object({
    name: v.string(),
    situation: v.string(),
    needsDescription: v.string()
  }),
  relationshipToUser: v.string()
});

const voiceConsentValidator = v.object({
  consentText: v.string(),
  audioUrl: v.optional(v.string()),
  consentType: v.string(),
  timestamp: v.number()
});

const documentValidator = v.object({
  documentType: v.string(),
  documentNumber: v.optional(v.string()),
  issuingAuthority: v.optional(v.string()),
  hasPhysicalDocument: v.boolean(),
  canProvideDetails: v.boolean()
});

// Flexible identity verification system that doesn't require Aadhaar
export const initiateVerification = action({
  args: {
    sessionId: v.string(),
    verificationType: v.string(),
    verificationData: v.union(
      selfDeclarationValidator,
      communityReferralValidator,
      voiceConsentValidator,
      documentValidator
    )
  },
  handler: async (ctx, args): Promise<any> => {
    try {
      let verificationResult;
      
      switch (args.verificationType) {
        case "self_declaration":
          verificationResult = await ctx.runAction(internal.identityVerification.processSelfDeclaration, {
            sessionId: args.sessionId,
            declarationData: args.verificationData as any
          });
          break;
        
        case "community_referral":
          verificationResult = await ctx.runAction(internal.identityVerification.processCommunityReferral, {
            sessionId: args.sessionId,
            referralData: args.verificationData as any
          });
          break;
        
        case "voice_consent":
          verificationResult = await ctx.runAction(internal.identityVerification.processVoiceConsent, {
            sessionId: args.sessionId,
            consentData: args.verificationData as any
          });
          break;
        
        case "document_alternative":
          verificationResult = await ctx.runAction(internal.identityVerification.processAlternativeDocuments, {
            sessionId: args.sessionId,
            documentData: args.verificationData as any
          });
          break;
        
        default:
          throw new Error("Invalid verification type");
      }

      // Update session with verification status
      await ctx.runMutation(internal.identityVerification.updateSessionVerification, {
        sessionId: args.sessionId,
        verificationResult
      });

      return verificationResult;
    } catch (error) {
      console.error("Verification error:", error);
      return {
        success: false,
        message: "Verification failed. Let's try a different method.",
        alternativeMethods: ["self_declaration", "community_referral"]
      };
    }
  }
});

// Self-declaration verification (most inclusive)
export const processSelfDeclaration = internalAction({
  args: {
    sessionId: v.string(),
    declarationData: selfDeclarationValidator
  },
  handler: async (ctx, args) => {
    // Basic validation of self-declaration
    const isValid = validateSelfDeclaration(args.declarationData);
    
    if (!isValid) {
      return {
        success: false,
        message: "Please provide more information to help us assist you better.",
        requiredFields: ["name", "situation", "needsDescription"]
      };
    }

    // Create verification record
    const verificationId = `self_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      success: true,
      verificationId,
      method: "self_declaration",
      trustLevel: "basic",
      message: "Thank you for providing your information. We'll help you access the services you need.",
      userProfile: {
        name: args.declarationData.name,
        age: args.declarationData.age,
        category: categorizeUser(args.declarationData.situation),
        verificationMethod: "self_declaration",
        trustLevel: "basic"
      }
    };
  }
});

// Community referral verification (higher trust)
export const processCommunityReferral = internalAction({
  args: {
    sessionId: v.string(),
    referralData: communityReferralValidator
  },
  handler: async (ctx, args) => {
    // Validate referrer (check against known community workers/NGOs)
    const referrerValidation = await validateCommunityReferrer(args.referralData);
    
    const verificationId = `comm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      success: true,
      verificationId,
      method: "community_referral",
      trustLevel: referrerValidation.isKnown ? "verified" : "basic",
      message: "Thank you for the referral. We'll prioritize assistance based on community recommendation.",
      userProfile: {
        name: args.referralData.userDetails.name,
        category: categorizeUser(args.referralData.userDetails.situation),
        verificationMethod: "community_referral",
        communityReferral: args.referralData.referrerName,
        trustLevel: referrerValidation.isKnown ? "verified" : "basic"
      }
    };
  }
});

// Voice consent verification (for ongoing services)
export const processVoiceConsent = internalAction({
  args: {
    sessionId: v.string(),
    consentData: voiceConsentValidator
  },
  handler: async (ctx, args) => {
    // Analyze consent for completeness and understanding
    const consentAnalysis = await analyzeVoiceConsent(args.consentData.consentText);
    
    const verificationId = `voice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      success: consentAnalysis.isValid,
      verificationId,
      method: "voice_consent",
      trustLevel: "verified",
      message: consentAnalysis.isValid 
        ? "Your consent has been recorded. We can now provide personalized assistance."
        : "We need clearer consent to proceed. Let me explain what we're asking for.",
      consentRecord: {
        type: args.consentData.consentType,
        timestamp: args.consentData.timestamp,
        audioUrl: args.consentData.audioUrl,
        isValid: consentAnalysis.isValid
      }
    };
  }
});

// Alternative document verification
export const processAlternativeDocuments = internalAction({
  args: {
    sessionId: v.string(),
    documentData: documentValidator
  },
  handler: async (ctx, args) => {
    const documentValidation = validateAlternativeDocument(args.documentData);
    
    const verificationId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      success: documentValidation.isAcceptable,
      verificationId,
      method: "document_alternative",
      trustLevel: documentValidation.trustLevel,
      message: documentValidation.message,
      acceptedDocument: {
        type: args.documentData.documentType,
        hasPhysical: args.documentData.hasPhysicalDocument,
        trustLevel: documentValidation.trustLevel
      }
    };
  }
});

// Helper functions
function validateSelfDeclaration(data: {
  name: string;
  age?: number;
  location?: string;
  situation: string;
  needsDescription: string;
  consentToHelp: boolean;
}): boolean {
  return !!(data.name && data.situation && data.needsDescription && data.consentToHelp);
}

function categorizeUser(situation: string): string {
  const categories: Record<string, string> = {
    "homeless": "homeless",
    "migrant": "migrant",
    "unemployed": "unemployed",
    "transgender": "trans",
    "undocumented": "undocumented",
    "refugee": "refugee",
    "domestic_violence": "domestic_violence_survivor"
  };
  
  for (const [key, category] of Object.entries(categories)) {
    if (situation.toLowerCase().includes(key)) {
      return category;
    }
  }
  
  return "general";
}

async function validateCommunityReferrer(referralData: {
  referrerName: string;
  referrerContact: string;
  referrerOrganization?: string;
  userDetails: {
    name: string;
    situation: string;
    needsDescription: string;
  };
  relationshipToUser: string;
}): Promise<{isKnown: boolean, organization?: string}> {
  // In a real implementation, this would check against a database of known community workers
  // For now, we'll do basic validation
  const knownOrganizations = [
    "Aajeevika", "SEWA", "Goonj", "Akshaya Patra", "Smile Foundation",
    "CRY", "Teach for India", "Pratham", "Helpage India"
  ];
  
  const isKnownOrg = referralData.referrerOrganization && 
    knownOrganizations.some(org => 
      referralData.referrerOrganization!.toLowerCase().includes(org.toLowerCase())
    );
  
  return {
    isKnown: !!isKnownOrg,
    organization: referralData.referrerOrganization
  };
}

async function analyzeVoiceConsent(consentText: string): Promise<{isValid: boolean, concerns?: string[]}> {
  // Analyze consent text for key elements
  const requiredElements = [
    "agree", "consent", "understand", "yes", "allow"
  ];
  
  const hasConsent = requiredElements.some(element => 
    consentText.toLowerCase().includes(element)
  );
  
  const concerns = [];
  if (consentText.toLowerCase().includes("no") || consentText.toLowerCase().includes("don't")) {
    concerns.push("Possible refusal detected");
  }
  
  return {
    isValid: hasConsent && concerns.length === 0,
    concerns
  };
}

function validateAlternativeDocument(documentData: {
  documentType: string;
  documentNumber?: string;
  issuingAuthority?: string;
  hasPhysicalDocument: boolean;
  canProvideDetails: boolean;
}): {isAcceptable: boolean, trustLevel: string, message: string} {
  const acceptableDocuments = [
    "ration_card", "voter_id", "bank_passbook", "school_id", 
    "employment_card", "pension_card", "disability_certificate"
  ];
  
  const isAcceptable = acceptableDocuments.includes(documentData.documentType);
  
  if (!isAcceptable) {
    return {
      isAcceptable: false,
      trustLevel: "none",
      message: "This document type is not sufficient. Let's try self-declaration instead."
    };
  }
  
  const trustLevel = documentData.hasPhysicalDocument ? "verified" : "basic";
  const message = documentData.hasPhysicalDocument 
    ? "Thank you. Your document is acceptable for verification."
    : "We can work with the information you've provided.";
  
  return {
    isAcceptable: true,
    trustLevel,
    message
  };
}

// Internal mutations and queries
export const updateSessionVerification = internalMutation({
  args: {
    sessionId: v.string(),
    verificationResult: v.object({
      success: v.boolean(),
      verificationId: v.optional(v.string()),
      method: v.optional(v.string()),
      trustLevel: v.optional(v.string()),
      message: v.string(),
      userProfile: v.optional(v.object({
        name: v.optional(v.string()),
        age: v.optional(v.number()),
        category: v.optional(v.string()),
        verificationMethod: v.optional(v.string()),
        communityReferral: v.optional(v.string()),
        trustLevel: v.optional(v.string())
      }))
    })
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("voiceSessions")
      .withIndex("by_session_id", (q) => q.eq("sessionId", args.sessionId))
      .unique();
    
    if (!session) {
      throw new Error("Session not found");
    }
    
    const existingProfile = session.userProfile || {};
    const newProfile = args.verificationResult.userProfile || {};
    
    await ctx.db.patch(session._id, {
      userProfile: {
        ...existingProfile,
        ...newProfile,
        verifiedAt: Date.now(),
        verificationId: args.verificationResult.verificationId
      },
      lastActivity: Date.now()
    });
  }
});

// Get verification status for a session
export const getVerificationStatus = internalQuery({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("voiceSessions")
      .withIndex("by_session_id", (q) => q.eq("sessionId", args.sessionId))
      .unique();
    
    if (!session?.userProfile) {
      return { verified: false, method: null, trustLevel: "none" };
    }
    
    return {
      verified: !!session.userProfile.verificationMethod,
      method: session.userProfile.verificationMethod,
      trustLevel: "basic",
      verifiedAt: undefined
    };
  }
});
