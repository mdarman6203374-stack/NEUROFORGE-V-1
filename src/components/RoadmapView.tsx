import React, { useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  ArrowLeft,
  Code2,
  Cpu,
  Brain,
  Search,
  BookOpen,
  ArrowUpRight,
  X,
  Filter,
  Layers,
  Sparkle,
  Download,
  HelpCircle
} from 'lucide-react';
import { ROADMAP_PHASES } from '../data/roadmapData';
import { ProjectDetails, Language, RoadmapPhase, ConceptItem } from '../types';
import { LearningProgressDashboard } from './LearningProgressDashboard';
import { ConceptQuickQuizModal } from './ConceptQuickQuizModal';
import { generateRoadmapPdf } from '../utils/pdfGenerator';
import confetti from 'canvas-confetti';

interface RoadmapViewProps {
  completedConcepts: string[];
  completedDays: number[];
  toggleConcept: (id: string) => void;
  onSelectProject: (proj: ProjectDetails) => void;
  language: Language;
  onOpenRagLab?: () => void;
}

const POPULAR_SEARCH_TAGS = [
  'Transformers',
  'LoRA',
  'GraphRAG',
  'PyTorch',
  'MCTS',
  'LangGraph',
  'Quantization',
  'CUDA',
  'Diffusion',
  'FastAPI'
];

