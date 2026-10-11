import React from 'react';
import { Award, FileText, Layers, Shield, Trophy, Users } from 'lucide-react';
import { Tournament } from '../types/chess';

interface NavbarProps {
  currentTab: 'pairings' | 'standings' | 'crosstable' | 'knockout' | 'arbiter' | 'incidents';
  onSelectTab: (tab: 'pairings' | 'standings' | 'crosstable' | 'knockout' | 'arbiter' | 'incidents') => void;
  tournament: Tournament;
  onOpenNewTournament: () => void;
  onOpenExportModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  tournament,
  onOpenNewTournament,
  onOpenExportModal,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Brand Title - Single text element wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-sm text-slate-950 font-bold">
              <Shield className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-slate-100 whitespace-nowrap">
                AgudPro
              </span>
              <span className="text-xs text-amber-400/90 ml-2 font-mono">FIDE Chief Arbiter</span>
            </div>
          </div>

          {/* Zone 2: Concise single-line navigation links */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => onSelectTab('pairings')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                currentTab === 'pairings'
                  ? 'bg-slate-800 text-amber-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Pairings
            </button>

            <button
              onClick={() => onSelectTab('standings')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                currentTab === 'standings'
                  ? 'bg-slate-800 text-amber-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              Standings & Tie-breaks
            </button>

            {tournament.type === 'round-robin' && (
              <button
                onClick={() => onSelectTab('crosstable')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                  currentTab === 'crosstable'
                    ? 'bg-slate-800 text-amber-400 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                Berger Cross-Table
              </button>
            )}

            {tournament.type === 'knockout' && (
              <button
                onClick={() => onSelectTab('knockout')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                  currentTab === 'knockout'
                    ? 'bg-slate-800 text-amber-400 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                Bracket
              </button>
            )}

            <button
              onClick={() => onSelectTab('arbiter')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                currentTab === 'arbiter'
                  ? 'bg-slate-800 text-amber-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              Chief Arbiter AI
            </button>

            <button
              onClick={() => onSelectTab('incidents')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                currentTab === 'incidents'
                  ? 'bg-slate-800 text-amber-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              Arbiter Incidents ({tournament.incidents.length})
            </button>
          </nav>

          {/* Zone 3: Primary Actions */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={onOpenExportModal}
              className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              Export & Report
            </button>

            <button
              onClick={onOpenNewTournament}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-md shadow-sm transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
            >
              <Users className="w-3.5 h-3.5 text-slate-950" />
              Tournament Menu
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
