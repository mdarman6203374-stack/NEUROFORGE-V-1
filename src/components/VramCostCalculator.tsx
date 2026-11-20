import React, { useMemo, useState } from 'react';
import {
  Cpu,
  HardDrive,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  Check,
  Sliders,
  Zap,
  Server,
  Cloud
} from 'lucide-react';
import { Language } from '../types';

interface VramCostCalculatorProps {
  language: Language;
}

type WorkloadMode = 'inference' | 'qlora' | 'lora' | 'full-ft';
type PrecisionType = 'fp16' | 'int8' | 'int4';
type ScheduleDuty = '24x7' | '8h-day';

interface ModelPreset {
  id: string;
  label: string;
  paramsB: number;
  layers: number;
  kvHeadsGqa: number;
  kvHeadsMha: number;
  headDim: number;
  exampleModels: string;
}

const MODEL_PRESETS: ModelPreset[] = [
  {
    id: '1.5b',
    label: '1.5B–3B Edge',
    paramsB: 3,
    layers: 28,
    kvHeadsGqa: 4,
    kvHeadsMha: 24,
    headDim: 128,
    exampleModels: 'Qwen-2.5-3B · Llama-3.2-3B · Phi-4-mini'
  },
  {
    id: '7b',
    label: '7B / 8B',
    paramsB: 8,
    layers: 32,
    kvHeadsGqa: 8,
    kvHeadsMha: 32,
    headDim: 128,
    exampleModels: 'Llama-3.1-8B · Mistral-7B · Qwen-2.5-7B'
  },
  {
    id: '14b',
    label: '14B',
    paramsB: 14,
    layers: 40,
    kvHeadsGqa: 8,
    kvHeadsMha: 40,
    headDim: 128,
    exampleModels: 'Qwen-2.5-14B · Phi-4-14B'
  },
  {
    id: '32b',
    label: '32B',
    paramsB: 32,
    layers: 64,
    kvHeadsGqa: 8,
    kvHeadsMha: 40,
    headDim: 128,
    exampleModels: 'Qwen-2.5-32B · Gemma-2-27B · DeepSeek-R1-32B'
  },
  {
    id: '70b',
    label: '70B',
    paramsB: 70,
    layers: 80,
    kvHeadsGqa: 8,
    kvHeadsMha: 64,
    headDim: 128,
    exampleModels: 'Llama-3.3-70B · Qwen-2.5-72B · DeepSeek-R1-70B'
  },
  {
    id: '405b',
    label: '405B Frontier',
    paramsB: 405,
    layers: 126,
    kvHeadsGqa: 8,
    kvHeadsMha: 128,
    headDim: 128,
    exampleModels: 'Llama-3.1-405B · DeepSeek-V3 (MoE total)'
  }
];

interface GpuSpec {
  id: string;
  name: string;
  vramGb: number;
  count: number;
  totalVramGb: number;
  bandwidthGbS: number;
  hourlyUsd: number;
  tierNote: string;
}

