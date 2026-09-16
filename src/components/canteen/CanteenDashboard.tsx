import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { dataStore } from '../../services/dataStore';
import { VoucherService, ValidationResult } from '../../services/voucherService';
import { Voucher, RewardItem } from '../../types';
import {
  QrCode,
  ScanLine,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Coffee,
  Search,
  Check,
  RefreshCw,
  XCircle,
  ShieldCheck,
  User,
  Ticket
} from 'lucide-react';
import { CanteenScannerModal } from './CanteenScannerModal';

export const CanteenDashboard: React.FC<{ setActiveView: (view: string) => void }> = ({ setActiveView }) => {
  const { currentUser } = useAuth();
  const [manualCode, setManualCode] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [rewards, setRewards] = useState<RewardItem[]>(dataStore.rewards);
  const [vouchers, setVouchers] = useState<Voucher[]>(dataStore.vouchers);
  const [redemptions, setRedemptions] = useState(dataStore.rewardRedemptions);

  useEffect(() => {
    const unsub = dataStore.subscribe(() => {
      setRewards([...dataStore.rewards]);
      setVouchers([...dataStore.vouchers]);
      setRedemptions([...dataStore.rewardRedemptions]);
    });
    return unsub;
  }, []);

  // Compute canteen summary metrics
  const availableVouchersCount = vouchers.filter((v) => v.status === 'available').length;
  const todayDateStr = new Date().toISOString().split('T')[0];
  const redeemedTodayCount = vouchers.filter(
    (v) => v.status === 'redeemed' && v.redeemedAt?.startsWith(todayDateStr)
  ).length;
  const lowStockCount = rewards.filter((r) => r.availableQuantity <= 5 && r.availableQuantity > 0).length;
  const outOfStockCount = rewards.filter((r) => r.availableQuantity === 0).length;

  // Handle manual code validation
  const handleValidate = (codeToTest: string) => {
    setActionNotice(null);
    const result = VoucherService.validateVoucher(codeToTest);
    setValidationResult(result);
  };

  // Handle explicit confirmation of voucher redemption
  const handleConfirmRedemption = async () => {
    if (!validationResult?.voucher || !currentUser) return;

    setIsRedeeming(true);
    setActionNotice(null);

    const res = await VoucherService.confirmRedemption(
      validationResult.voucher.voucherId,
      currentUser.userId,
      currentUser.displayName || 'خادم الكانتين',
      'الكانتين الرئيسي'
    );

    setIsRedeeming(false);

    if (res.success) {
      setActionNotice({ type: 'success', message: res.message });
      setValidationResult(null);
      setManualCode('');
    } else {
      setActionNotice({ type: 'error', message: res.message });
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Header & Quick Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-amber-600 via-amber-700 to-orange-700 text-white p-6 rounded-3xl shadow-lg shadow-amber-900/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-xs font-bold backdrop-blur-sm">
              بوابة صرف الكانتين الآمنة
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">كانتين اجتماع الشباب</h1>
          <p className="text-amber-100 text-sm mt-1">
            التحقق من قسائم الهدايا وصرف المشروبات والوجبات للشباب بمسح الـ QR أو الكود اليدوي
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            id="open-canteen-scanner-btn"
            onClick={() => setIsScannerOpen(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-amber-900 hover:bg-amber-50 font-bold text-sm shadow-md active:scale-95 transition"
          >
            <ScanLine className="w-5 h-5 text-amber-600" />
            <span>مسح QR القسيمة بالكاميرا</span>
          </button>
          <button
            id="manage-canteen-rewards-btn"
            onClick={() => setActiveView('canteen-rewards')}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm border border-white/20 backdrop-blur-sm transition"
          >
            <Coffee className="w-4 h-4" />
            <span>إدارة منتجات الكانتين</span>
          </button>
        </div>
      </div>

      {/* Action Notification Alert */}
      {actionNotice && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-3 text-sm font-semibold border ${
            actionNotice.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
              : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
          }`}
        >
          {actionNotice.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{actionNotice.message}</span>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
            <span>قسائم تم صرفها اليوم</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{redeemedTodayCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">عمليات صرف موثقة بالكانتين</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
            <span>قسائم نشطة مع الشباب</span>
            <Ticket className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">{availableVouchersCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">جاهزة للمسح والاستبدال</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
            <span>أصناف أوشكت على النفاد</span>
            <AlertTriangle className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-2xl font-black text-orange-600 dark:text-orange-400">{lowStockCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">المتبقي 5 قطع أو أقل</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
            <span>أصناف نفدت تماماً</span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400">{outOfStockCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">تحتاج إلى إعادة تعبئة المخزون</div>
        </div>
      </div>

      {/* Main Validation Desk */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Manual Code Input & Quick Scanner Trigger */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-2">
              <Search className="w-5 h-5 text-amber-600" />
              <span>فحص قسيمة الكانتين</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
              امسح الـ QR بكاميرا هاتفك أو اكتب كود القسيمة المطبوع على شاشة الشاب (مثلاً: VC-9A2K1)
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleValidate(manualCode);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  كود القسيمة (Voucher Code)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="manual-voucher-input"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                    placeholder="مثال: VC-8X92K"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-center text-lg tracking-wider focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
                  />
                  {manualCode && (
                    <button
                      type="button"
                      onClick={() => {
                        setManualCode('');
                        setValidationResult(null);
                      }}
                      className="absolute left-3 top-3.5 text-xs text-slate-400 hover:text-slate-600"
                    >
                      مسح
                    </button>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  id="validate-code-submit-btn"
                  disabled={!manualCode.trim()}
                  className="flex-1 py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  <span>فحص وصحة القسيمة</span>
                </button>
                <button
                  type="button"
                  id="scanner-shortcut-btn"
                  onClick={() => setIsScannerOpen(true)}
                  className="px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm transition flex items-center justify-center"
                  title="فتح الكاميرا"
                >
                  <QrCode className="w-5 h-5 text-amber-600" />
                </button>
              </div>
            </form>
          </div>

          {/* Canteen Staff Guidelines */}
          <div className="bg-amber-50/70 dark:bg-amber-950/30 p-5 rounded-2xl border border-amber-200/60 dark:border-amber-900/40 text-xs space-y-2 text-amber-900 dark:text-amber-200">
            <div className="font-bold flex items-center gap-2 text-amber-950 dark:text-amber-100">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              <span>إرشادات أمان الصرف بالكانتين:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-amber-900/80 dark:text-amber-300/80 leading-relaxed">
              <li>تأكد من مطابقة اسم الشاب والهدية المطلوبة على الشاشة قبل تسليم الطلب.</li>
              <li>الضغط على "تأكيد الصرف الآن" يوثق الصرف ويمنع استخدام نفس القسيمة مرة أخرى نهائياً.</li>
              <li>القسائم المنتهية الصلاحية لا تقبل الصرف حرصاً على عدالة النقاط.</li>
            </ul>
          </div>
        </div>

        {/* Right Column: Validation Result Card & Confirmation */}
        <div className="lg:col-span-7">
          {validationResult ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-6 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      validationResult.valid ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                    }`}
                  />
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    نتيجة الفحص الفوري
                  </span>
                </div>
                <span
                  className={`text-xs px-3 py-1 rounded-full font-bold ${
                    validationResult.valid
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                  }`}
                >
                  {validationResult.valid ? 'صالحة للصرف ✓' : 'غير صالحة ✕'}
                </span>
              </div>

              {/* Message */}
              <div
                className={`p-3.5 rounded-xl text-xs font-semibold ${
                  validationResult.valid
                    ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                    : 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300'
                }`}
              >
                {validationResult.message}
              </div>

              {/* Minimum Safe Youth Info (No private PII) */}
              {validationResult.voucher && (
                <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl space-y-4 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs text-slate-500 block mb-1">الهدية المطلوبة من الكانتين:</span>
                      <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <Coffee className="w-5 h-5 text-amber-600" />
                        {validationResult.voucher.rewardNameSnapshot}
                      </h3>
                    </div>
                    <div className="text-end">
                      <span className="text-xs text-slate-500 block mb-1">كود القسيمة:</span>
                      <span className="text-sm font-mono font-bold px-2 py-1 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                        {validationResult.voucher.voucherCode}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200 dark:border-slate-700 text-xs">
                    <div>
                      <span className="text-slate-500 block">صاحب القسيمة (الشاب):</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        {validationResult.voucher.userNameSnapshot}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">تاريخ انتهاء الصلاحية:</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300 mt-0.5 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(validationResult.voucher.expiresAt).toLocaleDateString('ar-EG')}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                {validationResult.valid && (
                  <button
                    type="button"
                    id="confirm-redeem-btn"
                    onClick={handleConfirmRedemption}
                    disabled={isRedeeming}
                    className="flex-1 py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
                  >
                    {isRedeeming ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-5 h-5" />
                    )}
                    <span>تأكيد الصرف وتسليم الهدية الآن</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setValidationResult(null);
                    setManualCode('');
                  }}
                  className="py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  إلغاء
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 text-center flex flex-col items-center justify-center min-h-[320px] text-slate-400">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center mb-4">
                <Ticket className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-700 dark:text-slate-300 mb-1">
                في انتظار مسح أو إدخال القسيمة
              </h3>
              <p className="text-xs text-slate-500 max-w-sm">
                عندما يقوم الشاب بإظهار كود الـ QR الخاص بقسيمته، انقر على "مسح QR" أو اكتب الكود لفحصه وصرفه فوراً.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* Recent Redemptions Log */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600" />
            <span>سجل آخر عمليات الصرف بالكانتين</span>
          </h2>
          <span className="text-xs text-slate-500">إجمالي المصروف: {redemptions.length} طلب</span>
        </div>

        {redemptions.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            لم تسجل عمليات صرف قسائم بالكانتين بعد اليوم.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold">
                  <th className="py-2.5 px-3 text-start">كود القسيمة</th>
                  <th className="py-2.5 px-3 text-start">الصنف / الهدية</th>
                  <th className="py-2.5 px-3 text-start">الشاب المستلم</th>
                  <th className="py-2.5 px-3 text-start">وقت الصرف</th>
                  <th className="py-2.5 px-3 text-start">خادم الكانتين</th>
                  <th className="py-2.5 px-3 text-start">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {redemptions.slice(0, 10).map((r) => (
                  <tr key={r.redemptionId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                    <td className="py-3 px-3 font-mono font-bold text-amber-700 dark:text-amber-400">
                      {r.voucherCode}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-800 dark:text-slate-200">
                      {r.rewardNameSnapshot}
                    </td>
                    <td className="py-3 px-3 text-slate-700 dark:text-slate-300">
                      {r.userNameSnapshot}
                    </td>
                    <td className="py-3 px-3 text-slate-500">
                      {new Date(r.redeemedAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-3 text-slate-500">
                      {r.redeemedByName || 'خادم الكانتين'}
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 font-semibold">
                        <CheckCircle2 className="w-3 h-3" />
                        تم الصرف
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Canteen Camera Scanner Modal */}
      <CanteenScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={(scannedToken) => {
          setIsScannerOpen(false);
          setManualCode(scannedToken);
          handleValidate(scannedToken);
        }}
      />

    </div>
  );
};
