import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { item, category, amount, details, memo } = req.body;

    // 1. คำนวณค่าธรรมเนียม Payment Gateway (เช่น 1.5% ของยอดสินค้า)
    const baseAmount = parseFloat(amount);
    const feeRate = 0.015; // 1.5%
    const feeAmount = baseAmount * feeRate;
    const totalAmount = (baseAmount + feeAmount).toFixed(2); // ยอดสุทธิที่ลูกค้าต้องจ่ายจริง

    // 2. สร้าง Transaction ID
    const txId = 'GOBI-' + Math.random().toString(36).substring(2, 8).toUpperCase();

    const payload = {
      id: txId,
      item,
      category: category || 'General',
      baseAmount,
      feeAmount: feeAmount.toFixed(2),
      totalAmount,
      details: details || '-',
      memo: memo || '-',
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };

    // 3. บันทึกลง Vercel KV (ตั้งเวลาลบอัตโนมัติ 7 วัน = 604800 วินาที)
    await kv.set(`tx:${txId}`, JSON.stringify(payload), { ex: 604800 });

    return res.status(200).json({
      success: true,
      txId,
      data: payload
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
