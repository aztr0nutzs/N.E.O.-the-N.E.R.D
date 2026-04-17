import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin =
  supabaseUrl && supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      })
    : null;

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
    if (!supabaseAdmin) {
      console.error("Supabase auth verification is not configured.");
      return res.status(500).json({ error: "Internal server error: Auth misconfiguration" });
    }

    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data.user) {
      console.error("Auth error:", error);
      return res.status(401).json({ error: "Unauthorized: Invalid token" });
    }

    (req as any).user = data.user;
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

const ALLOWED_VIDEO_SOURCE_MIME_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'
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
const CHAT_ROUTE_LIMIT = '10mb';
const DEFAULT_ROUTE_LIMIT = '1mb';
const MAX_CONTENT_ITEMS = 50;
const MAX_PARTS_PER_CONTENT = 20;
const MAX_TEXT_PART_CHARS = 10_000;
const MAX_SYSTEM_INSTRUCTION_CHARS = 5_000;
const MAX_SYSTEM_INSTRUCTION_PARTS = 8;
const MAX_INLINE_DATA_CHARS = 10_485_760;
const MAX_PROMPT_CHARS = 2_000;
const MAX_TOOLS = 2;
const MAX_OPERATION_ID_LENGTH = 128;
const chatJsonParser = express.json({ limit: CHAT_ROUTE_LIMIT });
const defaultJsonParser = express.json({ limit: DEFAULT_ROUTE_LIMIT });

type JsonRecord = Record<string, unknown>;

function isPlainObject(value: unknown): value is JsonRecord {
  return Object.prototype.toString.call(value) === '[object Object]';
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isIntegerInRange(value: unknown, min: number, max: number): value is number {
  return Number.isInteger(value) && (value as number) >= min && (value as number) <= max;
}

function sendBadRequest(res: express.Response, message: string) {
  return res.status(400).json({ error: message });
}

function sendServerError(res: express.Response, logLabel: string, error: unknown, message: string) {
  console.error(logLabel, error);
  return res.status(500).json({ error: message });
}

function getAiClient() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

function validatePrompt(value: unknown) {
  if (typeof value !== 'string') return null;
  const prompt = value.trim();
  if (!prompt || prompt.length > MAX_PROMPT_CHARS) return null;
  return prompt;
}

function validateSystemInstruction(value: unknown) {
  if (typeof value === 'string') {
    const instruction = value.trim();
    if (!instruction || instruction.length > MAX_SYSTEM_INSTRUCTION_CHARS) return null;
    return instruction;
  }

  if (!isPlainObject(value) || !Array.isArray(value.parts) || value.parts.length === 0 || value.parts.length > MAX_SYSTEM_INSTRUCTION_PARTS) {
    return null;
  }

  const parts = value.parts.map((part) => {
    if (!isPlainObject(part) || typeof part.text !== 'string') return null;
    const text = part.text.trim();
    if (!text || text.length > MAX_SYSTEM_INSTRUCTION_CHARS) return null;
    return { text };
  });

  if (parts.some((part) => part === null)) return null;
  return { parts: parts as Array<{ text: string }> };
}

function validateResponseModalities(value: unknown) {
  if (!Array.isArray(value) || value.length === 0 || value.length > ALLOWED_RESPONSE_MODALITIES.length) {
    return null;
  }

  const seen = new Set<string>();
  const modalities: string[] = [];

  for (const modality of value) {
    if (typeof modality !== 'string' || !ALLOWED_RESPONSE_MODALITIES.includes(modality as typeof ALLOWED_RESPONSE_MODALITIES[number]) || seen.has(modality)) {
      return null;
    }
    seen.add(modality);
    modalities.push(modality);
  }

  return modalities;
}

function validateSpeechConfig(value: unknown, responseModalities: string[] | undefined) {
  if (!isPlainObject(value) || !responseModalities?.includes('AUDIO')) {
    return null;
  }

  if (!isPlainObject(value.voiceConfig) || !isPlainObject(value.voiceConfig.prebuiltVoiceConfig)) {
    return null;
  }

  const voiceName = value.voiceConfig.prebuiltVoiceConfig.voiceName;
  if (typeof voiceName !== 'string') {
    return null;
  }

  const trimmedVoiceName = voiceName.trim();
  if (!trimmedVoiceName || trimmedVoiceName.length > 50) {
    return null;
  }

  return {
    voiceConfig: {
      prebuiltVoiceConfig: {
        voiceName: trimmedVoiceName
      }
    }
  };
}

function validateThinkingConfig(value: unknown) {
  if (!isPlainObject(value) || typeof value.thinkingLevel !== 'string') {
    return null;
  }

  if (!ALLOWED_THINKING_LEVELS.includes(value.thinkingLevel as typeof ALLOWED_THINKING_LEVELS[number])) {
    return null;
  }

  return { thinkingLevel: value.thinkingLevel };
}

function validateTools(value: unknown) {
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_TOOLS) {
    return null;
  }

  const seen = new Set<string>();
  const tools: Array<{ googleSearch?: {}; googleMaps?: {} }> = [];

  for (const tool of value) {
    if (!isPlainObject(tool)) return null;

    const keys = Object.keys(tool);
    if (keys.length !== 1) return null;

    const toolName = keys[0];
    const toolConfig = tool[toolName];
    if (!['googleSearch', 'googleMaps'].includes(toolName) || !isPlainObject(toolConfig) || Object.keys(toolConfig).length > 0 || seen.has(toolName)) {
      return null;
    }

    seen.add(toolName);
    tools.push(toolName === 'googleSearch' ? { googleSearch: {} } : { googleMaps: {} });
  }

  return tools;
}

