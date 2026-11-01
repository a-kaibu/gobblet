import { describe, expect, it } from "vite-plus/test";
import { chooseAiMove } from "./ai";
import {
  applyMove,
  createGame,
  findWinningLine,
  generateLegalMoves,
  isLegalMove,
  positionKey,
} from "./engine";
import type { Cell, Game, Piece, Player, Size } from "./types";

function piece(owner: Player, size: Size, id = 1): Piece {
  return { id, owner, size };
}

function emptyCells(): Cell[] {
  return Array.from({ length: 16 }, () => []);
}

function makeGame(overrides: Partial<Game>): Game {
  const base = createGame();
  const game = { ...base, ...overrides };
  game.positionCounts = { [positionKey(game)]: 1 };
  return game;
}

function hasImmediateWin(game: Game, player: Player): boolean {
  const moves = generateLegalMoves(game.cells, game.reserves, player);
  for (const move of moves) {
    const next = applyMove({ ...game, turn: player, status: "playing" }, move);
    if (findWinningLine(next.cells, player)) return true;
  }
  return false;
}

describe("Gobblet AI", () => {
  it("takes an immediate winning move", () => {
    const game = makeGame({
      cells: emptyCells().map((cell, index) => (index <= 2 ? [piece("dark", 1)] : cell)),
      turn: "dark",
    });

    const move = chooseAiMove(game, "hard", () => 0.5);
    expect(move).not.toBeNull();
    expect(isLegalMove(game, move!)).toBe(true);

    const next = applyMove(game, move!);
    expect(next.winner).toBe("dark");
  });

  it("blocks the opponent's immediate win", () => {
    const game = makeGame({
      cells: emptyCells().map((cell, index) => (index <= 2 ? [piece("light", 1)] : cell)),
      turn: "dark",
    });

    const move = chooseAiMove(game, "normal", () => 0.5);
    expect(move).not.toBeNull();

    const next = applyMove(game, move!);
    expect(hasImmediateWin(next, "light")).toBe(false);
  });

  it("returns a legal move in the opening", () => {
    const game = makeGame({ turn: "dark" });
    const move = chooseAiMove(game, "normal", () => 0.5);
    expect(move).not.toBeNull();
    expect(isLegalMove(game, move!)).toBe(true);
  });

  it("does nothing when it is not the AI's turn", () => {
    const game = createGame();
    expect(chooseAiMove(game, "hard")).toBeNull();
  });
});
