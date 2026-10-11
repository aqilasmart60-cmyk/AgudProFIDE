import { Pairing, Player, Round } from '../types/chess';
import { calculateStandings } from './tiebreaks';

interface PlayerColorState {
  playerId: string;
  whiteCount: number;
  blackCount: number;
  history: ('W' | 'B' | '-')[];
  lastColor: 'W' | 'B' | null;
  consecutiveSameColor: number;
  hasHadBye: boolean;
  playedOpponents: Set<string>;
}

// Extract player color states and played opponents from past rounds
export function getPlayerColorStates(players: Player[], pastRounds: Round[]): Map<string, PlayerColorState> {
  const stateMap = new Map<string, PlayerColorState>();

  players.forEach((p) => {
    stateMap.set(p.id, {
      playerId: p.id,
      whiteCount: 0,
      blackCount: 0,
      history: [],
      lastColor: null,
      consecutiveSameColor: 0,
      hasHadBye: false,
      playedOpponents: new Set<string>(),
    });
  });

  pastRounds.forEach((round) => {
    round.pairings.forEach((pairing) => {
      const { whitePlayerId, blackPlayerId, isBye } = pairing;

      if (isBye) {
        if (stateMap.has(whitePlayerId)) {
          const s = stateMap.get(whitePlayerId)!;
          s.hasHadBye = true;
          s.history.push('-');
        }
        return;
      }

      if (whitePlayerId && stateMap.has(whitePlayerId)) {
        const s = stateMap.get(whitePlayerId)!;
        s.whiteCount++;
        s.history.push('W');
        if (s.lastColor === 'W') {
          s.consecutiveSameColor++;
        } else {
          s.consecutiveSameColor = 1;
        }
        s.lastColor = 'W';
        if (blackPlayerId) s.playedOpponents.add(blackPlayerId);
      }

      if (blackPlayerId && stateMap.has(blackPlayerId)) {
        const s = stateMap.get(blackPlayerId)!;
        s.blackCount++;
        s.history.push('B');
        if (s.lastColor === 'B') {
          s.consecutiveSameColor++;
        } else {
          s.consecutiveSameColor = 1;
        }
        s.lastColor = 'B';
        if (whitePlayerId) s.playedOpponents.add(whitePlayerId);
      }
    });
  });

  return stateMap;
}

// Can player receive this color according to FIDE rules?
// Rule A: Max 2 consecutive same colors. A 3rd same color in a row is forbidden.
// Rule B: Absolute difference |W - B| <= 2 at all times.
export function canAssignColor(state: PlayerColorState, desiredColor: 'W' | 'B'): boolean {
  if (state.lastColor === desiredColor && state.consecutiveSameColor >= 2) {
    return false; // Violates max 2 consecutive
  }

  const newW = state.whiteCount + (desiredColor === 'W' ? 1 : 0);
  const newB = state.blackCount + (desiredColor === 'B' ? 1 : 0);

  if (Math.abs(newW - newB) > 2) {
    return false; // Violates color balance <= 2
  }

  return true;
}

// Color preference score: negative means prefers Black, positive means prefers White
export function getColorPreference(state: PlayerColorState): number {
  let score = 0;
  // If had White, strongly prefer Black
  if (state.lastColor === 'W') score -= 2;
  if (state.lastColor === 'B') score += 2;

  // Imbalance
  score += (state.blackCount - state.whiteCount) * 1.5;

  // If 2 in a row, extreme preference
  if (state.lastColor === 'W' && state.consecutiveSameColor >= 2) score -= 10;
  if (state.lastColor === 'B' && state.consecutiveSameColor >= 2) score += 10;

  return score;
}

// Decide who plays White and Black for a pair of players
export function determineColors(
  p1State: PlayerColorState,
  p2State: PlayerColorState
): { whiteId: string; blackId: string; isAnomaly: boolean; reason?: string } {
  const p1Pref = getColorPreference(p1State);
  const p2Pref = getColorPreference(p2State);

  const p1CanWhite = canAssignColor(p1State, 'W');
  const p1CanBlack = canAssignColor(p1State, 'B');
  const p2CanWhite = canAssignColor(p2State, 'W');
  const p2CanBlack = canAssignColor(p2State, 'B');

  // Case 1: Constraints force exact color
  if (p1CanWhite && p2CanBlack && (!p1CanBlack || !p2CanWhite)) {
    return { whiteId: p1State.playerId, blackId: p2State.playerId, isAnomaly: false };
  }
  if (p2CanWhite && p1CanBlack && (!p2CanBlack || !p1CanWhite)) {
    return { whiteId: p2State.playerId, blackId: p1State.playerId, isAnomaly: false };
  }

  // Case 2: Preference difference
  if (p1Pref > p2Pref) {
    // p1 prefers White more than p2
    return {
      whiteId: p1State.playerId,
      blackId: p2State.playerId,
      isAnomaly: p1State.lastColor === 'W' && p2State.lastColor === 'B',
      reason:
        p1State.lastColor === 'W' && p2State.lastColor === 'B'
          ? 'Color repeated for both players to satisfy stronger imbalance constraints'
          : undefined,
    };
  } else if (p2Pref > p1Pref) {
    return {
      whiteId: p2State.playerId,
      blackId: p1State.playerId,
      isAnomaly: p2State.lastColor === 'W' && p1State.lastColor === 'B',
      reason:
        p2State.lastColor === 'W' && p1State.lastColor === 'B'
          ? 'Color repeated for both players to satisfy stronger imbalance constraints'
          : undefined,
    };
  }

  // Case 3: Equal preference - alternate or use seed
  if (p1State.lastColor === 'W') {
    return { whiteId: p2State.playerId, blackId: p1State.playerId, isAnomaly: false };
  } else {
    return { whiteId: p1State.playerId, blackId: p2State.playerId, isAnomaly: false };
  }
}

