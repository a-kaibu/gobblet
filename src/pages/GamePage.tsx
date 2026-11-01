import { useState } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { GameShell } from "../components/GameShell";
import type { Difficulty, Mode } from "../game/types";
import { readSoundPreference, writeSoundPreference } from "../lib/preferences";
import { playSound } from "../lib/sound";

export function GamePage() {
  const { mode, level } = useSearch({ from: "/" });
  const navigate = useNavigate();
  const [soundOn, setSoundOn] = useState(readSoundPreference);

  const updateSearch = (patch: { mode?: Mode; level?: Difficulty }) => {
    void navigate({
      to: "/",
      search: { mode, level, ...patch },
      replace: true,
    });
  };

  const handleModeChange = (next: Mode) => {
    if (next === mode) return;
    updateSearch({ mode: next });
  };

  const handleLevelChange = (next: Difficulty) => {
    if (next === level) return;
    updateSearch({ level: next });
  };

  const handleToggleSound = () => {
    setSoundOn((current) => {
      const next = !current;
      writeSoundPreference(next);
      if (next) playSound("select", true);
      return next;
    });
  };

  return (
    <GameShell
      key={mode}
      mode={mode}
      level={level}
      soundOn={soundOn}
      onToggleSound={handleToggleSound}
      onModeChange={handleModeChange}
      onLevelChange={handleLevelChange}
    />
  );
}
