import React, { useEffect, useRef, useState } from 'react';
import {
  Play,
  RotateCcw,
  Terminal,
  CheckCircle2,
  XCircle,
  Loader2,
  Code2,
  FlaskConical
} from 'lucide-react';
import { Language } from '../types';
import { PYODIDE_DRILLS, PyodideDrill } from '../data/codingLabsData';

interface PyodideSandboxProps {
  language: Language;
  suggestedPhase?: number;
  compact?: boolean;
  customPrompt?: string;
}

declare global {
  interface Window {
    loadPyodide?: (config: { indexURL: string }) => Promise<any>;
    __neuroforgePyodideInstance?: any;
    __neuroforgePyodideLoadingPromise?: Promise<any>;
  }
}

async function ensurePyodideScriptLoaded(): Promise<any> {
  if (window.__neuroforgePyodideInstance) {
    return window.__neuroforgePyodideInstance;
  }
  if (window.__neuroforgePyodideLoadingPromise) {
    return window.__neuroforgePyodideLoadingPromise;
  }

  window.__neuroforgePyodideLoadingPromise = new Promise((resolve, reject) => {
    const initEngine = async () => {
      try {
        if (!window.loadPyodide) {
          reject(new Error('Pyodide loader failed to initialize.'));
          return;
        }
        const pyodide = await window.loadPyodide({
          indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/'
        });
        window.__neuroforgePyodideInstance = pyodide;
        resolve(pyodide);
      } catch (err) {
        reject(err);
      }
    };

    if (window.loadPyodide) {
      void initEngine();
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>('script[data-pyodide-cdn="true"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => void initEngine(), { once: true });
      existingScript.addEventListener('error', () => reject(new Error('Could not download Pyodide runtime.')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js';
    script.async = true;
    script.dataset.pyodideCdn = 'true';
    script.onload = () => void initEngine();
    script.onerror = () => reject(new Error('Network blocked Pyodide CDN script. Check internet connection.'));
    document.head.appendChild(script);
  }).catch((err) => {
    window.__neuroforgePyodideLoadingPromise = undefined;
    throw err;
  });

  return window.__neuroforgePyodideLoadingPromise;
}

export const PyodideSandbox: React.FC<PyodideSandboxProps> = ({
  language,
  suggestedPhase = 0,
  compact = false,
  customPrompt
}) => {
  const initialDrill =
    PYODIDE_DRILLS.find((d) => d.phaseHint === suggestedPhase) || PYODIDE_DRILLS[0];

  const [selectedDrillId, setSelectedDrillId] = useState<string>(initialDrill.id);
  const activeDrill: PyodideDrill =
    PYODIDE_DRILLS.find((d) => d.id === selectedDrillId) || PYODIDE_DRILLS[0];

  const [code, setCode] = useState<string>(activeDrill.starterCode);
  const [stdout, setStdout] = useState<string>('');
  const [stderr, setStderr] = useState<string | null>(null);
  const [runtimeState, setRuntimeState] = useState<'idle' | 'loading-runtime' | 'running' | 'ready'>(() =>
    window.__neuroforgePyodideInstance ? 'ready' : 'idle'
  );
  const [testResults, setTestResults] = useState<Array<{ label: string; passed: boolean }>>([]);
  const loadedPackagesRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const matched =
      PYODIDE_DRILLS.find((d) => d.phaseHint === suggestedPhase) || PYODIDE_DRILLS[0];
    setSelectedDrillId(matched.id);
    setCode(matched.starterCode);
    setStdout('');
    setStderr(null);
    setTestResults([]);
  }, [suggestedPhase]);

  const handleSelectDrill = (drillId: string) => {
    const found = PYODIDE_DRILLS.find((d) => d.id === drillId) || PYODIDE_DRILLS[0];
    setSelectedDrillId(found.id);
    setCode(found.starterCode);
    setStdout('');
    setStderr(null);
    setTestResults([]);
  };

  const handleRunPython = async (runTests: boolean) => {
    setStderr(null);
    setStdout('');
    setTestResults([]);

    try {
      setRuntimeState(window.__neuroforgePyodideInstance ? 'running' : 'loading-runtime');
      const pyodide = await ensurePyodideScriptLoaded();

      const needsNumpy = activeDrill.needsNumpy || /\bimport\s+numpy\b|\bfrom\s+numpy\b/.test(code);
      if (needsNumpy && !loadedPackagesRef.current.has('numpy')) {
        setRuntimeState('loading-runtime');
        await pyodide.loadPackage('numpy');
        loadedPackagesRef.current.add('numpy');
      }

      setRuntimeState('running');

      const escapedUserCode = JSON.stringify(code);
      const escapedTestCode = JSON.stringify(runTests ? activeDrill.testHarnessCode : '');

      const wrapperScript = `
import sys, io, traceback
_buf = io.StringIO()
_old_out, _old_err = sys.stdout, sys.stderr
sys.stdout = _buf
sys.stderr = _buf
_ns = {}
_err_msg = ""
_test_error = ""
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
        if (runTests) {
          setTestResults(activeDrill.testNames.map((label) => ({ label, passed: false })));
        }
      } else if (runTests) {
        setTestResults(activeDrill.testNames.map((label) => ({ label, passed: true })));
      }

      setRuntimeState('ready');
    } catch (err: any) {
      setRuntimeState('idle');
      setStderr(err?.message || 'Python execution failed.');
    }
  };

  const passedCount = testResults.filter((t) => t.passed).length;

  return (
    <div className="p-4 sm:p-5 bg-slate-950 text-slate-100 rounded-2xl border border-slate-800 space-y-4">
      {/* Header & Drill Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
            <Terminal className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-bold text-white truncate">
                In-Browser Python & NumPy Sandbox (Pyodide Wasm)
              </h3>
              <span className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-slate-800 text-emerald-400 border border-slate-700 shrink-0">
                {runtimeState === 'ready'
                  ? 'READY'
                  : runtimeState === 'loading-runtime'
                  ? 'LOADING WASM...'
                  : runtimeState === 'running'
                  ? 'RUNNING...'
                  : 'PYTHON 3.12'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">
              {language === 'hinglish'
                ? 'Browser mein hi Python & NumPy run karein aur test cases verify karein'
                : 'Zero setup — edit Python/NumPy code and verify instant assertions'}
            </p>
          </div>
        </div>

        <select
          value={selectedDrillId}
          onChange={(e) => handleSelectDrill(e.target.value)}
          className="px-2.5 py-1.5 text-xs font-mono rounded-lg bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          aria-label="Select Python coding drill"
        >
          {PYODIDE_DRILLS.map((d) => (
            <option key={d.id} value={d.id}>
              {d.title}
            </option>
          ))}
        </select>
      </div>

      {/* Prompt Banner */}
      <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs space-y-1">
        {customPrompt && (
          <div className="text-[11px] text-indigo-300 font-mono pb-1 border-b border-slate-800">
            Today’s Task Context: {customPrompt}
          </div>
        )}
        <div className="font-semibold text-emerald-300">{activeDrill.hinglishTitle}</div>
        <p className="text-slate-300 leading-relaxed">{activeDrill.prompt}</p>
      </div>

      {/* Code Editor */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span className="flex items-center gap-1.5">
            <Code2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>main.py</span>
          </span>
          <button
            type="button"
            onClick={() => {
              setCode(activeDrill.starterCode);
              setStdout('');
              setStderr(null);
              setTestResults([]);
            }}
            className="inline-flex items-center gap-1 text-slate-400 hover:text-white cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Starter Code</span>
          </button>
        </div>

        <textarea
          rows={compact ? 9 : 13}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          spellCheck={false}
          className="w-full p-3.5 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs text-emerald-200 leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-y"
          aria-label="Python code editor"
        />

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-[11px] text-slate-400">
            {runtimeState === 'loading-runtime'
              ? 'First run downloads Pyodide & NumPy WebAssembly (~5–8s once)...'
              : 'Runs locally inside your browser tab via WebAssembly.'}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={runtimeState === 'loading-runtime' || runtimeState === 'running'}
              onClick={() => void handleRunPython(false)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white border border-slate-700 cursor-pointer"
            >
              {runtimeState === 'loading-runtime' || runtimeState === 'running' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current" />
              )}
              <span>Run Code</span>
            </button>

            <button
              type="button"
              disabled={runtimeState === 'loading-runtime' || runtimeState === 'running'}
              onClick={() => void handleRunPython(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white cursor-pointer"
            >
              <FlaskConical className="w-3.5 h-3.5" />
              <span>Run & Verify Tests</span>
            </button>
          </div>
        </div>
      </div>

      {/* Console Output & Assertions */}
      {(stdout || stderr || testResults.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
              Stdout / Traceback
            </div>
            {stderr ? (
              <pre className="text-[11px] font-mono text-rose-300 whitespace-pre-wrap break-words leading-relaxed">
                {stderr}
              </pre>
            ) : (
              <pre className="text-[11px] font-mono text-emerald-300 whitespace-pre-wrap break-words leading-relaxed">
                {stdout || '(Code ran cleanly with no stdout)'}
              </pre>
            )}
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-slate-400">
              <span>Test Cases</span>
              {testResults.length > 0 && (
                <span
                  className={
                    passedCount === testResults.length ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'
                  }
                >
                  {passedCount}/{testResults.length} PASSED
                </span>
              )}
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
              <div className="text-[11px] text-slate-500">
                Click &quot;Run & Verify Tests&quot; to check your solution against unit tests.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
