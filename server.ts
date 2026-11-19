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
    name: 'SynapseLab AI Engineering Studio API',
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
const SYSTEM_INSTRUCTION = `You are "SynapseMentor", an elite Principal AI Engineer and dedicated interactive learning mentor on the SynapseLab AI platform.
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
 * Feynman Technique 60-Second Explanation Evaluator API via Gemini
 */
app.post('/api/feynman/evaluate', async (req: Request, res: Response) => {
  try {
    const {
      conceptId,
      conceptTitle,
      explanationText,
      language = 'english',
      durationSecondsUsed = 60
    } = req.body || {};

    if (!explanationText || typeof explanationText !== 'string' || explanationText.trim().length < 15) {
      res.status(400).json({
        error: 'Please share at least a sentence or two explaining the concept before grading.'
      });
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

    if (conceptId && typeof conceptId === 'string') {
      for (const phase of ROADMAP_PHASES) {
        const found = phase.concepts.find((c) => c.id === conceptId);
        if (found) {
          matchedConcept = found;
          matchedPhase = { phaseNumber: phase.phaseNumber, title: phase.title };
          break;
        }
      }
    }

    const topicName = matchedConcept?.title || conceptTitle || 'AI Engineering Concept';
    const topicDetails = matchedConcept
      ? `Phase ${matchedPhase?.phaseNumber}: ${matchedPhase?.title}\nReference Syllabus Coverage: ${matchedConcept.description}`
      : 'Evaluate strictly on first-principles AI engineering accuracy and beginner clarity.';

    const langDirective =
      language === 'hinglish'
        ? 'Write strengths, missingIntuition, jargonTraps, verdictHeadline, and especially simplifiedAnalogy in natural, encouraging Hinglish (simple English technical words + everyday Roman Hindi intuition).'
        : 'Write all feedback clearly in crisp, encouraging English suitable for a beginner learning AI Engineering.';

    const prompt = `Evaluate this 60-second "Feynman Technique" learner explanation where the student tries to explain an AI Engineering concept in simple language as if teaching a curious beginner.

Concept: ${topicName}
${topicDetails}
Time taken: ${Math.min(60, Math.max(1, Number(durationSecondsUsed) || 60))}s

Student Explanation:
"""
${explanationText.trim()}
"""

Grading Rubric:
1. clarityScore (0-100): How easy is it for a beginner or non-expert to follow?
2. intuitionScore (0-100): Did they capture the core "why & how it works" intuition without hand-waving?
3. simplicityScore (0-100): Did they avoid unexplained jargon overload? (Higher = simpler, clearer language).
4. accuracyScore (0-100): How technically and factually accurate is the explanation (no misconceptions or false claims)?
5. verdictHeadline: Short 5-9 word summary verdict.
6. strengths: 2-3 specific things the student nailed.
7. missingIntuition: 2-3 key mechanisms, intuitions, or edge cases they skipped.
8. jargonTraps: Up to 4 technical buzzwords they used without explaining simply (empty array if none).
9. accuracyNotes: 1-3 brief notes verifying factual accuracy or correcting any technical misconception.
10. simplifiedAnalogy: A memorable 2-sentence analogy + plain explanation showing how Feynman would teach this topic.

