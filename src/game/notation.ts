import { PLAYER_LABELS, SIZE_LABELS, cellName } from "./constants";
import type { EndReason, Mode, MoveRecord, Player } from "./types";

export function playerDisplayName(player: Player, mode: Mode): string {
  if (mode === "solo") return player === "light" ? "あなた" : "CPU";
  return PLAYER_LABELS[player];
}

export function describeMoveShort(record: MoveRecord): string {
  const player = PLAYER_LABELS[record.player];
  if (record.move.type === "place") {
    return `${player} ${SIZE_LABELS[record.size]}→${cellName(record.move.to)}`;
  }
  return `${player} ${cellName(record.move.from)}→${cellName(record.move.to)}`;
}

export function describeMoveLong(record: MoveRecord): string {
  const player = PLAYER_LABELS[record.player];
  const size = SIZE_LABELS[record.size];
  let text =
    record.move.type === "place"
      ? `${player}が${size}を${cellName(record.move.to)}に置きました。`
      : `${player}が${cellName(record.move.from)}の${size}を${cellName(record.move.to)}へ移動しました。`;

  if (record.gobbled && record.gobbledOwner) {
    const target = record.gobbledOwner === record.player ? "自分の" : "相手の";
    text += `${target}${SIZE_LABELS[record.gobbled]}を覆いました。`;
  }

  if (record.uncovered && record.uncoveredOwner) {
    const revealed = record.uncoveredOwner === record.player ? "自分" : "相手";
    text += `下から${revealed}の${SIZE_LABELS[record.uncovered]}が現れました。`;
  }

  return text;
}

export function endReasonText(reason: EndReason): string {
  switch (reason) {
    case "line":
      return "4連が完成しました";
    case "no-moves":
      return "相手に打てる手がありません";
    case "repetition":
      return "同じ局面が3回現れました";
    case "move-limit":
      return "200手に達しました";
    default:
      return "";
  }
}

export function playerRole(player: Player, first: Player = "light"): string {
  return player === first ? "先手" : "後手";
}
