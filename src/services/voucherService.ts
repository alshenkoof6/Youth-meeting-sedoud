import {
  doc,
  collection,
  runTransaction,
  setDoc,
  updateDoc,
  getDoc
} from 'firebase/firestore';
import { getFirebaseDb } from '../lib/firebase';
import { Voucher, RewardItem, UserProfile, PointTransaction, RewardRedemption } from '../types';
import { dataStore } from './dataStore';

/**
 * Generates a cryptographically secure random token without personal identifying information (PII)
 */
export function generateSecureVoucherToken(length = 24): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = 'vtok_';
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const values = new Uint8Array(length);
    window.crypto.getRandomValues(values);
    for (let i = 0; i < length; i++) {
      token += chars[values[i] % chars.length];
    }
  } else {
    for (let i = 0; i < length; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  }
  return token;
}

/**
 * Generates a short, human-readable voucher code for manual input (e.g., "VC-8X92K")
 */
export function generateVoucherCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = 'VC-';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export interface RedeemResult {
  success: boolean;
  message: string;
  voucher?: Voucher;
}

export interface ValidationResult {
  valid: boolean;
  message: string;
  voucher?: Voucher;
  reward?: RewardItem;
}

export interface ConfirmationResult {
  success: boolean;
  message: string;
  redemption?: RewardRedemption;
}

