import { NavLink } from 'react-router-dom';

export default function Layout({ navItems, children }) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true"></div>
          <div>
            <p className="brand-title">TradingBotBoom</p>
            <p className="brand-subtitle">Polymarket copy engine</p>
          </div>
        </div>
        <nav>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                isActive ? 'nav-pill active' : 'nav-pill'
              }
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
