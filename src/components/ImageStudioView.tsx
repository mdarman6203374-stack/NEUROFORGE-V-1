import React, { useMemo, useState } from 'react';
import {
  Image as ImageIcon,
  Wand2,
  Download,
  Copy,
  Check,
  Sparkles,
  Upload,
  Loader2,
  FileImage,
  Video,
  Play,
  Film,
  Camera,
  Map,
  Compass,
  CheckCircle2,
  Flame,
  SlidersHorizontal,
} from 'lucide-react';
import { Language, SchedulePace, StreakState } from '../types';
import { ROADMAP_PHASES } from '../data/roadmapData';
import { TWENTY_MONTH_MASTER_PLAN } from '../data/twentyMonthMasterPlanData';

interface GeneratedImageItem {
  id: string;
  prompt: string;
  imageUrl: string;
  aspectRatio: string;
  modelUsed: string;
  timestamp: string;
  tag?: string;
}

interface ImageStudioViewProps {
  language: Language;
  completedConcepts?: string[];
  completedDays?: number[];
  pace?: SchedulePace;
  streakState?: StreakState;
}

type RoadmapStyleTheme =
  | 'neon-blueprint'
  | 'isometric-mountain'
  | 'editorial-poster'
  | 'neural-constellation';

const ROADMAP_STYLE_THEMES: {
  id: RoadmapStyleTheme;
  label: string;
  hinglishLabel: string;
  desc: string;
  accent: string;
}[] = [
  {
    id: 'neon-blueprint',
    label: 'Cyber Blueprint Schematic',
    hinglishLabel: 'Cyber Blueprint Infographic',
    desc: 'Obsidian dark slate engineering schematic with glowing cyan completed circuits & amber milestone beacon.',
    accent: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300',
  },
  {
    id: 'isometric-mountain',
    label: 'Isometric 3D Mountain Ascent',
    hinglishLabel: '3D Mountain Expedition Path',
    desc: 'Diorama mountain trail with lit basecamps marking mastered phases up toward the AI summit.',
    accent: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  },
  {
    id: 'editorial-poster',
    label: 'Swiss Editorial Wall Poster',
    hinglishLabel: 'Minimalist Career Poster',
    desc: 'High-contrast Bauhaus architectural grid poster built for LinkedIn banners or desktop framing.',
    accent: 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  },
  {
    id: 'neural-constellation',
    label: 'Cosmic Neural Constellation',
    hinglishLabel: 'Deep Space Neural Constellation',
    desc: 'Star-map where mastered AI domains shine as bright connected constellations against future nebulae.',
    accent: 'border-indigo-500/40 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300',
  },
];

