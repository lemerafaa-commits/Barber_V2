import { handleNotificationRequest } from '../../src/services/notifications/serverHandler';

/**
 * Vercel Serverless Function for WhatsApp appointment confirmation.
 * Endpoint: POST /api/whatsapp/confirmation
 */
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    if (typeof res.setHeader === 'function') {
      res.setHeader('Allow', ['POST']);
    }
    if (typeof res.status === 'function' && typeof res.json === 'function') {
      return res.status(405).json({ error: 'Método não permitido. Utilize POST.' });
    }
    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'Método não permitido. Utilize POST.' }));
    return;
  }

  let payload = req.body;
  if (typeof payload === 'string') {
    try {
      payload = JSON.parse(payload);
    } catch {
      payload = {};
    }
  }

  const result = await handleNotificationRequest(payload);

  if (typeof res.status === 'function' && typeof res.json === 'function') {
    return res.status(result.status).json(result.body);
  }

  res.statusCode = result.status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(result.body));
}
