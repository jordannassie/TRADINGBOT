import { NavLink } from 'react-router-dom';
import { useState } from 'react';

export default function Layout({ navItems, children }) {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button
          className="mobile-nav-toggle"
          onClick={() => setNavOpen((prev) => !prev)}
        >
          {navOpen ? 'Close menu' : 'Menu'}
        </button>
        <div className="brand">
          <div className="brand-mark" aria-hidden="true"></div>
          <div>
            <p className="brand-title">TradingBotBoom</p>
            <p className="brand-subtitle">Polymarket copy engine</p>
          </div>
        </div>
        <nav className={`nav-menu ${navOpen ? 'open' : ''}`}>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                isActive ? 'nav-pill active' : 'nav-pill'
              }
              onClick={() => setNavOpen(false)}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
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
      <main className="main-content">{children}</main>
    </div>
  );
}
