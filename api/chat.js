import { put, list, head } from '@vercel/blob';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const BLOB_KEY = 'chat/messages.json';

  try {
    if (req.method === 'GET') {
      // Lire les messages
      const { blobs } = await list({ prefix: 'chat/' });
      const blob = blobs.find(b => b.pathname === BLOB_KEY);
      if (!blob) return res.status(200).json([]);
      const response = await fetch(blob.url);
      const messages = await response.json();
      return res.status(200).json(messages);
    }

    if (req.method === 'POST') {
      // Lire les messages existants
      let messages = [];
      const { blobs } = await list({ prefix: 'chat/' });
      const blob = blobs.find(b => b.pathname === BLOB_KEY);
      if (blob) {
        const response = await fetch(blob.url);
        messages = await response.json();
      }

      // Ajouter le nouveau message
      const { profile, text } = req.body;
      if (!profile || !text) return res.status(400).json({ error: 'profile et text requis' });

      messages.push({ profile, text, ts: Date.now() });

      // Garder les 500 derniers messages max
      if (messages.length > 500) messages = messages.slice(-500);

      // Sauvegarder
      await put(BLOB_KEY, JSON.stringify(messages), {
        access: 'public',
        contentType: 'application/json',
        addRandomSuffix: false,
      });

      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
