import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gift, Sparkles, X, CheckCircle, AlertTriangle, ArrowRight, Eye } from 'lucide-react';
import confetti from 'canvas-confetti';
import { MysteryBoxConfig, MysteryBoxReward, UserProfile, Voucher, MysteryBoxRedemptionRecord } from '../../types';
import { mysteryBoxService } from '../../services/mysteryBoxService';

interface MysteryBoxModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: MysteryBoxConfig;
  user: UserProfile;
  onSuccess: (voucher: Voucher, reward: MysteryBoxReward) => void;
}

type Stage = 'confirm' | 'opening' | 'revealed';

export const MysteryBoxModal: React.FC<MysteryBoxModalProps> = ({
  isOpen,
  onClose,
  config,
  user,
  onSuccess
}) => {
  const [stage, setStage] = useState<Stage>('confirm');
  const [isOpening, setIsOpening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wonReward, setWonReward] = useState<MysteryBoxReward | null>(null);
  const [createdVoucher, setCreatedVoucher] = useState<Voucher | null>(null);

  if (!isOpen) return null;

  const isPointsBox = config.boxId === 'points_box';
  const cost = isPointsBox ? config.costInPoints : 0;
  const userPoints = user.totalPoints || 0;
  const hasEnoughPoints = isPointsBox ? userPoints >= cost : true;

  const handleStartOpen = async () => {
    if (isOpening) return;
    if (isPointsBox && !hasEnoughPoints) {
      setError(`نقاطك غير كافية (${userPoints} نقطة). تكلفة الصندوق ${cost} نقطة.`);
      return;
    }

    setError(null);
    setIsOpening(true);
    setStage('opening');

    try {
      // Trigger the opening
      const result = await mysteryBoxService.openBox({
        userId: user.userId,
        boxType: config.boxId
      });

      if (!result.success || !result.winningReward || !result.voucher) {
        setError(result.error || 'حدث خطأ أثناء فتح الصندوق.');
        setStage('confirm');
        setIsOpening(false);
        return;
      }

      // Animate opening for 2.2 seconds before revealing
      setTimeout(() => {
        setWonReward(result.winningReward!);
        setCreatedVoucher(result.voucher!);
        setStage('revealed');
        setIsOpening(false);

        // Fire festive confetti
        try {
          confetti({
            particleCount: 120,
            spread: 80,
            origin: { y: 0.6 }
          });
        } catch {
          // ignore if canvas not supported
        }

        onSuccess(result.voucher!, result.winningReward!);
      }, 2200);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ غير متوقع.');
      setStage('confirm');
      setIsOpening(false);
    }
  };

  const handleReset = () => {
    setStage('confirm');
    setWonReward(null);
    setCreatedVoucher(null);
    setError(null);
  };

  return (
    <div
      id="mystery-box-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto"
    >
      <motion.div
        id="mystery-box-modal-container"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-amber-200/50 dark:border-amber-900/30 overflow-hidden"
      >
        {/* Close Button */}
        {stage !== 'opening' && (
          <button
            id="btn-close-mystery-box"
            onClick={onClose}
            className="absolute top-4 left-4 z-20 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Ambient Top Glow */}
        <div className={`h-32 w-full absolute top-0 left-0 bg-gradient-to-b ${isPointsBox ? 'from-amber-400/20 via-orange-300/10' : 'from-rose-400/25 via-purple-300/10'} to-transparent pointer-events-none`} />

        <div className="relative p-6 sm:p-8 text-center">
          <AnimatePresence mode="wait">
            {/* STAGE 1: CONFIRM */}
            {stage === 'confirm' && (
              <motion.div
                key="confirm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {/* Header Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-300 text-sm font-bold">
                  {isPointsBox ? (
                    <>
                      <Gift className="w-4 h-4" />
                      <span>صندوق المفاجآت بالنقاط 🎁</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-rose-500" />
                      <span>هدية عيد ميلادك المجانية 🎂</span>
                    </>
                  )}
                </div>

                {/* Big Animated Mystery Box Visual */}
                <div className="relative py-4 flex justify-center">
                  <motion.div
                    animate={{
                      y: [0, -8, 0],
                      rotate: [-1, 1, -1]
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 3,
                      ease: 'easeInOut'
                    }}
                    className={`w-32 h-32 rounded-3xl flex items-center justify-center text-6xl shadow-xl ${
                      isPointsBox
                        ? 'bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 text-white shadow-amber-500/30'
                        : 'bg-gradient-to-br from-rose-400 via-purple-500 to-indigo-500 text-white shadow-rose-500/30'
                    }`}
                  >
                    🎁
                  </motion.div>
                </div>

                <div>
                  <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">
                    {config.title}
                  </h3>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {config.description}
                  </p>
                </div>

                {/* Points & Cost Card */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-2 text-sm">
                  {isPointsBox ? (
                    <>
                      <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                        <span>رصيدك الحالي:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-100">{userPoints} نقطة</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                        <span>تكلفة الصندوق:</span>
                        <span className="font-bold text-amber-600 dark:text-amber-400">{cost} نقطة</span>
                      </div>
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center font-bold">
                        <span>الرصيد المتبقي بعد الفتح:</span>
                        <span className={hasEnoughPoints ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                          {userPoints - cost} نقطة
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-1 text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      <span>هدية مجانية تماماً بدون خصم أي نقاط! ❤️</span>
                    </div>
                  )}
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 text-rose-700 dark:text-rose-300 text-sm flex items-center gap-2 text-right">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Action Button */}
                <div className="pt-2">
                  <button
                    id="btn-redeem-mystery-box"
                    disabled={isOpening || (isPointsBox && !hasEnoughPoints)}
                    onClick={handleStartOpen}
                    className={`w-full py-4 px-6 rounded-2xl font-bold text-lg text-white shadow-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                      isPointsBox && !hasEnoughPoints
                        ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed text-slate-500'
                        : isPointsBox
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-amber-500/25 active:scale-[0.98]'
                        : 'bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 shadow-rose-500/25 active:scale-[0.98]'
                    }`}
                  >
                    <Gift className="w-5 h-5" />
                    <span>{isPointsBox ? 'استبدال وفتح الصندوق 🎁' : 'افتح هديتي الآن 🎂'}</span>
                  </button>
                  {isPointsBox && !hasEnoughPoints && (
                    <p className="mt-2 text-xs text-rose-500">تحتاج إلى {cost - userPoints} نقطة إضافية لتتمكن من فتح هذا الصندوق.</p>
                  )}
                </div>
              </motion.div>
            )}

            {/* STAGE 2: OPENING ANIMATION */}
            {stage === 'opening' && (
              <motion.div
                key="opening"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-10 space-y-6 flex flex-col items-center justify-center min-h-[360px]"
              >
                <div className="relative">
                  {/* Glowing pulsing aura */}
                  <motion.div
                    animate={{
                      scale: [1, 1.4, 1],
                      opacity: [0.3, 0.8, 0.3]
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 1.2
                    }}
                    className={`absolute -inset-6 rounded-full blur-2xl ${
                      isPointsBox ? 'bg-amber-400/50' : 'bg-rose-400/50'
                    }`}
                  />

                  {/* Vigorously shaking box */}
                  <motion.div
                    animate={{
                      rotate: [0, -12, 12, -12, 12, -8, 8, 0],
                      scale: [1, 1.1, 1.15, 1.05, 1.2, 1.1, 1.25]
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 1
                    }}
                    className={`relative w-36 h-36 rounded-3xl flex items-center justify-center text-7xl shadow-2xl ${
                      isPointsBox
                        ? 'bg-gradient-to-tr from-amber-400 via-amber-500 to-orange-500 text-white'
                        : 'bg-gradient-to-tr from-rose-400 via-purple-500 to-indigo-500 text-white'
                    }`}
                  >
                    🎁
                  </motion.div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xl font-black text-slate-800 dark:text-slate-100 flex items-center justify-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-500 animate-spin" />
                    <span>جاري فتح الصندوق... ✨</span>
                    <Sparkles className="w-5 h-5 text-amber-500 animate-spin" />
                  </h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    لحظات وسنعرف هديتك المفاجئة!
                  </p>
                </div>
              </motion.div>
            )}

            {/* STAGE 3: REVEALED */}
            {stage === 'revealed' && wonReward && createdVoucher && (
              <motion.div
                key="revealed"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-300 text-sm font-bold">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>مبروك! لقد ربحت 🎉</span>
                </div>

                {/* Big Reward Display */}
                <div className="relative py-2 flex flex-col items-center">
                  <motion.div
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                    className="w-32 h-32 rounded-3xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40 border-2 border-amber-300 dark:border-amber-700 flex items-center justify-center text-6xl shadow-xl"
                  >
                    {wonReward.icon}
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mt-4 text-center"
                  >
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                      YOU GOT:
                    </span>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-slate-50 mt-1">
                      {wonReward.icon} {wonReward.name}
                    </h3>
                    <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium">
                      <span>القيمة التقديرية:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-100">{wonReward.approximateValue} جنيه</span>
                    </div>
                  </motion.div>
                </div>

                {/* Voucher Created Card */}
                <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-right space-y-2">
                  <div className="flex justify-between items-center text-xs text-amber-800 dark:text-amber-300 font-bold">
                    <span>قسيمة استلام إلكترونية جاهزة 🎫</span>
                    <span className="font-mono bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                      {createdVoucher.voucherCode}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    تم إنشاء قسيمة برمز QR خاصة بهذه الجائزة في محفظتك. توجّه إلى كانتين الكنيسة وامسح الرمز لاستلام هديتك!
                  </p>
                </div>

                {/* Actions */}
                <div className="space-y-2 pt-2">
                  <button
                    id="btn-view-voucher-after-reveal"
                    onClick={() => {
                      onClose();
                      onSuccess(createdVoucher, wonReward);
                    }}
                    className="w-full py-3.5 px-6 rounded-2xl font-bold text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors flex items-center justify-center gap-2 shadow-md"
                  >
                    <Eye className="w-5 h-5" />
                    <span>عرض قسيمة الاستلام والـ QR 🎫</span>
                  </button>

                  {isPointsBox && userPoints >= cost && (
                    <button
                      id="btn-open-another-mystery-box"
                      onClick={handleReset}
                      className="w-full py-3 px-6 rounded-2xl font-bold text-amber-700 dark:text-amber-300 bg-amber-100/60 dark:bg-amber-900/30 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                      <Gift className="w-4 h-4" />
                      <span>فتح صندوق آخر (متبقي لديك {userPoints} نقطة)</span>
                    </button>
                  )}

                  <button
                    id="btn-done-mystery-box"
                    onClick={onClose}
                    className="w-full py-2.5 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                  >
                    إغلاق
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
