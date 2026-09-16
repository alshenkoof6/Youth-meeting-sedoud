import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  ShieldCheck, 
  KeyRound, 
  Lock, 
  Check, 
  AlertCircle, 
  ArrowLeft,
  Eye,
  EyeOff,
  Sparkles
} from 'lucide-react';
import { evaluatePasswordStrength } from '../../utils/churchAuthUtils';

export const ForceChangePasswordModal: React.FC = () => {
  const { currentUser, updateCurrentUserProfile } = useAuth();
  
  const [currentTempPassword, setCurrentTempPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!currentUser) return null;

  const strength = evaluatePasswordStrength(newPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Verify current temporary password if user has one stored
    if (currentUser.temporaryPassword) {
      if (currentTempPassword.trim() !== currentUser.temporaryPassword.trim()) {
        setErrorMsg('كلمة المرور المؤقتة غير صحيحة، يرجى مراجعة الكلمة التي استلمتها من الخادم المسؤول');
        return;
      }
    }

    if (!strength.isValid) {
      setErrorMsg(strength.feedback);
      return;
    }

    if (newPassword.trim() === currentUser.temporaryPassword?.trim()) {
      setErrorMsg('يجب اختيار كلمة مرور جديدة تختلف عن كلمة المرور المؤقتة');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('كلمتا المرور غير متطابقتين');
      return;
    }

    setIsLoading(true);

    try {
      setIsSuccess(true);
      await new Promise((resolve) => setTimeout(resolve, 1400));

      await updateCurrentUserProfile({
        password: newPassword.trim(),
        temporaryPassword: undefined,
        mustChangePassword: false,
        passwordChangedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Password change error:', err);
      setIsSuccess(false);
      setErrorMsg('حدث خطأ أثناء حفظ كلمة المرور، يرجى المحاولة مرة أخرى');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-amber-200 dark:border-amber-800/80 relative overflow-hidden">
        
        {/* Glow accent */}
        <div 
          className="absolute -top-10 -right-10 w-44 h-44 bg-amber-400/15 rounded-full blur-2xl pointer-events-none" 
          aria-hidden="true" 
        />

        {/* Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-700/80 flex items-center justify-center mx-auto shadow-sm">
            <ShieldCheck className="w-8 h-8" />
          </div>

          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            تعيين كلمة مرور جديدة إجبارياً
          </h2>

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            أهلاً بك يا <strong className="text-slate-800 dark:text-slate-200">{currentUser.displayName}</strong> في كنيستك! ⛪<br />
            لحماية حسابك وبياناتك الشخصية، يرجى تعيين كلمة مرور جديدة قبل المتابعة.
          </p>
        </div>

        {/* User Badge Info */}
        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3 px-4 mb-5 border border-slate-200/70 dark:border-slate-700 flex items-center justify-between text-xs">
          <span className="text-slate-500">الكود الكنسي الخاص بك:</span>
          <span className="font-mono font-black text-indigo-700 dark:text-indigo-400 text-sm tracking-wider" dir="ltr">
            {currentUser.userCode}
          </span>
        </div>

        {isSuccess ? (
          <div className="py-6 text-center space-y-3 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <Check className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              تم تعيين كلمة المرور بنجاح!
            </h3>
            <p className="text-xs text-slate-500">
              يمكنك الآن استخدام الكود الكنسي وكلمة المرور الجديدة في أي وقت لتسجيل الدخول.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Current Temporary Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>كلمة المرور المؤقتة (المستلمة)</span>
                {currentUser.temporaryPassword && (
                  <span className="text-[10px] font-normal text-amber-600 font-mono">
                    (المؤقتة: {currentUser.temporaryPassword})
                  </span>
                )}
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                <input
                  type={showCurrent ? 'text' : 'password'}
                  value={currentTempPassword}
                  onChange={(e) => setCurrentTempPassword(e.target.value)}
                  placeholder="أدخل كلمة المرور المؤقتة"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold tracking-wider text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  dir="ltr"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 absolute left-2.5 top-2"
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                كلمة المرور الجديدة
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="اختر كلمة مرور خاصة بك (6 أحرف أو أرقام على الأقل)"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold tracking-wider text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  dir="ltr"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 absolute left-2.5 top-2"
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {newPassword.length > 0 && (
                <div className="pt-1 space-y-1">
                  <div className="grid grid-cols-3 gap-1.5 h-1.5">
                    <div className={`rounded-full ${strength.score >= 1 ? 'bg-amber-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
                    <div className={`rounded-full ${strength.score >= 2 ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
                    <div className={`rounded-full ${strength.score >= 3 ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500 block">
                    {strength.feedback}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm New Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                تأكيد كلمة المرور الجديدة
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="أعد كتابة كلمة المرور الجديدة"
                  className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold tracking-wider text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  dir="ltr"
                  required
                />
              </div>
            </div>

            {errorMsg && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 text-xs font-medium border border-rose-200 dark:border-rose-900/60">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-xs transition shadow-md shadow-indigo-200 dark:shadow-none flex items-center justify-center gap-2 mt-2"
            >
              <span>{isLoading ? 'جاري الحفظ وتأكيد الحساب...' : 'حفظ كلمة المرور ودخول المنظومة'}</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
