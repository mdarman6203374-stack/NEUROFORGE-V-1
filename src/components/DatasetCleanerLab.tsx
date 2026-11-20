import React, { useMemo, useRef, useState } from 'react';
import {
  Database,
  Upload,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Download,
  Play,
  FlaskConical,
  Loader2,
  ShieldAlert,
  BarChart3,
  RotateCcw,
  Sparkles,
  FileSpreadsheet
} from 'lucide-react';
import { Language } from '../types';
import { SAMPLE_MESSY_DATASETS, SampleDatasetSpec } from '../data/datasetLabData';
import { ensurePyodideScriptLoaded } from '../utils/pyodideRuntime';

interface DatasetCleanerLabProps {
  language: Language;
}

interface ParsedCsv {
  headers: string[];
  rows: Array<Record<string, string>>;
}

interface ColumnProfile {
  name: string;
  isNumeric: boolean;
  missingCount: number;
  missingPct: number;
  uniqueCount: number;
  mean: number | null;
  median: number | null;
  min: number | null;
  max: number | null;
  q1: number | null;
  q3: number | null;
  iqrLow: number | null;
  iqrHigh: number | null;
  outlierCount: number;
  skewRatio: number | null;
  targetCorrelation: number | null;
  leakageReason: string | null;
  isIdLike: boolean;
  histogramBuckets: Array<{ label: string; count: number }>;
}

function parseCsvText(raw: string): ParsedCsv {
  const lines = raw
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .filter((l) => l.trim().length > 0);

  if (lines.length === 0) return { headers: [], rows: [] };

  const splitCsvLine = (line: string): string[] => {
    const out: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        out.push(cur.trim());
        cur = '';
      } else {
        cur += ch;
      }
    }
    out.push(cur.trim());
    return out;
  };

  const headers = splitCsvLine(lines[0]).map((h, i) => h || `col_${i + 1}`);
  const rows = lines.slice(1, 301).map((line) => {
    const vals = splitCsvLine(line);
    const rec: Record<string, string> = {};
    headers.forEach((h, idx) => {
      rec[h] = vals[idx] ?? '';
    });
    return rec;
  });

  return { headers, rows };
}

function computePearson(xs: number[], ys: number[]): number | null {
  if (xs.length < 3 || xs.length !== ys.length) return null;
  const mx = xs.reduce((a, b) => a + b, 0) / xs.length;
  const my = ys.reduce((a, b) => a + b, 0) / ys.length;
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < xs.length; i++) {
    const vx = xs[i] - mx;
    const vy = ys[i] - my;
    num += vx * vy;
    dx += vx * vx;
    dy += vy * vy;
  }
  const den = Math.sqrt(dx * dy);
  return den === 0 ? null : num / den;
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

const LEAKAGE_NAME_PATTERNS =
  /recovery|cancellation|billing|discharge|refund_issued|post_|after_|future_|target_copy|outcome|churn_date|resolution_code/i;

