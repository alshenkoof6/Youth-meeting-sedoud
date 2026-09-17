import express, { Request, Response } from 'express';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory / server-authoritative store cache for fallback and backend validation
interface ServerMysteryBoxReward {
  rewardId: string;
  name: string;
  icon: string;
  approximateValue: number;
  probability: number;
  stock: number;
  isActive: boolean;
  timesWon: number;
}

interface ServerMysteryBoxConfig {
  boxId: 'points_box' | 'birthday_box';
  title: string;
  costInPoints: number;
  isActive: boolean;
  birthdayAvailabilityDays: number;
  rewards: ServerMysteryBoxReward[];
}

const SERVER_CONFIGS: Record<string, ServerMysteryBoxConfig> = {
  points_box: {
    boxId: 'points_box',
    title: 'صندوق المفاجآت بالنقاط (Points Mystery Box)',
    costInPoints: 200,
    isActive: true,
    birthdayAvailabilityDays: 7,
    rewards: [
      { rewardId: 'mb_r_01', name: 'بسكوت فاخر وشيكولاتة', icon: '🍪', approximateValue: 10, probability: 40, stock: 50, isActive: true, timesWon: 12 },
      { rewardId: 'mb_r_02', name: 'عصير فريش مثلج', icon: '🥤', approximateValue: 12, probability: 30, stock: 40, isActive: true, timesWon: 9 },
      { rewardId: 'mb_r_03', name: 'شيبسي مقرمش عائلي', icon: '🍟', approximateValue: 15, probability: 18, stock: 30, isActive: true, timesWon: 6 },
      { rewardId: 'mb_r_04', name: 'قلم أنيق + صورة قديس تذكارية', icon: '🖊️', approximateValue: 20, probability: 9, stock: 20, isActive: true, timesWon: 3 },
      { rewardId: 'mb_r_05', name: 'لعبة مسلية صغيرة خاصة', icon: '🎲', approximateValue: 30, probability: 3, stock: 10, isActive: true, timesWon: 1 }
    ]
  },
  birthday_box: {
    boxId: 'birthday_box',
    title: 'صندوق مفاجأة عيد الميلاد (Birthday Mystery Box)',
    costInPoints: 0,
    isActive: true,
    birthdayAvailabilityDays: 7,
    rewards: [
      { rewardId: 'bmb_r_01', name: 'سناك شيكولاتة وكيك عيد ميلاد', icon: '🍪', approximateValue: 15, probability: 40, stock: 50, isActive: true, timesWon: 5 },
      { rewardId: 'bmb_r_02', name: 'كانز عصير طبيعي مثلج', icon: '🥤', approximateValue: 15, probability: 30, stock: 40, isActive: true, timesWon: 4 },
      { rewardId: 'bmb_r_03', name: 'باكيت شيبسي جامبو', icon: '🍟', approximateValue: 20, probability: 20, stock: 30, isActive: true, timesWon: 3 },
      { rewardId: 'bmb_r_04', name: 'نوت بوك روحي + قلم فاخر', icon: '🖊️', approximateValue: 25, probability: 8, stock: 20, isActive: true, timesWon: 1 },
      { rewardId: 'bmb_r_05', name: 'هدية تذكارية خاصة ومباركة من الكنيسة', icon: '🎁', approximateValue: 50, probability: 2, stock: 10, isActive: true, timesWon: 1 }
    ]
  }
};

// Birthday claims cache: `${userId}_${year}`
const BIRTHDAY_CLAIMS = new Set<string>();

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', serverTime: new Date().toISOString() });
});

// Get Mystery Box configs
app.get('/api/mystery-box/config', (req: Request, res: Response) => {
  res.json({ success: true, configs: Object.values(SERVER_CONFIGS) });
});

