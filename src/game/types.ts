export type Player = "light" | "dark";

export type Size = 1 | 2 | 3 | 4;

export type GameStatus = "playing" | "won" | "draw";

export type EndReason = "line" | "no-moves" | "repetition" | "move-limit" | null;

export interface Piece {
  id: number;
  owner: Player;
  size: Size;
}

export type Cell = Piece[];

export type Cells = Cell[];

export type Reserves = Record<Player, number[]>;

export type Move =
  | { type: "place"; size: Size; to: number }
  | { type: "move"; from: number; to: number };

export interface MoveRecord {
  player: Player;
  move: Move;
  size: Size;
  gobbled: Size | null;
  gobbledOwner: Player | null;
  uncovered: Size | null;
  uncoveredOwner: Player | null;
}

export interface Game {
  cells: Cell[];
  reserves: Reserves;
  turn: Player;
  status: GameStatus;
  winner: Player | null;
  winningLine: number[] | null;
  endReason: EndReason;
  lastMove: MoveRecord | null;
  moveCount: number;
  positionCounts: Record<string, number>;
}

export interface Session {
  game: Game;
  past: Game[];
  moves: MoveRecord[];
}

export type Difficulty = "easy" | "normal" | "hard";

export type Mode = "solo" | "duo";

export type Selection = { kind: "reserve"; size: Size } | { kind: "board"; index: number } | null;
