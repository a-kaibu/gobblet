import { CELL_COUNT, LINES, SIZES, other } from "./constants";
import type { Cell, Cells, Game, Move, MoveRecord, Player, Reserves, Session, Size } from "./types";

export function createEmptyCells(): Cells {
  return Array.from({ length: CELL_COUNT }, () => []);
}

export function cloneReserves(reserves: Reserves): Reserves {
  return {
    light: [...reserves.light],
    dark: [...reserves.dark],
  };
}

export function topPiece(cell: Cell): Cell[number] | null {
  return cell.length > 0 ? cell[cell.length - 1] : null;
}

export function canPlaceOn(cell: Cell, size: Size): boolean {
  const top = topPiece(cell);
  return top === null || top.size < size;
}

export function positionKey(game: Pick<Game, "cells" | "reserves" | "turn">): string {
  const board = game.cells
    .map((cell) =>
      cell.length === 0
        ? "-"
        : cell.map((piece) => `${piece.owner === "light" ? "l" : "d"}${piece.size}`).join(""),
    )
    .join("/");
  const reserves = `${game.reserves.light.join("")}-${game.reserves.dark.join("")}`;
  return `${board}|${reserves}|${game.turn === "light" ? "l" : "d"}`;
}

export function createGame(): Game {
  const game: Game = {
    cells: createEmptyCells(),
    reserves: {
      light: [3, 3, 3, 3],
      dark: [3, 3, 3, 3],
    },
    turn: "light",
    status: "playing",
    winner: null,
    winningLine: null,
    endReason: null,
    lastMove: null,
    moveCount: 0,
    positionCounts: {},
  };
  game.positionCounts[positionKey(game)] = 1;
  return game;
}

export function createSession(): Session {
  return {
    game: createGame(),
    past: [],
    moves: [],
  };
}

export function generateLegalMoves(cells: Cells, reserves: Reserves, player: Player): Move[] {
  const moves: Move[] = [];

  for (const size of SIZES) {
    if (reserves[player][size - 1] <= 0) continue;
    for (let to = 0; to < CELL_COUNT; to += 1) {
      if (canPlaceOn(cells[to], size)) {
        moves.push({ type: "place", size, to });
      }
    }
  }

  for (let from = 0; from < CELL_COUNT; from += 1) {
    const source = topPiece(cells[from]);
    if (!source || source.owner !== player) continue;
    for (let to = 0; to < CELL_COUNT; to += 1) {
      if (from === to) continue;
      if (canPlaceOn(cells[to], source.size)) {
        moves.push({ type: "move", from, to });
      }
    }
  }

  return moves;
}

export function legalMoves(game: Game, player: Player = game.turn): Move[] {
  return generateLegalMoves(game.cells, game.reserves, player);
}

export function validateMove(game: Game, move: Move): string | null {
  if (game.status !== "playing") return "対局は終了しています";

  const destination = topPiece(game.cells[move.to]);

  if (move.type === "place") {
    if (game.reserves[game.turn][move.size - 1] <= 0) {
      return "その大きさの駒は残っていません";
    }
    if (destination && destination.size >= move.size) {
      return "自分以上の大きさの駒の上には置けません";
    }
    return null;
  }

  if (move.from === move.to) return "同じマスには移動できません";

  const source = topPiece(game.cells[move.from]);
  if (!source || source.owner !== game.turn) {
    return "動かせる自分の駒を選んでください";
  }
  if (destination && destination.size >= source.size) {
    return "自分以上の大きさの駒の上には移動できません";
  }
  return null;
}

export function isLegalMove(game: Game, move: Move): boolean {
  return validateMove(game, move) === null;
}

export function findWinningLine(cells: Cells, player: Player): number[] | null {
  for (const line of LINES) {
    let complete = true;
    for (const index of line) {
      const top = topPiece(cells[index]);
      if (!top || top.owner !== player) {
        complete = false;
        break;
      }
    }
    if (complete) return line;
  }
  return null;
}

export function applyMove(game: Game, move: Move): Game {
  const error = validateMove(game, move);
  if (error) throw new Error(error);

  const player = game.turn;
  const nextTurn = other(player);
  const destinationTop = topPiece(game.cells[move.to]);
  const gobbled = destinationTop?.size ?? null;
  const gobbledOwner = destinationTop?.owner ?? null;
  const cells = game.cells.slice();
  const reserves = cloneReserves(game.reserves);
  let uncovered: Size | null = null;
  let uncoveredOwner: Player | null = null;
  let piece: Cell[number];

  if (move.type === "place") {
    piece = {
      id: game.moveCount * CELL_COUNT + move.to + 1,
      owner: player,
      size: move.size,
    };
    reserves[player][move.size - 1] -= 1;
    cells[move.to] = [...cells[move.to], piece];
  } else {
    const source = cells[move.from];
    piece = source[source.length - 1];
    cells[move.from] = source.slice(0, -1);
    cells[move.to] = [...cells[move.to], piece];
    const revealed = topPiece(cells[move.from]);
    uncovered = revealed?.size ?? null;
    uncoveredOwner = revealed?.owner ?? null;
  }

  const record: MoveRecord = {
    player,
    move,
    size: piece.size,
    gobbled,
    gobbledOwner,
    uncovered,
    uncoveredOwner,
  };

  const key = positionKey({ cells, reserves, turn: nextTurn });
  const positionCounts = {
    ...game.positionCounts,
    [key]: (game.positionCounts[key] ?? 0) + 1,
  };

  const next: Game = {
    ...game,
    cells,
    reserves,
    turn: nextTurn,
    lastMove: record,
    moveCount: game.moveCount + 1,
    positionCounts,
  };

  // The player who just moved wins ties if both lines appear at once.
  const moverLine = findWinningLine(cells, player);
  if (moverLine) {
    return {
      ...next,
      status: "won",
      winner: player,
      winningLine: moverLine,
      endReason: "line",
    };
  }

  // Moving a piece can expose the opponent's line. That is their win.
  const opponentLine = findWinningLine(cells, nextTurn);
  if (opponentLine) {
    return {
      ...next,
      status: "won",
      winner: nextTurn,
      winningLine: opponentLine,
      endReason: "line",
    };
  }

  if (generateLegalMoves(cells, reserves, nextTurn).length === 0) {
    return {
      ...next,
      status: "won",
      winner: player,
      endReason: "no-moves",
    };
  }

  if (positionCounts[key] >= 3) {
    return {
      ...next,
      status: "draw",
      endReason: "repetition",
    };
  }

  if (next.moveCount >= 200) {
    return {
      ...next,
      status: "draw",
      endReason: "move-limit",
    };
  }

  return next;
}

export type SessionAction =
  | { type: "play"; move: Move }
  | { type: "undo"; vsCpu: boolean }
  | { type: "reset" };

export function sessionReducer(session: Session, action: SessionAction): Session {
  switch (action.type) {
    case "play": {
      const game = applyMove(session.game, action.move);
      return {
        game,
        past: [...session.past, session.game],
        moves: game.lastMove ? [...session.moves, game.lastMove] : session.moves,
      };
    }
    case "undo": {
      if (session.past.length === 0) return session;

      const past = session.past.slice();
      const moves = session.moves.slice();
      let game = session.game;

      const pop = () => {
        game = past.pop()!;
        moves.pop();
      };

      pop();

      if (action.vsCpu) {
        while (game.turn !== "light" && past.length > 0) {
          pop();
        }
      }

      return { game, past, moves };
    }
    case "reset":
      return createSession();
  }
}
