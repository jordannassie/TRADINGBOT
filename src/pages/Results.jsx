import {
  dailyPnL,
  equityCurve,
  leaderboard,
} from '../data/analyticsMocks';
import { useTradeFeed } from '../context/TradeFeedContext';

const maxPnL = Math.max(...dailyPnL.map((item) => Math.abs(item.value)));

const monthlyBreakdown = [
  { month: 'Nov', pnl: 12_300, drawdown: '-2.1%' },
  { month: 'Dec', pnl: 18_900, drawdown: '-1.5%' },
  { month: 'Jan', pnl: 22_500, drawdown: '-1.8%' },
  { month: 'Feb', pnl: 19_200, drawdown: '-2.4%' },
  { month: 'Mar', pnl: 25_800, drawdown: '-1.2%' },
];

export default function Results() {
  const { equityCurve: liveEquity, dailyPnL: liveDaily, liveFeed } = useTradeFeed();
  const equityPoints = liveEquity.length ? liveEquity : equityCurve;
  const maxEquity = Math.max(1, ...equityPoints.map((point) => Math.abs(point.value)));
  const dailyValue = liveFeed.length ? liveDaily : dailyPnL.reduce((sum, bar) => sum + bar.value, 0);
  return (
    <div className="page-stack">
      <header className="top-bar">
        <div>
          <p className="eyebrow">Performance Archive</p>
          <h1>Historical charts & long-term context</h1>
        </div>
      </header>

      <section className="card archive-hero">
        <div className="section-header">
          <div>
            <p className="eyebrow">Equity backbone</p>
            <h2>30-day history</h2>
          </div>
          <span className="fine">Mocked once for trends</span>
        </div>
        <div className="chart-sparkline archive-curve">
          {equityPoints.map((point, index) => (
            <span
              key={`archive-${index}`}
              style={{ height: `${(point.value / maxEquity) * 100}%` }}
              aria-label={`Archive point ${index + 1}`}
            />
          ))}
        </div>
        <p className="metric-sub">
          Watch how the copy engine drifted upward through macro catalysts and time-decay scalps.
        </p>
      </section>

      <section className="card archive-chart">
        <header className="section-header">
          <div>
            <p className="eyebrow">Daily PnL bars</p>
            <h2>Rolling 2-week view</h2>
          </div>
          <span className="fine">Live net: {dailyValue >= 0 ? `+${dailyValue}` : dailyValue} USD</span>
        </header>
          <div className="daily-pnl archive-bars" aria-label="Archive daily PnL">
          {dailyPnL.map((bar, index) => (
            <div className="daily-bar" key={`archive-pnl-${index}`}>
              <span
                className={bar.value >= 0 ? 'bar-positive' : 'bar-negative'}
                style={{ height: `${(Math.abs(bar.value) / maxPnL) * 100}%` }}
                aria-label={`${bar.label} ${bar.value} dollars`}
              />
              <small>{bar.label}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="card live-feed-card">
        <header className="section-header">
          <div>
            <p className="eyebrow">Live trade feed</p>
            <h2>Last 5 fills</h2>
          </div>
        </header>
        {liveFeed.length > 0 ? (
          <ul className="live-feed-list">
            {liveFeed.map((trade) => (
              <li key={trade.id}>
                <div>
                  <strong>{trade.market}</strong>
                  <span className="fine">
                    {trade.side.toUpperCase()} · {trade.size} @ {trade.price.toFixed(3)}
                  </span>
                </div>
                <span className={`live-feed-pnl ${trade.pnl >= 0 ? 'positive' : 'negative'}`}>
                  {trade.pnl >= 0 ? '+' : ''}
                  {trade.pnl.toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="fine">No fills yet. Trades will appear here once execution starts.</p>
        )}
      </section>

      <section className="grid archive-breakdown">
        <article className="card leaderboard-card">
          <header className="section-header">
            <div>
              <p className="eyebrow">Invested traders</p>
              <h3>Top ROI performers</h3>
            </div>
            <span className="fine">Archive rank</span>
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

        <article className="card archive-history">
          <header className="section-header">
            <div>
              <p className="eyebrow">Monthly archive</p>
              <h3>Long-term performance</h3>
            </div>
            <span className="fine">Drawdown & growth</span>
          </header>
          <ul className="leaderboard-list">
            {monthlyBreakdown.map((entry) => (
              <li key={entry.month}>
                <div>
                  <strong>{entry.month}</strong>
                  <span className="mono">{entry.drawdown} drawdown</span>
                </div>
                <span className="leaderboard-score">{entry.pnl.toLocaleString()} USD</span>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </div>
  );
}
