import React, { useState } from 'react';
import { Award, Check, ChevronRight, Play, Plus, Trophy, Users, X } from 'lucide-react';
import { FideTitle, Player, TimeControlCategory, Tournament, TournamentType } from '../types/chess';
import { generateBergerSchedule } from '../utils/bergerTables';
import { generateKnockoutInitialRound } from '../utils/knockout';
import { generateSwissPairings } from '../utils/swissPairing';

interface TournamentSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPreset: (presetKey: 'tata' | 'swiss' | 'knockout') => void;
  onCreateCustomTournament: (tournament: Tournament) => void;
}

export const TournamentSetupModal: React.FC<TournamentSetupModalProps> = ({
  isOpen,
  onClose,
  onSelectPreset,
  onCreateCustomTournament,
}) => {
  const [mode, setMode] = useState<'presets' | 'custom'>('presets');

  // Custom tournament form state
  const [name, setName] = useState('Spring FIDE Open 2026');
  const [venue, setVenue] = useState('Grand Chess Club');
  const [city, setCity] = useState('Amsterdam');
  const [federation, setFederation] = useState('NED');
  const [chiefArbiter, setChiefArbiter] = useState('IA Jan Timman');
  const [type, setType] = useState<TournamentType>('swiss');
  const [timeControlCategory, setTimeControlCategory] = useState<TimeControlCategory>('standard');
  const [timeControlDescription, setTimeControlDescription] = useState('90 min + 30 sec increment');
  const [defaultTimeMinutes, setDefaultTimeMinutes] = useState(15);
  const [totalRounds, setTotalRounds] = useState(5);

  const [playersText, setPlayersText] = useState(
    `Levon Aronian, 2729, GM, USA
Vincent Keymer, 2730, GM, GER
Hans Niemann, 2733, GM, USA
Daniil Dubov, 2701, GM, FID
Vidit Gujrathi, 2720, GM, IND
Parham Maghsoodloo, 2712, GM, IRI
Jan-Krzysztof Duda, 2733, GM, POL
Wei Yi, 2762, GM, CHN`
  );

  if (!isOpen) return null;

  const handleCreateCustom = () => {
    // Parse players from textarea
    const lines = playersText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const parsedPlayers: Player[] = lines.map((line, idx) => {
      const parts = line.split(',').map((p) => p.trim());
      const pName = parts[0] || `Player ${idx + 1}`;
      const rating = parts[1] ? parseInt(parts[1], 10) || 1500 : 1500;
      const title = (parts[2] as FideTitle) || 'None';
      const fed = parts[3] || 'FIDE';

      return {
        id: `p-${Date.now()}-${idx + 1}`,
        name: pName,
        rating,
        title,
        federation: fed,
        seed: idx + 1,
        initialRating: rating,
        isActive: true,
      };
    });

    if (parsedPlayers.length < 2) {
      alert('Please provide at least 2 players.');
      return;
    }

    // Sort players by initial rating for seeding
    parsedPlayers.sort((a, b) => b.rating - a.rating);
    parsedPlayers.forEach((p, idx) => {
      p.seed = idx + 1;
    });

    let rounds: any[] = [];
    if (type === 'round-robin') {
      rounds = generateBergerSchedule(parsedPlayers);
    } else if (type === 'knockout') {
      rounds = [generateKnockoutInitialRound(parsedPlayers)];
    } else {
      // Swiss
      const round1 = {
        roundNumber: 1,
        isCompleted: false,
        isLocked: false,
        pairings: generateSwissPairings(parsedPlayers, [], 1),
      };
      rounds = [round1];
    }

    const newTournament: Tournament = {
      id: `tour-${Date.now()}`,
      name,
      venue,
      city,
      federation,
      chiefArbiter,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      type,
      timeControlCategory,
      timeControlDescription,
      defaultTimeMinutes,
      totalRounds: type === 'round-robin' ? parsedPlayers.length - 1 : totalRounds,
      currentRound: 1,
      players: parsedPlayers,
      rounds,
      incidents: [],
    };

    onCreateCustomTournament(newTournament);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              Tournament Management & Presets
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Select an international grandmaster tournament or initialize a custom event
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center gap-2 p-3 bg-slate-950/40 border-b border-slate-800">
          <button
            onClick={() => setMode('presets')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              mode === 'presets'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800'
            }`}
          >
            FIDE Featured Presets
          </button>
          <button
            onClick={() => setMode('custom')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              mode === 'custom'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800'
            }`}
          >
            Create Custom Tournament
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {mode === 'presets' ? (
            <div className="space-y-3">
              {/* Preset 1: Tata Steel Round-Robin */}
              <div
                onClick={() => {
                  onSelectPreset('tata');
                  onClose();
                }}
                className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-amber-500/50 cursor-pointer transition-all group shadow-xs"
              >
                <div className="flex items-center justify-between pb-1">
                  <span className="font-bold text-slate-100 group-hover:text-amber-400 text-sm flex items-center gap-2 transition-colors">
                    Tata Steel Masters 2026
                  </span>
                  <span className="text-[11px] font-mono font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                    Round-Robin (Berger)
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed mt-1">
                  8 Super-Grandmasters (Carlsen, Nakamura, Gukesh, Caruana, Firouzja, Erigaisi). Uses FIDE Berger Tables with live cross-table matrix, pre-filled rounds 1 & 2 results, and active tie-breaks.
                </p>
                <div className="flex items-center gap-2 mt-3 text-[11px] text-slate-400 font-mono">
                  <span>8 Participants</span>
                  <span aria-hidden="true">·</span>
                  <span>7 Rounds</span>
                  <span aria-hidden="true">·</span>
                  <span>Zero-Tolerance Default</span>
                </div>
              </div>

              {/* Preset 2: Swiss System */}
              <div
                onClick={() => {
                  onSelectPreset('swiss');
                  onClose();
                }}
                className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-amber-500/50 cursor-pointer transition-all group shadow-xs"
              >
                <div className="flex items-center justify-between pb-1">
                  <span className="font-bold text-slate-100 group-hover:text-amber-400 text-sm flex items-center gap-2 transition-colors">
                    FIDE World Open Swiss Championship 2026
                  </span>
                  <span className="text-[11px] font-mono font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                    Swiss System (Dutch)
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed mt-1">
                  11 Grandmasters + 1 Full-Point Bye scenario. Features scoregroup partitioning, down-floating, color alternation constraints (|W-B| &le; 2), Buchholz Cut 1, and Sonneborn-Berger.
                </p>
                <div className="flex items-center gap-2 mt-3 text-[11px] text-slate-400 font-mono">
                  <span>11 Players (Odd Bye demo)</span>
                  <span aria-hidden="true">·</span>
                  <span>7 Rounds</span>
                  <span aria-hidden="true">·</span>
                  <span>15m Default Time</span>
                </div>
              </div>

              {/* Preset 3: Knockout */}
              <div
                onClick={() => {
                  onSelectPreset('knockout');
                  onClose();
                }}
                className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-amber-500/50 cursor-pointer transition-all group shadow-xs"
              >
                <div className="flex items-center justify-between pb-1">
                  <span className="font-bold text-slate-100 group-hover:text-amber-400 text-sm flex items-center gap-2 transition-colors">
                    FIDE World Cup Knockout 2026
                  </span>
                  <span className="text-[11px] font-mono font-semibold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/30">
                    Single-Elimination
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed mt-1">
                  8-player seeded bracket: Quarter-Finals, Semi-Finals, and Championship Final with winner advancement tracking.
                </p>
                <div className="flex items-center gap-2 mt-3 text-[11px] text-slate-400 font-mono">
                  <span>8 Seeds</span>
                  <span aria-hidden="true">·</span>
                  <span>3 Stages</span>
                  <span aria-hidden="true">·</span>
                  <span>Direct Match Knockout</span>
                </div>
              </div>
            </div>
          ) : (
            /* Custom Tournament Form */
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Tournament Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Chief Arbiter</label>
                  <input
                    type="text"
                    value={chiefArbiter}
                    onChange={(e) => setChiefArbiter(e.target.value)}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Pairing System</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as TournamentType)}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="swiss">Swiss-System (FIDE Dutch)</option>
                    <option value="round-robin">Round-Robin (Berger Tables)</option>
                    <option value="knockout">Knockout / Single-Elimination</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Time Control</label>
                  <select
                    value={timeControlCategory}
                    onChange={(e) => {
                      const cat = e.target.value as TimeControlCategory;
                      setTimeControlCategory(cat);
                      if (cat === 'standard') setTimeControlDescription('90 min + 30 sec increment');
                      else if (cat === 'rapid') setTimeControlDescription('15 min + 10 sec increment');
                      else setTimeControlDescription('3 min + 2 sec increment');
                    }}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="standard">Standard Classical</option>
                    <option value="rapid">Rapid</option>
                    <option value="blitz">Blitz</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Default Time</label>
                  <select
                    value={defaultTimeMinutes}
                    onChange={(e) => setDefaultTimeMinutes(parseInt(e.target.value, 10))}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value={0}>Zero Tolerance (Immediate forfeit)</option>
                    <option value={15}>15 Minutes grace period</option>
                    <option value={30}>30 Minutes grace period</option>
                    <option value={60}>60 Minutes grace period</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  Players List (One per line: Name, Rating, Title, Federation)
                </label>
                <textarea
                  rows={6}
                  value={playersText}
                  onChange={(e) => setPlayersText(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleCreateCustom}
                  className="px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Play className="w-3.5 h-3.5" />
                  Initialize Tournament & Pair Round 1
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
