import React, { useState } from 'react';
import { Bot, Send, Sparkles, Languages, CheckCircle2 } from 'lucide-react';
import type { CopilotResponse } from '../types/analysis';

interface CopilotChatProps {
  jobId: string;
}

export const CopilotChat: React.FC<CopilotChatProps> = ({ jobId }) => {
  const [query, setQuery] = useState('');
  const [language, setLanguage] = useState<'en' | 'ne'>('en');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<
    Array<{ sender: 'user' | 'copilot'; text: string; data?: CopilotResponse }>
  >([
    {
      sender: 'copilot',
      text: 'Hello rescuer. I am your Grounded Situation Report Copilot. Ask me about flooded areas, damaged roads, bridges, or isolated settlements in English or Nepali. Every figure is guaranteed to match the map.',
    },
  ]);

  const handleSend = async (customText?: string) => {
    const textToSend = customText || query;
    if (!textToSend.trim() || loading) return;

    setMessages((prev) => [...prev, { sender: 'user', text: textToSend }]);
    setQuery('');
    setLoading(true);

    try {
      const resp = await fetch(`/api/v1/analyses/${jobId}/copilot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: textToSend, language }),
      });

      if (!resp.ok) throw new Error('Copilot query failed');
      const data: CopilotResponse = await resp.json();

      setMessages((prev) => [
        ...prev,
        {
          sender: 'copilot',
          text: data.answer,
          data,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'copilot',
          text: 'Unable to connect to analysis engine. Please try again.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col h-[480px]">
      {/* Header */}
      <div className="px-4 py-3 bg-slate-800/60 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-blue-500/20 text-blue-400 border border-blue-500/30">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
              Situation Report Copilot
              <span className="text-[10px] font-normal text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                Zero-Hallucination
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">Grounded strictly in computed satellite numbers</p>
          </div>
        </div>

        {/* Language selector */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-700">
          <Languages className="w-3.5 h-3.5 text-slate-400 ml-1" />
          <button
            onClick={() => setLanguage('en')}
            className={`px-2 py-0.5 text-[11px] rounded font-medium transition ${
              language === 'en' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            English
          </button>
          <button
            onClick={() => setLanguage('ne')}
            className={`px-2 py-0.5 text-[11px] rounded font-medium transition ${
              language === 'ne' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            नेपाली (Nepali)
          </button>
        </div>
      </div>

      {/* Suggested Quick Prompts */}
      <div className="px-3 py-2 bg-slate-900/60 border-b border-slate-800 flex flex-wrap gap-1.5 text-[11px]">
        <button
          onClick={() => handleSend('Who is cut off?')}
          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md border border-slate-700 transition"
        >
          📍 Who is cut off?
        </button>
        <button
          onClick={() => handleSend('What infrastructure was damaged?')}
          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md border border-slate-700 transition"
        >
          🌉 Bridge & Road Damage
        </button>
        <button
          onClick={() => handleSend('कुन कुन बस्तीहरू सम्पर्कविहीन छन्?')}
          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md border border-slate-700 transition text-amber-300"
        >
          🇳🇵 सम्पर्कविहीन बस्तीहरू
        </button>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 p-3 overflow-y-auto space-y-3 text-xs">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-lg p-2.5 leading-relaxed ${
                m.sender === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800/80 text-slate-200 border border-slate-700'
              }`}
            >
              <p>{m.text}</p>
              {m.data && (
                <div className="mt-2 pt-2 border-t border-slate-700 text-[10px] text-slate-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>{m.data.confidence_statement}</span>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-800 rounded-lg p-2 text-slate-400 text-xs flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 animate-spin text-blue-400" />
              Verifying satellite metrics and querying road graph...
            </div>
          </div>
        )}
      </div>

      {/* Input box */}
      <div className="p-2.5 bg-slate-800/60 border-t border-slate-800 flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder={
            language === 'ne' ? 'बाढी र सम्पर्कविहीन बस्तीबारे सोध्नुहोस्...' : 'Ask about damaged roads, bridges, or villages...'
          }
          className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
        />
        <button
          onClick={() => handleSend()}
          disabled={loading || !query.trim()}
          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg flex items-center justify-center transition"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
