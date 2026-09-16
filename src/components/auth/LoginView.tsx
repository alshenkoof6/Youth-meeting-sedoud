import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Church, 
  Phone, 
  KeyRound, 
  ArrowLeft, 
  ShieldCheck, 
  User, 
  Users, 
  IdCard, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle,
  Coffee 
} from 'lucide-react';

export const LoginView: React.FC = () => {
  const { loginWithChurchCode, loginWithPhone } = useAuth();
  
  const [loginMethod, setLoginMethod] = useState<'churchCode' | 'phoneOtp'>('churchCode');
  
  // Church Code + Password state
  const [churchCodeInput, setChurchCodeInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Phone + OTP state
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpStep, setOtpStep] = useState<'phone' | 'otp'>('phone');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCodeLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!churchCodeInput.trim()) {
      setErrorMsg('يرجى إدخال الكود الكنسي أو رقم الهاتف');
      return;
    }
    if (!passwordInput.trim()) {
      setErrorMsg('يرجى إدخال كلمة المرور (المؤقتة أو الخاصة)');
      return;
    }

    setIsLoading(true);
    const res = await loginWithChurchCode(churchCodeInput, passwordInput);
    setIsLoading(false);

    if (!res.success) {
      setErrorMsg(res.error || 'تعذر تسجيل الدخول، يرجى التأكد من البيانات المدخلة');
    }
  };

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const clean = phoneNumber.trim();
    if (!clean || clean.length < 9) {
      setErrorMsg('يرجى إدخال رقم هاتف صحيح (مثال: 01012345678)');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setOtpStep('otp');
    }, 600);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!otpCode.trim()) {
      setErrorMsg('يرجى إدخال كود التحقق المرسل لهاتفك');
      return;
    }

    setIsLoading(true);
    const success = await loginWithPhone(phoneNumber, otpCode);
    setIsLoading(false);

    if (!success) {
      setErrorMsg('تعذر تسجيل الدخول، يرجى المحاولة مرة أخرى.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
      
      <div className="max-w-md w-full space-y-5">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 text-white flex items-center justify-center mx-auto shadow-xl shadow-indigo-200 dark:shadow-none">
            <Church className="w-9 h-9" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            اجتماع الشباب
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            منظومة الحضور الذكي والافتقاد والتفاعل بالكود الكنسي
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-none space-y-5">
          
          {/* Method Switcher Tabs */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setLoginMethod('churchCode');
                setErrorMsg(null);
              }}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                loginMethod === 'churchCode'
                  ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <IdCard className="w-3.5 h-3.5" />
              <span>الكود وكلمة المرور</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setLoginMethod('phoneOtp');
                setErrorMsg(null);
              }}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                loginMethod === 'phoneOtp'
                  ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Phone className="w-3.5 h-3.5" />
              <span>رسالة SMS (OTP)</span>
            </button>
          </div>

          {loginMethod === 'churchCode' ? (
            /* CHURCH CODE + PASSWORD LOGIN */
            <form onSubmit={handleCodeLogin} className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white mb-0.5">
                  تسجيل الدخول بالكود الكنسي
                </h2>
                <p className="text-xs text-slate-500">
                  أدخل الكود الكنسي الخاص بك وكلمة المرور (المؤقتة أو الدائمة)
                </p>
              </div>

              {/* Code Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  الكود الكنسي أو رقم الموبايل
                </label>
                <div className="relative">
                  <IdCard className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                  <input
                    type="text"
                    value={churchCodeInput}
                    onChange={(e) => setChurchCodeInput(e.target.value)}
                    placeholder="مثال: YT-00125 أو رقم الهاتف"
                    className="w-full pl-4 pr-10 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold tracking-wider text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    dir="ltr"
                    autoFocus
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  كلمة المرور
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="كلمة المرور المؤقتة أو الخاصة بك"
                    className="w-full pl-10 pr-10 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold tracking-wider text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    dir="ltr"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 absolute left-2.5 top-2.5"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {errorMsg && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-medium border border-rose-200 dark:border-rose-900/60">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-xs transition shadow-md shadow-indigo-200 dark:shadow-none flex items-center justify-center gap-2"
              >
                <span>{isLoading ? 'جاري التحقق...' : 'تسجيل الدخول'}</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </form>
          ) : (
            /* PHONE OTP LOGIN */
            <div>
              {otpStep === 'phone' ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white mb-0.5">
                      تسجيل الدخول برقم الموبايل
                    </h2>
                    <p className="text-xs text-slate-500">
                      سوف نرسل لك كود تحقق عبر رسالة نصية قصيرة
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      رقم الهاتف المحمول
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="01xxxxxxxxx"
                        className="w-full pl-4 pr-10 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold tracking-wider text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        dir="ltr"
                        autoFocus
                        required
                      />
                    </div>
                  </div>

                  {errorMsg && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-medium border border-rose-200 dark:border-rose-900/60">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-xs transition shadow-md shadow-indigo-200 dark:shadow-none flex items-center justify-center gap-2"
                  >
                    <span>{isLoading ? 'جاري الإرسال...' : 'إرسال كود التحقق (OTP)'}</span>
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white mb-0.5">
                      أدخل كود التحقق
                    </h2>
                    <p className="text-xs text-slate-500">
                      تم إرسال كود التحقق إلى الرقم: <strong className="font-mono">{phoneNumber}</strong>
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      رمز التحقق (OTP)
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                      <input
                        type="text"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        placeholder="1234"
                        className="w-full pl-4 pr-10 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-center text-lg font-mono font-bold tracking-widest text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        dir="ltr"
                        autoFocus
                        required
                      />
                    </div>
                  </div>

                  {errorMsg && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-medium border border-rose-200 dark:border-rose-900/60">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-xs transition shadow-md"
                  >
                    <span>{isLoading ? 'جاري التحقق...' : 'تأكيد ودخول التطبيق'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOtpStep('phone')}
                    className="w-full text-center text-xs text-slate-500 hover:text-indigo-600 font-medium pt-1"
                  >
                    تغيير رقم الهاتف
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Secure Church Authentication Notice */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[11px] font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>نظام تسجيل دخول مشفّر ومعتمد عبر خوادم الكنيسة</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              إذا لم تكن تمتلك كوداً كنسياً أو كلمة مرور، يرجى مراجعة أمين الخدمة أو الخادم المسؤول لاستخراج حسابك المعتمد.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};
