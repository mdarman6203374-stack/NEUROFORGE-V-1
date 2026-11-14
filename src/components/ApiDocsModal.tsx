import React, { useState } from 'react';
import {
  Terminal,
  X,
  Play,
  Copy,
  Check,
  Server,
  Globe
} from 'lucide-react';
import { SchedulePace } from '../types';

interface ApiDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
  pace: SchedulePace;
  completedConcepts: string[];
  completedDays: number[];
}

interface EndpointPreset {
  id: string;
  method: 'GET' | 'POST';
  path: string;
  label: string;
  description: string;
  body?: Record<string, any>;
}

export const ApiDocsModal: React.FC<ApiDocsModalProps> = ({
  isOpen,
  onClose,
  pace,
  completedConcepts,
  completedDays
}) => {
  const [selectedId, setSelectedId] = useState<string>('manifest');
  const [responseJson, setResponseJson] = useState<string>('');
  const [statusCode, setStatusCode] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedCurl, setCopiedCurl] = useState<boolean>(false);

  if (!isOpen) return null;

  const endpoints: EndpointPreset[] = [
    {
      id: 'manifest',
      method: 'GET',
      path: '/api/v1',
      label: 'API Discovery Directory',
      description: 'Lists all available REST v1, AI Tutor, and Backup endpoints.'
    },
    {
      id: 'plans',
      method: 'GET',
      path: '/api/v1/plans/12',
      label: 'Flexible 12/14/16/20-Month Plan',
      description: 'Fetch dynamically scaled monthly milestones for 12, 14, 16, or 20 months.'
    },
    {
      id: 'roadmap-search',
      method: 'GET',
      path: '/api/v1/roadmap?search=RAG',
      label: 'Search Roadmap Concepts',
      description: 'Filter 9 phases and core concepts by keyword or difficulty.'
    },
    {
      id: 'schedule',
      method: 'GET',
      path: `/api/v1/schedule?pace=${pace}&limit=3`,
      label: 'Daily Study Schedule',
      description: 'Fetch paginated daily tasks adapted for your active study timeline.'
    },
    {
      id: 'progress-summary',
      method: 'POST',
      path: '/api/v1/progress/summary',
      label: 'Compute Mastery Analytics',
      description: 'Calculate overall progress %, phase breakdown, and next task from IDs.',
      body: {
        pace,
        completedConcepts,
        completedDays
      }
    },
    {
      id: 'projects',
      method: 'GET',
      path: '/api/v1/projects?category=visionary',
      label: 'Curriculum Projects',
      description: 'List standard resume or visionary future AI project blueprints.'
    },
    {
      id: 'careers',
      method: 'GET',
      path: '/api/v1/careers',
      label: 'AI Careers & Interview Prep',
      description: 'Retrieve salary bands, required skills, and interview Q&As.'
    },
    {
      id: 'health',
      method: 'GET',
      path: '/api/health',
      label: 'Health Check',
      description: 'Verify backend API & Express server uptime.'
    }
  ];

  const activeEndpoint = endpoints.find((e) => e.id === selectedId) || endpoints[0];
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const buildCurlCommand = () => {
    const url = `${baseUrl}${activeEndpoint.path}`;
    if (activeEndpoint.method === 'POST' && activeEndpoint.body) {
      return `curl -X POST "${url}" \\\n  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify(activeEndpoint.body)}'`;
    }
    return `curl "${url}"`;
  };

  const handleTestEndpoint = async (preset: EndpointPreset) => {
    setSelectedId(preset.id);
    setIsLoading(true);
    setResponseJson('');
    setStatusCode(null);

    try {
      const res = await fetch(preset.path, {
        method: preset.method,
        headers: preset.method === 'POST' ? { 'Content-Type': 'application/json' } : undefined,
        body: preset.method === 'POST' && preset.body ? JSON.stringify(preset.body) : undefined
      });
      setStatusCode(res.status);
      const data = await res.json();
      setResponseJson(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setResponseJson(JSON.stringify({ error: err?.message || 'Request failed' }, null, 2));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCurl = () => {
    navigator.clipboard.writeText(buildCurlCommand());
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-900 dark:text-slate-100 my-8">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>NeuroForge REST API v1 Explorer</span>
                <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  JSON · CORS Enabled
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Base URL: <span className="font-mono text-indigo-600 dark:text-indigo-400">{baseUrl}/api/v1</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
            aria-label="Close API explorer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800">
          {/* Left: Endpoint List */}
          <div className="md:col-span-5 p-4 space-y-2 max-h-[520px] overflow-y-auto bg-slate-50/50 dark:bg-slate-950/30">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">
              Available Endpoints
            </div>
            {endpoints.map((ep) => {
              const isSelected = ep.id === activeEndpoint.id;
              return (
                <button
                  key={ep.id}
                  type="button"
                  onClick={() => handleTestEndpoint(ep)}
                  className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer space-y-1 ${
                    isSelected
                      ? 'bg-white dark:bg-slate-900 border-indigo-500 ring-1 ring-indigo-500/30 shadow-xs'
                      : 'bg-white/70 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                      {ep.label}
                    </span>
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded shrink-0 ${
                        ep.method === 'POST'
                          ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                          : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                      }`}
                    >
                      {ep.method}
                    </span>
                  </div>
                  <div className="font-mono text-[11px] text-indigo-600 dark:text-indigo-400 truncate">
                    {ep.path}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                    {ep.description}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Right: Interactive Tester & Output */}
          <div className="md:col-span-7 p-4 sm:p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 font-mono text-xs">
                <Globe className="w-4 h-4 text-indigo-500" />
                <span className="font-bold text-slate-900 dark:text-white">
                  {activeEndpoint.method} {activeEndpoint.path}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleTestEndpoint(activeEndpoint)}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 rounded-lg cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{isLoading ? 'Running...' : 'Test Live Request'}</span>
              </button>
            </div>

            {/* cURL Snippet */}
            <div className="p-3 rounded-xl bg-slate-950 text-slate-200 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span className="flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                  <span>cURL Example</span>
                </span>
                <button
                  type="button"
                  onClick={handleCopyCurl}
                  className="flex items-center gap-1 text-slate-300 hover:text-white cursor-pointer"
                >
                  {copiedCurl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCurl ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="text-[11px] font-mono text-emerald-300 overflow-x-auto whitespace-pre-wrap break-all">
                {buildCurlCommand()}
              </pre>
            </div>

            {/* Live Response */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-600 dark:text-slate-400">
                  Response Payload
                </span>
                {statusCode !== null && (
                  <span
                    className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded ${
                      statusCode >= 200 && statusCode < 300
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                        : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                    }`}
                  >
                    HTTP {statusCode}
                  </span>
                )}
              </div>
              <pre className="h-72 overflow-auto p-3.5 rounded-xl bg-slate-900 text-slate-100 border border-slate-800 font-mono text-[11px] leading-relaxed">
                {responseJson || '// Click an endpoint on the left or "Test Live Request" to inspect the live JSON response.'}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
