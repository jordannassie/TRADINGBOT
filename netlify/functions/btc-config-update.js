// Netlify serverless function — safe server-side config writer.
// The service role key never touches the browser; it lives only in Netlify env vars.
//
// Required Netlify env vars (set in Netlify dashboard > Site settings > Env vars):
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//
// POST /api/btc-config-update
// Body JSON: { field: string, value: string | number | boolean }

import { createClient } from '@supabase/supabase-js';

const ALLOWED_FIELDS = new Set([
  'mode',
  'executionEnabled',
  'killSwitch',
  'minEdge',
  'feeBuffer',
  'minShares',
  'maxUsdPerTrade',
]);

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server not configured (missing Supabase env vars).' }),
    };
  }

  let body;
  try {
    body = JSON.parse(event.body ?? '{}');
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON body.' }) };
  }

  const { field, value } = body;

  if (!field || !ALLOWED_FIELDS.has(field)) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: `Field "${field}" is not allowed.` }),
    };
  }

  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  const { error } = await supabase
    .from('btc_bot_config')
    .update({ [field]: value, updatedAt: new Date().toISOString() })
    .eq('id', 'default');

  if (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ ok: true, field, value }),
  };
};
