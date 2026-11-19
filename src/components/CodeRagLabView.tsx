import React, { useEffect, useState } from 'react';
import { Terminal, SlidersHorizontal, Bug } from 'lucide-react';
import { Language } from '../types';
import { PyodideSandbox } from './PyodideSandbox';
import { InteractiveRagLab } from './InteractiveRagLab';
import { TensorBugSpotter } from './TensorBugSpotter';

interface CodeRagLabViewProps {
  language: Language;
  initialSubTab?: 'python' | 'rag' | 'bugs';
}

export const CodeRagLabView: React.FC<CodeRagLabViewProps> = ({
  language,
  initialSubTab = 'python'
}) => {
  const [subTab, setSubTab] = useState<'python' | 'rag' | 'bugs'>(initialSubTab);

  useEffect(() => {
    setSubTab(initialSubTab);
  }, [initialSubTab]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950/60 text-white rounded-2xl border border-slate-800 shadow-lg space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
              Hands-On Coding, RAG Tuning & PyTorch Debugging
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {language === 'hinglish'
                ? 'In-Browser Python Sandbox, RAG Lab aur Bug Spotter'
                : 'Interactive Code, RAG & Tensor Debugging Lab'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {language === 'hinglish'
                ? 'Bina Colab khole browser mein NumPy/Python run karein, Phase 4-5 RAG chunks tune karein, aur 60-second PyTorch shape bugs spot karein.'
                : 'Practice real AI engineering inside the browser: run Python/NumPy drills with live assertions, inspect RAG chunk retrieval vs. temperature, and race a 60s PyTorch bug timer.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-xl bg-slate-950/80 border border-slate-800 shrink-0 self-start lg:self-center">
            <button
              type="button"
              onClick={() => setSubTab('python')}
              className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                subTab === 'python'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Python Sandbox</span>
            </button>
            <button
              type="button"
              onClick={() => setSubTab('rag')}
              className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                subTab === 'rag'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Prompt & RAG Lab</span>
            </button>
            <button
              type="button"
              onClick={() => setSubTab('bugs')}
              className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                subTab === 'bugs'
                  ? 'bg-rose-600 text-white'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Bug className="w-3.5 h-3.5" />
              <span>60s Bug Spotter</span>
            </button>
          </div>
        </div>
      </div>

      {subTab === 'python' && <PyodideSandbox language={language} />}
      {subTab === 'rag' && <InteractiveRagLab language={language} />}
      {subTab === 'bugs' && <TensorBugSpotter language={language} />}
    </div>
  );
};