const GPU_CATALOG: GpuSpec[] = [
  {
    id: 't4-16',
    name: 'NVIDIA T4 (16 GB)',
    vramGb: 16,
    count: 1,
    totalVramGb: 16,
    bandwidthGbS: 300,
    hourlyUsd: 0.53,
    tierNote: 'Budget cloud / Colab / AWS g4dn'
  },
  {
    id: 'l4-24',
    name: 'NVIDIA L4 (24 GB)',
    vramGb: 24,
    count: 1,
    totalVramGb: 24,
    bandwidthGbS: 300,
    hourlyUsd: 0.80,
    tierNote: 'GCP g2-standard / cost-efficient prod'
  },
  {
    id: 'rtx4090-24',
    name: 'RTX 4090 (24 GB)',
    vramGb: 24,
    count: 1,
    totalVramGb: 24,
    bandwidthGbS: 1008,
    hourlyUsd: 0.69,
    tierNote: 'High-bandwidth dev & RunPod / Vast.ai'
  },
  {
    id: 'a100-40',
    name: 'NVIDIA A100 (40 GB)',
    vramGb: 40,
    count: 1,
    totalVramGb: 40,
    bandwidthGbS: 1555,
    hourlyUsd: 1.89,
    tierNote: 'Balanced mid-tier datacenter GPU'
  },
  {
    id: 'a100-80',
    name: 'NVIDIA A100 (80 GB)',
    vramGb: 80,
    count: 1,
    totalVramGb: 80,
    bandwidthGbS: 2039,
    hourlyUsd: 2.49,
    tierNote: 'Standard 70B Q4 / 14B FP16 GPU'
  },
  {
    id: 'h100-80',
    name: 'NVIDIA H100 (80 GB)',
    vramGb: 80,
    count: 1,
    totalVramGb: 80,
    bandwidthGbS: 3350,
    hourlyUsd: 3.89,
    tierNote: 'High-throughput FP8 serving & LoRA'
  },
  {
    id: '2x-a100-80',
    name: '2× A100 (160 GB)',
    vramGb: 80,
    count: 2,
    totalVramGb: 160,
    bandwidthGbS: 4078,
    hourlyUsd: 4.98,
    tierNote: '70B FP16 inference (tensor parallel)'
  },
  {
    id: '4x-h100-80',
    name: '4× H100 (320 GB)',
    vramGb: 80,
    count: 4,
    totalVramGb: 320,
    bandwidthGbS: 13400,
    hourlyUsd: 15.56,
    tierNote: '70B full fine-tune / 405B INT4'
  },
  {
    id: '8x-h100-80',
    name: '8× H100 (640 GB)',
    vramGb: 80,
    count: 8,
    totalVramGb: 640,
    bandwidthGbS: 26800,
    hourlyUsd: 31.12,
    tierNote: '405B INT8 / high-concurrency cluster'
  }
];

interface ApiTier {
  id: string;
  label: string;
  inputPerM: number;
  outputPerM: number;
  note: string;
}

const API_TIERS: ApiTier[] = [
  {
    id: 'flash-lite',
    label: 'Fast / Lite API (~$0.10 / $0.40 per 1M)',
    inputPerM: 0.10,
    outputPerM: 0.40,
    note: 'Gemini Flash-Lite / small hosted models'
  },
  {
    id: 'mid-flash',
    label: 'Balanced Workhorse (~$0.30 / $1.20 per 1M)',
    inputPerM: 0.30,
    outputPerM: 1.20,
    note: 'Gemini Flash / GPT-4o-mini class'
  },
  {
    id: 'frontier-pro',
    label: 'Frontier Reasoning (~$2.50 / $10.00 per 1M)',
    inputPerM: 2.50,
    outputPerM: 10.0,
    note: 'Frontier Pro / Opus-class reasoning'
  }
];

const CONTEXT_OPTIONS = [2048, 4096, 8192, 16384, 32768, 65536, 131072];

