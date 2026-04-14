import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import * as admin from "firebase-admin";

dotenv.config();

// Initialize Firebase Admin (will use default credentials if available)
try {
  admin.initializeApp();
} catch (e) {
  console.warn("Firebase Admin initialization failed. Auth verification may be limited.", e);
}

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: "Too many requests, please try again later." }
});

// Auth Middleware
const requireAuth = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: "Unauthorized: Missing or invalid token" });
  }
  
  const token = authHeader.split('Bearer ')[1];
  try {
    if (admin.apps.length === 0) {
      console.error("Firebase Admin not initialized. Cannot verify tokens.");
      return res.status(500).json({ error: "Internal server error: Auth misconfiguration" });
    }
    const decodedToken = await admin.auth().verifyIdToken(token);
    (req as any).user = decodedToken;
    next();
  } catch (error) {
    console.error("Auth error:", error);
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
};

const ALLOWED_MIME_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif',
  'video/mp4', 'video/mpeg', 'video/mov', 'video/avi', 'video/x-flv', 'video/mpg', 'video/webm', 'video/wmv', 'video/3gpp',
  'audio/wav', 'audio/mp3', 'audio/aiff', 'audio/aac', 'audio/ogg', 'audio/flac'
];

const ALLOWED_CHAT_MODELS = [
  'gemini-3-flash-preview',
  'gemini-3.1-pro-preview',
  'gemini-3.1-flash-lite-preview',
  'gemini-2.5-flash-preview-tts'
] as const;

const ALLOWED_RESPONSE_MODALITIES = ['TEXT', 'IMAGE', 'AUDIO'] as const;
const ALLOWED_THINKING_LEVELS = ['HIGH', 'STANDARD', 'LOW'] as const;
const ALLOWED_IMAGE_ASPECT_RATIOS = ['1:1', '3:4', '4:3', '9:16', '16:9'] as const;
const ALLOWED_IMAGE_SIZES = ['512px', '1K', '2K', '4K'] as const;
const ALLOWED_PERSON_GENERATION = ['DONT_ALLOW', 'ALLOW_ADULT'] as const;
const ALLOWED_VIDEO_ASPECT_RATIOS = ['1:1', '16:9', '9:16'] as const;
const ALLOWED_VIDEO_RESOLUTIONS = ['720p', '1080p', '4K'] as const;
const ALLOWED_TOOL_KEYS = ['googleSearch', 'googleMaps'] as const;

type SafeConfig = {
  temperature?: number;
  maxOutputTokens?: number;
  systemInstruction?: string | { parts: Array<{ text: string }> };
  responseModalities?: Array<(typeof ALLOWED_RESPONSE_MODALITIES)[number]>;
  speechConfig?: {
    voiceConfig: {
      prebuiltVoiceConfig: {
        voiceName: string;
      };
    };
  };
  thinkingConfig?: {
    thinkingLevel: (typeof ALLOWED_THINKING_LEVELS)[number];
  };
  tools?: Array<{ googleSearch: {} } | { googleMaps: {} }>;
  imageConfig?: {
    aspectRatio?: (typeof ALLOWED_IMAGE_ASPECT_RATIOS)[number];
    imageSize?: (typeof ALLOWED_IMAGE_SIZES)[number];
  };
  personGeneration?: (typeof ALLOWED_PERSON_GENERATION)[number];
  numberOfImages?: number;
  aspectRatio?: (typeof ALLOWED_VIDEO_ASPECT_RATIOS)[number];
  numberOfVideos?: number;
  resolution?: (typeof ALLOWED_VIDEO_RESOLUTIONS)[number];
};

class RequestValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RequestValidationError";
  }
}

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const hasOnlyKeys = (value: Record<string, unknown>, allowedKeys: readonly string[]) => {
  const keys = Object.keys(value);
  return keys.every(key => allowedKeys.includes(key));
};

const failValidation = (message: string): never => {
  throw new RequestValidationError(message);
};

