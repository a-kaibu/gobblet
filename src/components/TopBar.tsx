import { BookOpen, ChevronDown, RotateCcw, Volume2, VolumeX } from "lucide-react";
import type { Difficulty, Mode } from "../game/types";
import { LogoMark } from "./LogoMark";

interface TopBarProps {
  mode: Mode;
  level: Difficulty;
  soundOn: boolean;
  canRestart: boolean;
  onModeChange: (mode: Mode) => void;
  onLevelChange: (level: Difficulty) => void;
  onToggleSound: () => void;
  onOpenRules: () => void;
  onRestart: () => void;
}

export function TopBar({
  mode,
  level,
  soundOn,
  canRestart,
  onModeChange,
  onLevelChange,
  onToggleSound,
  onOpenRules,
  onRestart,
}: TopBarProps) {
  return (
    <header className="topbar">
      <div className="brand">
        <LogoMark />
        <div className="brand-copy">
          <h1>
            GOBBLET <span>ゴブレット</span>
          </h1>
          <p>4×4 ABSTRACT STRATEGY</p>
        </div>
      </div>

      <div className="topbar-controls">
        <div className="mode-switch" role="group" aria-label="対戦モード">
          <button
            type="button"
            className={mode === "solo" ? "is-active" : ""}
            aria-pressed={mode === "solo"}
            onClick={() => onModeChange("solo")}
          >
            ひとりで
          </button>
          <button
            type="button"
            className={mode === "duo" ? "is-active" : ""}
            aria-pressed={mode === "duo"}
            onClick={() => onModeChange("duo")}
          >
            ふたりで
          </button>
        </div>

        {mode === "solo" ? (
          <label className="level-control">
            <span>CPU</span>
            <select
              value={level}
              aria-label="CPUの強さ"
              onChange={(event) => onLevelChange(event.target.value as Difficulty)}
            >
              <option value="easy">よわい</option>
              <option value="normal">ふつう</option>
              <option value="hard">つよい</option>
            </select>
            <ChevronDown size={13} strokeWidth={2} aria-hidden="true" />
          </label>
        ) : (
          <span className="duo-hint">交互に操作</span>
        )}
      </div>

      <div className="topbar-icons">
        <button
          type="button"
          className="icon-button"
          onClick={onOpenRules}
          aria-label="遊び方"
          title="遊び方"
        >
          <BookOpen size={18} strokeWidth={1.7} />
        </button>
        <button
          type="button"
          className="icon-button"
          onClick={onToggleSound}
          aria-label={soundOn ? "サウンドをオフ" : "サウンドをオン"}
          aria-pressed={soundOn}
          title={soundOn ? "サウンドをオフ" : "サウンドをオン"}
        >
          {soundOn ? (
            <Volume2 size={18} strokeWidth={1.7} />
          ) : (
            <VolumeX size={18} strokeWidth={1.7} />
          )}
        </button>
        <button
          type="button"
          className="icon-button"
          onClick={onRestart}
          aria-label="はじめから"
          title={canRestart ? "はじめから" : "まだ手がありません"}
          disabled={!canRestart}
        >
          <RotateCcw size={17} strokeWidth={1.8} />
        </button>
      </div>
    </header>
  );
}
