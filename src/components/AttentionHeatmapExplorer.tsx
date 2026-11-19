import React, { useMemo, useState } from 'react';
import { Sparkles, Eye, Layers, Thermometer, Shield } from 'lucide-react';
import { Language } from '../types';

interface AttentionHeatmapExplorerProps {
  language: Language;
}

// Simulated BPE subword tokenizer reflecting realistic GPT/Llama subword splits
function tokenizeBpeStyle(sentence: string): Array<{ id: number; token: string; cleanWord: string }> {
  const words = sentence.trim().split(/\s+/).filter(Boolean).slice(0, 12);
  const tokens: Array<{ id: number; token: string; cleanWord: string }> = [];
  let fakeIdBase = 1400;

  for (const raw of words) {
    // Split common suffixes/prefixes to illustrate subword tokenization accurately
    const suffixMatch = raw.match(/^([a-zA-Z]{4,}?)(ing|tion|ment|ness|ed|ly|s)([.,!?;:]*)$/);
    if (suffixMatch) {
      tokens.push({
        id: fakeIdBase + (raw.charCodeAt(0) * 17) % 8000,
        token: suffixMatch[1],
        cleanWord: raw.toLowerCase()
      });
      tokens.push({
        id: 2100 + (suffixMatch[2].charCodeAt(0) * 13) % 4000,
        token: `##${suffixMatch[2]}${suffixMatch[3] || ''}`,
        cleanWord: raw.toLowerCase()
      });
    } else if (raw.length > 9 && /^[a-zA-Z]+$/.test(raw)) {
      const mid = Math.ceil(raw.length / 2);
      tokens.push({
        id: fakeIdBase + (raw.charCodeAt(0) * 23) % 7000,
        token: raw.slice(0, mid),
        cleanWord: raw.toLowerCase()
      });
      tokens.push({
        id: 3400 + (raw.charCodeAt(mid) * 19) % 5000,
        token: `##${raw.slice(mid)}`,
        cleanWord: raw.toLowerCase()
      });
    } else {
      tokens.push({
        id: fakeIdBase + ((raw.charCodeAt(0) * 31 + raw.length * 7) % 9000),
        token: raw,
        cleanWord: raw.toLowerCase()
      });
    }
  }
  return tokens.slice(0, 14);
}

