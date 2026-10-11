import React, { useRef, useState, useEffect } from 'react';
import { AlertCircle, AlertTriangle, ArrowRight, Check, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Copy, Download, FileText, Flag, Plus, Printer, ShieldAlert } from 'lucide-react';
import { GameResult, Pairing, Player, Round, Tournament } from '../types/chess';
import { generatePairingsMarkdown } from '../utils/exportFormats';
import { downloadPairingPDF } from '../utils/pdfExport';

interface PairingBoardViewProps {
  tournament: Tournament;
  activeRoundIndex: number;
  onChangeRoundIndex: (idx: number) => void;
  onUpdateResult: (roundNumber: number, boardNumber: number, result: GameResult) => void;
  onGenerateNextRound: () => void;
  onOpenLogIncident: (boardNumber: number, whiteId: string, blackId: string | null) => void;
  onOpenAddPlayerModal: () => void;
}

export const PairingBoardView: React.FC<PairingBoardViewProps> = ({
  tournament,
  activeRoundIndex,
  onChangeRoundIndex,
  onUpdateResult,
  onGenerateNextRound,
  onOpenLogIncident,
  onOpenAddPlayerModal,
}) => {
  const [copied, setCopied] = useState(false);
  const currentRound: Round | undefined = tournament.rounds[activeRoundIndex];

  const playerMap = new Map<string, Player>();
  tournament.players.forEach((p) => playerMap.set(p.id, p));

  if (!currentRound) {
    return (
      <div className="text-center py-16 bg-slate-900/50 rounded-xl border border-slate-800">
        <p className="text-slate-400 text-sm">No pairings generated yet.</p>
        <button
          onClick={onGenerateNextRound}
          className="mt-4 px-4 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-md transition-colors"
        >
          Generate Round 1 Pairings
        </button>
      </div>
    );
  }

  // Count finished games in this round
  const totalMatches = currentRound.pairings.filter((p) => !p.isBye).length;
  const finishedMatches = currentRound.pairings.filter((p) => !p.isBye && p.result !== '*').length;
  const isRoundComplete = totalMatches > 0 && finishedMatches === totalMatches;

  const handleCopyMarkdown = () => {
    const md = generatePairingsMarkdown(currentRound, tournament.players);
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const [isPdfMenuOpen, setIsPdfMenuOpen] = useState(false);
  const pdfMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pdfMenuRef.current && !pdfMenuRef.current.contains(event.target as Node)) {
        setIsPdfMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDownloadRoundPdf = (roundNum: number) => {
    downloadPairingPDF(tournament, roundNum);
    setIsPdfMenuOpen(false);
  };

  // Generate list of rounds to show in PDF menu, at least 1..6 or up to total rounds
  const pdfRoundsList = Array.from(
    { length: Math.max(6, tournament.totalRounds, tournament.rounds.length) },
    (_, i) => i + 1
  );

  return (
    <div className="space-y-6">
      {/* Header controls strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span>{tournament.name}</span>
            <span aria-hidden="true">·</span>
            <span className="capitalize">{tournament.type} System</span>
            <span aria-hidden="true">·</span>
            <span>{tournament.timeControlDescription}</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-3">
            Round {currentRound.roundNumber} of {tournament.totalRounds}
            {isRoundComplete ? (
              <span className="text-xs font-normal text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> All Results Recorded
              </span>
            ) : (
              <span className="text-xs font-mono font-normal text-amber-400">
                {finishedMatches}/{totalMatches} Finished
              </span>
            )}
          </h1>
        </div>

        {/* Round switchers & quick actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Round selector segmented buttons */}
          <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-lg">
            <button
              disabled={activeRoundIndex === 0}
              onClick={() => onChangeRoundIndex(activeRoundIndex - 1)}
              className="p-1 rounded text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              title="Previous Round"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1 px-1">
              {tournament.rounds.map((r, idx) => (
                <button
                  key={r.roundNumber}
                  onClick={() => onChangeRoundIndex(idx)}
                  className={`px-2.5 py-1 text-xs font-mono rounded transition-colors ${
                    activeRoundIndex === idx
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  R{r.roundNumber}
                </button>
              ))}
            </div>
            <button
              disabled={activeRoundIndex >= tournament.rounds.length - 1}
              onClick={() => onChangeRoundIndex(activeRoundIndex + 1)}
              className="p-1 rounded text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              title="Next Round"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Download PDF Menu Dropdown for R1-R6 */}
          <div className="relative" ref={pdfMenuRef}>
            <button
              onClick={() => setIsPdfMenuOpen((prev) => !prev)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-md transition-colors flex items-center gap-1.5 shadow-sm"
              title="Unduh PDF Pairing untuk tiap round (R1-R6)"
            >
              <Download className="w-3.5 h-3.5 text-slate-950" />
              <span>Download PDF (R1-R6)</span>
              <ChevronDown className="w-3 h-3 text-slate-950" />
            </button>

            {isPdfMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl z-50 overflow-hidden py-1.5">
                <div className="px-3 py-1.5 border-b border-slate-800 text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold">
                  Unduh PDF Pairing Round
                </div>

                <div className="max-h-60 overflow-y-auto divide-y divide-slate-800/40">
                  {pdfRoundsList.map((rnd) => {
                    const exists = tournament.rounds.some((r) => r.roundNumber === rnd);
                    const isCurrent = currentRound.roundNumber === rnd;

                    return (
                      <button
                        key={rnd}
                        disabled={!exists}
                        onClick={() => handleDownloadRoundPdf(rnd)}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors ${
                          !exists
                            ? 'opacity-40 cursor-not-allowed bg-slate-950/40 text-slate-500'
                            : isCurrent
                            ? 'bg-amber-500/10 text-amber-300 font-semibold hover:bg-amber-500/20'
                            : 'text-slate-200 hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-6 text-center font-mono font-bold text-amber-400 text-[11px]">
                            R{rnd}
                          </span>
                          <span>Pairing Round {rnd}</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">
                          {exists ? (isCurrent ? 'Aktif' : 'Tersedia') : 'Belum dipair'}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="p-2 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-[11px]">
                  <button
                    onClick={() => handleDownloadRoundPdf(currentRound.roundNumber)}
                    className="w-full text-center py-1 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors"
                  >
                    Unduh Round {currentRound.roundNumber} Sekarang
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleCopyMarkdown}
            className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-md transition-colors flex items-center gap-1.5"
            title="Copy pairings in FIDE markdown table format"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy MD'}
          </button>

          <button
            onClick={handlePrint}
            className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-md transition-colors flex items-center gap-1.5"
            title="Print pairings sheet for arbiter noticeboard"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Sheet
          </button>

          {/* If current round is completed and there's a next round to generate */}
          {activeRoundIndex === tournament.rounds.length - 1 &&
            tournament.rounds.length < tournament.totalRounds && (
              <button
                onClick={onGenerateNextRound}
                className="px-3.5 py-1.5 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-md transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <span>Pair Round {tournament.rounds.length + 1}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
        </div>
      </div>

      {/* Board Number Format Reference Header */}
      <div className="bg-slate-900/40 rounded-lg p-3 border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-300">Official Board Notation:</span>
          <span className="font-mono text-slate-300">
            [Board] | [White Player (Rating)] vs [Black Player (Rating)] | Result
          </span>
        </div>
        <div className="text-slate-400">
          Default Time: <span className="font-mono text-amber-400">{tournament.defaultTimeMinutes === 0 ? 'Zero Tolerance' : `${tournament.defaultTimeMinutes} min`}</span>
        </div>
      </div>

      {/* Boards List */}
      <div className="space-y-3">
        {currentRound.pairings.map((pairing) => {
          const white = playerMap.get(pairing.whitePlayerId);
          const black = pairing.blackPlayerId ? playerMap.get(pairing.blackPlayerId) : null;

          return (
            <div
              key={`${currentRound.roundNumber}-${pairing.boardNumber}-${pairing.whitePlayerId}`}
              className={`p-4 rounded-xl border transition-colors ${
                pairing.isBye
                  ? 'bg-slate-900/30 border-slate-800/60'
                  : pairing.result !== '*'
                  ? 'bg-slate-900/60 border-slate-800'
                  : 'bg-slate-900/90 border-slate-700 hover:border-slate-600'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Board info & players */}
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  {/* Board Number Badge */}
                  <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex flex-col items-center justify-center shrink-0">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Brd</span>
                    <span className="text-sm font-bold font-mono text-slate-100">{pairing.boardNumber || 'BYE'}</span>
                  </div>

                  {/* Opponents Matchup */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1 min-w-0">
                    {/* White Player */}
                    <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                      <div className="w-4 h-4 rounded bg-white text-slate-950 flex items-center justify-center text-[10px] font-bold shrink-0 shadow-xs" title="White Pieces">
                        W
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          {white?.title && white.title !== 'None' && (
                            <span className="text-[10px] font-mono font-bold text-amber-400">
                              {white.title}
                            </span>
                          )}
                          <span className="text-sm font-semibold text-slate-100 truncate">
                            {white?.name || 'Unknown'}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">
                            ({white?.rating || 0})
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1">
                          <span>{white?.federation}</span>
                          <span aria-hidden="true">·</span>
                          <span>Seed #{white?.seed}</span>
                        </div>
                      </div>
                    </div>

                    {/* Black Player / Bye */}
                    <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                      <div className="w-4 h-4 rounded bg-slate-900 border border-slate-600 text-slate-200 flex items-center justify-center text-[10px] font-bold shrink-0 shadow-xs" title="Black Pieces">
                        B
                      </div>
                      <div className="min-w-0 flex-1">
                        {pairing.isBye ? (
                          <div>
                            <span className="text-sm font-semibold text-amber-400">
                              BYE ({pairing.byeType === 'half' ? 'Half-Point (0.5)' : 'Full-Point (1.0)'})
                            </span>
                            <div className="text-[11px] text-slate-400">
                              {pairing.arbiterNote || 'No opponent paired for this round'}
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-1.5">
                              {black?.title && black.title !== 'None' && (
                                <span className="text-[10px] font-mono font-bold text-amber-400">
                                  {black.title}
                                </span>
                              )}
                              <span className="text-sm font-semibold text-slate-100 truncate">
                                {black?.name || 'Unassigned'}
                              </span>
                              <span className="text-xs text-slate-400 font-mono">
                                ({black?.rating || 0})
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1">
                              <span>{black?.federation}</span>
                              <span aria-hidden="true">·</span>
                              <span>Seed #{black?.seed}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Result buttons and Arbiter flags */}
                <div className="flex items-center gap-3 shrink-0 self-end lg:self-center">
                  {/* Result selection segmented control */}
                  {!pairing.isBye ? (
                    <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800">
                      <button
                        onClick={() => onUpdateResult(currentRound.roundNumber, pairing.boardNumber, '1-0')}
                        className={`px-2.5 py-1 text-xs font-mono rounded transition-colors ${
                          pairing.result === '1-0'
                            ? 'bg-amber-500 text-slate-950 font-bold'
                            : 'text-slate-300 hover:bg-slate-800'
                        }`}
                        title="White Wins (1-0)"
                      >
                        1 - 0
                      </button>
                      <button
                        onClick={() => onUpdateResult(currentRound.roundNumber, pairing.boardNumber, '1/2-1/2')}
                        className={`px-2.5 py-1 text-xs font-mono rounded transition-colors ${
                          pairing.result === '1/2-1/2'
                            ? 'bg-amber-500 text-slate-950 font-bold'
                            : 'text-slate-300 hover:bg-slate-800'
                        }`}
                        title="Draw (1/2-1/2)"
                      >
                        ½ - ½
                      </button>
                      <button
                        onClick={() => onUpdateResult(currentRound.roundNumber, pairing.boardNumber, '0-1')}
                        className={`px-2.5 py-1 text-xs font-mono rounded transition-colors ${
                          pairing.result === '0-1'
                            ? 'bg-amber-500 text-slate-950 font-bold'
                            : 'text-slate-300 hover:bg-slate-800'
                        }`}
                        title="Black Wins (0-1)"
                      >
                        0 - 1
                      </button>

                      {/* Forfeits dropdown / quick toggle */}
                      <button
                        onClick={() => onUpdateResult(currentRound.roundNumber, pairing.boardNumber, pairing.result === '1F-0' ? '0-1F' : '1F-0')}
                        className={`px-2 py-1 text-[11px] font-mono rounded transition-colors ${
                          pairing.result === '1F-0' || pairing.result === '0-1F'
                            ? 'bg-rose-500 text-white font-bold'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                        title="Click to toggle Forfeit (1F-0 or 0-1F)"
                      >
                        {pairing.result === '1F-0' ? '1F-0' : pairing.result === '0-1F' ? '0-1F' : 'Forfeit'}
                      </button>

                      {pairing.result !== '*' && (
                        <button
                          onClick={() => onUpdateResult(currentRound.roundNumber, pairing.boardNumber, '*')}
                          className="px-1.5 py-1 text-[11px] font-mono text-slate-400 hover:text-slate-200"
                          title="Reset to Unplayed"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="px-3 py-1 text-xs font-mono font-bold text-amber-400 bg-slate-950 border border-slate-800 rounded-lg">
                      {pairing.result}
                    </div>
                  )}

                  {/* Arbiter incident summon button */}
                  {!pairing.isBye && (
                    <button
                      onClick={() => onOpenLogIncident(pairing.boardNumber, pairing.whitePlayerId, pairing.blackPlayerId)}
                      className="p-1.5 text-slate-400 hover:text-amber-400 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors"
                      title="Log Arbiter Ruling / Incident for Board"
                    >
                      <Flag className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Pairing Anomaly / Float Note (FIDE Requirement) */}
              {(pairing.isAnomaly || pairing.anomalyReason) && (
                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center gap-2 text-xs text-amber-400/90 font-mono">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Pairing Note: {pairing.anomalyReason || 'Color balancing adjustment or Swiss float'}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
