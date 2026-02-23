export default function Settings() {
  return (
    <div className="page-stack">
      <header className="top-bar">
        <div>
          <p className="eyebrow">Settings</p>
          <h1>Risk controls & API vault</h1>
        </div>
      </header>
      <section className="card">
        <ul className="bullet-list">
          <li>Configure Polymarket API keys and proxy wallet credentials.</li>
          <li>Set bankroll percentage per trader, per-market caps, and liquidity floors.</li>
          <li>Define global kill switch + pause toggles for each trader.</li>
        </ul>
      </section>
    </div>
  );
}
