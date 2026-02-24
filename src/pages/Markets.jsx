export default function Markets() {
  return (
    <div className="page-stack g-dashboard">
      <div className="t-page-header">
        <div>
          <span className="t-eyebrow">Markets</span>
          <h1 className="t-page-title">Watchlist &amp; liquidity guard</h1>
        </div>
      </div>

      <section className="g-section">
        <div className="g-section-header">
          <h2 className="g-section-title">Market Watchlist</h2>
          <span className="g-section-meta">Integration pending</span>
        </div>
        <div className="g-table-wrap">
          <table className="g-table">
            <thead>
              <tr>
                <th>Market</th>
                <th>Type</th>
                <th>Odds (Yes)</th>
                <th>Liquidity</th>
                <th>Slippage</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={6} className="g-empty">
                  Market data integration is next in line. This page will show markets our active copy traders
                  are in, liquidity depth, outcome odds, and whether they pass our slippage guard.
                  Hook up Polymarket market-data endpoints here.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
