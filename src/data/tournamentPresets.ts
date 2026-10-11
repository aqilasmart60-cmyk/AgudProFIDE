import { Player, Tournament } from '../types/chess';
import { generateBergerSchedule } from '../utils/bergerTables';
import { generateKnockoutInitialRound } from '../utils/knockout';
import { generateSwissPairings } from '../utils/swissPairing';

export const GM_PLAYERS: Player[] = [
  { id: 'p1', name: 'Magnus Carlsen', rating: 2835, title: 'GM', federation: 'NOR', seed: 1, initialRating: 2835, isActive: true },
  { id: 'p2', name: 'Hikaru Nakamura', rating: 2802, title: 'GM', federation: 'USA', seed: 2, initialRating: 2802, isActive: true },
  { id: 'p3', name: 'Gukesh D', rating: 2794, title: 'GM', federation: 'IND', seed: 3, initialRating: 2794, isActive: true },
  { id: 'p4', name: 'Arjun Erigaisi', rating: 2797, title: 'GM', federation: 'IND', seed: 4, initialRating: 2797, isActive: true },
  { id: 'p5', name: 'Fabiano Caruana', rating: 2805, title: 'GM', federation: 'USA', seed: 5, initialRating: 2805, isActive: true },
  { id: 'p6', name: 'Alireza Firouzja', rating: 2767, title: 'GM', federation: 'FRA', seed: 6, initialRating: 2767, isActive: true },
  { id: 'p7', name: 'Nodirbek Abdusattorov', rating: 2777, title: 'GM', federation: 'UZB', seed: 7, initialRating: 2777, isActive: true },
  { id: 'p8', name: 'Praggnanandhaa R', rating: 2746, title: 'GM', federation: 'IND', seed: 8, initialRating: 2746, isActive: true },
];

export const SWISS_PLAYERS: Player[] = [
  { id: 'sw1', name: 'Ian Nepomniachtchi', rating: 2755, title: 'GM', federation: 'FID', seed: 1, initialRating: 2755, isActive: true },
  { id: 'sw2', name: 'Ding Liren', rating: 2728, title: 'GM', federation: 'CHN', seed: 2, initialRating: 2728, isActive: true },
  { id: 'sw3', name: 'Vincent Keymer', rating: 2730, title: 'GM', federation: 'GER', seed: 3, initialRating: 2730, isActive: true },
  { id: 'sw4', name: 'Wei Yi', rating: 2762, title: 'GM', federation: 'CHN', seed: 4, initialRating: 2762, isActive: true },
  { id: 'sw5', name: 'Hans Niemann', rating: 2733, title: 'GM', federation: 'USA', seed: 5, initialRating: 2733, isActive: true },
  { id: 'sw6', name: 'Levon Aronian', rating: 2729, title: 'GM', federation: 'USA', seed: 6, initialRating: 2729, isActive: true },
  { id: 'sw7', name: 'Jan-Krzysztof Duda', rating: 2733, title: 'GM', federation: 'POL', seed: 7, initialRating: 2733, isActive: true },
  { id: 'sw8', name: 'Maxime Vachier-Lagrave', rating: 2731, title: 'GM', federation: 'FRA', seed: 8, initialRating: 2731, isActive: true },
  { id: 'sw9', name: 'Daniil Dubov', rating: 2701, title: 'GM', federation: 'FID', seed: 9, initialRating: 2701, isActive: true },
  { id: 'sw10', name: 'Vidit Gujrathi', rating: 2720, title: 'GM', federation: 'IND', seed: 10, initialRating: 2720, isActive: true },
  { id: 'sw11', name: 'Parham Maghsoodloo', rating: 2712, title: 'GM', federation: 'IRI', seed: 11, initialRating: 2712, isActive: true },
];

