import { generateLegalMoves, findWinningLine, topPiece } from "./engine";
import { LINES, other } from "./constants";
import type { Cell, Difficulty, Game, Move, Player, Reserves } from "./types";

const WIN = 1_000_000;
const TIMEOUT = Symbol("gobblet-search-timeout");

const SIZE_VALUE = [0, 1, 2.2, 4, 6.5] as const;
const LINE_CLEAN = [0, 0.35, 3, 20] as const;
const CENTER_BONUS = [
  0, 0.1, 0.1, 0, 0.1, 0.35, 0.35, 0.1, 0.1, 0.35, 0.35, 0.1, 0, 0.1, 0.1, 0,
] as const;

interface SearchState {
  cells: Cell[];
  reserves: Reserves;
  turn: Player;
}

interface SearchContext {
  nodes: number;
  deadline: number;
  maxDepth: number;
  limit: number;
  rootLimit: number;
  previousBest: Move | null;
}

function cloneReserves(reserves: Reserves): Reserves {
  return {
    light: [...reserves.light],
    dark: [...reserves.dark],
  };
}

function toSearchState(game: Game): SearchState {
  return {
    cells: game.cells.map((cell) => cell.slice()),
    reserves: cloneReserves(game.reserves),
    turn: game.turn,
  };
}

function applySearch(state: SearchState, move: Move): SearchState {
  const cells = state.cells.slice();
  const reserves = cloneReserves(state.reserves);

  if (move.type === "place") {
    reserves[state.turn][move.size - 1] -= 1;
    cells[move.to] = [...cells[move.to], { id: 0, owner: state.turn, size: move.size }];
  } else {
    const source = cells[move.from];
    const piece = source[source.length - 1];
    cells[move.from] = source.slice(0, -1);
    cells[move.to] = [...cells[move.to], piece];
  }

  return {
    cells,
    reserves,
    turn: other(state.turn),
  };
}

function maxAvailableSize(state: SearchState, player: Player): number {
  let max = 0;
  for (let size = 4; size >= 1; size -= 1) {
    if (state.reserves[player][size - 1] > 0) {
      max = size;
      break;
    }
  }
  for (const cell of state.cells) {
    const top = topPiece(cell);
    if (top && top.owner === player && top.size > max) {
      max = top.size;
    }
  }
  return max;
}

function evaluate(state: SearchState, me: Player): number {
  const opponent = other(me);
  let score = 0;

  for (let index = 0; index < state.cells.length; index += 1) {
    const cell = state.cells[index];
    const top = topPiece(cell);
    if (!top) continue;

    const sign = top.owner === me ? 1 : -1;
    score += sign * (SIZE_VALUE[top.size] + CENTER_BONUS[index]);

    for (let depth = 0; depth < cell.length - 1; depth += 1) {
      const covered = cell[depth];
      if (covered.owner !== top.owner) {
        score += sign * SIZE_VALUE[covered.size] * 0.3;
      }
    }
  }

  for (let size = 0; size < 4; size += 1) {
    score +=
      (state.reserves[me][size] - state.reserves[opponent][size]) * SIZE_VALUE[size + 1] * 0.5;
  }

  const myMax = maxAvailableSize(state, me);
  const theirMax = maxAvailableSize(state, opponent);

  for (const line of LINES) {
    let mine = 0;
    let theirs = 0;
    let myTop = 0;
    let theirTop = 0;

    for (const index of line) {
      const top = topPiece(state.cells[index]);
      if (!top) continue;
      if (top.owner === me) {
        mine += 1;
        myTop = Math.max(myTop, top.size);
      } else {
        theirs += 1;
        theirTop = Math.max(theirTop, top.size);
      }
    }

    if (mine === 4) return WIN;
    if (theirs === 4) return -WIN;

    if (theirs === 0) {
      score += LINE_CLEAN[mine];
      if (mine === 3) score += 3;
    } else if (mine === 0) {
      score -= LINE_CLEAN[theirs];
      if (theirs === 3) score -= 4;
    } else {
      if (mine === 3 && theirs === 1) {
        score += myMax > theirTop ? 8 : 0.5;
      }
      if (theirs === 3 && mine === 1) {
        score -= theirMax > myTop ? 10 : 0.5;
      }
      if (myTop > theirTop) score += mine * 0.6;
      else if (theirTop > myTop) score -= theirs * 0.6;
    }
  }

  return score;
}

function orderMoves(state: SearchState, moves: Move[]): Move[] {
  return moves
    .map((move) => {
      let score = CENTER_BONUS[move.to] * 25;
      const destination = topPiece(state.cells[move.to]);

      if (destination) {
        score += 50 + destination.size * 10;
        if (destination.owner !== state.turn) score += 15;
      }

      if (move.type === "place") {
        score += move.size * 4;
      } else {
        const source = topPiece(state.cells[move.from]);
        if (source) score += source.size * 2;
        const below = state.cells[move.from][state.cells[move.from].length - 2];
        if (below?.owner === state.turn) score += 4;
      }

      return { move, score };
    })
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.move);
}

