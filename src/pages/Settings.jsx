import { useEffect, useState } from 'react';
import { useCopyList } from '../context/CopyListContext.jsx';
import { fetchAccountBalance, PROXY_WALLET } from '../services/polymarket';

export default function Settings() {
  const {
    state: { riskControls },
    toggleKillSwitch,
    setDailyLossLimit,
    setExposureCap,
  } = useCopyList();
  const { killSwitchActive, dailyLossLimit, exposureCap } = riskControls;
  const [balance, setBalance] = useState(null);
  const [lastSync, setLastSync] = useState(null);
  const [loadingBalance, setLoadingBalance] = useState(false);

  const formatBalance = (data) => {
    if (!data) return '—';
    if (typeof data === 'string') return data;
    if (typeof data.balance === 'number' || typeof data.balance === 'string') return data.balance;
    if (typeof data.allowance === 'number' || typeof data.allowance === 'string') return data.allowance;
    return JSON.stringify(data);
  };

  const refreshBalance = async () => {
    if (!PROXY_WALLET) return;
    setLoadingBalance(true);
    const payload = await fetchAccountBalance();
    setBalance(payload);
    setLastSync(new Date().toLocaleString());
    setLoadingBalance(false);
  };

  useEffect(() => {
    refreshBalance();
  }, []);

  return (
    <div className="page-stack">
      <header className="top-bar">
        <div>
          <p className="eyebrow">Settings</p>
          <h1>Risk controls & API vault</h1>
        </div>
      </header>

      <div className={`risk-banner ${killSwitchActive ? 'active' : ''}`}>
        {killSwitchActive ? 'Kill switch is active — all copying paused.' : 'Kill switch is ready.'}
      </div>

      <section className="settings-grid">
        <article className="card control-card">
          <header className="section-header">
            <div>
              <p className="eyebrow">Risk controls</p>
              <h3>Global governance</h3>
            </div>
          </header>
          <div className="control-row">
            <label htmlFor="kill-switch" className="form-label">
              Global kill switch
            </label>
            <input
              id="kill-switch"
              type="checkbox"
              checked={killSwitchActive}
              onChange={(event) => toggleKillSwitch(event.target.checked)}
              aria-label="Kill switch"
            />
          </div>
          <div className="control-row">
            <label htmlFor="daily-loss" className="form-label">
              Daily loss limit
            </label>
            <input
              id="daily-loss"
              type="number"
              value={dailyLossLimit}
              min="0"
              onChange={(event) => setDailyLossLimit(Number(event.target.value))}
              className="form-input"
            />
            <span className="form-hint">USD</span>
          </div>
          <div className="control-row">
            <label htmlFor="exposure-cap" className="form-label">
              Per-trader exposure cap
            </label>
            <input
              id="exposure-cap"
              type="number"
              value={exposureCap}
              min="0"
              onChange={(event) => setExposureCap(Number(event.target.value))}
              className="form-input"
            />
            <span className="form-hint">USD</span>
          </div>
          <p className="fine">
            These controls live in local state for now, but can be synced to the engine when the
            risk service is wired.
          </p>
        </article>

        <article className="card clipboard-card">
          <header className="section-header">
            <div>
              <p className="eyebrow">Clipboard</p>
              <h3>Account snapshot</h3>
            </div>
          </header>
          <div className="clipboard-row">
            <strong>Polymarket account</strong>
            <span>{PROXY_WALLET || 'Not connected'}</span>
          </div>
          <div className="clipboard-row">
            <strong>Balance</strong>
            <span>{formatBalance(balance)}</span>
          </div>
          <div className="clipboard-row">
            <strong>Last sync</strong>
            <span>{lastSync || '—'}</span>
          </div>
          <button type="button" className="ghost-btn" onClick={refreshBalance} disabled={loadingBalance}>
            {loadingBalance ? 'Refreshing…' : 'Refresh balance'}
          </button>
        </article>

        <article className="card control-card">
          <header className="section-header">
            <div>
              <p className="eyebrow">API vault</p>
              <h3>Credential placeholders</h3>
            </div>
          </header>
          <div className="control-row">
            <label htmlFor="usdc-balance" className="form-label">
              USDC balance
            </label>
            <input
              id="usdc-balance"
              type="text"
              value="152,400 USDC"
              readOnly
              className="form-input"
            />
          </div>
          <div className="control-row">
            <label htmlFor="api-key" className="form-label">
              Polymarket API key
            </label>
            <input
              id="api-key"
              type="password"
              value="••••••••••••••••"
              readOnly
              className="form-input"
            />
          </div>
          <div className="control-row">
            <label htmlFor="proxy-wallet" className="form-label">
              Proxy wallet
            </label>
            <input
              id="proxy-wallet"
              type="text"
              value="0xProxyWalletDemo"
              readOnly
              className="form-input"
            />
          </div>
        </article>

        <article className="card control-card">
          <header className="section-header">
            <div>
              <p className="eyebrow">Notes</p>
              <h3>Execution hints</h3>
            </div>
          </header>
          <p>
            Commit these controls to your configuration store once a secure credential manager is
            ready. The kill switch and limits can be toggled via the trading engine with the same
            field names.
          </p>
        </article>
      </section>
    </div>
  );
}