// Generate FIDE Swiss Pairings for next round
export function generateSwissPairings(
  players: Player[],
  pastRounds: Round[],
  nextRoundNumber: number
): Pairing[] {
  const activePlayers = players.filter((p) => p.isActive);
  const standings = calculateStandings(activePlayers, pastRounds);
  const colorStates = getPlayerColorStates(activePlayers, pastRounds);

  // Check requested half-point byes for this round
  const requestedByePlayerIds = new Set<string>();
  const pairings: Pairing[] = [];
  let boardNumber = 1;

  activePlayers.forEach((p) => {
    if (p.requestedByes?.includes(nextRoundNumber)) {
      requestedByePlayerIds.add(p.id);
      pairings.push({
        boardNumber: 0, // bye
        whitePlayerId: p.id,
        blackPlayerId: null,
        result: '0.5H',
        isBye: true,
        byeType: 'half',
        arbiterNote: 'Requested half-point bye approved prior to round pairing',
      });
    }
  });

  // Filter out players with requested byes
  let eligiblePlayers = standings
    .map((s) => s.player)
    .filter((p) => !requestedByePlayerIds.has(p.id));

  // Handle Full-Point Bye if odd number of eligible players
  // FIDE rule: The lowest-ranked player in the lowest scoregroup who has not received a bye receives the bye.
  if (eligiblePlayers.length % 2 !== 0) {
    // Look from bottom up for player with no bye
    let byeIndex = -1;
    for (let i = eligiblePlayers.length - 1; i >= 0; i--) {
      const pState = colorStates.get(eligiblePlayers[i].id);
      if (pState && !pState.hasHadBye) {
        byeIndex = i;
        break;
      }
    }

    if (byeIndex === -1) {
      // If all have had byes, take lowest player
      byeIndex = eligiblePlayers.length - 1;
    }

    const [byePlayer] = eligiblePlayers.splice(byeIndex, 1);
    pairings.push({
      boardNumber: 0,
      whitePlayerId: byePlayer.id,
      blackPlayerId: null,
      result: '1-0B',
      isBye: true,
      byeType: 'full',
      arbiterNote: 'FIDE Swiss Full-Point Bye (Assigned to lowest-score player without prior bye)',
    });
  }

  // Round 1 special FIDE Dutch seeding protocol
  if (pastRounds.length === 0) {
    // Sort by rating / seed
    eligiblePlayers.sort((a, b) => (b.rating !== a.rating ? b.rating - a.rating : a.seed - b.seed));
    const half = Math.floor(eligiblePlayers.length / 2);
    const topHalf = eligiblePlayers.slice(0, half);
    const bottomHalf = eligiblePlayers.slice(half);

    for (let i = 0; i < topHalf.length; i++) {
      const p1 = topHalf[i];
      const p2 = bottomHalf[i];
      // Board 1: Seed 1 gets White (or alternating)
      // Alternating colors down the boards
      const isP1White = i % 2 === 0;
      pairings.push({
        boardNumber: boardNumber++,
        whitePlayerId: isP1White ? p1.id : p2.id,
        blackPlayerId: isP1White ? p2.id : p1.id,
        result: '*',
      });
    }

    return reorderBoards(pairings);
  }

  // Subsequent rounds: Score Groups & Backtracking matching
  // Group players by current points
  const pointsMap = new Map<number, Player[]>();
  eligiblePlayers.forEach((p) => {
    const pStanding = standings.find((s) => s.player.id === p.id);
    const pts = pStanding ? pStanding.points : 0;
    const list = pointsMap.get(pts) || [];
    list.push(p);
    pointsMap.set(pts, list);
  });

  // Get distinct score brackets in descending order
  const distinctScores = Array.from(pointsMap.keys()).sort((a, b) => b - a);

  // We pair through the brackets. If an odd player remains in a bracket, they float down.
  const pairedPlayerIds = new Set<string>();
  const generatedBoardPairs: {
    p1: Player;
    p2: Player;
    isFloat: boolean;
    floatType?: string;
  }[] = [];

  let floatDownPlayer: Player | null = null;

  for (let sIdx = 0; sIdx < distinctScores.length; sIdx++) {
    const score = distinctScores[sIdx];
    let bracket = pointsMap.get(score)!.filter((p) => !pairedPlayerIds.has(p.id));

    if (floatDownPlayer) {
      bracket = [floatDownPlayer, ...bracket];
      floatDownPlayer = null;
    }

    if (bracket.length === 0) continue;

    // Try to pair within this bracket
    const result = pairBracket(bracket, colorStates, pairedPlayerIds);

    result.pairs.forEach((pair) => {
      generatedBoardPairs.push({
        p1: pair[0],
        p2: pair[1],
        isFloat: pair[2] || false,
        floatType: pair[3],
      });
      pairedPlayerIds.add(pair[0].id);
      pairedPlayerIds.add(pair[1].id);
    });

    if (result.unpaired) {
      floatDownPlayer = result.unpaired;
    }
  }

  // If someone remains unpaired (e.g. edge case in lowest bracket), match with any remaining
  if (floatDownPlayer) {
    const remaining = eligiblePlayers.filter((p) => !pairedPlayerIds.has(p.id));
    for (const other of remaining) {
      const state1 = colorStates.get(floatDownPlayer.id)!;
      if (!state1.playedOpponents.has(other.id)) {
        generatedBoardPairs.push({
          p1: floatDownPlayer,
          p2: other,
          isFloat: true,
          floatType: 'Emergency bracket resolution',
        });
        pairedPlayerIds.add(floatDownPlayer.id);
        pairedPlayerIds.add(other.id);
        floatDownPlayer = null;
        break;
      }
    }
  }

  // Now assign colors and board numbers for all matched pairs
  generatedBoardPairs.forEach(({ p1, p2, isFloat, floatType }) => {
    const s1 = colorStates.get(p1.id)!;
    const s2 = colorStates.get(p2.id)!;
    const { whiteId, blackId, isAnomaly, reason } = determineColors(s1, s2);

    pairings.push({
      boardNumber: boardNumber++,
      whitePlayerId: whiteId,
      blackPlayerId: blackId,
      result: '*',
      isAnomaly: isAnomaly || isFloat,
      anomalyReason:
        isFloat && floatType
          ? `${floatType} (${reason || 'Standard Swiss down-float'})`
          : reason,
    });
  });

  return reorderBoards(pairings);
}

