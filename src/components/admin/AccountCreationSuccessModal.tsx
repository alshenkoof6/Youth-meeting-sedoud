import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Copy, 
  Check, 
  Eye, 
  EyeOff, 
  Share2, 
  KeyRound, 
  IdCard, 
  AlertCircle,
  X
} from 'lucide-react';
import { UserProfile } from '../../types';

interface AccountCreationSuccessModalProps {
  user: UserProfile;
  temporaryPassword: string;
  onClose: () => void;
}

export const AccountCreationSuccessModal: React.FC<AccountCreationSuccessModalProps> = ({
  user,
  temporaryPassword,
  onClose,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);
  const [showPassword, setShowPassword] = useState(true);

  const isYouth = user.role === 'youth';
  const roleTitle = isYouth ? 'مخدوم جديد' : user.role === 'admin' ? 'أمين خدمة' : 'خادم';

  const shareText = `سلام ونعمة يا ${user.displayName} ⛪
مرحباً بك في اجتماع الشباب بكنيسة القديسة مريم!
تم إنشاء حسابك في منظومة الاجتماع بنجاح:

🔹 الكود الكنسي: ${user.userCode}
🔑 كلمة المرور المؤقتة: ${temporaryPassword}

⚠️ ملاحظة هامة: هذه كلمة مرور مؤقتة، وسيطلب منك النظام تغييرها إجبارياً واختيار كلمة سر خاصة بك عند أول تسجيل دخول.
نسعد بوجودك معنا دائماً! ✨`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(user.userCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(temporaryPassword);
    setCopiedPassword(true);
    setTimeout(() => setCopiedPassword(false), 2000);
  };

  const handleCopyAll = () => {
    navigator.clipboard.writeText(shareText);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2500);
  };

  const handleWhatsAppShare = () => {
    const encoded = encodeURIComponent(shareText);
    const cleanPhone = user.whatsappNumber || user.phoneNumber;
    const phoneFormatted = cleanPhone.startsWith('01') ? `2${cleanPhone}` : cleanPhone;
    window.open(`https://wa.me/${phoneFormatted}?text=${encoded}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-emerald-200 dark:border-emerald-800/60 relative overflow-hidden">
        
        {/* Top Decorative Glow */}
        <div 
          className="absolute -top-12 -right-12 w-40 h-40 bg-emerald-400/20 rounded-full blur-2xl pointer-events-none" 
          aria-hidden="true" 
        />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with success icon */}
        <div className="text-center space-y-2 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-700/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            تم إنشاء الحساب بنجاح 🎉
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            تم تسجيل {roleTitle} <strong className="text-slate-800 dark:text-slate-200">{user.displayName}</strong> وتوليد بيانات الدخول الأولية
          </p>
        </div>

        {/* Credentials Card */}
        <div className="space-y-3.5 bg-slate-50 dark:bg-slate-800/70 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700">
          
          {/* Church Code Row */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <IdCard className="w-3.5 h-3.5 text-indigo-600" />
                الكود الكنسي (Church Code):
              </span>
              <span className="text-[11px] text-slate-400">
                حسب ترتيب التسجيل
              </span>
            </div>
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 px-3 shadow-2xs">
              <span className="font-mono font-black text-lg text-indigo-700 dark:text-indigo-400 tracking-wider flex-1" dir="ltr">
                {user.userCode}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center gap-1.5 transition"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'تم النسخ!' : 'نسخ'}</span>
              </button>
            </div>
          </div>

          {/* Temporary Password Row */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                كلمة المرور المؤقتة (Temporary Password):
              </span>
              <span className="text-[11px] text-amber-600 font-semibold">
                عشوائية وقوية
              </span>
            </div>
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 px-3 shadow-2xs">
              <span className="font-mono font-bold text-base text-slate-900 dark:text-white tracking-widest flex-1 select-all" dir="ltr">
                {showPassword ? temporaryPassword : '••••••••'}
              </span>
              
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                title={showPassword ? 'إخفاء' : 'إظهار'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={handleCopyPassword}
                className="px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-800 dark:text-amber-300 text-xs font-bold flex items-center gap-1.5 transition"
              >
                {copiedPassword ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedPassword ? 'تم النسخ!' : 'نسخ'}</span>
              </button>
            </div>
          </div>

          {/* Mandatory Password Change Alert */}
          <div className="flex items-start gap-2 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-xl p-2.5 text-xs text-amber-900 dark:text-amber-200">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>تنبيه أمان:</strong> هذه كلمة مرور مؤقتة للاستخدام لأول مرة فقط. سيطلب النظام من {isYouth ? 'الشاب' : 'الخادم'} تعيين كلمة مرور شخصية جديدة إجبارياً فور تسجيل الدخول.
            </p>
          </div>

        </div>

        {/* Action Buttons: WhatsApp Share & Copy All */}
        <div className="mt-5 space-y-2.5">
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="py-3 px-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition"
            >
              <Share2 className="w-4 h-4" />
              <span>إرسال واتساب</span>
            </button>

            <button
              type="button"
              onClick={handleCopyAll}
              className="py-3 px-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition border border-slate-200 dark:border-slate-700"
            >
              {copiedAll ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copiedAll ? 'تم نسخ الرسالة!' : 'نسخ الرسالة كاملة'}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs transition shadow-md shadow-indigo-200 dark:shadow-none"
          >
            إغلاق ومتابعة
          </button>
        </div>

      </div>
    </div>
  );
};
