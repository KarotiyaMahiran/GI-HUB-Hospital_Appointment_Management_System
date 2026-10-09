exports.handler = async (event) => {
  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) {
    return jsonResponse(500, { message: 'Set BACKEND_URL in the Netlify site environment.' });
  }

  let backend;
  try {
    backend = new URL(backendUrl);
  } catch {
    return jsonResponse(500, { message: 'BACKEND_URL must be a valid HTTPS URL.' });
  }
  if (backend.protocol !== 'https:') {
    return jsonResponse(500, { message: 'BACKEND_URL must use HTTPS.' });
  }

  const path = event.queryStringParameters?.path;
  if (!path || path.split('/').some((part) => part === '..')) {
    return jsonResponse(400, { message: 'Invalid API path.' });
  }

  const target = new URL(`/api/${path}`, backend.origin);
  const headers = Object.fromEntries(
    Object.entries(event.headers || {}).filter(([name]) =>
      !['host', 'connection', 'content-length', 'transfer-encoding'].includes(name.toLowerCase())
    )
  );
  const body = event.body
    ? event.isBase64Encoded
      ? Buffer.from(event.body, 'base64')
      : event.body
    : undefined;

  try {
    const response = await fetch(target, {
      method: event.httpMethod,
      headers,
      body: ['GET', 'HEAD'].includes(event.httpMethod) ? undefined : body,
      redirect: 'manual'
    });
    return {
      statusCode: response.status,
      headers: {
        'cache-control': 'no-store',
        'content-type': response.headers.get('content-type') || 'application/json'
      },
      body: response.status === 204 ? '' : await response.text()
    };
  } catch {
    return jsonResponse(502, { message: 'Could not reach the application backend.' });
  }
};

function jsonResponse(statusCode, data) {
  return {
    statusCode,
    headers: { 'cache-control': 'no-store', 'content-type': 'application/json' },
    body: JSON.stringify(data)
  };
}
