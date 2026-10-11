import React, { useState } from 'react';
import { AlertCircle, Award, CheckCircle, Clock, Flag, Plus, Shield, Smartphone } from 'lucide-react';
import { ArbiterIncident, Player, Tournament } from '../types/chess';

interface ArbiterLogViewProps {
  tournament: Tournament;
  onOpenAddIncident: () => void;
}

export const ArbiterLogView: React.FC<ArbiterLogViewProps> = ({
  tournament,
  onOpenAddIncident,
}) => {
  const [filterType, setFilterType] = useState<string>('all');

  const playerMap = new Map<string, Player>();
  tournament.players.forEach((p) => playerMap.set(p.id, p));

  const filteredIncidents = tournament.incidents.filter((inc) =>
    filterType === 'all' ? true : inc.type === filterType
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span>Official Tournament Arbiter Ledger</span>
            <span aria-hidden="true">·</span>
            <span>Chief Arbiter: {tournament.chiefArbiter}</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            Arbiter Incidents & Disciplinary Log
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenAddIncident}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-md transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Log New Ruling / Incident
          </button>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {[
          { id: 'all', label: `All (${tournament.incidents.length})` },
          { id: 'illegal_move', label: 'Illegal Moves' },
          { id: 'touch_move', label: 'Touch-Move' },
          { id: 'default_time', label: 'Default / Forfeits' },
          { id: 'device_violation', label: 'Devices / Phones' },
          { id: 'draw_claim', label: 'Draw Claims' },
          { id: 'conduct_warning', label: 'Conduct' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilterType(f.id)}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
              filterType === f.id
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Incident List */}
      <div className="space-y-3">
        {filteredIncidents.map((incident) => {
          const involvedNames = incident.playerIds
            .map((id) => playerMap.get(id)?.name || 'Unknown')
            .join(' & ');

          return (
            <div
              key={incident.id}
              className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3 shadow-xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-amber-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    Round {incident.roundNumber} {incident.boardNumber ? `· Board ${incident.boardNumber}` : ''}
                  </span>
                  <span className="text-xs uppercase font-mono font-semibold text-slate-300">
                    {incident.type.replace('_', ' ')}
                  </span>
                </div>
                <div className="text-[11px] font-mono text-slate-400">
                  {incident.timestamp}
                </div>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="text-slate-300 font-medium">
                  <span className="text-slate-500 mr-1.5">Players Involved:</span>
                  {involvedNames}
                </div>
                <div className="text-slate-300">
                  <span className="text-slate-500 mr-1.5">Description:</span>
                  {incident.description}
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="text-slate-200 font-medium">
                    <span className="text-slate-400 font-normal">Decision: </span>
                    {incident.decision}
                  </span>
                </div>
                <div className="font-mono text-[11px] text-amber-400 shrink-0">
                  Cited: {incident.fideArticleCited}
                </div>
              </div>
            </div>
          );
        })}

        {filteredIncidents.length === 0 && (
          <div className="text-center py-12 rounded-xl bg-slate-900/30 border border-slate-800 text-slate-500 text-xs">
            No incidents recorded under this category.
          </div>
        )}
      </div>
    </div>
  );
};
