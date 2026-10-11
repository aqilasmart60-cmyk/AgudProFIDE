import React, { useRef, useState, useEffect } from 'react';
import { Check, ChevronDown, Copy, Download, FileText, Info, Search, Trophy, User } from 'lucide-react';
import { Player, PlayerStandingsRow, Tournament } from '../types/chess';
import { generateStandingsCSV, generateStandingsMarkdown } from '../utils/exportFormats';
import { downloadStandingsAfterRoundPDF, downloadStandingsPDF } from '../utils/pdfExport';

interface StandingsTableProps {
  tournament: Tournament;
  standings: PlayerStandingsRow[];
}

export const StandingsTable: React.FC<StandingsTableProps> = ({
  tournament,
  standings,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlayerRow, setSelectedPlayerRow] = useState<PlayerStandingsRow | null>(null);
  const [copied, setCopied] = useState(false);
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

  const filteredStandings = standings.filter(
    (row) =>
      row.player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.player.federation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (row.player.title && row.player.title.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleCopyMarkdown = () => {
    const md = generateStandingsMarkdown(tournament, standings);
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCSV = () => {
    const csv = generateStandingsCSV(standings);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tournament.name.replace(/\s+/g, '_')}_Standings.csv`;
    a.click();
  };

  const handleDownloadCurrentStandingsPdf = () => {
    downloadStandingsPDF(tournament, standings);
    setIsPdfMenuOpen(false);
  };

  const handleDownloadRoundStandingsPdf = (roundNum: number) => {
    downloadStandingsAfterRoundPDF(tournament, roundNum);
    setIsPdfMenuOpen(false);
  };

  const pdfRoundsList = Array.from(
    { length: Math.max(6, tournament.rounds.length) },
    (_, i) => i + 1
  );

  return (
    <div className="space-y-6">
      {/* Top Header & Search Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span>FIDE Official Tie-Break Hierarchy</span>
            <span aria-hidden="true">·</span>
            <span>Pts → DE → BH-C1 → BH → SB → Prog → Wins</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            Tournament Standings
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search player, fed, title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/80 w-56 transition-colors"
            />
          </div>

          <button
            onClick={handleCopyMarkdown}
            className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-md transition-colors flex items-center gap-1.5"
            title="Copy Standings in Markdown table format"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy MD'}
          </button>

          {/* Download PDF Menu Dropdown for Standings */}
          <div className="relative" ref={pdfMenuRef}>
            <button
              onClick={() => setIsPdfMenuOpen((prev) => !prev)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-md transition-colors flex items-center gap-1.5 shadow-sm"
              title="Unduh PDF Standings & Tie-breaks (Terkini atau per round R1-R6)"
            >
              <Download className="w-3.5 h-3.5 text-slate-950" />
              <span>Download PDF (R1-R6)</span>
              <ChevronDown className="w-3 h-3 text-slate-950" />
            </button>

            {isPdfMenuOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl z-50 overflow-hidden py-1.5">
                <div className="px-3 py-1.5 border-b border-slate-800 text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold">
                  Unduh PDF Standings &amp; Tie-Breaks
                </div>

                <div className="p-1">
                  <button
                    onClick={handleDownloadCurrentStandingsPdf}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-amber-300 hover:bg-slate-800 rounded-lg flex items-center justify-between transition-colors"
                  >
                    <span>📄 Unduh Standings Terkini</span>
                    <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded">
                      R1–R{tournament.rounds.length}
                    </span>
                  </button>
                </div>

                <div className="px-3 py-1 border-t border-b border-slate-800/80 bg-slate-950/60 text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  Standings Setelah Tiap Round:
                </div>

                <div className="max-h-56 overflow-y-auto divide-y divide-slate-800/40">
                  {pdfRoundsList.map((rnd) => {
                    const isAvailable = rnd <= tournament.rounds.length;

                    return (
                      <button
                        key={rnd}
                        disabled={!isAvailable}
                        onClick={() => handleDownloadRoundStandingsPdf(rnd)}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors ${
                          !isAvailable
                            ? 'opacity-40 cursor-not-allowed bg-slate-950/40 text-slate-500'
                            : 'text-slate-200 hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-6 text-center font-mono font-bold text-amber-400 text-[11px]">
                            R{rnd}
                          </span>
                          <span>Standings setelah Round {rnd}</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">
                          {isAvailable ? 'Tersedia' : 'Belum selesai'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleDownloadCSV}
            className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-md transition-colors flex items-center gap-1.5"
            title="Download CSV spreadsheet"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            CSV
          </button>
        </div>
      </div>

      {/* Standings Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/80 shadow-sm">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/90 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-3 text-center w-12">Rk</th>
              <th className="py-3 px-2 text-center w-10">SNo</th>
              <th className="py-3 px-4 min-w-[180px]">Player Name</th>
              <th className="py-3 px-2 text-center w-12">Fed</th>
              <th className="py-3 px-3 text-right font-mono">Rating</th>
              <th className="py-3 px-4 text-center font-mono text-slate-200 bg-slate-800/40">Pts</th>
              <th className="py-3 px-3 text-right font-mono" title="Buchholz Cut 1 (Lowest Opponent Score Dropped)">BH-C1</th>
              <th className="py-3 px-3 text-right font-mono" title="Buchholz (Sum of Opponents' Scores)">BH</th>
              <th className="py-3 px-3 text-right font-mono" title="Sonneborn-Berger">SB</th>
              <th className="py-3 px-3 text-right font-mono" title="Direct Encounter (Head-to-Head)">DE</th>
              <th className="py-3 px-3 text-right font-mono" title="Progressive Cumulative Score">Prog</th>
              <th className="py-3 px-2 text-center font-mono" title="Total Wins">W</th>
              <th className="py-3 px-3 text-center font-mono" title="Color Balance & Sequence">Colors</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {filteredStandings.map((row) => {
              const isTop3 = row.rank <= 3;
              const cb = row.colorBalance > 0 ? `+${row.colorBalance}W` : row.colorBalance < 0 ? `${row.colorBalance}B` : '0';

              return (
                <tr
                  key={row.player.id}
                  onClick={() => setSelectedPlayerRow(row)}
                  className="hover:bg-slate-900/60 cursor-pointer transition-colors"
                >
                  {/* Rank */}
                  <td className="py-3 px-3 text-center font-mono font-bold">
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 rounded ${
                        row.rank === 1
                          ? 'bg-amber-500/20 text-amber-300 font-extrabold border border-amber-500/30'
                          : row.rank === 2
                          ? 'bg-slate-300/10 text-slate-200 border border-slate-400/20'
                          : row.rank === 3
                          ? 'bg-amber-700/20 text-amber-500 border border-amber-700/30'
                          : 'text-slate-400'
                      }`}
                    >
                      {row.rank}
                    </span>
                  </td>

                  {/* Seed No */}
                  <td className="py-3 px-2 text-center font-mono text-slate-500">
                    {row.player.seed}
                  </td>

                  {/* Name and Title */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      {row.player.title && row.player.title !== 'None' && (
                        <span className="font-mono font-bold text-amber-400 text-[11px]">
                          {row.player.title}
                        </span>
                      )}
                      <span className="font-semibold text-slate-100 hover:text-amber-400 transition-colors">
                        {row.player.name}
                      </span>
                    </div>
                  </td>

                  {/* Federation */}
                  <td className="py-3 px-2 text-center font-mono text-slate-400">
                    {row.player.federation}
                  </td>

                  {/* Rating */}
                  <td className="py-3 px-3 text-right font-mono text-slate-300 tabular-nums">
                    {row.player.rating}
                  </td>

                  {/* Points (Primary Score) */}
                  <td className="py-3 px-4 text-center font-mono font-bold text-sm text-amber-300 bg-slate-900/40 tabular-nums">
                    {row.points.toFixed(1).replace('.0', '')}
                  </td>

                  {/* Buchholz Cut 1 */}
                  <td className="py-3 px-3 text-right font-mono text-slate-300 tabular-nums">
                    {row.buchholzCut1.toFixed(1).replace('.0', '')}
                  </td>

                  {/* Buchholz */}
                  <td className="py-3 px-3 text-right font-mono text-slate-400 tabular-nums">
                    {row.buchholz.toFixed(1).replace('.0', '')}
                  </td>

                  {/* Sonneborn-Berger */}
                  <td className="py-3 px-3 text-right font-mono text-slate-400 tabular-nums">
                    {row.sonnebornBerger.toFixed(2)}
                  </td>

                  {/* Direct Encounter */}
                  <td className="py-3 px-3 text-right font-mono text-slate-400 tabular-nums">
                    {row.directEncounter > 0 ? row.directEncounter.toFixed(1).replace('.0', '') : '-'}
                  </td>

                  {/* Progressive Score */}
                  <td className="py-3 px-3 text-right font-mono text-slate-400 tabular-nums">
                    {row.progressiveScore.toFixed(1).replace('.0', '')}
                  </td>

                  {/* Wins */}
                  <td className="py-3 px-2 text-center font-mono text-slate-300 tabular-nums">
                    {row.wins}
                  </td>

                  {/* Color Balance & History */}
                  <td className="py-3 px-3 text-center font-mono text-[11px] text-slate-400">
                    <span className="text-slate-300 mr-1.5">{cb}</span>
                    <span className="text-slate-500 font-mono text-[10px]">
                      {row.colorHistoryString || '-'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Player Match History Modal / Popover */}
      {selectedPlayerRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div>
                <div className="text-xs text-amber-400 font-mono">
                  Rank #{selectedPlayerRow.rank} · {selectedPlayerRow.points} Points
                </div>
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  {selectedPlayerRow.player.title && selectedPlayerRow.player.title !== 'None' && (
                    <span className="text-amber-400 font-mono text-sm">{selectedPlayerRow.player.title}</span>
                  )}
                  {selectedPlayerRow.player.name}
                  <span className="text-xs font-mono text-slate-400">({selectedPlayerRow.player.rating})</span>
                </h3>
                <div className="text-xs text-slate-400">
                  Federation: {selectedPlayerRow.player.federation} · Seed #{selectedPlayerRow.player.seed}
                </div>
              </div>
              <button
                onClick={() => setSelectedPlayerRow(null)}
                className="text-slate-400 hover:text-slate-200 text-sm font-mono p-1"
              >
                ✕
              </button>
            </div>

            {/* Tie-break summary chips */}
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <div className="text-slate-500 font-mono text-[10px]">BH-C1</div>
                <div className="font-mono font-bold text-slate-200">{selectedPlayerRow.buchholzCut1}</div>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <div className="text-slate-500 font-mono text-[10px]">Buchholz</div>
                <div className="font-mono font-bold text-slate-200">{selectedPlayerRow.buchholz}</div>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <div className="text-slate-500 font-mono text-[10px]">S-Berger</div>
                <div className="font-mono font-bold text-slate-200">{selectedPlayerRow.sonnebornBerger.toFixed(2)}</div>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <div className="text-slate-500 font-mono text-[10px]">Progressive</div>
                <div className="font-mono font-bold text-slate-200">{selectedPlayerRow.progressiveScore}</div>
              </div>
            </div>

            {/* Round by Round History */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Round by Round Games</h4>
              <div className="space-y-1.5 max-h-56 overflow-y-auto">
                {selectedPlayerRow.opponentsList.map((oppId, idx) => {
                  const opp = tournament.players.find((p) => p.id === oppId);
                  const res = selectedPlayerRow.resultsList[idx];
                  const color = selectedPlayerRow.colorHistoryString.split(' ')[idx] || '-';

                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded bg-slate-950/60 border border-slate-800 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-500 text-[11px]">R{idx + 1}</span>
                        <span
                          className={`w-4 h-4 rounded text-[10px] font-bold flex items-center justify-center font-mono ${
                            color === 'W'
                              ? 'bg-white text-slate-950'
                              : color === 'B'
                              ? 'bg-slate-900 border border-slate-600 text-slate-100'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {color}
                        </span>
                        <span className="font-medium text-slate-200">
                          {opp?.name || 'Bye / Unknown'}
                        </span>
                        {opp && (
                          <span className="text-[11px] font-mono text-slate-400">({opp.rating})</span>
                        )}
                      </div>
                      <span className="font-mono font-bold text-amber-400">{res}</span>
                    </div>
                  );
                })}
                {selectedPlayerRow.opponentsList.length === 0 && (
                  <p className="text-xs text-slate-500 italic">No games played yet.</p>
                )}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedPlayerRow(null)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-md transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
