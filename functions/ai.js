const https = require('https');

exports.handler = async function(event) {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: cors, body: '' };
  try {
    const body = JSON.parse(event.body || '{}');
    const apiKey = body.apiKey || '';
    if (!apiKey) return { statusCode: 401, headers: cors, body: JSON.stringify({ error: 'No API key' }) };
    const requestBody = JSON.stringify({
      model: body.model || 'claude-sonnet-4-20250514',
      max_tokens: body.max_tokens || 700,
      system: body.system || '',
      messages: body.messages || []
    });
    const result = await new Promise((resolve, reject) => {
      const req = https.request({
        hostname: 'api.anthropic.com',
        path: '/v1/messages',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Length': Buffer.byteLength(requestBody)
        }
      }, (res) => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(data) }));
      });
      req.on('error', reject);
      req.write(requestBody);
      req.end();
    });
    return { statusCode: result.status, headers: cors, body: JSON.stringify(result.body) };
  } catch (e) {
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: e.message }) };
  }
};

