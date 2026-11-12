import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Bot,
  User as UserIcon,
  Sparkles,
  Globe,
  Trash2,
  Copy,
  Check,
  Cpu,
  Layers,
  HelpCircle,
  ExternalLink,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { Language } from '../types';
import { LiveVoiceMentor } from './LiveVoiceMentor';

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  modelUsed?: string;
  sources?: Array<{ title: string; url: string }>;
}

interface GeminiChatbotViewProps {
  language: Language;
}

export const GeminiChatbotView: React.FC<GeminiChatbotViewProps> = ({ language }) => {
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem('neuroforge_chat_history');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'init-1',
        role: 'model',
        content:
          language === 'hinglish'
            ? 'Namaste! Main hoon aapka AI Engineering Mentor (NeuroMentor). Main aapko Mathematics, Transformers, Production RAG, Multi-Agent Swarms, aur 2027 Reasoning Models mein guide karne ke liye taiyaar hoon. Aap mujhse koi bhi concept, code review, ya technical interview doubt pooch sakte hain!'
            : 'Hello! I am NeuroMentor, your Lead AI Engineering Principal & Mentor. I am here to help you master Mathematics, Deep Learning, Transformers, Production RAG, Autonomous Agent Swarms, and Future AI Architectures. Ask me any concept, architectural trade-off, or interview question!',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: 'gemini-3.8-flash',
      },
    ];
  });

  const [inputPrompt, setInputPrompt] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.8-flash');
  const [enableSearchGrounding, setEnableSearchGrounding] = useState<boolean>(true);
  const [selectedRole, setSelectedRole] = useState<string>('general');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
    try {
      localStorage.setItem('neuroforge_chat_history', JSON.stringify(messages));
    } catch {}
  }, [messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputPrompt).trim();
    if (!text || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputPrompt('');
    setIsLoading(true);

    try {
      // Build conversation history for API
      const conversationPayload = newMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: conversationPayload,
          model: selectedModel,
          enableSearchGrounding: enableSearchGrounding && selectedModel === 'gemini-3.8-flash',
          userRole: selectedRole,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with ${res.status}`);
      }

      const data = await res.json();

      const modelMessage: Message = {
        id: `model-${Date.now()}`,
        role: 'model',
        content: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: data.modelUsed,
        sources: data.sources || [],
      };

      setMessages((prev) => [...prev, modelMessage]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMessage: Message = {
        id: `err-${Date.now()}`,
        role: 'model',
        content: `Error: ${err.message || 'Unable to connect to Gemini API. Please verify server connection.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    if (confirm('Are you sure you want to clear your chat history?')) {
      const reset = [
        {
          id: 'init-1',
          role: 'model' as const,
          content: 'Chat history cleared. How can I assist your AI Engineering studies today?',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          modelUsed: selectedModel,
        },
      ];
      setMessages(reset);
      localStorage.removeItem('neuroforge_chat_history');
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const promptSuggestions = [
    {
      title: 'FlashAttention-2',
      prompt: 'Explain FlashAttention-2 vs Standard Attention from first principles with memory hierarchy equations.',
    },
    {
      title: 'GraphRAG vs Vector RAG',
      prompt: 'What are the concrete architectural trade-offs between Hybrid GraphRAG (Knowledge Graph + Vector) and pure dense retrieval?',
    },
    {
      title: 'Mock Interview: KV-Cache',
      prompt: 'Act as a Senior AI Staff Engineer and ask me 3 in-depth interview questions regarding KV-Cache memory bandwidth in LLM inference.',
    },
    {
      title: 'Hinglish: MCTS Reasoning',
      prompt: 'Hinglish mein samjhao ki Test-Time Compute aur Monte Carlo Tree Search (MCTS) reasoning models (jaise o1/o3) mein kaise kaam karta hai.',
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="relative p-6 sm:p-8 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 text-white border border-slate-800 shadow-xl overflow-hidden">
        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400">
            <Bot className="w-4 h-4 text-emerald-400" />
            <span>AI COPILOT & MENTOR</span>
            <span aria-hidden="true">·</span>
            <span>MULTI-TURN GEMINI REASONING</span>
            {enableSearchGrounding && selectedModel === 'gemini-3.8-flash' && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-emerald-400 flex items-center gap-1 font-mono">
                  <Globe className="w-3 h-3" /> Search Grounded
                </span>
              </>
            )}
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
            NeuroMentor: Interactive AI Engineering Assistant
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-3xl">
            {language === 'hinglish'
              ? 'Multi-turn chat powered by Gemini models. Live Google Search grounding se latest papers aur AI news check karein, complex STEM problems solve karein aur technical interview practice karein.'
              : 'Multi-turn AI mentor powered by Gemini with Google Search grounding. Ask architecture doubts, debug PyTorch code, or prepare for technical system design interviews.'}
          </p>
        </div>
      </div>

      {/* Live Voice Duplex Conversation (gemini-3.8-live) */}
      <LiveVoiceMentor language={language} />

      {/* Control Bar: Model, Role, and Search Grounding */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-4">
        {/* Model Selection */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Model:</span>
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs">
            <button
              onClick={() => setSelectedModel('gemini-3.8-flash')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                selectedModel === 'gemini-3.8-flash'
                  ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              gemini-3.8-flash (General + Search)
            </button>
            <button
              onClick={() => setSelectedModel('gemini-4-argon')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                selectedModel === 'gemini-4-argon'
                  ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              gemini-4-argon (Complex STEM)
            </button>
            <button
              onClick={() => setSelectedModel('gemini-3.1-flash-lite')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                selectedModel === 'gemini-3.1-flash-lite'
                  ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              gemini-3.1-flash-lite (Fast)
            </button>
          </div>
        </div>

        {/* Role & Search Grounding */}
        <div className="flex items-center gap-3">
          {/* Persona Role */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-semibold text-slate-600 dark:text-slate-400">Role:</span>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-2.5 py-1 text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 cursor-pointer"
            >
              <option value="general">Principal Mentor</option>
              <option value="interview-coach">Interview Screener</option>
              <option value="code-architect">Production Code Architect</option>
            </select>
          </div>

          {/* Search Grounding Toggle */}
          <button
            onClick={() => setEnableSearchGrounding(!enableSearchGrounding)}
            disabled={selectedModel !== 'gemini-3.8-flash'}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
              enableSearchGrounding && selectedModel === 'gemini-3.8-flash'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 opacity-70'
            }`}
            title="Enable live Google Search grounding on gemini-3.8-flash"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Search Grounding</span>
          </button>

          {/* Clear history */}
          <button
            onClick={handleClearHistory}
            className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition-colors cursor-pointer"
            title="Clear Chat History"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Prompt Starters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {promptSuggestions.map((item, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(item.prompt)}
            className="p-3 text-left rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 transition-all shadow-xs cursor-pointer group"
          >
            <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 flex items-center justify-between">
              <span>{item.title}</span>
              <Sparkles className="w-3 h-3 text-amber-500 opacity-60 group-hover:opacity-100" />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
              {item.prompt}
            </p>
          </button>
        ))}
      </div>

      {/* Main Chat Thread */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-[580px]">
        {/* Scrollable Message List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {messages.map((msg) => {
            const isModel = msg.role === 'model';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 sm:gap-4 ${isModel ? 'justify-start' : 'justify-end'}`}
              >
                {/* Model Avatar */}
                {isModel && (
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-xs">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                {/* Message Bubble */}
                <div
                  className={`relative max-w-2xl rounded-2xl px-4 py-3 sm:px-5 sm:py-3.5 text-sm leading-relaxed ${
                    isModel
                      ? 'bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 text-slate-800 dark:text-slate-100'
                      : 'bg-indigo-600 text-white shadow-sm'
                  }`}
                >
                  {/* Meta Bar */}
                  <div className="flex items-center justify-between gap-3 text-[11px] mb-1.5 opacity-70">
                    <span className="font-semibold">{isModel ? 'NeuroMentor' : 'You'}</span>
                    <div className="flex items-center gap-2 font-mono">
                      {msg.modelUsed && <span>{msg.modelUsed}</span>}
                      <span>{msg.timestamp}</span>
                    </div>
                  </div>

                  {/* Message Content */}
                  <div className="whitespace-pre-wrap font-sans text-xs sm:text-sm">
                    {msg.content}
                  </div>

                  {/* Grounding Sources (if web search was used) */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-700 space-y-1.5">
                      <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5" />
                        <span>Search Grounded Sources:</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {msg.sources.map((src, idx) => (
                          <a
                            key={idx}
                            href={src.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 hover:underline"
                          >
                            <span className="truncate max-w-[200px]">{src.title}</span>
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Copy Button */}
                  <button
                    onClick={() => copyToClipboard(msg.content, msg.id)}
                    className="absolute top-2 right-2 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded transition-colors"
                    title="Copy message"
                  >
                    {copiedId === msg.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {/* User Avatar */}
                {!isModel && (
                  <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-slate-800 flex items-center justify-center text-white shrink-0">
                    <UserIcon className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex gap-3 justify-start items-center">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0">
                <Bot className="w-4 h-4 animate-spin" />
              </div>
              <div className="px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                <span>NeuroMentor is thinking with {selectedModel}...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder={
                language === 'hinglish'
                  ? 'Koi bhi AI question poochhein (e.g. KV-Cache, LoRA, MCTS, Agent Swarms)...'
                  : 'Ask any AI Engineering question (e.g. FlashAttention, LoRA, Agentic RAG)...'
              }
              className="flex-1 px-4 py-2.5 text-sm bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
            />
            <button
              type="submit"
              disabled={!inputPrompt.trim() || isLoading}
              className="flex items-center justify-center px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs shadow-sm transition-all cursor-pointer shrink-0"
            >
              <Send className="w-4 h-4 mr-1.5" />
              <span>Send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
