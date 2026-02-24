import { NavLink } from 'react-router-dom';
import { useState } from 'react';
import { useCopyList } from '../context/CopyListContext.jsx';

const supabaseConfigured =
  Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);

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

          {!supabaseConfigured && (
            <div className="env-warning-banner">
              Supabase env vars are missing — set <code>VITE_SUPABASE_URL</code> and{' '}
              <code>VITE_SUPABASE_ANON_KEY</code> in Netlify to enable the dashboard data.
            </div>
          )}

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
