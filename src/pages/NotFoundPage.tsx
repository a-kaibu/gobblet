export function NotFoundPage() {
  return (
    <div className="app-shell not-found">
      <p className="not-found-kicker">404</p>
      <h1>ページが見つかりません</h1>
      <p>盤面に戻って、もう一度始めてください。</p>
      <a className="button button--primary" href={import.meta.env.BASE_URL}>
        対局へ戻る
      </a>
    </div>
  );
}
