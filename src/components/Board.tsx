import type { KeyboardEvent } from "react";
import { PLAYER_LABELS, SIZE_LABELS, cellName } from "../game/constants";
import { topPiece } from "../game/engine";
import type { Cell, Game, Piece, Selection } from "../game/types";
import { PieceView } from "./PieceView";

const COLUMNS = ["A", "B", "C", "D"];
const ROWS = ["1", "2", "3", "4"];

interface BoardProps {
  game: Game;
  selection: Selection;
  destinations: Set<number>;
  hovered: number | null;
  interactive: boolean;
  onCellClick: (index: number) => void;
  onHover: (index: number | null) => void;
}

function cellLabel(
  index: number,
  cell: Cell,
  isTarget: boolean,
  isSelected: boolean,
  interactive: boolean,
): string {
  const name = cellName(index);
  const top = topPiece(cell);
  let label = `${name}、`;

  if (!top) {
    label += "空きマス";
  } else {
    label += `${PLAYER_LABELS[top.owner]}の${SIZE_LABELS[top.size]}`;
    if (cell.length > 1) label += `、下に${cell.length - 1}枚`;
  }

  if (isSelected) label += "、選択中";
  if (isTarget) {
    label += top ? "、ここに置いて覆えます" : "、ここに置けます";
  } else if (!interactive) {
    label += "、操作できません";
  }

  return label;
}

function CellStack({ cell }: { cell: Cell }) {
  const top = topPiece(cell);
  if (!top) return null;

  const rims: Piece[] = [];
  let largest = top.size;

  for (let index = cell.length - 2; index >= 0; index -= 1) {
    const piece = cell[index];
    if (piece.size > largest) {
      rims.push(piece);
      largest = piece.size;
    }
  }

  const visibleRims = rims.reverse();

  return (
    <span className="cell-stack" aria-hidden="true">
      {visibleRims.map((piece, index) => (
        <PieceView
          key={piece.id}
          owner={piece.owner}
          size={piece.size}
          variant="rim"
          style={{ zIndex: index + 1 }}
        />
      ))}
      <PieceView key={top.id} owner={top.owner} size={top.size} style={{ zIndex: 10 }} />
    </span>
  );
}

function WinningLine({ line }: { line: number[] }) {
  const start = line[0];
  const end = line[line.length - 1];
  const x1 = ((start % 4) + 0.5) * 25;
  const y1 = (Math.floor(start / 4) + 0.5) * 25;
  const x2 = ((end % 4) + 0.5) * 25;
  const y2 = (Math.floor(end / 4) + 0.5) * 25;

  return (
    <svg
      className="winning-line"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <line
        className="winning-line__glow"
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        pathLength={100}
        vectorEffect="non-scaling-stroke"
      />
      <line
        className="winning-line__stroke"
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        pathLength={100}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export function Board({
  game,
  selection,
  destinations,
  hovered,
  interactive,
  onCellClick,
  onHover,
}: BoardProps) {
  const selectedIndex = selection?.kind === "board" ? selection.index : null;
  const ghostSize =
    selection === null
      ? null
      : selection.kind === "reserve"
        ? selection.size
        : (topPiece(game.cells[selection.index])?.size ?? null);
  const lastMove = game.lastMove;
  const winningLine = game.winningLine;

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement)) return;

    const index = Number(target.dataset.index);
    if (Number.isNaN(index)) return;

    let next: number | null = null;

    switch (event.key) {
      case "ArrowUp":
        if (index >= 4) next = index - 4;
        break;
      case "ArrowDown":
        if (index < 12) next = index + 4;
        break;
      case "ArrowLeft":
        if (index % 4 > 0) next = index - 1;
        break;
      case "ArrowRight":
        if (index % 4 < 3) next = index + 1;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = 15;
        break;
      default:
        return;
    }

    if (next === null) return;
    event.preventDefault();
    event.currentTarget.querySelector<HTMLButtonElement>(`[data-index="${next}"]`)?.focus();
  };

  return (
    <div className="board-shell">
      <div className="board-frame">
        <div className="board-coord board-coord--top" aria-hidden="true">
          {COLUMNS.map((column) => (
            <span key={column}>{column}</span>
          ))}
        </div>
        <div className="board-coord board-coord--left" aria-hidden="true">
          {ROWS.map((row) => (
            <span key={row}>{row}</span>
          ))}
        </div>

        <div
          className={`board-grid ${winningLine ? "is-finished" : ""}`}
          role="group"
          aria-label="4×4の盤面"
          onKeyDown={handleKeyDown}
        >
          {game.cells.map((cell, index) => {
            const top = topPiece(cell);
            const isTarget = destinations.has(index);
            const isSelected = selectedIndex === index;
            const isLastFrom = lastMove?.move.type === "move" && lastMove.move.from === index;
            const isLastTo = lastMove?.move.to === index;
            const isWinning = winningLine?.includes(index) ?? false;

            const classes = [
              "cell",
              cell.length === 0 ? "is-empty" : "is-occupied",
              isTarget ? "is-target" : "",
              isTarget && top ? "is-gobble-target" : "",
              isSelected ? "is-selected" : "",
              isLastFrom ? "is-last-from" : "",
              isLastTo ? "is-last-to" : "",
              isWinning ? "is-winning" : "",
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <button
                key={index}
                type="button"
                className={classes}
                data-index={index}
                data-interactive={interactive}
                aria-label={cellLabel(index, cell, isTarget, isSelected, interactive)}
                aria-pressed={isSelected}
                aria-disabled={!interactive}
                onClick={() => onCellClick(index)}
                onMouseEnter={() => onHover(index)}
                onMouseLeave={() => onHover(null)}
                onFocus={() => onHover(index)}
                onBlur={() => onHover(null)}
              >
                <span className="cell-dot" aria-hidden="true" />
                <CellStack cell={cell} />
                {isTarget ? <span className="target-ring" aria-hidden="true" /> : null}
                {isTarget && ghostSize !== null && hovered === index ? (
                  <PieceView
                    owner={game.turn}
                    size={ghostSize}
                    variant="ghost"
                    className="ghost-piece"
                  />
                ) : null}
                {cell.length > 1 ? (
                  <span className="stack-depth" aria-hidden="true">
                    +{cell.length - 1}
                  </span>
                ) : null}
              </button>
            );
          })}

          {winningLine ? <WinningLine line={winningLine} /> : null}
        </div>

        <div className="board-coord board-coord--right" aria-hidden="true">
          {ROWS.map((row) => (
            <span key={row}>{row}</span>
          ))}
        </div>
        <div className="board-coord board-coord--bottom" aria-hidden="true">
          {COLUMNS.map((column) => (
            <span key={column}>{column}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
