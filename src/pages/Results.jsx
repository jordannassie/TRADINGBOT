export default function Results() {
  return (
    <div className="page-stack">
      <header className="top-bar">
        <div>
          <p className="eyebrow">Results</p>
          <h1>Performance & transparency</h1>
        </div>
      </header>
      <section className="grid overview">
        <article className="metric-card">
          <p className="metric-label">Equity curve</p>
          <p className="metric-value">Coming soon</p>
          <p className="metric-sub">Hook into real fills + mark-to-market</p>
        </article>
        <article className="metric-card">
          <p className="metric-label">Max drawdown</p>
          <p className="metric-value">—</p>
          <p className="metric-sub">Kill switch will display here</p>
        </article>
      </section>
      <section className="card">
        <p>
          This page will host the verified PnL, equity curve, downloadable CSV of trades,
          and a “Copy List leaderboard” showing which traders generate the highest
          return for us. Stubbed for now to unblock copy pipeline work.
        </p>
      </section>
    </div>
  );
}