export const RoadmapView: React.FC<RoadmapViewProps> = ({
  completedConcepts,
  completedDays,
  toggleConcept,
  onSelectProject,
  language,
  onOpenRagLab
}) => {
  const [selectedPhaseId, setSelectedPhaseId] = useState<string>('phase-0');
  const [selectedConceptId, setSelectedConceptId] = useState<string>(
    ROADMAP_PHASES[0]?.concepts[0]?.id || 'p0-1'
  );
  const [quizModalConceptId, setQuizModalConceptId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllPhaseConcepts, setShowAllPhaseConcepts] = useState(false);
  const [searchViewMode, setSearchViewMode] = useState<'phase' | 'all'>('phase');
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [pdfDownloaded, setPdfDownloaded] = useState(false);

  const handleDownloadPdf = async () => {
    try {
      setIsDownloadingPdf(true);
      await new Promise((resolve) => setTimeout(resolve, 150));
      generateRoadmapPdf({
        pace: '20-months',
        completedConcepts,
        completedDays,
        language
      });
      setPdfDownloaded(true);
      setTimeout(() => setPdfDownloaded(false), 3500);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // Total concepts count across roadmap
  const allConcepts = ROADMAP_PHASES.flatMap((p) => p.concepts);
  const totalConcepts = allConcepts.length;
  const completedCount = completedConcepts.length;
  const progressPercent = Math.round((completedCount / (totalConcepts || 1)) * 100);

  const queryLower = searchQuery.trim().toLowerCase();

  // Helper function to check if a concept item matches the search query
  const conceptMatchesQuery = (c: ConceptItem) => {
    if (!queryLower) return true;
    return (
      c.title.toLowerCase().includes(queryLower) ||
      c.description.toLowerCase().includes(queryLower) ||
      Boolean(c.hinglishDesc && c.hinglishDesc.toLowerCase().includes(queryLower)) ||
      c.difficulty.toLowerCase().includes(queryLower)
    );
  };

  // Helper to check if a phase matches query
  const phaseMatchesQuery = (p: RoadmapPhase) => {
    if (!queryLower) return true;
    const inTitle =
      p.title.toLowerCase().includes(queryLower) ||
      p.hinglishTitle.toLowerCase().includes(queryLower) ||
      p.subtitle.toLowerCase().includes(queryLower) ||
      p.overview.toLowerCase().includes(queryLower) ||
      p.hinglishOverview.toLowerCase().includes(queryLower);

    const inConcepts = p.concepts.some(conceptMatchesQuery);

    const inProjects =
      p.standardProject.title.toLowerCase().includes(queryLower) ||
      p.standardProject.tagline.toLowerCase().includes(queryLower) ||
      p.standardProject.techStack.some((t) => t.toLowerCase().includes(queryLower)) ||
      p.visionaryProject.title.toLowerCase().includes(queryLower) ||
      p.visionaryProject.tagline.toLowerCase().includes(queryLower) ||
      p.visionaryProject.techStack.some((t) => t.toLowerCase().includes(queryLower)) ||
      p.visionaryProject.noveltyFactor.toLowerCase().includes(queryLower);

    const inResources = p.hindiResources.some(
      (r) =>
        r.tags.some((t) => t.toLowerCase().includes(queryLower)) ||
        r.playlistTitle.toLowerCase().includes(queryLower) ||
        r.channelName.toLowerCase().includes(queryLower)
    );

    return inTitle || inConcepts || inProjects || inResources;
  };

  // Filtered phases based on search query
  const filteredPhases = queryLower ? ROADMAP_PHASES.filter(phaseMatchesQuery) : ROADMAP_PHASES;

  // Selected phase: either selectedPhaseId if in filteredPhases, or the first filtered phase
  const selectedPhase =
    filteredPhases.find((p) => p.id === selectedPhaseId) ||
    filteredPhases[0] ||
    ROADMAP_PHASES[0];

  // All matching concepts across entire roadmap
  const allMatchingConcepts = queryLower
    ? ROADMAP_PHASES.flatMap((p) =>
        p.concepts.filter(conceptMatchesQuery).map((c) => ({
          ...c,
          phaseId: p.id,
          phaseNumber: p.phaseNumber,
          phaseTitle: p.title
        }))
      )
    : [];

  const currentPhaseIndex = ROADMAP_PHASES.findIndex((p) => p.id === selectedPhase?.id);
  const prevPhase = currentPhaseIndex > 0 ? ROADMAP_PHASES[currentPhaseIndex - 1] : null;
  const nextPhase = currentPhaseIndex < ROADMAP_PHASES.length - 1 ? ROADMAP_PHASES[currentPhaseIndex + 1] : null;

  const handleSelectPhase = (phaseId: string) => {
    setSelectedPhaseId(phaseId);
    const targetPhase = ROADMAP_PHASES.find((p) => p.id === phaseId);
    if (targetPhase && targetPhase.concepts.length > 0) {
      setSelectedConceptId(targetPhase.concepts[0].id);
    }
    setShowAllPhaseConcepts(false);
    const element = document.getElementById('phase-detail-card');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const activeSelectedConcept =
    allConcepts.find((c) => c.id === selectedConceptId) ||
    selectedPhase.concepts[0] ||
    allConcepts[0];

  const quizModalConcept =
    allConcepts.find((c) => c.id === quizModalConceptId) || activeSelectedConcept;

  const handleOpenQuickQuiz = (targetConceptId: string) => {
    setSelectedConceptId(targetConceptId);
    setQuizModalConceptId(targetConceptId);
  };

  const handleToggle = (id: string) => {
    toggleConcept(id);
    if (!completedConcepts.includes(id)) {
      confetti({
        particleCount: 25,
        spread: 45,
        origin: { y: 0.8 }
      });
    }
  };

  // Text highlighting utility
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return <>{text}</>;
    const escaped = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    const parts = text.split(regex);
    return (
      <>
        {parts.map((part, index) =>
          regex.test(part) ? (
            <mark
              key={index}
              className="bg-amber-200 dark:bg-amber-900/60 text-slate-900 dark:text-amber-100 px-0.5 rounded font-semibold"
            >
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  return (
    <div className="space-y-8">
      {/* Hero Banner with Metric Bar & PDF Download */}
      <div className="relative p-6 sm:p-8 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 text-white border border-slate-800 shadow-xl overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="max-w-3xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>AI ENGINEERING MASTERY CURRICULUM</span>
              <span aria-hidden="true">·</span>
              <span>PHASE 0 TO PHASE 8</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white text-balance">
              {language === 'hinglish'
                ? 'Complete AI Engineering Mastery Roadmap'
                : 'End-to-End AI Engineering Roadmap'}
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              {language === 'hinglish'
                ? 'Math ke pehle principle se lekar 2027 ke Reasoning Models aur Multi-Agent Swarms tak. Har phase mein handpicked Hindi YouTube playlists aur do projects hain: ek resume ke liye aur ek futuristic project jo kisi ne nahi banaya.'
                : 'From core mathematical principles to 2027 Reasoning Models and Autonomous Agent Swarms. Every phase includes curated Hindi YouTube playlists, an industry resume project, and a visionary future project.'}
            </p>
          </div>

          {/* Quick PDF Export Action Card */}
          <div className="shrink-0 flex flex-col items-start lg:items-end gap-2 bg-slate-800/50 p-4 rounded-xl border border-slate-700/60 lg:min-w-[220px]">
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-indigo-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>A4 Multi-Page Document</span>
            </div>
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white shadow-lg transition-all cursor-pointer border border-indigo-400/30 whitespace-nowrap"
              title="Generate and download full multi-page PDF roadmap"
            >
              {isDownloadingPdf ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Generating PDF...</span>
                </>
              ) : pdfDownloaded ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>PDF Downloaded!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download Roadmap PDF</span>
                </>
              )}
            </button>
            <span className="text-[10px] text-slate-400 text-center lg:text-right w-full">
              Includes all 9 phases & projects
            </span>
          </div>
        </div>

        {/* Progress Tracker Strip */}
        <div className="pt-4 mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="text-xs font-medium text-slate-400">Overall Mastery:</div>
            <div className="w-36 sm:w-48 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400">{progressPercent}%</span>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span>
              <strong className="text-white font-mono">{completedCount}</strong> of{' '}
              <strong className="text-white font-mono">{totalConcepts}</strong> Concepts Mastered
            </span>
            <span aria-hidden="true">·</span>
            <span>
              <strong className="text-white font-mono">9</strong> Sequential Phases
            </span>
          </div>
        </div>
      </div>

      {/* Recharts Learning Progress Dashboard */}
      <LearningProgressDashboard
        completedConcepts={completedConcepts}
        completedDays={completedDays}
        language={language}
      />

      {/* Interactive Clickable Chronological Sequence Stepper Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
              Chronological Sequence Pathway
            </span>
            <span className="text-slate-400">· Click any stage to jump</span>
          </div>

          {/* Previous / Next Phase in Sequence Controls */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => prevPhase && handleSelectPhase(prevPhase.id)}
              disabled={!prevPhase}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors text-xs font-semibold"
              title="Previous phase in sequence"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Prev</span>
            </button>

            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-xs">
              Phase 0{selectedPhase.phaseNumber} of 08
            </span>

            <button
              onClick={() => nextPhase && handleSelectPhase(nextPhase.id)}
              disabled={!nextPhase}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors text-xs font-semibold"
              title="Next phase in sequence"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Horizontal interactive clickable stages */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 no-scrollbar">
          {ROADMAP_PHASES.map((phase, idx) => {
            const isSelected = phase.id === selectedPhase.id;
            const phaseConcepts = phase.concepts.map((c) => c.id);
            const isPhaseComplete =
              phaseConcepts.every((id) => completedConcepts.includes(id)) && phaseConcepts.length > 0;
            const shortTitles = [
              'Math Foundations',
              'PyTorch & CUDA',
              'Classical ML',
              'Deep Learning',
              'LLMs & LoRA',
              'Advanced RAG',
              'AI Agents',
              'LLMOps & Safety',
              'Future 2027+'
            ];

            return (
              <button
                key={phase.id}
                onClick={() => handleSelectPhase(phase.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm ring-2 ring-indigo-400/50 font-semibold'
                    : isPhaseComplete
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                    : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center font-mono text-[10px] font-bold ${
                    isSelected
                      ? 'bg-white text-indigo-700'
                      : isPhaseComplete
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {isPhaseComplete ? '✓' : `0${phase.phaseNumber}`}
                </span>
                <span>{shortTitles[idx] || phase.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search & Curriculum Filtering Bar */}
      <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3.5">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input with Clear Button */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500 dark:text-indigo-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowAllPhaseConcepts(false);
              }}
              placeholder="Search concepts & technologies (e.g. Transformers, LoRA, GraphRAG, PyTorch, MCTS, CUDA)..."
              className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setShowAllPhaseConcepts(false);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md cursor-pointer transition-colors"
                title="Clear search"
                aria-label="Clear search query"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Result Summary / Status Badge */}
          <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
            {queryLower ? (
              <div className="flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 rounded-xl px-3 py-1.5 text-xs font-medium text-indigo-700 dark:text-indigo-300">
                <span className="font-bold font-mono">{allMatchingConcepts.length}</span>
                <span>{allMatchingConcepts.length === 1 ? 'concept' : 'concepts'} in</span>
                <span className="font-bold font-mono">{filteredPhases.length}</span>
                <span>{filteredPhases.length === 1 ? 'phase' : 'phases'}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 px-1">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>33 Weeks · 9 Sequential Phases</span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Suggestion Technology Chips */}
        <div className="flex items-center gap-1.5 flex-wrap text-xs">
          <span className="text-slate-400 text-[11px] font-medium flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3 text-slate-400" />
            Popular:
          </span>
          {POPULAR_SEARCH_TAGS.map((tag) => {
            const isActive = searchQuery.toLowerCase() === tag.toLowerCase();
            return (
              <button
                key={tag}
                type="button"
                onClick={() => {
                  setSearchQuery(isActive ? '' : tag);
                  setShowAllPhaseConcepts(false);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-400/50'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>

        {/* If searching: Mode switcher button (Phase View vs Unified All Results View) */}
        {queryLower && allMatchingConcepts.length > 0 && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setSearchViewMode('phase')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  searchViewMode === 'phase'
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Phase-by-Phase View
              </button>
              <button
                type="button"
                onClick={() => setSearchViewMode('all')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  searchViewMode === 'all'
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>All {allMatchingConcepts.length} Matched Concepts (Unified)</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setShowAllPhaseConcepts(false);
              }}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              Reset Search
            </button>
          </div>
        )}
      </div>

      {/* Main Roadmap Content or Search Empty State */}
      {filteredPhases.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              No matching concepts or technologies found
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              We couldn&apos;t find any matches for &quot;<span className="text-slate-900 dark:text-white font-semibold">{searchQuery}</span>&quot;. Try searching for core AI topics like Transformers, LoRA, PyTorch, GraphRAG, MCTS, or CUDA.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setShowAllPhaseConcepts(false);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer"
          >
            <span>Clear Search & Show All Phases</span>
          </button>
        </div>
      ) : searchViewMode === 'all' && queryLower ? (
        /* Unified View of All Matching Concepts across all phases */
        <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Search className="w-5 h-5 text-indigo-500" />
                <span>All Matching Concepts for &quot;{searchQuery}&quot;</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {allMatchingConcepts.length} concepts matched across {filteredPhases.length} roadmap phases
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSearchViewMode('phase')}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              Switch to Phase-by-Phase View →
            </button>
          </div>

          <div className="space-y-2.5">
            {allMatchingConcepts.map((concept) => {
              const isDone = completedConcepts.includes(concept.id);
              return (
                <div
                  key={concept.id}
                  className={`p-4 rounded-xl border transition-all flex items-start gap-3.5 ${
                    isDone
                      ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/60 shadow-xs'
                      : 'bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleToggle(concept.id)}
                    aria-label="Toggle completed"
                    className="mt-0.5 shrink-0 text-slate-400 focus:outline-none cursor-pointer"
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600 hover:text-slate-400" />
                    )}
                  </button>

                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 px-2 py-0.5 rounded">
                          Phase 0{concept.phaseNumber}
                        </span>
                        <h4
                          className={`text-sm font-semibold ${
                            isDone
                              ? 'line-through text-slate-500 dark:text-slate-400'
                              : 'text-slate-900 dark:text-white'
                          }`}
                        >
                          {highlightText(concept.title, searchQuery)}
                        </h4>
                      </div>

                      <div className="flex items-center gap-2 text-[11px]">
                        <span
                          className={`font-mono font-medium px-2 py-0.5 rounded text-xs ${
                            concept.difficulty === 'Beginner'
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                              : concept.difficulty === 'Intermediate'
                              ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                              : 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                          }`}
                        >
                          {concept.difficulty}
                        </span>
                        <span className="text-slate-500 dark:text-slate-400 font-mono">
                          ~{concept.estHours}h
                        </span>
                        <button
                          type="button"
                          onClick={() => handleOpenQuickQuiz(concept.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg cursor-pointer transition-colors"
                        >
                          <HelpCircle className="w-3.5 h-3.5" />
                          <span>Quick Quiz</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            handleSelectPhase(concept.phaseId);
                            setSearchViewMode('phase');
                            setSelectedConceptId(concept.id);
                          }}
                          className="px-2 py-0.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 bg-indigo-50 dark:bg-indigo-950 rounded cursor-pointer transition-colors"
                        >
                          Jump to Phase →
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {highlightText(concept.description, searchQuery)}
                    </p>

                    {language === 'hinglish' && concept.hinglishDesc && (
                      <p className="text-xs text-indigo-700 dark:text-indigo-300 bg-indigo-50/50 dark:bg-indigo-950/30 p-2 rounded-lg border border-indigo-100 dark:border-indigo-900/50">
                        <span className="font-semibold">Hinglish Note: </span>
                        {highlightText(concept.hinglishDesc, searchQuery)}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Standard Phase-by-Phase Grid Layout with List Item Filtering */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Sequential Phase Selector Nav */}
          <div className="lg:col-span-4 space-y-2 lg:sticky lg:top-24">
            {/* Clickable Chronological Sequence Title Header */}
            <div className="flex items-center justify-between px-1 mb-2">
              <button
                onClick={() => {
                  setSearchQuery('');
                  handleSelectPhase('phase-0');
                }}
                className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer flex items-center gap-1.5"
                title="Click to view from Phase 0"
              >
                <span>Chronological Sequence</span>
                <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 lowercase">(0 to 8)</span>
              </button>

              <span className="text-[11px] font-mono text-slate-400">
                {filteredPhases.length} {filteredPhases.length === 1 ? 'Phase' : 'Phases'}
              </span>
            </div>

            <div className="space-y-1.5">
              {filteredPhases.map((phase) => {
                const isSelected = phase.id === selectedPhase.id;
                const phaseConcepts = phase.concepts.map((c) => c.id);
                const phaseDoneCount = phaseConcepts.filter((id) => completedConcepts.includes(id)).length;
                const isPhaseComplete = phaseDoneCount === phaseConcepts.length && phaseConcepts.length > 0;
                const matchingConceptCount = queryLower
                  ? phase.concepts.filter(conceptMatchesQuery).length
                  : 0;

                return (
                  <button
                    key={phase.id}
                    onClick={() => handleSelectPhase(phase.id)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                      isSelected
                        ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-400 dark:border-indigo-600 shadow-sm ring-1 ring-indigo-500/20'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 text-xs">
                        <span className={`font-mono font-bold ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}>
                          Phase 0{phase.phaseNumber}
                        </span>
                        <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
                        <span className="text-slate-500 dark:text-slate-400">~{phase.durationWeeks}w</span>
                        {queryLower && matchingConceptCount > 0 && (
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                            {matchingConceptCount} {matchingConceptCount === 1 ? 'match' : 'matches'}
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {highlightText(phase.title, searchQuery)}
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-1.5 pt-0.5">
                      {isPhaseComplete ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <span className="text-[11px] font-mono text-slate-400">
                          {phaseDoneCount}/{phaseConcepts.length}
                        </span>
                      )}
                      <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? 'text-indigo-600 dark:text-indigo-400 translate-x-0.5' : 'text-slate-400'}`} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Selected Phase Deep Dive with Filtered Concepts */}
          <div className="lg:col-span-8 space-y-6">
            {/* Phase Header Card */}
            <div id="phase-detail-card" className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    Phase 0{selectedPhase.phaseNumber} Roadmap
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                    {highlightText(
                      language === 'hinglish' ? selectedPhase.hinglishTitle : selectedPhase.title,
                      searchQuery
                    )}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {highlightText(selectedPhase.subtitle, searchQuery)}
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <Clock className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Estimated: ~{selectedPhase.durationWeeks} Weeks</span>
                </div>
              </div>

              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {highlightText(
                  language === 'hinglish' ? selectedPhase.hinglishOverview : selectedPhase.overview,
                  searchQuery
                )}
              </p>

              {/* Key Milestones */}
              <div className="space-y-2 pt-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Phase Milestones
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {selectedPhase.keyMilestones.map((m, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2"
                    >
                      <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold shrink-0">
                        ✓
                      </span>
                      <span className="leading-snug">{highlightText(m, searchQuery)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Interactive Prompt & RAG Lab Shortcut inside Phase 4–5 */}
            {onOpenRagLab && (selectedPhase.phaseNumber === 4 || selectedPhase.phaseNumber === 5) && (
              <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-600/10 via-purple-600/10 to-emerald-600/10 border border-indigo-300 dark:border-indigo-700/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Interactive Phase 4–5 Playground</span>
                  </div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">
                    {language === 'hinglish'
                      ? 'Prompt & RAG Lab: Live Chunk Size, Overlap aur Top-K Experiment Karein'
                      : 'Interactive Prompt & RAG Lab — Tweak Chunk Size, Overlap & Top-K Live'}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Inspect visually why vector retrieval succeeds or fails across sample AI docs and test grounded Gemini answers.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onOpenRagLab}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
                >
                  <span>Open RAG Lab</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Core Concepts Breakdown with Filtered Items & Checkboxes */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                    <Brain className="w-4 h-4 text-indigo-500" />
                    <span>Core Concepts & Competencies</span>
                  </h3>
                  {queryLower && (
                    <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300">
                      Filtering: &quot;{searchQuery}&quot;
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2.5 text-xs">
                  {queryLower && selectedPhase.concepts.some(conceptMatchesQuery) && (
                    <button
                      type="button"
                      onClick={() => setShowAllPhaseConcepts(!showAllPhaseConcepts)}
                      className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      {showAllPhaseConcepts
                        ? `Filter to matches (${selectedPhase.concepts.filter(conceptMatchesQuery).length})`
                        : `Show all (${selectedPhase.concepts.length}) concepts`}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleOpenQuickQuiz(activeSelectedConcept.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors cursor-pointer whitespace-nowrap"
                    title={`Generate 5 Gemini MCQs for ${activeSelectedConcept.title}`}
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Quick Quiz: {activeSelectedConcept.id.toUpperCase()}</span>
                  </button>
                </div>
              </div>

              {/* Concepts List Items */}
              {(() => {
                const phaseMatching = selectedPhase.concepts.filter(conceptMatchesQuery);
                const conceptsToRender =
                  queryLower && !showAllPhaseConcepts && phaseMatching.length > 0
                    ? phaseMatching
                    : selectedPhase.concepts;

                return (
                  <div className="space-y-2.5">
                    {queryLower && phaseMatching.length === 0 && (
                      <div className="p-3 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between">
                        <span>
                          No concept titles in Phase 0{selectedPhase.phaseNumber} matched &quot;{searchQuery}&quot; directly (matched via tech stack or phase overview). Showing all {selectedPhase.concepts.length} concepts below.
                        </span>
                      </div>
                    )}

                    {conceptsToRender.map((concept) => {
                      const isDone = completedConcepts.includes(concept.id);
                      const isConceptSelected = selectedConceptId === concept.id;
                      const isConceptMatch = queryLower && conceptMatchesQuery(concept);

                      return (
                        <div
                          key={concept.id}
                          onClick={() => setSelectedConceptId(concept.id)}
                          className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                            isConceptSelected
                              ? 'bg-indigo-50/40 dark:bg-indigo-950/30 border-indigo-400 dark:border-indigo-600 shadow-xs ring-1 ring-indigo-500/30'
                              : isDone
                              ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/60 shadow-xs'
                              : isConceptMatch
                              ? 'bg-white dark:bg-slate-900 border-indigo-300 dark:border-indigo-700/80 shadow-xs ring-1 ring-indigo-500/20'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggle(concept.id);
                            }}
                            aria-label="Toggle completed"
                            className="mt-0.5 shrink-0 text-slate-400 focus:outline-none cursor-pointer"
                          >
                            {isDone ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600 hover:text-slate-400" />
                            )}
                          </button>

                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <h4
                                className={`text-sm font-semibold ${
                                  isDone
                                    ? 'line-through text-slate-500 dark:text-slate-400'
                                    : 'text-slate-900 dark:text-white'
                                }`}
                              >
                                {highlightText(concept.title, searchQuery)}
                              </h4>
                              <div className="flex items-center gap-2 text-[11px] flex-wrap">
                                {isConceptMatch && (
                                  <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                                    Match
                                  </span>
                                )}
                                <span
                                  className={`font-mono font-medium px-2 py-0.5 rounded text-xs ${
                                    concept.difficulty === 'Beginner'
                                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                                      : concept.difficulty === 'Intermediate'
                                      ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                                      : 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                                  }`}
                                >
                                  {concept.difficulty}
                                </span>
                                <span className="text-slate-500 dark:text-slate-400 font-mono">
                                  ~{concept.estHours}h
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenQuickQuiz(concept.id);
                                  }}
                                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer ${
                                    isConceptSelected
                                      ? 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700'
                                      : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/60'
                                  }`}
                                  title={`Generate 5 Gemini MCQs for ${concept.title}`}
                                >
                                  <HelpCircle className="w-3 h-3" />
                                  <span>Quick Quiz</span>
                                </button>
                              </div>
                            </div>

                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                              {highlightText(concept.description, searchQuery)}
                            </p>

                            {language === 'hinglish' && concept.hinglishDesc && (
                              <p className="text-xs text-indigo-700 dark:text-indigo-300 bg-indigo-50/50 dark:bg-indigo-950/30 p-2 rounded-lg border border-indigo-100 dark:border-indigo-900/50">
                                <span className="font-semibold">Hinglish Note: </span>
                                {highlightText(concept.hinglishDesc, searchQuery)}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* Curated Hindi YouTube Playlists */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-red-500" />
                <span>Recommended Hindi YouTube Playlists</span>
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Curated specifically for Phase 0{selectedPhase.phaseNumber}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {selectedPhase.hindiResources.map((res, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-red-600" />
                        {res.channelName}
                      </span>
                      {res.totalVideos && (
                        <span className="text-[11px] font-mono text-slate-400">
                          {res.totalVideos} Videos
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                      {res.playlistTitle}
                    </h4>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {res.whyRecommended}
                    </p>

                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200/70 dark:border-slate-700/60 text-xs">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        Pro-Tip:
                      </span>{' '}
                      <span className="text-slate-600 dark:text-slate-300">{res.hinglishTip}</span>
                    </div>
                  </div>

                  <a
                    href={res.playlistUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors cursor-pointer"
                  >
                    <span>Watch Playlist on YouTube</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Dual Projects Section: Standard Resume vs Visionary Future */}
          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <Code2 className="w-4 h-4 text-emerald-500" />
              <span>Phase 0{selectedPhase.phaseNumber} Projects to Build</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Standard Industry Resume Project */}
              <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                    <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800">
                      Standard Industry Resume Project
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-slate-900 dark:text-white">
                    {selectedPhase.standardProject.title}
                  </h4>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {selectedPhase.standardProject.tagline}
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {selectedPhase.standardProject.techStack.map((tech) => {
                      const isTechMatch = queryLower && tech.toLowerCase().includes(queryLower);
                      return (
                        <span
                          key={tech}
                          className={`px-2 py-0.5 text-[11px] font-mono rounded transition-all ${
                            isTechMatch
                              ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold ring-1 ring-indigo-500/40'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {highlightText(tech, searchQuery)}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <button
                  onClick={() => onSelectProject(selectedPhase.standardProject)}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  <span>View Blueprint & Resume Bullets</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Visionary Future Project (Pre-fixing the future) */}
              <div className="p-5 rounded-xl bg-gradient-to-br from-purple-50/50 via-white to-indigo-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-purple-950/30 border border-purple-200 dark:border-purple-900/60 shadow-xs flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-purple-600 dark:text-purple-400">
                    <span className="px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                      Visionary Future Project (Novel)
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-slate-900 dark:text-white">
                    {highlightText(selectedPhase.visionaryProject.title, searchQuery)}
                  </h4>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {highlightText(selectedPhase.visionaryProject.tagline, searchQuery)}
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {selectedPhase.visionaryProject.techStack.map((tech) => {
                      const isTechMatch = queryLower && tech.toLowerCase().includes(queryLower);
                      return (
                        <span
                          key={tech}
                          className={`px-2 py-0.5 text-[11px] font-mono rounded transition-all ${
                            isTechMatch
                              ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold ring-1 ring-purple-500/40'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {highlightText(tech, searchQuery)}
                        </span>
                      );
                    })}
                  </div>

                  <div className="p-2 bg-purple-50/80 dark:bg-purple-950/40 rounded-lg border border-purple-100 dark:border-purple-900/50 text-[11px] text-purple-900 dark:text-purple-200">
                    <span className="font-semibold">Future Edge: </span>
                    {highlightText(selectedPhase.visionaryProject.noveltyFactor, searchQuery)}
                  </div>
                </div>

                <button
                  onClick={() => onSelectProject(selectedPhase.visionaryProject)}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 active:bg-purple-800 rounded-lg transition-colors cursor-pointer shadow-xs"
                >
                  <span>View Futuristic Architecture</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Chronological Sequence Stepper Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            {prevPhase ? (
              <button
                onClick={() => handleSelectPhase(prevPhase.id)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Previous: Phase 0{prevPhase.phaseNumber}</span>
              </button>
            ) : (
              <div />
            )}

            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
              Phase 0{selectedPhase.phaseNumber} of 08
            </span>

            {nextPhase ? (
              <button
                onClick={() => handleSelectPhase(nextPhase.id)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                <span>Next: Phase 0{nextPhase.phaseNumber}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Final Milestone Reached!</span>
              </div>
            )}
          </div>
        </div>
      </div>
      )}

      {/* Gemini 5-Question Concept Quick Quiz Modal */}
      <ConceptQuickQuizModal
        isOpen={Boolean(quizModalConceptId)}
        onClose={() => setQuizModalConceptId(null)}
        conceptId={quizModalConceptId}
        conceptTitle={quizModalConcept?.title || ''}
        language={language}
        isConceptCompleted={
          quizModalConceptId ? completedConcepts.includes(quizModalConceptId) : false
        }
        onMarkConceptCompleted={(id) => {
          if (!completedConcepts.includes(id)) {
            handleToggle(id);
          }
        }}
      />
    </div>
  );
};