export const DatasetCleanerLab: React.FC<DatasetCleanerLabProps> = ({ language }) => {
  const [selectedSampleId, setSelectedSampleId] = useState<string>(SAMPLE_MESSY_DATASETS[0].id);
  const [customDatasetName, setCustomDatasetName] = useState<string | null>(null);
  const [csvText, setCsvText] = useState<string>(SAMPLE_MESSY_DATASETS[0].csvText);
  const [targetColumn, setTargetColumn] = useState<string>(SAMPLE_MESSY_DATASETS[0].targetColumn);
  const [selectedInspectCol, setSelectedInspectCol] = useState<string>('annual_income');
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Interactive cleaning pipeline controls
  const [dropLeakageCols, setDropLeakageCols] = useState<boolean>(false);
  const [deduplicateRows, setDeduplicateRows] = useState<boolean>(false);
  const [imputeMissing, setImputeMissing] = useState<boolean>(false);
  const [clipOutliers, setClipOutliers] = useState<boolean>(false);

  // Python Pyodide editor state
  const activeSample: SampleDatasetSpec | null = useMemo(
    () =>
      customDatasetName
        ? null
        : SAMPLE_MESSY_DATASETS.find((s) => s.id === selectedSampleId) || SAMPLE_MESSY_DATASETS[0],
    [selectedSampleId, customDatasetName]
  );

  const [codeMode, setCodeMode] = useState<'clean' | 'buggy'>('clean');
  const [pythonCode, setPythonCode] = useState<string>(SAMPLE_MESSY_DATASETS[0].cleanStarterCode);
  const [stdout, setStdout] = useState<string>('');
  const [stderr, setStderr] = useState<string | null>(null);
  const [runtimeState, setRuntimeState] = useState<'idle' | 'loading-runtime' | 'running' | 'ready'>(() =>
    window.__neuroforgePyodideInstance ? 'ready' : 'idle'
  );
  const [testResults, setTestResults] = useState<Array<{ label: string; passed: boolean }>>([]);
  const numpyLoadedRef = useRef<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const parsed = useMemo(() => parseCsvText(csvText), [csvText]);

  // Build custom Python starter when user uploads their own CSV
  const buildCustomStarterCode = (headers: string[], target: string) => {
    const featureCols = headers.filter((h) => h !== target).slice(0, 5);
    return `import csv, io
import numpy as np

rows = list(csv.DictReader(io.StringIO(DATASET_CSV)))
print("Loaded custom CSV rows:", len(rows))
print("Headers:", ${JSON.stringify(headers)})

# Practice split-first preprocessing (avoid data leakage!):
split_idx = max(1, int(len(rows) * 0.8))
train_rows, test_rows = rows[:split_idx], rows[split_idx:]

numeric_cols = ${JSON.stringify(featureCols)}
for col in numeric_cols:
    vals = []
    for r in train_rows:
        try:
            if r[col] != '':
                vals.append(float(r[col]))
        except ValueError:
            pass
    if vals:
        med = float(np.median(vals))
        q1, q3 = np.percentile(vals, [25, 75])
        print(f"{col} -> train median={med:.2f}, IQR=[{q1:.2f}, {q3:.2f}]")`;
  };

  const handleSelectSample = (sample: SampleDatasetSpec) => {
    setCustomDatasetName(null);
    setSelectedSampleId(sample.id);
    setCsvText(sample.csvText);
    setTargetColumn(sample.targetColumn);
    setSelectedInspectCol(
      sample.csvText.split('\n')[0].split(',')[1] || sample.targetColumn
    );
    setDropLeakageCols(false);
    setDeduplicateRows(false);
    setImputeMissing(false);
    setClipOutliers(false);
    setCodeMode('clean');
    setPythonCode(sample.cleanStarterCode);
    setStdout('');
    setStderr(null);
    setTestResults([]);
    setUploadError(null);
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 512 * 1024) {
      setUploadError('Please upload a small CSV file under 512 KB for instant browser inspection.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || '');
      const check = parseCsvText(text);
      if (check.headers.length < 2 || check.rows.length < 3) {
        setUploadError('CSV must have at least 2 columns and 3 data rows.');
        return;
      }
      setUploadError(null);
      setCustomDatasetName(file.name);
      setCsvText(text);
      const guessedTarget = check.headers[check.headers.length - 1];
      setTargetColumn(guessedTarget);
      setSelectedInspectCol(check.headers[0]);
      setDropLeakageCols(false);
      setDeduplicateRows(false);
      setImputeMissing(false);
      setClipOutliers(false);
      setPythonCode(buildCustomStarterCode(check.headers, guessedTarget));
      setStdout('');
      setStderr(null);
      setTestResults([]);
    };
    reader.readAsText(file);
  };

  // Profile all columns & detect leakage / duplicates / skew / outliers
  const profiling = useMemo(() => {
    const { headers, rows } = parsed;
    const totalRows = rows.length;

    // Duplicate detection
    const seenSig = new Set<string>();
    const duplicateRowIndices = new Set<number>();
    rows.forEach((row, idx) => {
      const sig = headers.map((h) => row[h] ?? '').join('||');
      if (seenSig.has(sig)) duplicateRowIndices.add(idx);
      else seenSig.add(sig);
    });

    // Numeric target vector for correlation leakage check
    const targetNumericPairs = rows.map((r) => {
      const v = Number(r[targetColumn]);
      return r[targetColumn] !== '' && Number.isFinite(v) ? v : null;
    });

    const columns: ColumnProfile[] = headers.map((col) => {
      const rawVals = rows.map((r) => (r[col] ?? '').trim());
      const nonMissing = rawVals.filter((v) => v !== '' && v.toLowerCase() !== 'nan' && v.toLowerCase() !== 'null');
      const missingCount = totalRows - nonMissing.length;
      const missingPct = totalRows > 0 ? Math.round((missingCount / totalRows) * 100) : 0;
      const uniqueCount = new Set(nonMissing).size;

      const numericParsed = nonMissing.map((v) => Number(v));
      const isNumeric = nonMissing.length > 0 && numericParsed.every((n) => Number.isFinite(n));

      let mean: number | null = null;
      let median: number | null = null;
      let min: number | null = null;
      let max: number | null = null;
      let q1: number | null = null;
      let q3: number | null = null;
      let iqrLow: number | null = null;
      let iqrHigh: number | null = null;
      let outlierCount = 0;
      let skewRatio: number | null = null;
      let targetCorrelation: number | null = null;
      let histogramBuckets: Array<{ label: string; count: number }> = [];

      if (isNumeric && numericParsed.length > 0) {
        const sorted = [...numericParsed].sort((a, b) => a - b);
        min = sorted[0];
        max = sorted[sorted.length - 1];
        mean = sorted.reduce((a, b) => a + b, 0) / sorted.length;
        median = percentile(sorted, 0.5);
        q1 = percentile(sorted, 0.25);
        q3 = percentile(sorted, 0.75);
        const iqr = q3 - q1;
        iqrLow = q1 - 1.5 * iqr;
        iqrHigh = q3 + 1.5 * iqr;

        if (iqr > 0) {
          outlierCount = numericParsed.filter((n) => n < iqrLow! || n > iqrHigh!).length;
        }
        // Negative corrupted sentry values (like -999) when rest positive
        const negativeCount = numericParsed.filter((n) => n < 0).length;
        if (negativeCount > 0 && median > 0 && outlierCount === 0) {
          outlierCount = negativeCount;
        }

        const std = Math.sqrt(
          numericParsed.reduce((s, n) => s + Math.pow(n - mean!, 2), 0) / numericParsed.length
        );
        skewRatio = std > 0 ? (mean - median) / std : 0;

        // Target correlation
        if (col !== targetColumn) {
          const xs: number[] = [];
          const ys: number[] = [];
          rows.forEach((r, idx) => {
            const tv = targetNumericPairs[idx];
            const cv = Number(r[col]);
            if (tv !== null && r[col] !== '' && Number.isFinite(cv)) {
              xs.push(cv);
              ys.push(tv);
            }
          });
          targetCorrelation = computePearson(xs, ys);
        }

        // Build 5-bucket histogram (clip extreme upper outlier into last bucket if huge)
        const binCount = 5;
        const span = max - min;
        if (span > 0) {
          const counts = new Array(binCount).fill(0);
          numericParsed.forEach((v) => {
            const b = Math.min(binCount - 1, Math.floor(((v - min!) / span) * binCount));
            counts[b]++;
          });
          histogramBuckets = counts.map((count, idx) => {
            const lo = min! + (span / binCount) * idx;
            const hi = min! + (span / binCount) * (idx + 1);
            const fmt = (x: number) =>
              Math.abs(x) >= 10000 ? `${(x / 1000).toFixed(0)}k` : x >= 10 ? x.toFixed(0) : x.toFixed(1);
            return { label: `${fmt(lo)}–${fmt(hi)}`, count };
          });
        } else {
          histogramBuckets = [{ label: String(min), count: numericParsed.length }];
        }
      } else {
        // Categorical frequency top 5
        const freq = new Map<string, number>();
        nonMissing.forEach((v) => freq.set(v, (freq.get(v) || 0) + 1));
        histogramBuckets = Array.from(freq.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([label, count]) => ({ label, count }));
      }

      const isIdLike =
        activeSample?.idColumns.includes(col) ||
        (/(_id|^id$)/i.test(col) && uniqueCount >= Math.max(3, Math.floor(nonMissing.length * 0.85)));

      let leakageReason: string | null = null;
      if (col !== targetColumn) {
        if (activeSample?.leakageColumns.includes(col)) {
          leakageReason = 'Known post-outcome target leakage column';
        } else if (LEAKAGE_NAME_PATTERNS.test(col)) {
          leakageReason = 'Column name suggests post-event / future knowledge';
        } else if (targetCorrelation !== null && Math.abs(targetCorrelation) >= 0.92) {
          leakageReason = `Suspiciously high target correlation (r = ${targetCorrelation.toFixed(2)})`;
        }
      }

      return {
        name: col,
        isNumeric,
        missingCount,
        missingPct,
        uniqueCount,
        mean,
        median,
        min,
        max,
        q1,
        q3,
        iqrLow,
        iqrHigh,
        outlierCount,
        skewRatio,
        targetCorrelation,
        leakageReason,
        isIdLike,
        histogramBuckets
      };
    });

    // Target distribution & skew check
    const targetCounts = new Map<string, number>();
    rows.forEach((r) => {
      const tv = (r[targetColumn] ?? '').trim();
      if (tv !== '') targetCounts.set(tv, (targetCounts.get(tv) || 0) + 1);
    });
    const targetDistribution = Array.from(targetCounts.entries()).map(([val, count]) => ({
      val,
      count,
      pct: totalRows > 0 ? Math.round((count / totalRows) * 100) : 0
    }));
    const minClassPct =
      targetDistribution.length > 1
        ? Math.min(...targetDistribution.map((d) => d.pct))
        : 100;

    return {
      totalRows,
      duplicateCount: duplicateRowIndices.size,
      duplicateRowIndices,
      columns,
      targetDistribution,
      isTargetSkewed: targetDistribution.length >= 2 && minClassPct <= 30
    };
  }, [parsed, targetColumn, activeSample]);

  // Apply interactive cleaning preview to show before vs after!
  const cleanedDataset = useMemo(() => {
    const profileMap = new Map(profiling.columns.map((c) => [c.name, c]));
    const activeHeaders = parsed.headers.filter((h) => {
      if (!dropLeakageCols) return true;
      const prof = profileMap.get(h);
      return !prof?.leakageReason && !prof?.isIdLike;
    });

    let workingRows = parsed.rows.filter((_, idx) =>
      deduplicateRows ? !profiling.duplicateRowIndices.has(idx) : true
    );

    if (imputeMissing || clipOutliers) {
      workingRows = workingRows.map((row) => {
        const next: Record<string, string> = { ...row };
        activeHeaders.forEach((h) => {
          if (h === targetColumn) return;
          const prof = profileMap.get(h);
          if (!prof || !prof.isNumeric) return;

          const rawVal = (next[h] ?? '').trim();
          let numVal = rawVal === '' ? NaN : Number(rawVal);

          if ((rawVal === '' || !Number.isFinite(numVal)) && imputeMissing && prof.median !== null) {
            numVal = prof.median;
            next[h] = String(Number(numVal.toFixed(2)));
          }

          if (Number.isFinite(numVal) && clipOutliers && prof.iqrLow !== null && prof.iqrHigh !== null) {
            const safeLow = prof.min !== null && prof.min < 0 && prof.median !== null && prof.median > 0 ? 0 : prof.iqrLow;
            const clipped = Math.min(prof.iqrHigh, Math.max(safeLow, numVal));
            if (clipped !== numVal) {
              next[h] = String(Number(clipped.toFixed(2)));
            }
          }
        });
        return next;
      });
    }

    return { headers: activeHeaders, rows: workingRows };
  }, [parsed, profiling, dropLeakageCols, deduplicateRows, imputeMissing, clipOutliers, targetColumn]);

  const inspectedCol =
    profiling.columns.find((c) => c.name === selectedInspectCol) || profiling.columns[0];

  const handleDownloadCleanCsv = () => {
    const lines = [
      cleanedDataset.headers.join(','),
      ...cleanedDataset.rows.map((r) => cleanedDataset.headers.map((h) => r[h] ?? '').join(','))
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = customDatasetName
      ? `cleaned_${customDatasetName}`
      : `cleaned_${activeSample?.filename || 'dataset.csv'}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRunPython = async (runTests: boolean) => {
    setStderr(null);
    setStdout('');
    setTestResults([]);

    try {
      setRuntimeState(window.__neuroforgePyodideInstance ? 'running' : 'loading-runtime');
      const pyodide = await ensurePyodideScriptLoaded();

      if (!numpyLoadedRef.current) {
        setRuntimeState('loading-runtime');
        await pyodide.loadPackage('numpy');
        numpyLoadedRef.current = true;
      }

      setRuntimeState('running');

      const escapedCsv = JSON.stringify(csvText);
      const escapedUserCode = JSON.stringify(pythonCode);
      const escapedTestCode = JSON.stringify(
        runTests && activeSample ? activeSample.testHarnessCode : ''
      );

      const wrapperScript = `
import sys, io, traceback
_buf = io.StringIO()
_old_out, _old_err = sys.stdout, sys.stderr
sys.stdout = _buf
sys.stderr = _buf
_ns = {"DATASET_CSV": ${escapedCsv}}
_err_msg = ""
try:
    exec(${escapedUserCode}, _ns)
    if ${escapedTestCode}.strip():
        exec(${escapedTestCode}, _ns)
except Exception:
    _err_msg = traceback.format_exc()
finally:
    sys.stdout = _old_out
    sys.stderr = _old_err
(_buf.getvalue(), _err_msg)
`;

      const pyResult = await pyodide.runPythonAsync(wrapperScript);
      const outText = String(pyResult.get(0) ?? '');
      const errText = String(pyResult.get(1) ?? '');
      if (typeof pyResult?.destroy === 'function') {
        pyResult.destroy();
      }

      setStdout(outText.trim());

      if (errText.trim()) {
        setStderr(errText.trim());
        if (runTests && activeSample) {
          setTestResults(activeSample.verificationTests.map((label) => ({ label, passed: false })));
        }
      } else if (runTests && activeSample) {
        setTestResults(activeSample.verificationTests.map((label) => ({ label, passed: true })));
      }

      setRuntimeState('ready');
    } catch (err: any) {
      setRuntimeState('idle');
      setStderr(err?.message || 'Python execution failed.');
    }
  };

  const leakageColsFound = profiling.columns.filter((c) => c.leakageReason || c.isIdLike);
  const missingTotal = profiling.columns.reduce((s, c) => s + c.missingCount, 0);
  const outliersTotal = profiling.columns.reduce((s, c) => s + c.outlierCount, 0);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-amber-400">
              <Database className="w-4 h-4" />
              <span>IN-BROWSER DATASET CLEANER & LEAKAGE DETECTOR</span>
              <span aria-hidden="true">·</span>
              <span>PHASE 1–2 ML PREPROCESSING</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {language === 'hinglish'
                ? 'Messy ML Datasets Inspect Karein aur Python Mein Train/Test Leakage Fix Karein'
                : 'Inspect Messy ML Datasets, Catch Target Leakage & Fix Preprocessing in Python'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {language === 'hinglish'
                ? 'Sample messy dataset load karein ya apni CSV upload karein: missing values, skewed targets, extreme outliers aur future leakage columns detect karein, aur bina Jupyter/Colab ke Pyodide mein clean split test karein.'
                : 'Load messy ML datasets or upload a small CSV to profile missingness, skewness, IQR outliers, duplicates, and hidden target leakage — then fix train/test preprocessing live in browser Python.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0 self-start">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleCsvUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-amber-400" />
              <span>Upload Small CSV</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadCleanCsv}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Clean CSV</span>
            </button>
          </div>
        </div>

        {/* Messy Sample Dataset Selector */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-2">
          {SAMPLE_MESSY_DATASETS.map((sample) => {
            const active = !customDatasetName && selectedSampleId === sample.id;
            return (
              <button
                key={sample.id}
                type="button"
                onClick={() => handleSelectSample(sample)}
                className={`p-3.5 rounded-xl border text-left transition-colors cursor-pointer space-y-1 ${
                  active
                    ? 'bg-amber-500/15 border-amber-400 text-white'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-2 text-xs font-bold">
                  <span className="truncate">{sample.name.split('(')[0].trim()}</span>
                  <span className="font-mono text-[10px] text-amber-300 shrink-0">
                    {sample.filename}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2">
                  {language === 'hinglish' ? sample.hinglishDescription : sample.description}
                </p>
              </button>
            );
          })}
        </div>

        {uploadError && (
          <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-xs text-rose-200">
            {uploadError}
          </div>
        )}
      </div>

      {/* Diagnostic Alert Strip: Leakage, Missingness, Outliers, Skew */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
            <ShieldAlert className="w-4 h-4 text-rose-500" />
            <span>Leakage / ID Risk Cols</span>
          </div>
          <div className="text-xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
            {leakageColsFound.length} flagged
          </div>
          <div className="text-[11px] text-rose-600 dark:text-rose-400 truncate mt-0.5">
            {leakageColsFound.map((c) => c.name).join(', ') || 'None detected'}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>Missing Values & Outliers</span>
          </div>
          <div className="text-xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
            {missingTotal} NaN · {outliersTotal} outliers
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            {profiling.duplicateCount} exact duplicate rows
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
            <BarChart3 className="w-4 h-4 text-indigo-500" />
            <span>Target Skew ({targetColumn})</span>
          </div>
          <div className="text-xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
            {profiling.targetDistribution.map((d) => `${d.val}:${d.pct}%`).join(' / ') || 'N/A'}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            {profiling.isTargetSkewed
              ? 'Skewed — use Stratified Split + F1/PR-AUC'
              : 'Balanced / Continuous target'}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            <span>Cleaned Preview Shape</span>
          </div>
          <div className="text-xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
            {cleanedDataset.rows.length} × {cleanedDataset.headers.length}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            {customDatasetName ? `Uploaded: ${customDatasetName}` : activeSample?.filename}
          </div>
        </div>
      </div>

      {/* Leakage Warning Explanation */}
      {activeSample && (
        <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/70 text-xs text-amber-950 dark:text-amber-100 flex items-start gap-3">
          <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold">Interview Trap in This Dataset:</div>
            <p className="leading-relaxed">
              {language === 'hinglish'
                ? activeSample.hinglishLeakageExplanation
                : activeSample.leakageExplanation}
            </p>
          </div>
        </div>
      )}

      {/* Middle Section: Interactive Cleaner Controls + Column Distribution Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Interactive Cleaning Checklist & Column Table */}
        <div className="lg:col-span-7 p-5 sm:p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>1. Interactive Cleaning & Leakage Fixes</span>
            </h3>
            {customDatasetName && parsed.headers.length > 1 && (
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-500 dark:text-slate-400">Target:</span>
                <select
                  value={targetColumn}
                  onChange={(e) => setTargetColumn(e.target.value)}
                  className="px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 font-mono text-xs"
                >
                  {parsed.headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {[
              {
                checked: dropLeakageCols,
                toggle: () => setDropLeakageCols((p) => !p),
                title: 'Drop Leakage & ID Columns',
                sub: `Removes ${leakageColsFound.map((c) => c.name).join(', ') || 'none'}`
              },
              {
                checked: deduplicateRows,
                toggle: () => setDeduplicateRows((p) => !p),
                title: 'Deduplicate Before Splitting',
                sub: `Removes ${profiling.duplicateCount} duplicate row(s)`
              },
              {
                checked: imputeMissing,
                toggle: () => setImputeMissing((p) => !p),
                title: 'Impute Missing with Median',
                sub: `Fixes ${missingTotal} NaN cell(s) safely`
              },
              {
                checked: clipOutliers,
                toggle: () => setClipOutliers((p) => !p),
                title: 'Clip IQR Outliers & Negative Errors',
                sub: `Caps ${outliersTotal} extreme value(s)`
              }
            ].map((ctrl) => (
              <button
                key={ctrl.title}
                type="button"
                onClick={ctrl.toggle}
                className={`p-3 rounded-xl border text-left transition-colors cursor-pointer flex items-start gap-2.5 ${
                  ctrl.checked
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-indigo-400'
                }`}
              >
                <CheckCircle2
                  className={`w-4 h-4 shrink-0 mt-0.5 ${
                    ctrl.checked ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                  }`}
                />
                <div className="min-w-0">
                  <div className="font-semibold text-slate-900 dark:text-white">{ctrl.title}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {ctrl.sub}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Column Audit Table */}
          <div className="overflow-x-auto pt-1">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                  <th className="py-2 pr-2 font-semibold">Column (Click to Inspect)</th>
                  <th className="py-2 px-2 font-semibold text-right">NaN</th>
                  <th className="py-2 px-2 font-semibold text-right">Outliers</th>
                  <th className="py-2 pl-2 font-semibold">Audit Finding</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {profiling.columns.map((col) => {
                  const isSelected = inspectedCol?.name === col.name;
                  return (
                    <tr
                      key={col.name}
                      onClick={() => setSelectedInspectCol(col.name)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-indigo-50/70 dark:bg-indigo-950/40'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <td className="py-2 pr-2 font-mono font-semibold text-slate-900 dark:text-white">
                        {col.name}
                        {col.name === targetColumn && (
                          <span className="ml-1.5 text-[10px] font-sans text-indigo-600 dark:text-indigo-400">
                            (Target)
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-2 text-right font-mono tabular-nums text-slate-600 dark:text-slate-300">
                        {col.missingCount} ({col.missingPct}%)
                      </td>
                      <td className="py-2 px-2 text-right font-mono tabular-nums text-slate-600 dark:text-slate-300">
                        {col.outlierCount}
                      </td>
                      <td className="py-2 pl-2">
                        {col.leakageReason ? (
                          <span className="text-rose-600 dark:text-rose-400 font-semibold">
                            LEAKAGE RISK
                          </span>
                        ) : col.isIdLike ? (
                          <span className="text-amber-600 dark:text-amber-400 font-semibold">
                            DROP ID KEY
                          </span>
                        ) : col.outlierCount > 0 ? (
                          <span className="text-amber-600 dark:text-amber-400">
                            Outlier Skew
                          </span>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400">Clean</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Distribution Inspector + Live Table Preview */}
        <div className="lg:col-span-5 space-y-4">
          {inspectedCol && (
            <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400">
                    DISTRIBUTION INSPECTOR
                  </div>
                  <h3 className="text-base font-bold font-mono text-slate-900 dark:text-white">
                    {inspectedCol.name}
                  </h3>
                </div>
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                  {inspectedCol.isNumeric ? 'Numeric' : 'Categorical'} · {inspectedCol.uniqueCount} unique
                </span>
              </div>

              {inspectedCol.leakageReason && (
                <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300">
                  <strong>Leakage Flag:</strong> {inspectedCol.leakageReason}
                </div>
              )}

              {inspectedCol.isNumeric && inspectedCol.median !== null && (
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <div className="text-[10px] text-slate-500">MEAN vs MEDIAN</div>
                    <div className="font-mono tabular-nums font-bold text-slate-900 dark:text-white mt-0.5">
                      {inspectedCol.mean?.toFixed(1)} / {inspectedCol.median?.toFixed(1)}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <div className="text-[10px] text-slate-500">IQR SAFE CAP</div>
                    <div className="font-mono tabular-nums font-bold text-slate-900 dark:text-white mt-0.5">
                      {inspectedCol.iqrHigh?.toFixed(1)}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <div className="text-[10px] text-slate-500">CORR W/ TARGET</div>
                    <div className="font-mono tabular-nums font-bold text-slate-900 dark:text-white mt-0.5">
                      {inspectedCol.targetCorrelation !== null
                        ? inspectedCol.targetCorrelation.toFixed(2)
                        : '—'}
                    </div>
                  </div>
                </div>
              )}

              {/* Distribution Histogram Bars */}
              <div className="space-y-2">
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Value Distribution Buckets
                </div>
                <div className="space-y-1.5">
                  {inspectedCol.histogramBuckets.map((b, i) => {
                    const maxBucket = Math.max(
                      1,
                      ...inspectedCol.histogramBuckets.map((x) => x.count)
                    );
                    const widthPct = Math.round((b.count / maxBucket) * 100);
                    return (
                      <div key={i} className="flex items-center gap-2 text-[11px]">
                        <span className="w-24 font-mono text-slate-600 dark:text-slate-400 truncate shrink-0">
                          {b.label}
                        </span>
                        <div className="flex-1 h-4 bg-slate-100 dark:bg-slate-800 rounded overflow-hidden">
                          <div
                            style={{ width: `${widthPct}%` }}
                            className="h-full bg-indigo-600 dark:bg-indigo-500 rounded"
                          />
                        </div>
                        <span className="w-6 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                          {b.count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Compact Live Table Preview (First 6 Rows) */}
          <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-900 dark:text-white">
                Cleaned Data Preview (Top 6 of {cleanedDataset.rows.length} rows)
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[11px] font-mono">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                    {cleanedDataset.headers.map((h) => (
                      <th key={h} className="py-1.5 px-2 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                  {cleanedDataset.rows.slice(0, 6).map((row, rIdx) => (
                    <tr key={rIdx}>
                      {cleanedDataset.headers.map((h) => {
                        const val = row[h];
                        const isEmpty = !val || val === '';
                        return (
                          <td
                            key={h}
                            className={`py-1.5 px-2 whitespace-nowrap tabular-nums ${
                              isEmpty
                                ? 'text-rose-600 dark:text-rose-400 font-bold'
                                : 'text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {isEmpty ? 'NaN' : val}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: In-Browser Python Leakage Fixer & Verifier (Pyodide Wasm) */}
      <div className="p-5 sm:p-6 bg-slate-950 text-slate-100 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">
                2. Practice Fixing Train/Test Data Leakage in Python (Pyodide + NumPy)
              </h3>
              <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-slate-800 text-emerald-400 border border-slate-700">
                {runtimeState === 'ready'
                  ? 'READY'
                  : runtimeState === 'loading-runtime'
                  ? 'LOADING WASM...'
                  : runtimeState === 'running'
                  ? 'RUNNING...'
                  : 'PYTHON 3.12'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              `DATASET_CSV` is automatically loaded with the active dataset above. Compare the buggy global-scaling script vs. clean split-first preprocessing.
            </p>
          </div>

          {activeSample && (
            <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setCodeMode('buggy');
                  setPythonCode(activeSample.buggyStarterCode);
                  setTestResults([]);
                  setStderr(null);
                  setStdout('');
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer transition-colors ${
                  codeMode === 'buggy'
                    ? 'bg-rose-600 text-white'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Load Buggy Leaky Script
              </button>
              <button
                type="button"
                onClick={() => {
                  setCodeMode('clean');
                  setPythonCode(activeSample.cleanStarterCode);
                  setTestResults([]);
                  setStderr(null);
                  setStdout('');
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer transition-colors ${
                  codeMode === 'clean'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Clean Split-First Starter
              </button>
            </div>
          )}
        </div>

        <textarea
          rows={14}
          value={pythonCode}
          onChange={(e) => setPythonCode(e.target.value)}
          spellCheck={false}
          className="w-full p-4 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs text-emerald-200 leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-y"
          aria-label="Dataset cleaning Python code editor"
        />

        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => {
              if (activeSample) {
                setPythonCode(
                  codeMode === 'buggy' ? activeSample.buggyStarterCode : activeSample.cleanStarterCode
                );
              } else {
                setPythonCode(buildCustomStarterCode(parsed.headers, targetColumn));
              }
              setStdout('');
              setStderr(null);
              setTestResults([]);
            }}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Script</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={runtimeState === 'loading-runtime' || runtimeState === 'running'}
              onClick={() => void handleRunPython(false)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white border border-slate-700 cursor-pointer"
            >
              {runtimeState === 'loading-runtime' || runtimeState === 'running' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current" />
              )}
              <span>Run Python</span>
            </button>

            {activeSample && (
              <button
                type="button"
                disabled={runtimeState === 'loading-runtime' || runtimeState === 'running'}
                onClick={() => void handleRunPython(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white cursor-pointer"
              >
                <FlaskConical className="w-3.5 h-3.5" />
                <span>Verify Leakage-Free Tests</span>
              </button>
            )}
          </div>
        </div>

        {(stdout || stderr || testResults.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                Python Stdout / Traceback
              </div>
              {stderr ? (
                <pre className="text-[11px] font-mono text-rose-300 whitespace-pre-wrap break-words leading-relaxed">
                  {stderr}
                </pre>
              ) : (
                <pre className="text-[11px] font-mono text-emerald-300 whitespace-pre-wrap break-words leading-relaxed">
                  {stdout || '(Executed cleanly with no stdout)'}
                </pre>
              )}
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                Leakage Verification Checks
              </div>
              {testResults.length > 0 ? (
                <div className="space-y-1.5">
                  {testResults.map((t, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-lg border ${
                        t.passed
                          ? 'bg-emerald-950/50 border-emerald-800/70 text-emerald-200'
                          : 'bg-rose-950/50 border-rose-800/70 text-rose-200'
                      }`}
                    >
                      {t.passed ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      )}
                      <span className="text-[11px] font-mono">{t.label}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-400">
                  Click &quot;Verify Leakage-Free Tests&quot; to assert zero leakage and clean preprocessing.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
