import { Router, Request, Response } from 'express';
import { ROADMAP_PHASES } from '../data/roadmapData';
import {
  TIMELINE_TRACK_CONFIGS,
  generateMasterPlanForMonths
} from '../data/twentyMonthMasterPlanData';
import { generateDailySchedule } from '../data/dailyScheduleData';
import { HINDI_CHANNELS_DATA } from '../data/hindiChannelsData';
import { CAREER_ROLES_DATA } from '../data/careerData';
import { FUTURE_AI_TRENDS } from '../data/futureOutlookData';
import { AMBIENT_SOUND_PRESETS, AmbientSoundId } from '../data/ambientSoundsData';
import {
  AI_TECH_QUOTES,
  getDailyQuoteForDate,
  getRandomTechQuote
} from '../data/dailyQuotesData';
import { MasterPlanMonths, SchedulePace } from '../types';

const VALID_PACES: SchedulePace[] = [
  '20-months',
  '16-months',
  '14-months',
  '12-months',
  '6-months',
  '3-months',
  '2-hours-daily'
];

export const v1Router = Router();

// Allow external apps & scripts to query the public read/analytics API cleanly
v1Router.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

export const API_ENDPOINTS_CATALOG = [
  {
    method: 'GET',
    path: '/api/v1',
    summary: 'API v1 catalog & schema overview',
    sample: '/api/v1'
  },
  {
    method: 'GET',
    path: '/api/v1/roadmap',
    summary: 'Curriculum phases & concepts (?phase, ?search, ?difficulty)',
    sample: '/api/v1/roadmap?search=Attention'
  },
  {
    method: 'GET',
    path: '/api/v1/roadmap/concepts',
    summary: 'Flat searchable concept index (?search, ?phase, ?difficulty)',
    sample: '/api/v1/roadmap/concepts?difficulty=Advanced'
  },
  {
    method: 'GET',
    path: '/api/v1/plans',
    summary: 'Flexible completion tracks (20, 16, 14, 12 months)',
    sample: '/api/v1/plans'
  },
  {
    method: 'GET',
    path: '/api/v1/plans/:months',
    summary: 'Month-by-month syllabus for 20, 16, 14, or 12 months',
    sample: '/api/v1/plans/12'
  },
  {
    method: 'GET',
    path: '/api/v1/schedule',
    summary: 'Daily study schedule (?pace, ?day, ?phase, ?offset, ?limit)',
    sample: '/api/v1/schedule?pace=16-months&limit=5'
  },
  {
    method: 'GET',
    path: '/api/v1/projects',
    summary: 'Standard resume & visionary future projects (?category, ?phase)',
    sample: '/api/v1/projects?category=visionary'
  },
  {
    method: 'GET',
    path: '/api/v1/resources/hindi',
    summary: 'Curated Hindi AI/ML YouTube channels & playlists (?search)',
    sample: '/api/v1/resources/hindi'
  },
  {
    method: 'GET',
    path: '/api/v1/careers',
    summary: 'AI engineering roles, salaries, skills & interview prep (?search)',
    sample: '/api/v1/careers'
  },
  {
    method: 'GET',
    path: '/api/v1/trends',
    summary: '2025-2028+ AI architecture & industry trends (?category)',
    sample: '/api/v1/trends'
  },
  {
    method: 'POST',
    path: '/api/v1/progress/summary',
    summary: 'Calculate mastery %, category stats & next study task from completed IDs',
    sample: '/api/v1/progress/summary'
  },
  {
    method: 'GET',
    path: '/api/v1/focus/ambient',
    summary: 'List Focus Mode ambient soundscapes (Rain, Cafe, White Noise) & acoustic profiles',
    sample: '/api/v1/focus/ambient'
  },
  {
    method: 'POST',
    path: '/api/v1/focus/session',
    summary: 'Log & evaluate a Focus Mode Pomodoro + ambient sound study session',
    sample: '/api/v1/focus/session'
  },
  {
    method: 'POST',
    path: '/api/feynman/evaluate',
    summary: 'Grade a 60-second Feynman Technique learner explanation via Gemini',
    sample: '/api/feynman/evaluate'
  },
  {
    method: 'POST',
    path: '/api/rag/simulate',
    summary: 'Run grounded RAG answer generation over retrieved chunks via Gemini',
    sample: '/api/rag/simulate'
  },
  {
    method: 'POST',
    path: '/api/interview/ask',
    summary: 'Generate mock ML/LLM technical interview question scoped to unlocked completedConcepts',
    sample: '/api/interview/ask'
  },
  {
    method: 'POST',
    path: '/api/interview/evaluate',
    summary: 'Score interview response across Depth, Edge Cases, and Clarity via Gemini',
    sample: '/api/interview/evaluate'
  },
  {
    method: 'GET',
    path: '/api/v1/quotes/daily',
    summary: 'Fetch daily inspirational AI & technology quote (?random=true, ?exclude=id)',
    sample: '/api/v1/quotes/daily'
  },
  {
    method: 'POST',
    path: '/api/chat',
    summary: '24/7 AI Tutor (Gemini 4 Hydrogen + Search Grounding + Learner Context)',
    sample: '/api/chat'
  },
  {
    method: 'POST',
    path: '/api/quiz/generate',
    summary: 'Generate 5 Gemini multiple-choice questions for a Roadmap concept ID',
    sample: '/api/quiz/generate'
  },
  {
    method: 'POST',
    path: '/api/backup/create',
    summary: 'Generate verified JSON backup snapshot of progress & reminders',
    sample: '/api/backup/create'
  },
  {
    method: 'POST',
    path: '/api/backup/validate',
    summary: 'Validate & sanitize an uploaded progress backup JSON payload',
    sample: '/api/backup/validate'
  }
];

