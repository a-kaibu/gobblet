import { X } from "lucide-react";
import { PLAYER_LABELS, PLAYER_LABELS_EN } from "../game/constants";
import { endReasonText, playerDisplayName } from "../game/notation";
import type { Game, Mode, Selection } from "../game/types";
import { PieceView } from "./PieceView";

interface StatusBarProps {
  game: Game;
  mode: Mode;
  selection: Selection;
  onClearSelection: () => void;
  onRestart: () => void;
}

export function StatusBar({ game, mode, selection, onClearSelection, onRestart }: StatusBarProps) {
  const aiTurn = mode === "solo" && game.turn === "dark" && game.status === "playing";
  const isResult = game.status !== "playing";
  const winner = game.winner;

  let kicker = mode === "solo" ? "YOUR TURN" : `${PLAYER_LABELS_EN[game.turn]} TURN`;
  let title = mode === "solo" ? "あなたの番です" : `${PLAYER_LABELS[game.turn]}の番です`;
  let sub = "手持ちの駒か、盤上の駒を選んでください";

  if (game.status === "won" && winner) {
    kicker = "FINISHED";
    title = `${playerDisplayName(winner, mode)}の勝ち`;
    sub = endReasonText(game.endReason);
  } else if (game.status === "draw") {
    kicker = "DRAW";
    title = "引き分け";
    sub = endReasonText(game.endReason);
  } else if (aiTurn) {
    kicker = "CPU THINKING";
    title = "CPUが考えています";
    sub = "少しお待ちください";
  } else if (selection) {
    kicker = "SELECT DESTINATION";
    title = selection.kind === "reserve" ? "置き場所を選んでください" : "移動先を選んでください";
    sub = "光るマスを選ぶか、選択を解除";
  }

  const resultPlayer = game.status === "draw" ? null : (winner ?? game.turn);
  const classes = [
    "status-bar",
    isResult ? "is-result" : "",
    game.status === "won" ? "is-win" : "",
    game.status === "draw" ? "is-draw" : "",
    aiTurn ? "is-thinking" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes}>
      <div className="status-main">
        <span className="turn-orb" aria-hidden="true">
          {resultPlayer ? (
            <PieceView owner={resultPlayer} size={3} variant="orb" />
          ) : (
            <span className="turn-orb__draw" />
          )}
        </span>

        <div className="status-copy" key={`${kicker}-${title}`}>
          <span className="status-kicker">{kicker}</span>
          <strong className="status-title">{title}</strong>
          <span className="status-sub">{sub}</span>
        </div>
      </div>

      <div className="status-actions">
        {isResult ? (
          <button
            type="button"
            className="button button--primary button--small"
            onClick={onRestart}
          >
            もう一度
          </button>
        ) : (
          <>
            <span className="move-count">
              {game.moveCount === 0 ? "開始前" : `${game.moveCount}手目`}
            </span>
            {selection ? (
              <button type="button" className="text-button" onClick={onClearSelection}>
                <X size={13} strokeWidth={2.2} />
                解除
              </button>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
