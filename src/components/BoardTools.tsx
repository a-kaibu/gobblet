import { Undo2 } from "lucide-react";
import { describeMoveLong, describeMoveShort } from "../game/notation";
import type { MoveRecord } from "../game/types";

interface BoardToolsProps {
  moves: MoveRecord[];
  canUndo: boolean;
  onUndo: () => void;
}

export function BoardTools({ moves, canUndo, onUndo }: BoardToolsProps) {
  const visible = moves.slice(-4);
  const offset = moves.length - visible.length;

  return (
    <div className="board-tools">
      <button type="button" className="tool-button" onClick={onUndo} disabled={!canUndo}>
        <Undo2 size={15} strokeWidth={1.9} />
        待った
      </button>

      <div
        className="move-strip"
        aria-label={
          moves.length === 0
            ? "まだ手はありません"
            : `最近の手: ${moves
                .slice(-4)
                .map((record) => describeMoveShort(record))
                .join("、")}`
        }
      >
        {moves.length === 0 ? (
          <span className="move-strip__empty">駒を選んで、盤面へ</span>
        ) : (
          visible.map((record, index) => {
            const isLast = offset + index === moves.length - 1;
            return (
              <span
                className={`move-chip ${isLast ? "is-last" : ""}`}
                key={offset + index}
                title={describeMoveLong(record)}
              >
                <span className={`move-dot move-dot--${record.player}`} aria-hidden="true" />
                {describeMoveShort(record)}
                {record.gobbled ? (
                  <span className="move-gobble" aria-hidden="true">
                    覆
                  </span>
                ) : null}
              </span>
            );
          })
        )}
      </div>
    </div>
  );
}
