import React, { useMemo, useState } from 'react';
import {
  Cpu,
  Database,
  Bot,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  Clock,
  DollarSign,
  Layers,
  ArrowRight,
  Loader2,
  GitBranch,
  Zap
} from 'lucide-react';
import { Language } from '../types';

interface SystemDesignSandboxProps {
  language: Language;
}

type DataFreshness = 'static' | 'weekly' | 'realtime';
type BudgetTier = 'lean' | 'balanced' | 'enterprise';
type LatencySla = 'strict-500ms' | 'standard-2s' | 'async-batch';
type HallucinationTolerance = 'zero-strict' | 'moderate' | 'creative';
type PrivacyRule = 'strict-onprem' | 'vpc-cloud' | 'public-api';
type LabeledDataCount = 'none-raw' | 'small-100' | 'large-10k';

type ArchitectureId =
  | 'prompt-caching'
  | 'hybrid-rag'
  | 'lora-finetune'
  | 'agentic-rag'
  | 'hybrid-ft-rag';

interface ArchitectureConstraints {
  dataFreshness: DataFreshness;
  budget: BudgetTier;
  latency: LatencySla;
  hallucinationTolerance: HallucinationTolerance;
  privacy: PrivacyRule;
  labeledData: LabeledDataCount;
}

interface FailureWarning {
  severity: 'critical' | 'warning' | 'optimal';
  title: string;
  detail: string;
}

interface ArchitectureEvaluation {
  id: ArchitectureId;
  name: string;
  shortName: string;
  tagline: string;
  score: number;
  estMonthlyCost: string;
  estLatency: string;
  infraComplexity: 'Low' | 'Medium' | 'High' | 'Very High';
  hallucinationRisk: 'Minimal (Grounded)' | 'Low' | 'Moderate' | 'High (Parametric Only)';
  warnings: FailureWarning[];
  blueprintNodes: Array<{ step: string; stack: string }>;
}

interface GeminiArchitectureReview {
  verdict: string;
  fitScore: number;
  recommendedArchitecture: string;
  costSavingsInsight: string;
  failureModes: string[];
  blueprintSteps: string[];
  whyNotAlternatives: string[];
}

interface PresetScenario {
  id: string;
  label: string;
  scenarioText: string;
  constraints: ArchitectureConstraints;
  recommendedHint: ArchitectureId;
}

const PRESET_SCENARIOS: PresetScenario[] = [
  {
    id: 'enterprise-kb',
    label: 'Enterprise Support Docs (1M PDFs)',
    scenarioText:
      'Internal IT & legal support bot answering employee policy questions across 1M docs updated weekly with strict source citations.',
    constraints: {
      dataFreshness: 'weekly',
      budget: 'lean',
      latency: 'standard-2s',
      hallucinationTolerance: 'zero-strict',
      privacy: 'vpc-cloud',
      labeledData: 'none-raw'
    },
    recommendedHint: 'hybrid-rag'
  },
  {
    id: 'voice-support',
    label: 'Realtime Voice Bot (<500ms)',
    scenarioText:
      'Ultra-low-latency voice assistant triaging e-commerce orders with live inventory API lookups under 500ms TTFT.',
    constraints: {
      dataFreshness: 'realtime',
      budget: 'balanced',
      latency: 'strict-500ms',
      hallucinationTolerance: 'moderate',
      privacy: 'public-api',
      labeledData: 'small-100'
    },
    recommendedHint: 'prompt-caching'
  },
  {
    id: 'banking-pii',
    label: 'Air-Gapped Banking PII Classifier',
    scenarioText:
      'On-premise strict compliance JSON extraction + SQL routing over 25k labeled internal audit rows with zero external API egress.',
    constraints: {
      dataFreshness: 'static',
      budget: 'balanced',
      latency: 'strict-500ms',
      hallucinationTolerance: 'zero-strict',
      privacy: 'strict-onprem',
      labeledData: 'large-10k'
    },
    recommendedHint: 'lora-finetune'
  },
  {
    id: 'devops-agent',
    label: 'Autonomous Incident Responder',
    scenarioText:
      'Multi-step DevOps triage bot querying Grafana logs, reading Git diffs, running sandboxed diagnostics, and opening PR fixes asynchronously.',
    constraints: {
      dataFreshness: 'realtime',
      budget: 'enterprise',
      latency: 'async-batch',
      hallucinationTolerance: 'zero-strict',
      privacy: 'vpc-cloud',
      labeledData: 'small-100'
    },
    recommendedHint: 'agentic-rag'
  }
];

