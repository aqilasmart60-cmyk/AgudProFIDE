import React from 'react';
import { Award, ChevronRight, Trophy } from 'lucide-react';
import { GameResult, Player, Round, Tournament } from '../types/chess';

interface KnockoutBracketViewProps {
  tournament: Tournament;
  onUpdateResult: (roundNumber: number, boardNumber: number, result: GameResult) => void;
  onAdvanceKnockout: () => void;
}

export const KnockoutBracketView: React.FC<KnockoutBracketViewProps> = ({
  tournament,
  onUpdateResult,
  onAdvanceKnockout,
}) => {
  const playerMap = new Map<string, Player>();
  tournament.players.forEach((p) => playerMap.set(p.id, p));

  const rounds = tournament.rounds;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span>Single-Elimination Knockout</span>
            <span aria-hidden="true">·</span>
            <span>{tournament.name}</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            Knockout Bracket
          </h1>
        </div>

        {rounds.length < tournament.totalRounds && (
          <button
            onClick={onAdvanceKnockout}
            className="px-3.5 py-1.5 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-md transition-colors flex items-center gap-1.5 shadow-sm"
          >
            Advance Winners to Next Stage
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Bracket Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {rounds.map((round) => {
          const stageName =
            round.roundNumber === tournament.totalRounds
              ? 'Championship Final'
              : round.roundNumber === tournament.totalRounds - 1
              ? 'Semi-Finals'
              : 'Quarter-Finals';

          return (
            <div key={round.roundNumber} className="space-y-4">
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-center">
                <span className="text-xs uppercase tracking-wider font-semibold text-amber-400 font-mono">
                  Stage {round.roundNumber}
                </span>
                <h3 className="text-sm font-bold text-slate-200">{stageName}</h3>
              </div>

              <div className="space-y-4">
                {round.pairings.map((pairing) => {
                  const white = playerMap.get(pairing.whitePlayerId);
                  const black = pairing.blackPlayerId ? playerMap.get(pairing.blackPlayerId) : null;

                  const isWhiteWinner = pairing.result === '1-0' || pairing.result === '1F-0';
                  const isBlackWinner = pairing.result === '0-1' || pairing.result === '0-1F';

                  return (
                    <div
                      key={pairing.boardNumber}
                      className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-colors shadow-sm space-y-2.5"
                    >
                      <div className="flex items-center justify-between text-[11px] text-slate-400 pb-1.5 border-b border-slate-800/80">
                        <span className="font-mono font-semibold">Match #{pairing.boardNumber}</span>
                        <span className="font-mono text-amber-400">
                          {pairing.result === '*' ? 'In progress' : pairing.result}
                        </span>
                      </div>

                      {/* White Slot */}
                      <div
                        className={`flex items-center justify-between p-2 rounded-lg border text-xs ${
                          isWhiteWinner
                            ? 'bg-amber-500/10 border-amber-500/40 font-bold text-amber-300'
                            : 'bg-slate-950/60 border-slate-800 text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="w-4 h-4 rounded bg-white text-slate-950 font-bold text-[10px] flex items-center justify-center shrink-0">
                            W
                          </span>
                          <span className="truncate">{white?.name || 'Unassigned'}</span>
                          <span className="text-[11px] font-mono text-slate-400">({white?.rating})</span>
                        </div>
                        {isWhiteWinner && <Award className="w-3.5 h-3.5 text-amber-400 shrink-0 ml-1" />}
                      </div>

                      {/* Black Slot */}
                      <div
                        className={`flex items-center justify-between p-2 rounded-lg border text-xs ${
                          isBlackWinner
                            ? 'bg-amber-500/10 border-amber-500/40 font-bold text-amber-300'
                            : 'bg-slate-950/60 border-slate-800 text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="w-4 h-4 rounded bg-slate-900 border border-slate-700 text-slate-200 font-bold text-[10px] flex items-center justify-center shrink-0">
                            B
                          </span>
                          <span className="truncate">{black?.name || 'Unassigned'}</span>
                          <span className="text-[11px] font-mono text-slate-400">({black?.rating})</span>
                        </div>
                        {isBlackWinner && <Award className="w-3.5 h-3.5 text-amber-400 shrink-0 ml-1" />}
                      </div>

                      {/* Quick Match Outcome Buttons */}
                      <div className="flex items-center gap-1 pt-1 justify-center">
                        <button
                          onClick={() => onUpdateResult(round.roundNumber, pairing.boardNumber, '1-0')}
                          className={`px-2 py-0.5 text-[11px] font-mono rounded ${
                            pairing.result === '1-0'
                              ? 'bg-amber-500 text-slate-950 font-bold'
                              : 'text-slate-400 hover:text-slate-200 bg-slate-950'
                          }`}
                        >
                          W Wins
                        </button>
                        <button
                          onClick={() => onUpdateResult(round.roundNumber, pairing.boardNumber, '0-1')}
                          className={`px-2 py-0.5 text-[11px] font-mono rounded ${
                            pairing.result === '0-1'
                              ? 'bg-amber-500 text-slate-950 font-bold'
                              : 'text-slate-400 hover:text-slate-200 bg-slate-950'
                          }`}
                        >
                          B Wins
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
