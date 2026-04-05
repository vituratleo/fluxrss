import { put, list } from '@vercel/blob';

export default async function handler(req, res) {
  try {
    // Test écriture
    const blob = await put('test.json', JSON.stringify({ test: true, time: Date.now() }), {
      access: 'public',
      contentType: 'application/json',
    });

    // Test lecture
    const { blobs } = await list({ prefix: 'test' });

    // Test fetch du blob
    const response = await fetch(blob.url, { cache: 'no-store' });
    const data = await response.json();

    return res.status(200).json({
      ok: true,
      write: blob.url,
      list_count: blobs.length,
      read: data,
      env_set: !!process.env.BLOB_READ_WRITE_TOKEN
    });
  } catch(e) {
    return res.status(500).json({
      ok: false,
      error: e.message,
      env_set: !!process.env.BLOB_READ_WRITE_TOKEN
    });
  }
}