const ARCH_CATALOG: Array<{
  id: ArchitectureId;
  name: string;
  shortName: string;
  tagline: string;
  icon: React.ReactNode;
}> = [
  {
    id: 'prompt-caching',
    name: 'Prompt Engineering + Caching',
    shortName: 'Prompt + Cache',
    tagline: 'System prompt + structured JSON outputs + prefix/semantic caching',
    icon: <Zap className="w-4 h-4 text-amber-500" />
  },
  {
    id: 'hybrid-rag',
    name: 'Hybrid Search RAG + Reranker',
    shortName: 'Hybrid RAG',
    tagline: 'Dense vectors + BM25 lexical + cross-encoder reranking + citations',
    icon: <Database className="w-4 h-4 text-indigo-500" />
  },
  {
    id: 'lora-finetune',
    name: 'QLoRA / SFT Fine-Tuning',
    shortName: 'LoRA Fine-Tune',
    tagline: 'Task/domain weight adaptation (Unsloth/PEFT) served via vLLM/TGI',
    icon: <Cpu className="w-4 h-4 text-rose-500" />
  },
  {
    id: 'agentic-rag',
    name: 'Stateful Multi-Agent (LangGraph)',
    shortName: 'Agent Swarm',
    tagline: 'ReAct/Plan-and-Solve tool loops + sandboxed execution + checkpoints',
    icon: <Bot className="w-4 h-4 text-emerald-500" />
  },
  {
    id: 'hybrid-ft-rag',
    name: 'QLoRA Style-Tuned + Hybrid RAG',
    shortName: 'LoRA + RAG',
    tagline: 'Fine-tuned format/domain model grounded at runtime by vector retrieval',
    icon: <Layers className="w-4 h-4 text-purple-500" />
  }
];

