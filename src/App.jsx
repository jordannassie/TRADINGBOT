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
import { CopyListProvider } from './context/CopyListContext.jsx';
import { TradeFeedProvider } from './context/TradeFeedContext.tsx';
import { UIProvider } from './context/UIContext.jsx';

const navItems = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/btc', label: 'BTC Bot' },
  { path: '/strategy', label: 'Strategy' },
  { path: '/traders', label: 'Traders' },
  { path: '/markets', label: 'Markets' },
  { path: '/signals', label: 'Signals' },
  { path: '/results', label: 'Results' },
  { path: '/settings', label: 'Settings' },
];

export default function App() {
  return (
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
          <Route path="/results" element={<Results />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Layout>
      </UIProvider>
      </TradeFeedProvider>
    </CopyListProvider>
  );
}
