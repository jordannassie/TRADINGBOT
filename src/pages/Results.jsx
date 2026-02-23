const equityCurve = [120_000, 122_400, 121_800, 124_500, 123_200, 125_800, 128_100, 127_700];
const dailyPnL = [
  { label: 'Mon', value: 3600 },
  { label: 'Tue', value: -1200 },
  { label: 'Wed', value: 2400 },
  { label: 'Thu', value: 5200 },
  { label: 'Fri', value: 1800 },
];
const leaderboard = [
  { trader: 'BasketArbFund', handle: '@BasketArbFund', roi: 42.7 },
  { trader: 'MacroBuffers', handle: '@MacroBuffers', roi: 38.4 },
  { trader: 'AlphaWhale', handle: '@AlphaWhale', roi: 35.9 },
  { trader: 'FluxPulse', handle: '@FluxPulse', roi: 31.2 },
];
const openPositions = [
  {
    trader: 'MomentumMike',
    market: 'Will Brazil win the 2026 World Cup?',
    notional: '$48K',
    status: 'Watching',
  },
  {
    trader: 'CalypsoEvents',
    market: 'Will AI oversight bill pass in 2026?',
    notional: '$34K',
    status: 'Hedged',
  },
  {
    trader: 'BasketArbFund',
    market: 'Will two swing states flip party control in 2026?',
    notional: '$63K',
    status: 'Active hedge',
  },
];

const maxEquity = Math.max(...equityCurve);
const maxPnL = Math.max(...dailyPnL.map((item) => Math.abs(item.value)));

export default function Results() {
  return (
    <div className="page-stack">
      <header className="top-bar">
        <div>
          <p className="eyebrow">Results</p>
          <h1>Performance & transparency</h1>
        </div>
      </header>

      <section className="grid results-chart-grid">
        <article className="card chart-card">
          <div className="section-header">
            <div>
              <p className="eyebrow">Equity curve</p>
              <h3>Mocked trend</h3>
            </div>
            <span className="fine">Last 8 observations</span>
          </div>
          <div className="chart-sparkline" aria-label="Equity curve placeholder">
            {equityCurve.map((value, index) => (
              <span
                key={`equity-${index}`}
                style={{ height: `${(value / maxEquity) * 100}%` }}
                aria-label={`Point ${index + 1}`}
              />
            ))}
          </div>
          <p className="metric-sub">Placeholder until live mark-to-market data streams in.</p>
        </article>

        <article className="card chart-card">
          <div className="section-header">
            <div>
              <p className="eyebrow">Daily PnL</p>
              <h3>Last week</h3>
            </div>
            <span className="fine">Net delta: $9.8K</span>
          </div>
          <div className="daily-pnl" aria-label="Daily PnL placeholder">
            {dailyPnL.map((bar, index) => (
              <span
                key={`pnl-${index}`}
                className={bar.value >= 0 ? 'bar-positive' : 'bar-negative'}
                style={{ height: `${(Math.abs(bar.value) / maxPnL) * 100}%` }}
                aria-label={`${bar.label} ${bar.value} dollars`}
              />
            ))}
          </div>
          <div className="metric-sub">
            Stacked bars will be replaced with a real D3/d3-based render when feeds arrive.
          </div>
        </article>
      </section>

      <section className="grid results-secondary-grid">
        <article className="card leaderboard-card">
          <header className="section-header">
            <div>
              <p className="eyebrow">Per-trader leaderboard</p>
              <h3>Copy returns</h3>
            </div>
            <span className="fine">Sorted by ROI</span>
          </header>
          <ul className="leaderboard-list">
            {leaderboard.map((item) => (
              <li key={item.trader}>
                <div>
                  <strong>{item.trader}</strong>
                  <span className="mono">{item.handle}</span>
                </div>
                <span className="leaderboard-score">{item.roi}% ROI</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="card open-positions-card">
          <header className="section-header">
            <div>
              <p className="eyebrow">Open positions</p>
              <h3>Active bets</h3>
            </div>
            <span className="fine">Live copy tracking</span>
          </header>
          <div className="table-wrapper">
            <table className="open-positions-table">
              <thead>
                <tr>
                  <th>Trader</th>
                  <th>Market</th>
                  <th>Notional</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {openPositions.map((position) => (
                  <tr key={position.market}>
                    <td>{position.trader}</td>
                    <td>{position.market}</td>
                    <td>{position.notional}</td>
                    <td>{position.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </div>
  );
}
