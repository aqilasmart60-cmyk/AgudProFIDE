export interface FideRuleArticle {
  id: string;
  article: string;
  title: string;
  category: 'laws' | 'clock' | 'penalties' | 'swiss' | 'conduct';
  summary: string;
  fullRule: string;
  arbiterAction: string;
}

export const FIDE_ARTICLES_DATABASE: FideRuleArticle[] = [
  {
    id: 'art-4',
    article: 'Article 4',
    title: 'The Act of Moving the Pieces (Touch-Move)',
    category: 'laws',
    summary: 'If the player touches a piece on their turn, they must move or capture it if a legal move exists.',
    fullRule: 'Article 4.3: If the player having the move touches on the chessboard, with the intention of moving or capturing: one or more of their own pieces, they must move the first piece touched that can be moved; or one or more of the opponent’s pieces, they must capture the first piece touched that can be captured. Article 4.2 allows adjusting only if the player first expresses their intention (e.g. saying "j’adoube" or "I adjust").',
    arbiterAction: 'Confirm intention. If touched without announcing intention, compel legal move/capture with touched piece. If no legal move exists, player may make any legal move.',
  },
  {
    id: 'art-6-7',
    article: 'Article 6.7',
    title: 'Default Time & Forfeits (Late Arrival)',
    category: 'clock',
    summary: 'Any player who arrives at the chessboard after the default time loses the game.',
    fullRule: 'Article 6.7.1: The tournament regulations shall specify a default time. If the default time is zero (Zero Tolerance), any player who arrives at the board after the start of the session shall lose the game. Otherwise, the player forfeits if not present before the default time expires.',
    arbiterAction: 'Check official default time in regulations. Record forfeit as 1F-0 or 0-1F. For paired player who does not appear, award full-point win (1F) to opponent with unadjusted rating.',
  },
  {
    id: 'art-6-9',
    article: 'Article 6.9',
    title: 'Flag Fall with Insufficient Mating Material',
    category: 'clock',
    summary: 'If a player’s time expires, but opponent cannot checkmate by any series of legal moves, the game is drawn.',
    fullRule: 'Article 6.9: Except where one of Articles 5.1.1, 5.1.2, 5.2.1, 5.2.2, 5.2.3 applies, if a player does not complete the prescribed number of moves in the allotted time, the game is lost by that player. However, the game is drawn if the position is such that the opponent cannot checkmate the player’s king by any possible series of legal moves.',
    arbiterAction: 'Inspect board position upon flag fall. If opponent only has bare King, King+Knight, or King+Bishop with no pawn or helper piece that could allow self-mate, score game as 1/2-1/2.',
  },
  {
    id: 'art-7-5',
    article: 'Article 7.5',
    title: 'Illegal Moves (Standard Time Control)',
    category: 'penalties',
    summary: 'First completed illegal move gives +2 minutes to opponent. Second completed illegal move loses the game.',
    fullRule: 'Article 7.5.5: If the arbiter observes an illegal move, or a player stops the clock and claims an illegal move before making their reply: for the first completed illegal move by that player, the arbiter shall give two minutes extra time to the opponent; for a second completed illegal move by the same player, the arbiter shall declare the game lost by this player (provided opponent can checkmate by legal moves).',
    arbiterAction: 'Restore position prior to the illegal move. In Standard: add 2 minutes to opponent clock. In Blitz: add 1 minute. On 2nd illegal move: declare game forfeit.',
  },
  {
    id: 'art-9-2',
    article: 'Article 9.2',
    title: 'Threefold Repetition of Position',
    category: 'laws',
    summary: 'Game is drawn upon a correct claim if the identical position is about to appear or has appeared 3 times.',
    fullRule: 'Article 9.2: The game is drawn, upon a correct claim by a player having the move, when the same position for at least the third time (not necessarily by repetition of moves) is about to appear (player writes move on scoresheet without executing on board) or has just appeared. Positions are identical only if the same player has the move, pieces of same type occupy same squares, and rights to castle/en-passant are identical.',
    arbiterAction: 'Stop clocks. Player must write proposed move on scoresheet and claim before playing. Verify on demonstration board or scoresheet. If correct, declare draw. If incorrect, add 2 minutes to opponent and resume.',
  },
  {
    id: 'art-9-3',
    article: 'Article 9.3',
    title: '50-Move Rule Claim',
    category: 'laws',
    summary: 'Game is drawn if 50 consecutive moves have been made by each player without any pawn move or piece capture.',
    fullRule: 'Article 9.3: The game is drawn upon a correct claim if the player writes the move on their scoresheet which will result in 50 moves without capture or pawn advance, or if the last 50 consecutive moves were completed without pawn advance or capture.',
    arbiterAction: 'Check scoresheets. If 75 moves elapse without capture or pawn move, Article 9.6 mandates arbiter declare draw immediately without need for player claim.',
  },
  {
    id: 'art-11-3',
    article: 'Article 11.3',
    title: 'Electronic Devices & Mobile Phones',
    category: 'conduct',
    summary: 'Carrying electronic communication devices in playing venue is strictly prohibited without Arbiter permission.',
    fullRule: 'Article 11.3.2.1: During a game, a player is forbidden to have any electronic device not specifically approved by the arbiter in the playing venue. If it is evident that a player brought such a device, they shall lose the game. The opponent shall win.',
    arbiterAction: 'If a phone sounds or device is discovered on the player during play, immediately declare the game lost for that player (0-1 or 1-0 forfeit). Log in Arbiter incident report.',
  },
  {
    id: 'swiss-c04',
    article: 'FIDE C.04.1',
    title: 'Swiss System Pairing Regulations (Dutch System)',
    category: 'swiss',
    summary: 'Governs score brackets, no-rematch constraints, color allocations, and down-floating.',
    fullRule: 'Two players shall not play against each other more than once. No player shall receive a color difference greater than 2 (|W-B| <= 2). No player shall be given the same color 3 times in succession. An odd player in a score bracket floats down to the next bracket. A bye of 1 point is awarded to the lowest-ranked player with no previous bye.',
    arbiterAction: 'Enforce absolute criteria before relative criteria. Never allow rematches or 3-consecutive color streaks. Color balance should be kept as close to 0 as possible.',
  },
];

