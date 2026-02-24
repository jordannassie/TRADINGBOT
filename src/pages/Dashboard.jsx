import { Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { useCopyList } from '../context/CopyListContext.jsx';
import { useTradeFeed } from '../context/TradeFeedContext';
import { useUI } from '../context/UIContext.jsx';
import useLeaderboard from '../hooks/useLeaderboard.js';
import { dailyPnL, leaderboard, openPositions } from '../data/analyticsMocks';
import { fallbackTimeline } from '../data/signalsTimeline';

// ─── Existing derived constants (unchanged) ───────────────────────────────────
const timelineSorter = (a, b) => new Date(b.timestamp) - new Date(a.timestamp);
const netMockPnL = dailyPnL.reduce((s, b) => s + b.value, 0);
const mockPaperToday = dailyPnL[dailyPnL.length - 1]?.value ?? 0;

function fmtPnl(val) {
  if (val == null) return '—';
  const sign = val >= 0 ? '+' : '';
  return `${sign}$${Math.abs(val).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function fmtTs(ts) {
  if (!ts) return '—';
  try { return new Date(ts).toLocaleString(); } catch { return String(ts); }
}

// ─── PnL Summary Bar ─────────────────────────────────────────────────────────
function PnlSummaryBar({ paperToday, paper7d, liveToday, live7d }) {
  return (
    <div className="g-pnl-bar">
      <div className="g-pnl-group">
        <span className="g-pnl-label">Paper Today</span>
        <span className={`g-pnl-val${paperToday >= 0 ? ' g-pos' : ' g-neg'}`}>{fmtPnl(paperToday)}</span>
      </div>
      <div className="g-pnl-group">
        <span className="g-pnl-label">Paper 7D</span>
        <span className={`g-pnl-val${paper7d >= 0 ? ' g-pos' : ' g-neg'}`}>{fmtPnl(paper7d)}</span>
      </div>
      <div className="g-pnl-divider" />
      <div className="g-pnl-group">
        <span className="g-pnl-label g-pnl-label--dim">Live Today</span>
        <span className={`g-pnl-val g-pnl-val--sm${liveToday != null ? (liveToday >= 0 ? ' g-pos' : ' g-neg') : ' g-dim'}`}>{fmtPnl(liveToday)}</span>
      </div>
      <div className="g-pnl-group">
        <span className="g-pnl-label g-pnl-label--dim">Live 7D</span>
        <span className={`g-pnl-val g-pnl-val--sm${live7d != null ? (live7d >= 0 ? ' g-pos' : ' g-neg') : ' g-dim'}`}>{fmtPnl(live7d)}</span>
      </div>
    </div>
  );
}

// ─── Active Positions Table ───────────────────────────────────────────────────
function PositionsTable({ positions, strategyView, execView }) {
  if (!positions || positions.length === 0) return <p className="g-empty">No active positions</p>;
  return (
    <div className="g-table-wrap">
      <table className="g-table">
        <thead>
          <tr><th>Trader</th><th>Market</th><th>Notional</th><th>Status</th><th>Mode</th></tr>
        </thead>
        <tbody>
          {positions.map((pos, i) => (
            <tr key={pos.market ?? i}>
              <td className="g-bold">{pos.trader}</td>
              <td className="g-market-cell">{pos.market}</td>
              <td className="g-mono">{pos.notional}</td>
              <td><span className={`g-tag${pos.status === 'Active hedge' ? ' g-tag--active' : ' g-tag--watch'}`}>{pos.status}</span></td>
              <td><span className="g-tag g-tag--mode">{strategyView.toUpperCase()} · {execView.toUpperCase()}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Latest Trades + Activity History (two-column) ────────────────────────────
function TradesAndHistory({ liveFeed, execView, timeline }) {
  return (
    <div className="t-two-col">
      <section className="g-section">
        <div className="g-section-header">
          <h2 className="g-section-title">Latest Trades</h2>
          <span className="g-section-meta">{liveFeed.length > 0 ? `${liveFeed.length} fills` : 'Reference'}</span>
          <Link to="/results" className="g-link">Archive ↗</Link>
        </div>
        {liveFeed.length > 0 ? (
          <div className="g-table-wrap">
            <table className="g-table">
              <thead><tr><th>Market</th><th>Side</th><th>Price</th><th>Size</th><th>PnL</th></tr></thead>
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
          <div className="g-table-wrap">
            <table className="g-table">
              <thead><tr><th>Trader</th><th>ROI</th><th>Volatility</th><th>Mode</th></tr></thead>
              <tbody>
                {leaderboard.map((item, i) => (
                  <tr key={item.trader ?? i}>
                    <td><span className="g-bold">{item.trader}</span> <span className="g-dim g-mono">{item.handle}</span></td>
                    <td className={`g-mono${item.roi >= 0 ? ' g-pos' : ' g-neg'}`}>{item.roi >= 0 ? '+' : ''}{item.roi}%</td>
                    <td className="g-mono g-dim">{item.volatility}</td>
                    <td><span className="g-tag g-tag--mode">COPY · {execView.toUpperCase()}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="g-table-note">Live fills appear here once trades execute.</p>
          </div>
        )}
      </section>

      <section className="g-section">
        <div className="g-section-header">
          <h2 className="g-section-title">Activity History</h2>
          <Link to="/signals" className="g-link">All signals ↗</Link>
        </div>
        <div className="g-table-wrap">
          <table className="g-table">
            <thead><tr><th>Time</th><th>Trader</th><th>Action</th><th>Market</th></tr></thead>
            <tbody>
              {timeline.length > 0 ? timeline.map((event) => (
                <tr key={event.id}>
                  <td className="g-mono g-dim t-ts">{fmtTs(event.timestamp)}</td>
                  <td className="g-bold">{event.trader}</td>
                  <td><span className={`g-tag${event.action === 'Copied' ? ' g-tag--active' : ' g-tag--watch'}`}>{event.action}</span></td>
                  <td className="g-market-cell">{event.market}</td>
                </tr>
              )) : (
                <tr><td colSpan={4} className="g-empty">No activity logged yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

// ─── Automation Panel ────────────────────────────────────────────────────────
function AutomationPanel({ strategyView, state, open, onToggle }) {
  const { killSwitchActive, dailyLossLimit, exposureCap } = state.riskControls ?? {};
  return (
    <div className="g-panel">
      <button className="g-panel-toggle" onClick={onToggle} aria-expanded={open}>
        <span className="g-panel-toggle-label">{strategyView === 'copy' ? '⚙  Trader Monitor' : '⚙  Edge Monitor'}</span>
        <span className={`g-chevron${open ? ' g-chevron--open' : ''}`}>▾</span>
      </button>
      {open && (
        <div className="g-panel-body">
          {strategyView === 'copy' ? (
            <div className="g-panel-grid">
              <div className="g-panel-item"><span className="g-panel-label">Active traders</span><span className="g-panel-val">{state.active.length}</span></div>
              <div className="g-panel-item"><span className="g-panel-label">Vetted traders</span><span className="g-panel-val">{state.vetted.length}</span></div>
              <div className="g-panel-item"><span className="g-panel-label">Kill switch</span><span className={`g-panel-val${killSwitchActive ? ' g-neg' : ' g-pos'}`}>{killSwitchActive ? 'Active' : 'Standby'}</span></div>
              <div className="g-panel-item"><span className="g-panel-label">Daily loss limit</span><span className="g-panel-val">${dailyLossLimit?.toLocaleString() ?? '—'}</span></div>
              <div className="g-panel-item"><span className="g-panel-label">Exposure cap</span><span className="g-panel-val">${exposureCap?.toLocaleString() ?? '—'}</span></div>
              <div className="g-panel-item"><span className="g-panel-label">Signals logged</span><span className="g-panel-val">{state.auditLog.length}</span></div>
            </div>
          ) : (
            <div className="g-panel-grid">
              <div className="g-panel-item"><span className="g-panel-label">Strategy</span><span className="g-panel-val">Dutch-book arb</span></div>
              <div className="g-panel-item"><span className="g-panel-label">Markets</span><span className="g-panel-val">BTC Up or Down</span></div>
              <div className="g-panel-item"><span className="g-panel-label">Kill switch</span><span className={`g-panel-val${killSwitchActive ? ' g-neg' : ' g-pos'}`}>{killSwitchActive ? 'Active' : 'Standby'}</span></div>
              <div className="g-panel-item"><span className="g-panel-label">Partial fill</span><span className="g-panel-val">Auto-flatten</span></div>
              <div className="g-panel-item"><span className="g-panel-label">Config</span><span className="g-panel-val">Supabase</span></div>
              <div className="g-panel-item"><span className="g-panel-label">Execution</span><span className="g-panel-val">CLOB client</span></div>
            </div>
          )}
          <div className="g-panel-links">
            <Link to="/settings" className="g-link">Risk settings ↗</Link>
            <Link to="/strategy" className="g-link">Playbook ↗</Link>
            {strategyView === 'arb' && <Link to="/btc" className="g-link">BTC Bot ↗</Link>}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const { state } = useCopyList();
  const { status, error } = useLeaderboard();
  const { dailyPnL: liveDailyPnL, equityCurve: liveTradeEquity, liveFeed } = useTradeFeed();
  const { strategyView, execView } = useUI();
  const [automationOpen, setAutomationOpen] = useState(false);

  const killSwitchActive = state.riskControls?.killSwitchActive;
  const leaderboardMsg =
    status === 'loading' ? 'Syncing leaderboard...'
    : status === 'error' ? `Leaderboard error: ${error?.message ?? 'unknown'}`
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

  const paperToday = mockPaperToday;
  const paper7d = netMockPnL;
  const liveToday = liveFeed.length ? liveDailyPnL : null;
  const live7d = liveTradeEquity.length
    ? liveTradeEquity[liveTradeEquity.length - 1]?.value ?? null
    : null;

  return (
    <div className="page-stack g-dashboard">
      {killSwitchActive && (
        <div className="kill-switch-banner">
          Kill switch is active — copying is paused. Toggle it in Settings when you are ready.
        </div>
      )}
      {leaderboardMsg && <div className="t-info-strip">{leaderboardMsg}</div>}

      <PnlSummaryBar paperToday={paperToday} paper7d={paper7d} liveToday={liveToday} live7d={live7d} />

      <section className="g-section">
        <div className="g-section-header">
          <h2 className="g-section-title">Active Positions</h2>
          <span className="g-section-meta">{strategyView === 'copy' ? 'Copy trading — monitored' : 'Arb — open legs'}</span>
        </div>
        <PositionsTable positions={openPositions} strategyView={strategyView} execView={execView} />
      </section>

      <TradesAndHistory liveFeed={liveFeed} execView={execView} timeline={timeline} />

      <AutomationPanel
        strategyView={strategyView}
        state={state}
        open={automationOpen}
        onToggle={() => setAutomationOpen((v) => !v)}
      />
    </div>
  );
}
