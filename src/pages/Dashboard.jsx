import { Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { useCopyList } from '../context/CopyListContext.jsx';
import { useTradeFeed } from '../context/TradeFeedContext';
import useLeaderboard from '../hooks/useLeaderboard.js';
import { dailyPnL, leaderboard, openPositions } from '../data/analyticsMocks';
import { fallbackTimeline } from '../data/signalsTimeline';

// ─── Existing derived constants (unchanged) ───────────────────────────────────
const timelineSorter = (a, b) => new Date(b.timestamp) - new Date(a.timestamp);
const netMockPnL = dailyPnL.reduce((s, b) => s + b.value, 0);
const mockPaperToday = dailyPnL[dailyPnL.length - 1]?.value ?? 0;

// ─── UI-only formatters (display only, no logic changes) ─────────────────────
function fmtPnl(val) {
  if (val == null) return '—';
  const sign = val >= 0 ? '+' : '';
  return `${sign}$${Math.abs(val).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function fmtTs(ts) {
  if (!ts) return '—';
  try { return new Date(ts).toLocaleString(); } catch { return String(ts); }
}

// ─── Presentational: Sticky Header Bar ───────────────────────────────────────
function StickyHeaderBar({ strategyView, setStrategyView, execView, setExecView, killSwitchActive, leaderboardMsg }) {
  return (
    <div className="g-sticky-bar">
      <div className="g-sticky-left">
        <div className="g-toggle-group">
          <button
            className={`g-toggle-btn${strategyView === 'copy' ? ' g-toggle-active' : ''}`}
            onClick={() => setStrategyView('copy')}
          >
            Copy Trading
          </button>
          <button
            className={`g-toggle-btn${strategyView === 'arb' ? ' g-toggle-active' : ''}`}
            onClick={() => setStrategyView('arb')}
          >
            Arbitrage
          </button>
        </div>
        <div className="g-toggle-group">
          <button
            className={`g-toggle-btn${execView === 'paper' ? ' g-toggle-active' : ''}`}
            onClick={() => setExecView('paper')}
          >
            Paper
          </button>
          <button
            className={`g-toggle-btn g-toggle-live${execView === 'live' ? ' g-toggle-active-live' : ''}`}
            onClick={() => setExecView('live')}
          >
            Live
          </button>
        </div>
        <span className="g-view-label">
          {strategyView === 'copy' ? 'Copy' : 'Arb'} · {execView === 'paper' ? 'Paper' : 'Live'}
        </span>
      </div>
      <div className="g-sticky-right">
        {leaderboardMsg && (
          <span className="g-heartbeat-text">{leaderboardMsg}</span>
        )}
        <span className={`g-status-dot${killSwitchActive ? ' g-status-halted' : ' g-status-ok'}`} />
        <span className="g-status-text">
          {killSwitchActive ? 'Kill switch ON' : 'Connected'}
        </span>
      </div>
    </div>
  );
}

// ─── Presentational: PnL Summary Bar ─────────────────────────────────────────
function PnlSummaryBar({ paperToday, paper7d, liveToday, live7d }) {
  return (
    <div className="g-pnl-bar">
      <div className="g-pnl-group">
        <span className="g-pnl-label">Paper Today</span>
        <span className={`g-pnl-val${paperToday >= 0 ? ' g-pos' : ' g-neg'}`}>
          {fmtPnl(paperToday)}
        </span>
      </div>
      <div className="g-pnl-group">
        <span className="g-pnl-label">Paper 7D</span>
        <span className={`g-pnl-val${paper7d >= 0 ? ' g-pos' : ' g-neg'}`}>
          {fmtPnl(paper7d)}
        </span>
      </div>
      <div className="g-pnl-divider" />
      <div className="g-pnl-group">
        <span className="g-pnl-label g-pnl-label--dim">Live Today</span>
        <span className={`g-pnl-val g-pnl-val--sm${liveToday != null ? (liveToday >= 0 ? ' g-pos' : ' g-neg') : ' g-dim'}`}>
          {fmtPnl(liveToday)}
        </span>
      </div>
      <div className="g-pnl-group">
        <span className="g-pnl-label g-pnl-label--dim">Live 7D</span>
        <span className={`g-pnl-val g-pnl-val--sm${live7d != null ? (live7d >= 0 ? ' g-pos' : ' g-neg') : ' g-dim'}`}>
          {fmtPnl(live7d)}
        </span>
      </div>
    </div>
  );
}

// ─── Presentational: Active Positions Table ───────────────────────────────────
// Consumes existing `openPositions` from analyticsMocks — no data changes.
function PositionsTable({ positions, strategyView, execView }) {
  if (!positions || positions.length === 0) {
    return <p className="g-empty">No active positions</p>;
  }
  return (
    <div className="g-table-wrap">
      <table className="g-table">
        <thead>
          <tr>
            <th>Trader</th>
            <th>Market</th>
            <th>Notional</th>
            <th>Status</th>
            <th>Mode</th>
          </tr>
        </thead>
        <tbody>
          {positions.map((pos, i) => (
            <tr key={pos.market ?? i}>
              <td className="g-bold">{pos.trader}</td>
              <td className="g-market-cell">{pos.market}</td>
              <td className="g-mono">{pos.notional}</td>
              <td>
                <span className={`g-tag${pos.status === 'Active hedge' ? ' g-tag--active' : ' g-tag--watch'}`}>
                  {pos.status}
                </span>
              </td>
              <td>
                <span className="g-tag g-tag--mode">
                  {strategyView.toUpperCase()} · {execView.toUpperCase()}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Presentational: Closed Trades Table ─────────────────────────────────────
// Consumes existing `liveFeed` from useTradeFeed and `leaderboard` from analyticsMocks.
function TradesTable({ liveFeed, execView }) {
  if (liveFeed.length > 0) {
    return (
      <div className="g-table-wrap">
        <table className="g-table">
          <thead>
            <tr>
              <th>Market</th>
              <th>Side</th>
              <th>Price</th>
              <th>Size</th>
              <th>PnL</th>
              <th>Mode</th>
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
                  {trade.pnl >= 0 ? '+' : ''}{trade.pnl.toFixed(2)}
                </td>
                <td>
                  <span className="g-tag g-tag--mode">LIVE</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  // No live fills yet — show leaderboard reference table
  return (
    <div className="g-table-wrap">
      <table className="g-table">
        <thead>
          <tr>
            <th>Trader</th>
            <th>Handle</th>
            <th>ROI</th>
            <th>Volatility</th>
            <th>Mode</th>
          </tr>
        </thead>
        <tbody>
          {leaderboard.map((item, i) => (
            <tr key={item.trader ?? i}>
              <td className="g-bold">{item.trader}</td>
              <td className="g-mono g-dim">{item.handle}</td>
              <td className={`g-mono${item.roi >= 0 ? ' g-pos' : ' g-neg'}`}>
                {item.roi >= 0 ? '+' : ''}{item.roi}%
              </td>
              <td className="g-mono g-dim">{item.volatility}</td>
              <td>
                <span className="g-tag g-tag--mode">COPY · {execView.toUpperCase()}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="g-table-note">Showing leaderboard reference — live fills appear here once trades execute.</p>
    </div>
  );
}

// ─── Presentational: Automation Panel (collapsible) ──────────────────────────
// Reads from existing state.riskControls — no new data fetching.
function AutomationPanel({ strategyView, state, open, onToggle }) {
  const { killSwitchActive, dailyLossLimit, exposureCap } = state.riskControls ?? {};
  return (
    <div className="g-panel">
      <button className="g-panel-toggle" onClick={onToggle} aria-expanded={open}>
        <span className="g-panel-toggle-label">
          {strategyView === 'copy' ? '⚙  Trader Monitor' : '⚙  Edge Monitor'}
        </span>
        <span className={`g-chevron${open ? ' g-chevron--open' : ''}`}>▾</span>
      </button>
      {open && (
        <div className="g-panel-body">
          {strategyView === 'copy' ? (
            <div className="g-panel-grid">
              <div className="g-panel-item">
                <span className="g-panel-label">Active traders</span>
                <span className="g-panel-val">{state.active.length}</span>
              </div>
              <div className="g-panel-item">
                <span className="g-panel-label">Vetted traders</span>
                <span className="g-panel-val">{state.vetted.length}</span>
              </div>
              <div className="g-panel-item">
                <span className="g-panel-label">Kill switch</span>
                <span className={`g-panel-val${killSwitchActive ? ' g-neg' : ' g-pos'}`}>
                  {killSwitchActive ? 'Active' : 'Standby'}
                </span>
              </div>
              <div className="g-panel-item">
                <span className="g-panel-label">Daily loss limit</span>
                <span className="g-panel-val">${dailyLossLimit?.toLocaleString() ?? '—'}</span>
              </div>
              <div className="g-panel-item">
                <span className="g-panel-label">Exposure cap</span>
                <span className="g-panel-val">${exposureCap?.toLocaleString() ?? '—'}</span>
              </div>
              <div className="g-panel-item">
                <span className="g-panel-label">Signals logged</span>
                <span className="g-panel-val">{state.auditLog.length}</span>
              </div>
            </div>
          ) : (
            <div className="g-panel-grid">
              <div className="g-panel-item">
                <span className="g-panel-label">Strategy</span>
                <span className="g-panel-val">Dutch-book arb</span>
              </div>
              <div className="g-panel-item">
                <span className="g-panel-label">Markets</span>
                <span className="g-panel-val">BTC Up or Down</span>
              </div>
              <div className="g-panel-item">
                <span className="g-panel-label">Kill switch</span>
                <span className={`g-panel-val${killSwitchActive ? ' g-neg' : ' g-pos'}`}>
                  {killSwitchActive ? 'Active' : 'Standby'}
                </span>
              </div>
              <div className="g-panel-item">
                <span className="g-panel-label">Partial fill</span>
                <span className="g-panel-val">Auto-flatten</span>
              </div>
              <div className="g-panel-item">
                <span className="g-panel-label">Config source</span>
                <span className="g-panel-val">Supabase</span>
              </div>
              <div className="g-panel-item">
                <span className="g-panel-label">Execution</span>
                <span className="g-panel-val">CLOB client</span>
              </div>
            </div>
          )}
          <div className="g-panel-links">
            <Link to="/settings" className="g-link">Risk settings ↗</Link>
            <Link to="/strategy" className="g-link">Playbook ↗</Link>
            {strategyView === 'arb' && (
              <Link to="/btc" className="g-link">BTC Bot dashboard ↗</Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Presentational: Activity Log ────────────────────────────────────────────
// Consumes existing state.auditLog / fallbackTimeline — no data changes.
function ActivityLog({ timeline }) {
  if (!timeline || timeline.length === 0) {
    return <p className="g-empty">No activity logged yet.</p>;
  }
  return (
    <div className="g-activity-log">
      {timeline.map((event) => (
        <div key={event.id} className="g-activity-row">
          <span className="g-activity-ts g-mono g-dim">{fmtTs(event.timestamp)}</span>
          <span className={`g-tag${event.action === 'Copied' ? ' g-tag--active' : ' g-tag--watch'}`}>
            {event.action}
          </span>
          <span className="g-activity-trader g-bold">{event.trader}</span>
          <span className="g-activity-market g-dim">{event.market}</span>
          <span className="g-activity-reason g-dim">{event.reason}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Main Dashboard Component ─────────────────────────────────────────────────
export default function Dashboard() {
  // ── Existing hooks (unchanged) ───────────────────────────────────────────────
  const { state } = useCopyList();
  const { status, error } = useLeaderboard();
  const { dailyPnL: liveDailyPnL, equityCurve: liveTradeEquity, liveFeed } = useTradeFeed();

  // ── UI-only state (no backend changes) ───────────────────────────────────────
  const [strategyView, setStrategyView] = useState('copy');
  const [execView, setExecView] = useState('paper');
  const [automationOpen, setAutomationOpen] = useState(false);

  // ── Existing derived values (unchanged) ──────────────────────────────────────
  const killSwitchActive = state.riskControls?.killSwitchActive;

  const leaderboardMsg =
    status === 'loading' ? 'Syncing leaderboard...'
    : status === 'error' ? `Leaderboard error: ${error?.message ?? 'unknown'}`
    : status === 'success' ? 'Live leaderboard synced'
    : null;

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
      .slice(0, 10);
  }, [state.auditLog]);

  // ── PnL summary values (display only) ────────────────────────────────────────
  const paperToday = mockPaperToday;
  const paper7d = netMockPnL;
  const liveToday = liveFeed.length ? liveDailyPnL : null;
  const live7d = liveTradeEquity.length
    ? liveTradeEquity[liveTradeEquity.length - 1]?.value ?? null
    : null;

  return (
    <div className="page-stack g-dashboard">
      {/* ── A) Sticky header: strategy + execution toggles + status ── */}
      <StickyHeaderBar
        strategyView={strategyView}
        setStrategyView={setStrategyView}
        execView={execView}
        setExecView={setExecView}
        killSwitchActive={killSwitchActive}
        leaderboardMsg={leaderboardMsg}
      />

      {/* Kill switch banner (existing, unchanged) */}
      {killSwitchActive && (
        <div className="kill-switch-banner">
          Kill switch is active — copying is paused. Toggle it in Settings when you are ready.
        </div>
      )}

      {/* ── Top metrics: PnL summary bar ── */}
      <PnlSummaryBar
        paperToday={paperToday}
        paper7d={paper7d}
        liveToday={liveToday}
        live7d={live7d}
      />

      {/* ── A) Active Positions (primary, top) ── */}
      <section className="g-section">
        <div className="g-section-header">
          <h2 className="g-section-title">Active Positions</h2>
          <span className="g-section-meta">
            {strategyView === 'copy' ? 'Copy trading — monitored bets' : 'Arbitrage — open legs'}
          </span>
        </div>
        <PositionsTable
          positions={openPositions}
          strategyView={strategyView}
          execView={execView}
        />
      </section>

      {/* ── B) Closed Trades ── */}
      <section className="g-section">
        <div className="g-section-header">
          <h2 className="g-section-title">Closed Trades</h2>
          <span className="g-section-meta">
            {liveFeed.length > 0 ? `${liveFeed.length} live fills` : 'Leaderboard reference (no fills yet)'}
          </span>
          <Link to="/results" className="g-link">Full archive ↗</Link>
        </div>
        <TradesTable liveFeed={liveFeed} execView={execView} />
      </section>

      {/* ── C) Automation Panel (collapsible) ── */}
      <AutomationPanel
        strategyView={strategyView}
        state={state}
        open={automationOpen}
        onToggle={() => setAutomationOpen((v) => !v)}
      />

      {/* ── D) Activity Log ── */}
      <section className="g-section">
        <div className="g-section-header">
          <h2 className="g-section-title">Activity Log</h2>
          <Link to="/signals" className="g-link">View all signals ↗</Link>
        </div>
        <ActivityLog timeline={timeline} />
      </section>
    </div>
  );
}
