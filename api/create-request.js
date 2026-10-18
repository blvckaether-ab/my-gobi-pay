import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { item, category, amount, details, memo } = req.body;

    const baseAmount = parseFloat(amount);
    if (isNaN(baseAmount) || baseAmount <= 0) {
      return res.status(400).json({ error: 'จำนวนเงินไม่ถูกต้อง' });
    }

    // กำหนดค่าธรรมเนียม Payment Gateway ที่ 2% (0.02)
    const feeRate = 0.02; 
    const feeAmount = baseAmount * feeRate;
    const totalAmount = (baseAmount + feeAmount).toFixed(2);

    const txId = 'GOBI-' + Math.random().toString(36).substring(2, 8).toUpperCase();

    const payload = {
      id: txId,
      item: item || 'สินค้า/บริการ Gobi Market',
      category: category || 'Digital Service',
      baseAmount: baseAmount.toFixed(2),
      feeAmount: feeAmount.toFixed(2),
      feePercentage: '2%',
      totalAmount: totalAmount, // ยอดสุทธิที่ลูกค้าต้องชำระ
      details: details || '-',
      memo: memo || '-',
      status: 'PENDING',
      bankName: 'ธนาคารไทยพาณิชย์ (SCB)',
      createdAt: new Date().toISOString()
    };

    // บันทึกลง Vercel KV Database (กำหนด TTL ลบอัตโนมัติใน 7 วัน = 604800 วินาที)
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
