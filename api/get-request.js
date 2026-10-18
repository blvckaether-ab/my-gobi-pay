import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  const { txId } = req.query;

  if (!txId) {
    return res.status(400).json({ error: 'Missing txId parameter' });
  }

  try {
    const dataStr = await kv.get(`tx:${txId}`);
    if (!dataStr) {
      return res.status(404).json({ error: 'ไม่พบรายการชำระเงินนี้' });
    }

    const data = typeof dataStr === 'string' ? JSON.parse(dataStr) : dataStr;
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
