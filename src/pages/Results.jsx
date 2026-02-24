import { useTradeFeed } from '../context/TradeFeedContext';

export default function Results() {
  const { liveFeed } = useTradeFeed();

  return (
    <div className="page-stack g-dashboard">
      <div className="t-page-header">
        <div>
          <span className="t-eyebrow">Performance Archive</span>
          <h1 className="t-page-title">Historical context</h1>
        </div>
      </div>

      <section className="g-section">
        <div className="g-section-header">
          <h2 className="g-section-title">Paper Copy History</h2>
          <span className="g-section-meta">Awaiting real trades</span>
        </div>
        <p className="g-empty">
          Live paper copytrading snapshots show up here once <strong>@k9Q2mX4L8A7ZP3R</strong> trades are detected.
          Until then, monitor the Control Center for executed orders and activity.
        </p>
      </section>

      <section className="g-section">
        <div className="g-section-header">
          <h2 className="g-section-title">Live Fills</h2>
          <span className="g-section-meta">
            {liveFeed.length > 0 ? `${liveFeed.length} fills` : 'Waiting for execution'}
          </span>
        </div>
        {liveFeed.length > 0 ? (
          <div className="g-table-wrap">
            <table className="g-table">
              <thead>
                <tr>
                  <th>Market</th>
                  <th>Side</th>
                  <th>Price</th>
                  <th>Size</th>
                  <th>PnL</th>
                </tr>
              </thead>
              <tbody>
                {liveFeed.map((trade) => (
                  <tr key={trade.id}>
                    <td className="g-market-cell">{trade.market}</td>
                    <td>
                      <span className={`g-side${trade.side === 'buy' ? ' g-side--buy' : ' g-side--sell'}`}>
                        {trade.side.toUpperCase()}
                      </span>
                    </td>
                    <td className="g-mono">{trade.price.toFixed(3)}</td>
                    <td className="g-mono">{trade.size}</td>
                    <td className={`g-mono${trade.pnl >= 0 ? ' g-pos' : ' g-neg'}`}>
                      {trade.pnl >= 0 ? '+' : ''}
                      {trade.pnl.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="g-empty">No fills yet. Trades will populate after the copy engine reacts.</p>
        )}
      </section>
    </div>
  );
}
