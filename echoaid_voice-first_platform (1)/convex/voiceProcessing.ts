import { action, internalAction, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// Define proper types for voice processing
const userInputValidator = v.object({
  transcript: v.string(),
  language: v.string(),
  confidence: v.number()
});

const intentDataValidator = v.object({
  intent: v.string(),
  entities: v.array(v.object({
    type: v.string(),
    value: v.string(),
    confidence: v.number()
  })),
  emotionalState: v.optional(v.string()),
  actions: v.array(v.string()),
  responseText: v.optional(v.string())
});

// Speech-to-Text processing using Whisper API
export const processVoiceInput = action({
  args: {
    audioUrl: v.string(),
    sessionId: v.string(),
    language: v.optional(v.string())
  },
  handler: async (ctx, args): Promise<any> => {
    try {
      // Use OpenAI Whisper for speech recognition
      const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "multipart/form-data"
        },
        body: JSON.stringify({
          file: args.audioUrl,
          model: "whisper-1",
          language: args.language || "auto",
          response_format: "verbose_json"
        })
      });

      const transcription = await response.json();
      
      // Process the transcribed text for intent recognition
      const intentResult: any = await ctx.runAction(internal.voiceProcessing.recognizeIntent, {
        text: transcription.text,
        sessionId: args.sessionId,
        language: transcription.language || args.language || "en",
        confidence: transcription.confidence || 0.8
      });

      return {
        transcript: transcription.text,
        language: transcription.language,
        confidence: transcription.confidence,
        intent: intentResult
      };
    } catch (error) {
      console.error("Voice processing error:", error);
      throw new Error("Failed to process voice input");
    }
  }
});

// Intent recognition using GPT-4 for natural language understanding
export const recognizeIntent = internalAction({
  args: {
    text: v.string(),
    sessionId: v.string(),
    language: v.string(),
    confidence: v.number()
  },
  handler: async (ctx, args) => {
    try {
      const session = await ctx.runQuery(internal.voiceProcessing.getSession, {
        sessionId: args.sessionId
      });

      const systemPrompt = `You are EchoAid, an AI assistant helping digitally excluded populations access social welfare services in India. 

Analyze the user's voice input and identify:
1. Primary intent (employment, shelter, food, healthcare, legal_aid, emergency, identity_verification, location_help)
2. Entities (location, urgency level, user category, specific needs)
3. Emotional state (distressed, calm, urgent, confused)
4. Required actions

User context: ${session ? JSON.stringify(session.userProfile) : 'New user'}
Location: ${session?.location ? JSON.stringify(session.location) : 'Unknown'}

Respond in JSON format with empathy and cultural sensitivity.`;

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-4",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: args.text }
          ],
          temperature: 0.3,
          max_tokens: 500
        })
      });

      const result = await response.json();
      const intentData = JSON.parse(result.choices[0].message.content);

      // Store the interaction
      await ctx.runMutation(internal.voiceProcessing.storeInteraction, {
        sessionId: args.sessionId,
        userInput: {
          transcript: args.text,
          language: args.language,
          confidence: args.confidence
        },
        intentData
      });

      return intentData;
    } catch (error) {
      console.error("Intent recognition error:", error);
      return {
        intent: "help_general",
        entities: [],
        emotionalState: "unknown",
        actions: ["provide_general_help"]
      };
    }
  }
});

// Text-to-Speech generation for multilingual responses
export const generateVoiceResponse = action({
  args: {
    text: v.string(),
    language: v.string(),
    voice: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    try {
      // Use Google Cloud Text-to-Speech for Indian languages
      const response = await fetch("https://texttospeech.googleapis.com/v1/text:synthesize", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.GOOGLE_CLOUD_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          input: { text: args.text },
          voice: {
            languageCode: args.language,
            name: args.voice || getDefaultVoice(args.language),
            ssmlGender: "NEUTRAL"
          },
          audioConfig: {
            audioEncoding: "MP3",
            speakingRate: 0.9,
            pitch: 0.0,
            volumeGainDb: 0.0
          }
        })
      });

      const result = await response.json();
      
      // Store audio in Convex storage
      const audioBlob = new Blob([Buffer.from(result.audioContent, 'base64')], {
        type: 'audio/mpeg'
      });
      
      const storageId = await ctx.storage.store(audioBlob);
      const audioUrl = await ctx.storage.getUrl(storageId);

      return {
        audioUrl,
        storageId,
        text: args.text,
        language: args.language
      };
    } catch (error) {
      console.error("TTS generation error:", error);
      throw new Error("Failed to generate voice response");
    }
  }
});

// Helper function to get default voice for each language
function getDefaultVoice(language: string): string {
  const voiceMap: Record<string, string> = {
    "hi": "hi-IN-Wavenet-A", // Hindi
    "en": "en-IN-Wavenet-A", // Indian English
    "ta": "ta-IN-Wavenet-A", // Tamil
    "bn": "bn-IN-Wavenet-A", // Bengali
    "te": "te-IN-Standard-A", // Telugu
    "mr": "mr-IN-Wavenet-A", // Marathi
    "kn": "kn-IN-Wavenet-A"  // Kannada
  };
  return voiceMap[language] || voiceMap["en"];
}

// Internal queries and mutations
export const getSession = internalQuery({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("voiceSessions")
      .withIndex("by_session_id", (q) => q.eq("sessionId", args.sessionId))
      .unique();
  }
});

export const storeInteraction = internalMutation({
  args: {
    sessionId: v.string(),
    userInput: userInputValidator,
    intentData: intentDataValidator
  },
  handler: async (ctx, args) => {
    const interactionId = `int_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await ctx.db.insert("voiceInteractions", {
      sessionId: args.sessionId,
      interactionId,
      userInput: {
        audioUrl: undefined,
        transcript: args.userInput.transcript,
        language: args.userInput.language,
        confidence: args.userInput.confidence
      },
      aiResponse: {
        intent: args.intentData.intent,
        entities: args.intentData.entities || [],
        responseText: args.intentData.responseText || "",
        actions: args.intentData.actions || []
      },
      timestamp: Date.now()
    });

    return interactionId;
  }
});
