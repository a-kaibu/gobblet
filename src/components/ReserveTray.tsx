import { SIZES, SIZE_LABELS, SIZE_LABELS_EN } from "../game/constants";
import type { Player, Size } from "../game/types";
import { PieceView } from "./PieceView";

interface ReserveTrayProps {
  player: Player;
  name: string;
  sub: string;
  role: string;
  counts: number[];
  active: boolean;
  interactive: boolean;
  selectedSize: Size | null;
  winner: boolean;
  thinking: boolean;
  onSelect: (size: Size) => void;
}

export function ReserveTray({
  player,
  name,
  sub,
  role,
  counts,
  active,
  interactive,
  selectedSize,
  winner,
  thinking,
  onSelect,
}: ReserveTrayProps) {
  const classes = [
    "tray",
    `tray--${player}`,
    active ? "is-active" : "",
    interactive ? "is-interactive" : "",
    winner ? "is-winner" : "",
    thinking ? "is-thinking" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <aside className={classes} aria-label={`${name}の手持ち`}>
      <div className="tray-head">
        <div className="tray-identity">
          <span className={`tray-swatch tray-swatch--${player}`} aria-hidden="true" />
          <span className="tray-name">{name}</span>
          <span className="tray-sub">{sub}</span>
        </div>
        <span className="tray-role">
          {thinking ? (
            <>
              考え中
              <span className="thinking-dots" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
            </>
          ) : (
            role
          )}
          {active ? <span className="turn-pip" aria-hidden="true" /> : null}
        </span>
      </div>

      <div className="tray-rows">
        {SIZES.map((size) => {
          const count = counts[size - 1];
          const selected = selectedSize === size;

          return (
            <button
              key={size}
              type="button"
              className={`tray-row ${selected ? "is-selected" : ""}`}
              aria-pressed={selected}
              aria-label={`${SIZE_LABELS[size]}、残り${count}個`}
              disabled={!interactive || count === 0}
              onClick={() => onSelect(size)}
            >
              <span className="tray-row-label">
                <span className="size-name">{SIZE_LABELS[size]}</span>
                <span className="size-en">{SIZE_LABELS_EN[size]}</span>
              </span>

              <span className="slots" aria-hidden="true">
                {[0, 1, 2].map((slot) => (
                  <span
                    className={`slot ${slot < count ? "slot--filled" : "slot--empty"}`}
                    key={slot}
                  >
                    {slot < count ? <PieceView owner={player} size={size} variant="mini" /> : null}
                  </span>
                ))}
              </span>

              <span className="tray-count" aria-hidden="true">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {winner ? (
        <span className="hanko" aria-hidden="true">
          勝
        </span>
      ) : null}
    </aside>
  );
}
