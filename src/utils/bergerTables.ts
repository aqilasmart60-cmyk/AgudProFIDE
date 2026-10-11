import { GameResult, Pairing, Player, Round } from '../types/chess';

// Standard FIDE Berger pairing generator for Round-Robin tournaments
// Based on official FIDE Handbook C.04.4.1 (Berger Tables)
export function generateBergerSchedule(players: Player[]): Round[] {
  const activePlayers = players.filter((p) => p.isActive);
  let n = activePlayers.length;

  const playerList = [...activePlayers];
  const hasBye = n % 2 !== 0;

  // If odd number, add a dummy bye placeholder
  if (hasBye) {
    playerList.push({
      id: 'BYE_DUMMY',
      name: 'BYE',
      rating: 0,
      federation: 'FIDE',
      seed: n + 1,
      initialRating: 0,
      isActive: true,
    });
    n = playerList.length;
  }

  const roundsCount = n - 1;
  const matchesPerRound = n / 2;
  const rounds: Round[] = [];

  // Rotation array of indices 0 .. n-1
  // Player at index (n-1) remains fixed
  // Other players 0 .. n-2 rotate cyclically
  const indices = Array.from({ length: n - 1 }, (_, i) => i);

  for (let r = 0; r < roundsCount; r++) {
    const pairings: Pairing[] = [];
    let boardNum = 1;

    // Fixed player match: player (n-1) vs current rotating player
    const fixedIndex = n - 1;
    const rotatingOpponentIndex = indices[0];

    const pFixed = playerList[fixedIndex];
    const pOpp = playerList[rotatingOpponentIndex];

    // Standard Berger color rule for the fixed player:
    // When round number is even, fixed player has Black; odd round: White
    // (r is 0-indexed: r=0 is Round 1)
    const fixedIsWhite = r % 2 === 0;
    const wPlayer = fixedIsWhite ? pFixed : pOpp;
    const bPlayer = fixedIsWhite ? pOpp : pFixed;

    if (wPlayer.id === 'BYE_DUMMY') {
      pairings.push({
        boardNumber: 0,
        whitePlayerId: bPlayer.id,
        blackPlayerId: null,
        result: '1-0B',
        isBye: true,
        byeType: 'full',
        arbiterNote: 'Berger table scheduled bye',
      });
    } else if (bPlayer.id === 'BYE_DUMMY') {
      pairings.push({
        boardNumber: 0,
        whitePlayerId: wPlayer.id,
        blackPlayerId: null,
        result: '1-0B',
        isBye: true,
        byeType: 'full',
        arbiterNote: 'Berger table scheduled bye',
      });
    } else {
      pairings.push({
        boardNumber: boardNum++,
        whitePlayerId: wPlayer.id,
        blackPlayerId: bPlayer.id,
        result: '*',
      });
    }

    // Remaining boards
    for (let m = 1; m < matchesPerRound; m++) {
      const idxA = indices[m];
      const idxB = indices[n - 1 - m];

      const pA = playerList[idxA];
      const pB = playerList[idxB];

      // Alternating colors
      const isAWhite = (m + r) % 2 === 0;
      const white = isAWhite ? pA : pB;
      const black = isAWhite ? pB : pA;

      if (white.id === 'BYE_DUMMY') {
        pairings.push({
          boardNumber: 0,
          whitePlayerId: black.id,
          blackPlayerId: null,
          result: '1-0B',
          isBye: true,
          byeType: 'full',
        });
      } else if (black.id === 'BYE_DUMMY') {
        pairings.push({
          boardNumber: 0,
          whitePlayerId: white.id,
          blackPlayerId: null,
          result: '1-0B',
          isBye: true,
          byeType: 'full',
        });
      } else {
        pairings.push({
          boardNumber: boardNum++,
          whitePlayerId: white.id,
          blackPlayerId: black.id,
          result: '*',
        });
      }
    }

    // Reorder board numbers so byes are placed neatly
    const games = pairings.filter((p) => !p.isBye);
    const byes = pairings.filter((p) => p.isBye);
    games.forEach((g, i) => {
      g.boardNumber = i + 1;
    });
    byes.forEach((b, i) => {
      b.boardNumber = games.length + i + 1;
    });

    rounds.push({
      roundNumber: r + 1,
      isCompleted: false,
      isLocked: false,
      pairings: [...games, ...byes],
    });

    // Cyclic rotation of indices (last element moves to start)
    const last = indices.pop()!;
    indices.unshift(last);
  }

  return rounds;
}

export interface CrossTableCell {
  result: GameResult | null;
  opponentId: string;
  color: 'W' | 'B' | null;
  score: number | null; // 1, 0.5, 0, or null
  roundNumber: number | null;
}

// Generate the classic Berger Cross-Table matrix (Player x Player)
export function generateCrossTable(
  players: Player[],
  rounds: Round[]
): {
  matrix: Map<string, Map<string, CrossTableCell>>;
} {
  const matrix = new Map<string, Map<string, CrossTableCell>>();

  players.forEach((p1) => {
    const row = new Map<string, CrossTableCell>();
    players.forEach((p2) => {
      if (p1.id === p2.id) {
        row.set(p2.id, {
          result: null,
          opponentId: p2.id,
          color: null,
          score: null,
          roundNumber: null,
        });
      } else {
        row.set(p2.id, {
          result: null,
          opponentId: p2.id,
          color: null,
          score: null,
          roundNumber: null,
        });
      }
    });
    matrix.set(p1.id, row);
  });

  rounds.forEach((round) => {
    round.pairings.forEach((pairing) => {
      if (pairing.isBye || !pairing.whitePlayerId || !pairing.blackPlayerId) return;

      const wId = pairing.whitePlayerId;
      const bId = pairing.blackPlayerId;

      let wScore: number | null = null;
      let bScore: number | null = null;

      if (pairing.result === '1-0' || pairing.result === '1F-0') {
        wScore = 1;
        bScore = 0;
      } else if (pairing.result === '0-1' || pairing.result === '0-1F') {
        wScore = 0;
        bScore = 1;
      } else if (pairing.result === '1/2-1/2') {
        wScore = 0.5;
        bScore = 0.5;
      }

      if (matrix.has(wId) && matrix.get(wId)!.has(bId)) {
        matrix.get(wId)!.set(bId, {
          result: pairing.result,
          opponentId: bId,
          color: 'W',
          score: wScore,
          roundNumber: round.roundNumber,
        });
      }

      if (matrix.has(bId) && matrix.get(bId)!.has(wId)) {
        matrix.get(bId)!.set(wId, {
          result: pairing.result,
          opponentId: wId,
          color: 'B',
          score: bScore,
          roundNumber: round.roundNumber,
        });
      }
    });
  });

  return { matrix };
}
