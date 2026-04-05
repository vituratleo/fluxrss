import { put, list } from '@vercel/blob';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { profile, key } = req.query;
  if (!profile || !key) return res.status(400).json({ error: 'profile et key requis' });

  const BLOB_KEY = `data/${profile}/${key}.json`;

  try {
    if (req.method === 'GET') {
      const { blobs } = await list({ prefix: `data/${profile}/` });
      const blob = blobs.find(b => b.pathname === BLOB_KEY);
      if (!blob) return res.status(200).json(key === 'notes' ? {} : []);
      const response = await fetch(blob.url);
      const data = await response.json();
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      const { value } = req.body;
      await put(BLOB_KEY, JSON.stringify(value), {
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
