import React, { useMemo, useState } from 'react';
import { ArbiterAIPanel } from './components/ArbiterAIPanel';
import { ArbiterLogView } from './components/ArbiterLogView';
import { IncidentModal } from './components/IncidentModal';
import { KnockoutBracketView } from './components/KnockoutBracketView';
import { Navbar } from './components/Navbar';
import { PairingBoardView } from './components/PairingBoardView';
import { ReportsAndExportModal } from './components/ReportsAndExportModal';
import { RoundRobinCrossTable } from './components/RoundRobinCrossTable';
import { StandingsTable } from './components/StandingsTable';
import { TournamentSetupModal } from './components/TournamentSetupModal';
import {
  createKnockoutPreset,
  createSwissOpenPreset,
  createTataSteelMastersPreset,
} from './data/tournamentPresets';
import { ArbiterIncident, GameResult, Tournament } from './types/chess';
import { advanceKnockoutRound } from './utils/knockout';
import { generateSwissPairings } from './utils/swissPairing';
import { calculateStandings } from './utils/tiebreaks';

export default function App() {
  // Initialize with the prestigious Tata Steel Masters preset
  const [tournament, setTournament] = useState<Tournament>(() => createTataSteelMastersPreset());
  const [activeRoundIndex, setActiveRoundIndex] = useState<number>(0);
  const [currentTab, setCurrentTab] = useState<'pairings' | 'standings' | 'crosstable' | 'knockout' | 'arbiter' | 'incidents'>('pairings');

  // Modals state
  const [isTournamentSetupOpen, setIsTournamentSetupOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
  const [activeIncidentBoardData, setActiveIncidentBoardData] = useState<{
    boardNumber: number;
    whiteId: string;
    blackId: string | null;
  } | null>(null);

  // Compute live standings and tie-breaks
  const standings = useMemo(() => {
    return calculateStandings(tournament.players, tournament.rounds);
  }, [tournament.players, tournament.rounds]);

  // Update game result
  const handleUpdateResult = (roundNumber: number, boardNumber: number, result: GameResult) => {
    setTournament((prev) => {
      const nextRounds = prev.rounds.map((round) => {
        if (round.roundNumber !== roundNumber) return round;

        const nextPairings = round.pairings.map((p) => {
          if (p.boardNumber !== boardNumber) return p;
          return { ...p, result };
        });

        const allFinished = nextPairings.every((p) => p.isBye || p.result !== '*');

        return {
          ...round,
          pairings: nextPairings,
          isCompleted: allFinished,
        };
      });

      return {
        ...prev,
        rounds: nextRounds,
      };
    });
  };

  // Generate next round pairings
  const handleGenerateNextRound = () => {
    if (tournament.type === 'swiss') {
      const nextRoundNumber = tournament.rounds.length + 1;
      if (nextRoundNumber > tournament.totalRounds) {
        alert('Tournament has reached the scheduled total rounds.');
        return;
      }

      const nextPairings = generateSwissPairings(tournament.players, tournament.rounds, nextRoundNumber);
      const newRound = {
        roundNumber: nextRoundNumber,
        isCompleted: false,
        isLocked: false,
        pairings: nextPairings,
      };

      setTournament((prev) => ({
        ...prev,
        rounds: [...prev.rounds, newRound],
        currentRound: nextRoundNumber,
      }));
      setActiveRoundIndex(tournament.rounds.length);
    } else if (tournament.type === 'round-robin') {
      // In Round-Robin, rounds are already scheduled in Berger tables.
      // Move to next unplayed round
      if (activeRoundIndex < tournament.rounds.length - 1) {
        setActiveRoundIndex(activeRoundIndex + 1);
      }
    } else if (tournament.type === 'knockout') {
      const currentRoundObj = tournament.rounds[tournament.rounds.length - 1];
      const nextRound = advanceKnockoutRound(
        currentRoundObj,
        tournament.players,
        tournament.rounds.length + 1
      );

      if (!nextRound) {
        alert('All match winners in current stage must be determined before advancing to the next stage.');
        return;
      }

      setTournament((prev) => ({
        ...prev,
        rounds: [...prev.rounds, nextRound],
        currentRound: prev.rounds.length + 1,
      }));
      setActiveRoundIndex(tournament.rounds.length);
    }
  };

  // Load preset tournaments
  const handleSelectPreset = (presetKey: 'tata' | 'swiss' | 'knockout') => {
    let t: Tournament;
    if (presetKey === 'tata') {
      t = createTataSteelMastersPreset();
      setCurrentTab('pairings');
    } else if (presetKey === 'swiss') {
      t = createSwissOpenPreset();
      setCurrentTab('pairings');
    } else {
      t = createKnockoutPreset();
      setCurrentTab('knockout');
    }
    setTournament(t);
    setActiveRoundIndex(0);
  };

  // Add Incident
  const handleSaveIncident = (incident: ArbiterIncident) => {
    setTournament((prev) => ({
      ...prev,
      incidents: [incident, ...prev.incidents],
    }));
  };

  const handleOpenLogIncident = (boardNumber: number, whiteId: string, blackId: string | null) => {
    setActiveIncidentBoardData({ boardNumber, whiteId, blackId });
    setIsIncidentModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Navigation Top Bar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        tournament={tournament}
        onOpenNewTournament={() => setIsTournamentSetupOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentTab === 'pairings' && (
          <PairingBoardView
            tournament={tournament}
            activeRoundIndex={activeRoundIndex}
            onChangeRoundIndex={setActiveRoundIndex}
            onUpdateResult={handleUpdateResult}
            onGenerateNextRound={handleGenerateNextRound}
            onOpenLogIncident={handleOpenLogIncident}
            onOpenAddPlayerModal={() => setIsTournamentSetupOpen(true)}
          />
        )}

        {currentTab === 'standings' && (
          <StandingsTable tournament={tournament} standings={standings} />
        )}

        {currentTab === 'crosstable' && tournament.type === 'round-robin' && (
          <RoundRobinCrossTable tournament={tournament} standings={standings} />
        )}

        {currentTab === 'knockout' && tournament.type === 'knockout' && (
          <KnockoutBracketView
            tournament={tournament}
            onUpdateResult={handleUpdateResult}
            onAdvanceKnockout={handleGenerateNextRound}
          />
        )}

        {currentTab === 'arbiter' && <ArbiterAIPanel tournament={tournament} />}

        {currentTab === 'incidents' && (
          <ArbiterLogView
            tournament={tournament}
            onOpenAddIncident={() => {
              setActiveIncidentBoardData(null);
              setIsIncidentModalOpen(true);
            }}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <span>AgudPro Tournament System</span>
            <span aria-hidden="true" className="mx-2">·</span>
            <span>FIDE Laws of Chess Compliant</span>
            <span aria-hidden="true" className="mx-2">·</span>
            <span>Dutch Swiss &amp; Berger Tables</span>
          </div>
          <div className="font-mono text-[11px] text-slate-500">
            Chief Arbiter Panel Active
          </div>
        </div>
      </footer>

      {/* Modals */}
      <TournamentSetupModal
        isOpen={isTournamentSetupOpen}
        onClose={() => setIsTournamentSetupOpen(false)}
        onSelectPreset={handleSelectPreset}
        onCreateCustomTournament={(newT) => {
          setTournament(newT);
          setActiveRoundIndex(0);
          setCurrentTab('pairings');
        }}
      />

      <ReportsAndExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        tournament={tournament}
        standings={standings}
      />

      <IncidentModal
        isOpen={isIncidentModalOpen}
        onClose={() => {
          setIsIncidentModalOpen(false);
          setActiveIncidentBoardData(null);
        }}
        tournament={tournament}
        defaultBoardNumber={activeIncidentBoardData?.boardNumber}
        defaultWhiteId={activeIncidentBoardData?.whiteId}
        defaultBlackId={activeIncidentBoardData?.blackId}
        onSaveIncident={handleSaveIncident}
      />
    </div>
  );
}
