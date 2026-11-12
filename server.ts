import express, { Request, Response } from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3000;

app.use(express.json({ limit: '35mb' }));

// Initialize shared Gemini SDK client with User-Agent header as required by skill
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Chatbot role system instructions
const SYSTEM_INSTRUCTION = `You are "NeuroMentor", an elite Principal AI Engineer and dedicated learning mentor on the NeuroForge AI Mastery platform.
Your mission is to guide learners to achieve world-class AI engineering mastery across Mathematics, Classical ML, Deep Learning, Transformer Architectures, Production RAG, Autonomous Multi-Agent Swarms, Fine-Tuning & Quantization, MLOps, and 2025-2028 Future Frontiers (Reasoning models, Test-Time Compute, Edge SLMs).

Guidelines:
1. Be technical, accurate, encouraging, and razor-sharp.
2. Provide clean, production-grade Python/TypeScript code examples when asked.
3. If the user asks in Hindi or Hinglish, explain intuitively in Hinglish (Roman Hindi + clear technical English terms) with practical analogies.
4. When relevant web search is used, synthesize up-to-date facts accurately.
5. Emphasize first-principles understanding, avoiding superficial hand-waving.`;

/**
 * Multi-Turn Chatbot API with Search Grounding & Role Support
 */
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const {
      messages, // Array of { role: 'user' | 'model', content: string }
      model = 'gemini-3.8-flash',
      enableSearchGrounding = false,
      userRole = 'general'
    } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: 'Messages array is required' });
      return;
    }

    // Determine targeted model name based on user request or complexity
    let selectedModel = model;
    if (selectedModel !== 'gemini-4-argon' && selectedModel !== 'gemini-3.1-flash-lite') {
      selectedModel = 'gemini-3.8-flash';
    }

    // Role-specific custom prompt augmentation
    let roleSystemInstruction = SYSTEM_INSTRUCTION;
    if (userRole === 'interview-coach') {
      roleSystemInstruction += `\nRole Focus: Technical Interviewer. Grill the student on AI Engineering concepts, ask follow-up questions on trade-offs (e.g. latency vs. quality, quantization loss, attention complexity), and critique their answers constructively.`;
    } else if (userRole === 'code-architect') {
      roleSystemInstruction += `\nRole Focus: System & Code Architect. Focus on robust production code, scalable architecture diagrams (ASCII/Markdown), latency optimization, and memory constraints.`;
    }

    // Build contents history for multi-turn chat
    const contents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    // Configure tools: search grounding is supported on gemini-3.8-flash
    const config: any = {
      systemInstruction: roleSystemInstruction,
    };

    if (enableSearchGrounding && selectedModel === 'gemini-3.8-flash') {
      config.tools = [{ googleSearch: {} }];
    }

    const response = await ai.models.generateContent({
      model: selectedModel,
      contents,
      config,
    });

    const replyText = response.text || '';

    // Extract search grounding sources if present
    const sources: Array<{ title: string; url: string }> = [];
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (Array.isArray(groundingChunks)) {
      groundingChunks.forEach((chunk: any) => {
        if (chunk.web?.uri) {
          sources.push({
            title: chunk.web.title || chunk.web.uri,
            url: chunk.web.uri,
          });
        }
      });
    }

    res.json({
      reply: replyText,
      modelUsed: selectedModel,
      sources,
    });
  } catch (error: any) {
    console.error('Gemini Chat API Error:', error);
    res.status(500).json({
      error: error.message || 'Failed to generate response from Gemini',
    });
  }
});

/**
 * Text-to-Image Creation & Editing API using gemini-nano-banana-2.1
 */