// Backtracking helper to pair players within a score bracket avoiding rematches
function pairBracket(
  players: Player[],
  colorStates: Map<string, PlayerColorState>,
  alreadyPaired: Set<string>
): {
  pairs: [Player, Player, boolean?, string?][];
  unpaired: Player | null;
} {
  const n = players.length;
  if (n === 0) return { pairs: [], unpaired: null };

  // If odd, one player must float down. In FIDE, the lowest-rated player in the bracket floats.
  let candidatePlayers = [...players];
  let downFloater: Player | null = null;

  if (n % 2 !== 0) {
    // Float the lowest rated player in bracket
    downFloater = candidatePlayers[candidatePlayers.length - 1];
    candidatePlayers = candidatePlayers.slice(0, candidatePlayers.length - 1);
  }

  // Half vs half within bracket
  const half = Math.floor(candidatePlayers.length / 2);
  const s1 = candidatePlayers.slice(0, half);
  const s2 = candidatePlayers.slice(half);

  const pairs: [Player, Player, boolean?, string?][] = [];
  const used = new Set<string>();

  for (let i = 0; i < s1.length; i++) {
    const p1 = s1[i];
    let matched = false;

    // Search in s2 first
    for (let j = 0; j < s2.length; j++) {
      const p2 = s2[j];
      if (used.has(p2.id)) continue;

      const state1 = colorStates.get(p1.id);
      if (state1 && !state1.playedOpponents.has(p2.id)) {
        pairs.push([p1, p2]);
        used.add(p2.id);
        matched = true;
        break;
      }
    }

    if (!matched) {
      // Search in any remaining in s1
      for (let j = i + 1; j < s1.length; j++) {
        const p2 = s1[j];
        if (used.has(p2.id)) continue;
        const state1 = colorStates.get(p1.id);
        if (state1 && !state1.playedOpponents.has(p2.id)) {
          pairs.push([p1, p2]);
          used.add(p2.id);
          matched = true;
          break;
        }
      }
    }
  }

  // Any unmatched get passed back or floated
  const pairedIds = new Set(pairs.flatMap((p) => [p[0].id, p[1].id]));
  const leftover = candidatePlayers.filter((p) => !pairedIds.has(p.id));

  if (leftover.length > 0) {
    if (!downFloater) {
      downFloater = leftover[0];
    }
  }

  return { pairs, unpaired: downFloater };
}

// Clean up board numbers: games on board 1..N, byes listed at bottom or board 0
function reorderBoards(pairings: Pairing[]): Pairing[] {
  const games = pairings.filter((p) => !p.isBye);
  const byes = pairings.filter((p) => p.isBye);

  games.forEach((g, idx) => {
    g.boardNumber = idx + 1;
  });

  byes.forEach((b, idx) => {
    b.boardNumber = games.length + idx + 1;
  });

  return [...games, ...byes];
}
