import { put, list } from '@vercel/blob';

export default async function handler(req, res) {
  try {
    const blob = await put('test.json', JSON.stringify({ test: true, time: Date.now() }), {
      access: 'public',
      contentType: 'application/json',
    });

    const { blobs } = await list({ prefix: 'test' });
    const response = await fetch(blob.downloadUrl, { cache: 'no-store' });
    const data = await response.json();

    return res.status(200).json({ ok: true, read: data, blobs: blobs.length });
  } catch(e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
}
