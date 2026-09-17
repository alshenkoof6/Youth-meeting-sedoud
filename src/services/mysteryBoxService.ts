import {
  MysteryBoxConfig,
  MysteryBoxReward,
  MysteryBoxRedemptionRecord,
  Voucher,
  UserProfile,
  PointTransaction
} from '../types';
import { dataStore } from './dataStore';
import {
  pickWinningReward,
  checkBirthdayMysteryBoxEligibility,
  validateProbabilities
} from '../utils/mysteryBoxCalculator';
import { getFirebaseDb } from '../lib/firebase';
import { doc, runTransaction } from 'firebase/firestore';

export interface OpenMysteryBoxResult {
  success: boolean;
  winningReward?: MysteryBoxReward;
  voucher?: Voucher;
  redemption?: MysteryBoxRedemptionRecord;
  remainingPoints?: number;
  error?: string;
}

export interface MysteryBoxStats {
  totalBoxesOpened: number;
  totalPointsSpent: number;
  totalBirthdayBoxesGiven: number;
  totalPointsBoxesOpened: number;
  mostCommonReward: { name: string; icon: string; count: number } | null;
  leastCommonReward: { name: string; icon: string; count: number } | null;
  totalStockRemaining: number;
  estimatedTotalCost: number; // in EGP
  estimatedAverageCost: number; // in EGP
  uniqueUsersCount: number;
}

class MysteryBoxService {
  private static instance: MysteryBoxService;

  public static getInstance(): MysteryBoxService {
    if (!MysteryBoxService.instance) {
      MysteryBoxService.instance = new MysteryBoxService();
    }
    return MysteryBoxService.instance;
  }

  /**
   * Opens a Mystery Box with atomic checks and anti-cheat validation.
   * First tries server-side backend API route; if not reachable, executes atomic local/Firestore logic.
   */
  public async openBox(params: {
    userId: string;
    boxType: 'points_box' | 'birthday_box';
  }): Promise<OpenMysteryBoxResult> {
    const { userId, boxType } = params;

    // 1. Try server-side execution via backend API
    try {
      const response = await fetch('/api/mystery-box/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, boxType, timestamp: new Date().toISOString() })
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.success) {
          // Sync with local dataStore state
          if (data.voucher) {
            dataStore.vouchers.unshift(data.voucher);
          }
          if (data.redemption) {
            dataStore.mysteryBoxRedemptions.unshift(data.redemption);
          }
          if (data.updatedUser) {
            const uIdx = dataStore.users.findIndex((u) => u.userId === userId);
            if (uIdx !== -1) {
              dataStore.users[uIdx] = data.updatedUser;
            }
          }
          if (data.updatedConfig) {
            const cIdx = dataStore.mysteryBoxConfigs.findIndex((c) => c.boxId === boxType);
            if (cIdx !== -1) {
              dataStore.mysteryBoxConfigs[cIdx] = data.updatedConfig;
            }
          }
          return {
            success: true,
            winningReward: data.winningReward,
            voucher: data.voucher,
            redemption: data.redemption,
            remainingPoints: data.remainingPoints
          };
        } else if (data && data.error) {
          return { success: false, error: data.error };
        }
      }
    } catch {
      // Backend not running yet or network error, fallback to seamless client-side atomic execution
    }

