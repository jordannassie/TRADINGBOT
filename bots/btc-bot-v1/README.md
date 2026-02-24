# BTC Bot v1 — Dutch-Book Arbitrage

BTC-only Polymarket bot scanning for Dutch-book arbitrage opportunities on
"Bitcoin Up or Down" markets. Runs from your Terminal; logs all events to
Supabase for live dashboard display at `/btc`.

---

## Quick Start

```bash
# 1. Enter the bot directory
cd bots/btc-bot-v1

# 2. Install dependencies
npm install

# 3. Copy and fill in your .env
cp .env.example .env
#    → Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (from your Supabase project)
#    → Leave POLY_* empty until you want LIVE mode

# 4. Run in PAPER mode (safe, simulated)
npm run dev        # auto-restarts on file change (development)
npm run start      # one-shot run

# 5. Typecheck only
npm run typecheck
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `SUPABASE_URL` | ✅ | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Service role key (never expose to browser) |
| `POLY_API_KEY` | LIVE only | Polymarket CLOB API key |
| `POLY_API_SECRET` | LIVE only | Polymarket CLOB API secret |
| `POLY_API_PASSPHRASE` | LIVE only | Polymarket CLOB passphrase |
| `POLY_PROXY_WALLET` | LIVE only | Your proxy wallet address |
| `EXECUTION_ENABLED_DEFAULT` | optional | Set `true` to allow LIVE orders from env |

---

## Supabase Tables Required

Run this SQL in your Supabase SQL Editor to create the tables:

```sql
-- Config (single row)
create table if not exists btc_bot_config (
  id text primary key default 'default',
  mode text not null default 'PAPER',
  "executionEnabled" boolean not null default false,
  "killSwitch" boolean not null default true,
  "minEdge" numeric not null default 0.02,
  "feeBuffer" numeric not null default 0.01,
  "minShares" numeric not null default 50,
  "maxFillMs" integer not null default 1500,
  "maxUsdPerTrade" numeric not null default 25,
  "maxOpenUsdTotal" numeric not null default 200,
  "maxDailyLossUsd" numeric not null default 100,
  "maxTradesPerHour" integer not null default 60,
  "updatedAt" timestamp with time zone default now()
);

-- Runs
create table if not exists btc_bot_runs (
  id uuid primary key default gen_random_uuid(),
  "startedAt" timestamp with time zone default now(),
  status text default 'running',
  notes text
);

-- Events
create table if not exists btc_bot_events (
  id uuid primary key default gen_random_uuid(),
  "runId" uuid references btc_bot_runs(id),
  ts timestamp with time zone default now(),
  mode text,
  type text,
  market text,
  "yesAsk" numeric,
  "noAsk" numeric,
  sum numeric,
  "effectiveEdge" numeric,
  shares numeric,
  message text,
  meta jsonb
);

-- Allow anon reads (for dashboard) — adjust RLS as needed
alter table btc_bot_config enable row level security;
alter table btc_bot_runs enable row level security;
alter table btc_bot_events enable row level security;

create policy "anon read config" on btc_bot_config for select using (true);
create policy "anon read runs" on btc_bot_runs for select using (true);
create policy "anon read events" on btc_bot_events for select using (true);
```

---

## Switching to LIVE Mode

1. Set `POLY_*` env vars in `.env`
2. In Supabase dashboard (or via `/btc` controls): set `mode = LIVE` and `executionEnabled = true`
3. Disable the kill switch: `killSwitch = false`
4. Restart the bot

> ⚠️ The bot checks these config values every ~3 seconds, so dashboard changes apply quickly.

---

## Running Persistently with tmux

```bash
# Start a named session
tmux new-session -d -s btc-bot

# Run bot inside it
tmux send-keys -t btc-bot "cd /path/to/TRADINGBOT/bots/btc-bot-v1 && npm start" Enter

# Attach to watch output
tmux attach -t btc-bot

# Detach without stopping: Ctrl+B, then D
# Kill session: tmux kill-session -t btc-bot
```

---

## Strategy: Dutch-Book Arbitrage

On Polymarket binary markets, YES + NO probabilities should sum to 1.00 (minus fees).
When they sum to **less than 1.00**, a risk-free profit opportunity exists:

```
sum = yesAsk + noAsk
rawEdge = 1.00 - sum
effectiveEdge = rawEdge - feeBuffer   ← must be >= minEdge to trade
```

If `effectiveEdge >= minEdge`, the bot buys both YES and NO at their asks
for the same share count. Regardless of outcome, payout = 1.00 × shares
while cost = sum × shares, locking in `effectiveEdge × shares` profit.

### Partial-Fill Protection (critical safety)
If only one leg fills within `maxFillMs`:
1. Cancel the remaining order
2. Immediately sell the filled leg at best bid to flatten the position
3. If flatten fails → bot enters emergency halt (no further trades)

---

## Architecture

```
src/
├── index.ts          Entry point; startup + shutdown
├── types.ts          All shared TypeScript types
├── supabase.ts       Supabase client (service role)
├── config.ts         Config loader with safe defaults
├── logger.ts         Event writer to btc_bot_events
├── scanner.ts        BTC market filter + arb evaluator
├── riskGuard.ts      Hard-cap risk enforcement
├── runner.ts         Main event loop
└── broker/
    ├── interface.ts  Broker contract
    ├── simBroker.ts  PAPER broker (simulates fills)
    └── liveBroker.ts LIVE broker stub (wire up ClobClient)
```

---

## Live Broker Activation Status

**Currently: STUBBED.** The `LiveBroker` logs what it *would* do but does not
place real orders. Full instructions for wiring `ClobClient` are in
`src/broker/liveBroker.ts`. The `SimBroker` is fully functional.