app.post('/api/generate-image', async (req: Request, res: Response) => {
  try {
    const {
      prompt,
      inputImage, // Optional base64 data for image editing
      aspectRatio = '1:1',
      model = 'gemini-nano-banana-2.1'
    } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      res.status(400).json({ error: 'Prompt is required' });
      return;
    }

    // Prepare content parts
    const parts: any[] = [];

    // If an existing image is provided for editing, add inlineData part first
    if (inputImage && typeof inputImage === 'string') {
      const cleanBase64 = inputImage.includes(',') ? inputImage.split(',')[1] : inputImage;
      parts.push({
        inlineData: {
          mimeType: 'image/png',
          data: cleanBase64,
        },
      });
    }

    parts.push({ text: prompt });

    let imageResultUrl: string | null = null;
    let modelUsed = model || 'gemini-nano-banana-2.1';

    try {
      const response = await ai.models.generateContent({
        model: modelUsed,
        contents: { parts },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio as any,
            imageSize: '1K',
          },
        },
      });

      for (const part of response.candidates?.[0]?.content?.parts ?? []) {
        if (part.inlineData?.data) {
          const mime = part.inlineData.mimeType ?? 'image/png';
          imageResultUrl = `data:${mime};base64,${part.inlineData.data}`;
          break;
        }
      }
    } catch (primaryErr: any) {
      console.warn('Primary image model failed, attempting fallback to gemini-3.1-flash-lite-image:', primaryErr.message);
      // Fallback model for image generation
      modelUsed = 'gemini-3.1-flash-lite-image';
      const fallbackResponse = await ai.models.generateContent({
        model: modelUsed,
        contents: { parts },
        config: {
          imageConfig: {
            aspectRatio: (aspectRatio === '1:1' || aspectRatio === '16:9' || aspectRatio === '9:16' || aspectRatio === '4:3' || aspectRatio === '3:4') ? aspectRatio as any : '1:1',
          },
        },
      });

      for (const part of fallbackResponse.candidates?.[0]?.content?.parts ?? []) {
        if (part.inlineData?.data) {
          const mime = part.inlineData.mimeType ?? 'image/png';
          imageResultUrl = `data:${mime};base64,${part.inlineData.data}`;
          break;
        }
      }
    }

    if (!imageResultUrl) {
      res.status(500).json({ error: 'No image was generated by the model.' });
      return;
    }

    res.json({
      imageUrl: imageResultUrl,
      modelUsed,
      prompt,
    });
  } catch (error: any) {
    console.error('Image Generation API Error:', error);
    res.status(500).json({
      error: error.message || 'Failed to generate image',
    });
  }
});

/**
 * Image-to-Video Animation API using gemini-omni-1.2-flash via Interactions API
 */
app.post('/api/animate-video', async (req: Request, res: Response) => {
  try {
    const {
      image,
      prompt = 'Cinematic smooth pan and camera motion bringing the architecture to life with realistic lighting',
      aspectRatio = '16:9',
    } = req.body;

    if (!image || typeof image !== 'string') {
      res.status(400).json({ error: 'Image is required for video generation' });
      return;
    }

    const cleanBase64 = image.includes(',') ? image.split(',')[1] : image;
    const mimeMatch = image.match(/^data:([^;]+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
    const validAspectRatio = aspectRatio === '9:16' ? '9:16' : '16:9';

    const interaction: any = await (ai as any).interactions.create({
      model: 'gemini-omni-1.2-flash',
      input: [
        {
          type: 'image',
          mime_type: mimeType,
          data: cleanBase64,
        },
        {
          type: 'text',
          text: prompt,
        },
      ],
      background: false,
      store: false,
      stream: false,
      response_format: {
        type: 'video',
        aspect_ratio: validAspectRatio,
      },
    }, { timeout: 300000 });

    const videoPart = interaction.output_video;
    if (videoPart && videoPart.data) {
      const videoUrl = `data:video/mp4;base64,${videoPart.data}`;
      res.json({
        videoUrl,
        aspectRatio: validAspectRatio,
        prompt,
      });
    } else {
      res.status(500).json({ error: 'No video output was returned by gemini-omni-1.2-flash.' });
    }
  } catch (error: any) {
    console.error('Video Animation Error:', error);
    res.status(500).json({
      error: error.message || 'Failed to animate video with gemini-omni-1.2-flash',
    });
  }
});

/**
 * Health check endpoint
 */
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Setup Vite middleware in dev or static serving in production
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const httpServer = http.createServer(app);

  // Setup WebSocket server for Gemini Live API audio streaming
  const wss = new WebSocketServer({ server: httpServer, path: '/api/live' });

  wss.on('connection', async (clientWs) => {
    console.log('Client connected to Gemini Live voice stream');
    let session: any = null;

    try {
      session = await (ai as any).live.connect({
        model: 'gemini-3.8-live',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          systemInstruction: SYSTEM_INSTRUCTION,
        },
        callbacks: {
          onmessage: (message: LiveServerMessage) => {
            for (const part of message.serverContent?.modelTurn?.parts ?? []) {
              if (part.inlineData?.data) {
                clientWs.send(JSON.stringify({ audio: part.inlineData.data }));
              }
            }
            if (message.serverContent?.interrupted) {
              clientWs.send(JSON.stringify({ interrupted: true }));
            }
          },
        },
      });

      clientWs.on('message', (data) => {
        try {
          const parsed = JSON.parse(data.toString());
          if (parsed.audio && session) {
            session.sendRealtimeInput({
              audio: { data: parsed.audio, mimeType: 'audio/pcm;rate=16000' },
            });
          }
        } catch (err) {
          console.error('Error processing live audio payload:', err);
        }
      });

      clientWs.on('close', () => {
        try {
          session?.close?.();
        } catch {}
      });
    } catch (err: any) {
      console.error('Failed to initialize Gemini Live session:', err);
      clientWs.send(JSON.stringify({ error: err.message || 'Failed to start Live session' }));
      clientWs.close();
    }
  });

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT} (HTTP + Live WebSocket)`);
  });
}

startServer();
