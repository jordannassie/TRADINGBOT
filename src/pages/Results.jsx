import { dailyPnL, equityCurve, leaderboard } from '../data/analyticsMocks';
import { useTradeFeed } from '../context/TradeFeedContext';

// ─── Existing derived constants (unchanged) ───────────────────────────────────
const maxPnL = Math.max(...dailyPnL.map((item) => Math.abs(item.value)));

const monthlyBreakdown = [
  { month: 'Nov', pnl: 12_300, drawdown: '-2.1%' },
  { month: 'Dec', pnl: 18_900, drawdown: '-1.5%' },
  { month: 'Jan', pnl: 22_500, drawdown: '-1.8%' },
  { month: 'Feb', pnl: 19_200, drawdown: '-2.4%' },
  { month: 'Mar', pnl: 25_800, drawdown: '-1.2%' },
];

function fmtPnl(val) {
  if (val == null || !Number.isFinite(val)) return '—';
  const sign = val >= 0 ? '+' : '';
  return `${sign}$${Math.abs(val).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export default function Results() {
  // ── Existing data wiring (unchanged) ─────────────────────────────────────────
  const { equityCurve: liveEquity, dailyPnL: liveDaily, liveFeed } = useTradeFeed();
  const equityPoints = liveEquity.length ? liveEquity : equityCurve;
  const maxEquity = Math.max(1, ...equityPoints.map((p) => Math.abs(p.value)));
  const dailyValue = liveFeed.length ? liveDaily : dailyPnL.reduce((sum, bar) => sum + bar.value, 0);
  const paperTotal = dailyPnL.reduce((s, b) => s + b.value, 0);

  return (
    <div className="page-stack g-dashboard">
      <div className="t-page-header">
        <div>
          <span className="t-eyebrow">Performance Archive</span>
          <h1 className="t-page-title">Historical charts &amp; long-term context</h1>
        </div>
      </div>

      {/* ── PnL totals: Paper vs Live ── */}
      <div className="t-results-totals">
        <div className="t-result-block">
          <span className="t-result-label">Paper Total (mock)</span>
          <span className={`t-result-val${paperTotal >= 0 ? ' g-pos' : ' g-neg'}`}>{fmtPnl(paperTotal)}</span>
          <span className="t-result-sub">14-day rolling mock</span>
        </div>
        <div className="t-result-divider" />
        <div className="t-result-block">
          <span className="t-result-label">Live Total</span>
          <span className={`t-result-val${dailyValue >= 0 ? ' g-pos' : ' g-neg'}`}>{fmtPnl(liveFeed.length ? dailyValue : null)}</span>
          <span className="t-result-sub">{liveFeed.length > 0 ? 'From live fills' : 'No live fills yet'}</span>
        </div>
      </div>

      {/* ── Two-column: Monthly table + Leaderboard ── */}
      <div className="t-two-col">
        <section className="g-section">
          <div className="g-section-header">
            <h2 className="g-section-title">Monthly Breakdown</h2>
            <span className="g-section-meta">Mock archive data</span>
          </div>
          <div className="g-table-wrap">
            <table className="g-table">
              <thead>
                <tr><th>Month</th><th>PnL</th><th>Drawdown</th><th>Mode</th></tr>
              </thead>
              <tbody>
                {monthlyBreakdown.map((entry) => (
                  <tr key={entry.month}>
                    <td className="g-bold">{entry.month}</td>
                    <td className={`g-mono${entry.pnl >= 0 ? ' g-pos' : ' g-neg'}`}>{fmtPnl(entry.pnl)}</td>
                    <td className="g-mono g-neg">{entry.drawdown}</td>
                    <td><span className="g-tag g-tag--mode">COPY · PAPER</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="g-section">
          <div className="g-section-header">
            <h2 className="g-section-title">Top ROI Performers</h2>
            <span className="g-section-meta">Archive rank</span>
          </div>
          <div className="g-table-wrap">
            <table className="g-table">
              <thead>
                <tr><th>Trader</th><th>ROI</th><th>Volatility</th></tr>
              </thead>
              <tbody>
                {leaderboard.map((item) => (
                  <tr key={item.trader}>
                    <td><span className="g-bold">{item.trader}</span> <span className="g-dim g-mono">{item.handle}</span></td>
                    <td className={`g-mono${item.roi >= 0 ? ' g-pos' : ' g-neg'}`}>{item.roi >= 0 ? '+' : ''}{item.roi}%</td>
                    <td className="g-mono g-dim">{item.volatility}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* ── Live fills table ── */}
      <section className="g-section">
        <div className="g-section-header">
          <h2 className="g-section-title">Live Fills</h2>
          <span className="g-section-meta">{liveFeed.length > 0 ? `${liveFeed.length} fills` : 'Waiting for execution'}</span>
        </div>
        {liveFeed.length > 0 ? (
          <div className="g-table-wrap">
            <table className="g-table">
              <thead>
                <tr><th>Market</th><th>Side</th><th>Price</th><th>Size</th><th>PnL</th></tr>
              </thead>
              <tbody>
                {liveFeed.map((trade) => (
                  <tr key={trade.id}>
                    <td className="g-market-cell">{trade.market}</td>
                    <td><span className={`g-side${trade.side === 'buy' ? ' g-side--buy' : ' g-side--sell'}`}>{trade.side.toUpperCase()}</span></td>
                    <td className="g-mono">{trade.price.toFixed(3)}</td>
                    <td className="g-mono">{trade.size}</td>
                    <td className={`g-mono${trade.pnl >= 0 ? ' g-pos' : ' g-neg'}`}>{trade.pnl >= 0 ? '+' : ''}{trade.pnl.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="g-empty">No fills yet. Trades will appear here once execution starts.</p>
        )}
      </section>

      {/* ── Equity sparkline (existing, kept as reference) ── */}
      <section className="g-section">
        <div className="g-section-header">
          <h2 className="g-section-title">Equity Curve</h2>
          <span className="g-section-meta">30-day history</span>
        </div>
        <div className="t-sparkline-wrap">
          <div className="chart-sparkline archive-curve">
            {equityPoints.map((point, index) => (
              <span
                key={`archive-${index}`}
                style={{ height: `${(point.value / maxEquity) * 100}%` }}
                aria-label={`Archive point ${index + 1}`}
              />
            ))}
          </div>
        </div>
        <div className="t-sparkline-meta">
          <span className="g-pnl-label">Daily PnL bars</span>
          <div className="t-pnl-bars">
            {dailyPnL.map((bar, index) => (
              <div className="t-bar-col" key={`pnl-${index}`}>
                <span
                  className={bar.value >= 0 ? 'bar-positive' : 'bar-negative'}
                  style={{ height: `${(Math.abs(bar.value) / maxPnL) * 100}%` }}
                />
                <small>{bar.label}</small>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
