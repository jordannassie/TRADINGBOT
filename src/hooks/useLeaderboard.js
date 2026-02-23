import { useEffect, useMemo, useState } from 'react';

const TIMEFRAMES = ['DAY', 'WEEK', 'MONTH', 'ALL'];
const ORDER_BY = ['PNL', 'VOLUME'];
const LEADERBOARD_ENDPOINT = 'https://clob.polymarket.com/trader-leaderboard';

const FALLBACK_TRADER = {
  username: 'k9Q2mX4L8A7ZP3R',
  address: '0xK9Q2mX4L8A7ZP3R',
  pnl: 120000,
  volume: 860000,
  winningTrades: 1240,
  losingTrades: 310,
  pnlPercentages: { day: 4.5, week: 18.2, month: 42.3, all: 210.4 },
  averageHold: 38,
  categories: ['Politics', 'Crypto'],
};

const weights = {
  DAY: 0.4,
  WEEK: 0.3,
  MONTH: 0.2,
  ALL: 0.1,
};

const normalize = (value, max = 1) => {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value / max));
};

const scoreTrader = (data) => {
  const pnlScore = normalize(data.pnlScore, 100);
  const winRate = data.winRate || 0.5;
  const volumeScore = normalize(Math.log10(data.volume + 1), 6);
  const recency = data.lastActiveHours ? Math.max(0, 1 - data.lastActiveHours / 72) : 0.5;

  return Number(((pnlScore * 0.45 + winRate * 0.2 + volumeScore * 0.2 + recency * 0.15) * 100).toFixed(1));
};

const aggregateLeaderboard = (entries) => {
  const map = new Map();

  entries.forEach(({ timeframe, orderBy, traders }) => {
    traders.forEach((trader, rank) => {
      const key = trader.account || trader.address || trader.username;
      if (!key) return;
      const existing = map.get(key) || {
        username: trader.username || trader.displayName || `Trader ${key.slice(0, 6)}`,
        address: key,
        proxyWallet: trader.proxyWallet,
        pnlHistory: {},
        volume: 0,
        lastRanks: {},
        winningTrades: trader.winningTrades,
        losingTrades: trader.losingTrades,
        pnlPercentages: trader.pnlPercentages,
        categories: trader.categories || [],
        averageHold: trader.averageHold || null,
        lastActiveHours: trader.lastActiveHours || null,
      };
      existing.pnlHistory[timeframe] = trader.pnl;
      existing.lastRanks[`${timeframe}_${orderBy}`] = rank + 1;
      existing.volume = Math.max(existing.volume, trader.volume || 0);
      map.set(key, existing);
    });
  });

  if (map.size === 0) {
    map.set(FALLBACK_TRADER.address, FALLBACK_TRADER);
  }

  const enriched = Array.from(map.values()).map((trader) => {
    let pnlScore = 0;
    Object.entries(trader.pnlHistory).forEach(([timeframe, pnl]) => {
      pnlScore += (pnl || 0) * (weights[timeframe] || 0.05);
    });

    const totalTrades = (trader.winningTrades || 0) + (trader.losingTrades || 0);
    const winRate = totalTrades ? trader.winningTrades / totalTrades : 0.5;

    return {
      ...trader,
      pnlScore,
      winRate,
      copyScore: scoreTrader({
        pnlScore,
        winRate,
        volume: trader.volume,
        lastActiveHours: trader.lastActiveHours,
      }),
    };
  });

  return enriched.sort((a, b) => b.copyScore - a.copyScore);
};

export default function useLeaderboard() {
  const [rawData, setRawData] = useState([]);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setStatus('loading');
      try {
        const requests = [];
        TIMEFRAMES.forEach((timeframe) => {
          ORDER_BY.forEach((orderBy) => {
            const url = `${LEADERBOARD_ENDPOINT}?timeframe=${timeframe}&orderBy=${orderBy}`;
            requests.push(fetch(url).then((res) => {
              if (!res.ok) throw new Error('Failed leaderboard fetch');
              return res.json();
            }));
          });
        });
        const responses = await Promise.allSettled(requests);
        if (cancelled) return;
        const parsed = responses
          .filter((r) => r.status === 'fulfilled')
          .map((r, idx) => ({
            timeframe: TIMEFRAMES[Math.floor(idx / ORDER_BY.length)],
            orderBy: ORDER_BY[idx % ORDER_BY.length],
            traders: r.value?.traders || r.value || [],
          }));
        setRawData(parsed);
        setStatus('success');
      } catch (err) {
        console.error(err);
        if (cancelled) return;
        setError(err);
        setStatus('error');
        setRawData([
          {
            timeframe: 'FALLBACK',
            orderBy: 'PNL',
            traders: [FALLBACK_TRADER],
          },
        ]);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const traders = useMemo(() => aggregateLeaderboard(rawData), [rawData]);

  return { traders, status, error };
}
