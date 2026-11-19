import React, { useMemo, useState } from 'react';
import {
  SlidersHorizontal,
  Sparkles,
  Search,
  AlertTriangle,
  CheckCircle2,
  Database,
  Play,
  Loader2
} from 'lucide-react';
import { Language } from '../types';
import { RAG_SAMPLE_DOCS } from '../data/codingLabsData';

interface InteractiveRagLabProps {
  language: Language;
}

interface ComputedChunk {
  index: number;
  start: number;
  end: number;
  text: string;
  overlapChars: number;
  score: number;
  matchedTerms: string[];
}

function tokenize(str: string): string[] {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9.\-]+/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 2);
}

const STOP_WORDS = new Set([
  'the',
  'and',
  'for',
  'with',
  'what',
  'when',
  'where',
  'how',
  'much',
  'does',
  'that',
  'this',
  'from',
  'into',
  'are',
  'can',
  'you',
  'which'
]);

export const InteractiveRagLab: React.FC<InteractiveRagLabProps> = ({ language }) => {
  const [selectedDocId, setSelectedDocId] = useState<string>(RAG_SAMPLE_DOCS[0].id);
  const selectedDoc =
    RAG_SAMPLE_DOCS.find((d) => d.id === selectedDocId) || RAG_SAMPLE_DOCS[0];

  const [docText, setDocText] = useState<string>(selectedDoc.content);
  const [query, setQuery] = useState<string>(selectedDoc.suggestedQueries[0]);
  const [chunkSize, setChunkSize] = useState<number>(280);
  const [overlap, setOverlap] = useState<number>(60);
  const [topK, setTopK] = useState<number>(3);
  const [temperature, setTemperature] = useState<number>(0.2);
  const [systemPrompt, setSystemPrompt] = useState<string>(
    'Answer strictly using the retrieved chunks. Cite [Chunk #]. If any metric or detail is absent, state that clearly instead of guessing.'
  );

  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [ragAnswer, setRagAnswer] = useState<string | null>(null);
  const [ragModelUsed, setRagModelUsed] = useState<string | null>(null);
  const [simError, setSimError] = useState<string | null>(null);

  const handleSelectDoc = (docId: string) => {
    const found = RAG_SAMPLE_DOCS.find((d) => d.id === docId) || RAG_SAMPLE_DOCS[0];
    setSelectedDocId(found.id);
    setDocText(found.content);
    setQuery(found.suggestedQueries[0]);
    setRagAnswer(null);
    setSimError(null);
  };

  // Compute chunks + overlap + token similarity ranking in real time
  const { allChunks, topChunks, diagnostics } = useMemo(() => {
    const safeChunk = Math.max(80, chunkSize);
    const safeOverlap = Math.min(safeChunk - 20, Math.max(0, overlap));
    const step = Math.max(20, safeChunk - safeOverlap);

    const queryTerms = tokenize(query).filter((t) => !STOP_WORDS.has(t));
    const uniqueQuery = Array.from(new Set(queryTerms));

    const built: ComputedChunk[] = [];
    for (let start = 0; start < docText.length; start += step) {
      const end = Math.min(docText.length, start + safeChunk);
      const slice = docText.slice(start, end);
      const chunkTerms = new Set(tokenize(slice));
      const matched = uniqueQuery.filter((qt) => chunkTerms.has(qt));
      const coverageScore =
        uniqueQuery.length > 0 ? matched.length / uniqueQuery.length : 0;

      // Length normalization bump so tiny fragmented chunks score realistically lower
      const completenessFactor = slice.length >= 160 ? 1 : 0.72;
      const score = Number(Math.min(0.99, coverageScore * completenessFactor).toFixed(2));

      built.push({
        index: built.length + 1,
        start,
        end,
        text: slice,
        overlapChars: start === 0 ? 0 : safeOverlap,
        score,
        matchedTerms: matched
      });

      if (end >= docText.length) break;
    }

    const sorted = [...built].sort((a, b) => b.score - a.score);
    const picked = sorted.slice(0, topK);

    // Explain visually WHY retrieval succeeds or fails
    const diagList: Array<{ ok: boolean; msg: string }> = [];
    if (safeChunk < 180) {
      diagList.push({
        ok: false,
        msg: `Small Chunk Size (${safeChunk} chars) fragments key numbers/entities across separate chunks.`
      });
    } else {
      diagList.push({
        ok: true,
        msg: `Balanced Chunk Size (${safeChunk} chars) preserves full engineering claims & context.`
      });
    }

    if (safeOverlap < 25) {
      diagList.push({
        ok: false,
        msg: `Low Overlap (${safeOverlap} chars): sentences sitting on boundaries risk losing subject/pronoun links.`
      });
    } else {
      diagList.push({
        ok: true,
        msg: `Overlap Buffer (${safeOverlap} chars) bridges sentence cuts across chunk borders.`
      });
    }

    const bestScore = picked[0]?.score ?? 0;
    if (bestScore < 0.35) {
      diagList.push({
        ok: false,
        msg: 'Low lexical/semantic overlap (<0.35): query terms do not align strongly — risk of retrieval miss!'
      });
    } else {
      diagList.push({
        ok: true,
        msg: `Top-${topK} retrieval captured strong signal (top score ${bestScore.toFixed(2)}).`
      });
    }

    if (temperature > 0.6) {
      diagList.push({
        ok: false,
        msg: `High Temperature (${temperature.toFixed(1)}): increases hallucination risk on strict factual QA.`
      });
    }

    return {
      allChunks: built,
      topChunks: picked,
      diagnostics: diagList
    };
  }, [docText, query, chunkSize, overlap, topK, temperature]);

  const topChunkIndices = new Set(topChunks.map((c) => c.index));

  const handleRunRagSimulation = async () => {
    setIsSimulating(true);
    setSimError(null);
    setRagAnswer(null);
    try {
      const res = await fetch('/api/rag/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          systemPrompt,
          temperature,
          language,
          retrievedChunks: topChunks.map((c) => ({
            index: c.index,
            score: c.score,
            text: c.text
          }))
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'RAG simulation failed.');
      }
      setRagAnswer(data.answer);
      setRagModelUsed(data.modelUsed || 'gemini-4-hydrogen');
    } catch (err: any) {
      setSimError(err?.message || 'Unable to reach Gemini RAG endpoint.');
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Controls & Knowledge Document */}
        <div className="lg:col-span-5 p-5 sm:p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
              <SlidersHorizontal className="w-4 h-4" />
              <span>RAG HYPERPARAMETERS</span>
            </div>
            <select
              value={selectedDocId}
              onChange={(e) => handleSelectDoc(e.target.value)}
              className="px-2.5 py-1 text-xs rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              aria-label="Select RAG sample knowledge document"
            >
              {RAG_SAMPLE_DOCS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.category}
                </option>
              ))}
            </select>
          </div>

          {/* Sliders */}
          <div className="space-y-3.5 text-xs">
            <div className="space-y-1">
              <div className="flex justify-between font-mono">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Chunk Size</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">{chunkSize} chars</span>
              </div>
              <input
                type="range"
                min={100}
                max={550}
                step={20}
                value={chunkSize}
                onChange={(e) => setChunkSize(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between font-mono">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Chunk Overlap</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{overlap} chars</span>
              </div>
              <input
                type="range"
                min={0}
                max={160}
                step={10}
                value={overlap}
                onChange={(e) => setOverlap(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex justify-between font-mono">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Top-K</span>
                  <span className="font-bold text-purple-600 dark:text-purple-400">k = {topK}</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={6}
                  step={1}
                  value={topK}
                  onChange={(e) => setTopK(Number(e.target.value))}
                  className="w-full accent-purple-600 cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between font-mono">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Temperature</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">{temperature.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1.2}
                  step={0.1}
                  value={temperature}
                  onChange={(e) => setTemperature(Number(e.target.value))}
                  className="w-full accent-amber-600 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* System Prompt */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              System Prompt Instruction
            </label>
            <textarea
              rows={2}
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              className="w-full p-2.5 text-xs font-mono rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Editable Source Document */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-indigo-500" />
                <span>Knowledge Document ({docText.length} chars)</span>
              </span>
            </div>
            <textarea
              rows={5}
              value={docText}
              onChange={(e) => setDocText(e.target.value)}
              className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Right Side: Query + Visual Chunk Boundaries + Diagnostics + Gemini Output */}
        <div className="lg:col-span-7 space-y-5">
          {/* Query Bar & Suggested Queries */}
          <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              User Retrieval Query
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button
                type="button"
                disabled={isSimulating}
                onClick={handleRunRagSimulation}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white cursor-pointer whitespace-nowrap"
              >
                {isSimulating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                <span>Run RAG Answer</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {selectedDoc.suggestedQueries.map((sq, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setQuery(sq)}
                  className="px-2.5 py-1 text-[11px] rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 cursor-pointer text-left"
                >
                  {sq}
                </button>
              ))}
            </div>
          </div>

          {/* Why Retrieval Succeeds / Fails Diagnostics */}
          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Retrieval Pipeline Diagnostics ({allChunks.length} total chunks · showing Top-{topK})
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {diagnostics.map((d, i) => (
                <div
                  key={i}
                  className={`p-2.5 rounded-xl border text-xs flex items-start gap-2 ${
                    d.ok
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/70 text-emerald-900 dark:text-emerald-200'
                      : 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/70 text-amber-900 dark:text-amber-200'
                  }`}
                >
                  {d.ok ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  )}
                  <span className="leading-snug">{d.msg}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Gemini Grounded RAG Response */}
          {(ragAnswer || simError) && (
            <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-indigo-300 dark:border-indigo-700 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>GROUNDED LLM RESPONSE</span>
                </span>
                {ragModelUsed && (
                  <span className="text-[11px] font-mono text-slate-400">
                    {ragModelUsed} · temp {temperature.toFixed(1)}
                  </span>
                )}
              </div>
              {simError ? (
                <p className="text-xs text-rose-600 dark:text-rose-400">{simError}</p>
              ) : (
                <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line">
                  {ragAnswer}
                </p>
              )}
            </div>
          )}

          {/* Visual Chunks Inspector */}
          <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-900 dark:text-white">
                Chunk Boundaries & Retrieval Scores
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                Highlighted = Retrieved in Top-{topK}
              </span>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {allChunks.map((chunk) => {
                const isRetrieved = topChunkIndices.has(chunk.index);
                return (
                  <div
                    key={chunk.index}
                    className={`p-3 rounded-xl border text-xs space-y-1.5 transition-colors ${
                      isRetrieved
                        ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-400 dark:border-indigo-700'
                        : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 opacity-75'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[10px]">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-1.5 py-0.5 rounded font-bold ${
                            isRetrieved
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          CHUNK #{chunk.index}
                        </span>
                        <span className="text-slate-500">
                          chars [{chunk.start}..{chunk.end}] · overlap {chunk.overlapChars}
                        </span>
                      </div>
                      <span
                        className={`font-bold ${
                          isRetrieved ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-500'
                        }`}
                      >
                        sim: {chunk.score.toFixed(2)}
                        {chunk.matchedTerms.length > 0 && ` (${chunk.matchedTerms.join(', ')})`}
                      </span>
                    </div>
                    <p className="text-slate-800 dark:text-slate-200 leading-relaxed">
                      {chunk.text}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