const sanitizeSystemInstruction = (value: unknown): SafeConfig['systemInstruction'] => {
  if (value === undefined) return undefined;

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!(trimmed.length > 0 && trimmed.length <= 5000)) {
      failValidation("systemInstruction string must be 1-5000 characters");
    }
    return trimmed;
  }

  if (!isPlainObject(value)) failValidation("systemInstruction must be a string or object");
  const objectValue = value as Record<string, unknown>;
  if (!hasOnlyKeys(objectValue, ['parts'])) failValidation("systemInstruction object contains unsupported keys");
  if (!Array.isArray(objectValue.parts) || objectValue.parts.length === 0 || objectValue.parts.length > 8) {
    failValidation("systemInstruction.parts must be a non-empty array");
  }
  const partsValue = objectValue.parts as unknown[];

  const parts = partsValue.map((part, index) => {
    if (!isPlainObject(part)) failValidation(`systemInstruction.parts[${index}] must be an object`);
    const partObject = part as Record<string, unknown>;
    if (!hasOnlyKeys(partObject, ['text'])) failValidation(`systemInstruction.parts[${index}] contains unsupported keys`);
    if (typeof partObject.text !== 'string') failValidation(`systemInstruction.parts[${index}].text must be a string`);
    const textValue = partObject.text as string;
    const trimmed = textValue.trim();
    if (!(trimmed.length > 0 && trimmed.length <= 5000)) {
      failValidation(`systemInstruction.parts[${index}].text must be 1-5000 characters`);
    }
    return { text: trimmed };
  });

  return { parts };
};

const sanitizeResponseModalities = (value: unknown): SafeConfig['responseModalities'] => {
  if (value === undefined) return undefined;

  if (!Array.isArray(value) || value.length === 0 || value.length > ALLOWED_RESPONSE_MODALITIES.length) {
    failValidation("responseModalities must be a non-empty array");
  }
  const modalitiesValue = value as unknown[];

  const seen = new Set<string>();
  const modalities = modalitiesValue.map((entry, index) => {
    if (typeof entry !== 'string') failValidation(`responseModalities[${index}] must be a string`);
    const entryValue = entry as string;
    if (!ALLOWED_RESPONSE_MODALITIES.includes(entryValue as (typeof ALLOWED_RESPONSE_MODALITIES)[number])) {
      failValidation(`responseModalities[${index}] is not allowed`);
    }
    if (seen.has(entryValue)) failValidation(`responseModalities[${index}] is duplicated`);
    seen.add(entryValue);
    return entryValue as (typeof ALLOWED_RESPONSE_MODALITIES)[number];
  });

  return modalities;
};

const sanitizeSpeechConfig = (value: unknown): SafeConfig['speechConfig'] => {
  if (value === undefined) return undefined;

  if (!isPlainObject(value)) failValidation("speechConfig must be an object");
  const objectValue = value as Record<string, unknown>;
  if (!hasOnlyKeys(objectValue, ['voiceConfig'])) failValidation("speechConfig contains unsupported keys");
  const voiceConfig = objectValue.voiceConfig;
  if (!isPlainObject(voiceConfig)) failValidation("speechConfig.voiceConfig must be an object");
  const voiceConfigValue = voiceConfig as Record<string, unknown>;
  if (!hasOnlyKeys(voiceConfigValue, ['prebuiltVoiceConfig'])) failValidation("speechConfig.voiceConfig contains unsupported keys");
  const prebuiltVoiceConfig = voiceConfigValue.prebuiltVoiceConfig;
  if (!isPlainObject(prebuiltVoiceConfig)) failValidation("speechConfig.voiceConfig.prebuiltVoiceConfig must be an object");
  const prebuiltVoiceConfigValue = prebuiltVoiceConfig as Record<string, unknown>;
  if (!hasOnlyKeys(prebuiltVoiceConfigValue, ['voiceName'])) failValidation("speechConfig.voiceConfig.prebuiltVoiceConfig contains unsupported keys");
  if (typeof prebuiltVoiceConfigValue.voiceName !== 'string') failValidation("speechConfig voiceName must be a string");

  const voiceName = (prebuiltVoiceConfigValue.voiceName as string).trim();
  if (!/^[A-Za-z0-9 _-]{1,40}$/.test(voiceName)) failValidation("speechConfig voiceName contains invalid characters");

  return {
    voiceConfig: {
      prebuiltVoiceConfig: {
        voiceName
      }
    }
  };
};

