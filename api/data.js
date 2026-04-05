import { put, list, del } from '@vercel/blob';

export const config = { api: { bodyParser: true } };

async function readBlob(prefix) {
  try {
    const { blobs } = await list({ prefix });
    if (blobs.length === 0) return null;
    const blob = blobs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))[0];
    const response = await fetch(blob.url, { cache: 'no-store' });
    if (!response.ok) return null;
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

  const { profile, key } = req.query;
  if (!profile || !key) return res.status(400).json({ error: 'profile et key requis' });

  const blobPrefix = `data-${profile}-${key}`;

  try {
    if (req.method === 'GET') {
      const data = await readBlob(blobPrefix);
      return res.status(200).json(data || (key === 'notes' ? {} : []));
    }

    if (req.method === 'POST') {
      const { value } = req.body;
      await put(`${blobPrefix}.json`, JSON.stringify(value), {
        access: 'public',
        contentType: 'application/json',
      });
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    return res.status(500).json({ error: e.message, stack: e.stack });
  }
}