v1Router.get('/', (_req: Request, res: Response) => {
  res.json({
    service: 'SynapseLab AI Engineering Studio API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: API_ENDPOINTS_CATALOG
  });
});

v1Router.get('/roadmap', (req: Request, res: Response) => {
  const phaseFilter = typeof req.query.phase === 'string' ? req.query.phase.trim().toLowerCase() : '';
  const search = typeof req.query.search === 'string' ? req.query.search.trim().toLowerCase() : '';
  const difficulty =
    typeof req.query.difficulty === 'string' ? req.query.difficulty.trim().toLowerCase() : '';

  const filteredPhases = ROADMAP_PHASES.filter((phase) => {
    if (!phaseFilter) return true;
    return (
      phase.id.toLowerCase() === phaseFilter ||
      String(phase.phaseNumber) === phaseFilter
    );
  }).map((phase) => {
    const concepts = phase.concepts.filter((c) => {
      if (difficulty && c.difficulty.toLowerCase() !== difficulty) return false;
      if (!search) return true;
      return (
        c.title.toLowerCase().includes(search) ||
        c.description.toLowerCase().includes(search) ||
        (c.hinglishDesc && c.hinglishDesc.toLowerCase().includes(search))
      );
    });
    return { ...phase, concepts };
  });

  const result = search || difficulty
    ? filteredPhases.filter((p) => p.concepts.length > 0)
    : filteredPhases;

  res.json({
    ok: true,
    totalPhases: result.length,
    totalConcepts: result.reduce((acc, p) => acc + p.concepts.length, 0),
    phases: result
  });
});

v1Router.get('/roadmap/concepts', (req: Request, res: Response) => {
  const phaseFilter = typeof req.query.phase === 'string' ? req.query.phase.trim().toLowerCase() : '';
  const search = typeof req.query.search === 'string' ? req.query.search.trim().toLowerCase() : '';
  const difficulty =
    typeof req.query.difficulty === 'string' ? req.query.difficulty.trim().toLowerCase() : '';

  const concepts = ROADMAP_PHASES.flatMap((phase) =>
    phase.concepts.map((c) => ({
      ...c,
      phaseId: phase.id,
      phaseNumber: phase.phaseNumber,
      phaseTitle: phase.title
    }))
  ).filter((item) => {
    if (phaseFilter && item.phaseId.toLowerCase() !== phaseFilter && String(item.phaseNumber) !== phaseFilter) {
      return false;
    }
    if (difficulty && item.difficulty.toLowerCase() !== difficulty) {
      return false;
    }
    if (search) {
      return (
        item.title.toLowerCase().includes(search) ||
        item.description.toLowerCase().includes(search) ||
        item.phaseTitle.toLowerCase().includes(search)
      );
    }
    return true;
  });

  res.json({
    ok: true,
    count: concepts.length,
    concepts
  });
});

v1Router.get('/plans', (_req: Request, res: Response) => {
  res.json({
    ok: true,
    count: TIMELINE_TRACK_CONFIGS.length,
    tracks: TIMELINE_TRACK_CONFIGS
  });
});

v1Router.get('/plans/:months', (req: Request, res: Response) => {
  const parsed = Number(req.params.months);
  if (parsed !== 20 && parsed !== 16 && parsed !== 14 && parsed !== 12) {
    res.status(400).json({
      ok: false,
      error: 'Supported master plan durations are 20, 16, 14, or 12 months.'
    });
    return;
  }

  const months = parsed as MasterPlanMonths;
  const track = TIMELINE_TRACK_CONFIGS.find((t) => t.months === months);
  const milestones = generateMasterPlanForMonths(months);

  res.json({
    ok: true,
    months,
    track,
    milestonesCount: milestones.length,
    milestones
  });
});

