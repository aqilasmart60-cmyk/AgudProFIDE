import React, { useState } from 'react';
import { BookOpen, Check, Copy, HelpCircle, Loader2, Send, Shield, Sparkles } from 'lucide-react';
import { Tournament } from '../types/chess';
import { FIDE_ARTICLES_DATABASE, PRESET_ARBITER_SCENARIOS } from '../utils/fideRules';

interface ArbiterAIPanelProps {
  tournament: Tournament;
}

export const ArbiterAIPanel: React.FC<ArbiterAIPanelProps> = ({ tournament }) => {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [rulingResult, setRulingResult] = useState<{ ruling: string; source: string } | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');

  const handleAsk = async (queryText?: string) => {
    const q = (queryText || question).trim();
    if (!q) return;

    setLoading(true);
    setRulingResult(null);

    try {
      const res = await fetch('/api/arbiter/consult', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          tournamentContext: {
            name: tournament.name,
            type: tournament.type,
            timeControl: tournament.timeControlDescription,
            defaultTime: tournament.defaultTimeMinutes,
            currentRound: tournament.currentRound,
            playersCount: tournament.players.length,
          },
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      setRulingResult({
        ruling: data.ruling,
        source: data.source || 'FIDE Handbook Regulations',
      });
    } catch (err: any) {
      // Fallback to built-in handbook answer if server unavailable
      const matched = PRESET_ARBITER_SCENARIOS.find((s) =>
        s.scenario.toLowerCase().includes(q.toLowerCase().slice(0, 15)) ||
        q.toLowerCase().includes(s.title.toLowerCase().slice(0, 10))
      );

      setRulingResult({
        ruling: matched
          ? matched.defaultRuling
          : `Official Arbiter Handbook Verdict:\n\nUnder FIDE Laws of Chess (valid 2023–2026), all arbiter decisions must adhere to:\n1. Article 4 (Act of moving piece & Touch-Move rule)\n2. Article 6.7 (Default time & forfeits)\n3. Article 7.5 (Illegal moves: +2 min standard, +1 min blitz, forfeit on 2nd illegal move)\n4. Article 9 (Draw claims: threefold repetition & 50-move rule must follow exact scoresheet claim procedure)\n5. Article 11.3 (Electronic devices strictly prohibited in venue; instant loss).\n\nIf the dispute involves a clock flag fall, verify whether opponent has sufficient mating material under Article 6.9.`,
        source: 'built-in-fide-handbook',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePresetClick = (idx: number) => {
    setSelectedPreset(idx);
    const preset = PRESET_ARBITER_SCENARIOS[idx];
    setQuestion(`${preset.scenario} ${preset.question}`);
    handleAsk(`${preset.scenario} ${preset.question}`);
  };

  const handleCopyRuling = () => {
    if (!rulingResult) return;
    navigator.clipboard.writeText(rulingResult.ruling);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredArticles = FIDE_ARTICLES_DATABASE.filter(
    (art) => activeCategoryFilter === 'all' || art.category === activeCategoryFilter
  );

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span>FIDE Laws of Chess & Regulations Authority</span>
            <span aria-hidden="true">·</span>
            <span>Chief Arbiter Consultation</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-400" />
            Chief Arbiter AI Regulations Advisor
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Interactive Dispute Consultation */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Ask a FIDE Rule, Incident, or Pairing Question
              </h2>
              <span className="text-[11px] font-mono text-slate-400">
                Current Time Control: {tournament.timeControlCategory}
              </span>
            </div>

            <div className="space-y-2">
              <textarea
                rows={3}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Describe an incident, illegal move, touch-move dispute, clock flag, phone violation, or pairing question..."
                className="w-full p-3 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500 transition-colors resize-none font-sans"
              />
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  Tip: Include move number, time control, or whether clocks were running.
                </span>
                <button
                  disabled={loading || !question.trim()}
                  onClick={() => handleAsk()}
                  className="px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:pointer-events-none rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Analyzing FIDE Rules...
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      Get Arbiter Ruling
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Presets Grid */}
            <div className="pt-2 border-t border-slate-800">
              <span className="text-xs font-semibold text-slate-400 block mb-2">
                Frequently Disputed Match Scenarios:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PRESET_ARBITER_SCENARIOS.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => handlePresetClick(idx)}
                    className={`text-left p-2.5 rounded-lg border text-xs transition-colors ${
                      selectedPreset === idx
                        ? 'bg-amber-500/10 border-amber-500/50 text-amber-200'
                        : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="font-semibold text-slate-200 truncate">{preset.title}</div>
                    <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                      {preset.scenario}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Ruling Result Display */}
          {rulingResult && (
            <div className="p-5 rounded-xl bg-slate-900 border border-amber-500/30 space-y-3 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-amber-400" />
                  <span className="text-xs uppercase tracking-wider font-bold text-amber-400">
                    Official Chief Arbiter Decision
                  </span>
                </div>
                <button
                  onClick={handleCopyRuling}
                  className="px-2.5 py-1 text-xs text-slate-300 hover:text-slate-100 bg-slate-950 border border-slate-800 rounded transition-colors flex items-center gap-1 font-mono"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy Verdict'}
                </button>
              </div>

              <div className="prose prose-invert prose-xs text-slate-200 max-w-none whitespace-pre-line text-xs leading-relaxed font-sans">
                {rulingResult.ruling}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: FIDE Rulebook Quick Reference */}
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-400" />
                FIDE Handbook Articles
              </h3>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-1 flex-wrap">
              {[
                { id: 'all', label: 'All' },
                { id: 'laws', label: 'Laws' },
                { id: 'penalties', label: 'Penalties' },
                { id: 'clock', label: 'Clock' },
                { id: 'conduct', label: 'Conduct' },
                { id: 'swiss', label: 'Swiss' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setActiveCategoryFilter(f.id)}
                  className={`px-2 py-0.5 text-[11px] rounded transition-colors ${
                    activeCategoryFilter === f.id
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-slate-200 bg-slate-950'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
              {filteredArticles.map((art) => (
                <div
                  key={art.id}
                  className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-amber-400">
                      {art.article}
                    </span>
                    <span className="text-[10px] uppercase font-mono text-slate-500">
                      {art.category}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-slate-200">{art.title}</div>
                  <div className="text-[11px] text-slate-400 leading-normal">{art.summary}</div>
                  <div className="pt-1 text-[11px] text-amber-300/80 font-mono border-t border-slate-900">
                    <span className="font-bold">Arbiter Action:</span> {art.arbiterAction}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
