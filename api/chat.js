import { put, list, del } from '@vercel/blob';

export const config = { api: { bodyParser: true } };

async function readBlob(prefix) {
  try {
    const { blobs } = await list({ prefix });
    if (blobs.length === 0) return null;
    // Prendre le plus récent
    const blob = blobs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))[0];
    const response = await fetch(blob.url, { cache: 'no-store' });
    if (!response.ok) return null;
    // Nettoyer les anciens blobs
    if (blobs.length > 1) {
      for (const old of blobs.slice(1)) {
        try { await del(old.url); } catch(e) {}
      }
    }
    return await response.json();
  } catch(e) { return null; }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
      const messages = await readBlob('chat-messages');
      return res.status(200).json(messages || []);
    }

    if (req.method === 'POST') {
      const { profile, text } = req.body;
      if (!profile || !text) return res.status(400).json({ error: 'profile et text requis' });

      let messages = (await readBlob('chat-messages')) || [];
      messages.push({ profile, text, ts: Date.now() });
      if (messages.length > 500) messages = messages.slice(-500);

      await put('chat-messages.json', JSON.stringify(messages), {
        access: 'public',
        contentType: 'application/json',
      });

      return res.status(200).json({ ok: true, count: messages.length });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    return res.status(500).json({ error: e.message, stack: e.stack });
  }
}