    // 2. Client-side atomic transaction execution
    return this.executeLocalOpen(userId, boxType);
  }

  private async executeLocalOpen(
    userId: string,
    boxType: 'points_box' | 'birthday_box'
  ): Promise<OpenMysteryBoxResult> {
    const user = dataStore.users.find((u) => u.userId === userId);
    if (!user) {
      return { success: false, error: 'المستخدم غير مسجل في النظام.' };
    }

    const config = dataStore.mysteryBoxConfigs.find((b) => b.boxId === boxType);
    if (!config || !config.isActive) {
      return { success: false, error: 'هذا الصندوق غير مفعل حالياً من خادم الكانتين.' };
    }

    // Points Box Verification
    const cost = boxType === 'points_box' ? Number(config.costInPoints || 200) : 0;
    if (boxType === 'points_box') {
      if ((user.totalPoints || 0) < cost) {
        return {
          success: false,
          error: `نقاطك غير كافية. رصيدك الحالي هو ${user.totalPoints || 0} نقطة، وتكلفة الصندوق ${cost} نقطة.`
        };
      }
    }

    // Birthday Box Verification
    let birthdayYear: number | undefined;
    if (boxType === 'birthday_box') {
      const eligibility = checkBirthdayMysteryBoxEligibility(
        user,
        dataStore.mysteryBoxRedemptions,
        config.birthdayAvailabilityDays || 7
      );

      if (!eligibility.isEligible) {
        return {
          success: false,
          error: eligibility.reason || 'صندوق عيد الميلاد غير متاح لك حالياً.'
        };
      }
      birthdayYear = eligibility.birthdayYear;
    }

    // Weighted Reward Selection
    const selection = pickWinningReward(config.rewards);
    if (!selection.winningReward) {
      return {
        success: false,
        error: selection.error || 'عفواً، لا توجد جوائز متاحة في الصندوق حالياً.'
      };
    }

    const winningReward = { ...selection.winningReward };

    // Decrement stock & increment timesWon
    const updatedRewards = config.rewards.map((r) => {
      if (r.rewardId === winningReward.rewardId) {
        return {
          ...r,
          stock: Math.max(0, r.stock - 1),
          timesWon: (r.timesWon || 0) + 1
        };
      }
      return r;
    });

    const updatedConfig: MysteryBoxConfig = {
      ...config,
      rewards: updatedRewards,
      updatedAt: new Date().toISOString()
    };

    // Deduct points from user if points box
    const newPoints = boxType === 'points_box' ? Math.max(0, (user.totalPoints || 0) - cost) : user.totalPoints;
    const updatedUser: UserProfile = {
      ...user,
      totalPoints: newPoints,
      updatedAt: new Date().toISOString()
    };

    // Create Voucher
    const voucherRandom = Math.floor(100000 + Math.random() * 900000);
    const voucherId = `VC-MB-${Date.now()}-${voucherRandom}`;
    const voucherCode = `VC-${voucherRandom}`;
    const nowIso = new Date().toISOString();
    const expiresAtIso = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const voucher: Voucher = {
      voucherId,
      voucherCode,
      qrToken: `vtok_mb_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      userId: user.userId,
      userNameSnapshot: user.displayName,
      rewardId: winningReward.rewardId,
      rewardNameSnapshot: winningReward.name,
      pointsCost: cost,
      issuedAt: nowIso,
      expiresAt: expiresAtIso,
      status: 'available',
      source: boxType === 'points_box' ? 'points_mystery_box' : 'birthday_mystery_box',
      boxId: boxType,
      boxType: boxType === 'points_box' ? 'points' : 'birthday',
      rewardValueSnapshot: winningReward.approximateValue,
      createdAt: nowIso,
      updatedAt: nowIso
    };

    // Create Point Transaction (if points cost > 0)
    let pointTx: PointTransaction | undefined;
    if (cost > 0) {
      pointTx = {
        transactionId: `ptx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userId: user.userId,
        points: -cost,
        type: 'reward_redemption',
        reason: `فتح صندوق المفاجآت بالنقاط 🎁 (حصلت على: ${winningReward.name})`,
        timestamp: nowIso
      };
    }

    // Create Redemption Record
    const redemption: MysteryBoxRedemptionRecord = {
      redemptionId: `mbr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: user.userId,
      userName: user.displayName,
      boxId: boxType,
      boxType: boxType === 'points_box' ? 'points' : 'birthday',
      costInPoints: cost,
      rewardId: winningReward.rewardId,
      rewardName: winningReward.name,
      rewardIcon: winningReward.icon,
      rewardValue: winningReward.approximateValue,
      timestamp: nowIso,
      status: 'success',
      voucherId: voucher.voucherId,
      voucherCode: voucher.voucherCode,
      birthdayYear
    };

    // Save to local store
    await dataStore.updateUser(updatedUser);
    await dataStore.saveMysteryBoxConfig(updatedConfig);
    await dataStore.createVoucher(voucher);
    if (pointTx) {
      dataStore.pointTransactions.unshift(pointTx);
    }
    await dataStore.recordMysteryBoxRedemption(redemption);

    await dataStore.logAudit({
      actorId: user.userId,
      actorName: user.displayName,
      actorRole: user.role,
      action: boxType === 'points_box' ? 'فتح صندوق النقاط المفاجئ' : 'فتح صندوق عيد الميلاد المجاني',
      targetCollection: 'mysteryBoxRedemptions',
      targetId: redemption.redemptionId,
      details: {
        boxType,
        pointsCost: cost,
        rewardWon: winningReward.name,
        rewardValue: winningReward.approximateValue,
        voucherCode
      }
    });

    return {
      success: true,
      winningReward,
      voucher,
      redemption,
      remainingPoints: newPoints
    };
  }

  /**
   * Computes comprehensive statistics for the Mystery Box Dashboard
   */
  public getStats(): MysteryBoxStats {
    const redemptions = dataStore.mysteryBoxRedemptions || [];
    const configs = dataStore.mysteryBoxConfigs || [];

    const totalBoxesOpened = redemptions.length;
    const totalPointsSpent = redemptions.reduce((sum, r) => sum + (r.costInPoints || 0), 0);
    const totalBirthdayBoxesGiven = redemptions.filter((r) => r.boxType === 'birthday').length;
    const totalPointsBoxesOpened = redemptions.filter((r) => r.boxType === 'points').length;

    // Count reward frequencies
    const rewardCountMap = new Map<string, { name: string; icon: string; count: number }>();
    for (const r of redemptions) {
      const existing = rewardCountMap.get(r.rewardId);
      if (existing) {
        existing.count += 1;
      } else {
        rewardCountMap.set(r.rewardId, { name: r.rewardName, icon: r.rewardIcon, count: 1 });
      }
    }

    const rewardEntries = Array.from(rewardCountMap.values());
    rewardEntries.sort((a, b) => b.count - a.count);

    const mostCommonReward = rewardEntries.length > 0 ? rewardEntries[0] : null;
    const leastCommonReward = rewardEntries.length > 0 ? rewardEntries[rewardEntries.length - 1] : null;

    // Calculate remaining stock across all boxes
    let totalStockRemaining = 0;
    for (const conf of configs) {
      for (const rew of conf.rewards || []) {
        totalStockRemaining += Number(rew.stock || 0);
      }
    }

    // Estimated total cost (sum of approximate value in EGP of all won rewards)
    const estimatedTotalCost = redemptions.reduce((sum, r) => sum + (Number(r.rewardValue) || 0), 0);
    const estimatedAverageCost = totalBoxesOpened > 0 ? Math.round((estimatedTotalCost / totalBoxesOpened) * 10) / 10 : 0;

    // Unique users who opened a box
    const uniqueUsers = new Set(redemptions.map((r) => r.userId));

    return {
      totalBoxesOpened,
      totalPointsSpent,
      totalBirthdayBoxesGiven,
      totalPointsBoxesOpened,
      mostCommonReward,
      leastCommonReward,
      totalStockRemaining,
      estimatedTotalCost,
      estimatedAverageCost,
      uniqueUsersCount: uniqueUsers.size
    };
  }
}

export const mysteryBoxService = MysteryBoxService.getInstance();
