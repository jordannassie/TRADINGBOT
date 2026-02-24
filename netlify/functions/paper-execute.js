import { logActivity, placeOrderPaper } from '../../src/services/paperBroker.js';

const parseBody = (body) => {
  try {
    return JSON.parse(body || '{}');
  } catch {
    return {};
  }
};

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  const { intent, detection } = parseBody(event.body);
  if (!intent) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing intent payload.' }),
    };
  }

  const strategyMode = intent?.strategyMode ?? 'COPY';
  try {
    if (detection) {
      await logActivity(
        'COPY_DETECTED',
        'Copy engine detected trader activity.',
        {
          ...detection,
        },
        strategyMode,
      );
    }

    const result = await placeOrderPaper(intent);
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, result }),
    };
  } catch (error) {
    await logActivity('ERROR', 'Paper execute failed', { error: String(error), intent, detection }, strategyMode);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error?.message ?? 'Internal error' }),
    };
  }
};