function validateChatContents(value: unknown) {
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_CONTENT_ITEMS) {
    return null;
  }

  const safeContents = value.map((content) => {
    if (!isPlainObject(content) || !Array.isArray(content.parts) || content.parts.length === 0 || content.parts.length > MAX_PARTS_PER_CONTENT) {
      return null;
    }

    if (content.role !== undefined && (!['user', 'model', 'system'].includes(String(content.role)))) {
      return null;
    }

    const safeParts = content.parts.map((part) => {
      if (!isPlainObject(part)) return null;

      const hasText = Object.prototype.hasOwnProperty.call(part, 'text');
      const hasInlineData = Object.prototype.hasOwnProperty.call(part, 'inlineData');
      if ((hasText ? 1 : 0) + (hasInlineData ? 1 : 0) !== 1) {
        return null;
      }

      if (hasText) {
        if (typeof part.text !== 'string' || part.text.length === 0 || part.text.length > MAX_TEXT_PART_CHARS) {
          return null;
        }
        return { text: part.text };
      }

      if (!isPlainObject(part.inlineData) || typeof part.inlineData.mimeType !== 'string' || typeof part.inlineData.data !== 'string') {
        return null;
      }

      if (!ALLOWED_MIME_TYPES.includes(part.inlineData.mimeType) || part.inlineData.data.length === 0 || part.inlineData.data.length > MAX_INLINE_DATA_CHARS) {
        return null;
      }

      return {
        inlineData: {
          mimeType: part.inlineData.mimeType,
          data: part.inlineData.data
        }
      };
    });

    if (safeParts.some((part) => part === null)) {
      return null;
    }

    const role = typeof content.role === 'string' ? content.role : undefined;

    return {
      role,
      parts: safeParts as Array<{ text?: string; inlineData?: { mimeType: string; data: string } }>
    };
  });

  if (safeContents.some((content) => content === null)) {
    return null;
  }

  return safeContents;
}

function validateChatConfig(value: unknown) {
  if (value === undefined) return {};
  if (!isPlainObject(value)) return null;

  const safeConfig: JsonRecord = {};

  if (value.temperature !== undefined) {
    if (!isFiniteNumber(value.temperature)) return null;
    safeConfig.temperature = Math.max(0, Math.min(2, value.temperature));
  }

  if (value.maxOutputTokens !== undefined) {
    if (!isIntegerInRange(value.maxOutputTokens, 1, 8192)) return null;
    safeConfig.maxOutputTokens = value.maxOutputTokens;
  }

  if (value.systemInstruction !== undefined) {
    const systemInstruction = validateSystemInstruction(value.systemInstruction);
    if (!systemInstruction) return null;
    safeConfig.systemInstruction = systemInstruction;
  }

  let responseModalities: string[] | undefined;
  if (value.responseModalities !== undefined) {
    responseModalities = validateResponseModalities(value.responseModalities);
    if (!responseModalities) return null;
    safeConfig.responseModalities = responseModalities;
  }

  if (value.speechConfig !== undefined) {
    const speechConfig = validateSpeechConfig(value.speechConfig, responseModalities);
    if (!speechConfig) return null;
    safeConfig.speechConfig = speechConfig;
  }

  if (value.thinkingConfig !== undefined) {
    const thinkingConfig = validateThinkingConfig(value.thinkingConfig);
    if (!thinkingConfig) return null;
    safeConfig.thinkingConfig = thinkingConfig;
  }

  if (value.tools !== undefined) {
    const tools = validateTools(value.tools);
    if (!tools) return null;
    safeConfig.tools = tools;
  }

  return safeConfig;
}