export function createTataSteelMastersPreset(): Tournament {
  const players = JSON.parse(JSON.stringify(GM_PLAYERS));
  const rounds = generateBergerSchedule(players);

  // Pre-fill round 1 & 2 results to showcase real standings & Berger cross-table immediately!
  if (rounds[0]) {
    rounds[0].pairings[0].result = '1-0';
    rounds[0].pairings[1].result = '1/2-1/2';
    rounds[0].pairings[2].result = '0-1';
    rounds[0].pairings[3].result = '1/2-1/2';
    rounds[0].isCompleted = true;
  }
  if (rounds[1]) {
    rounds[1].pairings[0].result = '1/2-1/2';
    rounds[1].pairings[1].result = '1-0';
    rounds[1].pairings[2].result = '1/2-1/2';
    rounds[1].pairings[3].result = '0-1';
    rounds[1].isCompleted = true;
  }

  return {
    id: 'tata-steel-2026',
    name: 'Tata Steel Chess Masters 2026',
    venue: 'De Moriaan Arena',
    city: 'Wijk aan Zee',
    federation: 'NED',
    chiefArbiter: 'IA Pavel Votruba (CZE)',
    deputyArbiter: 'IA Laurent Freyd (FRA)',
    startDate: '2026-01-16',
    endDate: '2026-02-01',
    type: 'round-robin',
    timeControlCategory: 'standard',
    timeControlDescription: '100 min / 40 moves + 50 min / 20 moves + 15 min + 30s/move',
    defaultTimeMinutes: 0, // Zero tolerance
    totalRounds: 7,
    currentRound: 3,
    players,
    rounds,
    incidents: [
      {
        id: 'inc-1',
        roundNumber: 2,
        boardNumber: 3,
        playerIds: ['p5', 'p6'],
        type: 'draw_claim',
        description: 'Black claimed threefold repetition under Article 9.2 with 34...Qd6. Arbiter verified move notation and confirmed position occurred three times.',
        fideArticleCited: 'Article 9.2.2',
        decision: 'Draw upheld immediately. Score recorded 1/2-1/2.',
        timestamp: '2026-01-18 17:40',
      },
    ],
  };
}

export function createSwissOpenPreset(): Tournament {
  const players = JSON.parse(JSON.stringify(SWISS_PLAYERS));
  const round1Pairings = generateSwissPairings(players, [], 1);

  // Round 1 completed
  round1Pairings[0].result = '1-0';
  round1Pairings[1].result = '1/2-1/2';
  round1Pairings[2].result = '1-0';
  round1Pairings[3].result = '0-1';
  round1Pairings[4].result = '1-0';
  // Bye pairing is already 1-0B

  const round1 = {
    roundNumber: 1,
    isCompleted: true,
    isLocked: true,
    pairings: round1Pairings,
  };

  // Generate round 2 pairings based on round 1 results
  const round2Pairings = generateSwissPairings(players, [round1], 2);

  return {
    id: 'swiss-world-open-2026',
    name: 'FIDE World Open Swiss Championship 2026',
    venue: 'Hilton Grand Ballroom',
    city: 'Reykjavik',
    federation: 'ISL',
    chiefArbiter: 'IA Anastasia Sorokina (AUS)',
    deputyArbiter: 'IA Omar Salama (ISL)',
    startDate: '2026-04-10',
    endDate: '2026-04-18',
    type: 'swiss',
    timeControlCategory: 'standard',
    timeControlDescription: '90 min + 30 sec increment from move 1',
    defaultTimeMinutes: 15, // 15 min default
    totalRounds: 7,
    currentRound: 2,
    players,
    rounds: [
      round1,
      {
        roundNumber: 2,
        isCompleted: false,
        isLocked: false,
        pairings: round2Pairings,
      },
    ],
    incidents: [
      {
        id: 'inc-swiss-1',
        roundNumber: 1,
        boardNumber: 6,
        playerIds: ['sw11'],
        type: 'other',
        description: 'Full-point bye allocated to Seed 11 (Maghsoodloo) following FIDE Swiss Protocol C.04.1.e (lowest score, lowest seed with no prior bye).',
        fideArticleCited: 'FIDE Handbook C.04.1.e',
        decision: 'Awarded 1-point pairing bye. Player is eligible to play Round 2 and cannot receive another bye.',
        timestamp: '2026-04-10 14:00',
      },
    ],
  };
}

export function createKnockoutPreset(): Tournament {
  const players = JSON.parse(JSON.stringify(GM_PLAYERS));
  const round1 = generateKnockoutInitialRound(players);

  return {
    id: 'fide-world-cup-knockout',
    name: 'FIDE World Cup Knockout Trophy 2026',
    venue: 'Olympic Sports Palace',
    city: 'Tbilisi',
    federation: 'GEO',
    chiefArbiter: 'IA Stephane Escafre (FRA)',
    startDate: '2026-08-01',
    endDate: '2026-08-10',
    type: 'knockout',
    timeControlCategory: 'standard',
    timeControlDescription: '90 min/40 moves + 30 min + 30s inc. Tiebreak: 25m+10s Rapid, 3m+2s Blitz',
    defaultTimeMinutes: 0,
    totalRounds: 3, // Quarterfinals (8), Semifinals (4), Final (2)
    currentRound: 1,
    players,
    rounds: [round1],
    incidents: [],
  };
}
