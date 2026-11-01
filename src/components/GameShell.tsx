import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { chooseAiMove } from "../game/ai";
import { DIFFICULTY_LABELS, PLAYER_LABELS, PLAYER_LABELS_EN } from "../game/constants";
import { createSession, legalMoves, sessionReducer, topPiece } from "../game/engine";
import { describeMoveLong, endReasonText, playerDisplayName } from "../game/notation";
import type { Difficulty, Mode, Move, Selection, Size } from "../game/types";
import { playMoveSound, playSound } from "../lib/sound";
import { Board } from "./Board";
import { BoardTools } from "./BoardTools";
import { ConfirmDialog } from "./ConfirmDialog";
import { ReserveTray } from "./ReserveTray";
import { RulesDialog } from "./RulesDialog";
import { StatusBar } from "./StatusBar";
import { TopBar } from "./TopBar";

interface GameShellProps {
  mode: Mode;
  level: Difficulty;
  soundOn: boolean;
  onToggleSound: () => void;
  onModeChange: (mode: Mode) => void;
  onLevelChange: (level: Difficulty) => void;
}

export function GameShell({
  mode,
  level,
  soundOn,
  onToggleSound,
  onModeChange,
  onLevelChange,
}: GameShellProps) {
  const [session, dispatch] = useReducer(sessionReducer, undefined, createSession);
  const [selection, setSelection] = useState<Selection>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { game, past, moves } = session;

  const aiTurn = mode === "solo" && game.turn === "dark" && game.status === "playing";
  const humanTurn = mode === "duo" || game.turn === "light";
  const canPlay = game.status === "playing" && humanTurn;

  const legal = useMemo(() => (game.status === "playing" ? legalMoves(game) : []), [game]);

  const destinations = useMemo(() => {
    if (!selection || !canPlay) return new Set<number>();

    if (selection.kind === "reserve") {
      return new Set(
        legal
          .filter((move) => move.type === "place" && move.size === selection.size)
          .map((move) => move.to),
      );
    }

    return new Set(
      legal
        .filter((move) => move.type === "move" && move.from === selection.index)
        .map((move) => move.to),
    );
  }, [selection, canPlay, legal]);

  useEffect(() => {
    setSelection(null);
    setHovered(null);
  }, [game.moveCount, game.status, game.turn]);

  const previousMoveCount = useRef(game.moveCount);
  useEffect(() => {
    if (game.moveCount > previousMoveCount.current && game.lastMove) {
      playMoveSound(game.lastMove, soundOn);
    }
    previousMoveCount.current = game.moveCount;
  }, [game.moveCount, game.lastMove, soundOn]);

  const previousStatus = useRef(game.status);
  useEffect(() => {
    if (game.status !== previousStatus.current) {
      if (game.status === "won") playSound("win", soundOn);
      if (game.status === "draw") playSound("draw", soundOn);
    }
    previousStatus.current = game.status;
  }, [game.status, soundOn]);

  useEffect(() => {
    if (!aiTurn) return;

    const timer = window.setTimeout(() => {
      const move = chooseAiMove(game, level);
      if (move) dispatch({ type: "play", move });
    }, 540);

    return () => window.clearTimeout(timer);
  }, [aiTurn, game, level]);

  const handleReserveSelect = (size: Size) => {
    if (!canPlay || game.reserves[game.turn][size - 1] <= 0) return;
    playSound("select", soundOn);
    setSelection((current) =>
      current?.kind === "reserve" && current.size === size ? null : { kind: "reserve", size },
    );
  };

  const handleCellClick = (index: number) => {
    if (!canPlay) return;

    const top = topPiece(game.cells[index]);

    if (selection) {
      if (destinations.has(index)) {
        const move: Move =
          selection.kind === "reserve"
            ? { type: "place", size: selection.size, to: index }
            : { type: "move", from: selection.index, to: index };
        dispatch({ type: "play", move });
        setSelection(null);
        setHovered(null);
        return;
      }

      if (top && top.owner === game.turn) {
        if (selection.kind === "board" && selection.index === index) {
          setSelection(null);
        } else {
          setSelection({ kind: "board", index });
          playSound("select", soundOn);
        }
        return;
      }

      playSound("invalid", soundOn);
      return;
    }

    if (top && top.owner === game.turn) {
      setSelection({ kind: "board", index });
      playSound("select", soundOn);
    }
  };

  const handleUndo = () => {
    if (past.length === 0) return;
    dispatch({ type: "undo", vsCpu: mode === "solo" });
    setSelection(null);
    setHovered(null);
    playSound("undo", soundOn);
  };

  const handleReset = () => {
    dispatch({ type: "reset" });
    setSelection(null);
    setHovered(null);
    setConfirmOpen(false);
    playSound("select", soundOn);
  };

  const handleRestartRequest = () => {
    if (game.moveCount === 0) {
      handleReset();
      return;
    }
    setConfirmOpen(true);
  };

  const handleClearSelection = () => {
    setSelection(null);
    playSound("select", soundOn);
  };

  const selectedReserveSize = selection?.kind === "reserve" ? selection.size : null;

  const trayProps = (player: "light" | "dark") => ({
    player,
    name: PLAYER_LABELS[player],
    sub: PLAYER_LABELS_EN[player],
    role:
      mode === "solo"
        ? player === "light"
          ? "あなた"
          : `CPU・${DIFFICULTY_LABELS[level]}`
        : player === "light"
          ? "先手"
          : "後手",
    counts: game.reserves[player],
    active: game.status === "playing" && game.turn === player,
    interactive: canPlay && game.turn === player,
    selectedSize: game.turn === player ? selectedReserveSize : null,
    winner: game.status === "won" && game.winner === player,
    thinking: aiTurn && player === "dark",
    onSelect: handleReserveSelect,
  });

  const liveMessage = useMemo(() => {
    if (game.status === "won" && game.winner) {
      return `${playerDisplayName(game.winner, mode)}の勝ち。${endReasonText(game.endReason)}`;
    }
    if (game.status === "draw") {
      return `引き分け。${endReasonText(game.endReason)}`;
    }
    if (game.lastMove) {
      const nextTurn = aiTurn
        ? "CPUが考えています。"
        : `${playerDisplayName(game.turn, mode)}の番です。`;
      return `${describeMoveLong(game.lastMove)} ${nextTurn}`;
    }
    return `対局を開始します。${playerDisplayName(game.turn, mode)}の番です。`;
  }, [game, mode, aiTurn]);

  return (
    <div className="app-shell">
      <TopBar
        mode={mode}
        level={level}
        soundOn={soundOn}
        canRestart={game.moveCount > 0 || game.status !== "playing"}
        onModeChange={onModeChange}
        onLevelChange={onLevelChange}
        onToggleSound={onToggleSound}
        onOpenRules={() => setRulesOpen(true)}
        onRestart={handleRestartRequest}
      />

      <main className="game-stage">
        <ReserveTray {...trayProps("dark")} />

        <section className="board-column" aria-label="対局">
          <StatusBar
            game={game}
            mode={mode}
            selection={selection}
            onClearSelection={handleClearSelection}
            onRestart={handleReset}
          />
          <Board
            game={game}
            selection={selection}
            destinations={destinations}
            hovered={hovered}
            interactive={canPlay}
            onCellClick={handleCellClick}
            onHover={setHovered}
          />
          <BoardTools moves={moves} canUndo={past.length > 0} onUndo={handleUndo} />
        </section>

        <ReserveTray {...trayProps("light")} />
      </main>

      <footer className="site-footer">
        <span className="footer-brand">
          GOBBLET <span>4×4</span>
        </span>
        <span className="footer-note">大きい駒で、覆う。</span>
        <a
          className="footer-link"
          href="https://github.com/a-kaibu/gobblet"
          target="_blank"
          rel="noreferrer"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55v-2.17c-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.23-1.28-5.23-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.43-2.69 5.41-5.25 5.69.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.55A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
          </svg>
          GitHub
        </a>
      </footer>

      <RulesDialog open={rulesOpen} onClose={() => setRulesOpen(false)} />
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleReset}
      />

      <p className="sr-only" aria-live="polite">
        {liveMessage}
      </p>
    </div>
  );
}
