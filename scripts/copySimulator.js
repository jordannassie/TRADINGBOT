#!/usr/bin/env node

const MIN_COPY_SCORE = Number(process.env.MIN_COPY_SCORE ?? 85);
const LEADERBOARD_URL = 'https://clob.polymarket.com/trader-leaderboard?timeframe=MONTH&orderBy=PNL';
const MARKETS_URL = 'https://clob.polymarket.com/markets?status=OPEN&perPage=6';

const fetchJson = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed request to ${url} (${response.status})`);
  }
  return response.json();
};

const formatTrader = (trader) => {
  const name = trader.username || trader.displayName || trader.account || 'unknown';
  const score = trader.copyScore ?? trader.performance?.copyScore ?? 0;
  return `${name} (${score.toFixed ? score.toFixed(1) : score})`;
};

const main = async () => {
  console.log('Starting copy simulation...');
  const leaderboard = await fetchJson(LEADERBOARD_URL);
  const markets = await fetchJson(MARKETS_URL);

  const traders = leaderboard?.traders || leaderboard?.data || [];
  const topTraders = traders.slice(0, 6);

  console.log('\nTracked open markets:');
  (markets?.markets || []).slice(0, 4).forEach((market) => {
    console.log(`- ${market.title} (${market.marketType})`);
  });

  console.log('\nCopy decisions:');
  topTraders.forEach((trader) => {
    const score = trader.copyScore ?? trader.performance?.copyScore ?? 0;
    const shouldCopy = score >= MIN_COPY_SCORE;
    const action = shouldCopy ? 'COPY' : 'SKIP';
    const reason = shouldCopy
      ? 'Strong CopyScore'
      : 'Score below threshold';
    console.log(
      `[${action}] ${formatTrader(trader)}: ${reason} · volume ${(
        trader.volume || trader.tradeVolume ||
        0
      ).toLocaleString()} · market ${trader.favoriteMarkets?.[0] || 'n/a'}`,
    );
  });
};

main().catch((error) => {
  console.error('Copy simulation failed', error);
  process.exit(1);
});
