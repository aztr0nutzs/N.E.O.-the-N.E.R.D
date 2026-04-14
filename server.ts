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
      const ALLOWED_MODELS = [
        'gemini-3-flash-preview',
        'gemini-3.1-pro-preview',
        'gemini-3.1-flash-lite-preview',
        'gemini-2.5-flash-preview-tts'
      ];
      if (!model || !ALLOWED_MODELS.includes(model)) {
        return res.status(400).json({ error: "Invalid model specified" });
      }
      if (!contents || !Array.isArray(contents) || contents.length === 0 || contents.length > 50) {
        return res.status(400).json({ error: "Invalid contents payload" });
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
        return res.status(400).json({ error: "Malformed contents structure or invalid MIME type" });
      }
      
      // Sanitize config
      const safeConfig: any = {};
      if (config && typeof config === 'object') {
        if (typeof config.temperature === 'number') safeConfig.temperature = Math.max(0, Math.min(2, config.temperature));
        if (typeof config.maxOutputTokens === 'number') safeConfig.maxOutputTokens = Math.max(1, Math.min(8192, config.maxOutputTokens));
        
        if (config.systemInstruction) {
          if (typeof config.systemInstruction === 'string') {
            safeConfig.systemInstruction = config.systemInstruction.substring(0, 5000);
          } else if (typeof config.systemInstruction === 'object' && Array.isArray(config.systemInstruction.parts)) {
            const validParts = config.systemInstruction.parts
              .filter((p: any) => p && typeof p.text === 'string')
              .map((p: any) => ({ text: p.text.substring(0, 5000) }));
            if (validParts.length > 0) safeConfig.systemInstruction = { parts: validParts };
          }
        }
        
        if (config.responseModalities && Array.isArray(config.responseModalities)) {
          const allowedModalities = ['TEXT', 'IMAGE', 'AUDIO'];
          safeConfig.responseModalities = config.responseModalities.filter((m: any) => allowedModalities.includes(m));
        }
        
        if (config.speechConfig && typeof config.speechConfig === 'object') {
          safeConfig.speechConfig = {};
          if (config.speechConfig.voiceConfig && typeof config.speechConfig.voiceConfig === 'object') {
            safeConfig.speechConfig.voiceConfig = {};
            if (config.speechConfig.voiceConfig.prebuiltVoiceConfig && typeof config.speechConfig.voiceConfig.prebuiltVoiceConfig === 'object') {
              const voiceName = config.speechConfig.voiceConfig.prebuiltVoiceConfig.voiceName;
              if (typeof voiceName === 'string' && voiceName.length < 50) {
                safeConfig.speechConfig.voiceConfig.prebuiltVoiceConfig = { voiceName };
              }
            }
          }
        }

        if (config.thinkingConfig && typeof config.thinkingConfig === 'object') {
           if (['HIGH', 'STANDARD', 'LOW'].includes(config.thinkingConfig.thinkingLevel)) {
             safeConfig.thinkingConfig = { thinkingLevel: config.thinkingConfig.thinkingLevel };
           }
        }
        if (config.tools && Array.isArray(config.tools)) {
          // Only allow specific tools and strip out any unexpected nested properties
          safeConfig.tools = config.tools.filter((t: any) => {
             if (t && typeof t === 'object') {
                if (t.googleSearch && typeof t.googleSearch === 'object') return true;
                if (t.googleMaps && typeof t.googleMaps === 'object') return true;
             }
             return false;
          }).map((t: any) => {
             if (t.googleSearch) return { googleSearch: {} };
             if (t.googleMaps) return { googleMaps: {} };
          });
        }
      }
      
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
        config: safeConfig
      });
      res.json(response);
    } catch (error: any) {
      console.error("AI Chat Error:", error);
      res.status(500).json({ error: "An error occurred while processing your request." });
    }
  });

  app.post("/api/ai/image", async (req, res) => {
    try {
      const { prompt, config } = req.body;
      
      // Validation
      if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0 || prompt.length > 2000) {
        return res.status(400).json({ error: "Invalid or oversized prompt" });
      }

      const safeConfig: any = {};
      if (config && typeof config === 'object') {
         if (config.imageConfig && typeof config.imageConfig === 'object') {
            safeConfig.imageConfig = {};
            if (config.imageConfig.aspectRatio && ['1:1', '3:4', '4:3', '9:16', '16:9'].includes(config.imageConfig.aspectRatio)) {
               safeConfig.imageConfig.aspectRatio = config.imageConfig.aspectRatio;
            }
            if (config.imageConfig.imageSize && ['512px', '1K', '2K', '4K'].includes(config.imageConfig.imageSize)) {
               safeConfig.imageConfig.imageSize = config.imageConfig.imageSize;
            }
         }
         if (config.personGeneration && ['DONT_ALLOW', 'ALLOW_ADULT'].includes(config.personGeneration)) safeConfig.personGeneration = config.personGeneration;
         if (typeof config.numberOfImages === 'number') safeConfig.numberOfImages = Math.max(1, Math.min(4, config.numberOfImages));
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image-preview',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: safeConfig
      });
      res.json(response);
    } catch (error: any) {
      console.error("AI Image Error:", error);
      res.status(500).json({ error: "An error occurred while generating the image." });
    }
  });

  app.post("/api/ai/video", express.json({ limit: '10mb' }), async (req, res) => {
    try {
      const { prompt, image, config } = req.body;
      
      // Validation
      if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0 || prompt.length > 2000) {
        return res.status(400).json({ error: "Invalid or oversized prompt" });
      }
      if (image) {
        if (!image.imageBytes || typeof image.imageBytes !== 'string' || image.imageBytes.length > 10485760) {
           return res.status(400).json({ error: "Invalid image data or size" });
        }
        if (!image.mimeType || !ALLOWED_MIME_TYPES.includes(image.mimeType)) {
           return res.status(400).json({ error: "Invalid image MIME type" });
        }
      }

      const safeConfig: any = {};
      if (config && typeof config === 'object') {
         if (config.aspectRatio && ['1:1', '16:9', '9:16'].includes(config.aspectRatio)) safeConfig.aspectRatio = config.aspectRatio;
         if (config.personGeneration && ['DONT_ALLOW', 'ALLOW_ADULT'].includes(config.personGeneration)) safeConfig.personGeneration = config.personGeneration;
         if (typeof config.numberOfVideos === 'number') safeConfig.numberOfVideos = Math.max(1, Math.min(4, config.numberOfVideos));
         if (config.resolution && ['720p', '1080p', '4K'].includes(config.resolution)) safeConfig.resolution = config.resolution;
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt,
        image,
        config: safeConfig
      });

      res.json({ operationId: operation.name });
    } catch (error: any) {
      console.error("AI Video Error:", error);
      res.status(500).json({ error: "An error occurred while generating the video." });
    }
  });

  app.get("/api/ai/video-status/:id", async (req, res) => {
    try {
      const id = req.params.id;
      if (!id || typeof id !== 'string' || !/^operations\/[a-zA-Z0-9_-]+$/.test(id)) {
         return res.status(400).json({ error: "Invalid operation ID format" });
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const operation = await ai.operations.getVideosOperation({ operation: { name: id } as any });
      res.json(operation);
    } catch (error: any) {
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
