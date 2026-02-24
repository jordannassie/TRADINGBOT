import { NavLink } from 'react-router-dom';
import { useState } from 'react';
import { useCopyList } from '../context/CopyListContext.jsx';
import { useUI } from '../context/UIContext.jsx';

// ─── Global sticky control bar (rendered inside every page) ───────────────────
function TopControlBar() {
  const { strategyView, setStrategyView, execView, setExecView } = useUI();
  const { state } = useCopyList();
  const killSwitchActive = state.riskControls?.killSwitchActive;

  return (
    <div className="t-control-bar">
      <div className="t-control-left">
        <div className="t-toggle-group">
          <button
            className={`t-toggle${strategyView === 'copy' ? ' t-toggle--on' : ''}`}
            onClick={() => setStrategyView('copy')}
          >
            Copy Trading
          </button>
          <button
            className={`t-toggle${strategyView === 'arb' ? ' t-toggle--on' : ''}`}
            onClick={() => setStrategyView('arb')}
          >
            Arbitrage
          </button>
        </div>
        <div className="t-toggle-group">
          <button
            className={`t-toggle${execView === 'paper' ? ' t-toggle--on' : ''}`}
            onClick={() => setExecView('paper')}
          >
            Paper
          </button>
          <button
            className={`t-toggle t-toggle--live${execView === 'live' ? ' t-toggle--on-live' : ''}`}
            onClick={() => setExecView('live')}
          >
            Live
          </button>
        </div>
        <span className="t-view-pill">
          {strategyView === 'copy' ? 'COPY' : 'ARB'} • {execView === 'paper' ? 'PAPER' : 'LIVE'}
        </span>
      </div>
      <div className="t-control-right">
        <span className={`t-status-dot${killSwitchActive ? ' t-status-dot--halt' : ' t-status-dot--ok'}`} />
        <span className="t-status-label">
          {killSwitchActive ? 'Kill Switch ON' : 'Connected'}
        </span>
      </div>
    </div>
  );
}

// ─── Layout shell ─────────────────────────────────────────────────────────────
export default function Layout({ navItems, children }) {
  const [navOpen, setNavOpen] = useState(false);
  const renderNavLinks = (items, { onClick } = {}) =>
    items.map((item) => (
      <NavLink
        key={item.path}
        to={item.path}
        className={({ isActive }) => (isActive ? 'nav-pill active' : 'nav-pill')}
        onClick={() => { if (onClick) onClick(); }}
      >
        {item.label}
      </NavLink>
    ));

  return (
    <>
      <div className="app-shell">
        {/* ── Sidebar ── */}
        <aside className="sidebar">
          <div className="brand">
            <div className="brand-mark" aria-hidden="true" />
            <div>
              <p className="brand-title">TradingBotBoom</p>
              <p className="brand-subtitle">Polymarket copy engine</p>
            </div>
          </div>
          <nav className="nav-menu desktop-nav">{renderNavLinks(navItems)}</nav>
          <div className="sidebar-manager">
            <img src="/nick-profile.jpg" alt="Nick Cross" />
            <div>
              <p className="eyebrow">Operator</p>
              <p className="brand-title">Nick Cross</p>
              <p className="brand-subtitle">Copy strategy lead</p>
            </div>
          </div>
          <div className="sidebar-footer">
            <p>Next deploy</p>
            <p className="mono">Netlify · Polymarket 19</p>
          </div>
        </aside>

        {/* ── Main ── */}
        <main className="main-content">
          {/* Operator banner — keeps Nick's avatar/name per brand requirement */}
          <section className="operator-banner">
            <img src="/nick-profile.jpg" alt="Nick Cross" />
            <div>
              <p className="eyebrow">Operator</p>
              <h2>Nick Cross</h2>
              <p className="fine">Copy strategy lead · Running live execution</p>
            </div>
            <button className="mobile-nav-button" onClick={() => setNavOpen(true)}>
              Menu
            </button>
          </section>

          {/* Global sticky control strip (strategy / exec / status) */}
          <TopControlBar />

          {children}
        </main>
      </div>

      {/* Mobile nav overlay */}
      <div
        className={`mobile-nav-backdrop ${navOpen ? 'visible' : ''}`}
        onClick={() => setNavOpen(false)}
      />
      <div className={`mobile-nav-drawer ${navOpen ? 'open' : ''}`}>
        <div className="mobile-nav-header">
          <div className="brand">
            <div className="brand-mark" aria-hidden="true" />
            <div>
              <p className="brand-title">TradingBotBoom</p>
              <p className="brand-subtitle">Polymarket copy engine</p>
            </div>
          </div>
          <button
            className="mobile-nav-close"
            onClick={() => setNavOpen(false)}
            aria-label="Close navigation"
          >
            Close
          </button>
        </div>
        <nav className="nav-menu mobile-nav">
          {renderNavLinks(navItems, { onClick: () => setNavOpen(false) })}
        </nav>
      </div>
    </>
  );
}