const sanitizeTools = (value: unknown): SafeConfig['tools'] => {
  if (value === undefined) return undefined;

  if (!Array.isArray(value) || value.length > ALLOWED_TOOL_KEYS.length) failValidation("tools must be an array");
  const toolsValue = value as unknown[];

  const seen = new Set<string>();
  return toolsValue.map((tool, index) => {
    if (!isPlainObject(tool)) failValidation(`tools[${index}] must be an object`);
    const toolKeys = Object.keys(tool);
    if (toolKeys.length !== 1) failValidation(`tools[${index}] must contain exactly one tool`);
    const toolKey = toolKeys[0];
    if (!ALLOWED_TOOL_KEYS.includes(toolKey as (typeof ALLOWED_TOOL_KEYS)[number])) failValidation(`tools[${index}] is not allowed`);
    if (seen.has(toolKey)) failValidation(`tools[${index}] is duplicated`);
    seen.add(toolKey);

    const toolValue = tool[toolKey];
    if (!isPlainObject(toolValue)) failValidation(`tools[${index}].${toolKey} must be an object`);
    if (Object.keys(toolValue).length !== 0) failValidation(`tools[${index}].${toolKey} must not contain nested properties`);

    if (toolKey === 'googleSearch') return { googleSearch: {} };
    return { googleMaps: {} };
  });
};

const sanitizeThinkingConfig = (value: unknown): SafeConfig['thinkingConfig'] => {
  if (value === undefined) return undefined;

  if (!isPlainObject(value)) failValidation("thinkingConfig must be an object");
  const objectValue = value as Record<string, unknown>;
  if (!hasOnlyKeys(objectValue, ['thinkingLevel'])) failValidation("thinkingConfig contains unsupported keys");
  if (typeof objectValue.thinkingLevel !== 'string') failValidation("thinkingConfig.thinkingLevel must be a string");
  if (!ALLOWED_THINKING_LEVELS.includes(objectValue.thinkingLevel as (typeof ALLOWED_THINKING_LEVELS)[number])) {
    failValidation("thinkingConfig.thinkingLevel is not allowed");
  }

  return { thinkingLevel: objectValue.thinkingLevel as (typeof ALLOWED_THINKING_LEVELS)[number] };
};

const sanitizeChatConfig = (value: unknown): SafeConfig => {
  if (value === undefined) return {};

  if (!isPlainObject(value)) failValidation("config must be an object");
  const objectValue = value as Record<string, unknown>;
  if (!hasOnlyKeys(objectValue, ['temperature', 'maxOutputTokens', 'systemInstruction', 'responseModalities', 'speechConfig', 'thinkingConfig', 'tools'])) {
    failValidation("config contains unsupported keys");
  }

  const safeConfig: SafeConfig = {};

  if (objectValue.temperature !== undefined) {
    if (typeof objectValue.temperature !== 'number' || !Number.isFinite(objectValue.temperature)) {
      failValidation("temperature must be a finite number");
    }
    const temperature = objectValue.temperature as number;
    safeConfig.temperature = Math.max(0, Math.min(2, temperature));
  }

  if (objectValue.maxOutputTokens !== undefined) {
    if (typeof objectValue.maxOutputTokens !== 'number' || !Number.isInteger(objectValue.maxOutputTokens)) {
      failValidation("maxOutputTokens must be an integer");
    }
    const maxOutputTokens = objectValue.maxOutputTokens as number;
    safeConfig.maxOutputTokens = Math.max(1, Math.min(8192, maxOutputTokens));
  }

  const systemInstruction = sanitizeSystemInstruction(objectValue.systemInstruction);
  if (systemInstruction !== undefined) safeConfig.systemInstruction = systemInstruction;

  const responseModalities = sanitizeResponseModalities(objectValue.responseModalities);
  if (responseModalities !== undefined) safeConfig.responseModalities = responseModalities;

  const speechConfig = sanitizeSpeechConfig(objectValue.speechConfig);
  if (speechConfig !== undefined) safeConfig.speechConfig = speechConfig;

  const thinkingConfig = sanitizeThinkingConfig(objectValue.thinkingConfig);
  if (thinkingConfig !== undefined) safeConfig.thinkingConfig = thinkingConfig;

  const tools = sanitizeTools(objectValue.tools);
  if (tools !== undefined) safeConfig.tools = tools;

  return safeConfig;
};

