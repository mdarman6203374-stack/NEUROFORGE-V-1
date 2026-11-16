import express, { Request, Response } from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, LiveServerMessage, Modality, ThinkingLevel, Type } from '@google/genai';
import { v1Router, API_ENDPOINTS_CATALOG } from './src/api/v1Router';
import { ROADMAP_PHASES } from './src/data/roadmapData';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3000;

app.use(express.json({ limit: '35mb' }));

// Mount versioned REST API v1 and discovery index
app.use('/api/v1', v1Router);
app.get('/api', (_req: Request, res: Response) => {
  res.json({
    name: 'NeuroForge AI Engineering Mastery API',
    version: '1.0.0',
    v1Base: '/api/v1',
    endpoints: API_ENDPOINTS_CATALOG,
  });
});

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
 * 24/7 AI Tutor & Multi-Turn Mentor API (gemini-4-hydrogen + automatic fallback to gemini-3.1-flash-lite)
 */
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const {
      messages, // Array of { role: 'user' | 'model', content: string }
      model = 'gemini-4-hydrogen',
      enableSearchGrounding = false,
      userRole = 'socratic-tutor',
      learnerContext = null,
    } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: 'Messages array is required' });
      return;
    }

    // Use free-tier-compatible active models by default
    let selectedModel = model;
    if (
      selectedModel !== 'gemini-4-hydrogen' &&
      selectedModel !== 'gemini-3.1-flash-lite'
    ) {
      selectedModel = 'gemini-4-hydrogen';
    }

    // Role-specific custom prompt augmentation
    let roleSystemInstruction = SYSTEM_INSTRUCTION;
    if (userRole === 'socratic-tutor') {
      roleSystemInstruction += `\nRole Focus: 24/7 Personal AI Tutor. Explain step-by-step from intuition to equations & runnable code. End explanations with a quick comprehension check or next micro-exercise so the student learns actively anytime day or night.`;
    } else if (userRole === 'interview-coach') {
      roleSystemInstruction += `\nRole Focus: Technical Interviewer. Grill the student on AI Engineering concepts, ask follow-up questions on trade-offs (e.g. latency vs. quality, quantization loss, attention complexity), and critique their answers constructively.`;
    } else if (userRole === 'code-architect') {
      roleSystemInstruction += `\nRole Focus: System & Code Architect. Focus on robust production code, scalable architecture diagrams (ASCII/Markdown), latency optimization, and memory constraints.`;
    }

    if (learnerContext && typeof learnerContext === 'object') {
      roleSystemInstruction += `\n\nStudent Progress Context:\n- Preferred Language: ${learnerContext.language || 'hinglish'}\n- Active Study Timeline: ${learnerContext.pace || '20-months'}\n- Completed Concepts: ${learnerContext.completedConceptsCount ?? 0} / ${learnerContext.totalConceptsCount ?? 0}\n- Completed Days: ${learnerContext.completedDaysCount ?? 0}\n- Current Streak: ${learnerContext.currentStreak ?? 0} days`;
    }

    // Build contents history for multi-turn chat
    const contents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === 'model' ? 'model' : 'user',
      parts: [{ text: String(m.content || '') }],
    }));

    // Attempt sequence avoids search-grounding quota blockers while preserving best available model
    const attempts: Array<{ modelName: string; useSearch: boolean }> = [];
    if (enableSearchGrounding && selectedModel === 'gemini-4-hydrogen') {
      attempts.push({ modelName: 'gemini-4-hydrogen', useSearch: true });
    }
    attempts.push({ modelName: selectedModel, useSearch: false });
    if (selectedModel !== 'gemini-3.1-flash-lite') {
      attempts.push({ modelName: 'gemini-3.1-flash-lite', useSearch: false });
    } else {
      attempts.push({ modelName: 'gemini-4-hydrogen', useSearch: false });
    }

    let response: any = null;
    let modelUsed = selectedModel;
    let lastError: any = null;

    for (const attempt of attempts) {
      try {
        const config: any = {
          systemInstruction: roleSystemInstruction,
        };
        if (attempt.useSearch) {
          config.tools = [{ googleSearch: {} }];
        }

        response = await ai.models.generateContent({
          model: attempt.modelName,
          contents,
          config,
        });
        modelUsed = attempt.modelName;
        break;
      } catch (err: any) {
        lastError = err;
        const msg = String(err?.message || err || '');
        const isQuotaOrRate = msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED');
        console.warn(
          `Gemini attempt failed (${attempt.modelName}, search=${attempt.useSearch}):`,
          isQuotaOrRate ? '429 RESOURCE_EXHAUSTED' : msg
        );
        // Brief pause before next fallback attempt
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
    }

    if (!response) {
      const errMsg = String(lastError?.message || 'Gemini API request failed');
      const isQuota = errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED');
      if (isQuota) {
        res.status(429).json({
          error:
            'Gemini API rate limit or free-tier quota was reached. Please wait a few seconds and retry, or configure a billing-enabled API key in Settings > Secrets.',
          code: 'RESOURCE_EXHAUSTED',
        });
        return;
      }
      res.status(502).json({
        error: 'Unable to get a response from the AI Tutor right now. Please try again in a moment.',
      });
      return;
    }

    const replyText =
      response.text ||
      'Hello! I am online and ready to help. What AI or ML topic should we explore right now?';

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
      modelUsed,
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
 * Concept Quick Quiz Generator API (5 MCQs for a given Roadmap Concept ID via Gemini)
 */
app.post('/api/quiz/generate', async (req: Request, res: Response) => {
  try {
    const { conceptId, language = 'english' } = req.body || {};

    if (!conceptId || typeof conceptId !== 'string') {
      res.status(400).json({ error: 'conceptId is required' });
      return;
    }

    let matchedConcept: {
      id: string;
      title: string;
      description: string;
      hinglishDesc?: string;
      difficulty: string;
    } | null = null;
    let matchedPhase: { phaseNumber: number; title: string } | null = null;

    for (const phase of ROADMAP_PHASES) {
      const found = phase.concepts.find((c) => c.id === conceptId);
      if (found) {
        matchedConcept = found;
        matchedPhase = { phaseNumber: phase.phaseNumber, title: phase.title };
        break;
      }
    }

    if (!matchedConcept || !matchedPhase) {
      res.status(404).json({ error: `Concept ID '${conceptId}' was not found in the roadmap.` });
      return;
    }

    const langDirective =
      language === 'hinglish'
        ? 'Write clear technical questions in English with helpful intuitive explanations (optionally adding brief Hinglish clarity where natural).'
        : 'Write crisp, interview-grade technical questions and explanations in English.';

    const prompt = `Generate a 5-question multiple-choice quiz to test deep understanding of this AI Engineering concept:
- Phase ${matchedPhase.phaseNumber}: ${matchedPhase.title}
- Concept ID: ${matchedConcept.id}
- Concept Title: ${matchedConcept.title}
- Difficulty: ${matchedConcept.difficulty}
- Core Topics: ${matchedConcept.description}

Requirements:
1. Return exactly 5 distinct multiple-choice questions ranging from core intuition to practical edge cases or engineering trade-offs.
2. Each question must have exactly 4 plausible options and 1 unambiguous correct answer (correctIndex 0-3).
3. Include a concise 1-2 sentence explanation for why the correct answer is right.
4. ${langDirective}`;

    const attempts: Array<{ modelName: string; useLowThinking: boolean }> = [
      { modelName: 'gemini-4-hydrogen', useLowThinking: true },
      { modelName: 'gemini-3.1-flash-lite', useLowThinking: false }
    ];

    let response: any = null;
    let modelUsed = 'gemini-4-hydrogen';
    let lastError: any = null;

    for (const attempt of attempts) {
      try {
        const config: any = {
          systemInstruction:
            'You are a Principal AI Engineering Examiner creating accurate, unambiguous 5-question technical multiple-choice quizzes in strict JSON.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    question: { type: Type.STRING },
                    options: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING }
                    },
                    correctIndex: { type: Type.INTEGER },
                    explanation: { type: Type.STRING }
                  },
                  required: ['id', 'question', 'options', 'correctIndex', 'explanation']
                }
              }
            },
            required: ['questions']
          }
        };

        if (attempt.useLowThinking) {
          config.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
        }

        response = await ai.models.generateContent({
          model: attempt.modelName,
          contents: prompt,
          config
        });
        modelUsed = attempt.modelName;
        break;
      } catch (err: any) {
        lastError = err;
        console.warn(`Quick Quiz Gemini attempt failed (${attempt.modelName}):`, err?.message || err);
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
    }

    if (!response) {
      const errMsg = String(lastError?.message || 'Gemini quiz generation failed');
      const isQuota = errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED');
      if (isQuota) {
        res.status(429).json({
          error:
            'Gemini API rate limit or free-tier quota was reached while generating the quiz. Please wait a few seconds and retry.',
          code: 'RESOURCE_EXHAUSTED'
        });
        return;
      }
      res.status(502).json({
        error: 'Unable to generate quiz questions from Gemini right now. Please try again.'
      });
      return;
    }

    const rawJson = (response.text ?? '{}').trim();
    const parsed = JSON.parse(rawJson);
    const rawQuestions = Array.isArray(parsed?.questions) ? parsed.questions : [];

    const normalizedQuestions = rawQuestions.slice(0, 5).map((q: any, idx: number) => {
      const opts = Array.isArray(q?.options)
        ? q.options.slice(0, 4).map((o: any) => String(o))
        : [];
      while (opts.length < 4) {
        opts.push(`Option ${String.fromCharCode(65 + opts.length)}`);
      }
      const rawIdx = Number(q?.correctIndex);
      const safeIdx = Number.isInteger(rawIdx) && rawIdx >= 0 && rawIdx <= 3 ? rawIdx : 0;

      return {
        id: String(q?.id || `q-${idx + 1}`),
        question: String(q?.question || `Question ${idx + 1}`),
        options: opts,
        correctIndex: safeIdx,
        explanation: String(
          q?.explanation || 'Review the core concept summary in this roadmap phase.'
        )
      };
    });

    if (normalizedQuestions.length === 0) {
      res.status(502).json({ error: 'Gemini returned an empty quiz payload. Please retry.' });
      return;
    }

    res.json({
      ok: true,
      conceptId: matchedConcept.id,
      conceptTitle: matchedConcept.title,
      phaseNumber: matchedPhase.phaseNumber,
      phaseTitle: matchedPhase.title,
      modelUsed,
      questions: normalizedQuestions
    });
  } catch (error: any) {
    console.error('Quick Quiz API Error:', error);
    res.status(500).json({
      error: error?.message || 'Failed to generate Quick Quiz from Gemini'
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
 * Backend Progress Backup Snapshot API
 * Generates a structured JSON snapshot with integrity metadata and validates imported backups
 */
app.post('/api/backup/create', (req: Request, res: Response) => {
  try {
    const {
      pace = '20-months',
      completedConcepts = [],
      completedDays = [],
      streakState = null,
      reminderConfig = null,
      language = 'hinglish',
      userEmail = null,
    } = req.body || {};

    if (!Array.isArray(completedConcepts) || !Array.isArray(completedDays)) {
      res.status(400).json({ error: 'Invalid progress arrays in backup payload' });
      return;
    }

    const createdAt = new Date().toISOString();
    const payload = {
      app: 'NeuroForge AI Engineering Mastery OS',
      schemaVersion: 2,
      createdAt,
      storageBackend: 'firebase-firestore',
      userEmail,
      data: {
        pace,
        language,
        completedConcepts: Array.from(new Set(completedConcepts.map(String))),
        completedDays: Array.from(new Set(completedDays.map(Number).filter((n: number) => Number.isFinite(n)))),
        streakState,
        reminderConfig,
      },
    };

    res.json({
      ok: true,
      backup: payload,
      stats: {
        conceptsCount: payload.data.completedConcepts.length,
        daysCount: payload.data.completedDays.length,
        createdAt,
      },
    });
  } catch (error: any) {
    console.error('Backup creation failed:', error);
    res.status(500).json({ error: error.message || 'Failed to create backup snapshot' });
  }
});

app.post('/api/backup/validate', (req: Request, res: Response) => {
  try {
    const candidate = req.body?.backup ?? req.body;
    const data = candidate?.data ?? candidate;

    if (!data || !Array.isArray(data.completedConcepts) || !Array.isArray(data.completedDays)) {
      res.status(400).json({ valid: false, error: 'Backup file missing completedConcepts or completedDays arrays' });
      return;
    }

    const sanitized = {
      pace: typeof data.pace === 'string' ? data.pace : '20-months',
      language: data.language === 'english' ? 'english' : 'hinglish',
      completedConcepts: Array.from(new Set(data.completedConcepts.map(String))),
      completedDays: Array.from(
        new Set(data.completedDays.map(Number).filter((n: number) => Number.isFinite(n) && n >= 1))
      ),
      streakState: data.streakState && typeof data.streakState === 'object' ? data.streakState : null,
      reminderConfig: data.reminderConfig && typeof data.reminderConfig === 'object' ? data.reminderConfig : null,
    };

    res.json({
      valid: true,
      data: sanitized,
    });
  } catch (error: any) {
    res.status(400).json({ valid: false, error: error.message || 'Invalid backup format' });
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
