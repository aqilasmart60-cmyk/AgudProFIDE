import { Pairing, Player, Round } from '../types/chess';

export interface KnockoutMatch {
  matchId: string;
  roundStage: string; // e.g. "Quarter-Finals", "Semi-Finals", "Final"
  player1: Player | null;
  player2: Player | null;
  winnerId: string | null;
  game1Result: string;
  game2Result?: string;
  tiebreakResult?: string;
  isCompleted: boolean;
}

// Generate classic bracket pairings for seeds
// e.g. For 8 players: [1 vs 8], [4 vs 5], [2 vs 7], [3 vs 6]
export function generateKnockoutInitialRound(players: Player[]): Round {
  const sorted = [...players].sort((a, b) => b.rating - a.rating);
  const n = sorted.length;
  // Pad to next power of 2 if needed
  let size = 2;
  while (size < n) size *= 2;

  // Standard seeding bracket order for power of 2
  const bracketOrder = getStandardBracketOrder(size);
  const pairings: Pairing[] = [];

  for (let i = 0; i < bracketOrder.length; i += 2) {
    const seed1 = bracketOrder[i];
    const seed2 = bracketOrder[i + 1];

    const p1 = sorted[seed1 - 1] || null;
    const p2 = sorted[seed2 - 1] || null;

    if (p1 && p2) {
      pairings.push({
        boardNumber: i / 2 + 1,
        whitePlayerId: p1.id,
        blackPlayerId: p2.id,
        result: '*',
      });
    } else if (p1 && !p2) {
      // Bye
      pairings.push({
        boardNumber: i / 2 + 1,
        whitePlayerId: p1.id,
        blackPlayerId: null,
        result: '1-0B',
        isBye: true,
        byeType: 'full',
      });
    }
  }

  return {
    roundNumber: 1,
    isCompleted: false,
    isLocked: false,
    pairings,
  };
}

// Standard tournament bracket seeding order: 1 vs 8, 4 vs 5, 2 vs 7, 3 vs 6
function getStandardBracketOrder(numSeeds: number): number[] {
  let rounds = [1, 2];
  while (rounds.length < numSeeds) {
    const nextRound: number[] = [];
    const sum = rounds.length * 2 + 1;
    for (const seed of rounds) {
      nextRound.push(seed);
      nextRound.push(sum - seed);
    }
    rounds = nextRound;
  }
  return rounds;
}

// Progress knockout winners to next round
export function advanceKnockoutRound(
  prevRound: Round,
  players: Player[],
  nextRoundNumber: number
): Round | null {
  const playerMap = new Map<string, Player>();
  players.forEach((p) => playerMap.set(p.id, p));

  const winners: Player[] = [];

  for (const pairing of prevRound.pairings) {
    if (pairing.isBye) {
      const p = playerMap.get(pairing.whitePlayerId);
      if (p) winners.push(p);
      continue;
    }

    if (pairing.result === '1-0' || pairing.result === '1F-0') {
      const p = playerMap.get(pairing.whitePlayerId);
      if (p) winners.push(p);
    } else if (pairing.result === '0-1' || pairing.result === '0-1F') {
      if (pairing.blackPlayerId) {
        const p = playerMap.get(pairing.blackPlayerId);
        if (p) winners.push(p);
      }
    } else {
      // Not yet decided or drawn (in knockout match must have a winner)
      return null;
    }
  }

  if (winners.length < 2) {
    // Tournament ended (Final concluded)
    return null;
  }

  const nextPairings: Pairing[] = [];
  for (let i = 0; i < winners.length; i += 2) {
    const w1 = winners[i];
    const w2 = winners[i + 1];

    if (w1 && w2) {
      // Alternate color from seed
      nextPairings.push({
        boardNumber: i / 2 + 1,
        whitePlayerId: w1.id,
        blackPlayerId: w2.id,
        result: '*',
      });
    }
  }

  return {
    roundNumber: nextRoundNumber,
    isCompleted: false,
    isLocked: false,
    pairings: nextPairings,
  };
}
