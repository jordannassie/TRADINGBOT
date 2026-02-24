import { useEffect, useState } from 'react';
import { useCopyList } from '../context/CopyListContext.jsx';
import { fetchAccountBalance, PROXY_WALLET } from '../services/polymarket';

export default function Settings() {
  // ── Existing wiring (unchanged) ───────────────────────────────────────────────
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

  useEffect(() => { refreshBalance(); }, []);

  return (
    <div className="page-stack g-dashboard">
      <div className="t-page-header">
        <div>
          <span className="t-eyebrow">Settings</span>
          <h1 className="t-page-title">Risk controls &amp; API vault</h1>
        </div>
        <span className={`g-tag${killSwitchActive ? ' g-tag--danger' : ' g-tag--active'}`}>
          {killSwitchActive ? 'Kill Switch ON' : 'Kill Switch Ready'}
        </span>
      </div>

      {killSwitchActive && (
        <div className="kill-switch-banner">Kill switch is active — all copying paused.</div>
      )}

      <div className="t-settings-grid">
        {/* ── Risk Controls ── */}
        <section className="g-section t-settings-card">
          <div className="g-section-header">
            <h2 className="g-section-title">Risk Controls</h2>
            <span className="g-section-meta">Global governance</span>
          </div>
          <div className="t-form-body">
            <div className="t-form-row">
              <label htmlFor="kill-switch" className="t-form-label">Global kill switch</label>
              <div className="t-form-ctrl">
                <input
                  id="kill-switch"
                  type="checkbox"
                  className="t-checkbox"
                  checked={killSwitchActive}
                  onChange={(e) => toggleKillSwitch(e.target.checked)}
                />
                <span className={`t-switch-label${killSwitchActive ? ' t-switch-label--on' : ''}`}>
                  {killSwitchActive ? 'Active' : 'Standby'}
                </span>
              </div>
            </div>
            <div className="t-form-row">
              <label htmlFor="daily-loss" className="t-form-label">Daily loss limit</label>
              <div className="t-form-ctrl">
                <input
                  id="daily-loss"
                  type="number"
                  value={dailyLossLimit}
                  min="0"
                  onChange={(e) => setDailyLossLimit(Number(e.target.value))}
                  className="t-input"
                />
                <span className="t-form-unit">USD</span>
              </div>
            </div>
            <div className="t-form-row">
              <label htmlFor="exposure-cap" className="t-form-label">Per-trader exposure cap</label>
              <div className="t-form-ctrl">
                <input
                  id="exposure-cap"
                  type="number"
                  value={exposureCap}
                  min="0"
                  onChange={(e) => setExposureCap(Number(e.target.value))}
                  className="t-input"
                />
                <span className="t-form-unit">USD</span>
              </div>
            </div>
            <p className="g-dim" style={{ fontSize: 12, marginTop: 12 }}>
              These controls live in local state; can be synced to the engine once the risk service is wired.
            </p>
          </div>
        </section>

        {/* ── Account Clipboard ── */}
        <section className="g-section t-settings-card">
          <div className="g-section-header">
            <h2 className="g-section-title">Account Snapshot</h2>
            <span className="g-section-meta">Clipboard</span>
          </div>
          <div className="t-form-body">
            <div className="t-kv-row"><span className="t-kv-label">Polymarket account</span><span className="t-kv-val g-mono">{PROXY_WALLET || 'Not connected'}</span></div>
            <div className="t-kv-row"><span className="t-kv-label">Balance</span><span className="t-kv-val g-mono">{formatBalance(balance)}</span></div>
            <div className="t-kv-row"><span className="t-kv-label">Last sync</span><span className="t-kv-val g-dim">{lastSync || '—'}</span></div>
            <button type="button" className="t-btn" onClick={refreshBalance} disabled={loadingBalance}>
              {loadingBalance ? 'Refreshing…' : 'Refresh balance'}
            </button>
          </div>
        </section>

        {/* ── API Vault ── */}
        <section className="g-section t-settings-card">
          <div className="g-section-header">
            <h2 className="g-section-title">API Vault</h2>
            <span className="g-section-meta">Credential placeholders</span>
          </div>
          <div className="t-form-body">
            <div className="t-form-row">
              <label htmlFor="usdc-balance" className="t-form-label">USDC balance</label>
              <input id="usdc-balance" type="text" value="152,400 USDC" readOnly className="t-input t-input--readonly" />
            </div>
            <div className="t-form-row">
              <label htmlFor="api-key" className="t-form-label">Polymarket API key</label>
              <input id="api-key" type="password" value="••••••••••••••••" readOnly className="t-input t-input--readonly" />
            </div>
            <div className="t-form-row">
              <label htmlFor="proxy-wallet" className="t-form-label">Proxy wallet</label>
              <input id="proxy-wallet" type="text" value="0xProxyWalletDemo" readOnly className="t-input t-input--readonly" />
            </div>
          </div>
        </section>

        {/* ── Notes ── */}
        <section className="g-section t-settings-card">
          <div className="g-section-header">
            <h2 className="g-section-title">Execution Hints</h2>
          </div>
          <div className="t-form-body">
            <p className="g-dim" style={{ fontSize: 13, lineHeight: 1.6 }}>
              Commit these controls to your configuration store once a secure credential manager is ready.
              The kill switch and limits can be toggled via the trading engine with the same field names.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