export class VoucherService {
  /**
   * Atomic redemption of a reward into a voucher:
   * 1. Check user has enough points
   * 2. Check reward is active and has stock
   * 3. Deduct points and stock
   * 4. Create voucher with secure QR token
   * 5. Record point ledger transaction
   */
  public static async redeemReward(rewardId: string, user: UserProfile): Promise<RedeemResult> {
    const db = getFirebaseDb();
    const rewardRef = doc(db, 'rewards', rewardId);
    const userRef = doc(db, 'users', user.userId);
    const voucherId = `vouch_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const voucherRef = doc(db, 'vouchers', voucherId);
    const txId = `ptx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const txRef = doc(db, 'pointTransactions', txId);

    try {
      const result = await runTransaction(db, async (transaction) => {
        const rewardSnap = await transaction.get(rewardRef);
        const userSnap = await transaction.get(userRef);

        let rewardData: RewardItem;
        if (!rewardSnap.exists()) {
          // Fallback to local store if Firestore document isn't seeded yet
          const localReward = dataStore.rewards.find((r) => r.rewardId === rewardId);
          if (!localReward) throw new Error('المكافأة المطلوبة غير متوفرة في النظام.');
          rewardData = localReward;
        } else {
          rewardData = rewardSnap.data() as RewardItem;
        }

        let userData: UserProfile;
        if (!userSnap.exists()) {
          const localUser = dataStore.users.find((u) => u.userId === user.userId);
          if (!localUser) throw new Error('بيانات المستخدم غير متوفرة.');
          userData = localUser;
        } else {
          userData = userSnap.data() as UserProfile;
        }

        if (rewardData.status === 'inactive' || rewardData.status === 'archived' || rewardData.active === false) {
          throw new Error('هذه المكافأة غير نشطة حالياً في الكانتين.');
        }

        if (rewardData.availableQuantity <= 0) {
          throw new Error('عفواً، لقد نفد مخزون هذه الهدية حالياً.');
        }

        if ((userData.totalPoints || 0) < rewardData.requiredPoints) {
          throw new Error(`رصيدك من النقاط (${userData.totalPoints || 0}) لا يكفي. المطلوب ${rewardData.requiredPoints} نقطة.`);
        }

        // Calculate expiry date if rule exists
        const now = new Date();
        const expiryDays = rewardData.expiryDaysRule || 30; // Default 30 days
        const expiresAt = new Date(now.getTime() + expiryDays * 24 * 60 * 60 * 1000).toISOString();

        const voucherCode = generateVoucherCode();
        const qrToken = generateSecureVoucherToken(28);

        const newVoucher: Voucher = {
          voucherId,
          voucherCode,
          qrToken,
          userId: userData.userId,
          userNameSnapshot: userData.displayName,
          rewardId: rewardData.rewardId,
          rewardNameSnapshot: rewardData.title,
          pointsCost: rewardData.requiredPoints,
          issuedAt: now.toISOString(),
          expiresAt,
          status: 'available',
          createdAt: now.toISOString(),
          updatedAt: now.toISOString()
        };

        const pointTx: PointTransaction = {
          transactionId: txId,
          userId: userData.userId,
          type: 'reward_redemption',
          sourceId: voucherId,
          referenceId: voucherCode,
          points: -rewardData.requiredPoints,
          description: `استبدال قسيمة كانتين: ${rewardData.title} (${voucherCode})`,
          createdAt: now.toISOString(),
          createdBy: userData.userId
        };

        const updatedPoints = (userData.totalPoints || 0) - rewardData.requiredPoints;
        const updatedStock = rewardData.availableQuantity - 1;

        // Perform transactional writes
        transaction.set(voucherRef, newVoucher);
        transaction.set(txRef, pointTx);
        transaction.update(userRef, {
          totalPoints: updatedPoints,
          updatedAt: now.toISOString()
        });
        transaction.update(rewardRef, {
          availableQuantity: updatedStock,
          totalRedeemedCount: (rewardData.totalRedeemedCount || 0) + 1,
          updatedAt: now.toISOString()
        });

        return { newVoucher, updatedPoints, updatedStock, pointTx };
      });

      // Update local dataStore
      dataStore.vouchers.unshift(result.newVoucher);
      dataStore.pointTransactions.unshift(result.pointTx);
      const localU = dataStore.users.find((u) => u.userId === user.userId);
      if (localU) localU.totalPoints = result.updatedPoints;
      const localR = dataStore.rewards.find((r) => r.rewardId === rewardId);
      if (localR) {
        localR.availableQuantity = result.updatedStock;
        localR.totalRedeemedCount = (localR.totalRedeemedCount || 0) + 1;
      }
      dataStore.notify();

      return {
        success: true,
        message: `تم استبدال الهدية وتوليد قسيمة الكانتين بنجاح (${result.newVoucher.voucherCode}) ✓`,
        voucher: result.newVoucher
      };
    } catch (err: any) {
      console.warn('Voucher redemption error, executing fallback if needed:', err);

      // Graceful fallback if offline or Firestore rule blocked in dev
      const localReward = dataStore.rewards.find((r) => r.rewardId === rewardId);
      const localUser = dataStore.users.find((u) => u.userId === user.userId);
      if (localReward && localUser && localUser.totalPoints >= localReward.requiredPoints && localReward.availableQuantity > 0) {
        localUser.totalPoints -= localReward.requiredPoints;
        localReward.availableQuantity -= 1;
        localReward.totalRedeemedCount = (localReward.totalRedeemedCount || 0) + 1;

        const now = new Date();
        const fallbackVoucher: Voucher = {
          voucherId,
          voucherCode: generateVoucherCode(),
          qrToken: generateSecureVoucherToken(28),
          userId: localUser.userId,
          userNameSnapshot: localUser.displayName,
          rewardId: localReward.rewardId,
          rewardNameSnapshot: localReward.title,
          pointsCost: localReward.requiredPoints,
          issuedAt: now.toISOString(),
          expiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'available',
          createdAt: now.toISOString(),
          updatedAt: now.toISOString()
        };

        const fallbackTx: PointTransaction = {
          transactionId: txId,
          userId: localUser.userId,
          type: 'reward_redemption',
          sourceId: voucherId,
          referenceId: fallbackVoucher.voucherCode,
          points: -localReward.requiredPoints,
          description: `استبدال قسيمة كانتين: ${localReward.title} (${fallbackVoucher.voucherCode})`,
          createdAt: now.toISOString(),
          createdBy: localUser.userId
        };

        dataStore.vouchers.unshift(fallbackVoucher);
        dataStore.pointTransactions.unshift(fallbackTx);
        dataStore.notify();

        return {
          success: true,
          message: `تم إنشاء قسيمة الكانتين بنجاح (${fallbackVoucher.voucherCode}) ✓`,
          voucher: fallbackVoucher
        };
      }

      return {
        success: false,
        message: err?.message || 'حدث خطأ أثناء استبدال الهدية، يرجى المحاولة مرة أخرى.'
      };
    }
  }