export interface ScenarioQuestion {
  title: string;
  scenario: string;
  question: string;
  defaultRuling: string;
}

export const PRESET_ARBITER_SCENARIOS: ScenarioQuestion[] = [
  {
    title: 'Illegal King Move in Blitz',
    scenario: 'In a FIDE rated Blitz tournament (3m+2s), White moves their King into check and presses the clock. Black notices, stops the clock, and summons the Arbiter.',
    question: 'What is the correct ruling under FIDE Appendix B (Blitz)?',
    defaultRuling: 'Under FIDE Blitz rules (Appendix B.3), an illegal move is completed once the player presses the clock. If the opponent stops the clock and claims before making a move, the Arbiter restores the position, awards Black 1 minute of extra time (in Blitz, 1 min vs 2 min in Standard), and White must make a legal move with the King if possible. If this was White’s second illegal move in the game, White loses the game provided Black has legal mating material.',
  },
  {
    title: 'Flag Fall with Lone King vs King + Bishop',
    scenario: 'White flags (clock reaches 0:00). White has Queen and King. Black has only a King and a Bishop.',
    question: 'Is White declared to have lost, or is the game drawn?',
    defaultRuling: 'The game is a DRAW (1/2-1/2) under FIDE Article 6.9. Although White ran out of time, Black does not have sufficient mating material because it is impossible to checkmate a lone King with only a King and a Bishop by any possible series of legal moves.',
  },
  {
    title: 'Mobile Phone Ringing in Bag',
    scenario: 'During Round 3, a mobile phone starts vibrating audibly inside Black’s backpack hanging on their chair.',
    question: 'How should the Chief Arbiter penalize Black?',
    defaultRuling: 'Under FIDE Article 11.3.2.1, carrying or having an active electronic device in the playing venue without Arbiter approval results in immediate loss of the game (1-0 for White). If the tournament regulations specifically permit storing completely switched-off devices in designated bags, and it merely alarm/vibrated, Article 11.3 specifies game forfeiture unless local regulations provide an explicit exception. Chief Arbiter records 1-0 for White and logs the incident.',
  },
  {
    title: 'Touching a Rook but Moving a Queen',
    scenario: 'White clearly touches their Rook on a1, releases it, and then picks up their Queen and makes a move. Black immediately objects before White presses the clock.',
    question: 'What must the Arbiter enforce under Article 4 (Touch-Move)?',
    defaultRuling: 'Under FIDE Article 4.3.1, White touched their Rook first with intention to move. Because White did not say "j’adoube" beforehand, White is strictly obligated to make a legal move with that touched Rook if any legal move is available. White cannot move the Queen. If the Rook has no legal moves, White is then free to move any other piece.',
  },
  {
    title: 'Half-Point Bye Request in Round 4',
    scenario: 'A player rated 2350 requests a half-point bye for Round 4 on the morning of Round 3.',
    question: 'Is a half-point bye permitted in round 4 under FIDE Swiss guidelines?',
    defaultRuling: 'Under standard FIDE tournament guidelines, half-point byes must be requested before the tournament or before Round 1, and are typically limited to Rounds 1–3 to prevent tactical rating manipulation or collusion in closing rounds. However, if the tournament regulations explicitly allow 1 half-point bye up to Round 4 before pairings are generated, the Arbiter may accept it. Otherwise, the player may take a 0-point bye (not paired, 0 points) without being removed from the tournament.',
  },
];
