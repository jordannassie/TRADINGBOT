import { useCopyList } from '../context/CopyListContext.jsx';

export default function Settings() {
  const {
    state: { riskControls },
    toggleKillSwitch,
    setDailyLossLimit,
    setExposureCap,
  } = useCopyList();
  const { killSwitchActive, dailyLossLimit, exposureCap } = riskControls;

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
