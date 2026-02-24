import { useMemo, useState } from 'react';
import { useCopyList } from '../context/CopyListContext.jsx';
import { useTradeFeed } from '../context/TradeFeedContext';
import { useUI } from '../context/UIContext.jsx';
import useLeaderboard from '../hooks/useLeaderboard.js';
import { dailyPnL, leaderboard, openPositions } from '../data/analyticsMocks';
import { fallbackTimeline } from '../data/signalsTimeline';
import Traders from './Traders.jsx';
import Signals from './Signals.jsx';
import Strategy from './Strategy.jsx';
import BtcBot from './BtcBot.jsx';

const timelineSorter = (a, b) => new Date(b.timestamp) - new Date(a.timestamp);
const netMockPnL = dailyPnL.reduce((sum, bar) => sum + bar.value, 0);
const mockPaperToday = dailyPnL[dailyPnL.length - 1]?.value ?? 0;

function fmtPnl(value) {
  if (value == null || Number.isNaN(value)) return '—';
  const sign = value >= 0 ? '+' : '';
  return `${sign}$${Math.abs(value).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function fmtTs(timestamp) {
  if (!timestamp) return '—';
  try {
    return new Date(timestamp).toLocaleString();
  } catch {
    return String(timestamp);
  }
}

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

function PositionsTable({ positions }) {
  if (!positions.length) {
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
          {positions.map((pos, index) => (
            <tr key={`${pos.market}-${index}`}>
              <td className="g-bold">{pos.trader}</td>
              <td className="g-market-cell">{pos.market}</td>
              <td className="g-mono">{pos.notional}</td>
              <td>
                <span className={`g-tag${pos.status === 'Active hedge' ? ' g-tag--active' : ' g-tag--watch'}`}>
                  {pos.status}
                </span>
              </td>
              <td>
                <span className="g-tag g-tag--mode">COMMAND CENTER</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ClosedTradesTable({ events }) {
  if (!events.length) {
    return <p className="g-empty">No execution events yet.</p>;
  }

  return (
    <div className="g-table-wrap">
      <table className="g-table">
        <thead>
          <tr>
            <th>Type</th>
            <th>Market</th>
            <th>Shares</th>
            <th>Edge</th>
            <th>PnL</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          {events.map((ev) => (
            <tr key={ev.id}>
              <td>
                <span className={`g-tag${ev.type === 'FILLED' ? ' g-tag--active' : ev.type === 'ERROR' ? ' g-tag--danger' : ' g-tag--mode'}`}>
                  {ev.type}
                </span>
              </td>
              <td className="g-market-cell">{ev.market ?? '—'}</td>
              <td className="g-mono">{ev.shares ?? '—'}</td>
              <td className="g-mono">{ev.effectiveEdge != null ? `${(ev.effectiveEdge * 100).toFixed(2)}%` : '—'}</td>
              <td className={`g-mono${(ev.effectiveEdge ?? 0) >= 0 ? ' g-pos' : ' g-neg'}`}>
                {fmtPnl(ev.effectiveEdge != null ? ev.effectiveEdge * 100 : null)}
              </td>
              <td className="g-mono g-dim">{fmtTs(ev.ts)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ActivityLogTable({ timeline }) {
  if (!timeline.length) {
    return <p className="g-empty">No activity logged yet.</p>;
  }

  return (
    <div className="g-table-wrap">
      <table className="g-table">
        <thead>
          <tr>
            <th>Time</th>
            <th>Trader</th>
            <th>Type</th>
            <th>Market</th>
            <th>Reason</th>
          </tr>
        </thead>
        <tbody>
          {timeline.map((event) => (
            <tr key={event.id}>
              <td className="g-mono g-dim t-ts">{fmtTs(event.timestamp)}</td>
              <td className="g-bold">{event.trader}</td>
              <td>
                <span className={`g-tag${event.action === 'Copied' ? ' g-tag--active' : ' g-tag--watch'}`}>{event.action}</span>
              </td>
              <td className="g-market-cell">{event.market}</td>
              <td
                className="g-dim"
                style={{ fontSize: 11, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              >
                {event.reason}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ControlsPanel({ config, riskControls, toggleKillSwitch, setDailyLossLimit, setExposureCap }) {
  const { killSwitchActive, dailyLossLimit, exposureCap } = riskControls || {};

  return (
    <section className="g-section controls-panel">
      <div className="g-section-header">
        <h2 className="g-section-title">Controls</h2>
        <span className="g-section-meta">Kill switch + risk</span>
      </div>
      <div className="controls-grid">
        <div>
          <span className="g-panel-label">Kill switch</span>
          <label className="t-switch">
            <input
              type="checkbox"
              checked={killSwitchActive}
              onChange={(event) => toggleKillSwitch(event.target.checked)}
            />
            <span className="t-switch-label">{killSwitchActive ? 'Active' : 'Standby'}</span>
          </label>
        </div>
        <div>
          <span className="g-panel-label">Daily loss limit</span>
          <input
            type="number"
            className="t-input"
            value={dailyLossLimit}
            min="0"
            onChange={(event) => setDailyLossLimit(Number(event.target.value))}
          />
        </div>
        <div>
          <span className="g-panel-label">Exposure cap</span>
          <input
            type="number"
            className="t-input"
            value={exposureCap}
            min="0"
            onChange={(event) => setExposureCap(Number(event.target.value))}
          />
        </div>
        <div>
          <span className="g-panel-label">Execution</span>
          <span className={`g-tag ${config.executionEnabled ? 'g-tag--active' : 'g-tag--watch'}`}>
            {config.executionEnabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>
        <div>
          <span className="g-panel-label">Mode</span>
          <span className="g-tag g-tag--mode">{config.mode}</span>
        </div>
        <div>
          <span className="g-panel-label">Min edge</span>
          <span className="g-mono">{((config.minEdge ?? 0) * 100).toFixed(2)}%</span>
        </div>
      </div>
      <p className="g-dim" style={{ marginTop: 10 }}>
        Config is edited in Supabase (<code>btc_bot_config</code> row = "default"). Changes apply within ~3s.
      </p>
    </section>
  );
}

function CommandTabs({ activeTab, setActiveTab }) {
  return (
    <div className="command-tabs">
      <button
        className={`command-tab${activeTab === 'copy' ? ' active' : ''}`}
        type="button"
        onClick={() => setActiveTab('copy')}
      >
        Copy Trading
      </button>
      <button
        className={`command-tab${activeTab === 'arb' ? ' active' : ''}`}
        type="button"
        onClick={() => setActiveTab('arb')}
      >
        Arbitrage
      </button>
    </div>
  );
}

export default function Dashboard() {
  const { state, toggleKillSwitch, setDailyLossLimit, setExposureCap } = useCopyList();
  const { status, error } = useLeaderboard();
  const { dailyPnL: liveDaily, equityCurve: liveEquity, liveFeed } = useTradeFeed();
  const { strategyView, execView } = useUI();
  const [activeTab, setActiveTab] = useState('copy');

  const leaderboardMsg =
    status === 'loading' ? 'Syncing leaderboard...' : status === 'error' ? `Leaderboard error: ${error?.message ?? 'unknown'}` : null;

  const timeline = useMemo(() => {
    const rawEvents = state.auditLog.length ? state.auditLog : fallbackTimeline;
    return rawEvents
      .map((event) => ({
        ...event,
        timestamp: event.timestamp,
        action: event.action || event.type || 'Activity',
        market: event.market || event.detail || 'Unknown market',
        reason: event.reason || event.detail || 'No reason provided',
      }))
      .sort(timelineSorter)
      .slice(0, 12);
  }, [state.auditLog]);

  const paperToday = mockPaperToday;
  const paper7d = netMockPnL;
  const liveToday = liveFeed.length ? liveDaily : null;
  const live7d = liveEquity.length ? liveEquity[liveEquity.length - 1]?.value ?? null : null;

  return (
    <div className="page-stack g-dashboard command-center">
      <div className="t-page-header">
        <div>
          <span className="t-eyebrow">Command Center</span>
          <h1 className="t-page-title">Live trading terminal</h1>
        </div>
        <span className="t-page-count">{leaderboardMsg ?? `${status === 'success' ? 'Leaderboard synced' : 'Idle'}`}</span>
      </div>

      <PnlSummaryBar paperToday={paperToday} paper7d={paper7d} liveToday={liveToday} live7d={live7d} />

      <section className="g-section">
        <div className="g-section-header">
          <h2 className="g-section-title">Active Positions</h2>
          <span className="g-section-meta">{strategyView === 'copy' ? 'Copy trading' : 'Arbitrage'}</span>
        </div>
        <PositionsTable positions={openPositions} />
      </section>

      <div className="t-two-col">
        <section className="g-section">
          <div className="g-section-header">
            <h2 className="g-section-title">Closed Trades</h2>
            <span className="g-section-meta">Live fills + orders</span>
          </div>
          <ClosedTradesTable events={liveFeed.length ? liveFeed : []} />
        </section>

        <section className="g-section">
          <div className="g-section-header">
            <h2 className="g-section-title">Activity Log</h2>
            <span className="g-section-meta">Copy feed</span>
          </div>
          <ActivityLogTable timeline={timeline} />
        </section>
      </div>

      <ControlsPanel
        config={{
          mode: strategyView === 'copy' ? 'PAPER' : 'LIVE',
          executionEnabled: execView === 'live',
          minEdge: 0.02,
        }}
        riskControls={state.riskControls}
        toggleKillSwitch={toggleKillSwitch}
        setDailyLossLimit={setDailyLossLimit}
        setExposureCap={setExposureCap}
      />

      <CommandTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="command-tab-body">
        {activeTab === 'copy' ? (
          <div className="command-embed-grid">
            <Traders embedded />
            <Signals embedded />
            <Strategy embedded />
          </div>
        ) : (
          <div className="command-embed-grid command-embed-single">
            <BtcBot embedded />
          </div>
        )}
      </div>
    </div>
  );
}
