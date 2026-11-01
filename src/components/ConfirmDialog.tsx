import { RotateCcw } from "lucide-react";
import { Dialog } from "./Dialog";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function ConfirmDialog({ open, onClose, onConfirm }: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      kicker="NEW GAME"
      title="はじめからにしますか？"
      className="confirm-dialog"
      footer={
        <>
          <button type="button" className="button button--ghost" onClick={onClose}>
            続ける
          </button>
          <button type="button" className="button button--danger" onClick={onConfirm}>
            <RotateCcw size={15} strokeWidth={2} />
            はじめから
          </button>
        </>
      }
    >
      <p className="dialog-lead">
        現在の棋譜は失われます。この対局を終了して、新しい盤面から始めます。
      </p>
    </Dialog>
  );
}
