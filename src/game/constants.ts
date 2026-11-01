import type { Difficulty, Player, Size } from "./types";

export const BOARD_SIZE = 4;
export const CELL_COUNT = BOARD_SIZE * BOARD_SIZE;
export const SIZES: Size[] = [1, 2, 3, 4];

export const SIZE_LABELS: Record<Size, string> = {
  1: "小",
  2: "中",
  3: "大",
  4: "特大",
};

export const SIZE_LABELS_EN: Record<Size, string> = {
  1: "SMALL",
  2: "MEDIUM",
  3: "LARGE",
  4: "XL",
};

export const PLAYER_LABELS: Record<Player, string> = {
  light: "白",
  dark: "墨",
};

export const PLAYER_LABELS_EN: Record<Player, string> = {
  light: "SHIRO",
  dark: "SUMI",
};

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: "よわい",
  normal: "ふつう",
  hard: "つよい",
};

export const LINES: number[][] = [
  [0, 1, 2, 3],
  [4, 5, 6, 7],
  [8, 9, 10, 11],
  [12, 13, 14, 15],
  [0, 4, 8, 12],
  [1, 5, 9, 13],
  [2, 6, 10, 14],
  [3, 7, 11, 15],
  [0, 5, 10, 15],
  [3, 6, 9, 12],
];

const COLUMNS = ["A", "B", "C", "D"] as const;

export function cellName(index: number): string {
  const row = Math.floor(index / BOARD_SIZE);
  const column = index % BOARD_SIZE;
  return `${COLUMNS[column]}${row + 1}`;
}

export function other(player: Player): Player {
  return player === "light" ? "dark" : "light";
}

export function isSize(value: unknown): value is Size {
  return value === 1 || value === 2 || value === 3 || value === 4;
}
