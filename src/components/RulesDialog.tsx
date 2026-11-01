import { Dialog } from "./Dialog";
import { PieceView } from "./PieceView";

interface RulesDialogProps {
  open: boolean;
  onClose: () => void;
}

const steps = [
  {
    index: "01",
    title: "駒を置く",
    body: "手持ちから好きな大きさの駒を1つ選び、空きマスか、自分より小さい駒の上に置きます。",
  },
  {
    index: "02",
    title: "駒を動かす",
    body: "盤上の自分の駒を移動できます。動かせるのは、上に何も乗っていない駒だけ。動かすと下の駒が現れます。",
  },
  {
    index: "03",
    title: "4つ並べる",
    body: "見えている自分の駒を、縦・横・斜めのいずれかに4つ並べたら勝ちです。",
  },
];

export function RulesDialog({ open, onClose }: RulesDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      kicker="HOW TO PLAY"
      title="遊び方"
      className="rules-dialog"
      footer={
        <button type="button" className="button button--primary" onClick={onClose}>
          対局に戻る
        </button>
      }
    >
      <p className="dialog-lead">
        ゴブレットは、大きい駒で小さい駒を覆いながら、4×4の盤に4連を作るゲームです。
      </p>

      <div className="rule-demo" aria-hidden="true">
        <div className="rule-demo-stack">
          <PieceView owner="dark" size={4} variant="rim" />
          <PieceView owner="light" size={3} variant="rim" />
          <PieceView owner="dark" size={1} variant="top" />
        </div>
        <div className="rule-demo-copy">
          <span className="rule-demo-label">STACK</span>
          <strong>大きい駒が、小さい駒を覆う</strong>
          <p>覆われた駒は見えなくなり、動かせなくなります。上の駒を動かすと、下の駒が現れます。</p>
        </div>
      </div>

      <div className="rule-steps">
        {steps.map((step) => (
          <section className="rule-step" key={step.index}>
            <span className="rule-index">{step.index}</span>
            <div>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </div>
          </section>
        ))}
      </div>

      <div className="rule-note">
        <p>
          <strong>覆われた駒は動かせません。</strong>
          自分の駒で覆うことも、相手の駒を覆うこともできます。
        </p>
        <p>
          相手の4連を露出させてしまうと、その時点で相手の勝ちです。同じ局面が3回現れると引き分けになります。
        </p>
      </div>
    </Dialog>
  );
}
