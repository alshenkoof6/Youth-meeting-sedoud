import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Voucher } from '../../types';
import {
  X,
  Copy,
  CheckCircle2,
  Clock,
  Coffee,
  ShieldCheck,
  Download,
  AlertCircle
} from 'lucide-react';

interface VoucherQRModalProps {
  voucher: Voucher | null;
  isOpen: boolean;
  onClose: () => void;
}

export const VoucherQRModal: React.FC<VoucherQRModalProps> = ({ voucher, isOpen, onClose }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (voucher && isOpen) {
      // Generate standard high-contrast QR code with qrToken
      QRCode.toDataURL(voucher.qrToken, {
        width: 300,
        margin: 2,
        color: {
          dark: '#1e1b4b', // deep indigo
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('Error rendering QR code:', err));
    }
  }, [voucher, isOpen]);

  if (!isOpen || !voucher) return null;

  const handleCopy = () => {
    if (voucher.voucherCode) {
      navigator.clipboard?.writeText(voucher.voucherCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isExpired = new Date(voucher.expiresAt) < new Date();
  const isRedeemed = voucher.status === 'redeemed';

  return (
    <div
      id="voucher-qr-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Coffee className="w-5 h-5 text-amber-600" />
            <span className="font-bold text-sm text-slate-900 dark:text-white">قسيمة استلام الهدية</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 text-center space-y-4">
          
          <div>
            <span className="text-xs text-slate-400 block mb-1">الهدية من الكانتين:</span>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              {voucher.rewardNameSnapshot}
            </h3>
            <span className="inline-block mt-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300">
              تكلفة {voucher.pointsCost} نقطة
            </span>
          </div>

          {/* QR Container */}
          <div className="relative mx-auto w-56 h-56 p-2 bg-white rounded-2xl shadow-inner border-2 border-dashed border-amber-300 flex items-center justify-center">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="QR Code للقسيمة"
                className="w-full h-full object-contain rounded-xl"
              />
            ) : (
              <div className="text-xs text-slate-400">جاري إنشاء رمز الـ QR...</div>
            )}

            {/* Overlays for inactive states */}
            {isRedeemed && (
              <div className="absolute inset-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs flex flex-col items-center justify-center gap-1 rounded-2xl">
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                <span className="font-bold text-sm text-slate-800 dark:text-white">تم صرف القسيمة</span>
              </div>
            )}

            {isExpired && !isRedeemed && (
              <div className="absolute inset-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs flex flex-col items-center justify-center gap-1 rounded-2xl">
                <AlertCircle className="w-10 h-10 text-rose-500" />
                <span className="font-bold text-sm text-rose-600">انتهت صلاحية القسيمة</span>
              </div>
            )}
          </div>

          {/* Voucher Code Box */}
          <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-xs text-slate-500">كود القسيمة:</span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-black tracking-widest text-slate-900 dark:text-white text-base">
                {voucher.voucherCode}
              </span>
              <button
                onClick={handleCopy}
                className="p-1 rounded text-slate-400 hover:text-indigo-600 transition"
                title="نسخ كود القسيمة"
              >
                {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>صالحة حتى: {new Date(voucher.expiresAt).toLocaleDateString('ar-EG')}</span>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed bg-amber-50/50 dark:bg-amber-950/20 p-2.5 rounded-xl border border-amber-100 dark:border-amber-900/30">
            أظهر هذا الرمز لخادم الكانتين لمسحه وتسليمك طلبك فوراً!
          </p>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold text-xs hover:opacity-90 transition"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};