v1Router.get('/schedule', (req: Request, res: Response) => {
  const rawPace = typeof req.query.pace === 'string' ? req.query.pace : '20-months';
  const pace: SchedulePace = VALID_PACES.includes(rawPace as SchedulePace)
    ? (rawPace as SchedulePace)
    : '20-months';

  const fullSchedule = generateDailySchedule(pace);

  const dayParam = req.query.day ? Number(req.query.day) : null;
  if (dayParam !== null && Number.isFinite(dayParam)) {
    const task = fullSchedule.find((t) => t.dayNumber === dayParam);
    if (!task) {
      res.status(404).json({ ok: false, error: `Day ${dayParam} not found for pace ${pace}` });
      return;
    }
    res.json({ ok: true, pace, totalDays: fullSchedule.length, task });
    return;
  }

  const phaseParam = req.query.phase !== undefined ? Number(req.query.phase) : null;
  const filtered =
    phaseParam !== null && Number.isFinite(phaseParam)
      ? fullSchedule.filter((t) => t.phaseNumber === phaseParam)
      : fullSchedule;

  const offset = Math.max(0, Number(req.query.offset) || 0);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const slice = filtered.slice(offset, offset + limit);

  res.json({
    ok: true,
    pace,
    totalDays: fullSchedule.length,
    filteredTotal: filtered.length,
    offset,
    limit,
    tasks: slice
  });
});

v1Router.get('/projects', (req: Request, res: Response) => {
  const category =
    typeof req.query.category === 'string' ? req.query.category.trim().toLowerCase() : '';
  const phaseFilter =
    typeof req.query.phase === 'string' ? req.query.phase.trim().toLowerCase() : '';

  const projects = ROADMAP_PHASES.filter((p) =>
    !phaseFilter || p.id.toLowerCase() === phaseFilter || String(p.phaseNumber) === phaseFilter
  ).flatMap((phase) => {
    const items = [
      { ...phase.standardProject, kind: 'standard', phaseId: phase.id, phaseNumber: phase.phaseNumber },
      { ...phase.visionaryProject, kind: 'visionary', phaseId: phase.id, phaseNumber: phase.phaseNumber }
    ];
    if (!category) return items;
    return items.filter((item) => item.kind === category || item.category.toLowerCase().includes(category));
  });

  res.json({
    ok: true,
    count: projects.length,
    projects
  });
});

v1Router.get('/resources/hindi', (req: Request, res: Response) => {
  const search = typeof req.query.search === 'string' ? req.query.search.trim().toLowerCase() : '';
  const channels = search
    ? HINDI_CHANNELS_DATA.filter(
        (c) =>
          c.name.toLowerCase().includes(search) ||
          c.specialty.toLowerCase().includes(search) ||
          c.playlists.some((p) => p.title.toLowerCase().includes(search) || p.topic.toLowerCase().includes(search))
      )
    : HINDI_CHANNELS_DATA;

  res.json({
    ok: true,
    count: channels.length,
    channels
  });
});

v1Router.get('/careers', (req: Request, res: Response) => {
  const search = typeof req.query.search === 'string' ? req.query.search.trim().toLowerCase() : '';
  const roles = search
    ? CAREER_ROLES_DATA.filter(
        (r) =>
          r.title.toLowerCase().includes(search) ||
          r.requiredSkills.some((s) => s.toLowerCase().includes(search))
      )
    : CAREER_ROLES_DATA;

  res.json({
    ok: true,
    count: roles.length,
    roles
  });
});

v1Router.get('/trends', (req: Request, res: Response) => {
  const category =
    typeof req.query.category === 'string' ? req.query.category.trim().toLowerCase() : '';
  const trends = category
    ? FUTURE_AI_TRENDS.filter((t) => t.category.toLowerCase() === category)
    : FUTURE_AI_TRENDS;

  res.json({
    ok: true,
    count: trends.length,
    trends
  });
});

