import 'dotenv/config';
import { loadConfig, ensureConfigRow } from './config.js';
import { createRun, finalizeRun, setRunContext } from './logger.js';
import { startRunner } from './runner.js';

async function main(): Promise<void> {
  console.log('=== BTC Bot v1 ===');
  console.log('Connecting to Supabase...');

  // Ensure config table has a default row on first run
  await ensureConfigRow();

  const cfg = await loadConfig();
  const runId = await createRun();

  setRunContext(runId, cfg.mode);

  console.log(`Run ID: ${runId}`);
  console.log(`Mode: ${cfg.mode}`);
  console.log(`Kill Switch: ${cfg.killSwitch}`);
  console.log(`Execution Enabled: ${cfg.executionEnabled}`);
  console.log('');

  if (cfg.mode === 'LIVE' && cfg.executionEnabled) {
    console.warn('⚠️  LIVE MODE + EXECUTION ENABLED — real orders will be placed!');
  } else {
    console.log('✅ PAPER mode or execution disabled — no real orders will be placed.');
  }

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`\n[${signal}] Shutting down...`);
    await finalizeRun(runId, 'stopped');
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  await startRunner(cfg);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
