#!/usr/bin/env node

const MIN_COPY_SCORE = Number(process.env.MIN_COPY_SCORE ?? 85);
const LIQUIDITY_THRESHOLD = 50000;
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

const buildReason = ({ score, liquidity, combinedPrice }) => {
  if (liquidity < LIQUIDITY_THRESHOLD) return 'Liquidity too thin';
  if (combinedPrice >= 1) return 'Combined price ≥ 1';
  if (score < MIN_COPY_SCORE) return 'CopyScore below threshold';
  return 'Meets criteria';
};

const main = async () => {
  console.log('Starting copy simulation...');
  const leaderboard = await fetchJson(LEADERBOARD_URL);
  const markets = await fetchJson(MARKETS_URL);

  const traders = leaderboard?.traders || leaderboard?.data || [];
  const topTraders = traders.slice(0, 6);
  let eligibleCount = 0;
  let skippedCount = 0;

  console.log('\nTracked open markets:');
  (markets?.markets || []).slice(0, 4).forEach((market) => {
    console.log(`- ${market.title} (${market.marketType})`);
  });

  console.log('\nCopy decisions:');
  topTraders.forEach((trader) => {
    const score = trader.copyScore ?? trader.performance?.copyScore ?? 0;
    const liquidity = trader.volume || trader.tradeVolume || 0;
    const yesPrice = trader.yesPrice ?? trader.price ?? 0;
    const noPrice = trader.noPrice ?? 0;
    const combinedPrice = yesPrice + noPrice;
    const shouldCopy =
      score >= MIN_COPY_SCORE && liquidity >= LIQUIDITY_THRESHOLD && combinedPrice < 1;
    const reason = buildReason({ score, liquidity, combinedPrice });
    const marketName = trader.favoriteMarkets?.[0] || 'n/a';
    if (shouldCopy) {
      eligibleCount += 1;
      console.log(
        `✅ Copying ${formatTrader(trader)}: market ${marketName}, price sum ${combinedPrice.toFixed(
          2,
        )}`,
      );
    } else {
      skippedCount += 1;
      console.log(`⚠️ Skipping ${formatTrader(trader)}: ${reason}`);
    }
  });

  console.log(
    `\nSummary: scanned ${topTraders.length} traders — ${eligibleCount} eligible, ${skippedCount} skipped.`,
  );
};

main().catch((error) => {
  console.error('Copy simulation failed', error);
  process.exit(1);
});
