import type { CSSProperties } from "react";
import type { Player, Size } from "../game/types";

export type PieceVariant = "top" | "rim" | "ghost" | "mini" | "orb";

interface PieceViewProps {
  owner: Player;
  size: Size;
  variant?: PieceVariant;
  className?: string;
  style?: CSSProperties;
}

export function PieceView({ owner, size, variant = "top", className = "", style }: PieceViewProps) {
  const classes = [
    "piece",
    `piece--${owner}`,
    `piece--size-${size}`,
    variant !== "top" ? `piece--${variant}` : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <span className={classes} style={style} aria-hidden="true" />;
}