v1Router.post('/progress/summary', (req: Request, res: Response) => {
  const {
    completedConcepts = [],
    completedDays = [],
    pace = '20-months'
  } = req.body || {};

  if (!Array.isArray(completedConcepts) || !Array.isArray(completedDays)) {
    res.status(400).json({
      ok: false,
      error: 'completedConcepts and completedDays must be arrays'
    });
    return;
  }

  const completedSet = new Set(completedConcepts.map(String));
  const completedDaySet = new Set(completedDays.map(Number));

  const phaseBreakdown = ROADMAP_PHASES.map((phase) => {
    const total = phase.concepts.length;
    const done = phase.concepts.filter((c) => completedSet.has(c.id)).length;
    const estHoursTotal = phase.concepts.reduce((acc, c) => acc + c.estHours, 0);
    const estHoursDone = phase.concepts
      .filter((c) => completedSet.has(c.id))
      .reduce((acc, c) => acc + c.estHours, 0);

    return {
      phaseId: phase.id,
      phaseNumber: phase.phaseNumber,
      title: phase.title,
      completed: done,
      total,
      percent: total > 0 ? Math.round((done / total) * 100) : 0,
      hoursCompleted: estHoursDone,
      hoursTotal: estHoursTotal
    };
  });

  const totalConcepts = phaseBreakdown.reduce((acc, p) => acc + p.total, 0);
  const completedCount = phaseBreakdown.reduce((acc, p) => acc + p.completed, 0);
  const overallPercent = totalConcepts > 0 ? Math.round((completedCount / totalConcepts) * 100) : 0;

  const validPace: SchedulePace = VALID_PACES.includes(pace as SchedulePace)
    ? (pace as SchedulePace)
    : '20-months';
  const schedule = generateDailySchedule(validPace);
  const nextDailyTask = schedule.find((t) => !completedDaySet.has(t.dayNumber)) || schedule[0];

  const nextConcept =
    ROADMAP_PHASES.flatMap((p) => p.concepts).find((c) => !completedSet.has(c.id)) || null;

  res.json({
    ok: true,
    pace: validPace,
    overall: {
      completedConcepts: completedCount,
      totalConcepts,
      overallPercent,
      completedDays: completedDaySet.size,
      totalScheduledDays: schedule.length
    },
    phaseBreakdown,
    nextRecommendedConcept: nextConcept,
    nextDailyTask
  });
});

v1Router.get('/focus/ambient', (req: Request, res: Response) => {
  const idFilter = typeof req.query.id === 'string' ? req.query.id.trim().toLowerCase() : '';
  const sounds = idFilter
    ? AMBIENT_SOUND_PRESETS.filter((s) => s.id === idFilter)
    : AMBIENT_SOUND_PRESETS;

  if (idFilter && sounds.length === 0) {
    res.status(404).json({
      ok: false,
      error: `Ambient sound preset '${idFilter}' not found. Valid options: rain, cafe, white-noise.`
    });
    return;
  }

  res.json({
    ok: true,
    count: sounds.length,
    sounds
  });
});

v1Router.post('/focus/session', (req: Request, res: Response) => {
  const {
    dayNumber = 1,
    durationMinutes = 25,
    targetBlock = 'concept',
    ambientSound = 'rain',
    pace = '20-months'
  } = req.body || {};

  const mins = Number(durationMinutes);
  const day = Number(dayNumber);
  if (!Number.isFinite(mins) || mins < 1 || mins > 360) {
    res.status(400).json({
      ok: false,
      error: 'durationMinutes must be a valid number between 1 and 360'
    });
    return;
  }

  const validSound: AmbientSoundId =
    ambientSound === 'cafe' || ambientSound === 'white-noise' ? ambientSound : 'rain';
  const validPace: SchedulePace = VALID_PACES.includes(pace as SchedulePace)
    ? (pace as SchedulePace)
    : '20-months';
  const soundMeta = AMBIENT_SOUND_PRESETS.find((s) => s.id === validSound) || AMBIENT_SOUND_PRESETS[0];

  res.json({
    ok: true,
    sessionId: `focus_${Date.now()}`,
    recordedAt: new Date().toISOString(),
    dayNumber: Number.isFinite(day) && day >= 1 ? day : 1,
    pace: validPace,
    targetBlock: String(targetBlock),
    durationMinutes: mins,
    pomodoroBlocksEarned: Number((mins / 25).toFixed(2)),
    ambientSound: {
      id: soundMeta.id,
      name: soundMeta.name
    }
  });
});

v1Router.get('/quotes/daily', (req: Request, res: Response) => {
  const isRandom = String(req.query.random || '').toLowerCase() === 'true';
  const excludeId = typeof req.query.exclude === 'string' ? req.query.exclude.trim() : undefined;
  const dateParam = typeof req.query.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(req.query.date)
    ? req.query.date
    : new Date().toISOString().split('T')[0];

  const quote = isRandom ? getRandomTechQuote(excludeId) : getDailyQuoteForDate(dateParam);

  res.json({
    ok: true,
    date: dateParam,
    mode: isRandom ? 'shuffled' : 'daily',
    totalCurated: AI_TECH_QUOTES.length,
    quote
  });
});
