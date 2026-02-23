const equityCurve = [
  { label: 'Jan 1', value: 115_900 },
  { label: 'Jan 4', value: 116_700 },
  { label: 'Jan 7', value: 117_800 },
  { label: 'Jan 10', value: 118_200 },
  { label: 'Jan 13', value: 119_600 },
  { label: 'Jan 16', value: 118_900 },
  { label: 'Jan 19', value: 120_100 },
  { label: 'Jan 22', value: 120_800 },
  { label: 'Jan 25', value: 122_500 },
  { label: 'Jan 28', value: 121_900 },
  { label: 'Jan 31', value: 123_600 },
  { label: 'Feb 3', value: 124_200 },
  { label: 'Feb 6', value: 123_000 },
  { label: 'Feb 9', value: 125_100 },
  { label: 'Feb 12', value: 126_000 },
  { label: 'Feb 15', value: 125_500 },
  { label: 'Feb 18', value: 126_800 },
  { label: 'Feb 21', value: 127_600 },
  { label: 'Feb 24', value: 127_900 },
  { label: 'Feb 27', value: 128_600 },
  { label: 'Mar 2', value: 129_200 },
  { label: 'Mar 5', value: 129_800 },
  { label: 'Mar 8', value: 130_100 },
  { label: 'Mar 11', value: 129_700 },
  { label: 'Mar 14', value: 130_400 },
  { label: 'Mar 17', value: 131_100 },
  { label: 'Mar 20', value: 131_900 },
  { label: 'Mar 23', value: 132_400 },
  { label: 'Mar 26', value: 132_900 },
  { label: 'Mar 29', value: 133_500 },
];

const dailyPnL = [
  { label: 'Mon', value: 4200 },
  { label: 'Tue', value: -900 },
  { label: 'Wed', value: 3200 },
  { label: 'Thu', value: 5100 },
  { label: 'Fri', value: 1800 },
  { label: 'Sat', value: -700 },
  { label: 'Sun', value: 2300 },
  { label: 'Mon', value: 4100 },
  { label: 'Tue', value: -2100 },
  { label: 'Wed', value: 2600 },
  { label: 'Thu', value: 4800 },
  { label: 'Fri', value: 1500 },
  { label: 'Sat', value: -1300 },
  { label: 'Sun', value: 3400 },
];

const leaderboard = [
  {
    trader: 'BasketArbFund',
    handle: '@BasketArbFund',
    roi: 42.7,
    volatility: '6.2%',
  },
  {
    trader: 'MacroBuffers',
    handle: '@MacroBuffers',
    roi: 38.4,
    volatility: '5.5%',
  },
  {
    trader: 'AlphaWhale',
    handle: '@AlphaWhale',
    roi: 35.9,
    volatility: '4.8%',
  },
  {
    trader: 'FluxPulse',
    handle: '@FluxPulse',
    roi: 31.2,
    volatility: '6.9%',
  },
  {
    trader: 'MomentumMike',
    handle: '@MomentumMike',
    roi: 28.5,
    volatility: '10.3%',
  },
  {
    trader: 'CalypsoEvents',
    handle: '@CalypsoEvents',
    roi: 25.4,
    volatility: '8.1%',
  },
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

const maxEquity = Math.max(...equityCurve.map((point) => point.value));
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
              <div className="daily-bar" key={`pnl-${index}`}>
                <span
                  className={bar.value >= 0 ? 'bar-positive' : 'bar-negative'}
                  style={{ height: `${(Math.abs(bar.value) / maxPnL) * 100}%` }}
                  aria-label={`${bar.label} ${bar.value} dollars`}
                />
                <small>{bar.label}</small>
              </div>
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
                <span className="leaderboard-score">
                  {item.roi}% ROI
                  <small>{item.volatility} volatility</small>
                </span>
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
