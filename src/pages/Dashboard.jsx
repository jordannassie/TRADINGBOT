import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useCopyList } from '../context/CopyListContext.jsx';
import { useUI } from '../context/UIContext.jsx';
import ProfileHeaderCard from '../components/profile/ProfileHeaderCard.jsx';
import ProfitLossCard from '../components/profile/ProfitLossCard.jsx';
import ProfileTabs from '../components/profile/ProfileTabs.jsx';
import PositionsToolbar from '../components/profile/PositionsToolbar.jsx';
import PositionsList from '../components/profile/PositionsList.jsx';
import ActivityList from '../components/profile/ActivityList.jsx';
import { fetchWalletTrades, loadSeenTradeIds, persistSeenTradeIds, resolveTargetWallet, TARGET_TRADER_HANDLE } from '../services/copyEngine.js';
import { supabase, supabaseConfigured } from '../services/supabaseClient.js';
import { routeOrder } from '../services/executionRouter.js';

const POSITION_SORT_FIELD = 'value';
const POLL_INTERVAL_MS = 15000;
const LAST_TRADE_KEY = 'tradingbot-copy-last-trade';

const formatCurrency = (value) => {
  if (value == null || Number.isNaN(value)) return '—';
  return `$${Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
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

const formatCopyTimestamp = (ts) => {
  if (!ts) return '—';
  try {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return '—';
  }
};

export default function Dashboard() {
  const { state, toggleKillSwitch } = useCopyList();
  const { strategyView, execView, setStrategyView, setExecView } = useUI();
  const [mainTab, setMainTab] = useState('positions');
  const [positionsTab, setPositionsTab] = useState('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState(POSITION_SORT_FIELD);
  const [paperPositions, setPaperPositions] = useState([]);
  const [paperActivity, setPaperActivity] = useState([]);
  const [simulateStatus, setSimulateStatus] = useState('');
  const [paperAmount, setPaperAmount] = useState(2);
  const [copyStatus, setCopyStatus] = useState('STOPPED');
  const [copyLastPollAt, setCopyLastPollAt] = useState(null);
  const [copyLastSeenTrade, setCopyLastSeenTrade] = useState('—');
  const [targetWallet, setTargetWallet] = useState('');
  const [targetStatus, setTargetStatus] = useState('resolving');
  const seenCopyTradeIds = useRef(new Set());
  const copyIntervalRef = useRef(null);
  const supabaseUrlRaw = import.meta.env.VITE_SUPABASE_URL ?? '';
  const supabaseUrlPresent = /^https?:\/\//i.test(supabaseUrlRaw);
  const supabaseAnonPresent = Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY ?? '');
  const supabaseUrlInvalid = Boolean(supabaseUrlRaw.length && !supabaseUrlRaw.toLowerCase().startsWith('http'));
  const hasSupabase = supabaseConfigured;
  const supabaseBannerMessage = supabaseConfigured
    ? ''
    : supabaseUrlInvalid
      ? 'Supabase URL must begin with "http(s)://" before data will load.'
      : 'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Netlify before trading starts.';
  const botIsOn = !state.riskControls?.killSwitchActive;
  const commandEnabled = hasSupabase && botIsOn;

  useEffect(() => {
    setStrategyView('copy');
    setExecView('paper');
  }, [setStrategyView, setExecView]);

  useEffect(() => {
    const stored = loadSeenTradeIds();
    stored.forEach((id) => seenCopyTradeIds.current.add(id));
    if (typeof localStorage !== 'undefined') {
      const lastId = localStorage.getItem(LAST_TRADE_KEY);
      if (lastId) {
        setCopyLastSeenTrade(lastId);
      }
    }
  }, []);

  const persistSeenTrades = useCallback(() => {
    persistSeenTradeIds(Array.from(seenCopyTradeIds.current));
  }, []);

  const fetchPaperData = useCallback(async () => {
    if (!hasSupabase) return;
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

      if (positionsRes.error || activityRes.error) {
        throw new Error(positionsRes.error?.message ?? activityRes.error?.message ?? 'Paper table read failed');
      }

      setPaperPositions(positionsRes.data ?? []);
      setPaperActivity(activityRes.data ?? []);
    } catch (error) {
      console.warn('Unable to fetch paper data', error);
    }
  }, [hasSupabase]);

  useEffect(() => {
    fetchPaperData();
    if (!hasSupabase) return undefined;
    const intervalId = setInterval(fetchPaperData, 5000);
    return () => clearInterval(intervalId);
  }, [fetchPaperData, hasSupabase]);

  useEffect(() => {
    if (!hasSupabase) {
      setTargetStatus('disabled');
      return undefined;
    }
    let active = true;
    (async () => {
      try {
        const wallet = await resolveTargetWallet(TARGET_TRADER_HANDLE);
        if (active) {
          setTargetWallet(wallet);
          setTargetStatus('resolved');
        }
      } catch (error) {
        console.error('Target wallet lookup failed', error);
        if (active) {
          setTargetStatus('error');
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [hasSupabase]);

  const handlePaperAmountChange = (event) => {
    const value = Number(event.target.value);
    setPaperAmount(Number.isFinite(value) ? Math.max(0.01, value) : 0.01);
  };

  const handleSimulatePaperTrade = useCallback(async () => {
    if (!commandEnabled) {
      setSimulateStatus('Trading disabled.');
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
    const detection = {
      tradeId: `sim-${Date.now()}`,
      marketTitle: 'Simulated market',
    };
    const result = await routeOrder(intent, { detection, botOn: botIsOn });
    if (result.success) {
      setSimulateStatus('Simulated trade recorded.');
      await fetchPaperData();
    } else if (result.blocked) {
      setSimulateStatus('Simulation blocked — BOT must be ON + PAPER + COPY.');
    } else {
      setSimulateStatus(result.error?.message ?? 'Simulation failed.');
    }
    setTimeout(() => setSimulateStatus(''), 4000);
  }, [botIsOn, commandEnabled, fetchPaperData, paperAmount]);

  const runCopyEnginePoll = useCallback(async () => {
    if (!commandEnabled || !targetWallet) {
      setCopyStatus('STOPPED');
      return;
    }
    setCopyLastPollAt(new Date().toISOString());
    setCopyStatus('RUNNING');
    try {
      const trades = await fetchWalletTrades(targetWallet, 8);
      const newTrades = trades.filter((trade) => trade.marketId && !seenCopyTradeIds.current.has(trade.id));
      if (newTrades.length) {
        for (const trade of newTrades) {
          seenCopyTradeIds.current.add(trade.id);
          setCopyLastSeenTrade(trade.id);
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem(LAST_TRADE_KEY, trade.id);
          }
          persistSeenTrades();
          const intent = {
            marketId: trade.marketId,
            side: trade.side === 'NO' ? 'NO' : 'YES',
            sizeUsd: paperAmount,
            limitPrice: trade.price || 0,
            strategyMode: 'COPY',
            sourceRef: 'polymarket-copy',
          };
          await routeOrder(intent, {
            detection: {
              tradeId: trade.id,
              marketTitle: trade.marketTitle,
              price: trade.price,
              side: trade.side,
              wallet: targetWallet,
            },
            botOn: botIsOn,
          });
        }
        await fetchPaperData();
      }
    } catch (error) {
      console.error('Copy engine poll failed', error);
      setCopyStatus('ERROR');
      await routeOrder(
        {
          marketId: 'HEARTBEAT',
          side: 'YES',
          sizeUsd: paperAmount,
          limitPrice: 0,
          strategyMode: 'COPY',
          sourceRef: 'polymarket-copy',
        },
        {
          detection: {
            tradeId: `copy-error-${Date.now()}`,
            wallet: targetWallet,
            error: error?.message,
          },
          botOn: botIsOn,
        },
      );
    }
  }, [botIsOn, commandEnabled, fetchPaperData, paperAmount, persistSeenTrades, targetWallet]);

  useEffect(() => {
    if (!commandEnabled || !targetWallet) {
      setCopyStatus('STOPPED');
      if (copyIntervalRef.current) {
        clearInterval(copyIntervalRef.current);
        copyIntervalRef.current = null;
      }
      return undefined;
    }
    runCopyEnginePoll();
    copyIntervalRef.current = setInterval(runCopyEnginePoll, POLL_INTERVAL_MS);
    return () => {
      if (copyIntervalRef.current) {
        clearInterval(copyIntervalRef.current);
        copyIntervalRef.current = null;
      }
    };
  }, [commandEnabled, runCopyEnginePoll, targetWallet]);

  const formattedPositions = useMemo(
    () =>
      paperPositions.map((pos) => {
        const sizeValue = Number(pos.size ?? pos.size_usd ?? pos.notional ?? 0);
        return {
          id: pos.id,
          market: pos.market_id ?? 'Paper market',
          trader: pos.trader ?? 'Paper copy bot',
          status: pos.status === 'OPEN' ? 'PAPER • COPY' : pos.status ?? 'PAPER • COPY',
          rawStatus: pos.status ?? 'OPEN',
          value: sizeValue ? `$${sizeValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : '—',
          pnl: Number(pos.realized_pnl ?? pos.unrealized_pnl ?? 0),
        };
      }),
    [paperPositions],
  );

  const activePositions = useMemo(
    () => formattedPositions.filter((pos) => pos.rawStatus === 'OPEN'),
    [formattedPositions],
  );
  const closedPositions = useMemo(
    () => formattedPositions.filter((pos) => pos.rawStatus !== 'OPEN'),
    [formattedPositions],
  );
  const hasPaperPositions = formattedPositions.length > 0;

  const filteredPositions = useMemo(() => {
    const base = positionsTab === 'active' ? activePositions : closedPositions;
    const term = searchTerm.trim().toLowerCase();
    const filtered = term
      ? base.filter((entry) => (entry.market ?? '').toLowerCase().includes(term))
      : base;
    if (sortField === POSITION_SORT_FIELD) {
      return [...filtered].sort((a, b) => {
        const parse = (value = '0') => Number(String(value).replace(/[^0-9.-]+/g, '')) || 0;
        return parse(b.value) - parse(a.value);
      });
    }
    return filtered;
  }, [positionsTab, searchTerm, sortField, activePositions, closedPositions]);

  const activityTimeline = useMemo(() => {
    return [...paperActivity]
      .sort((a, b) => new Date(b.ts).valueOf() - new Date(a.ts).valueOf())
      .slice(0, 12)
      .map((entry) => {
        const metadata = parseActivityMetadata(entry);
        return {
          id: entry.id,
          timestamp: entry.ts,
          action: formatActionLabel(entry.event_type),
          trader: metadata.targetWallet ?? metadata.wallet ?? 'Copy engine',
          market: metadata.marketTitle ?? entry.market ?? '—',
          reason: entry.message ?? metadata.reason ?? entry.event_type,
        };
      });
  }, [paperActivity]);

  return (
    <div className="page-stack control-center">
      {!hasSupabase && supabaseBannerMessage && (
        <div className="kill-switch-banner">{supabaseBannerMessage}</div>
      )}
      <div className="t-page-header">
        <div>
          <span className="t-eyebrow">Control Center</span>
          <h1 className="t-page-title">Paper Copy Engine</h1>
        </div>
      </div>
      <div className="env-debug">
        <span>VITE_SUPABASE_URL present? {supabaseUrlPresent ? 'yes' : 'no'}</span>
        <span>VITE_SUPABASE_ANON_KEY present? {supabaseAnonPresent ? 'yes' : 'no'}</span>
      </div>

      <div className="dashboard-shell">
        <div className="status-bar">
          <span className="status-pill">{strategyView === 'copy' ? 'Copying' : 'Arbitrage'}</span>
          <span className="status-pill">{execView === 'paper' ? 'Paper' : 'Live (locked)'}</span>
          <span className={`status-pill ${botIsOn ? 'status-green' : 'status-red'}`}>
            Bot {botIsOn ? 'ON' : 'OFF'}
          </span>
          <span className="status-pill">
            {state.riskControls?.killSwitchActive ? 'Kill Switch ACTIVE' : 'Kill Switch STANDBY'}
          </span>
          <span className="status-pill">@k9Q2mX4L8A7ZP3R</span>
          <span className={`status-pill ${hasSupabase ? 'status-green' : 'status-red'}`}>
            Supabase {hasSupabase ? 'connected' : 'missing'}
          </span>
          <span className="status-pill">
            Wallet {targetWallet ? `${targetWallet.slice(0, 6)}…${targetWallet.slice(-4)}` : 'pending'}
          </span>
        </div>

        <div className="card-grid">
          <section className="card execution-card">
            <div className="card-title">Execution Console</div>
            <div className="poly-command-bar">
              <div className="poly-command-bar__left">
                <div className="poly-command-group">
                  <button
                    type="button"
                    className="poly-pill"
                    onClick={() => toggleKillSwitch(!state.riskControls?.killSwitchActive)}
                  >
                    BOT {state.riskControls?.killSwitchActive ? 'OFF' : 'ON'}
                  </button>
                </div>
                <div className="poly-command-group poly-paper-amount">
                  <label>
                    <span>Paper Amount ($)</span>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={paperAmount}
                      onChange={handlePaperAmountChange}
                      disabled={!hasSupabase}
                    />
                  </label>
                </div>
                <div className="poly-command-group poly-simulate-group">
                  <button
                    type="button"
                    className="poly-pill"
                    onClick={handleSimulatePaperTrade}
                    disabled={!commandEnabled}
                  >
                    Simulate Paper Trade
                  </button>
                  <p className="poly-command-note">
                    {simulateStatus ||
                      (commandEnabled
                        ? 'Logs a paper order with the chosen amount.'
                        : 'Trading disabled until Supabase + kill switch ready.')}
                  </p>
                </div>
              </div>
              <div className="poly-command-bar__center">
                <span className="poly-command-note small">PAPER • COPY</span>
              </div>
              <div className="poly-command-bar__right">
                <div className="poly-command-group">
                  <span className={`poly-status-dot${botIsOn ? '' : ' off'}`} />
                  <div>
                    <p className="poly-command-status">{botIsOn ? 'Connected' : 'Kill Switch ON'}</p>
                    <p className="poly-command-status small">
                      Target wallet:{' '}
                      {targetWallet || (targetStatus === 'resolving' ? 'Resolving...' : 'Unavailable')}
                    </p>
                  </div>
                </div>
                <div className="poly-copy-status">
                  <span className={`poly-copy-chip poly-copy-chip--${copyStatus.toLowerCase()}`}>{copyStatus}</span>
                  <p className="poly-copy-detail">Last poll: {formatCopyTimestamp(copyLastPollAt)}</p>
                  <p className="poly-copy-detail">Last trade: {copyLastSeenTrade}</p>
                </div>
              </div>
            </div>
            <div className="strategy-control">
              <span className="strategy-label">Strategy</span>
              <div className="strategy-pill-group">
                <button
                  type="button"
                  className={`strategy-pill${strategyView === 'copy' ? ' active' : ''}`}
                  onClick={() => setStrategyView('copy')}
                >
                  Copying
                </button>
                <button
                  type="button"
                  className={`strategy-pill${strategyView === 'arb' ? ' active' : ''}`}
                  onClick={() => setStrategyView('arb')}
                >
                  Arbitrage
                </button>
              </div>
            </div>
            <div className="strategy-panels">
              <section className={`strategy-panel${strategyView === 'copy' ? ' active' : ' disabled'}`}>
                <div className="strategy-panel-header">
                  <h3>Copying Setup</h3>
                  <span className="strategy-status">{strategyView === 'copy' ? 'Active' : 'Paused'}</span>
                </div>
            <p className="strategy-panel-body">Monitoring @k9Q2mX4L8A7ZP3R · BOT on + Paper to copy.</p>
              </section>
              <section className={`strategy-panel${strategyView === 'arb' ? ' active' : ' disabled'}`}>
                <div className="strategy-panel-header">
                  <h3>Arbitrage Setup</h3>
                  <span className="strategy-status">Coming soon</span>
                </div>
            <p className="strategy-panel-body">Arbitrage coming soon · Copying is the active route.</p>
              </section>
            </div>
            <div className="execution-control">
              <span className="strategy-label">Execution</span>
              <div className="strategy-pill-group">
                <button
                  type="button"
                  className={`strategy-pill${execView === 'paper' ? ' active' : ''}`}
                  onClick={() => setExecView('paper')}
                >
                  Paper
                </button>
                <button
                  type="button"
                  className={`strategy-pill${execView === 'live' ? ' active' : ''}`}
                  onClick={() => setExecView('live')}
                  disabled
                >
                  Live
                </button>
              </div>
            </div>
            <div className="execution-panels">
              <section className={`strategy-panel active`}>
                <div className="strategy-panel-header">
                  <h3>Paper Execution</h3>
                  <span className="strategy-status">Enabled</span>
                </div>
            <p className="strategy-panel-body">Simulation enabled · Paper routing only.</p>
              </section>
              <section className="strategy-panel disabled">
                <div className="strategy-panel-header">
                  <h3>Live Execution</h3>
                  <span className="strategy-status">Locked</span>
                </div>
            <p className="strategy-panel-body">LOCKED — Live trading disabled in this MVP.</p>
              </section>
            </div>
          </section>

          <section className="card info-card">
            <div className="card-title">Status &amp; PnL</div>
            <ProfileHeaderCard />
            <ProfitLossCard />
          </section>
        </div>
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
          <PositionsList
            positions={filteredPositions}
            type={positionsTab}
            emptyMessage={hasPaperPositions ? 'No paper positions yet.' : 'Waiting for paper copy trades.'}
          />
        </>
      ) : (
        <ActivityList events={activityTimeline} />
      )}
    </div>
  );
}
