import React from 'react';
import { Grid, Trophy } from 'lucide-react';
import { Player, PlayerStandingsRow, Tournament } from '../types/chess';
import { generateCrossTable } from '../utils/bergerTables';

interface RoundRobinCrossTableProps {
  tournament: Tournament;
  standings: PlayerStandingsRow[];
}

export const RoundRobinCrossTable: React.FC<RoundRobinCrossTableProps> = ({
  tournament,
  standings,
}) => {
  const { matrix } = generateCrossTable(tournament.players, tournament.rounds);

  // Order players by rank from standings
  const orderedPlayers = standings.map((s) => s.player);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span>Official FIDE Berger System Cross-Table</span>
            <span aria-hidden="true">·</span>
            <span>{tournament.name}</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <Grid className="w-5 h-5 text-amber-400" />
            Berger Cross-Table
          </h1>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/80 shadow-sm">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/90 text-slate-400 text-[11px] font-semibold">
              <th className="py-3 px-3 text-center w-10">Rk</th>
              <th className="py-3 px-3 text-left min-w-[160px]">Player</th>
              <th className="py-3 px-2 text-right font-mono w-16">Rating</th>
              {/* Columns for each opponent by their seed/index */}
              {orderedPlayers.map((p, idx) => (
                <th
                  key={p.id}
                  className="py-3 px-2 text-center font-mono w-10 border-l border-slate-800/80 bg-slate-900/60"
                  title={`${p.name} (${p.rating})`}
                >
                  {idx + 1}
                </th>
              ))}
              <th className="py-3 px-3 text-center font-mono text-slate-200 bg-slate-800/50 w-14">Pts</th>
              <th className="py-3 px-3 text-right font-mono text-slate-400 w-14">SB</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {orderedPlayers.map((p1, rowIdx) => {
              const standingRow = standings.find((s) => s.player.id === p1.id);
              const p1RowMatrix = matrix.get(p1.id);

              return (
                <tr key={p1.id} className="hover:bg-slate-900/50 transition-colors">
                  {/* Rank */}
                  <td className="py-3 px-3 text-center font-mono font-bold text-slate-300">
                    {standingRow?.rank || rowIdx + 1}
                  </td>

                  {/* Player Name */}
                  <td className="py-3 px-3 text-left">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-slate-500 text-[10px] w-4">
                        {rowIdx + 1}.
                      </span>
                      {p1.title && p1.title !== 'None' && (
                        <span className="text-[10px] font-mono font-bold text-amber-400">
                          {p1.title}
                        </span>
                      )}
                      <span className="font-semibold text-slate-100 truncate">
                        {p1.name}
                      </span>
                    </div>
                  </td>

                  {/* Rating */}
                  <td className="py-3 px-2 text-right font-mono text-slate-400 tabular-nums">
                    {p1.rating}
                  </td>

                  {/* Matrix cells */}
                  {orderedPlayers.map((p2, colIdx) => {
                    const isSelf = p1.id === p2.id;
                    const cell = p1RowMatrix ? p1RowMatrix.get(p2.id) : null;

                    if (isSelf) {
                      return (
                        <td
                          key={p2.id}
                          className="py-3 px-2 text-center border-l border-slate-800/80 bg-slate-900/80 font-mono text-slate-600 font-bold select-none"
                        >
                          ✕
                        </td>
                      );
                    }

                    let display = '·';
                    let scoreColor = 'text-slate-600';

                    if (cell && cell.score !== null) {
                      if (cell.score === 1) {
                        display = '1';
                        scoreColor = 'text-emerald-400 font-bold';
                      } else if (cell.score === 0.5) {
                        display = '½';
                        scoreColor = 'text-amber-400 font-bold';
                      } else if (cell.score === 0) {
                        display = '0';
                        scoreColor = 'text-rose-400 font-bold';
                      }
                    }

                    return (
                      <td
                        key={p2.id}
                        className="py-3 px-2 text-center border-l border-slate-800/80 font-mono tabular-nums text-xs"
                      >
                        <span className={scoreColor}>{display}</span>
                        {cell?.color && cell.score !== null && (
                          <span className="text-[9px] text-slate-500 ml-0.5 lowercase">
                            {cell.color}
                          </span>
                        )}
                      </td>
                    );
                  })}

                  {/* Points */}
                  <td className="py-3 px-3 text-center font-mono font-bold text-sm text-amber-300 bg-slate-900/40 tabular-nums">
                    {standingRow ? standingRow.points.toFixed(1).replace('.0', '') : '0'}
                  </td>

                  {/* SB */}
                  <td className="py-3 px-3 text-right font-mono text-slate-400 tabular-nums">
                    {standingRow ? standingRow.sonnebornBerger.toFixed(2) : '0.00'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
