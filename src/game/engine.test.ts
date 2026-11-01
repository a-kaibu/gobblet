import { describe, expect, it } from "vite-plus/test";
import {
  applyMove,
  createGame,
  createSession,
  findWinningLine,
  generateLegalMoves,
  isLegalMove,
  positionKey,
  sessionReducer,
  topPiece,
  validateMove,
} from "./engine";
import type { Cell, Game, Piece, Player, Size } from "./types";

function piece(owner: Player, size: Size, id = 1): Piece {
  return { id, owner, size };
}

function makeGame(overrides: Partial<Game>): Game {
  const base = createGame();
  const game = { ...base, ...overrides };
  game.positionCounts = { [positionKey(game)]: 1 };
  return game;
}

function emptyCells(): Cell[] {
  return Array.from({ length: 16 }, () => []);
}

describe("Gobblet engine", () => {
  it("starts with twelve pieces per player and an empty board", () => {
    const game = createGame();
    expect(game.turn).toBe("light");
    expect(game.status).toBe("playing");
    expect(game.cells).toHaveLength(16);
    expect(game.cells.every((cell) => cell.length === 0)).toBe(true);
    expect(game.reserves.light).toEqual([3, 3, 3, 3]);
    expect(game.reserves.dark).toEqual([3, 3, 3, 3]);
  });

  it("places a piece, spends it from the reserve, and passes the turn", () => {
    const game = createGame();
    const next = applyMove(game, { type: "place", size: 3, to: 5 });

    expect(topPiece(next.cells[5])).toMatchObject({ owner: "light", size: 3 });
    expect(next.reserves.light).toEqual([3, 3, 2, 3]);
    expect(next.turn).toBe("dark");
    expect(next.moveCount).toBe(1);
    expect(next.lastMove?.gobbled).toBeNull();
  });

  it("lets a larger piece cover a smaller piece of either color", () => {
    const game = createGame();
    const afterLight = applyMove(game, { type: "place", size: 1, to: 0 });
    const afterDark = applyMove(afterLight, { type: "place", size: 3, to: 0 });

    expect(afterDark.cells[0].map((entry) => entry.size)).toEqual([1, 3]);
    expect(topPiece(afterDark.cells[0])?.owner).toBe("dark");
    expect(afterDark.lastMove).toMatchObject({
      gobbled: 1,
      gobbledOwner: "light",
    });
    expect(afterDark.reserves.dark).toEqual([3, 3, 2, 3]);
  });

  it("rejects a piece that is not larger than the piece it would cover", () => {
    const game = makeGame({
      cells: emptyCells().map((cell, index) => (index === 0 ? [piece("dark", 3)] : cell)),
    });

    const error = validateMove(game, { type: "place", size: 3, to: 0 });
    expect(error).toBe("自分以上の大きさの駒の上には置けません");
    expect(isLegalMove(game, { type: "place", size: 3, to: 0 })).toBe(false);
    expect(isLegalMove(game, { type: "place", size: 4, to: 0 })).toBe(true);
  });

  it("moves a visible piece and leaves the square behind", () => {
    const game = makeGame({
      cells: emptyCells().map((cell, index) => (index === 0 ? [piece("light", 2)] : cell)),
      turn: "light",
    });

    const next = applyMove(game, { type: "move", from: 0, to: 2 });
    expect(next.cells[0]).toHaveLength(0);
    expect(topPiece(next.cells[2])).toMatchObject({ owner: "light", size: 2 });
    expect(next.reserves.light).toEqual([3, 3, 3, 3]);
    expect(next.turn).toBe("dark");
  });

  it("uncovers the piece below a moved piece", () => {
    const game = makeGame({
      cells: emptyCells().map((cell, index) => {
        if (index === 0) return [piece("light", 1), piece("dark", 2)];
        return cell;
      }),
      turn: "dark",
    });

    const next = applyMove(game, { type: "move", from: 0, to: 5 });
    expect(topPiece(next.cells[0])).toMatchObject({ owner: "light", size: 1 });
    expect(next.lastMove).toMatchObject({
      uncovered: 1,
      uncoveredOwner: "light",
    });
  });

  it("does not let a player move a covered piece or the opponent's piece", () => {
    const game = makeGame({
      cells: emptyCells().map((cell, index) =>
        index === 0 ? [piece("light", 1), piece("dark", 2)] : cell,
      ),
      turn: "light",
    });

    expect(validateMove(game, { type: "move", from: 0, to: 1 })).toBe(
      "動かせる自分の駒を選んでください",
    );
    expect(validateMove(game, { type: "move", from: 0, to: 1 })).not.toBeNull();
  });

  it("detects horizontal, vertical, and diagonal four-in-a-row", () => {
    const cells = emptyCells();
    for (const index of [0, 1, 2, 3]) cells[index] = [piece("light", 1)];
    expect(findWinningLine(cells, "light")).toEqual([0, 1, 2, 3]);

    const vertical = emptyCells();
    for (const index of [1, 5, 9, 13]) vertical[index] = [piece("dark", 2)];
    expect(findWinningLine(vertical, "dark")).toEqual([1, 5, 9, 13]);

    const diagonal = emptyCells();
    for (const index of [3, 6, 9, 12]) diagonal[index] = [piece("light", 4)];
    expect(findWinningLine(diagonal, "light")).toEqual([3, 6, 9, 12]);
  });

  it("wins by completing a line", () => {
    const game = makeGame({
      cells: emptyCells().map((cell, index) =>
        [0, 1, 2].includes(index) ? [piece("light", 1)] : cell,
      ),
      turn: "light",
    });

    const next = applyMove(game, { type: "place", size: 2, to: 3 });
    expect(next.status).toBe("won");
    expect(next.winner).toBe("light");
    expect(next.winningLine).toEqual([0, 1, 2, 3]);
    expect(next.endReason).toBe("line");
  });

  it("gives the win to the opponent if a move uncovers their line", () => {
    const game = makeGame({
      cells: emptyCells().map((cell, index) => {
        if (index === 0 || index === 1 || index === 2) {
          return [piece("light", 1)];
        }
        if (index === 3) return [piece("light", 4), piece("dark", 2)];
        return cell;
      }),
      turn: "dark",
    });

    const next = applyMove(game, { type: "move", from: 3, to: 7 });
    expect(next.status).toBe("won");
    expect(next.winner).toBe("light");
    expect(next.winningLine).toEqual([0, 1, 2, 3]);
  });

  it("declares a draw when the same position appears three times", () => {
    let game = makeGame({
      cells: emptyCells().map((cell, index) => {
        if (index === 0) return [piece("light", 1)];
        if (index === 5) return [piece("dark", 1)];
        return cell;
      }),
      turn: "light",
    });

    const moves = [
      { type: "move" as const, from: 0, to: 1 },
      { type: "move" as const, from: 5, to: 6 },
      { type: "move" as const, from: 1, to: 0 },
      { type: "move" as const, from: 6, to: 5 },
    ];

    for (let round = 0; round < 2; round += 1) {
      for (const move of moves) {
        game = applyMove(game, move);
      }
    }

    expect(game.status).toBe("draw");
    expect(game.endReason).toBe("repetition");
    expect(game.winner).toBeNull();
  });

  it("declares a draw after 200 moves", () => {
    const game = makeGame({ moveCount: 199 });
    const next = applyMove(game, { type: "place", size: 1, to: 0 });
    expect(next.moveCount).toBe(200);
    expect(next.status).toBe("draw");
    expect(next.endReason).toBe("move-limit");
  });

  it("awards the win when the opponent has no legal move", () => {
    const game = makeGame({
      cells: emptyCells().map((cell, index) => {
        if (index === 0) return [piece("dark", 4)];
        if (index === 1) return [piece("dark", 1)];
        return cell;
      }),
      reserves: { light: [0, 0, 0, 0], dark: [0, 0, 0, 0] },
      turn: "dark",
    });

    expect(generateLegalMoves(game.cells, game.reserves, "light")).toHaveLength(0);

    const next = applyMove(game, { type: "move", from: 0, to: 2 });
    expect(next.status).toBe("won");
    expect(next.winner).toBe("dark");
    expect(next.endReason).toBe("no-moves");
  });

  it("undoes back to the human turn in a solo game", () => {
    const session = createSession();
    const afterHuman = sessionReducer(session, {
      type: "play",
      move: { type: "place", size: 1, to: 0 },
    });
    const afterCpu = sessionReducer(afterHuman, {
      type: "play",
      move: { type: "place", size: 2, to: 5 },
    });

    const undone = sessionReducer(afterCpu, { type: "undo", vsCpu: true });
    expect(undone.game.turn).toBe("light");
    expect(undone.game.moveCount).toBe(0);
    expect(undone.past).toHaveLength(0);
    expect(undone.moves).toHaveLength(0);
  });
});