${langDirective}`;

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
            'You are a Principal AI Educator & Richard Feynman mentor grading a learner explanation strictly and constructively in JSON.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              clarityScore: { type: Type.INTEGER },
              intuitionScore: { type: Type.INTEGER },
              simplicityScore: { type: Type.INTEGER },
              accuracyScore: { type: Type.INTEGER },
              verdictHeadline: { type: Type.STRING },
              strengths: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              missingIntuition: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              jargonTraps: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              accuracyNotes: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              simplifiedAnalogy: { type: Type.STRING }
            },
            required: [
              'clarityScore',
              'intuitionScore',
              'simplicityScore',
              'accuracyScore',
              'verdictHeadline',
              'strengths',
              'missingIntuition',
              'jargonTraps',
              'accuracyNotes',
              'simplifiedAnalogy'
            ]
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
        console.warn(`Feynman Gemini attempt failed (${attempt.modelName}):`, err?.message || err);
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
    }

    if (!response) {
      const errMsg = String(lastError?.message || 'Gemini Feynman evaluation failed');
      const isQuota = errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED');
      if (isQuota) {
        res.status(429).json({
          error:
            'Gemini API rate limit or free-tier quota was reached. Please wait a few seconds and retry.',
          code: 'RESOURCE_EXHAUSTED'
        });
        return;
      }
      res.status(502).json({
        error: 'Unable to evaluate explanation via Gemini right now. Please try again shortly.'
      });
      return;
    }

    const rawJson = (response.text ?? '{}').trim();
    const parsed = JSON.parse(rawJson);
    const clampScore = (v: any) => {
      const n = Number(v);
      if (!Number.isFinite(n)) return 65;
      return Math.min(100, Math.max(0, Math.round(n)));
    };

    res.json({
      ok: true,
      conceptId: matchedConcept?.id || conceptId || 'custom',
      conceptTitle: topicName,
      modelUsed,
      evaluation: {
        clarityScore: clampScore(parsed.clarityScore),
        intuitionScore: clampScore(parsed.intuitionScore),
        simplicityScore: clampScore(parsed.simplicityScore),
        accuracyScore: clampScore(parsed.accuracyScore ?? parsed.intuitionScore),
        verdictHeadline: String(parsed.verdictHeadline || 'Good explanation — see feedback below.'),
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths.map(String).slice(0, 4) : [],
        missingIntuition: Array.isArray(parsed.missingIntuition)
          ? parsed.missingIntuition.map(String).slice(0, 4)
          : [],
        jargonTraps: Array.isArray(parsed.jargonTraps) ? parsed.jargonTraps.map(String).slice(0, 5) : [],
        accuracyNotes: Array.isArray(parsed.accuracyNotes)
          ? parsed.accuracyNotes.map(String).slice(0, 4)
          : [],
        simplifiedAnalogy: String(parsed.simplifiedAnalogy || '')
      }
    });
  } catch (error: any) {
    console.error('Feynman Evaluate API Error:', error);
    res.status(500).json({
      error: error?.message || 'Failed to evaluate Feynman explanation'
    });
  }
});

/**
 * Interactive Prompt & RAG Lab Grounded Generation API via Gemini
 */
app.post('/api/rag/simulate', async (req: Request, res: Response) => {
  try {
    const {
      query,
      systemPrompt = 'Answer strictly using the retrieved context. Cite chunk IDs like [Chunk 1]. If the answer is missing, say "Not found in retrieved context."',
      retrievedChunks = [],
      temperature = 0.2,
      language = 'english'
    } = req.body || {};

    if (!query || typeof query !== 'string' || !query.trim()) {
      res.status(400).json({ error: 'Query is required for RAG simulation.' });
      return;
    }

    const formattedContext = Array.isArray(retrievedChunks) && retrievedChunks.length > 0
      ? retrievedChunks
          .slice(0, 8)
          .map((c: any, idx: number) => `[Chunk ${c.index ?? idx + 1} | score=${Number(c.score ?? 0).toFixed(2)}]\n${String(c.text || '')}`)
          .join('\n\n---\n\n')
      : '(No chunks were retrieved with current chunk/Top-K settings.)';

    const tempVal = Number(temperature);
    const safeTemp = Number.isFinite(tempVal) ? Math.min(1.5, Math.max(0, tempVal)) : 0.2;

    const prompt = `Retrieved Context:
${formattedContext}

User Question: ${query.trim()}