function validateImageConfig(value: unknown) {
  if (value === undefined) return {};
  if (!isPlainObject(value)) return null;

  const safeConfig: JsonRecord = {};

  if (value.imageConfig !== undefined) {
    if (!isPlainObject(value.imageConfig)) return null;

    const imageConfig: JsonRecord = {};
    if (value.imageConfig.aspectRatio !== undefined) {
      if (typeof value.imageConfig.aspectRatio !== 'string' || !ALLOWED_IMAGE_ASPECT_RATIOS.includes(value.imageConfig.aspectRatio as typeof ALLOWED_IMAGE_ASPECT_RATIOS[number])) {
        return null;
      }
      imageConfig.aspectRatio = value.imageConfig.aspectRatio;
    }

    if (value.imageConfig.imageSize !== undefined) {
      if (typeof value.imageConfig.imageSize !== 'string' || !ALLOWED_IMAGE_SIZES.includes(value.imageConfig.imageSize as typeof ALLOWED_IMAGE_SIZES[number])) {
        return null;
      }
      imageConfig.imageSize = value.imageConfig.imageSize;
    }

    safeConfig.imageConfig = imageConfig;
  }

  if (value.personGeneration !== undefined) {
    if (typeof value.personGeneration !== 'string' || !ALLOWED_PERSON_GENERATION.includes(value.personGeneration as typeof ALLOWED_PERSON_GENERATION[number])) {
      return null;
    }
    safeConfig.personGeneration = value.personGeneration;
  }

  if (value.numberOfImages !== undefined) {
    if (!isIntegerInRange(value.numberOfImages, 1, 4)) return null;
    safeConfig.numberOfImages = value.numberOfImages;
  }

  return safeConfig;
}

function validateVideoImage(value: unknown) {
  if (value === undefined) return undefined;
  if (!isPlainObject(value)) return null;

  if (typeof value.imageBytes !== 'string' || value.imageBytes.length === 0 || value.imageBytes.length > MAX_INLINE_DATA_CHARS) {
    return null;
  }

  if (typeof value.mimeType !== 'string' || !ALLOWED_VIDEO_SOURCE_MIME_TYPES.includes(value.mimeType)) {
    return null;
  }

  return {
    imageBytes: value.imageBytes,
    mimeType: value.mimeType
  };
}

function validateVideoConfig(value: unknown) {
  if (value === undefined) return {};
  if (!isPlainObject(value)) return null;

  const safeConfig: JsonRecord = {};

  if (value.aspectRatio !== undefined) {
    if (typeof value.aspectRatio !== 'string' || !ALLOWED_VIDEO_ASPECT_RATIOS.includes(value.aspectRatio as typeof ALLOWED_VIDEO_ASPECT_RATIOS[number])) {
      return null;
    }
    safeConfig.aspectRatio = value.aspectRatio;
  }

  if (value.personGeneration !== undefined) {
    if (typeof value.personGeneration !== 'string' || !ALLOWED_PERSON_GENERATION.includes(value.personGeneration as typeof ALLOWED_PERSON_GENERATION[number])) {
      return null;
    }
    safeConfig.personGeneration = value.personGeneration;
  }

  if (value.numberOfVideos !== undefined) {
    if (!isIntegerInRange(value.numberOfVideos, 1, 4)) return null;
    safeConfig.numberOfVideos = value.numberOfVideos;
  }

  if (value.resolution !== undefined) {
    if (typeof value.resolution !== 'string' || !ALLOWED_VIDEO_RESOLUTIONS.includes(value.resolution as typeof ALLOWED_VIDEO_RESOLUTIONS[number])) {
      return null;
    }
    safeConfig.resolution = value.resolution;
  }

  return safeConfig;
}

