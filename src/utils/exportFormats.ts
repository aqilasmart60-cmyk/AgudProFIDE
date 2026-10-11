import { Pairing, Player, PlayerStandingsRow, Round, Tournament } from '../types/chess';
import { generateCrossTable } from './bergerTables';

// Generate strict output format as required in prompt:
// [Board Number] | [White Player Name (Rating)] vs [Black Player Name (Rating)] | Result (if finished)
export function generatePairingsMarkdown(
  round: Round,
  players: Player[]
): string {
  const playerMap = new Map<string, Player>();
  players.forEach((p) => playerMap.set(p.id, p));

  const lines: string[] = [];
  lines.push(`### Round ${round.roundNumber} Pairings & Results`);
  lines.push('');
  lines.push('| Board | White Player (Rating) vs Black Player (Rating) | Result | Notes |');
  lines.push('| :---: | :--- | :---: | :--- |');

  round.pairings.forEach((p) => {
    const white = playerMap.get(p.whitePlayerId);
    const black = p.blackPlayerId ? playerMap.get(p.blackPlayerId) : null;

    const whiteLabel = white
      ? `${white.title && white.title !== 'None' ? `${white.title} ` : ''}${white.name} (${white.rating})`
      : 'Unknown';
    const blackLabel = black
      ? `${black.title && black.title !== 'None' ? `${black.title} ` : ''}${black.name} (${black.rating})`
      : p.isBye
      ? 'BYE'
      : 'Unassigned';

    const resultLabel = p.result === '*' ? 'Unplayed' : p.result;
    const note = p.anomalyReason || p.arbiterNote || (p.isBye ? 'Bye' : '');

    lines.push(
      `| Board ${p.boardNumber || '-'} | ${whiteLabel} vs ${blackLabel} | ${resultLabel} | ${note} |`
    );
  });

  return lines.join('\n');
}

// Generate Markdown Table of Standings
export function generateStandingsMarkdown(
  tournament: Tournament,
  standings: PlayerStandingsRow[]
): string {
  const lines: string[] = [];
  lines.push(`### ${tournament.name} - Official Standings`);
  lines.push(`*Format: ${tournament.type.toUpperCase()} | Time Control: ${tournament.timeControlDescription} | Chief Arbiter: ${tournament.chiefArbiter}*`);
  lines.push('');
  lines.push('| Rank | SNo | Name | Fed | Rtg | Pts | BH-C1 | BH | SB | DE | Prog | W | Color Balance |');
  lines.push('| :---: | :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |');

  standings.forEach((row) => {
    const title = row.player.title && row.player.title !== 'None' ? `${row.player.title} ` : '';
    const name = `${title}${row.player.name}`;
    const cb = row.colorBalance > 0 ? `+${row.colorBalance}W` : row.colorBalance < 0 ? `${row.colorBalance}B` : '0';
    lines.push(
      `| ${row.rank} | ${row.player.seed} | ${name} | ${row.player.federation} | ${row.player.rating} | **${row.points}** | ${row.buchholzCut1} | ${row.buchholz} | ${row.sonnebornBerger} | ${row.directEncounter} | ${row.progressiveScore} | ${row.wins} | ${cb} |`
    );
  });

  return lines.join('\n');
}

// Generate CSV export
export function generateStandingsCSV(standings: PlayerStandingsRow[]): string {
  const headers = ['Rank', 'Seed', 'Name', 'Title', 'Federation', 'Rating', 'Points', 'BH_Cut1', 'Buchholz', 'Sonneborn_Berger', 'Direct_Encounter', 'Progressive', 'Wins', 'Black_Games'];
  const rows = standings.map((r) => [
    r.rank,
    r.player.seed,
    `"${r.player.name}"`,
    r.player.title || '',
    r.player.federation,
    r.player.rating,
    r.points,
    r.buchholzCut1,
    r.buchholz,
    r.sonnebornBerger,
    r.directEncounter,
    r.progressiveScore,
    r.wins,
    r.blackGames,
  ]);
  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

// Generate PGN template for round results
export function generateRoundPGN(tournament: Tournament, round: Round): string {
  const playerMap = new Map<string, Player>();
  tournament.players.forEach((p) => playerMap.set(p.id, p));

  const pgnBlocks: string[] = [];

  round.pairings.forEach((p) => {
    if (p.isBye) return;
    const white = playerMap.get(p.whitePlayerId);
    const black = p.blackPlayerId ? playerMap.get(p.blackPlayerId) : null;

    let pgnResult = '*';
    if (p.result === '1-0' || p.result === '1F-0') pgnResult = '1-0';
    else if (p.result === '0-1' || p.result === '0-1F') pgnResult = '0-1';
    else if (p.result === '1/2-1/2') pgnResult = '1/2-1/2';

    const pgn = [
      `[Event "${tournament.name}"]`,
      `[Site "${tournament.city}, ${tournament.federation}"]`,
      `[Date "${tournament.startDate || '2026.10.11'}"]`,
      `[Round "${round.roundNumber}.${p.boardNumber}"]`,
      `[White "${white?.name || 'White'}"]`,
      `[Black "${black?.name || 'Black'}"]`,
      `[Result "${pgnResult}"]`,
      `[WhiteElo "${white?.rating || 0}"]`,
      `[BlackElo "${black?.rating || 0}"]`,
      `[TimeControl "${tournament.timeControlDescription}"]`,
      '',
      `${p.movesPgn || pgnResult}`,
      '',
    ].join('\n');

    pgnBlocks.push(pgn);
  });

  return pgnBlocks.join('\n');
}

// Generate FIDE TRF (Tournament Report File) official string
export function generateFideTRF(tournament: Tournament, standings: PlayerStandingsRow[]): string {
  const lines: string[] = [];
  lines.push(`012 ${tournament.name}`);
  lines.push(`022 ${tournament.city}`);
  lines.push(`032 ${tournament.federation}`);
  lines.push(`042 ${tournament.startDate}`);
  lines.push(`052 ${tournament.endDate}`);
  lines.push(`062 ${tournament.players.length}`);
  lines.push(`092 ${tournament.timeControlDescription}`);
  lines.push(`102 ${tournament.chiefArbiter}`);

  standings.forEach((s) => {
    // 001 line for players: SNo, Sex, Title, Name, FIDE Rating, FIDE Fed, FIDE ID, Points, Rank
    const title = (s.player.title || '   ').padEnd(3);
    const name = s.player.name.padEnd(33).slice(0, 33);
    const rating = String(s.player.rating).padStart(4);
    const fed = s.player.federation.padEnd(3);
    const points = String(s.points).padStart(4);
    const rank = String(s.rank).padStart(4);
    lines.push(`001  ${String(s.player.seed).padStart(4)} m ${title} ${name} ${rating} ${fed} 00000000 ${points} ${rank}`);
  });

  return lines.join('\n');
}
