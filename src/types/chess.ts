export type FideTitle = 'GM' | 'IM' | 'FM' | 'CM' | 'WGM' | 'WIM' | 'WFM' | 'WCM' | 'None';

export type GameResult = 
  | '1-0'      // White wins
  | '0-1'      // Black wins
  | '1/2-1/2'  // Draw
  | '1F-0'     // White wins by forfeit
  | '0-1F'     // Black wins by forfeit
  | '0F-0F'    // Double forfeit (0 points each)
  | '1-0B'     // Full-point Bye (1 point, no game)
  | '0.5H'     // Half-point Bye (requested)
  | '0F'       // Zero-point Bye / Unexcused absence
  | '*';       // In progress / Unplayed

export type TournamentType = 'swiss' | 'round-robin' | 'knockout';

export type TimeControlCategory = 'standard' | 'rapid' | 'blitz';

export interface Player {
  id: string;
  name: string;
  rating: number;
  title?: FideTitle;
  federation: string;
  fideId?: string;
  seed: number;
  initialRating: number;
  isActive: boolean; // false if withdrawn
  requestedByes?: number[]; // round numbers where player requested half-point bye
}

export interface ColorHistory {
  color: 'W' | 'B' | '-';
  opponentId?: string;
  roundNumber: number;
  result: GameResult;
}

export interface Pairing {
  boardNumber: number;
  whitePlayerId: string;
  blackPlayerId: string | null; // null for full-point bye
  result: GameResult;
  isBye?: boolean;
  byeType?: 'full' | 'half' | 'zero';
  isAnomaly?: boolean;
  anomalyReason?: string;
  arbiterNote?: string;
  movesPgn?: string;
}

export interface Round {
  roundNumber: number;
  isCompleted: boolean;
  isLocked: boolean;
  pairings: Pairing[];
  date?: string;
}

export interface ArbiterIncident {
  id: string;
  roundNumber: number;
  boardNumber?: number;
  playerIds: string[];
  type: 'illegal_move' | 'touch_move' | 'default_time' | 'device_violation' | 'draw_claim' | 'conduct_warning' | 'other';
  description: string;
  fideArticleCited: string;
  decision: string;
  timestamp: string;
}

export interface PlayerStandingsRow {
  rank: number;
  player: Player;
  points: number;
  buchholz: number;
  buchholzCut1: number;
  sonnebornBerger: number;
  directEncounter: number;
  progressiveScore: number;
  wins: number;
  blackGames: number;
  colorBalance: number; // White count - Black count
  colorHistoryString: string; // e.g. "W B W B W"
  opponentsList: string[]; // opponent IDs
  resultsList: GameResult[];
}

export interface Tournament {
  id: string;
  name: string;
  venue: string;
  city: string;
  federation: string;
  chiefArbiter: string;
  deputyArbiter?: string;
  startDate: string;
  endDate: string;
  type: TournamentType;
  timeControlCategory: TimeControlCategory;
  timeControlDescription: string;
  defaultTimeMinutes: number; // 0 for zero-tolerance, 15 for 15min default
  totalRounds: number;
  currentRound: number;
  players: Player[];
  rounds: Round[];
  incidents: ArbiterIncident[];
}