function negamax(
  state: SearchState,
  depth: number,
  alpha: number,
  beta: number,
  context: SearchContext,
): number {
  context.nodes += 1;
  if ((context.nodes & 255) === 0 && performance.now() > context.deadline) {
    throw TIMEOUT;
  }

  const me = state.turn;
  const opponent = other(me);
  const ply = context.maxDepth - depth;

  if (findWinningLine(state.cells, me)) return WIN - ply;
  if (findWinningLine(state.cells, opponent)) return -WIN + ply;

  if (depth <= 0) return evaluate(state, me);

  const allMoves = generateLegalMoves(state.cells, state.reserves, me);
  if (allMoves.length === 0) return -WIN + ply;

  const ordered = orderMoves(state, allMoves);
  const limit = depth >= 2 ? context.limit : ordered.length;
  const moves = ordered.length > limit ? ordered.slice(0, limit) : ordered;

  let best = -Infinity;

  for (const move of moves) {
    const next = applySearch(state, move);
    const score = -negamax(next, depth - 1, -beta, -alpha, context);
    if (score > best) best = score;
    if (best > alpha) alpha = best;
    if (alpha >= beta) break;
  }

  return best;
}

function searchRoot(
  state: SearchState,
  depth: number,
  context: SearchContext,
): { move: Move; score: number } {
  const ordered = orderMoves(state, generateLegalMoves(state.cells, state.reserves, state.turn));

  const previousBest = context.previousBest;
  if (previousBest) {
    const index = ordered.findIndex((move) => sameMove(move, previousBest));
    if (index > 0) {
      const [previous] = ordered.splice(index, 1);
      ordered.unshift(previous);
    }
  }

  const moves = ordered.length > context.rootLimit ? ordered.slice(0, context.rootLimit) : ordered;

  let bestMove = moves[0];
  let bestScore = -Infinity;
  let alpha = -Infinity;

  for (const move of moves) {
    const next = applySearch(state, move);
    const score = -negamax(next, depth - 1, -Infinity, -alpha, context);
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
    if (score > alpha) alpha = score;
  }

  return { move: bestMove, score: bestScore };
}

function sameMove(a: Move, b: Move): boolean {
  if (a.type !== b.type || a.to !== b.to) return false;
  if (a.type === "place" && b.type === "place") return a.size === b.size;
  if (a.type === "move" && b.type === "move") return a.from === b.from;
  return false;
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const result = items.slice();
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [result[index], result[swap]] = [result[swap], result[index]];
  }
  return result;
}

function chooseGreedy(state: SearchState, moves: Move[]): Move {
  let best = moves[0];
  let bestScore = -Infinity;

  for (const move of moves) {
    const next = applySearch(state, move);
    let score = evaluate(next, "dark");
    if (findWinningLine(next.cells, "light")) score -= WIN;
    if (score > bestScore) {
      bestScore = score;
      best = move;
    }
  }

  return best;
}

function chooseEasy(state: SearchState, moves: Move[], random: () => number): Move {
  const scored = moves.map((move) => {
    const next = applySearch(state, move);
    let score = evaluate(next, "dark");
    if (findWinningLine(next.cells, "light")) score -= WIN / 2;
    return { move, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, Math.min(4, scored.length));
  const index = random() < 0.35 ? Math.floor(random() * top.length) : 0;
  return top[index].move;
}

export function chooseAiMove(
  game: Game,
  difficulty: Difficulty,
  random: () => number = Math.random,
): Move | null {
  if (game.status !== "playing" || game.turn !== "dark") return null;

  const state = toSearchState(game);
  const moves = generateLegalMoves(state.cells, state.reserves, "dark");
  if (moves.length === 0) return null;

  for (const move of moves) {
    const next = applySearch(state, move);
    if (findWinningLine(next.cells, "dark")) return move;
  }

  if (difficulty === "easy") return chooseEasy(state, moves, random);

  const config =
    difficulty === "hard"
      ? { maxDepth: 4, timeMs: 900, limit: 18, rootLimit: 44 }
      : { maxDepth: 3, timeMs: 500, limit: 14, rootLimit: 64 };

  const context: SearchContext = {
    nodes: 0,
    deadline: performance.now() + config.timeMs,
    maxDepth: 1,
    limit: config.limit,
    rootLimit: config.rootLimit,
    previousBest: null,
  };

  let best = chooseGreedy(state, shuffle(moves, random));

  for (let depth = 1; depth <= config.maxDepth; depth += 1) {
    context.maxDepth = depth;
    try {
      const result = searchRoot(state, depth, context);
      best = result.move;
      context.previousBest = result.move;
      if (result.score >= WIN / 2) break;
    } catch (error) {
      if (error !== TIMEOUT) throw error;
      break;
    }

    if (performance.now() > context.deadline) break;
  }

  return best;
}
