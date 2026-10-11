import { GameResult, Player, PlayerStandingsRow, Round } from '../types/chess';

// Score assigned for result
export function getPlayerScoreFromResult(result: GameResult, isWhite: boolean): number {
  switch (result) {
    case '1-0':
      return isWhite ? 1 : 0;
    case '0-1':
      return isWhite ? 0 : 1;
    case '1/2-1/2':
      return 0.5;
    case '1F-0':
      return isWhite ? 1 : 0;
    case '0-1F':
      return isWhite ? 0 : 1;
    case '0F-0F':
      return 0;
    case '1-0B':
      return 1;
    case '0.5H':
      return 0.5;
    case '0F':
      return 0;
    case '*':
      return 0;
    default:
      return 0;
  }
}

export function isWin(result: GameResult, isWhite: boolean): boolean {
  if (result === '1-0' || result === '1F-0') return isWhite;
  if (result === '0-1' || result === '0-1F') return !isWhite;
  return false;
}

export function isDraw(result: GameResult): boolean {
  return result === '1/2-1/2';
}

export interface PlayerRoundData {
  playerId: string;
  opponentId: string | null;
  color: 'W' | 'B' | '-';
  result: GameResult;
  pointsEarned: number;
  cumulativeScore: number;
}

// Compute player tournament statistics and tiebreak scores
export function calculateStandings(players: Player[], rounds: Round[]): PlayerStandingsRow[] {
  const playerMap = new Map<string, Player>();
  players.forEach((p) => playerMap.set(p.id, p));

  // 1. Gather all games per player across rounds
  const playerGames = new Map<string, PlayerRoundData[]>();
  players.forEach((p) => playerGames.set(p.id, []));

  // Track running points round by round
  const currentRunningPoints = new Map<string, number>();
  players.forEach((p) => currentRunningPoints.set(p.id, 0));

  rounds.forEach((round) => {
    round.pairings.forEach((pairing) => {
      const whiteId = pairing.whitePlayerId;
      const blackId = pairing.blackPlayerId;

      if (whiteId && playerGames.has(whiteId)) {
        const isWhite = true;
        const pts = getPlayerScoreFromResult(pairing.result, isWhite);
        const prev = currentRunningPoints.get(whiteId) || 0;
        const newTotal = prev + pts;
        currentRunningPoints.set(whiteId, newTotal);

        playerGames.get(whiteId)!.push({
          playerId: whiteId,
          opponentId: blackId,
          color: pairing.isBye ? '-' : 'W',
          result: pairing.result,
          pointsEarned: pts,
          cumulativeScore: newTotal,
        });
      }

      if (blackId && playerGames.has(blackId)) {
        const isWhite = false;
        const pts = getPlayerScoreFromResult(pairing.result, isWhite);
        const prev = currentRunningPoints.get(blackId) || 0;
        const newTotal = prev + pts;
        currentRunningPoints.set(blackId, newTotal);

        playerGames.get(blackId)!.push({
          playerId: blackId,
          opponentId: whiteId,
          color: 'B',
          result: pairing.result,
          pointsEarned: pts,
          cumulativeScore: newTotal,
        });
      }
    });
  });

  // Calculate base total points for every player
  const playerTotalPoints = new Map<string, number>();
  players.forEach((p) => {
    const games = playerGames.get(p.id) || [];
    const total = games.reduce((sum, g) => sum + g.pointsEarned, 0);
    playerTotalPoints.set(p.id, total);
  });

  // 2. Compute FIDE Tie-Breaks:
  // - Buchholz (sum of opponents' final points)
  // - Buchholz Cut 1 (Buchholz minus lowest opponent point)
  // - Sonneborn-Berger (sum of scores of defeated opponents + 0.5 * drawn)
  // - Progressive Score (sum of cumulative score after each round)
  // - Total Wins & Black games
  const standingsRows: PlayerStandingsRow[] = players.map((p) => {
    const games = playerGames.get(p.id) || [];
    const points = playerTotalPoints.get(p.id) || 0;

    const opponentScores: number[] = [];
    let sonnebornBerger = 0;
    let wins = 0;
    let blackGames = 0;
    let whiteGames = 0;
    const colorHistoryArr: string[] = [];
    const opponentsList: string[] = [];
    const resultsList: GameResult[] = [];

    games.forEach((g) => {
      resultsList.push(g.result);
      if (g.color === 'W') {
        whiteGames++;
        colorHistoryArr.push('W');
      } else if (g.color === 'B') {
        blackGames++;
        colorHistoryArr.push('B');
      } else {
        colorHistoryArr.push('-');
      }

      if (g.opponentId) {
        opponentsList.push(g.opponentId);
        const oppScore = playerTotalPoints.get(g.opponentId) ?? 0;
        opponentScores.push(oppScore);

        const isWhite = g.color === 'W';
        if (isWin(g.result, isWhite)) {
          wins++;
          sonnebornBerger += oppScore;
        } else if (isDraw(g.result)) {
          sonnebornBerger += oppScore * 0.5;
        }
      } else {
        // Full point or half point bye
        if (g.result === '1-0B') {
          wins++;
          // In FIDE F-System, unplayed games receive virtual opponent points (or half-credit for SB)
          sonnebornBerger += points * 0.5;
        }
      }
    });

    // Buchholz
    const buchholz = opponentScores.reduce((sum, s) => sum + s, 0);

    // Buchholz Cut-1
    let buchholzCut1 = buchholz;
    if (opponentScores.length > 0) {
      const minOppScore = Math.min(...opponentScores);
      buchholzCut1 = Math.max(0, buchholz - minOppScore);
    }

    // Progressive score: sum of cumulative points after each round
    const progressiveScore = games.reduce((acc, g) => acc + g.cumulativeScore, 0);

    return {
      rank: 1,
      player: p,
      points,
      buchholz,
      buchholzCut1,
      sonnebornBerger,
      directEncounter: 0, // Computed in second pass for tied clusters
      progressiveScore,
      wins,
      blackGames,
      colorBalance: whiteGames - blackGames,
      colorHistoryString: colorHistoryArr.join(' '),
      opponentsList,
      resultsList,
    };
  });

  // 3. Compute Direct Encounter (Head-to-head) for tied score groups
  // Cluster players by primary points
  const pointsMap = new Map<number, PlayerStandingsRow[]>();
  standingsRows.forEach((row) => {
    const list = pointsMap.get(row.points) || [];
    list.push(row);
    pointsMap.set(row.points, list);
  });

  pointsMap.forEach((tiedGroup) => {
    if (tiedGroup.length > 1) {
      const tiedPlayerIds = new Set(tiedGroup.map((r) => r.player.id));

      tiedGroup.forEach((row) => {
        let dePoints = 0;
        const games = playerGames.get(row.player.id) || [];
        games.forEach((g) => {
          if (g.opponentId && tiedPlayerIds.has(g.opponentId)) {
            const isWhite = g.color === 'W';
            dePoints += getPlayerScoreFromResult(g.result, isWhite);
          }
        });
        row.directEncounter = dePoints;
      });
    }
  });

  // 4. Sort according to FIDE Standard Tie-break hierarchy:
  // 1. Total Points (descending)
  // 2. Direct Encounter (if applicable)
  // 3. Buchholz Cut 1
  // 4. Buchholz
  // 5. Sonneborn-Berger
  // 6. Progressive Score
  // 7. Most Wins
  // 8. Greater number of games with Black
  // 9. Initial Seed / Rating
  standingsRows.sort((a, b) => {
    if (Math.abs(b.points - a.points) > 0.001) {
      return b.points - a.points;
    }
    // Direct encounter
    if (Math.abs(b.directEncounter - a.directEncounter) > 0.001) {
      return b.directEncounter - a.directEncounter;
    }
    // Buchholz Cut 1
    if (Math.abs(b.buchholzCut1 - a.buchholzCut1) > 0.001) {
      return b.buchholzCut1 - a.buchholzCut1;
    }
    // Buchholz
    if (Math.abs(b.buchholz - a.buchholz) > 0.001) {
      return b.buchholz - a.buchholz;
    }
    // Sonneborn-Berger
    if (Math.abs(b.sonnebornBerger - a.sonnebornBerger) > 0.001) {
      return b.sonnebornBerger - a.sonnebornBerger;
    }
    // Progressive Score
    if (Math.abs(b.progressiveScore - a.progressiveScore) > 0.001) {
      return b.progressiveScore - a.progressiveScore;
    }
    // Total Wins
    if (b.wins !== a.wins) {
      return b.wins - a.wins;
    }
    // Black games
    if (b.blackGames !== a.blackGames) {
      return b.blackGames - a.blackGames;
    }
    // Rating / Seed
    return b.player.rating - a.player.rating;
  });

  // Assign ranks (handle exact ties)
  standingsRows.forEach((row, idx) => {
    row.rank = idx + 1;
  });

  return standingsRows;
}