export const VramCostCalculator: React.FC<VramCostCalculatorProps> = ({ language }) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('7b');
  const [customParamsB, setCustomParamsB] = useState<number>(8);
  const [workload, setWorkload] = useState<WorkloadMode>('inference');
  const [precision, setPrecision] = useState<PrecisionType>('int4');
  const [contextLen, setContextLen] = useState<number>(8192);
  const [batchSize, setBatchSize] = useState<number>(4);
  const [useGqa, setUseGqa] = useState<boolean>(true);
  const [fp8KvCache, setFp8KvCache] = useState<boolean>(false);

  // Cost comparison controls
  const [dailyRequests, setDailyRequests] = useState<number>(10000);
  const [avgInputTokens, setAvgInputTokens] = useState<number>(1200);
  const [avgOutputTokens, setAvgOutputTokens] = useState<number>(350);
  const [apiTierId, setApiTierId] = useState<string>('mid-flash');
  const [dutyCycle, setDutyCycle] = useState<ScheduleDuty>('24x7');
  const [copiedFormula, setCopiedFormula] = useState<boolean>(false);

  const preset = useMemo(
    () => MODEL_PRESETS.find((p) => p.id === selectedPresetId) || MODEL_PRESETS[1],
    [selectedPresetId]
  );

  const handleSelectPreset = (p: ModelPreset) => {
    setSelectedPresetId(p.id);
    setCustomParamsB(p.paramsB);
  };

  // Core VRAM engineering math
  const vram = useMemo(() => {
    // 1. Model Weights GB
    let bytesPerWeight = 2;
    if (workload === 'qlora') {
      bytesPerWeight = 0.56; // NF4 4-bit + double-quant metadata
    } else if (workload === 'lora' || workload === 'full-ft') {
      bytesPerWeight = precision === 'fp16' ? 2 : precision === 'int8' ? 1.05 : 0.56;
    } else {
      bytesPerWeight = precision === 'fp16' ? 2 : precision === 'int8' ? 1.05 : 0.56;
    }

    const weightsGb = customParamsB * bytesPerWeight;

    // 2. Optimizer + Gradients + Adapter memory (if training)
    let trainingOverheadGb = 0;
    if (workload === 'qlora') {
      // Trainable LoRA adapters (~1.5% of params) * (2B weight + 2B grad + 8B AdamW FP32 states + FP32 master) ≈ 16 bytes on 1.5% params
      trainingOverheadGb = Math.max(0.4, customParamsB * 0.015 * 16);
    } else if (workload === 'lora') {
      trainingOverheadGb = Math.max(0.6, customParamsB * 0.02 * 16);
    } else if (workload === 'full-ft') {
      // Mixed precision AdamW: fp16 weights already counted (2B) + fp32 master (4B) + fp16 grads (2B) + Adam m & v (8B) = +14 bytes/param
      trainingOverheadGb = customParamsB * 14;
    }

    // 3. KV-Cache GB = 2 (K & V) * layers * kv_heads * head_dim * seq_len * batch * bytes_per_kv / 1e9
    const kvHeads = useGqa ? preset.kvHeadsGqa : preset.kvHeadsMha;
    const kvBytes = fp8KvCache ? 1 : 2;
    const scaleFactor = customParamsB / Math.max(0.5, preset.paramsB);
    const effectiveLayers = Math.max(16, Math.round(preset.layers * Math.pow(scaleFactor, 0.25)));
    const kvCacheGb =
      (2 * effectiveLayers * kvHeads * preset.headDim * contextLen * batchSize * kvBytes) /
      1_000_000_000;

    // 4. Activations & CUDA Workspace buffer
    const activationFactor = workload === 'inference' ? 0.08 : workload === 'full-ft' ? 0.55 : 0.28;
    const activationsGb =
      1.1 +
      Math.min(28, customParamsB * 0.04 + (contextLen / 4096) * batchSize * activationFactor);

    const totalGb = weightsGb + trainingOverheadGb + kvCacheGb + activationsGb;

    return {
      weightsGb,
      trainingOverheadGb,
      kvCacheGb,
      activationsGb,
      totalGb,
      effectiveLayers,
      kvHeads,
      kvBytes
    };
  }, [customParamsB, workload, precision, contextLen, batchSize, useGqa, fp8KvCache, preset]);

  // GPU Fit Evaluation
  const gpuEvaluations = useMemo(() => {
    return GPU_CATALOG.map((gpu) => {
      const headroom = gpu.totalVramGb - vram.totalGb;
      const utilizationPct = Math.min(100, Math.round((vram.totalGb / gpu.totalVramGb) * 100));
      let status: 'fit' | 'tight' | 'oom' = 'oom';
      if (headroom >= 2.5) status = 'fit';
      else if (headroom >= 0) status = 'tight';

      // Rough memory-bandwidth ceiling for single-stream decode tokens/sec (bytes read per token ≈ weightsGb)
      const estSingleStreamTokPerSec =
        status === 'oom' ? 0 : Math.min(260, Math.round((gpu.bandwidthGbS / Math.max(1, vram.weightsGb)) * 0.72));

      return {
        ...gpu,
        headroom,
        utilizationPct,
        status,
        estSingleStreamTokPerSec
      };
    });
  }, [vram.totalGb, vram.weightsGb]);

  const bestFitGpu = useMemo(
    () =>
      gpuEvaluations.find((g) => g.status === 'fit') ||
      gpuEvaluations.find((g) => g.status === 'tight') ||
      gpuEvaluations[gpuEvaluations.length - 1],
    [gpuEvaluations]
  );

  // API vs Self-Host Monthly Cost Math
  const costSummary = useMemo(() => {
    const monthlyRequests = dailyRequests * 30;
    const monthlyInputTokensM = (monthlyRequests * avgInputTokens) / 1_000_000;
    const monthlyOutputTokensM = (monthlyRequests * avgOutputTokens) / 1_000_000;

    const tier = API_TIERS.find((t) => t.id === apiTierId) || API_TIERS[1];
    const monthlyApiUsd =
      monthlyInputTokensM * tier.inputPerM + monthlyOutputTokensM * tier.outputPerM;

    const monthlyHours = dutyCycle === '24x7' ? 730 : 240;
    const monthlyGpuUsd = bestFitGpu.hourlyUsd * monthlyHours;
    const isSelfHostPossible = bestFitGpu.status !== 'oom';

    const cheaperOption =
      !isSelfHostPossible || monthlyApiUsd <= monthlyGpuUsd ? 'api' : 'self-host';
    const monthlySavingsUsd = Math.abs(monthlyApiUsd - monthlyGpuUsd);

    return {
      monthlyRequests,
      monthlyInputTokensM,
      monthlyOutputTokensM,
      tier,
      monthlyApiUsd,
      monthlyHours,
      monthlyGpuUsd,
      isSelfHostPossible,
      cheaperOption,
      monthlySavingsUsd
    };
  }, [dailyRequests, avgInputTokens, avgOutputTokens, apiTierId, dutyCycle, bestFitGpu]);

  const cheatSheetText = [
    `# LLM Sizing Summary (${customParamsB}B params · ${workload.toUpperCase()} · ${precision.toUpperCase()})`,
    `- Context: ${contextLen.toLocaleString()} tokens · Batch: ${batchSize} · KV Attention: ${useGqa ? 'GQA' : 'MHA'} (${fp8KvCache ? 'FP8' : 'FP16'})`,
    `- Weights VRAM: ${vram.weightsGb.toFixed(1)} GB`,
    ...(vram.trainingOverheadGb > 0
      ? [`- Training (Grads + Optimizer): ${vram.trainingOverheadGb.toFixed(1)} GB`]
      : []),
    `- KV-Cache VRAM: ${vram.kvCacheGb.toFixed(2)} GB`,
    `- Activations + CUDA Buffer: ${vram.activationsGb.toFixed(1)} GB`,
    `- Total Estimated VRAM: ${vram.totalGb.toFixed(1)} GB`,
    `- Recommended GPU: ${bestFitGpu.status === 'oom' ? 'Multi-Node (>640 GB)' : bestFitGpu.name} ($${bestFitGpu.hourlyUsd.toFixed(2)}/hr)`,
    `- Monthly Cost (${dailyRequests.toLocaleString()} req/day): API $${costSummary.monthlyApiUsd.toFixed(0)}/mo vs Self-Host $${costSummary.monthlyGpuUsd.toFixed(0)}/mo`
  ].join('\n');

  const handleCopySummary = () => {
    navigator.clipboard.writeText(cheatSheetText);
    setCopiedFormula(true);
    setTimeout(() => setCopiedFormula(false), 2000);
  };

  const weightsPct = Math.max(4, (vram.weightsGb / Math.max(0.1, vram.totalGb)) * 100);
  const trainPct = (vram.trainingOverheadGb / Math.max(0.1, vram.totalGb)) * 100;
  const kvPct = (vram.kvCacheGb / Math.max(0.1, vram.totalGb)) * 100;
  const actPct = Math.max(2, 100 - weightsPct - trainPct - kvPct);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="p-6 sm:p-8 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-cyan-400">
              <Cpu className="w-4 h-4" />
              <span>GPU VRAM & LLM COST CALCULATOR</span>
              <span aria-hidden="true">·</span>
              <span>SYSTEM DESIGN & HARDWARE SIZING</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {language === 'hinglish'
                ? 'Model Size, Precision & Context se Exact GPU VRAM aur Monthly Cost Calculate Karein'
                : 'Calculate Exact GPU VRAM, Best Hardware Fit & API vs. Self-Host Cost'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {language === 'hinglish'
                ? '7B, 14B ya 70B model ke liye T4, L4, A100 ya H100 mein se kaunsa GPU lagega — aur kya API sasta padega ya khud GPU rent karna? Live sliders se check karein.'
                : 'Dial in parameter count, quantization, context window, and daily traffic to size Weights + KV-Cache + Optimizer memory and benchmark cloud GPU costs against managed APIs.'}
            </p>
          </div>

          <button
            type="button"
            onClick={handleCopySummary}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors cursor-pointer whitespace-nowrap shrink-0 self-start"
          >
            {copiedFormula ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-cyan-400" />
            )}
            <span>{copiedFormula ? 'Copied Spec!' : 'Copy Sizing Spec'}</span>
          </button>
        </div>
      </div>

      {/* Main Split Grid: Left Controls, Right Live Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Controls Panel */}
        <div className="lg:col-span-5 space-y-5 p-5 sm:p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Model & Workload Parameters</span>
            </h3>
            <span className="text-xs font-mono tabular-nums text-indigo-600 dark:text-indigo-400 font-semibold">
              {customParamsB}B Params
            </span>
          </div>

          {/* Model Size Presets */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Model Preset</span>
              <span className="text-slate-500 dark:text-slate-400 truncate max-w-[210px]">
                {preset.exampleModels}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {MODEL_PRESETS.map((p) => {
                const active = p.id === selectedPresetId && customParamsB === p.paramsB;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectPreset(p)}
                    className={`px-2.5 py-2 text-xs font-mono font-semibold rounded-lg border transition-colors cursor-pointer whitespace-nowrap ${
                      active
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
            <div className="pt-1">
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                <span>Custom Parameters</span>
                <span className="font-mono tabular-nums font-semibold text-slate-700 dark:text-slate-200">
                  {customParamsB}B
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={405}
                step={1}
                value={customParamsB}
                onChange={(e) => setCustomParamsB(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
                aria-label="Model parameter count in billions"
              />
            </div>
          </div>

          {/* Workload Mode */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Workload Mode
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: 'inference' as WorkloadMode, label: 'Inference (Serving)' },
                { id: 'qlora' as WorkloadMode, label: '4-bit QLoRA Tune' },
                { id: 'lora' as WorkloadMode, label: 'LoRA Fine-Tune' },
                { id: 'full-ft' as WorkloadMode, label: 'Full Fine-Tune (AdamW)' }
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setWorkload(m.id);
                    if (m.id === 'qlora') setPrecision('int4');
                    if (m.id === 'full-ft') setPrecision('fp16');
                  }}
                  className={`px-3 py-2 text-xs font-semibold rounded-lg border text-left transition-colors cursor-pointer ${
                    workload === m.id
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Precision Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Weight Precision / Quantization
              </span>
              <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                {precision === 'fp16'
                  ? '2.0 B/param'
                  : precision === 'int8'
                  ? '1.05 B/param'
                  : '0.56 B/param'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              {[
                { id: 'fp16' as PrecisionType, label: 'FP16 / BF16' },
                { id: 'int8' as PrecisionType, label: 'INT8 / FP8' },
                { id: 'int4' as PrecisionType, label: '4-bit AWQ/QLoRA' }
              ].map((pr) => {
                const disabled =
                  (workload === 'qlora' && pr.id !== 'int4') ||
                  (workload === 'full-ft' && pr.id !== 'fp16');
                return (
                  <button
                    key={pr.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => setPrecision(pr.id)}
                    className={`px-2 py-2 text-[11px] font-mono font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                      precision === pr.id
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {pr.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Context Window */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Context Window (seq_len)
              </span>
              <span className="font-mono tabular-nums font-bold text-indigo-600 dark:text-indigo-400">
                {(contextLen / 1024).toFixed(0)}K tokens
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {CONTEXT_OPTIONS.map((ctx) => (
                <button
                  key={ctx}
                  type="button"
                  onClick={() => setContextLen(ctx)}
                  className={`px-2.5 py-1.5 text-xs font-mono rounded-lg border transition-colors cursor-pointer ${
                    contextLen === ctx
                      ? 'bg-indigo-600 text-white border-indigo-600 font-semibold'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {ctx / 1024}K
                </button>
              ))}
            </div>
          </div>

          {/* Batch Size & Attention Optimizations */}
          <div className="space-y-3 pt-1">
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Concurrent Requests (Batch Size)
                </span>
                <span className="font-mono tabular-nums font-bold text-indigo-600 dark:text-indigo-400">
                  {batchSize} concurrent
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={32}
                step={1}
                value={batchSize}
                onChange={(e) => setBatchSize(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
                aria-label="Concurrent batch size"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setUseGqa((prev) => !prev)}
                className={`px-3 py-2 text-xs rounded-xl border text-left transition-colors cursor-pointer ${
                  useGqa
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 font-semibold'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                <div>Attention: {useGqa ? 'GQA (Modern)' : 'Legacy MHA'}</div>
                <div className="text-[10px] opacity-80 font-mono">
                  {vram.kvHeads} KV heads
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFp8KvCache((prev) => !prev)}
                className={`px-3 py-2 text-xs rounded-xl border text-left transition-colors cursor-pointer ${
                  fp8KvCache
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 font-semibold'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                <div>KV-Cache: {fp8KvCache ? 'FP8 (50% RAM)' : 'FP16 Standard'}</div>
                <div className="text-[10px] opacity-80 font-mono">
                  {vram.kvBytes} byte/elem
                </div>
              </button>
            </div>
          </div>

          {/* Monthly API Traffic Inputs */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Monthly Production Traffic (Cost Check)
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-700 dark:text-slate-300 font-medium">
                  Daily API Requests
                </span>
                <span className="font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                  {dailyRequests.toLocaleString()} / day
                </span>
              </div>
              <input
                type="range"
                min={500}
                max={200000}
                step={500}
                value={dailyRequests}
                onChange={(e) => setDailyRequests(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
                aria-label="Daily requests"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                  Avg Input Tokens / Req
                </label>
                <input
                  type="number"
                  min={50}
                  max={128000}
                  step={100}
                  value={avgInputTokens}
                  onChange={(e) => setAvgInputTokens(Math.max(10, Number(e.target.value) || 100))}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 font-mono tabular-nums text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                  Avg Output Tokens / Req
                </label>
                <input
                  type="number"
                  min={20}
                  max={16000}
                  step={50}
                  value={avgOutputTokens}
                  onChange={(e) => setAvgOutputTokens(Math.max(10, Number(e.target.value) || 50))}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 font-mono tabular-nums text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] text-slate-500 dark:text-slate-400">
                Managed API Benchmark Tier
              </label>
              <select
                value={apiTierId}
                onChange={(e) => setApiTierId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              >
                {API_TIERS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setDutyCycle('24x7')}
                className={`flex-1 py-1.5 rounded-lg font-semibold cursor-pointer transition-colors ${
                  dutyCycle === '24x7'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                24×7 Prod (730h/mo)
              </button>
              <button
                type="button"
                onClick={() => setDutyCycle('8h-day')}
                className={`flex-1 py-1.5 rounded-lg font-semibold cursor-pointer transition-colors ${
                  dutyCycle === '8h-day'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                8h/Day Dev (240h/mo)
              </button>
            </div>
          </div>
        </div>

        {/* Right: Results, Memory Bar, GPU Fit Table & Cost Verdict */}
        <div className="lg:col-span-7 space-y-6">
          {/* Top Summary Metrics */}
          <div className="p-5 sm:p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div>
                <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
                  TOTAL GPU MEMORY REQUIRED
                </div>
                <div className="text-3xl sm:text-4xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
                  {vram.totalGb.toFixed(1)} GB
                </div>
              </div>
              <div className="text-left sm:text-right">
                <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
                  BEST FITTING GPU
                </div>
                <div className="text-base font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                  {bestFitGpu.status === 'oom'
                    ? 'Multi-Node Cluster (>640 GB)'
                    : bestFitGpu.name}
                </div>
                <div className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                  ${bestFitGpu.hourlyUsd.toFixed(2)}/hr · {bestFitGpu.estSingleStreamTokPerSec} tok/s est.
                </div>
              </div>
            </div>

            {/* Stacked VRAM Proportion Bar */}
            <div className="space-y-2">
              <div className="h-4 w-full rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 flex">
                <div
                  style={{ width: `${weightsPct}%` }}
                  className="bg-indigo-600 h-full"
                  title={`Model Weights: ${vram.weightsGb.toFixed(1)} GB`}
                />
                {vram.trainingOverheadGb > 0 && (
                  <div
                    style={{ width: `${trainPct}%` }}
                    className="bg-rose-500 h-full"
                    title={`Gradients & Optimizer: ${vram.trainingOverheadGb.toFixed(1)} GB`}
                  />
                )}
                <div
                  style={{ width: `${kvPct}%` }}
                  className="bg-cyan-500 h-full"
                  title={`KV-Cache: ${vram.kvCacheGb.toFixed(2)} GB`}
                />
                <div
                  style={{ width: `${actPct}%` }}
                  className="bg-amber-400 h-full"
                  title={`Activations & CUDA Buffer: ${vram.activationsGb.toFixed(1)} GB`}
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-xs">
                <div className="flex items-center justify-between sm:block p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                  <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                    <span className="w-2.5 h-2.5 rounded-xs bg-indigo-600 shrink-0" />
                    <span>Weights</span>
                  </div>
                  <div className="font-mono tabular-nums font-bold text-slate-900 dark:text-white mt-0.5">
                    {vram.weightsGb.toFixed(1)} GB
                  </div>
                </div>

                <div className="flex items-center justify-between sm:block p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                  <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                    <span className="w-2.5 h-2.5 rounded-xs bg-cyan-500 shrink-0" />
                    <span>KV-Cache</span>
                  </div>
                  <div className="font-mono tabular-nums font-bold text-slate-900 dark:text-white mt-0.5">
                    {vram.kvCacheGb.toFixed(2)} GB
                  </div>
                </div>

                <div className="flex items-center justify-between sm:block p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                  <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                    <span className="w-2.5 h-2.5 rounded-xs bg-amber-400 shrink-0" />
                    <span>CUDA/Act.</span>
                  </div>
                  <div className="font-mono tabular-nums font-bold text-slate-900 dark:text-white mt-0.5">
                    {vram.activationsGb.toFixed(1)} GB
                  </div>
                </div>

                <div className="flex items-center justify-between sm:block p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                  <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                    <span className="w-2.5 h-2.5 rounded-xs bg-rose-500 shrink-0" />
                    <span>Grads/Opt</span>
                  </div>
                  <div className="font-mono tabular-nums font-bold text-slate-900 dark:text-white mt-0.5">
                    {vram.trainingOverheadGb.toFixed(1)} GB
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* API vs Self-Hosting Cost Comparison */}
          <div className="p-5 sm:p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>API vs. Self-Hosted GPU Monthly Cost</span>
              </h3>
              <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                {costSummary.monthlyInputTokensM.toFixed(1)}M in ·{' '}
                {costSummary.monthlyOutputTokensM.toFixed(1)}M out / mo
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                className={`p-4 rounded-xl border ${
                  costSummary.cheaperOption === 'api'
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800'
                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                  <span className="flex items-center gap-1.5 font-semibold">
                    <Cloud className="w-3.5 h-3.5 text-indigo-500" />
                    Managed API
                  </span>
                  {costSummary.cheaperOption === 'api' && (
                    <span className="font-mono text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                      CHEAPER OPTION
                    </span>
                  )}
                </div>
                <div className="text-2xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white mt-2">
                  ${costSummary.monthlyApiUsd.toFixed(0)}
                  <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                    /month
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  {costSummary.tier.note}
                </div>
              </div>

              <div
                className={`p-4 rounded-xl border ${
                  costSummary.cheaperOption === 'self-host'
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800'
                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                  <span className="flex items-center gap-1.5 font-semibold">
                    <Server className="w-3.5 h-3.5 text-cyan-500" />
                    Self-Host ({bestFitGpu.name})
                  </span>
                  {costSummary.cheaperOption === 'self-host' && (
                    <span className="font-mono text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                      CHEAPER OPTION
                    </span>
                  )}
                </div>
                <div className="text-2xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white mt-2">
                  ${costSummary.monthlyGpuUsd.toFixed(0)}
                  <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                    /month
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono tabular-nums">
                  {costSummary.monthlyHours} hrs × ${bestFitGpu.hourlyUsd.toFixed(2)}/hr
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2.5">
              <Zap className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                {costSummary.cheaperOption === 'api'
                  ? language === 'hinglish'
                    ? `Is traffic (${dailyRequests.toLocaleString()} req/day) par Managed API lagbhag $${costSummary.monthlySavingsUsd.toFixed(0)}/month sasta padega. Khud GPU tab rent karein jab daily requests badhein ya strict data-privacy / custom LoRA serving chahiye.`
                    : `At ${dailyRequests.toLocaleString()} requests/day, Managed API saves ~$${costSummary.monthlySavingsUsd.toFixed(0)}/month with zero DevOps overhead. Self-hosting wins only at higher token volume or strict on-prem privacy.`
                  : language === 'hinglish'
                    ? `High traffic par ${bestFitGpu.name} self-host karna $${costSummary.monthlySavingsUsd.toFixed(0)}/month bachata hai! vLLM ya SGLang continuous batching ke saath serve karein.`
                    : `At this traffic volume, self-hosting on ${bestFitGpu.name} saves ~$${costSummary.monthlySavingsUsd.toFixed(0)}/month over this API tier when paired with vLLM continuous batching.`}
              </p>
            </div>
          </div>

          {/* Hardware Fit Matrix Table */}
          <div className="p-5 sm:p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>GPU Fit & Throughput Matrix</span>
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Required: <strong className="font-mono tabular-nums">{vram.totalGb.toFixed(1)} GB</strong>
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                    <th className="py-2 pr-3 font-semibold">GPU Setup</th>
                    <th className="py-2 px-3 font-semibold text-right">VRAM</th>
                    <th className="py-2 px-3 font-semibold">Fit Status</th>
                    <th className="py-2 px-3 font-semibold text-right">Est. Speed</th>
                    <th className="py-2 pl-3 font-semibold text-right">Cloud Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {gpuEvaluations.map((gpu) => (
                    <tr
                      key={gpu.id}
                      className={
                        gpu.id === bestFitGpu.id && gpu.status !== 'oom'
                          ? 'bg-indigo-50/60 dark:bg-indigo-950/30'
                          : ''
                      }
                    >
                      <td className="py-2.5 pr-3">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {gpu.name}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {gpu.tierNote}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                        {gpu.totalVramGb} GB
                      </td>
                      <td className="py-2.5 px-3">
                        {gpu.status === 'fit' && (
                          <span className="inline-flex items-center gap-1 font-mono font-semibold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            FITS (+{gpu.headroom.toFixed(1)} GB)
                          </span>
                        )}
                        {gpu.status === 'tight' && (
                          <span className="inline-flex items-center gap-1 font-mono font-semibold text-amber-600 dark:text-amber-400 whitespace-nowrap">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            TIGHT (+{gpu.headroom.toFixed(1)} GB)
                          </span>
                        )}
                        {gpu.status === 'oom' && (
                          <span className="inline-flex items-center gap-1 font-mono text-rose-600 dark:text-rose-400 whitespace-nowrap">
                            <XCircle className="w-3.5 h-3.5" />
                            OOM ({gpu.headroom.toFixed(1)} GB)
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                        {gpu.status === 'oom' ? '—' : `~${gpu.estSingleStreamTokPerSec} tok/s`}
                      </td>
                      <td className="py-2.5 pl-3 text-right font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
                        ${gpu.hourlyUsd.toFixed(2)}/hr
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