export const ImageStudioView: React.FC<ImageStudioViewProps> = ({
  language,
  completedConcepts = [],
  completedDays = [],
  pace = '20-months',
  streakState,
}) => {
  const [activeMode, setActiveMode] = useState<'roadmap-visual' | 'image-create' | 'video-animate'>(
    'roadmap-visual'
  );

  // Compute live 20-Month Progress Snapshot
  const progressSnapshot = useMemo(() => {
    const completedSet = new Set(completedConcepts);
    const totalConceptsCount = ROADMAP_PHASES.reduce((acc, p) => acc + p.concepts.length, 0);
    const completedCount = ROADMAP_PHASES.reduce(
      (acc, p) => acc + p.concepts.filter((c) => completedSet.has(c.id)).length,
      0
    );
    const completionPct =
      totalConceptsCount > 0 ? Math.round((completedCount / totalConceptsCount) * 100) : 0;

    const phaseBreakdown = ROADMAP_PHASES.map((phase) => {
      const done = phase.concepts.filter((c) => completedSet.has(c.id)).length;
      const total = phase.concepts.length;
      const pct = total > 0 ? Math.round((done / total) * 100) : 0;
      return {
        id: phase.id,
        phaseNumber: phase.phaseNumber,
        title: phase.title,
        done,
        total,
        pct,
        status: done === total ? ('completed' as const) : done > 0 ? ('active' as const) : ('upcoming' as const),
      };
    });

    const completedPhases = phaseBreakdown
      .filter((p) => p.status === 'completed')
      .map((p) => `Phase ${p.phaseNumber}: ${p.title}`);

    const activePhaseObj =
      phaseBreakdown.find((p) => p.status === 'active') ||
      phaseBreakdown.find((p) => p.status === 'upcoming') ||
      phaseBreakdown[phaseBreakdown.length - 1];

    const upcomingPhases = phaseBreakdown
      .filter((p) => p.phaseNumber > activePhaseObj.phaseNumber)
      .map((p) => `Phase ${p.phaseNumber}: ${p.title}`);

    // Estimate 20-Month position from concepts & completed days
    const daysMonthEstimate = Math.ceil(Math.max(1, completedDays.length) / 30);
    const conceptMonthEstimate = Math.max(1, Math.round((completionPct / 100) * 20) || 1);
    const currentMonth = Math.max(1, Math.min(20, Math.max(conceptMonthEstimate, daysMonthEstimate)));
    const milestone =
      TWENTY_MONTH_MASTER_PLAN.find((m) => m.monthNumber === currentMonth) ||
      TWENTY_MONTH_MASTER_PLAN[0];

    return {
      totalConceptsCount,
      completedCount,
      completionPct,
      completedDaysCount: completedDays.length,
      currentStreak: streakState?.currentStreak ?? 0,
      currentMonth,
      milestone,
      phaseBreakdown,
      completedPhases,
      activePhaseObj,
      upcomingPhases,
    };
  }, [completedConcepts, completedDays, streakState]);

  // Roadmap Visual Studio States
  const [roadmapStyle, setRoadmapStyle] = useState<RoadmapStyleTheme>('neon-blueprint');
  const [roadmapAspectRatio, setRoadmapAspectRatio] = useState<string>('16:9');
  const [customHighlight, setCustomHighlight] = useState<string>('');
  const [showPromptEditor, setShowPromptEditor] = useState<boolean>(false);
  const [customPromptOverride, setCustomPromptOverride] = useState<string>('');
  const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState<boolean>(false);
  const [roadmapErrorMsg, setRoadmapErrorMsg] = useState<string | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState<boolean>(false);

  // Image Generation States
  const [prompt, setPrompt] = useState<string>('');
  const [aspectRatio, setAspectRatio] = useState<string>('16:9');
  const [inputImage, setInputImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Video Animation States (gemini-omni-1.2-flash via Interactions API)
  const [videoPrompt, setVideoPrompt] = useState<string>(
    'Smooth cinematic camera pan across neural tensor nodes with atmospheric volumetric lighting'
  );
  const [videoAspectRatio, setVideoAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [videoSourceImage, setVideoSourceImage] = useState<string | null>(null);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState<boolean>(false);
  const [videoErrorMsg, setVideoErrorMsg] = useState<string | null>(null);

  // Gallery of generated images
  const [gallery, setGallery] = useState<GeneratedImageItem[]>(() => {
    try {
      const saved = localStorage.getItem('neuroforge_image_gallery');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeImage, setActiveImage] = useState<GeneratedImageItem | null>(() => {
    try {
      const saved = localStorage.getItem('neuroforge_image_gallery');
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : null;
    } catch {
      return null;
    }
  });

  const saveToGallery = (item: GeneratedImageItem) => {
    setGallery((prev) => {
      const updated = [item, ...prev].slice(0, 24);
      try {
        localStorage.setItem('neuroforge_image_gallery', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    setActiveImage(item);
    if (!videoSourceImage) {
      setVideoSourceImage(item.imageUrl);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'edit' | 'video') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const res = reader.result as string;
        if (target === 'edit') {
          setInputImage(res);
        } else {
          setVideoSourceImage(res);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateRoadmapVisual = async () => {
    if (isGeneratingRoadmap) return;
    setIsGeneratingRoadmap(true);
    setRoadmapErrorMsg(null);

    try {
      const res = await fetch('/api/generate-roadmap-visual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          completedConceptsCount: progressSnapshot.completedCount,
          totalConceptsCount: progressSnapshot.totalConceptsCount,
          completedDaysCount: progressSnapshot.completedDaysCount,
          currentStreak: progressSnapshot.currentStreak,
          pace,
          currentMonth: progressSnapshot.currentMonth,
          currentMonthTitle: progressSnapshot.milestone.title,
          completedPhases: progressSnapshot.completedPhases,
          activePhase: `Phase ${progressSnapshot.activePhaseObj.phaseNumber}: ${progressSnapshot.activePhaseObj.title}`,
          upcomingPhases: progressSnapshot.upcomingPhases,
          styleTheme: roadmapStyle,
          aspectRatio: roadmapAspectRatio,
          customHighlight: customHighlight.trim(),
          customPromptOverride: showPromptEditor ? customPromptOverride.trim() : '',
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Server responded with ${res.status}`);
      }

      const data = await res.json();
      const newItem: GeneratedImageItem = {
        id: `roadmap-${Date.now()}`,
        prompt: data.prompt,
        imageUrl: data.imageUrl,
        aspectRatio: data.aspectRatio || roadmapAspectRatio,
        modelUsed: data.modelUsed || 'gemini-3.1-flash-lite-image',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        tag: `Month ${progressSnapshot.currentMonth}/20 · ${progressSnapshot.completionPct}%`,
      };

      saveToGallery(newItem);
    } catch (err: any) {
      console.error('Roadmap Visual Error:', err);
      setRoadmapErrorMsg(err.message || 'Failed to generate personalized 20-month roadmap graphic.');
    } finally {
      setIsGeneratingRoadmap(false);
    }
  };

  const handleGenerate = async (presetPrompt?: string) => {
    const targetPrompt = (presetPrompt || prompt).trim();
    if (!targetPrompt || isGenerating) return;

    setIsGenerating(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: targetPrompt,
          inputImage: inputImage || undefined,
          aspectRatio,
          model: 'gemini-3.1-flash-lite-image',
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Server responded with ${res.status}`);
      }

      const data = await res.json();
      const newItem: GeneratedImageItem = {
        id: `img-${Date.now()}`,
        prompt: targetPrompt,
        imageUrl: data.imageUrl,
        aspectRatio,
        modelUsed: data.modelUsed,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      saveToGallery(newItem);
    } catch (err: any) {
      console.error('Image Generation Error:', err);
      setErrorMsg(err.message || 'Failed to generate image. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnimateVideo = async () => {
    const img = videoSourceImage || activeImage?.imageUrl;
    if (!img) {
      setVideoErrorMsg('Please upload or select an image to animate into video.');
      return;
    }

    setIsGeneratingVideo(true);
    setVideoErrorMsg(null);

    try {
      const res = await fetch('/api/animate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: img,
          prompt: videoPrompt,
          aspectRatio: videoAspectRatio,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Video synthesis failed with status ${res.status}`);
      }

      const data = await res.json();
      setGeneratedVideoUrl(data.videoUrl);
    } catch (err: any) {
      console.error('Video animation error:', err);
      setVideoErrorMsg(err.message || 'Failed to animate video using gemini-omni-1.2-flash.');
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  const handleDownload = (mediaUrl: string, filename: string, ext = 'png') => {
    const link = document.createElement('a');
    link.href = mediaUrl;
    link.download = `${filename}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyPrompt = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 1800);
    });
  };

  const imagePresets = [
    {
      title: 'Transformer Architecture Diagram',
      desc: 'Technical 3D exploded diagram of Transformer Attention blocks',
      prompt:
        'Detailed blueprint architectural diagram of a Multi-Head Self-Attention Transformer model, glowing cyan and amber data tensor flow, clean modern schematic UI, dark background, vector technical aesthetic',
    },
    {
      title: 'Autonomous Multi-Agent Swarm',
      desc: 'Hierarchical orchestrator and MCP tool-calling pipeline',
      prompt:
        'Clean visual infographic of an Autonomous Multi-Agent Swarm cluster with Model Context Protocol (MCP) bus, central planner node, execution agents, and vector memory store, high tech clean diagram',
    },
    {
      title: 'Hybrid GraphRAG Pipeline',
      desc: 'Knowledge graph entity triplets merged with vector space',
      prompt:
        'Scientific concept visualization showing Knowledge Graph triplets interconnected with 3D dense vector embeddings, hybrid retrieval fusion node, sleek futuristic cybersecurity analytics dashboard',
    },
    {
      title: 'Quantized Edge SLM on Chip',
      desc: '4-bit low power NPU neural silicon accelerator',
      prompt:
        'Microchip silicon wafer with glowing neural network synapses representing 4-bit quantized Small Language Model (SLM) executing on an on-device NPU, macro photography style, deep neon blue lighting',
    },
  ];

  const videoMotionPresets = [
    {
      title: 'Cinematic Dolly Zoom',
      prompt:
        'Cinematic forward dolly zoom gliding smoothly into the center attention core with subtle particles drifting',
    },
    {
      title: 'Pulsing Data Flow',
      prompt:
        'Dynamic glowing data packets and electrical synapses pulsating continuously along the network connections',
    },
    {
      title: 'Slow Orbit Sweep',
      prompt:
        'Slow dramatic rotational orbit around the architecture diagram with shifting volumetric studio spotlights',
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="relative p-6 sm:p-8 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 text-white border border-slate-800 shadow-xl overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-indigo-400">
              <ImageIcon className="w-4 h-4 text-amber-400" />
              <span>TENSORPLAY IMAGE STUDIO</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono text-amber-400">
                Gemini Visual Roadmap · Diagram & Motion Synth
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
              {activeMode === 'roadmap-visual'
                ? '20-Month Progress Roadmap Visualizer'
                : 'Architecture Visualizer & Video Animator'}
            </h1>

            <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
              {language === 'hinglish'
                ? activeMode === 'roadmap-visual'
                  ? 'Apne live 20-month mastery progress (completed phases, current month aur streak) ke hisaab se Gemini se custom visual roadmap poster generate karein.'
                  : 'Text prompt se AI architectures create/edit karein aur kisi bhi image ko video mein animate karein.'
                : activeMode === 'roadmap-visual'
                ? 'Transform your live 20-month AI mastery telemetry—completed phases, active milestone, and streak—into a custom Gemini visual roadmap poster.'
                : 'Create and edit AI architecture diagrams with Gemini image synthesis, or animate visuals into motion video.'}
            </p>
          </div>

          {/* Mode Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-800/90 rounded-xl border border-slate-700/80 shrink-0">
            <button
              onClick={() => setActiveMode('roadmap-visual')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeMode === 'roadmap-visual'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Map className="w-3.5 h-3.5" />
              <span>20-Month Roadmap</span>
            </button>
            <button
              onClick={() => setActiveMode('image-create')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeMode === 'image-create'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>Create & Edit Image</span>
            </button>
            <button
              onClick={() => setActiveMode('video-animate')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeMode === 'video-animate'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>Animate into Video</span>
            </button>
          </div>
        </div>
      </div>

      {/* MODE 0: Personalized 20-Month Progress Roadmap Graphic */}
      {activeMode === 'roadmap-visual' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Progress Telemetry + Visual Controls (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Live Progress Snapshot Card */}
            <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Compass className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Live 20-Month Progress Input</span>
                </h2>
                <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {progressSnapshot.completionPct}% Mastered
                </span>
              </div>

              {/* Telemetry Metrics Grid */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/70">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Plan Month
                  </div>
                  <div className="text-base font-extrabold text-slate-900 dark:text-white font-mono">
                    {progressSnapshot.currentMonth}
                    <span className="text-xs text-slate-400 font-normal">/20</span>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/70">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Concepts
                  </div>
                  <div className="text-base font-extrabold text-slate-900 dark:text-white font-mono">
                    {progressSnapshot.completedCount}
                    <span className="text-xs text-slate-400 font-normal">
                      /{progressSnapshot.totalConceptsCount}
                    </span>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/70">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Streak / Days
                  </div>
                  <div className="text-base font-extrabold text-amber-600 dark:text-amber-400 font-mono flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 shrink-0" />
                    <span>{progressSnapshot.currentStreak}d</span>
                    <span className="text-[11px] text-slate-400 font-normal">
                      ({progressSnapshot.completedDaysCount})
                    </span>
                  </div>
                </div>
              </div>

              {/* Current Active Milestone Strip */}
              <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 space-y-1">
                <div className="flex items-center justify-between text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                  <span>ACTIVE TARGET · MONTH {progressSnapshot.currentMonth}</span>
                  <span>Phase {progressSnapshot.activePhaseObj.phaseNumber}</span>
                </div>
                <div className="text-xs font-semibold text-slate-900 dark:text-white">
                  {language === 'hinglish'
                    ? progressSnapshot.milestone.hinglishTitle
                    : progressSnapshot.milestone.title}
                </div>
              </div>

              {/* Compact 9-Phase Progress Strip */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  <span>Phase Checkpoints Encoded</span>
                  <span>{progressSnapshot.completedPhases.length} of 9 Complete</span>
                </div>
                <div className="grid grid-cols-9 gap-1">
                  {progressSnapshot.phaseBreakdown.map((p) => (
                    <div
                      key={p.id}
                      title={`Phase ${p.phaseNumber}: ${p.title} (${p.done}/${p.total})`}
                      className={`h-2 rounded-sm transition-colors ${
                        p.status === 'completed'
                          ? 'bg-emerald-500'
                          : p.status === 'active'
                          ? 'bg-amber-400'
                          : 'bg-slate-200 dark:bg-slate-800'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Style & Aspect Controls */}
            <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                <span>Artwork Aesthetic & Format</span>
              </h2>

              {/* Aesthetic Selector */}
              <div className="space-y-2">
                {ROADMAP_STYLE_THEMES.map((theme) => {
                  const selected = roadmapStyle === theme.id;
                  return (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => setRoadmapStyle(theme.id)}
                      className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                        selected
                          ? `${theme.accent} ring-1 ring-current`
                          : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/70 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {language === 'hinglish' ? theme.hinglishLabel : theme.label}
                        </span>
                        {selected && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                        {theme.desc}
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Aspect Ratio Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Canvas Aspect Ratio:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { ratio: '16:9', hint: 'Desktop' },
                    { ratio: '3:4', hint: 'Poster' },
                    { ratio: '1:1', hint: 'Square' },
                    { ratio: '9:16', hint: 'Mobile' },
                  ].map((item) => (
                    <button
                      key={item.ratio}
                      type="button"
                      onClick={() => setRoadmapAspectRatio(item.ratio)}
                      className={`py-1.5 px-1 text-center rounded-lg border transition-colors cursor-pointer ${
                        roadmapAspectRatio === item.ratio
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <div className="text-xs font-mono font-bold">{item.ratio}</div>
                      <div className="text-[9px] opacity-80">{item.hint}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional Personal Goal Highlight */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Personal Milestone / Target Role (Optional):
                </label>
                <input
                  type="text"
                  value={customHighlight}
                  onChange={(e) => setCustomHighlight(e.target.value)}
                  maxLength={120}
                  placeholder="e.g., Shipped GraphRAG Pipeline · Target Staff AI Engineer"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                />
              </div>

              {/* Custom Prompt Override Toggle */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowPromptEditor((prev) => !prev)}
                  className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>{showPromptEditor ? 'Hide custom prompt override' : 'Customize Gemini prompt manually'}</span>
                </button>
                {showPromptEditor && (
                  <textarea
                    value={customPromptOverride}
                    onChange={(e) => setCustomPromptOverride(e.target.value)}
                    rows={3}
                    placeholder="Optional: Write a full custom visual directive to override the auto-synthesized roadmap prompt..."
                    className="mt-2 w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white resize-none"
                  />
                )}
              </div>

              {roadmapErrorMsg && (
                <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-600 dark:text-rose-400">
                  {roadmapErrorMsg}
                </div>
              )}

              <button
                onClick={handleGenerateRoadmapVisual}
                disabled={isGeneratingRoadmap}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
              >
                {isGeneratingRoadmap ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Rendering Your 20-Month Roadmap with Gemini...</span>
                  </>
                ) : (
                  <>
                    <Map className="w-4 h-4 text-amber-200" />
                    <span>Generate My Progress Roadmap Graphic</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column: Display Stage & Gallery (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    {activeImage ? 'Generated Roadmap Visual' : 'Roadmap Canvas'}
                  </span>
                  {activeImage?.tag && (
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      {activeImage.tag}
                    </span>
                  )}
                </div>

                {activeImage && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopyPrompt(activeImage.prompt)}
                      className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                    >
                      {copiedPrompt ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>{copiedPrompt ? 'Copied' : 'Prompt'}</span>
                    </button>
                    <button
                      onClick={() => {
                        setVideoSourceImage(activeImage.imageUrl);
                        setActiveMode('video-animate');
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Animate</span>
                    </button>
                    <button
                      onClick={() =>
                        handleDownload(
                          activeImage.imageUrl,
                          `tensorplay-20mo-roadmap-m${progressSnapshot.currentMonth}`
                        )
                      }
                      className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download PNG</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center min-h-[380px] sm:min-h-[450px]">
                {isGeneratingRoadmap ? (
                  <div className="text-center space-y-3 p-6">
                    <Loader2 className="w-10 h-10 animate-spin text-emerald-400 mx-auto" />
                    <p className="text-sm font-semibold text-white">
                      Illustrating Month {progressSnapshot.currentMonth}/20 ·{' '}
                      {progressSnapshot.completionPct}% Progress...
                    </p>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Gemini is weaving your mastered AI phases, active focus beacon, and future milestones into a bespoke visual artifact.
                    </p>
                  </div>
                ) : activeImage ? (
                  <div className="relative group w-full h-full flex items-center justify-center">
                    <img
                      src={activeImage.imageUrl}
                      alt={activeImage.prompt}
                      className="max-h-[500px] w-full object-contain rounded-lg"
                    />
                    <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-slate-950 via-slate-950/85 to-transparent text-white text-xs space-y-1">
                      <p className="font-medium line-clamp-2">{activeImage.prompt}</p>
                      <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono">
                        <span>Model: {activeImage.modelUsed}</span>
                        <span>Ratio: {activeImage.aspectRatio}</span>
                        <span>{activeImage.timestamp}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-2.5 p-8 text-slate-400 max-w-sm">
                    <Map className="w-12 h-12 text-emerald-500/60 mx-auto mb-1" />
                    <p className="text-sm font-semibold text-slate-200">
                      Ready to Visualize Your 20-Month Journey
                    </p>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Pick a visual theme on the left and click{' '}
                      <span className="text-emerald-400 font-semibold">
                        Generate My Progress Roadmap Graphic
                      </span>{' '}
                      to render an infographic reflecting your exact concept mastery ({progressSnapshot.completedCount}/
                      {progressSnapshot.totalConceptsCount} concepts).
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Session Gallery */}
            {gallery.length > 0 && (
              <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <span className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Visual Archive ({gallery.length})
                </span>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                  {gallery.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveImage(item)}
                      className={`relative rounded-xl overflow-hidden border aspect-video bg-slate-950 group cursor-pointer transition-all ${
                        activeImage?.id === item.id
                          ? 'ring-2 ring-emerald-500 border-emerald-500'
                          : 'border-slate-200 dark:border-slate-800 hover:opacity-90'
                      }`}
                    >
                      <img src={item.imageUrl} alt={item.prompt} className="w-full h-full object-cover" />
                      {item.tag && (
                        <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-slate-950/80 text-[9px] font-mono text-emerald-300">
                          {item.tag}
                        </span>
                      )}
                      <div className="absolute inset-0 bg-slate-900/65 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-1 text-center">
                        <span className="text-[10px] text-white font-medium line-clamp-2">
                          {item.prompt}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODE 1: Create & Edit Images */}
      {activeMode === 'image-create' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Prompt Input & Controls (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Prompt & Specifications</span>
              </h2>

              {/* Prompt Textarea */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Text Prompt / Edit Instructions:
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={4}
                  placeholder="Describe the neural network, flowchart, or AI diagram you want to generate or edit..."
                  className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white resize-none"
                />
              </div>

              {/* Aspect Ratio Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Aspect Ratio:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {['16:9', '1:1', '4:3', '9:16'].map((ratio) => (
                    <button
                      key={ratio}
                      type="button"
                      onClick={() => setAspectRatio(ratio)}
                      className={`py-1.5 text-xs font-mono font-semibold rounded-lg border transition-colors cursor-pointer ${
                        aspectRatio === ratio
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional Input Image for Image Editing */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5 text-slate-400" />
                    <span>Image Editing (Optional Base Image):</span>
                  </label>
                  {inputImage && (
                    <button
                      onClick={() => setInputImage(null)}
                      className="text-[11px] text-rose-500 hover:underline cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>

                {inputImage ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 h-28 bg-slate-950 flex items-center justify-center">
                    <img src={inputImage} alt="Base input" className="h-full object-contain" />
                    <span className="absolute bottom-1 right-2 px-2 py-0.5 rounded bg-slate-900/80 text-[10px] text-slate-200">
                      Base Image Attached
                    </span>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 rounded-xl p-3 cursor-pointer transition-colors bg-slate-50 dark:bg-slate-800/40">
                    <FileImage className="w-5 h-5 text-slate-400 mb-1" />
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      Upload diagram to edit or refine
                    </span>
                    <span className="text-[10px] text-slate-400">PNG, JPG up to 10MB</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'edit')}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {errorMsg && (
                <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-600 dark:text-rose-400">
                  {errorMsg}
                </div>
              )}

              <button
                onClick={() => handleGenerate()}
                disabled={!prompt.trim() || isGenerating}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Synthesizing Image with Gemini...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>{inputImage ? 'Edit & Transform Image' : 'Generate AI Visual'}</span>
                  </>
                )}
              </button>
            </div>

            {/* Presets Card */}
            <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5">
              <span className="text-[10px] font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Instant AI Engineering Templates
              </span>
              <div className="space-y-2">
                {imagePresets.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setPrompt(item.prompt);
                      handleGenerate(item.prompt);
                    }}
                    disabled={isGenerating}
                    className="w-full text-left p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200 dark:border-slate-700/70 transition-all cursor-pointer group"
                  >
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                      {item.title}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {item.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Display Stage & Gallery (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  {activeImage ? 'Rendered Concept' : 'Preview Canvas'}
                </span>
                {activeImage && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setVideoSourceImage(activeImage.imageUrl);
                        setActiveMode('video-animate');
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer"
                      title="Send this image to video animation"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Animate to Video</span>
                    </button>
                    <button
                      onClick={() => handleDownload(activeImage.imageUrl, `ai-architecture-${Date.now()}`)}
                      className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center min-h-[380px] sm:min-h-[440px]">
                {isGenerating ? (
                  <div className="text-center space-y-3 p-6">
                    <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mx-auto" />
                    <p className="text-sm font-semibold text-white">
                      Generating diagram with Gemini...
                    </p>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Synthesizing neural layers, vector matrices, and visual schematics.
                    </p>
                  </div>
                ) : activeImage ? (
                  <div className="relative group w-full h-full flex items-center justify-center">
                    <img
                      src={activeImage.imageUrl}
                      alt={activeImage.prompt}
                      className="max-h-[500px] w-full object-contain rounded-lg"
                    />
                    <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent text-white text-xs space-y-1">
                      <p className="font-medium line-clamp-2">{activeImage.prompt}</p>
                      <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono">
                        <span>Model: {activeImage.modelUsed}</span>
                        <span>Ratio: {activeImage.aspectRatio}</span>
                        <span>{activeImage.timestamp}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-2 p-8 text-slate-400">
                    <ImageIcon className="w-12 h-12 text-slate-600 mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-medium text-slate-300">No Image Rendered Yet</p>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto">
                      Type a prompt on the left or select an AI Engineering template to generate an architecture visual.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Gallery */}
            {gallery.length > 0 && (
              <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <span className="text-[10px] font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Session Gallery ({gallery.length} Images)
                </span>

                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                  {gallery.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveImage(item)}
                      className={`relative rounded-xl overflow-hidden border aspect-video bg-slate-950 group cursor-pointer transition-all ${
                        activeImage?.id === item.id
                          ? 'ring-2 ring-indigo-500 border-indigo-500'
                          : 'border-slate-200 dark:border-slate-800 hover:opacity-90'
                      }`}
                    >
                      <img src={item.imageUrl} alt={item.prompt} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-1 text-center">
                        <span className="text-[10px] text-white font-medium line-clamp-2">
                          {item.prompt}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODE 2: Animate Image into Video (gemini-omni-1.2-flash via Interactions API) */}
      {activeMode === 'video-animate' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Video Controls (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Film className="w-4 h-4 text-rose-500" />
                  <span>Image-to-Video Animation</span>
                </h2>
                <span className="font-mono text-[10px] text-rose-500 px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800">
                  gemini-omni-1.2-flash
                </span>
              </div>

              {/* Source Image Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Starting Frame Photo:
                </label>
                {videoSourceImage ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 h-36 bg-slate-950 flex items-center justify-center">
                    <img src={videoSourceImage} alt="Video source" className="h-full object-contain" />
                    <button
                      onClick={() => setVideoSourceImage(null)}
                      className="absolute top-2 right-2 px-2 py-1 rounded-md bg-slate-900/80 text-rose-400 text-xs font-semibold hover:bg-slate-900 cursor-pointer"
                    >
                      Change Photo
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-rose-300 dark:border-rose-800/60 hover:border-rose-500 rounded-xl p-5 cursor-pointer transition-colors bg-rose-50/50 dark:bg-rose-950/20">
                    <Camera className="w-6 h-6 text-rose-400 mb-1" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Upload photo to animate into video
                    </span>
                    <span className="text-[10px] text-slate-400">Or pick an image from the gallery</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'video')}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Video Aspect Ratio Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Video Aspect Ratio:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setVideoAspectRatio('16:9')}
                    className={`py-2 text-xs font-mono font-semibold rounded-lg border transition-colors cursor-pointer ${
                      videoAspectRatio === '16:9'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    16:9 (Landscape)
                  </button>
                  <button
                    type="button"
                    onClick={() => setVideoAspectRatio('9:16')}
                    className={`py-2 text-xs font-mono font-semibold rounded-lg border transition-colors cursor-pointer ${
                      videoAspectRatio === '9:16'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    9:16 (Portrait)
                  </button>
                </div>
              </div>

              {/* Motion Prompt */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Motion Prompt / Camera Directives:
                </label>
                <textarea
                  value={videoPrompt}
                  onChange={(e) => setVideoPrompt(e.target.value)}
                  rows={3}
                  placeholder="Describe camera motion, drifting particles, or animated transitions..."
                  className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-900 dark:text-white resize-none"
                />
              </div>

              {videoErrorMsg && (
                <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-600 dark:text-rose-400">
                  {videoErrorMsg}
                </div>
              )}

              <button
                onClick={handleAnimateVideo}
                disabled={!videoSourceImage || isGeneratingVideo}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-rose-500/20 transition-all cursor-pointer"
              >
                {isGeneratingVideo ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Rendering Video with gemini-omni-1.2-flash...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>Generate Motion Video</span>
                  </>
                )}
              </button>
            </div>

            {/* Motion Presets */}
            <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5">
              <span className="text-[10px] font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Motion Presets
              </span>
              <div className="space-y-2">
                {videoMotionPresets.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => setVideoPrompt(preset.prompt)}
                    className="w-full text-left p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-700/70 transition-all cursor-pointer"
                  >
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {preset.title}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {preset.prompt}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Video Output Player (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Generated Video Playback
                </span>
                {generatedVideoUrl && (
                  <button
                    onClick={() => handleDownload(generatedVideoUrl, `ai-video-${Date.now()}`, 'mp4')}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download MP4</span>
                  </button>
                )}
              </div>

              <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center min-h-[380px] sm:min-h-[460px]">
                {isGeneratingVideo ? (
                  <div className="text-center space-y-3 p-6">
                    <Loader2 className="w-10 h-10 animate-spin text-rose-500 mx-auto" />
                    <p className="text-sm font-semibold text-white">
                      Synthesizing video with gemini-omni-1.2-flash...
                    </p>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Processing temporal consistency, neural motion interpolation, and {videoAspectRatio} frames via the Interactions API.
                    </p>
                  </div>
                ) : generatedVideoUrl ? (
                  <video
                    src={generatedVideoUrl}
                    controls
                    autoPlay
                    loop
                    className={`max-h-[500px] w-full rounded-lg ${
                      videoAspectRatio === '9:16' ? 'max-w-[280px] object-cover' : 'object-contain'
                    }`}
                  />
                ) : (
                  <div className="text-center space-y-2 p-8 text-slate-400">
                    <Film className="w-12 h-12 text-slate-600 mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-medium text-slate-300">No Video Generated Yet</p>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto">
                      Upload a starting photo on the left, choose your aspect ratio ({videoAspectRatio}), and click "Generate Motion Video".
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
