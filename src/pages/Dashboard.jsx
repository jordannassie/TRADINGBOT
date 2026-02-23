import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import { useCopyList } from '../context/CopyListContext.jsx';
import { useTradeFeed } from '../context/TradeFeedContext';
import useLeaderboard from '../hooks/useLeaderboard.js';
import { dailyPnL, equityCurve, leaderboard, openPositions } from '../data/analyticsMocks';
import { fallbackTimeline } from '../data/signalsTimeline';

const maxEquity = Math.max(...equityCurve.map((point) => point.value));
const maxPnL = Math.max(...dailyPnL.map((item) => Math.abs(item.value)));

const timelineSorter = (a, b) => new Date(b.timestamp) - new Date(a.timestamp);

const TimelineItem = ({ event }) => (
  <article className="timeline-item">
    <div className="timeline-dot" aria-hidden="true" />
    <div className="timeline-body">
      <p className="mono">{new Date(event.timestamp).toLocaleString()}</p>
      <div className="timeline-topline">
        <strong>{event.trader}</strong>
        <span className="fine">{event.market}</span>
      </div>
      <p className="timeline-action">
        <span className="tag-pill">{event.action}</span>
        <span className="timeline-reason">{event.reason}</span>
      </p>
      <div className="timeline-meta">
        <span>Position {event.positionSize || '—'}</span>
        <span>Strategy {event.strategy}</span>
      </div>
    </div>
  </article>
);

export default function Dashboard() {
  const { state } = useCopyList();
  const { status, error } = useLeaderboard();
  const { dailyPnL: liveDailyPnL, equityCurve: liveTradeEquity, liveFeed } = useTradeFeed();
  const totalActive = state.active.length;
  const totalVetted = state.vetted.length;
  const signalsLogged = state.auditLog.length;

  const timeline = useMemo(() => {
    const rawEvents = state.auditLog.length ? state.auditLog : fallbackTimeline;
    return rawEvents
      .map((event) => ({
        ...event,
        timestamp: event.timestamp,
        positionSize: event.positionSize || '—',
        strategy: event.strategy || 'General copy flow',
        action: event.action || event.type || 'Activity',
        reason: event.reason || event.detail || 'No reason provided',
        market: event.market || event.detail || 'Unknown market',
      }))
      .sort(timelineSorter)
      .slice(0, 3);
  }, [state.auditLog]);

  const netPnL = dailyPnL.reduce((sum, bar) => sum + bar.value, 0);
  const liveDailyValue = liveFeed.length ? liveDailyPnL : null;
  const effectiveDaily = liveDailyValue ?? netPnL;
  const hasLiveEquity = liveTradeEquity.length > 0;
  const equityPoints = hasLiveEquity ? liveTradeEquity : equityCurve;
  const maxEquityValue = Math.max(1, ...equityPoints.map((point) => Math.abs(point.value)));
  const killSwitchActive = state.riskControls?.killSwitchActive;
  const statusMessage =
    status === 'idle'
      ? null
      : status === 'loading'
      ? 'Loading live leaderboard...'
      : status === 'error'
      ? `Error loading leaderboard: ${error?.message || 'Unknown'}`
      : 'Live leaderboard synced';

  return (
    <div className="page-stack">
      <header className="top-bar">
        <div>
          <p className="eyebrow">Analytics hub</p>
          <h1>Polymarket trading bot · v0.1</h1>
        </div>
        <div className="status-pill">
          <span className="pulse" />
          Connected
        </div>
      </header>
      {statusMessage && <div className="status-message">{statusMessage}</div>}

      <section className="glance-strip">
        <article className="glance-card">
          <p className="metric-label">Active traders</p>
          <p className="metric-value">{totalActive}</p>
          <p className="metric-sub">Mirrored right now</p>
        </article>
        <article className="glance-card">
          <p className="metric-label">Daily PnL</p>
          <p className="metric-value">
            {effectiveDaily >= 0 ? `+${effectiveDaily.toLocaleString()}` : effectiveDaily.toLocaleString()}
          </p>
          <p className="metric-sub">Latest 14 days</p>
        </article>
        <article className="glance-card">
          <p className="metric-label">Signals logged</p>
          <p className="metric-value">{signalsLogged}</p>
          <p className="metric-sub">Audit ready</p>
        </article>
        <article className="glance-card">
          <p className="metric-label">Kill switch</p>
          <p className="metric-value">{killSwitchActive ? 'Active' : 'Standby'}</p>
          <p className="metric-sub">
            {killSwitchActive ? 'Copying paused' : 'Ready to pause'}
          </p>
        </article>
      </section>
      {killSwitchActive && (
        <div className="kill-switch-banner">
          Kill switch is active and copying is currently paused. Toggle it in Settings when you are
          ready.
        </div>
      )}

      <section className="cta-banner">
        <div>
          <p className="eyebrow">Capital plan</p>
          <h2>See our copy/arbitrage plan</h2>
        </div>
        <Link to="/strategy" className="primary-btn">
          View strategy
        </Link>
      </section>

      <section className="cta-banner">
        <div>
          <p className="eyebrow">Capital plan</p>
          <h2>See our copy/arbitrage plan</h2>
        </div>
        <Link to="/strategy" className="primary-btn">
          View strategy
        </Link>
      </section>

      <section className="grid analytics-grid">
        <article className="card chart-card">
          <div className="section-header">
            <div>
              <p className="eyebrow">Equity curve</p>
              <h3>Recent trend</h3>
            </div>
            <span className="fine">30-day mock history</span>
          </div>
          <div className="chart-sparkline" aria-label="Equity curve placeholder">
          {equityPoints.map((value, index) => (
            <span
              key={`equity-${index}`}
              style={{ height: `${(value.value / maxEquityValue) * 100}%` }}
              aria-label={`Point ${index + 1}`}
            />
          ))}
          </div>
          <p className="metric-sub">Historic mock to show slope before live tracking.</p>
        </article>

        <article className="card chart-card">
          <div className="section-header">
            <div>
              <p className="eyebrow">Daily PnL</p>
              <h3>Rolling 2 weeks</h3>
            </div>
            <span className="fine">Net delta: {netPnL.toLocaleString()} USD</span>
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
        </article>

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
                    {trade.side.toUpperCase()} · {trade.size} cards @ {trade.price.toFixed(3)}
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
          <p className="fine">Waiting for live fills to appear.</p>
        )}
      </section>

      <section className="card signals-preview">
        <header className="section-header">
          <div>
            <p className="eyebrow">Signals timeline</p>
            <h2>Recent execution log</h2>
          </div>
          <Link to="/signals" className="link-btn">
            View all ↗
          </Link>
        </header>
        <div className="timeline">
          {timeline.map((event) => (
            <TimelineItem key={event.id} event={event} />
          ))}
        </div>
      </section>

      <section className="card strategy-callout">
        <header className="section-header">
          <div>
            <p className="eyebrow">Strategy hub</p>
            <h2>Playbook + risk rules</h2>
          </div>
          <Link to="/strategy" className="link-btn">
            Visit Strategy page ↗
          </Link>
        </header>
        <p>
          Head to the Strategy tab for catalyst-specific playbooks, Nick’s notes, and the “How we
          operate” flow. Keeps the analytics surface clean while routing playbook edits to one place.
        </p>
      </section>
    </div>
  );
}
