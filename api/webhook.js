import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // รองรับ Payload จาก EasySlip API, SCB Open API, หรือ TrueMoney Merchant Webhook
    const { txId, status, paymentMethod, transactionRef, amount } = req.body;

    if (txId && (status === 'SUCCESS' || status === 'PAID' || status === 'COMPLETED')) {
      const dataStr = await kv.get(`tx:${txId}`);
      if (dataStr) {
        let data = typeof dataStr === 'string' ? JSON.parse(dataStr) : dataStr;
        
        data.status = 'PAID';
        data.paidAt = new Date().toISOString();
        data.paymentMethod = paymentMethod || 'SCB_PROMPTPAY';
        data.transactionRef = transactionRef || 'TX-' + Date.now();

        // อัปเดตสถานะเป็น PAID ใน Vercel KV
        await kv.set(`tx:${txId}`, JSON.stringify(data), { ex: 604800 });
      }
    }

    return res.status(200).json({ received: true, message: 'Status updated to PAID successfully' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