const sanitizeImageConfig = (value: unknown): Pick<SafeConfig, 'imageConfig' | 'personGeneration' | 'numberOfImages'> => {
  if (value === undefined) return {};

  if (!isPlainObject(value)) failValidation("config must be an object");
  const objectValue = value as Record<string, unknown>;
  if (!hasOnlyKeys(objectValue, ['imageConfig', 'personGeneration', 'numberOfImages'])) failValidation("image config contains unsupported keys");

  const safeConfig: Pick<SafeConfig, 'imageConfig' | 'personGeneration' | 'numberOfImages'> = {};

  if (objectValue.imageConfig !== undefined) {
    if (!isPlainObject(objectValue.imageConfig)) failValidation("imageConfig must be an object");
    const imageConfigValue = objectValue.imageConfig as Record<string, unknown>;
    if (!hasOnlyKeys(imageConfigValue, ['aspectRatio', 'imageSize'])) failValidation("imageConfig contains unsupported keys");

    const imageConfig: NonNullable<SafeConfig['imageConfig']> = {};

    if (imageConfigValue.aspectRatio !== undefined) {
      if (typeof imageConfigValue.aspectRatio !== 'string') failValidation("imageConfig.aspectRatio must be a string");
      if (!ALLOWED_IMAGE_ASPECT_RATIOS.includes(imageConfigValue.aspectRatio as (typeof ALLOWED_IMAGE_ASPECT_RATIOS)[number])) {
        failValidation("imageConfig.aspectRatio is not allowed");
      }
      imageConfig.aspectRatio = imageConfigValue.aspectRatio as (typeof ALLOWED_IMAGE_ASPECT_RATIOS)[number];
    }

    if (imageConfigValue.imageSize !== undefined) {
      if (typeof imageConfigValue.imageSize !== 'string') failValidation("imageConfig.imageSize must be a string");
      if (!ALLOWED_IMAGE_SIZES.includes(imageConfigValue.imageSize as (typeof ALLOWED_IMAGE_SIZES)[number])) {
        failValidation("imageConfig.imageSize is not allowed");
      }
      imageConfig.imageSize = imageConfigValue.imageSize as (typeof ALLOWED_IMAGE_SIZES)[number];
    }

    safeConfig.imageConfig = imageConfig;
  }

  if (objectValue.personGeneration !== undefined) {
    if (typeof objectValue.personGeneration !== 'string') failValidation("personGeneration must be a string");
    if (!ALLOWED_PERSON_GENERATION.includes(objectValue.personGeneration as (typeof ALLOWED_PERSON_GENERATION)[number])) {
      failValidation("personGeneration is not allowed");
    }
    safeConfig.personGeneration = objectValue.personGeneration as (typeof ALLOWED_PERSON_GENERATION)[number];
  }

  if (objectValue.numberOfImages !== undefined) {
    if (typeof objectValue.numberOfImages !== 'number' || !Number.isInteger(objectValue.numberOfImages)) {
      failValidation("numberOfImages must be an integer");
    }
    const numberOfImages = objectValue.numberOfImages as number;
    if (numberOfImages < 1 || numberOfImages > 4) failValidation("numberOfImages must be between 1 and 4");
    safeConfig.numberOfImages = numberOfImages;
  }

  return safeConfig;
};

