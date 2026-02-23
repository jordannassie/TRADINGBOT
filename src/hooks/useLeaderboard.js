import { useEffect, useState } from 'react';
import { demoTraders } from '../data/demoTraders.js';
import { fetchTopTraderProfiles } from '../services/polymarket';

const FALLBACK_TRADERS = demoTraders.map((demo) => ({
  username: demo.username,
  address: demo.address,
  copyScore: demo.copyScore,
  categories: demo.categories,
  summary: demo.summary,
  status: 'Candidate',
  favoriteMarkets: [],
  stats: {
    pnl7d: demo.pnlHistory?.DAY ?? 0,
    pnl30d: demo.pnlHistory?.MONTH ?? 0,
    pnlAll: demo.pnlHistory?.ALL ?? 0,
    volume: demo.volume ?? 0,
  },
  polymarketUrl: `https://polymarket.com/@${demo.username}`,
}));

const normalizeProfile = (profile) => ({
  username: profile.handle,
  address: profile.address,
  copyScore: profile.copyScore,
  categories: profile.categories,
  summary: profile.summary,
  status: ['Candidate', 'Vetted', 'Active'].includes(profile.status)
    ? profile.status
    : 'Candidate',
  favoriteMarkets: profile.favoriteMarkets || [],
  stats: profile.stats || {
    pnl7d: 0,
    pnl30d: 0,
    pnlAll: 0,
    volume: 0,
  },
  polymarketUrl: profile.profileUrl || `https://polymarket.com/@${profile.handle}`,
});

export default function useLeaderboard() {
  const [traders, setTraders] = useState(FALLBACK_TRADERS);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadTraders() {
      setStatus('loading');
      try {
        const profiles = await fetchTopTraderProfiles();
        if (cancelled) return;
        const normalized = profiles
          .map(normalizeProfile)
          .sort((a, b) => b.copyScore - a.copyScore);
        setTraders(normalized);
        setStatus('success');
      } catch (err) {
        console.error('Unable to load leaderboard', err);
        if (cancelled) return;
        setError(err);
        setStatus('error');
        setTraders(FALLBACK_TRADERS);
      }
    }

    loadTraders();

    return () => {
      cancelled = true;
    };
  }, []);

  return { traders, status, error };
}
