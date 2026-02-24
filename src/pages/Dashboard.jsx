import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useCopyList } from '../context/CopyListContext.jsx';
import { useTradeFeed } from '../context/TradeFeedContext';
import { useUI } from '../context/UIContext.jsx';
import { supabase } from '../services/supabaseClient.js';
import { routeOrder } from '../services/executionRouter.js';
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

const formatActionLabel = (value) => {
  if (!value) return 'Activity';
  return value
    .toLowerCase()
    .split('_')
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(' ');
};

const parseActivityMetadata = (entry) => {
  if (!entry.metadata_json) return {};
  try {
    return JSON.parse(entry.metadata_json);
  } catch {
    return {};
  }
};

export default function Dashboard() {
  const { state, toggleKillSwitch } = useCopyList();
  const { liveFeed } = useTradeFeed();
  const { strategyView, execView, setStrategyView, setExecView } = useUI();
  const [mainTab, setMainTab] = useState('positions');
  const [positionsTab, setPositionsTab] = useState('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('value');
  const [paperPositions, setPaperPositions] = useState([]);
  const [paperActivity, setPaperActivity] = useState([]);
  const [paperSyncing, setPaperSyncing] = useState(false);
  const [simulateStatus, setSimulateStatus] = useState('');
  const mountedRef = useRef(true);
  const hasSupabase = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
  const botIsOn = !state.riskControls?.killSwitchActive;
  const [paperAmount, setPaperAmount] = useState(2);
  const fetchPaperData = useCallback(async () => {
    if (!hasSupabase) {
      setPaperSyncing(false);
      return;
    }
    setPaperSyncing(true);
    try {
      const [positionsRes, activityRes] = await Promise.all([
        supabase
          .from('paper_positions')
          .select('*')
          .order('opened_at', { ascending: false })
          .limit(50),
        supabase
          .from('paper_activity_log')
          .select('*')
          .order('ts', { ascending: false })
          .limit(50),
      ]);

      if (!mountedRef.current) return;
      if (positionsRes.error || activityRes.error) {
        throw new Error(positionsRes.error?.message ?? activityRes.error?.message ?? 'Paper table read failed');
      }

      setPaperPositions(positionsRes.data ?? []);
      setPaperActivity(activityRes.data ?? []);
    } catch (error) {
      console.warn('Unable to fetch paper data', error);
    } finally {
      if (mountedRef.current) {
        setPaperSyncing(false);
      }
    }
  }, [hasSupabase]);

  useEffect(() => {
    mountedRef.current = true;
    fetchPaperData();
    if (!hasSupabase) {
      return () => {
        mountedRef.current = false;
      };
    }
    const intervalId = setInterval(fetchPaperData, 5000);
    return () => {
      mountedRef.current = false;
      clearInterval(intervalId);
    };
  }, [fetchPaperData, hasSupabase]);

  const handleSimulatePaperTrade = async () => {
    if (!hasSupabase) {
      setSimulateStatus('Please configure Supabase env vars to log the trade.');
      return;
    }
    setSimulateStatus('Simulating paper order...');
    const intent = {
      marketId: 'TEST',
      side: 'YES',
      sizeUsd: paperAmount,
      limitPrice: 0.5,
      strategyMode: 'COPY',
      sourceRef: 'control-center-sim',
    };

    try {
      const result = await routeOrder(intent, {
        botOn: botIsOn,
        execMode: execView,
        strategyMode: strategyView,
      });

      if (result.blocked) {
        setSimulateStatus('Simulation blocked — BOT must be ON + PAPER + COPY.');
      } else if (result.success) {
        setSimulateStatus('Simulated paper trade recorded.');
      } else {
        setSimulateStatus(result.error?.message ?? 'Simulation failed.');
      }
    } catch (error) {
      console.error('Simulation error', error);
      setSimulateStatus('Simulation encountered an error.');
    } finally {
      await fetchPaperData();
      setTimeout(() => setSimulateStatus(''), 4000);
    }
  };

  const lastHeartbeat = useMemo(() => {
    const heartbeat = state.auditLog.find((event) => event.type === 'HEARTBEAT');
    return heartbeat?.timestamp ?? null;
  }, [state.auditLog]);

  const legacyClosedPositions = useMemo(() => {
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

  const formattedPaperPositions = useMemo(() => {
    if (!paperPositions.length) return [];
    return paperPositions.map((pos) => {
      const sizeValue = Number(pos.size ?? 0);
      return {
        id: pos.id,
        market: pos.market_id ?? 'Paper trade',
        trader: pos.trader ?? 'Paper copy bot',
        status: pos.status === 'OPEN' ? 'PAPER • COPY' : pos.status,
        rawStatus: pos.status,
        value: `$${sizeValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
        pnl: Number(pos.realized_pnl ?? 0),
        strategy: (pos.strategy_mode ?? 'COPY').toLowerCase(),
        execution: 'paper',
      };
    });
  }, [paperPositions]);

  const activePaperPositions = useMemo(
    () => formattedPaperPositions.filter((pos) => pos.rawStatus === 'OPEN'),
    [formattedPaperPositions],
  );

  const closedPaperPositions = useMemo(
    () => formattedPaperPositions.filter((pos) => pos.rawStatus !== 'OPEN'),
    [formattedPaperPositions],
  );

  const hasPaperPositions = formattedPaperPositions.length > 0;
  const activeSource = hasPaperPositions ? activePaperPositions : openPositions;
  const closedSource = hasPaperPositions ? closedPaperPositions : legacyClosedPositions;

  const paperActivityEvents = useMemo(() => {
    if (!paperActivity.length) return [];
    return paperActivity
      .map((entry) => {
        const metadata = parseActivityMetadata(entry);
        const market =
          metadata.intent?.marketId ?? metadata.market ?? metadata.market_id ?? 'Paper trade';
        return {
          id: entry.id,
          timestamp: entry.ts,
          action: formatActionLabel(entry.event_type),
          trader: metadata.trader ?? 'Paper copy bot',
          market,
          reason: entry.message ?? metadata.reason ?? 'Paper simulation',
          strategy: (entry.strategy_mode ?? 'COPY').toLowerCase(),
          execution: 'paper',
        };
      })
      .filter((event) => event.execution === execView && event.strategy === strategyView)
      .slice(0, 12);
  }, [paperActivity, execView, strategyView]);

  const filteredPositions = useMemo(() => {
    const base = positionsTab === 'active' ? activeSource : closedSource;
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
  }, [positionsTab, searchTerm, sortField, activeSource, closedSource]);

  const activityTimeline = useMemo(() => {
    if (paperActivityEvents.length) {
      return paperActivityEvents;
    }
    const raw = state.auditLog.length ? state.auditLog : fallbackTimeline;
    return raw
      .map((event) => ({
        ...event,
        market: event.market || event.detail || 'Unknown market',
        action: event.action || event.type || 'Activity',
        reason: event.reason || event.detail || '—',
      }))
      .slice(0, 12);
  }, [state.auditLog, paperActivityEvents]);

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
          {execView === 'paper' && strategyView === 'copy' && (
            <div className="poly-advanced-simulate">
              <label className="poly-advanced-simulate-label">
                Paper Amount ($)
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={paperAmount}
                  onChange={(event) => setPaperAmount(Number(event.target.value) || 0)}
                  className="poly-advanced-amount"
                />
              </label>
              <button
                type="button"
                className="poly-pill"
                onClick={handleSimulatePaperTrade}
                disabled={!botIsOn || !hasSupabase}
              >
                Simulate Paper Trade
              </button>
              <p className="g-dim" style={{ fontSize: 11 }}>
                {simulateStatus ||
                  (paperSyncing
                    ? 'Syncing paper tables…'
                    : !hasSupabase
                      ? 'Set VITE_SUPABASE_URL/ANON_KEY to enable simulation.'
                      : botIsOn
                        ? 'Logs a simulated paper order and position.'
                        : 'Kill switch is ON — disable to simulate.')}
              </p>
            </div>
          )}
          <Traders embedded />
          <Signals embedded />
          <Strategy embedded />
          <BtcBot embedded />
        </div>
      </details>
    </div>
  );
}
