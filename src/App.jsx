import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Strategy from './pages/Strategy.jsx';
import Traders from './pages/Traders.jsx';
import Markets from './pages/Markets.jsx';
import Signals from './pages/Signals.jsx';
import Results from './pages/Results.jsx';
import Settings from './pages/Settings.jsx';
import BtcBot from './pages/BtcBot.jsx';
import Profile from './pages/Profile.jsx';
import { CopyListProvider } from './context/CopyListContext.jsx';
import { TradeFeedProvider } from './context/TradeFeedContext.tsx';
import { UIProvider } from './context/UIContext.jsx';

const navItems = [
  { path: '/dashboard', label: 'Control Center' },
  { path: '/profile', label: 'Profile' },
  { path: '/results', label: 'Results' },
  { path: '/settings', label: 'Settings' },
];

class AppErrorBoundary extends React.Component {
  state = { hasError: false, error: null, info: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    this.setState({ info });
    console.error('AppErrorBoundary caught', error, info);
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }
    return (
      <div className="page-stack control-center">
        <div className="t-page-header">
          <div>
            <span className="t-eyebrow">App Error</span>
            <h1 className="t-page-title">Something crashed</h1>
            <p>Something crashed. See details below.</p>
          </div>
        </div>
        <pre className="t-error-pre">
          {this.state.error?.message || 'Unknown error'}
          {this.state.info?.componentStack ? `\n\nComponent stack:\n${this.state.info.componentStack}` : ''}
        </pre>
        <button type="button" className="poly-pill" onClick={() => window.location.reload()}>
          Reload
        </button>
      </div>
    );
  }
}

export default function App() {
  return (
    <AppErrorBoundary>
      <CopyListProvider>
        <TradeFeedProvider>
          <UIProvider>
            <Layout navItems={navItems}>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/btc" element={<BtcBot />} />
                <Route path="/strategy" element={<Strategy />} />
                <Route path="/traders" element={<Traders />} />
                <Route path="/markets" element={<Markets />} />
                <Route path="/signals" element={<Signals />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/results" element={<Results />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Layout>
          </UIProvider>
        </TradeFeedProvider>
      </CopyListProvider>
    </AppErrorBoundary>
  );
}