// Server-side Authoritative Mystery Box Opening endpoint
app.post('/api/mystery-box/open', (req: Request, res: Response): void => {
  try {
    const { userId, boxType } = req.body;

    if (!userId || !boxType || (boxType !== 'points_box' && boxType !== 'birthday_box')) {
      res.status(400).json({ success: false, error: 'بيانات الطلب غير صالحة.' });
      return;
    }

    const config = SERVER_CONFIGS[boxType];
    if (!config || !config.isActive) {
      res.status(400).json({ success: false, error: 'هذا الصندوق غير مفعل حالياً.' });
      return;
    }

    // Filter in-stock active items
    const availableRewards = config.rewards.filter((r) => r.isActive && r.stock > 0);
    if (availableRewards.length === 0) {
      res.status(400).json({ success: false, error: 'عفواً، جميع جوائز الصندوق نفدت كمياتها حالياً من الكانتين.' });
      return;
    }

    // Birthday box yearly limit check
    const currentYear = new Date().getFullYear();
    if (boxType === 'birthday_box') {
      const claimKey = `${userId}_${currentYear}`;
      if (BIRTHDAY_CLAIMS.has(claimKey)) {
        res.status(400).json({ success: false, error: `لقد حصلت بالفعل على صندوق عيد الميلاد لعام ${currentYear}!` });
        return;
      }
      BIRTHDAY_CLAIMS.add(claimKey);
    }

    // Cryptographically secure proportional weighted selection
    const totalWeight = availableRewards.reduce((sum, r) => sum + Number(r.probability || 0), 0);
    // Use Node crypto for genuine unbiasable server-side randomness
    const randomBuffer = crypto.randomBytes(4);
    const randomFraction = randomBuffer.readUInt32BE(0) / 0xffffffff;
    const target = randomFraction * (totalWeight > 0 ? totalWeight : 1);

    let running = 0;
    let selectedReward: ServerMysteryBoxReward = availableRewards[availableRewards.length - 1];

    if (totalWeight > 0) {
      for (const reward of availableRewards) {
        running += Number(reward.probability || 0);
        if (target <= running) {
          selectedReward = reward;
          break;
        }
      }
    }

    // Decrement stock & increment count on server
    selectedReward.stock = Math.max(0, selectedReward.stock - 1);
    selectedReward.timesWon += 1;

    // Generate Voucher
    const voucherRandom = Math.floor(100000 + Math.random() * 900000);
    const voucherId = `VC-MB-${Date.now()}-${voucherRandom}`;
    const voucherCode = `VC-${voucherRandom}`;
    const nowIso = new Date().toISOString();
    const expiresAtIso = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const voucher = {
      voucherId,
      voucherCode,
      qrToken: `vtok_mb_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`,
      userId,
      userNameSnapshot: 'مخدوم',
      rewardId: selectedReward.rewardId,
      rewardNameSnapshot: selectedReward.name,
      pointsCost: config.costInPoints,
      issuedAt: nowIso,
      expiresAt: expiresAtIso,
      status: 'available',
      source: boxType === 'points_box' ? 'points_mystery_box' : 'birthday_mystery_box',
      boxId: boxType,
      boxType: boxType === 'points_box' ? 'points' : 'birthday',
      rewardValueSnapshot: selectedReward.approximateValue,
      createdAt: nowIso,
      updatedAt: nowIso
    };

    const redemption = {
      redemptionId: `mbr_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      userId,
      userName: 'مخدوم',
      boxId: boxType,
      boxType: boxType === 'points_box' ? 'points' : 'birthday',
      costInPoints: config.costInPoints,
      rewardId: selectedReward.rewardId,
      rewardName: selectedReward.name,
      rewardIcon: selectedReward.icon,
      rewardValue: selectedReward.approximateValue,
      timestamp: nowIso,
      status: 'success',
      voucherId: voucher.voucherId,
      voucherCode: voucher.voucherCode,
      birthdayYear: currentYear
    };

    res.json({
      success: true,
      winningReward: selectedReward,
      voucher,
      redemption,
      updatedConfig: config
    });
  } catch (error: any) {
    console.error('Mystery box opening error:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ أثناء معالجة فتح الصندوق.' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
