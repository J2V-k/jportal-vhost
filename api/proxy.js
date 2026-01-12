async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  try {
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, LocalName');
      return res.status(200).end();
    }

    const reqPath = req.url.split('?')[0];
    const pathAfterApi = reqPath.replace(/^\/api\//, '');
    
    if (!pathAfterApi) {
      return res.status(400).json({ error: 'No path specified' });
    }

    const backendBase = 'https://webportal.jiit.ac.in:6011';
    const backendUrl = backendBase + '/' + pathAfterApi;

    console.log('Proxying to:', backendUrl);

    const outboundHeaders = { ...req.headers };
    
    const headersToDelete = [
      'host',
      'connection',
      'transfer-encoding',
      'x-forwarded-for',
      'x-forwarded-proto',
      'x-forwarded-host',
      'x-vercel-forwarded-for',
      'x-real-ip',
      'cf-ray',
      'cf-connecting-ip'
    ];
    headersToDelete.forEach(h => delete outboundHeaders[h]);

    const method = req.method;
    let body = null;
    
    if (method !== 'GET' && method !== 'HEAD') {
      body = await getRawBody(req);
      if (body.length === 0) {
        body = null;
      }
    }

    const backendRes = await fetch(backendUrl, {
      method,
      headers: outboundHeaders,
      body: body,
      redirect: 'manual'
    });

    const arrayBuffer = await backendRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    backendRes.headers.forEach((value, key) => {
      const hopByHop = ['connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization', 'te', 'trailers', 'transfer-encoding', 'upgrade'];
      if (hopByHop.includes(key.toLowerCase())) return;
      res.setHeader(key, value);
    });

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, LocalName');

    res.status(backendRes.status).send(buffer);
  } catch (err) {
    console.error('Proxy error:', err);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(500).json({ error: 'Proxy error', details: err.message });
  }
}