function validateOperationId(value: unknown) {
  if (typeof value !== 'string' || value.length === 0 || value.length > MAX_OPERATION_ID_LENGTH) {
    return null;
  }

  if (!/^operations\/[a-zA-Z0-9_-]+$/.test(value)) {
    return null;
  }

  return value;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use('/api/ai/', apiLimiter);
  app.use('/api/ai/', requireAuth);

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Chat route needs larger payload for inline images/video
  app.post("/api/ai/chat", chatJsonParser, async (req, res) => {
    try {
      if (!isPlainObject(req.body)) {
        return sendBadRequest(res, "Invalid request payload");
      }

      const { model, contents, config } = req.body;

      if (typeof model !== 'string' || !ALLOWED_CHAT_MODELS.includes(model as typeof ALLOWED_CHAT_MODELS[number])) {
        return sendBadRequest(res, "Invalid model specified");
      }

      const safeContents = validateChatContents(contents);
      if (!safeContents) {
        return sendBadRequest(res, "Malformed contents payload");
      }

      const safeConfig = validateChatConfig(config);
      if (!safeConfig) {
        return sendBadRequest(res, "Invalid chat config payload");
      }

      const ai = getAiClient();
      const response = await ai.models.generateContent({
        model,
        contents: safeContents,
        config: safeConfig
      });
      res.json(response);
    } catch (error) {
      return sendServerError(res, "AI Chat Error:", error, "Unable to process your request right now.");
    }
  });

  app.post("/api/ai/image", defaultJsonParser, async (req, res) => {
    try {
      if (!isPlainObject(req.body)) {
        return sendBadRequest(res, "Invalid request payload");
      }

      const prompt = validatePrompt(req.body.prompt);
      if (!prompt) {
        return sendBadRequest(res, "Invalid or oversized prompt");
      }

      const safeConfig = validateImageConfig(req.body.config);
      if (!safeConfig) {
        return sendBadRequest(res, "Invalid image config payload");
      }

      const ai = getAiClient();
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image-preview',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: safeConfig
      });
      res.json(response);
    } catch (error) {
      return sendServerError(res, "AI Image Error:", error, "Unable to generate an image right now.");
    }
  });

  app.post("/api/ai/video", chatJsonParser, async (req, res) => {
    try {
      if (!isPlainObject(req.body)) {
        return sendBadRequest(res, "Invalid request payload");
      }

      const prompt = validatePrompt(req.body.prompt);
      if (!prompt) {
        return sendBadRequest(res, "Invalid or oversized prompt");
      }

      const image = validateVideoImage(req.body.image);
      if (req.body.image !== undefined && !image) {
        return sendBadRequest(res, "Invalid video source image payload");
      }

      const safeConfig = validateVideoConfig(req.body.config);
      if (!safeConfig) {
        return sendBadRequest(res, "Invalid video config payload");
      }

      const ai = getAiClient();
      
      const operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt,
        image,
        config: safeConfig
      });

      res.json({ operationId: encodeURIComponent(operation.name) });
    } catch (error) {
      return sendServerError(res, "AI Video Error:", error, "Unable to generate a video right now.");
    }
  });

  app.get("/api/ai/video-status/:id", async (req, res) => {
    try {
      const id = validateOperationId(req.params.id);
      if (!id) {
         return sendBadRequest(res, "Invalid operation ID format");
      }

      const ai = getAiClient();
      const operation = await ai.operations.getVideosOperation({ operation: { name: id } as any });
      res.json(operation);
    } catch (error) {
      return sendServerError(res, "AI Video Status Error:", error, "Unable to fetch video status right now.");
    }
  });

  app.use((error: unknown, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (!req.path.startsWith('/api/ai/')) {
      return next(error);
    }

    if ((error as { type?: unknown } | null)?.type === 'entity.too.large') {
      return res.status(413).json({ error: "Request payload too large" });
    }

    if (error instanceof SyntaxError) {
      return res.status(400).json({ error: "Malformed JSON payload" });
    }

    return sendBadRequest(res, "Invalid request payload");
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
