import React, { useEffect, useState, useCallback } from 'react';
import { Quote, RefreshCw, Copy, Check, X } from 'lucide-react';
import {
  DailyTechQuote,
  getDailyQuoteForDate,
  getRandomTechQuote
} from '../data/dailyQuotesData';
import { Language } from '../types';

interface DailyQuoteBannerProps {
  language: Language;
}

const DISMISSED_DATE_KEY = 'ai_mastery_dismissed_quote_date';

const getTodayKey = () => new Date().toISOString().split('T')[0];

export const DailyQuoteBanner: React.FC<DailyQuoteBannerProps> = ({ language }) => {
  const todayKey = getTodayKey();

  const [dismissed, setDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(DISMISSED_DATE_KEY) === todayKey;
    } catch {
      return false;
    }
  });
  const [quote, setQuote] = useState<DailyTechQuote | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const fetchQuote = useCallback(
    async (random = false, excludeId?: string) => {
      if (random) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      try {
        const params = new URLSearchParams();
        params.set('date', todayKey);
        if (random) {
          params.set('random', 'true');
          if (excludeId) params.set('exclude', excludeId);
        }

        const res = await fetch(`/api/v1/quotes/daily?${params.toString()}`);
        if (res.ok) {
          const payload = await res.json();
          if (payload?.quote?.text) {
            setQuote(payload.quote);
            return;
          }
        }
        setQuote(random ? getRandomTechQuote(excludeId) : getDailyQuoteForDate(todayKey));
      } catch {
        setQuote(random ? getRandomTechQuote(excludeId) : getDailyQuoteForDate(todayKey));
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [todayKey]
  );

  // Fetch daily quote when the user opens the app
  useEffect(() => {
    if (!dismissed) {
      fetchQuote(false);
    }
  }, [dismissed, fetchQuote]);

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISSED_DATE_KEY, todayKey);
    } catch {
      // Ignore storage restriction
    }
  };

  const handleCopy = async () => {
    if (!quote) return;
    try {
      await navigator.clipboard.writeText(`"${quote.text}" — ${quote.author}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Ignore clipboard fallback
    }
  };

  if (dismissed) return null;

  return (
    <aside
      aria-label="Daily AI & Technology Inspirational Quote"
      className="mb-6 p-4 sm:p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors"
    >
      {isLoading || !quote ? (
        <div className="flex items-center gap-3 animate-pulse">
          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-40 rounded bg-slate-100 dark:bg-slate-800" />
            <div className="h-4 w-3/4 rounded bg-slate-100 dark:bg-slate-800" />
          </div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
              <Quote className="w-4 h-4" />
            </div>

            <div className="min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                <span className="font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Daily AI & Tech Quote
                </span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">{todayKey}</span>
                <span aria-hidden="true">·</span>
                <span>{quote.topic}</span>
              </div>

              <blockquote className="text-sm sm:text-[15px] font-semibold text-slate-900 dark:text-white leading-relaxed">
                “{quote.text}”
              </blockquote>

              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-600 dark:text-slate-300">
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  — {quote.author}
                </span>
                <span className="text-slate-400 dark:text-slate-500">({quote.role})</span>
              </div>

              {language === 'hinglish' && quote.hinglishTakeaway && (
                <p className="text-[11px] text-indigo-700 dark:text-indigo-300/90 pt-0.5 leading-relaxed">
                  <span className="font-semibold">Aaj ki Seekh: </span>
                  {quote.hinglishTakeaway}
                </p>
              )}
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-start">
            <button
              type="button"
              onClick={() => fetchQuote(true, quote.id)}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer whitespace-nowrap"
              title="Fetch another AI/Tech quote"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Another</span>
            </button>

            <button
              type="button"
              onClick={handleCopy}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              title="Copy quote"
              aria-label="Copy quote"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>

            <button
              type="button"
              onClick={handleDismiss}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Dismiss today's quote"
              aria-label="Dismiss daily quote"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};
