/**
 * npm run test:live
 *
 * Verifies required env vars, fetches live BTC markets, prints top-of-book.
 * Does NOT place any orders.
 */
import 'dotenv/config';
import { fetchBtcMarkets, fetchMarketOrderbook } from './scanner.js';

const REQUIRED_ENV: string[] = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'VITE_POLY_API_KEY',
  'VITE_POLY_API_SECRET',
  'VITE_POLY_API_PASSPHRASE',
  'VITE_POLY_PROXY_WALLET',
];

function checkEnv(): boolean {
  let ok = true;
  for (const key of REQUIRED_ENV) {
    const val = process.env[key];
    if (!val) {
      console.error(`  ✗ ${key} — MISSING`);
      ok = false;
    } else {
      const masked = val.length > 8 ? `${val.slice(0, 4)}…${val.slice(-4)}` : '****';
      console.log(`  ✓ ${key} = ${masked}`);
    }
  }
  return ok;
}

async function main(): Promise<void> {
  console.log('\n=== BTC Bot v1 — Live Test (dry-run) ===\n');

  console.log('1) Checking environment variables…');
  const envOk = checkEnv();
  if (!envOk) {
    console.error('\nFailed: one or more required env vars are missing.');
    console.error('Copy .env.example to .env and fill in all values.\n');
    process.exit(1);
  }

  console.log('\n2) Fetching BTC markets from Polymarket CLOB…');
  let markets;
  try {
    markets = await fetchBtcMarkets();
  } catch (err) {
    console.error('\nFailed to fetch markets:', err);
    process.exit(1);
  }

  if (markets.length === 0) {
    console.log('No BTC markets found matching filter ("Bitcoin Up or Down").');
    console.log('This is normal when no short-duration markets are currently open.');
  } else {
    console.log(`Found ${markets.length} BTC market(s):\n`);
    for (const market of markets) {
      console.log(`  Market: ${market.question}`);
      console.log(`  Condition ID: ${market.condition_id}`);

      const ob = await fetchMarketOrderbook(market);
      if (!ob) {
        console.log('  Orderbook: unavailable\n');
        continue;
      }

      const yesAsk = ob.yesBestAsk;
      const noAsk = ob.noBestAsk;
      const sum = (yesAsk?.price ?? 0) + (noAsk?.price ?? 0);
      const rawEdge = 1.0 - sum;

      console.log(`  YES best ask: ${yesAsk ? `${yesAsk.price} (size ${yesAsk.size})` : 'none'}`);
      console.log(`  NO  best ask: ${noAsk ? `${noAsk.price} (size ${noAsk.size})` : 'none'}`);
      console.log(`  Sum: ${sum.toFixed(4)}  Raw edge: ${(rawEdge * 100).toFixed(3)}%`);
      if (rawEdge > 0) {
        console.log(`  → Potential arb opportunity (check minEdge / feeBuffer in config)`);
      } else {
        console.log(`  → No arb (sum ≥ 1.00)`);
      }
      console.log('');
    }
  }

  console.log('3) No orders placed — this is a dry-run test.\n');
  console.log('✅ Test complete. Bot credentials and scanner are working.\n');
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