// Deterministic semantic vector (8 dims) capturing word identity, syntax role & positional affinity
function tokenEmbedding(token: string, pos: number): number[] {
  const clean = token.replace(/^##/, '').toLowerCase();
  const isEntityOrNoun = /transformer|model|neural|agent|rag|memory|attention|ai|vector|cat|dog|database|user/.test(clean) ? 1.0 : 0.2;
  const isAction = /attend|predict|retrieve|train|learns|computes|runs|sits|maps|scales/.test(clean) ? 1.0 : 0.25;
  const isPronoun = /^(it|its|they|this|that|which|he|she)$/.test(clean) ? 1.15 : 0.1;

  const h1 = ((clean.charCodeAt(0) || 65) % 13) / 13;
  const h2 = ((clean.charCodeAt(clean.length - 1) || 70) % 11) / 11;
  return [
    isEntityOrNoun,
    isAction,
    isPronoun,
    Math.sin(pos / 2.5) * 0.5 + 0.5,
    Math.cos(pos / 2.5) * 0.5 + 0.5,
    h1,
    h2,
    isPronoun > 0.5 ? 0.95 : isEntityOrNoun // Pronoun-to-noun attraction signal
  ];
}

export const AttentionHeatmapExplorer: React.FC<AttentionHeatmapExplorerProps> = ({
  language
}) => {
  const [sentence, setSentence] = useState<string>(
    'The transformer attends strongly when it predicts tokens cleanly.'
  );
  const [selectedTokenIdx, setSelectedTokenIdx] = useState<number>(5);
  const [temperature, setTemperature] = useState<number>(0.7);
  const [causalMask, setCausalMask] = useState<boolean>(true);
  const [activeHead, setActiveHead] = useState<'semantic' | 'positional'>('semantic');

  const tokens = useMemo(() => tokenizeBpeStyle(sentence), [sentence]);
  const safeSelectedIdx = tokens.length > 0 ? Math.min(selectedTokenIdx, tokens.length - 1) : 0;

  // Compute Q * K^T / sqrt(d_k) + softmax with Temperature T
  const { attentionMatrix, logitValues } = useMemo(() => {
    const n = tokens.length;
    if (n === 0) return { attentionMatrix: [] as number[][], logitValues: [] as number[][] };

    const d_k = 8;
    const embeds = tokens.map((t, i) => tokenEmbedding(t.token, i));
    const rawLogits: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
    const weights: number[][] = Array.from({ length: n }, () => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (causalMask && j > i) {
          rawLogits[i][j] = -1e9;
          continue;
        }
        let dot = 0;
        for (let k = 0; k < d_k; k++) {
          dot += embeds[i][k] * embeds[j][k];
        }
        if (activeHead === 'semantic') {
          // Pronouns attend back strongly to early entity nouns
          const iPronoun = embeds[i][2] > 0.8;
          const jNoun = embeds[j][0] > 0.8;
          if (iPronoun && jNoun) dot += 2.1;
          if (i === j) dot += 0.65;
        } else {
          // Positional head emphasizes adjacent tokens & local neighbors
          const dist = Math.abs(i - j);
          dot += Math.max(0, 2.2 - dist * 0.65);
        }

        rawLogits[i][j] = dot / Math.sqrt(d_k);
      }

      const scaled = rawLogits[i].map((v) =>
        v < -1e6 ? -1e9 : v / Math.max(0.1, temperature)
      );
      const validVals = scaled.filter((v) => v > -1e6);
      const maxVal = validVals.length > 0 ? Math.max(...validVals) : 0;
      const exps = scaled.map((v) => (v < -1e6 ? 0 : Math.exp(v - maxVal)));
      const sumExp = exps.reduce((a, b) => a + b, 0) || 1;
      weights[i] = exps.map((e) => e / sumExp);
    }

    return { attentionMatrix: weights, logitValues: rawLogits };
  }, [tokens, temperature, causalMask, activeHead]);

  // Sinusoidal Positional Encoding waves for selected dim pairs
  const posWavePoints = useMemo(() => {
    const count = Math.max(8, tokens.length);
    const dims = [0, 2, 4];
    return dims.map((dimIdx) => {
      const freq = 1 / Math.pow(10000, dimIdx / 8);
      return Array.from({ length: count }, (_, pos) => Math.sin(pos * freq * 3));
    });
  }, [tokens.length]);

  const activeRowWeights = attentionMatrix[safeSelectedIdx] || [];
  const activeToken = tokens[safeSelectedIdx];

  // Calculate Shannon entropy of active attention distribution
  const entropy = useMemo(() => {
    return activeRowWeights.reduce((acc, p) => (p > 1e-4 ? acc - p * Math.log2(p) : acc), 0);
  }, [activeRowWeights]);

  return (
    <div className="p-5 sm:p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
            <Sparkles className="w-4 h-4" />
            <span>TRANSFORMER & SELF-ATTENTION HEATMAP EXPLORER</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
            {language === 'hinglish'
              ? 'Live BPE Tokenization, Attention Matrix & Softmax Temperature Playground'
              : 'Interactive Self-Attention, BPE Tokens & Positional Wave Inspector'}
          </h2>
        </div>

        {/* Head & Causal Mask Toggles */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="flex p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setActiveHead('semantic')}
              className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer ${
                activeHead === 'semantic'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Head 1: Semantic
            </button>
            <button
              type="button"
              onClick={() => setActiveHead('positional')}
              className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer ${
                activeHead === 'positional'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Head 2: Local Window
            </button>
          </div>

          <button
            type="button"
            onClick={() => setCausalMask((m) => !m)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer ${
              causalMask
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>{causalMask ? 'Causal Mask: ON (Decoder)' : 'Bidirectional (Encoder)'}</span>
          </button>
        </div>
      </div>

      {/* Input Sentence + Temperature Slider */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
        <div className="lg:col-span-8 space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
            Type any sentence (max 12 words) & click any token below to inspect its Query attention:
          </label>
          <input
            type="text"
            value={sentence}
            onChange={(e) => setSentence(e.target.value)}
            placeholder="e.g. The transformer attends strongly when it predicts tokens"
            className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="lg:col-span-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
              <Thermometer className="w-3.5 h-3.5 text-amber-500" />
              Softmax Temp (T):
            </span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400">
              {temperature.toFixed(1)} · H={entropy.toFixed(2)} bits
            </span>
          </div>
          <input
            type="range"
            min={0.1}
            max={2.5}
            step={0.1}
            value={temperature}
            onChange={(e) => setTemperature(Number(e.target.value))}
            className="w-full accent-indigo-600 cursor-pointer"
          />
        </div>
      </div>

      {/* BPE Subword Tokenization Strip */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-500" />
            <span>BPE Subword Tokens ({tokens.length}) — Click a Query Token</span>
          </span>
          {activeToken && (
            <span className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
              Selected Query: [{safeSelectedIdx}] &quot;{activeToken.token}&quot; (ID #{activeToken.id})
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {tokens.map((t, idx) => {
            const weightOnSelected = activeRowWeights[idx] ?? 0;
            const isSelected = idx === safeSelectedIdx;
            return (
              <button
                key={`${t.id}-${idx}`}
                type="button"
                onClick={() => setSelectedTokenIdx(idx)}
                className={`px-2.5 py-1.5 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-600 ring-2 ring-indigo-400/40'
                    : 'bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                }`}
              >
                <div className="font-mono text-xs font-bold">{t.token}</div>
                <div className="text-[10px] font-mono opacity-80 flex items-center justify-between gap-2">
                  <span>#{t.id}</span>
                  <span>{Math.round(weightOnSelected * 100)}%</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Side-by-Side: Selected Query Bar Distribution + Full 2D Attention Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5 p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
            <span className="flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-indigo-500" />
              <span>Attention Distribution from &quot;{activeToken?.token || ''}&quot;</span>
            </span>
          </div>

          <div className="space-y-2">
            {tokens.map((kTok, j) => {
              const w = activeRowWeights[j] ?? 0;
              const pct = Math.round(w * 100);
              const maskedOut = causalMask && j > safeSelectedIdx;
              const rawLogit = logitValues[safeSelectedIdx]?.[j];
              return (
                <div key={j} className="space-y-1 text-xs">
                  <div className="flex items-center justify-between font-mono text-[11px]">
                    <span className="text-slate-700 dark:text-slate-300">
                      [{j}] {kTok.token}
                    </span>
                    <span className="text-slate-500 tabular-nums">
                      {maskedOut
                        ? '-∞ (masked)'
                        : `${pct}% (z=${rawLogit !== undefined ? rawLogit.toFixed(2) : '0'})`}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 dark:bg-indigo-400 transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Full N x N Attention Heatmap + Sinusoidal Positional Waves */}
        <div className="lg:col-span-7 space-y-5">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-3 overflow-x-auto">
            <div className="text-xs font-bold text-slate-900 dark:text-white">
              Self-Attention Matrix (Rows = Query, Cols = Key)
            </div>
            <div className="inline-block min-w-full">
              <table className="border-collapse text-[10px] font-mono">
                <thead>
                  <tr>
                    <th className="p-1 text-left text-slate-400">Q \ K</th>
                    {tokens.map((t, j) => (
                      <th
                        key={j}
                        className="p-1 text-center text-slate-500 dark:text-slate-400 max-w-[54px] truncate"
                      >
                        {t.token}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tokens.map((rowTok, i) => (
                    <tr key={i}>
                      <td
                        onClick={() => setSelectedTokenIdx(i)}
                        className={`p-1 pr-2 font-semibold cursor-pointer whitespace-nowrap ${
                          i === safeSelectedIdx
                            ? 'text-indigo-600 dark:text-indigo-400'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {rowTok.token}
                      </td>
                      {tokens.map((_, j) => {
                        const weight = attentionMatrix[i]?.[j] ?? 0;
                        const masked = causalMask && j > i;
                        return (
                          <td
                            key={j}
                            onClick={() => setSelectedTokenIdx(i)}
                            title={`${rowTok.token} -> ${tokens[j].token}: ${(weight * 100).toFixed(1)}%`}
                            className="p-0.5 cursor-pointer"
                          >
                            <div
                              className={`w-8 h-7 rounded flex items-center justify-center tabular-nums border ${
                                masked
                                  ? 'bg-slate-200/50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400'
                                  : 'border-indigo-500/20 text-white font-bold'
                              }`}
                              style={
                                masked
                                  ? undefined
                                  : {
                                      backgroundColor: `rgba(79, 70, 229, ${Math.max(
                                        0.08,
                                        Math.min(0.96, weight * 1.65)
                                      )})`,
                                      color: weight > 0.25 ? '#ffffff' : undefined
                                    }
                              }
                            >
                              {masked ? '—' : Math.round(weight * 100)}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sinusoidal Positional Encoding Curves */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-900 dark:text-white">
                Sinusoidal Positional Encoding Waves (Low / Mid / High Freq)
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                PE(pos, 2i) = sin(pos / 10000^(2i/d))
              </span>
            </div>
            <svg viewBox="0 0 360 72" className="w-full h-16 overflow-visible">
              <line x1="0" y1="36" x2="360" y2="36" stroke="currentColor" className="text-slate-300 dark:text-slate-700" strokeDasharray="3 3" />
              {posWavePoints.map((wave, wIdx) => {
                const colors = ['#6366f1', '#10b981', '#f59e0b'];
                const d = wave
                  .map((val, posIdx) => {
                    const x = (posIdx / Math.max(1, wave.length - 1)) * 350 + 5;
                    const y = 36 - val * 26;
                    return `${posIdx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
                  })
                  .join(' ');
                return (
                  <path
                    key={wIdx}
                    d={d}
                    fill="none"
                    stroke={colors[wIdx]}
                    strokeWidth="2"
                  />
                );
              })}
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};