const sanitizeVideoConfig = (value: unknown): Pick<SafeConfig, 'aspectRatio' | 'personGeneration' | 'numberOfVideos' | 'resolution'> => {
  if (value === undefined) return {};

  if (!isPlainObject(value)) failValidation("config must be an object");
  const objectValue = value as Record<string, unknown>;
  if (!hasOnlyKeys(objectValue, ['aspectRatio', 'personGeneration', 'numberOfVideos', 'resolution'])) failValidation("video config contains unsupported keys");

  const safeConfig: Pick<SafeConfig, 'aspectRatio' | 'personGeneration' | 'numberOfVideos' | 'resolution'> = {};

  if (objectValue.aspectRatio !== undefined) {
    if (typeof objectValue.aspectRatio !== 'string') failValidation("aspectRatio must be a string");
    if (!ALLOWED_VIDEO_ASPECT_RATIOS.includes(objectValue.aspectRatio as (typeof ALLOWED_VIDEO_ASPECT_RATIOS)[number])) {
      failValidation("aspectRatio is not allowed");
    }
    safeConfig.aspectRatio = objectValue.aspectRatio as (typeof ALLOWED_VIDEO_ASPECT_RATIOS)[number];
  }

  if (objectValue.personGeneration !== undefined) {
    if (typeof objectValue.personGeneration !== 'string') failValidation("personGeneration must be a string");
    if (!ALLOWED_PERSON_GENERATION.includes(objectValue.personGeneration as (typeof ALLOWED_PERSON_GENERATION)[number])) {
      failValidation("personGeneration is not allowed");
    }
    safeConfig.personGeneration = objectValue.personGeneration as (typeof ALLOWED_PERSON_GENERATION)[number];
  }

  if (objectValue.numberOfVideos !== undefined) {
    if (typeof objectValue.numberOfVideos !== 'number' || !Number.isInteger(objectValue.numberOfVideos)) {
      failValidation("numberOfVideos must be an integer");
    }
    const numberOfVideos = objectValue.numberOfVideos as number;
    if (numberOfVideos < 1 || numberOfVideos > 4) failValidation("numberOfVideos must be between 1 and 4");
    safeConfig.numberOfVideos = numberOfVideos;
  }

  if (objectValue.resolution !== undefined) {
    if (typeof objectValue.resolution !== 'string') failValidation("resolution must be a string");
    if (!ALLOWED_VIDEO_RESOLUTIONS.includes(objectValue.resolution as (typeof ALLOWED_VIDEO_RESOLUTIONS)[number])) {
      failValidation("resolution is not allowed");
    }
    safeConfig.resolution = objectValue.resolution as (typeof ALLOWED_VIDEO_RESOLUTIONS)[number];
  }

  return safeConfig;
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Use a smaller default limit, then override for specific routes if needed
  app.use(express.json({ limit: '1mb' })); 
  app.use('/api/ai/', apiLimiter);
  app.use('/api/ai/', requireAuth);

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Chat route needs larger payload for inline images/video
  app.post("/api/ai/chat", express.json({ limit: '10mb' }), async (req, res) => {
    try {
      const { model, contents, config } = req.body;
      
      // Validation
      if (!model || !ALLOWED_CHAT_MODELS.includes(model)) {
        throw new RequestValidationError("Invalid model specified");
      }
      if (!contents || !Array.isArray(contents) || contents.length === 0 || contents.length > 50) {
        throw new RequestValidationError("Invalid contents payload");
      }
      
      const isValidContents = contents.every((c: any) => 
        c && 
        typeof c === 'object' && 
        Array.isArray(c.parts) && 
        c.parts.every((p: any) => {
          if (!p || typeof p !== 'object') return false;
          if (typeof p.text === 'string') return p.text.length <= 10000;
          if (p.inlineData && typeof p.inlineData.mimeType === 'string' && typeof p.inlineData.data === 'string') {
            return ALLOWED_MIME_TYPES.includes(p.inlineData.mimeType) && p.inlineData.data.length <= 10485760; // ~10MB base64
          }
          return false;
        }) &&
        (!c.role || ['user', 'model', 'system'].includes(c.role))
      );
      if (!isValidContents) {
        throw new RequestValidationError("Malformed contents structure or invalid MIME type");
      }

      const safeConfig = sanitizeChatConfig(config);
      
      const safeContents = contents.map((c: any) => {
        const safeParts = c.parts.map((p: any) => {
          if (typeof p.text === 'string') return { text: p.text.substring(0, 10000) };
          if (p.inlineData) return { inlineData: { mimeType: p.inlineData.mimeType, data: p.inlineData.data } };
          return null;
        }).filter(Boolean);
        
        return {
          role: c.role,
          parts: safeParts
        };
      });

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model,
        contents: safeContents,
        config: safeConfig as any
      });
      res.json(response);
    } catch (error: any) {
      if (error instanceof RequestValidationError) {
        console.error("AI Chat Validation Error:", error.message, { body: req.body });
        return res.status(400).json({ error: "Invalid request payload." });
      }
      console.error("AI Chat Error:", error);
      res.status(500).json({ error: "An error occurred while processing your request." });
    }
  });

  app.post("/api/ai/image", async (req, res) => {
    try {
      const { prompt, config } = req.body;
      
      // Validation
      if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0 || prompt.length > 2000) {
        throw new RequestValidationError("Invalid or oversized prompt");
      }
      const safeConfig = sanitizeImageConfig(config);

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image-preview',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: safeConfig as any
      });
      res.json(response);
    } catch (error: any) {
      if (error instanceof RequestValidationError) {
        console.error("AI Image Validation Error:", error.message, { body: req.body });
        return res.status(400).json({ error: "Invalid request payload." });
      }
      console.error("AI Image Error:", error);
      res.status(500).json({ error: "An error occurred while generating the image." });
    }
  });

  app.post("/api/ai/video", express.json({ limit: '10mb' }), async (req, res) => {
    try {
      const { prompt, image, config } = req.body;
      
      // Validation
      if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0 || prompt.length > 2000) {
        throw new RequestValidationError("Invalid or oversized prompt");
      }
      if (image) {
        if (!image.imageBytes || typeof image.imageBytes !== 'string' || image.imageBytes.length > 10485760) {
           throw new RequestValidationError("Invalid image data or size");
        }
        if (!image.mimeType || !ALLOWED_MIME_TYPES.includes(image.mimeType)) {
           throw new RequestValidationError("Invalid image MIME type");
        }
      }

      const safeConfig = sanitizeVideoConfig(config);

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt,
        image,
        config: safeConfig as any
      });

      res.json({ operationId: operation.name });
    } catch (error: any) {
      if (error instanceof RequestValidationError) {
        console.error("AI Video Validation Error:", error.message, { body: req.body });
        return res.status(400).json({ error: "Invalid request payload." });
      }
      console.error("AI Video Error:", error);
      res.status(500).json({ error: "An error occurred while generating the video." });
    }
  });

  app.get("/api/ai/video-status/:id", async (req, res) => {
    try {
      const id = req.params.id;
      if (!id || typeof id !== 'string' || !/^operations\/[a-zA-Z0-9_-]+$/.test(id)) {
         throw new RequestValidationError("Invalid operation ID format");
       }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const operation = await ai.operations.getVideosOperation({ operation: { name: id } as any });
      res.json(operation);
    } catch (error: any) {
      if (error instanceof RequestValidationError) {
        console.error("AI Video Status Validation Error:", error.message, { params: req.params });
        return res.status(400).json({ error: "Invalid request payload." });
      }
      console.error("AI Video Status Error:", error);
      res.status(500).json({ error: "An error occurred while fetching video status." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