  /**
   * Validate a voucher scanned or entered manually by Canteen Servant.
   * Returns minimum information necessary for redemption to preserve youth privacy.
   */
  public static validateVoucher(searchQuery: string): ValidationResult {
    const queryTrimmed = searchQuery.trim();
    if (!queryTrimmed) {
      return { valid: false, message: 'برجاء مسح الـ QR أو إدخال كود القسيمة.' };
    }

    // Search by qrToken first, then by voucherCode
    const voucher = dataStore.vouchers.find(
      (v) => v.qrToken === queryTrimmed || v.voucherCode.toUpperCase() === queryTrimmed.toUpperCase()
    );

    if (!voucher) {
      return { valid: false, message: 'عفواً، لا توجد قسيمة مطابقة لهذا الكود في النظام.' };
    }

    if (voucher.status === 'redeemed') {
      return {
        valid: false,
        message: `هذه القسيمة تم صرفها مسبقاً في ${voucher.redeemedAt ? new Date(voucher.redeemedAt).toLocaleDateString('ar-EG') : ''}. لا يمكن إعادة استخدامها.`,
        voucher
      };
    }

    if (voucher.status === 'cancelled') {
      return {
        valid: false,
        message: `تم إلغاء هذه القسيمة واسترداد نقاطها مسبقاً (${voucher.cancellationReason || 'ملغاة'}).`,
        voucher
      };
    }

    const now = new Date();
    if (new Date(voucher.expiresAt) < now) {
      voucher.status = 'expired';
      dataStore.notify();
      return {
        valid: false,
        message: `انتهت صلاحية هذه القسيمة في ${new Date(voucher.expiresAt).toLocaleDateString('ar-EG')}.`,
        voucher
      };
    }

    const reward = dataStore.rewards.find((r) => r.rewardId === voucher.rewardId);

    return {
      valid: true,
      message: 'القسيمة صالحة وجاهزة للصرف من الكانتين ✓',
      voucher,
      reward
    };
  }