function evaluateArchitecture(
  archId: ArchitectureId,
  c: ArchitectureConstraints
): ArchitectureEvaluation {
  let score = 72;
  const warnings: FailureWarning[] = [];

  if (archId === 'prompt-caching') {
    score = 68;
    if (c.latency === 'strict-500ms') score += 20;
    if (c.budget === 'lean') score += 16;
    if (c.labeledData === 'none-raw') score += 10;
    if (c.dataFreshness === 'realtime') {
      score -= 12;
      warnings.push({
        severity: 'warning',
        title: 'Context Window Ceiling on Dynamic Data',
        detail:
          'Prompt caching alone cannot inject 100k+ live database records dynamically without adding lightweight retrieval.'
      });
    }
    if (c.hallucinationTolerance === 'zero-strict' && c.dataFreshness !== 'static') {
      score -= 18;
      warnings.push({
        severity: 'critical',
        title: 'Unverified Parametric Recall Risk',
        detail:
          'Strict zero-hallucination SLAs require grounded retrieval citations rather than relying solely on prompt instructions.'
      });
    }
    if (c.privacy === 'strict-onprem') {
      score -= 10;
      warnings.push({
        severity: 'warning',
        title: 'Requires Local vLLM Prefix Caching',
        detail:
          'Public API prompt caching is blocked by strict on-prem PII rules; serve Llama-3/Qwen locally with vLLM Automatic Prefix Caching.'
      });
    }
  }

  if (archId === 'hybrid-rag') {
    score = 78;
    if (c.dataFreshness === 'weekly' || c.dataFreshness === 'realtime') score += 14;
    if (c.hallucinationTolerance === 'zero-strict') score += 14;
    if (c.labeledData === 'none-raw' || c.labeledData === 'small-100') score += 8;
    if (c.budget === 'lean') score += 6;
    if (c.latency === 'strict-500ms') {
      score -= 14;
      warnings.push({
        severity: 'warning',
        title: 'Reranker Latency Budget Tight (<500ms)',
        detail:
          'Dense + BM25 + Cross-Encoder reranking typically adds 180–350ms before the first LLM token. Use lightweight FastEmbed/ColBERT or skip heavy cross-encoders.'
      });
    }
    if (c.privacy === 'strict-onprem') {
      warnings.push({
        severity: 'optimal',
        title: 'Air-Gapped RAG Ready',
        detail:
          'Self-host Qdrant/pgvector + BGE embeddings + local vLLM inside your VPC to enforce row-level ACLs with zero external leakage.'
      });
    }
  }

  if (archId === 'lora-finetune') {
    score = 54;
    if (c.labeledData === 'large-10k') score += 26;
    if (c.dataFreshness === 'static') score += 14;
    if (c.privacy === 'strict-onprem') score += 14;
    if (c.latency === 'strict-500ms') score += 10;

    if (c.dataFreshness === 'realtime' || c.dataFreshness === 'weekly') {
      score -= 26;
      warnings.push({
        severity: 'critical',
        title: 'Stale Weights Anti-Pattern (Over-Engineering)',
        detail:
          'Training LoRA to memorize changing docs fails immediately when data updates. Hybrid Search + Reranking handles dynamic facts at ~10% of the cost.'
      });
    }
    if (c.labeledData === 'none-raw') {
      score -= 28;
      warnings.push({
        severity: 'critical',
        title: 'Zero Labeled Instruction Pairs',
        detail:
          'Raw PDFs without clean (prompt, completion) pairs yield noisy fine-tunes. Use RAG for raw documents instead of SFT/LoRA.'
      });
    }
    if (c.budget === 'lean') {
      score -= 18;
      warnings.push({
        severity: 'warning',
        title: 'Dedicated GPU Hosting Burn Rate',
        detail:
          'Fine-tuned weights require 24/7 GPU inference (A10G/L4/H100) or LoRA adapter swapping, exceeding a <$200/mo lean budget.'
      });
    }
    if (c.hallucinationTolerance === 'zero-strict') {
      score -= 16;
      warnings.push({
        severity: 'critical',
        title: 'Fine-Tuning Does NOT Stop Hallucinations',
        detail:
          'LoRA teaches output tone, schema, and task patterns—not grounded fact lookup. Without RAG citations, models still confabulate confidently.'
      });
    }
  }

  if (archId === 'agentic-rag') {
    score = 62;
    if (c.latency === 'async-batch') score += 24;
    if (c.dataFreshness === 'realtime') score += 14;
    if (c.budget === 'enterprise') score += 10;

    if (c.latency === 'strict-500ms') {
      score -= 36;
      warnings.push({
        severity: 'critical',
        title: 'Guaranteed SLA Breach (<500ms Impossible)',
        detail:
          'Multi-step ReAct/LangGraph loops execute 2–6 sequential LLM calls + tool round-trips (2.5s–12s total), violating sub-500ms SLAs.'
      });
    } else if (c.latency === 'standard-2s') {
      score -= 14;
      warnings.push({
        severity: 'warning',
        title: 'High Tail Latency Variance (P95 > 4s)',
        detail:
          'Multi-hop tool retries push interactive chat latency past 2 seconds. Cap max_steps=2 or stream intermediate tool progress.'
      });
    }
    if (c.budget === 'lean') {
      score -= 20;
      warnings.push({
        severity: 'warning',
        title: '3x–8x Token Amplification Cost',
        detail:
          'Each agent loop re-sends conversation history + tool schemas, multiplying token burn compared to a single-pass Hybrid RAG pipeline.'
      });
    }
  }

  if (archId === 'hybrid-ft-rag') {
    score = 66;
    if (c.labeledData === 'large-10k') score += 16;
    if (c.hallucinationTolerance === 'zero-strict') score += 12;
    if (c.privacy === 'strict-onprem') score += 12;
    if (c.dataFreshness === 'realtime' || c.dataFreshness === 'weekly') score += 8;

    if (c.budget === 'lean' || c.labeledData === 'none-raw') {
      score -= 26;
      warnings.push({
        severity: 'warning',
        title: 'Premature Complexity & GPU Overhead',
        detail:
          'Combining QLoRA hosting + Vector DB + Reranker requires ML infra maintenance and 10k+ training pairs. Start with Hybrid RAG + Prompting first.'
      });
    }
    if (c.latency === 'strict-500ms') {
      score -= 10;
      warnings.push({
        severity: 'warning',
        title: 'Combined Retrieval + Model Hop Overhead',
        detail:
          'Deploy a compact 8B QLoRA model on quantized vLLM paired with fast HNSW retrieval to stay near 500ms.'
      });
    }
  }

  const clampedScore = Math.max(8, Math.min(99, score));
  if (warnings.length === 0 && clampedScore >= 82) {
    warnings.push({
      severity: 'optimal',
      title: 'Clean Constraint Alignment',
      detail:
        'No structural anti-patterns detected. Latency budget, cost tier, and data freshness align with this architecture.'
    });
  }

  const isLocalPrivacy = c.privacy === 'strict-onprem';
  const llmLabel = isLocalPrivacy ? 'Local vLLM (Llama-3 / Qwen-2.5)' : 'Managed Frontier API / VPC Endpoint';

  const metaByArch: Record<
    ArchitectureId,
    Omit<ArchitectureEvaluation, 'id' | 'name' | 'shortName' | 'tagline' | 'score' | 'warnings'>
  > = {
    'prompt-caching': {
      estMonthlyCost: isLocalPrivacy ? '$250–$600 (1x L4 GPU)' : '$30–$180 (Token Cache)',
      estLatency: '220–450 ms TTFT',
      infraComplexity: 'Low',
      hallucinationRisk: c.hallucinationTolerance === 'zero-strict' ? 'High (Parametric Only)' : 'Moderate',
      blueprintNodes: [
        { step: '1. Input Guard', stack: 'Pydantic Schema + PII Redactor' },
        { step: '2. Prefix Cache', stack: 'Redis Semantic Cache / KV Prefix Hit' },
        { step: '3. Inference', stack: llmLabel },
        { step: '4. Output Gate', stack: 'Strict JSON Schema Validator' }
      ]
    },
    'hybrid-rag': {
      estMonthlyCost: isLocalPrivacy ? '$350–$850 (GPU + Qdrant)' : '$60–$320 (API + Managed Vector)',
      estLatency: '550–1,300 ms TTFT',
      infraComplexity: 'Medium',
      hallucinationRisk: 'Minimal (Grounded)',
      blueprintNodes: [
        { step: '1. Query Rewrite', stack: 'BM25 + Dense Vector Query Expansion' },
        { step: '2. Hybrid Search', stack: `${isLocalPrivacy ? 'Self-Hosted Qdrant' : 'Qdrant / pgvector'} (RRF Fusion)` },
        { step: '3. Reranker', stack: 'BGE-Reranker / Cross-Encoder Top-5' },
        { step: '4. Grounded LLM', stack: `${llmLabel} + Inline Citations` }
      ]
    },
    'lora-finetune': {
      estMonthlyCost: '$450–$1,800+ (Training + 24/7 vLLM GPU)',
      estLatency: '280–650 ms TTFT',
      infraComplexity: 'High',
      hallucinationRisk: 'High (Parametric Only)',
      blueprintNodes: [
        { step: '1. Dataset Curation', stack: 'Cleaned Instruction / DPO Pairs + Dedup' },
        { step: '2. PEFT Training', stack: 'Unsloth 4-bit QLoRA (r=16, alpha=32)' },
        { step: '3. Eval Harness', stack: 'Holdout Exact-Match / JSON Validity Suite' },
        { step: '4. Serving', stack: 'vLLM Continuous Batching + Adapter Weights' }
      ]
    },
    'agentic-rag': {
      estMonthlyCost: '$250–$1,500+ (3x–8x Multi-Hop Tokens)',
      estLatency: '2,500–9,000 ms (Multi-Step)',
      infraComplexity: 'Very High',
      hallucinationRisk: 'Low',
      blueprintNodes: [
        { step: '1. State Graph', stack: 'LangGraph Checkpointer + Memory' },
        { step: '2. Router & Tools', stack: 'Hybrid RAG + SQL + E2B Code Sandbox' },
        { step: '3. Self-Critique', stack: 'Verifier Node + Retry Guardrails' },
        { step: '4. Human Gate', stack: 'Approval Webhook on Destructive Writes' }
      ]
    },
    'hybrid-ft-rag': {
      estMonthlyCost: '$600–$2,200+ (vLLM QLoRA + Vector Stack)',
      estLatency: '600–1,400 ms TTFT',
      infraComplexity: 'Very High',
      hallucinationRisk: 'Minimal (Grounded)',
      blueprintNodes: [
        { step: '1. Domain LoRA', stack: '8B QLoRA Model Tuned on Style/Reasoning' },
        { step: '2. Hybrid RAG', stack: 'Dense + BM25 + ACL Security Filtering' },
        { step: '3. Rerank + Pack', stack: 'Top-K Chunks (Lost-in-Middle Ordered)' },
        { step: '4. CI Eval Gate', stack: 'Ragas Faithfulness + Regression Tests' }
      ]
    }
  };

  const catalog = ARCH_CATALOG.find((a) => a.id === archId)!;
  return {
    id: archId,
    name: catalog.name,
    shortName: catalog.shortName,
    tagline: catalog.tagline,
    score: clampedScore,
    warnings,
    ...metaByArch[archId]
  };
}

