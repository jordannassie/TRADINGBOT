import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Traders from './pages/Traders.jsx';
import Markets from './pages/Markets.jsx';
import Signals from './pages/Signals.jsx';
import Results from './pages/Results.jsx';
import Settings from './pages/Settings.jsx';
import { CopyListProvider } from './context/CopyListContext.jsx';

const navItems = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/traders', label: 'Traders' },
  { path: '/markets', label: 'Markets' },
  { path: '/signals', label: 'Signals' },
  { path: '/results', label: 'Results' },
  { path: '/settings', label: 'Settings' },
];

export default function App() {
  return (
    <CopyListProvider>
      <Layout navItems={navItems}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/traders" element={<Traders />} />
          <Route path="/markets" element={<Markets />} />
          <Route path="/signals" element={<Signals />} />
          <Route path="/results" element={<Results />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Layout>
    </CopyListProvider>
  );
}
