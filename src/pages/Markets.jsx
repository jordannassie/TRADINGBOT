export default function Markets() {
  return (
    <div className="page-stack">
      <header className="top-bar">
        <div>
          <p className="eyebrow">Markets</p>
          <h1>Watchlist & liquidity guard</h1>
        </div>
      </header>
      <section className="card">
        <p>
          Market data integration is next in line. This page will show the markets our
          active copy traders are in, liquidity depth, outcome odds, and whether they
          pass our slippage guard. Hook up Polymarket market-data endpoints here.
        </p>
      </section>
    </div>
  );
}
