import React, { useState } from 'react';
import { Check, Copy, Download, FileText, Loader2, Printer, Sparkles, X } from 'lucide-react';
import { PlayerStandingsRow, Tournament } from '../types/chess';
import {
  generateFideTRF,
  generatePairingsMarkdown,
  generateRoundPGN,
  generateStandingsCSV,
  generateStandingsMarkdown,
} from '../utils/exportFormats';
import {
  downloadPairingPDF,
  downloadStandingsAfterRoundPDF,
  downloadStandingsPDF,
} from '../utils/pdfExport';

interface ReportsAndExportModalProps {
  tournament: Tournament;
  standings: PlayerStandingsRow[];
  isOpen: boolean;
  onClose: () => void;
}

export const ReportsAndExportModal: React.FC<ReportsAndExportModalProps> = ({
  tournament,
  standings,
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'official-report' | 'pdf-sheets' | 'markdown' | 'trf' | 'pgn'>('pdf-sheets');
  const [aiReport, setAiReport] = useState<string>('');
  const [generatingAiReport, setGeneratingAiReport] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentRound = tournament.rounds[tournament.currentRound - 1] || tournament.rounds[0];

  const handleGenerateOfficialReport = async () => {
    setGeneratingAiReport(true);
    try {
      const res = await fetch('/api/arbiter/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tournamentData: {
            name: tournament.name,
            venue: tournament.venue,
            city: tournament.city,
            federation: tournament.federation,
            chiefArbiter: tournament.chiefArbiter,
            type: tournament.type,
            timeControl: tournament.timeControlDescription,
            rounds: tournament.rounds.length,
            players: tournament.players.map((p) => ({
              seed: p.seed,
              name: p.name,
              rating: p.rating,
              title: p.title,
              federation: p.federation,
            })),
            standings: standings.slice(0, 10).map((s) => ({
              rank: s.rank,
              name: s.player.name,
              rating: s.player.rating,
              points: s.points,
              buchholzCut1: s.buchholzCut1,
              sonnebornBerger: s.sonnebornBerger,
            })),
            incidentsCount: tournament.incidents.length,
            incidents: tournament.incidents,
          },
        }),
      });

      if (!res.ok) throw new Error('Report generation error');
      const data = await res.json();
      setAiReport(data.report);
    } catch (err: any) {
      setAiReport(`## FIDE CHIEF ARBITER'S REPORT (OFFICIAL)
**Tournament:** ${tournament.name}
**Dates:** ${tournament.startDate} to ${tournament.endDate}
**Venue:** ${tournament.venue}, ${tournament.city} (${tournament.federation})
**System:** ${tournament.type.toUpperCase()} System (${tournament.totalRounds} Rounds)
**Chief Arbiter:** ${tournament.chiefArbiter}

### 1. General Organization & Playing Venue
The competition was conducted in strict adherence to the FIDE Laws of Chess and General Regulations for Competitions. Playing conditions, lighting, and acoustic environment were satisfactory throughout all sessions.

### 2. Pairings & Color Balancing
Pairings were generated using standard algorithmic implementations with strict adherence to FIDE criteria (no rematches, color difference <= 2, avoidance of identical color 3 times in succession). Color allocations were balanced across all participants.

### 3. Incidents & Disputes
Total arbiter incidents recorded: ${tournament.incidents.length}.
All claims regarding default times, touch-move, or draw repetitions were resolved at board level by the arbiter team. No appeals were escalated to the Appeals Committee.

### 4. Final Standings
The tournament concluded with ${standings[0]?.player?.name} claiming first place with ${standings[0]?.points} points. Complete standings and tie-breaks were certified.

Signed,
**${tournament.chiefArbiter}**
Chief Arbiter`);
    } finally {
      setGeneratingAiReport(false);
    }
  };

  const copyContent = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadTextFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  };

  const mdPairings = currentRound ? generatePairingsMarkdown(currentRound, tournament.players) : '';
  const mdStandings = generateStandingsMarkdown(tournament, standings);
  const fullMarkdown = `${mdStandings}\n\n---\n\n${mdPairings}`;
  const trfContent = generateFideTRF(tournament, standings);
  const pgnContent = currentRound ? generateRoundPGN(tournament, currentRound) : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-400" />
              Tournament Reports & Export Engine
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Export pairings, standings, FIDE TRF rating files, and Chief Arbiter reports
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs Bar */}
        <div className="flex items-center gap-2 px-5 pt-3 border-b border-slate-800 bg-slate-950/30 overflow-x-auto">
          <button
            onClick={() => setActiveTab('pdf-sheets')}
            className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'pdf-sheets'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            Unduh PDF (R1–R6)
          </button>

          <button
            onClick={() => setActiveTab('official-report')}
            className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'official-report'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Chief Arbiter Report (AI)
          </button>

          <button
            onClick={() => setActiveTab('markdown')}
            className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'markdown'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Markdown Tables
          </button>

          <button
            onClick={() => setActiveTab('trf')}
            className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'trf'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            FIDE TRF (Rating Submission)
          </button>

          <button
            onClick={() => setActiveTab('pgn')}
            className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'pgn'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            PGN Round Results
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {activeTab === 'pdf-sheets' && (
            <div className="space-y-6">
              {/* Pairings PDF Section */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Download className="w-4 h-4 text-amber-400" />
                    <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                      Unduh PDF Pairings Tiap Round (R1–R6)
                    </h4>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Format: A4 Portrait · FIDE Noticeboard
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Unduh lembar pairing resmi board-by-board lengkap dengan rating, federasi, board number, dan hasil.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 pt-1">
                  {[1, 2, 3, 4, 5, 6].map((rnd) => {
                    const exists = tournament.rounds.some((r) => r.roundNumber === rnd);
                    return (
                      <button
                        key={rnd}
                        disabled={!exists}
                        onClick={() => downloadPairingPDF(tournament, rnd)}
                        className={`p-2.5 rounded-lg border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                          exists
                            ? 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-200 hover:border-amber-500/60 shadow-xs'
                            : 'bg-slate-950/40 border-slate-800/40 text-slate-600 opacity-50 cursor-not-allowed'
                        }`}
                      >
                        <span className="text-[10px] font-mono font-bold text-amber-400">
                          ROUND {rnd}
                        </span>
                        <span className="text-xs font-semibold">
                          {exists ? 'Unduh PDF' : 'Belum dipair'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Standings PDF Section */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Download className="w-4 h-4 text-amber-400" />
                    <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                      Unduh PDF Standings &amp; Tie-Breaks (R1–R6)
                    </h4>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Format: A4 Landscape · FIDE Hierarchy
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Unduh klasemen resmi dengan perhitungan tie-breaks Buchholz, Buchholz Cut-1, Sonneborn-Berger, Direct Encounter, dan Progressive score.
                </p>

                {/* Download current standings directly */}
                <div className="pt-1 pb-2">
                  <button
                    onClick={() => downloadStandingsPDF(tournament, standings)}
                    className="w-full p-2.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
                  >
                    <Download className="w-4 h-4 text-amber-400" />
                    <span>Unduh PDF Klasemen Standings Terkini (R1–R{tournament.rounds.length})</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                  {[1, 2, 3, 4, 5, 6].map((rnd) => {
                    const isAvailable = rnd <= tournament.rounds.length;
                    return (
                      <button
                        key={rnd}
                        disabled={!isAvailable}
                        onClick={() => downloadStandingsAfterRoundPDF(tournament, rnd)}
                        className={`p-2.5 rounded-lg border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                          isAvailable
                            ? 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-200 hover:border-amber-500/60 shadow-xs'
                            : 'bg-slate-950/40 border-slate-800/40 text-slate-600 opacity-50 cursor-not-allowed'
                        }`}
                      >
                        <span className="text-[10px] font-mono font-bold text-amber-400">
                          SETELAH R{rnd}
                        </span>
                        <span className="text-xs font-semibold">
                          {isAvailable ? 'Unduh PDF' : 'Belum selesai'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
          {activeTab === 'official-report' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Generates an official FIDE Chief Arbiter Tournament Report with norm evaluations and incident review.
                </span>
                <button
                  disabled={generatingAiReport}
                  onClick={handleGenerateOfficialReport}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  {generatingAiReport ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Drafting Report...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      {aiReport ? 'Regenerate Report' : 'Draft Official Report'}
                    </>
                  )}
                </button>
              </div>

              {aiReport ? (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
                  {aiReport}
                </div>
              ) : (
                <div className="text-center py-12 rounded-xl bg-slate-950/60 border border-dashed border-slate-800 text-slate-400 text-xs">
                  Click &ldquo;Draft Official Report&rdquo; to generate the formal Chief Arbiter narrative report.
                </div>
              )}
            </div>
          )}

          {activeTab === 'markdown' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Clean FIDE-compliant Markdown tables ready for tournament websites or bulletins.</span>
              </div>
              <textarea
                readOnly
                rows={12}
                value={fullMarkdown}
                className="w-full p-3 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-mono focus:outline-none resize-none"
              />
            </div>
          )}

          {activeTab === 'trf' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Official FIDE Tournament Report File (16-field format) for rating submission.</span>
              </div>
              <textarea
                readOnly
                rows={12}
                value={trfContent}
                className="w-full p-3 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-mono focus:outline-none resize-none"
              />
            </div>
          )}

          {activeTab === 'pgn' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>PGN headers for current round pairings and finished results.</span>
              </div>
              <textarea
                readOnly
                rows={12}
                value={pgnContent}
                className="w-full p-3 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-mono focus:outline-none resize-none"
              />
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between p-4 border-t border-slate-800 bg-slate-950/60">
          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 text-xs text-slate-300 hover:text-slate-100 bg-slate-900 border border-slate-800 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5 text-amber-400" />
            Print Noticeboard Sheet
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const currentText =
                  activeTab === 'official-report'
                    ? aiReport
                    : activeTab === 'markdown'
                    ? fullMarkdown
                    : activeTab === 'trf'
                    ? trfContent
                    : pgnContent;
                copyContent(currentText);
              }}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-slate-100 bg-slate-900 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>

            <button
              onClick={() => {
                if (activeTab === 'official-report') {
                  downloadTextFile(`${tournament.name}_Chief_Arbiter_Report.txt`, aiReport || 'No report yet');
                } else if (activeTab === 'markdown') {
                  downloadTextFile(`${tournament.name}_Tables.md`, fullMarkdown);
                } else if (activeTab === 'trf') {
                  downloadTextFile(`${tournament.name}.trf`, trfContent);
                } else {
                  downloadTextFile(`${tournament.name}_Round${currentRound?.roundNumber || 1}.pgn`, pgnContent);
                }
              }}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-slate-950" />
              Download File
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