export const SystemDesignSandbox: React.FC<SystemDesignSandboxProps> = ({ language }) => {
  const [constraints, setConstraints] = useState<ArchitectureConstraints>(
    PRESET_SCENARIOS[0].constraints
  );
  const [selectedArchId, setSelectedArchId] = useState<ArchitectureId>('lora-finetune');
  const [customScenario, setCustomScenario] = useState<string>(PRESET_SCENARIOS[0].scenarioText);
  const [geminiReview, setGeminiReview] = useState<GeminiArchitectureReview | null>(null);
  const [reviewModelUsed, setReviewModelUsed] = useState<string | null>(null);
  const [isReviewing, setIsReviewing] = useState<boolean>(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const evaluations = useMemo(() => {
    return ARCH_CATALOG.map((arch) => evaluateArchitecture(arch.id, constraints)).sort(
      (a, b) => b.score - a.score
    );
  }, [constraints]);

  const recommendedEval = evaluations[0];
  const selectedEval =
    evaluations.find((e) => e.id === selectedArchId) || recommendedEval;
  const isOverEngineeredGap =
    selectedEval.id !== recommendedEval.id && recommendedEval.score - selectedEval.score >= 12;

  const updateConstraint = <K extends keyof ArchitectureConstraints>(
    key: K,
    value: ArchitectureConstraints[K]
  ) => {
    setConstraints((prev) => ({ ...prev, [key]: value }));
    setGeminiReview(null);
    setReviewError(null);
  };

  const handleApplyPreset = (preset: PresetScenario) => {
    setConstraints(preset.constraints);
    setCustomScenario(preset.scenarioText);
    setSelectedArchId(preset.recommendedHint);
    setGeminiReview(null);
    setReviewError(null);
  };

  const handleRequestGeminiReview = async () => {
    setIsReviewing(true);
    setReviewError(null);

    try {
      const res = await fetch('/api/architecture/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          constraints,
          selectedArchitecture: selectedEval.name,
          recommendedArchitecture: recommendedEval.name,
          localWarnings: selectedEval.warnings.map((w) => `${w.title}: ${w.detail}`),
          customScenario,
          language
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Architecture review failed');
      }
      setGeminiReview(data.review);
      setReviewModelUsed(data.modelUsed || 'gemini-4-hydrogen');
    } catch (err: any) {
      setReviewError(err?.message || 'Unable to run Gemini review right now.');
    } finally {
      setIsReviewing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Intro & Scenario Presets Bar */}
      <div className="p-5 sm:p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              <GitBranch className="w-4 h-4" />
              <span>Fine-Tuning vs. RAG vs. Agents · Decision Sandbox</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              {language === 'hinglish'
                ? 'System Constraints Chunein aur Over-Engineering Catch Karein'
                : 'Stress-Test Production AI Architectures Against Real Constraints'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-3xl">
              {language === 'hinglish'
                ? 'Data freshness, budget, <500ms latency, PII rules aur dataset size set karke dekhein ki LoRA Fine-Tuning kab zaroori hai aur kab Hybrid RAG + Reranker 10% cost mein jeet jata hai.'
                : 'Dial in data freshness, budget, latency SLAs, hallucination tolerance, PII/on-prem rules, and labeled dataset size to inspect live failure-mode warnings and get a Gemini Principal Architect critique.'}
            </p>
          </div>
        </div>

        {/* 1-Click Scenario Presets */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mr-1">
            Load Case Study:
          </span>
          {PRESET_SCENARIOS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleApplyPreset(preset)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-700 dark:text-slate-200 hover:text-indigo-700 dark:hover:text-indigo-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Split Grid: Constraints Config (Left 5 Cols) vs Live Trade-Off & Blueprint Results (Right 7 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: 6 Real-World Constraint Controls + Custom Product Context */}
        <div className="lg:col-span-5 p-5 sm:p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            1. Production Constraints
          </h3>

          {/* Constraint 1: Data Freshness */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Data Freshness Requirement
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(
                [
                  { id: 'static', label: 'Static / Yearly' },
                  { id: 'weekly', label: 'Weekly Updates' },
                  { id: 'realtime', label: 'Live / Realtime' }
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => updateConstraint('dataFreshness', opt.id)}
                  className={`py-2 px-2 text-[11px] font-semibold rounded-lg border transition-colors cursor-pointer ${
                    constraints.dataFreshness === opt.id
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Constraint 2: Budget */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Monthly Infra Budget
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(
                [
                  { id: 'lean', label: 'Lean (<$200)' },
                  { id: 'balanced', label: 'Mid ($500–$2k)' },
                  { id: 'enterprise', label: 'Scale ($5k+)' }
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => updateConstraint('budget', opt.id)}
                  className={`py-2 px-2 text-[11px] font-semibold rounded-lg border transition-colors cursor-pointer ${
                    constraints.budget === opt.id
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Constraint 3: Latency SLA */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Latency SLA (Time-to-First-Token)
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(
                [
                  { id: 'strict-500ms', label: '<500ms Strict' },
                  { id: 'standard-2s', label: '1–2s Chat' },
                  { id: 'async-batch', label: '5s+ / Async' }
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => updateConstraint('latency', opt.id)}
                  className={`py-2 px-2 text-[11px] font-semibold rounded-lg border transition-colors cursor-pointer ${
                    constraints.latency === opt.id
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Constraint 4: Hallucination Tolerance */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Hallucination & Citation Strictness
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(
                [
                  { id: 'zero-strict', label: 'Zero Tolerance' },
                  { id: 'moderate', label: 'Moderate' },
                  { id: 'creative', label: 'Creative / Draft' }
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => updateConstraint('hallucinationTolerance', opt.id)}
                  className={`py-2 px-2 text-[11px] font-semibold rounded-lg border transition-colors cursor-pointer ${
                    constraints.hallucinationTolerance === opt.id
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Constraint 5: PII & Privacy */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              PII, Compliance & On-Prem Rules
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(
                [
                  { id: 'strict-onprem', label: 'Strict On-Prem' },
                  { id: 'vpc-cloud', label: 'Private VPC' },
                  { id: 'public-api', label: 'Public API OK' }
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => updateConstraint('privacy', opt.id)}
                  className={`py-2 px-2 text-[11px] font-semibold rounded-lg border transition-colors cursor-pointer ${
                    constraints.privacy === opt.id
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Constraint 6: Labeled Dataset Count */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Labeled Training Examples Available
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(
                [
                  { id: 'none-raw', label: '0 (Raw Docs)' },
                  { id: 'small-100', label: '50–500 Pairs' },
                  { id: 'large-10k', label: '10k+ Clean' }
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => updateConstraint('labeledData', opt.id)}
                  className={`py-2 px-2 text-[11px] font-semibold rounded-lg border transition-colors cursor-pointer ${
                    constraints.labeledData === opt.id
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Optional Custom Scenario Context */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label
              htmlFor="arch-scenario-input"
              className="text-xs font-semibold text-slate-700 dark:text-slate-300 block"
            >
              Product Context (Optional, sent to Gemini Review)
            </label>
            <textarea
              id="arch-scenario-input"
              rows={2}
              value={customScenario}
              onChange={(e) => setCustomScenario(e.target.value)}
              placeholder="Describe your app (e.g., 50k legal contracts, Hindi/English queries, zero hallucinations)..."
              className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
            />
          </div>
        </div>

        {/* Right Column: Candidate Architecture Picker, Live Scores, Failure Warnings & Blueprint */}
        <div className="lg:col-span-7 space-y-5">
          {/* Candidate Architecture Selector Ranked by Live Fit */}
          <div className="p-5 sm:p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                2. Test an Architecture Decision
              </h3>
              <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                Top Fit: {recommendedEval.shortName} ({recommendedEval.score}%)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5">
              {evaluations.map((arch) => {
                const catalog = ARCH_CATALOG.find((c) => c.id === arch.id)!;
                const isSelected = arch.id === selectedEval.id;
                const isBest = arch.id === recommendedEval.id;

                return (
                  <button
                    key={arch.id}
                    type="button"
                    onClick={() => {
                      setSelectedArchId(arch.id);
                      setGeminiReview(null);
                      setReviewError(null);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer space-y-1.5 ${
                      isSelected
                        ? 'bg-indigo-50/80 dark:bg-indigo-950/50 border-indigo-500 ring-1 ring-indigo-500/40'
                        : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white truncate">
                        {catalog.icon}
                        <span className="truncate">{arch.shortName}</span>
                      </span>
                      <span
                        className={`font-mono text-[11px] font-bold px-1.5 py-0.5 rounded tabular-nums ${
                          arch.score >= 80
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                            : arch.score >= 60
                            ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                            : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                        }`}
                      >
                        {arch.score}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                      <span className="truncate">{arch.infraComplexity} Ops</span>
                      {isBest && (
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                          ★ Recommended
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Over-Engineering / Sub-Optimal Nudge */}
            {isOverEngineeredGap && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-900 dark:text-amber-200">
                <div>
                  <span className="font-bold">Trade-Off Alert:</span>{' '}
                  <strong>{recommendedEval.name}</strong> scores{' '}
                  <span className="font-mono font-bold">{recommendedEval.score}%</span> vs.{' '}
                  <span className="font-mono font-bold">{selectedEval.score}%</span> for{' '}
                  {selectedEval.shortName} under your constraints.
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedArchId(recommendedEval.id)}
                  className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-[11px] shrink-0 cursor-pointer"
                >
                  Switch to {recommendedEval.shortName}
                </button>
              </div>
            )}

            {/* Telemetry Strip for Selected Architecture */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-0.5">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Est. Monthly Cost</span>
                </div>
                <div className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                  {selectedEval.estMonthlyCost}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-0.5">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Expected Latency</span>
                </div>
                <div className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                  {selectedEval.estLatency}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-0.5">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                  <span>Hallucination Risk</span>
                </div>
                <div className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                  {selectedEval.hallucinationRisk}
                </div>
              </div>
            </div>

            {/* Live Failure-Mode Warnings */}
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Live Failure-Mode & Trade-Off Warnings ({selectedEval.shortName})
              </div>
              <div className="space-y-2">
                {selectedEval.warnings.map((w, idx) => (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-xl border flex items-start gap-2.5 text-xs ${
                      w.severity === 'critical'
                        ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/70 text-rose-900 dark:text-rose-200'
                        : w.severity === 'warning'
                        ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/70 text-amber-900 dark:text-amber-200'
                        : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/70 text-emerald-900 dark:text-emerald-200'
                    }`}
                  >
                    {w.severity === 'critical' ? (
                      <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                    ) : w.severity === 'warning' ? (
                      <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-0.5">
                      <div className="font-bold">{w.title}</div>
                      <p className="leading-relaxed opacity-90">{w.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Production Pipeline Flow Diagram */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Adapted Pipeline Blueprint
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2">
                {selectedEval.blueprintNodes.map((node, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col justify-between gap-1"
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      <span>{node.step}</span>
                      {i < selectedEval.blueprintNodes.length - 1 && (
                        <ArrowRight className="w-3 h-3 text-slate-400 hidden xl:inline" />
                      )}
                    </div>
                    <div className="text-xs font-medium text-slate-800 dark:text-slate-200 leading-snug">
                      {node.stack}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Gemini Principal Architect Review Panel */}
          <div className="p-5 sm:p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Gemini Principal Architect Review</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Run a real-time AI architecture audit on your constraints, product context, and proposed stack.
                </p>
              </div>

              <button
                type="button"
                onClick={handleRequestGeminiReview}
                disabled={isReviewing}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white shadow-xs transition-colors cursor-pointer shrink-0"
              >
                {isReviewing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Auditing Design...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Run Gemini Critique</span>
                  </>
                )}
              </button>
            </div>

            {reviewError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300">
                {reviewError}
              </div>
            )}

            {geminiReview && (
              <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${
                        geminiReview.verdict.toLowerCase().includes('optimal')
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                          : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                      }`}
                    >
                      {geminiReview.verdict}
                    </span>
                    <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                      Score: {geminiReview.fitScore}/100
                    </span>
                  </div>
                  {reviewModelUsed && (
                    <span className="font-mono text-[11px] text-slate-400">
                      Reviewed by {reviewModelUsed}
                    </span>
                  )}
                </div>

                <div className="p-3.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/70 dark:border-indigo-900/50 text-xs space-y-1">
                  <div className="font-bold text-indigo-900 dark:text-indigo-200">
                    Recommended Stack: {geminiReview.recommendedArchitecture}
                  </div>
                  <p className="text-indigo-800 dark:text-indigo-300 leading-relaxed">
                    {geminiReview.costSavingsInsight}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-2">
                    <div className="font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider text-[11px]">
                      Production Failure Modes
                    </div>
                    <ul className="space-y-1.5 text-slate-700 dark:text-slate-300">
                      {geminiReview.failureModes.map((fm, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-rose-500 font-bold shrink-0">•</span>
                          <span className="leading-relaxed">{fm}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <div className="font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider text-[11px]">
                      Why Alternatives Lose Here
                    </div>
                    <ul className="space-y-1.5 text-slate-700 dark:text-slate-300">
                      {geminiReview.whyNotAlternatives.map((alt, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-emerald-500 font-bold shrink-0">✓</span>
                          <span className="leading-relaxed">{alt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {geminiReview.blueprintSteps.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px]">
                      Production Implementation Steps
                    </div>
                    <ol className="space-y-1 text-xs text-slate-700 dark:text-slate-300 list-decimal list-inside">
                      {geminiReview.blueprintSteps.map((step, i) => (
                        <li key={i} className="leading-relaxed">
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Side-by-Side Architecture Trade-Off Comparison Matrix */}
      <div className="p-5 sm:p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Side-by-Side Trade-Off Matrix (RAG vs. Fine-Tuning vs. Agents)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Click any architecture row to inspect its failure modes and run a Gemini critique.
            </p>
          </div>
          <span className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
            Ranked for Active Constraints
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-2.5 pr-4">Architecture</th>
                <th className="py-2.5 px-3">Fit Score</th>
                <th className="py-2.5 px-3">Monthly Cost</th>
                <th className="py-2.5 px-3">Est. Latency</th>
                <th className="py-2.5 px-3">Ops Complexity</th>
                <th className="py-2.5 pl-3">Hallucination Defense</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {evaluations.map((arch) => {
                const isSelected = arch.id === selectedEval.id;
                const isRecommended = arch.id === recommendedEval.id;
                return (
                  <tr
                    key={arch.id}
                    onClick={() => {
                      setSelectedArchId(arch.id);
                      setGeminiReview(null);
                      setReviewError(null);
                    }}
                    className={`transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50/70 dark:bg-indigo-950/40'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="py-3 pr-4 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span>{arch.name}</span>
                        {isRecommended && (
                          <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                            BEST FIT
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold tabular-nums">
                      <span
                        className={
                          arch.score >= 80
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : arch.score >= 60
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }
                      >
                        {arch.score}%
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {arch.estMonthlyCost}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {arch.estLatency}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-400">
                      {arch.infraComplexity}
                    </td>
                    <td className="py-3 pl-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {arch.hallucinationRisk}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
