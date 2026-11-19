import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Bot,
  Send,
  X,
  Sparkles,
  Loader2,
  Maximize2,
  MessageSquareHeart,
  GripHorizontal,
  RotateCcw
} from 'lucide-react';
import { LearnerTutorContext } from '../types';

interface QuickMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
}

interface FloatingAiTutorProps {
  learnerContext: LearnerTutorContext;
  onOpenFullTutor: () => void;
}

interface TutorPosition {
  x: number;
  y: number;
}

const TUTOR_POS_KEY = 'ai_mastery_tutor_pos_v1';

const getDefaultPos = (isOpen: boolean): TutorPosition => {
  if (typeof window === 'undefined') return { x: 20, y: 200 };
  const h = window.innerHeight || 720;
  return {
    x: 20,
    y: Math.max(76, h - (isOpen ? 470 : 80))
  };
};

export const FloatingAiTutor: React.FC<FloatingAiTutorProps> = ({
  learnerContext,
  onOpenFullTutor
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<QuickMessage[]>([
    {
      id: 'welcome-tutor',
      role: 'model',
      content:
        learnerContext.language === 'hinglish'
          ? 'Hi! Main aapka 24/7 AI Tutor hoon. Koi bhi Python, ML, Transformer ya coding doubt turant poochhein!'
          : 'Hi! I am your 24/7 AI Tutor. Ask me any Python, ML, Deep Learning, or architecture doubt anytime!'
    }
  ]);

  const [position, setPosition] = useState<TutorPosition>(() => {
    try {
      const saved = localStorage.getItem(TUTOR_POS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Number.isFinite(parsed?.x) && Number.isFinite(parsed?.y)) {
          return parsed;
        }
      }
    } catch {}
    return getDefaultPos(false);
  });
  const [isDragging, setIsDragging] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const dragOriginRef = useRef<{
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    moved: boolean;
  } | null>(null);

  const clampPosition = useCallback(
    (rawX: number, rawY: number): TutorPosition => {
      if (typeof window === 'undefined') return { x: rawX, y: rawY };
      const elWidth = containerRef.current?.offsetWidth || (isOpen ? 390 : 185);
      const elHeight = containerRef.current?.offsetHeight || (isOpen ? 460 : 56);
      const maxX = Math.max(8, window.innerWidth - elWidth - 8);
      const maxY = Math.max(8, window.innerHeight - elHeight - 8);
      return {
        x: Math.min(maxX, Math.max(8, Math.round(rawX))),
        y: Math.min(maxY, Math.max(8, Math.round(rawY)))
      };
    },
    [isOpen]
  );

  // Keep inside viewport on open/close or window resize
  useEffect(() => {
    setPosition((prev) => clampPosition(prev.x, prev.y));
  }, [isOpen, clampPosition]);

  useEffect(() => {
    const onResize = () => setPosition((prev) => clampPosition(prev.x, prev.y));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [clampPosition]);

  useEffect(() => {
    try {
      localStorage.setItem(TUTOR_POS_KEY, JSON.stringify(position));
    } catch {}
  }, [position]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleDragStart = (e: React.PointerEvent<HTMLElement>) => {
    // Do not hijack clicks on interactive buttons inside header
    if ((e.target as HTMLElement).closest('button[data-no-drag="true"]')) {
      return;
    }
    e.preventDefault();
    dragOriginRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: position.x,
      origY: position.y,
      moved: false
    };
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (e: PointerEvent) => {
      if (!dragOriginRef.current) return;
      const dx = e.clientX - dragOriginRef.current.startX;
      const dy = e.clientY - dragOriginRef.current.startY;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        dragOriginRef.current.moved = true;
      }
      setPosition(clampPosition(dragOriginRef.current.origX + dx, dragOriginRef.current.origY + dy));
    };

    const handleUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
    };
  }, [isDragging, clampPosition]);

  const sendQuickQuestion = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || isLoading) return;

    const userMsg: QuickMessage = {
      id: `q-user-${Date.now()}`,
      role: 'user',
      content: text
    };
    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    if (!overrideText) setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextHistory.map((m) => ({ role: m.role, content: m.content })),
          model: 'gemini-4-hydrogen',
          enableSearchGrounding: false,
          userRole: 'socratic-tutor',
          learnerContext
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Server error ${res.status}`);
      }

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          id: `q-model-${Date.now()}`,
          role: 'model',
          content: data.reply || 'Here to help! Could you clarify your question?'
        }
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `q-err-${Date.now()}`,
          role: 'model',
          content: `Could not reach 24/7 AI Tutor: ${err?.message || 'Unknown error'}`
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <div
        ref={containerRef}
        style={{ left: `${position.x}px`, top: `${position.y}px`, touchAction: 'none' }}
        onPointerDown={handleDragStart}
        onClick={() => {
          if (dragOriginRef.current?.moved) return;
          setIsOpen(true);
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(true);
          }
        }}
        className={`fixed z-40 flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-600/30 border border-indigo-400/40 select-none ${
          isDragging ? 'cursor-grabbing scale-[1.02]' : 'cursor-grab transition-shadow'
        }`}
        title="Drag anywhere to move · Click to open 24/7 AI Tutor"
      >
        <GripHorizontal className="w-3.5 h-3.5 text-indigo-200/80 shrink-0" />
        <div className="relative">
          <Bot className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-indigo-600" />
        </div>
        <div className="text-left">
          <span className="text-xs font-bold block leading-none">24/7 AI Tutor</span>
          <span className="text-[10px] text-indigo-100 font-mono">Drag · Online</span>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
      className={`fixed z-40 w-[340px] sm:w-[390px] max-w-[calc(100vw-1rem)] bg-white dark:bg-slate-900 rounded-2xl border border-indigo-200 dark:border-indigo-800 shadow-2xl overflow-hidden flex flex-col ${
        isDragging ? 'select-none ring-2 ring-indigo-500/40' : ''
      }`}
    >
      {/* Draggable Header */}
      <div
        onPointerDown={handleDragStart}
        style={{ touchAction: 'none' }}
        className={`px-4 py-3 bg-gradient-to-r from-indigo-600 to-slate-900 text-white flex items-center justify-between select-none ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        title="Drag header to move 24/7 AI Tutor anywhere on screen"
      >
        <div className="flex items-center gap-2 min-w-0">
          <GripHorizontal className="w-4 h-4 text-white/60 shrink-0" />
          <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
            <MessageSquareHeart className="w-4 h-4 text-emerald-300" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold flex items-center gap-1.5">
              <span>24/7 AI Tutor</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
            </div>
            <div className="text-[10px] text-indigo-100 font-mono truncate">
              {learnerContext.pace} · {learnerContext.completedConceptsCount}/{learnerContext.totalConceptsCount} mastered
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            data-no-drag="true"
            onClick={() => setPosition(getDefaultPos(isOpen))}
            className="p-1.5 rounded-lg text-white/75 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Reset position"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            data-no-drag="true"
            onClick={() => {
              setIsOpen(false);
              onOpenFullTutor();
            }}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Expand full 24/7 AI Tutor workspace"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            data-no-drag="true"
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Minimize tutor"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Prompts */}
      <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 flex gap-1.5 overflow-x-auto no-scrollbar bg-slate-50/70 dark:bg-slate-950/40">
        {[
          learnerContext.language === 'hinglish'
            ? 'Backprop easy Hindi analogy se samjhao'
            : 'Explain Backprop simply',
          'Quiz me on Self-Attention',
          'Suggest my next 25m study step'
        ].map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => sendQuickQuestion(q)}
            className="shrink-0 flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-indigo-600 dark:text-indigo-300 hover:border-indigo-400 cursor-pointer"
          >
            <Sparkles className="w-2.5 h-2.5 text-amber-500" />
            <span>{q}</span>
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="h-72 overflow-y-auto p-3 space-y-3 text-xs">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-xl px-3 py-2 leading-relaxed whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 px-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
            <span>Tutor is thinking...</span>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendQuickQuestion();
        }}
        className="p-2.5 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 bg-slate-50/70 dark:bg-slate-900"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            learnerContext.language === 'hinglish'
              ? '24/7 AI Tutor se poochhein...'
              : 'Ask your 24/7 AI Tutor...'
          }
          className="flex-1 px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white cursor-pointer"
          aria-label="Send tutor question"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