Instructions:
- Follow the system prompt strictly.
- Explicitly mention which [Chunk #] supported your answer, or explain what information is missing from the retrieved context.
- Temperature setting observed conceptually by user: ${safeTemp.toFixed(1)} (${safeTemp > 0.7 ? 'creative/exploratory phrasing' : 'deterministic/strict grounding'}).
- Language style: ${language === 'hinglish' ? 'Clear English technical terms with brief helpful Hinglish clarity where natural.' : 'Concise engineering English.'}`;

    const attempts = ['gemini-4-hydrogen', 'gemini-3.1-flash-lite'];
    let response: any = null;
    let modelUsed = 'gemini-4-hydrogen';
    let lastError: any = null;

    for (const modelName of attempts) {
      try {
        response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            systemInstruction: String(systemPrompt || 'You are a grounded RAG assistant.')
          }
        });
        modelUsed = modelName;
        break;
      } catch (err: any) {
        lastError = err;
        console.warn(`RAG Lab Gemini attempt failed (${modelName}):`, err?.message || err);
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
    }

    if (!response) {
      const errMsg = String(lastError?.message || 'RAG simulation failed');
      const isQuota = errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED');
      if (isQuota) {
        res.status(429).json({
          error: 'Gemini API rate limit reached. Wait a few seconds and retry.',
          code: 'RESOURCE_EXHAUSTED'
        });
        return;
      }
      res.status(502).json({ error: 'Unable to run RAG generation right now.' });
      return;
    }

    res.json({
      ok: true,
      answer: response.text || 'No response generated.',
      modelUsed,
      chunksUsedCount: Array.isArray(retrievedChunks) ? retrievedChunks.length : 0
    });
  } catch (error: any) {
    console.error('RAG Simulate API Error:', error);
    res.status(500).json({ error: error?.message || 'Failed to simulate RAG response' });
  }
});

/**
 * AI Mock Technical & System Design Interviewer (Scoped to unlocked completedConcepts)
 */
app.post('/api/interview/ask', async (req: Request, res: Response) => {
  try {
    const {
      completedConcepts = [],
      focusConceptId = '',
      roleTarget = 'AI / LLM Engineer',
      mode = 'system-design',
      language = 'english',
      previousQuestions = []
    } = req.body || {};

    const unlockedIds = new Set(Array.isArray(completedConcepts) ? completedConcepts.map(String) : []);
    const unlockedDetails: Array<{ id: string; title: string; phaseTitle: string; description: string }> = [];

    for (const phase of ROADMAP_PHASES) {
      for (const c of phase.concepts) {
        if (unlockedIds.has(c.id)) {
          unlockedDetails.push({
            id: c.id,
            title: c.title,
            phaseTitle: `Phase ${phase.phaseNumber}: ${phase.title}`,
            description: c.description
          });
        }
      }
    }

    const targetedPool =
      focusConceptId && typeof focusConceptId === 'string'
        ? unlockedDetails.filter((d) => d.id === focusConceptId)
        : unlockedDetails;
    const effectivePool = targetedPool.length > 0 ? targetedPool : unlockedDetails;

    const scopeSummary =
      effectivePool.length > 0
        ? effectivePool
            .map((d) => `- [${d.id}] ${d.title} (${d.phaseTitle}): ${d.description}`)
            .join('\n')
        : '- [p0-1] Linear Algebra: Vectors, Matrices, Eigenvalues & SVD\n- [p0-2] Multivariable Calculus & Gradient Descent';

    const avoidList =
      Array.isArray(previousQuestions) && previousQuestions.length > 0
        ? `\nDo NOT repeat these recently asked questions:\n${previousQuestions.slice(0, 6).map((q: string) => `- ${q}`).join('\n')}`
        : '';

    const prompt = `Generate ONE realistic ${mode === 'system-design' ? 'AI System Design' : 'Deep Technical'} mock interview question for a candidate targeting "${roleTarget}".

CRITICAL CONSTRAINT: Ask strictly ONLY about concepts present in the candidate's UNLOCKED Syllabus below. Do not ask about unstudied topics!
Unlocked Concepts:
${scopeSummary}
${avoidList}

Requirements:
- Make it scenario-based and engineering-focused (e.g., scale constraints, failure modes, trade-offs, memory/latency math).
- Return focusConceptId matching one of the bracketed IDs above (e.g. "${effectivePool[0]?.id || 'p0-1'}").
- Language: ${language === 'hinglish' ? 'Crisp technical English question with optional brief Hinglish scenario framing.' : 'Crisp staff-engineer interview English.'}`;

    const attempts = ['gemini-4-hydrogen', 'gemini-3.1-flash-lite'];
    let response: any = null;
    let modelUsed = 'gemini-4-hydrogen';
    let lastError: any = null;

    for (const modelName of attempts) {
      try {
        response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            systemInstruction:
              'You are a Staff AI Engineer conducting a rigorous technical interview strictly calibrated to the candidate syllabus in JSON.',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                focusConceptId: { type: Type.STRING },
                focusConceptTitle: { type: Type.STRING },
                constraints: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                hint: { type: Type.STRING }
              },
              required: ['question', 'focusConceptId', 'focusConceptTitle', 'constraints', 'hint']
            }
          }
        });
        modelUsed = modelName;
        break;
      } catch (err: any) {
        lastError = err;
        await new Promise((r) => setTimeout(r, 250));
      }
    }

    if (!response) {
      const msg = String(lastError?.message || 'Failed to generate interview question');
      if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) {
        res.status(429).json({ error: 'Gemini API rate limit reached. Wait a moment and retry.' });
        return;
      }
      res.status(502).json({ error: 'Unable to generate mock interview question right now.' });
      return;
    }

    const parsed = JSON.parse((response.text ?? '{}').trim());
    res.json({
      ok: true,
      modelUsed,
      unlockedCount: unlockedDetails.length,
      promptData: {
        question: String(parsed.question || 'Explain the core trade-offs in your unlocked AI concept.'),
        focusConceptId: String(parsed.focusConceptId || unlockedDetails[0]?.id || 'p0-1'),
        focusConceptTitle: String(parsed.focusConceptTitle || unlockedDetails[0]?.title || 'AI Foundations'),
        constraints: Array.isArray(parsed.constraints) ? parsed.constraints.map(String).slice(0, 4) : [],
        hint: String(parsed.hint || 'Walk through assumptions, bottlenecks, and concrete failure modes.')
      }
    });
  } catch (error: any) {
    console.error('Interview Ask Error:', error);
    res.status(500).json({ error: error?.message || 'Failed to create interview question' });
  }
});

app.post('/api/interview/evaluate', async (req: Request, res: Response) => {
  try {
    const {
      question,
      focusConceptTitle = '',
      answerText,
      language = 'english'
    } = req.body || {};

    if (!question || !answerText || typeof answerText !== 'string' || answerText.trim().length < 20) {
      res.status(400).json({ error: 'Please write a structured engineering answer (at least 20 characters).' });
      return;
    }

    const prompt = `Evaluate this AI Engineering mock interview answer.

Question (${focusConceptTitle}):
"${String(question)}"

Candidate Answer:
"""
${answerText.trim()}
"""

Score strictly on 3 axes (0-100 each):
1. depthScore: Engineering depth, concrete mechanisms, math/memory/latency awareness.
2. edgeCasesScore: Failure modes, scaling bottlenecks, trade-offs, boundary conditions.
3. clarityScore: Structure, precision, communication polish.

Also provide:
- overallVerdict: Crisp 4-8 word hiring-bar signal (e.g. "Strong Mid-Level Signal · Needs Scale Metrics")
- strongPoints: 2-3 strengths
- missedPoints: 2-3 critical angles or edge cases missed
- followUpQuestion: 1 sharp realistic follow-up question probing deeper into their answer
- modelOutline: A concise 3-4 sentence senior-engineer reference outline.
Language: ${language === 'hinglish' ? 'Clear technical English with natural Hinglish coaching tips where helpful.' : 'Concise senior engineering English.'}`;

    const attempts = ['gemini-4-hydrogen', 'gemini-3.1-flash-lite'];
    let response: any = null;
    let modelUsed = 'gemini-4-hydrogen';
    let lastError: any = null;

    for (const modelName of attempts) {
      try {
        response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            systemInstruction:
              'You are a Principal AI Interview Bar-Raiser returning strict calibrated interview feedback in JSON.',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                depthScore: { type: Type.INTEGER },
                edgeCasesScore: { type: Type.INTEGER },
                clarityScore: { type: Type.INTEGER },
                overallVerdict: { type: Type.STRING },
                strongPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
                missedPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
                followUpQuestion: { type: Type.STRING },
                modelOutline: { type: Type.STRING }
              },
              required: [
                'depthScore',
                'edgeCasesScore',
                'clarityScore',
                'overallVerdict',
                'strongPoints',
                'missedPoints',
                'followUpQuestion',
                'modelOutline'
              ]
            }
          }
        });
        modelUsed = modelName;
        break;
      } catch (err: any) {
        lastError = err;
        await new Promise((r) => setTimeout(r, 250));
      }
    }

    if (!response) {
      const msg = String(lastError?.message || 'Evaluation failed');
      if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) {
        res.status(429).json({ error: 'Gemini API rate limit reached. Please retry shortly.' });
        return;
      }
      res.status(502).json({ error: 'Unable to evaluate interview answer right now.' });
      return;
    }

    const parsed = JSON.parse((response.text ?? '{}').trim());
    const clamp = (n: any) => Math.min(100, Math.max(0, Math.round(Number(n) || 60)));

    res.json({
      ok: true,
      modelUsed,
      evaluation: {
        depthScore: clamp(parsed.depthScore),
        edgeCasesScore: clamp(parsed.edgeCasesScore),
        clarityScore: clamp(parsed.clarityScore),
        overallVerdict: String(parsed.overallVerdict || 'Evaluated'),
        strongPoints: Array.isArray(parsed.strongPoints) ? parsed.strongPoints.map(String).slice(0, 4) : [],
        missedPoints: Array.isArray(parsed.missedPoints) ? parsed.missedPoints.map(String).slice(0, 4) : [],
        followUpQuestion: String(parsed.followUpQuestion || ''),
        modelOutline: String(parsed.modelOutline || '')
      }
    });
  } catch (error: any) {
    console.error('Interview Evaluate Error:', error);
    res.status(500).json({ error: error?.message || 'Failed to evaluate interview response' });
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
      app: 'SynapseLab AI Engineering Studio',
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
