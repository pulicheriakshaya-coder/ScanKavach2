/**
 * @file src/pages/AssistantPage.tsx
 * @description Local & Gemini-backed clinical screening AI Assistant with safety filtering.
 */

import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Bot, Send, ShieldAlert, Sparkles, User, ShieldCheck } from 'lucide-react';
import { getAssistantResponse, AssistantContext } from '../lib/assistant';
import { useApp } from '../context/AppContext';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
}

export const AssistantPage: React.FC = () => {
  const { lang } = useApp();
  const location = useLocation();
  const initialContext = (location.state as { analysisContext?: AssistantContext })?.analysisContext;

  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'Hello. I am the ScanKavach Assistant. I can explain screening results, thresholds, borderline scores, and general prevention. Remember, I am not a doctor and cannot diagnose or prescribe medicines.',
    },
  ]);

  const promptChips = [
    'What does a Review verdict mean?',
    'Why is a score considered borderline?',
    'What causes the safety gate to stop a scan?',
    'What are the common symptoms of pneumonia?',
    'Tell me about the National TB Programme in India.',
  ];

  const handleSendMessage = async (textToSend: string) => {
    const text = textToSend.trim();
    if (!text || loading) return;

    const userMsg: Message = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setQuery('');
    setLoading(true);

    try {
      const reply = await getAssistantResponse(text, initialContext, lang);
      const botMsg: Message = {
        id: `bot_${Date.now()}`,
        sender: 'assistant',
        text: reply,
      };
      setMessages((prev) => [...prev, botMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
          <Bot className="w-6 h-6 text-teal-400" />
          ScanKavach Assistant
        </h1>
        <p className="text-sm text-slate-400">
          Inquire about screening metrics, quality gates, and health information.
        </p>
      </div>

      {/* Privacy Guarantee & Safety Notice */}
      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-teal-400 flex-shrink-0" />
          <span>Only text summaries are sent to the AI. Scans never leave your device.</span>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-amber-300">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
          <span>No medical diagnoses or prescriptions</span>
        </div>
      </div>

      {/* Chat Messages Log */}
      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl p-4 overflow-y-auto space-y-4 shadow-xl">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex items-start gap-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {m.sender === 'assistant' && (
              <div className="w-7 h-7 rounded-lg bg-teal-600/30 text-teal-300 border border-teal-500/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot className="w-4 h-4" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-xl px-4 py-2.5 text-xs leading-relaxed ${
                m.sender === 'user'
                  ? 'bg-teal-600 text-white'
                  : 'bg-slate-800/80 border border-slate-700/60 text-slate-200'
              }`}
            >
              {m.text}
            </div>
            {m.sender === 'user' && (
              <div className="w-7 h-7 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-500 italic pl-10">
            <Sparkles className="w-3.5 h-3.5 animate-spin text-teal-400" />
            Thinking...
          </div>
        )}
      </div>

      {/* Suggested Prompt Chips */}
      <div className="flex flex-wrap gap-1.5">
        {promptChips.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(chip)}
            className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] border border-slate-700 transition-colors"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage(query);
        }}
        className="flex items-center gap-2"
      >
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask a question about your screening results or lung health..."
          className="flex-1 px-4 py-2.5 bg-slate-900 text-slate-100 text-xs border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-md"
        />
        <button
          type="submit"
          disabled={!query.trim() || loading}
          className="p-2.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white rounded-xl shadow-md transition-colors"
          aria-label="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