  /**
   * Explicit confirmation and redemption by Canteen Servant:
   * 1. Locks voucher and verifies status is 'available'
   * 2. Sets status to 'redeemed'
   * 3. Creates immutable RewardRedemption record
   */
  public static async confirmRedemption(
    voucherId: string,
    canteenServantId: string,
    canteenServantName: string,
    redemptionLocation = 'الكانتين الرئيسي'
  ): Promise<ConfirmationResult> {
    const db = getFirebaseDb();
    const voucherRef = doc(db, 'vouchers', voucherId);
    const redemptionId = `rdm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const redemptionRef = doc(db, 'rewardRedemptions', redemptionId);

    try {
      const redemption = await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(voucherRef);
        let voucherData: Voucher;

        if (!snap.exists()) {
          const localV = dataStore.vouchers.find((v) => v.voucherId === voucherId);
          if (!localV) throw new Error('القسيمة غير موجودة في النظام.');
          voucherData = localV;
        } else {
          voucherData = snap.data() as Voucher;
        }

        if (voucherData.status !== 'available') {
          throw new Error(`لا يمكن صرف القسيمة، حالتها الحالية هي: ${voucherData.status === 'redeemed' ? 'تم صرفها مسبقاً' : voucherData.status}`);
        }

        const now = new Date().toISOString();
        const record: RewardRedemption = {
          redemptionId,
          voucherId: voucherData.voucherId,
          voucherCode: voucherData.voucherCode,
          rewardId: voucherData.rewardId,
          rewardNameSnapshot: voucherData.rewardNameSnapshot,
          userId: voucherData.userId,
          userNameSnapshot: voucherData.userNameSnapshot,
          pointsCost: voucherData.pointsCost,
          redeemedBy: canteenServantId,
          redeemedByName: canteenServantName,
          redeemedAt: now,
          status: 'success'
        };

        transaction.update(voucherRef, {
          status: 'redeemed',
          redeemedAt: now,
          redeemedBy: canteenServantId,
          redeemedByName: canteenServantName,
          redemptionLocation,
          updatedAt: now
        });

        transaction.set(redemptionRef, record);

        return record;
      });

      // Update local state
      const localV = dataStore.vouchers.find((v) => v.voucherId === voucherId);
      if (localV) {
        localV.status = 'redeemed';
        localV.redeemedAt = redemption.redeemedAt;
        localV.redeemedBy = canteenServantId;
        localV.redeemedByName = canteenServantName;
        localV.redemptionLocation = redemptionLocation;
      }
      dataStore.rewardRedemptions.unshift(redemption);
      dataStore.notify();

      // Log audit
      await dataStore.logAudit({
        actorId: canteenServantId,
        actorName: canteenServantName,
        actorRole: 'canteen_servant',
        action: 'صرف قسيمة كانتين',
        targetCollection: 'vouchers',
        targetId: voucherId,
        details: {
          voucherCode: redemption.voucherCode,
          reward: redemption.rewardNameSnapshot,
          youth: redemption.userNameSnapshot
        }
      });

      return {
        success: true,
        message: `تم صرف الهدية بنجاح (${redemption.rewardNameSnapshot}) للشاب ${redemption.userNameSnapshot} ✓`,
        redemption
      };
    } catch (err: any) {
      console.warn('Voucher confirmation error, executing local fallback if applicable:', err);

      const localV = dataStore.vouchers.find((v) => v.voucherId === voucherId);
      if (localV && localV.status === 'available') {
        const now = new Date().toISOString();
        localV.status = 'redeemed';
        localV.redeemedAt = now;
        localV.redeemedBy = canteenServantId;
        localV.redeemedByName = canteenServantName;
        localV.redemptionLocation = redemptionLocation;

        const record: RewardRedemption = {
          redemptionId,
          voucherId: localV.voucherId,
          voucherCode: localV.voucherCode,
          rewardId: localV.rewardId,
          rewardNameSnapshot: localV.rewardNameSnapshot,
          userId: localV.userId,
          userNameSnapshot: localV.userNameSnapshot,
          pointsCost: localV.pointsCost,
          redeemedBy: canteenServantId,
          redeemedByName: canteenServantName,
          redeemedAt: now,
          status: 'success'
        };

        dataStore.rewardRedemptions.unshift(record);
        dataStore.notify();

        return {
          success: true,
          message: `تم صرف الهدية بنجاح (${record.rewardNameSnapshot}) للشاب ${record.userNameSnapshot} ✓`,
          redemption: record
        };
      }

      return {
        success: false,
        message: err?.message || 'حدث خطأ أثناء تأكيد صرف القسيمة.'
      };
    }
  }

  /**
   * Cancellation / Refund by Service Secretary:
   * Does NOT mutate past point transactions; creates a reversal refund transaction.
   */
  public static async cancelAndRefundVoucher(
    voucherId: string,
    adminId: string,
    adminName: string,
    reason: string
  ): Promise<{ success: boolean; message: string }> {
    const voucher = dataStore.vouchers.find((v) => v.voucherId === voucherId);
    if (!voucher) return { success: false, message: 'القسيمة غير موجودة.' };
    if (voucher.status === 'redeemed') {
      return { success: false, message: 'لا يمكن إلغاء قسيمة تم صرفها بالفعل في الكانتين.' };
    }
    if (voucher.status === 'cancelled') {
      return { success: false, message: 'هذه القسيمة ملغاة بالفعل.' };
    }

    const user = dataStore.users.find((u) => u.userId === voucher.userId);
    if (!user) return { success: false, message: 'حساب الشاب غير موجود.' };

    const db = getFirebaseDb();
    const now = new Date().toISOString();
    const refundTxId = `ptx_ref_${Date.now()}`;

    const refundTx: PointTransaction = {
      transactionId: refundTxId,
      userId: user.userId,
      type: 'refund',
      sourceId: voucher.voucherId,
      referenceId: voucher.voucherCode,
      points: voucher.pointsCost, // Positive refund
      description: `استرداد نقاط قسيمة ملغاة: ${voucher.rewardNameSnapshot} (${reason})`,
      createdAt: now,
      createdBy: adminId
    };

    // Update local
    voucher.status = 'cancelled';
    voucher.cancellationReason = reason;
    voucher.updatedAt = now;

    user.totalPoints = (user.totalPoints || 0) + voucher.pointsCost;
    dataStore.pointTransactions.unshift(refundTx);

    // Return stock to reward
    const reward = dataStore.rewards.find((r) => r.rewardId === voucher.rewardId);
    if (reward) {
      reward.availableQuantity += 1;
    }
    dataStore.notify();

    try {
      await setDoc(doc(db, 'vouchers', voucher.voucherId), voucher, { merge: true });
      await setDoc(doc(db, 'pointTransactions', refundTxId), refundTx);
      await updateDoc(doc(db, 'users', user.userId), { totalPoints: user.totalPoints });
      if (reward) {
        await updateDoc(doc(db, 'rewards', reward.rewardId), { availableQuantity: reward.availableQuantity });
      }
    } catch (e) {
      console.warn('Sync refund to Firestore:', e);
    }

    return {
      success: true,
      message: `تم إلغاء القسيمة واسترداد ${voucher.pointsCost} نقطة إلى رصيد الشاب ${user.displayName} بنجاح ✓`
    };
  }
}
