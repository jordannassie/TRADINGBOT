import { useMemo, useState } from 'react';
import { useCopyList } from '../context/CopyListContext.jsx';
import { useTradeFeed } from '../context/TradeFeedContext';
import { useUI } from '../context/UIContext.jsx';
import { fallbackTimeline } from '../data/signalsTimeline';
import { openPositions } from '../data/analyticsMocks';
import ProfileHeaderCard from '../components/profile/ProfileHeaderCard.jsx';
import ProfitLossCard from '../components/profile/ProfitLossCard.jsx';
import ProfileTabs from '../components/profile/ProfileTabs.jsx';
import PositionsToolbar from '../components/profile/PositionsToolbar.jsx';
import PositionsList from '../components/profile/PositionsList.jsx';
import ActivityList from '../components/profile/ActivityList.jsx';
import Traders from './Traders.jsx';
import Signals from './Signals.jsx';
import Strategy from './Strategy.jsx';
import BtcBot from './BtcBot.jsx';

const formatNumber = (value, options) => {
  if (value == null || Number.isNaN(value)) return '—';
  return value.toLocaleString(undefined, { maximumFractionDigits: 0, ...options });
};

export default function Dashboard() {
  const { state, toggleKillSwitch } = useCopyList();
  const { liveFeed } = useTradeFeed();
  const { strategyView, execView, setStrategyView, setExecView } = useUI();
  const [mainTab, setMainTab] = useState('positions');
  const [positionsTab, setPositionsTab] = useState('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('value');

  const lastHeartbeat = useMemo(() => {
    const heartbeat = state.auditLog.find((event) => event.type === 'HEARTBEAT');
    return heartbeat?.timestamp ?? null;
  }, [state.auditLog]);

  const closedPositions = useMemo(() => {
    if (liveFeed.length) {
      return liveFeed.slice(0, 6).map((trade, index) => ({
        market: trade.market ?? `Live fill ${index + 1}`,
        trader: trade.trader || 'Live fill',
        status: 'Closed',
        value: trade.size && trade.price ? `$${formatNumber(trade.size * trade.price)}` : '—',
        pnl: trade.pnl ?? 0,
      }));
    }
    return openPositions.map((pos, index) => ({
      ...pos,
      status: 'Closed',
      value: pos.notional,
      pnl: index % 2 === 0 ? 1200 : -400,
    }));
  }, [liveFeed]);

  const filteredPositions = useMemo(() => {
    const base = positionsTab === 'active' ? openPositions : closedPositions;
    const term = searchTerm.trim().toLowerCase();
    const filtered = term
      ? base.filter((entry) => (entry.market ?? '').toLowerCase().includes(term))
      : base;
    if (sortField === 'value') {
      return [...filtered].sort((a, b) => {
        const parse = (field) =>
          Number(String(field ?? '').replace(/[^0-9.-]+/g, '')) || 0;
        return parse(b.value) - parse(a.value);
      });
    }
    return filtered;
  }, [positionsTab, searchTerm, sortField, closedPositions]);

  const activityTimeline = useMemo(() => {
    const raw = state.auditLog.length ? state.auditLog : fallbackTimeline;
    return raw
      .map((event) => ({
        ...event,
        market: event.market || event.detail || 'Unknown market',
        action: event.action || event.type || 'Activity',
        reason: event.reason || event.detail || '—',
      }))
      .slice(0, 12);
  }, [state.auditLog]);

  return (
    <div className="page-stack control-center">
      <div className="t-page-header">
        <div>
          <span className="t-eyebrow">Control Center</span>
          <h1 className="t-page-title">Live trading terminal</h1>
        </div>
      </div>
      <div className="poly-command-bar">
        <div className="poly-command-group">
          <button
            type="button"
            className="poly-pill"
            onClick={() => toggleKillSwitch(!state.riskControls?.killSwitchActive)}
          >
            BOT {state.riskControls?.killSwitchActive ? 'OFF' : 'ON'}
          </button>
        </div>
        <div className="poly-command-group">
          <div className="poly-command-pill-group">
            <button
              type="button"
              className={`poly-pill${execView === 'paper' ? ' active' : ''}`}
              onClick={() => setExecView('paper')}
            >
              Paper
            </button>
            <button
              type="button"
              className={`poly-pill${execView === 'live' ? ' active' : ''}`}
              onClick={() => setExecView('live')}
            >
              Live
            </button>
          </div>
          <div className="poly-command-pill-group">
            <button
              type="button"
              className={`poly-pill${strategyView === 'copy' ? ' active' : ''}`}
              onClick={() => setStrategyView('copy')}
            >
              Copy
            </button>
            <button
              type="button"
              className={`poly-pill${strategyView === 'arb' ? ' active' : ''}`}
              onClick={() => setStrategyView('arb')}
            >
              Arbitrage
            </button>
          </div>
        </div>
        <div className="poly-command-group">
          <span className={`poly-status-dot${state.riskControls?.killSwitchActive ? ' off' : ''}`} />
          <div>
            <p className="poly-command-status">Connected</p>
            <p className="poly-command-status small">
              Heartbeat: {lastHeartbeat ? new Date(lastHeartbeat).toLocaleTimeString() : '—'}
            </p>
          </div>
        </div>
      </div>

      <div className="poly-grid">
        <ProfileHeaderCard />
        <ProfitLossCard />
      </div>

      <ProfileTabs activeTab={mainTab} onChange={setMainTab} />

      {mainTab === 'positions' ? (
        <>
          <PositionsToolbar
            activeTab={positionsTab}
            onChangeTab={setPositionsTab}
            searchTerm={searchTerm}
            onSearch={setSearchTerm}
            onSort={setSortField}
          />
          <PositionsList positions={filteredPositions} type={positionsTab} />
        </>
      ) : (
        <ActivityList events={activityTimeline} />
      )}

      <details className="poly-advanced">
        <summary>Advanced</summary>
        <div className="poly-advanced-panel">
          <Traders embedded />
          <Signals embedded />
          <Strategy embedded />
          <BtcBot embedded />
        </div>
      </details>
    </div>
  );
}
