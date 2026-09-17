import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Cake, Gift, Sparkles, Clock, CheckCircle } from 'lucide-react';
import { UserProfile, MysteryBoxConfig, Voucher, MysteryBoxReward } from '../../types';
import { checkBirthdayMysteryBoxEligibility } from '../../utils/mysteryBoxCalculator';
import { dataStore } from '../../services/dataStore';
import { MysteryBoxModal } from './MysteryBoxModal';

interface YouthBirthdayMysteryBannerProps {
  currentUser: UserProfile;
  onVoucherCreated?: (voucher: Voucher) => void;
}

export const YouthBirthdayMysteryBanner: React.FC<YouthBirthdayMysteryBannerProps> = ({
  currentUser,
  onVoucherCreated
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Get Birthday Box config
  const birthdayConfig = dataStore.mysteryBoxConfigs.find((b) => b.boxId === 'birthday_box');
  if (!birthdayConfig || !birthdayConfig.isActive) {
    return null;
  }

  const eligibility = checkBirthdayMysteryBoxEligibility(
    currentUser,
    dataStore.mysteryBoxRedemptions,
    birthdayConfig.birthdayAvailabilityDays || 7
  );

  // If already claimed this year, show celebration badge or silent
  if (eligibility.alreadyClaimed) {
    return (
      <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50 via-pink-50 to-rose-50 dark:from-purple-950/20 dark:via-pink-950/20 dark:to-rose-950/20 border border-pink-200/60 dark:border-pink-800/40 flex items-center justify-between gap-4 text-right">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-pink-100 dark:bg-pink-900/50 flex items-center justify-center text-xl shrink-0">
            🎂
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <span>كل سنة وأنت طيب يا {currentUser.nickname || currentUser.displayName.split(' ')[0]}! ❤️</span>
              <CheckCircle className="w-4 h-4 text-emerald-500" />
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              لقد استلمت هدية عيد ميلادك لعام {eligibility.birthdayYear}. نتمنى لك عاماً مباركاً ومثمراً مع المسيح!
            </p>
          </div>
        </div>
      </div>
    );
  }

  // If not eligible (e.g. not within window or no birthdate), don't display
  if (!eligibility.isEligible) {
    return null;
  }

  return (
    <>
      <motion.div
        id="banner-birthday-mystery-box"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl p-5 sm:p-6 bg-gradient-to-r from-rose-500 via-purple-600 to-indigo-600 text-white shadow-xl shadow-purple-500/20"
      >
        {/* Decorative sparkles in background */}
        <div className="absolute top-2 left-10 text-white/20 text-3xl select-none">✨</div>
        <div className="absolute bottom-2 right-20 text-white/20 text-4xl select-none">🎈</div>
        <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 text-right">
          <div className="flex items-start sm:items-center gap-4">
            <motion.div
              animate={{
                rotate: [-5, 5, -5],
                scale: [1, 1.08, 1]
              }}
              transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
              className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-3xl shadow-inner shrink-0"
            >
              🎂
            </motion.div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-xs font-bold mb-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>عيد ميلاد سعيد يا {currentUser.nickname || currentUser.displayName.split(' ')[0]}! 🎉</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black tracking-tight">
                لديك مفاجأة عيد ميلاد خاصة من الكنيسة! 🎁
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-white/90 max-w-xl leading-relaxed">
                اجتماع الشباب والكانتين يحتفلون بك اليوم. افتح صندوق مفاجأة عيد الميلاد واستلم هديتك المجانية الآن ❤️
              </p>
              <div className="mt-2 flex items-center gap-2 text-xs text-white/80">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  {eligibility.isToday
                    ? 'اليوم هو يوم عيد ميلادك! متاح لمدة ' + eligibility.daysRemaining + ' أيام'
                    : `متبقي ${eligibility.daysRemaining} أيام على انتهاء فرصة استلام هديتك`}
                </span>
              </div>
            </div>
          </div>

          <div className="w-full sm:w-auto shrink-0">
            <button
              id="btn-open-birthday-mystery-gift"
              onClick={() => setIsModalOpen(true)}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white text-purple-700 hover:bg-white/90 font-black text-sm sm:text-base shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Gift className="w-5 h-5 text-rose-500" />
              <span>افتح هديتي الآن 🎁 (مجاناً)</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Opening Modal */}
      {isModalOpen && (
        <MysteryBoxModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          config={birthdayConfig}
          user={currentUser}
          onSuccess={(voucher) => {
            if (onVoucherCreated) {
              onVoucherCreated(voucher);
            }
          }}
        />
      )}
    </>
  );
};
