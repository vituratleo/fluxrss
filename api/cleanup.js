import { list, del } from '@vercel/blob';

export default async function handler(req, res) {
  try {
    let deleted = 0;
    let cursor;

    // Supprimer les blobs de test
    do {
      const result = await list({ prefix: 'test', cursor, limit: 100 });
      for (const blob of result.blobs) {
        await del(blob.url);
        deleted++;
      }
      cursor = result.hasMore ? result.cursor : null;
    } while (cursor);

    // Nettoyer les anciens doublons dans chat et data
    for (const prefix of ['chat-messages', 'data-']) {
      const result = await list({ prefix, limit: 1000 });
      // Grouper par préfixe de pathname (avant le suffixe aléatoire)
      const groups = {};
      for (const blob of result.blobs) {
        const base = blob.pathname.replace(/-[a-zA-Z0-9]{21}\.(json)$/, '.$1');
        if (!groups[base]) groups[base] = [];
        groups[base].push(blob);
      }
      // Garder le plus récent de chaque groupe, supprimer le reste
      for (const key in groups) {
        const sorted = groups[key].sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
        for (let i = 1; i < sorted.length; i++) {
          await del(sorted[i].url);
          deleted++;
        }
      }
    }

    return res.status(200).json({ ok: true, deleted });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
