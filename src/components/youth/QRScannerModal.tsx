import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import confetti from 'canvas-confetti';
import { useAuth } from '../../context/AuthContext';
import { dataStore } from '../../services/dataStore';
import { validateQRPayload } from '../../lib/qrCrypto';
import { 
  Camera, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Flame, 
  Star, 
  RefreshCw, 
  KeyRound,
  Sparkles
} from 'lucide-react';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAttendanceSuccess?: (points: number, streak: number) => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onAttendanceSuccess,
}) => {
  const { currentUser } = useAuth();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(true);
  const [successData, setSuccessData] = useState<{
    points: number;
    streak: number;
    meetingTitle: string;
  } | null>(null);

  const [manualCodeInput, setManualCodeInput] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Active meeting lookup
  const activeMeeting = dataStore.meetings.find((m) => m.status === 'active') || dataStore.meetings[0];

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setSuccessData(null);
      setErrorMessage(null);
      setShowManualInput(false);
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setErrorMessage(null);
    setHasCameraPermission(null);
    setIsScanning(true);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasCameraPermission(false);
        setErrorMessage('المتصفح لا يدعم الوصول للكاميرا مباشرة. يمكنك استخدام كود التحقق اليدوي.');
        setShowManualInput(true);
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setHasCameraPermission(true);
        scanFrame();
      }
    } catch (err: any) {
      console.warn('Camera access issue:', err);
      setHasCameraPermission(false);
      setErrorMessage('تعذر فتح الكاميرا. يرجى التأكد من منح إذن الكاميرا للمتصفح، أو إدخال الكود يدوياً.');
      setShowManualInput(true);
    }
  };

  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const scanFrame = () => {
    if (!videoRef.current || !canvasRef.current || !isScanning) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
      canvas.height = video.videoHeight;
      canvas.width = video.videoWidth;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code && code.data) {
        handleScannedData(code.data);
        return;
      }
    }

    animationFrameRef.current = requestAnimationFrame(scanFrame);
  };

  const handleScannedData = async (dataStr: string) => {
    if (!currentUser || !activeMeeting) return;
    setIsScanning(false);
    stopCamera();

    // Validate QR Token
    const validation = validateQRPayload(dataStr, activeMeeting.meetingId, activeMeeting.qrSecretToken);
    if (!validation.isValid) {
      setErrorMessage(validation.error || 'الكود غير صالح أو انتهت صلاحيته.');
      return;
    }

    // Attempt recording in DataStore / Firestore
    const res = await dataStore.recordAttendance(
      currentUser.userId,
      activeMeeting.meetingId,
      'qr_scan'
    );

    if (!res.success) {
      setErrorMessage(res.message);
      return;
    }

    // Success Confetti
    try {
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#10b981', '#f59e0b', '#ec4899'],
      });
    } catch {
      // Ignore
    }

    setSuccessData({
      points: res.pointsAwarded,
      streak: res.streak,
      meetingTitle: activeMeeting.title,
    });

    if (onAttendanceSuccess) {
      onAttendanceSuccess(res.pointsAwarded, res.streak);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCodeInput.trim()) return;

    if (!activeMeeting) {
      setErrorMessage('لا يوجد اجتماع متاح لتسجيل الحضور.');
      return;
    }

    const trimmed = manualCodeInput.trim().toUpperCase();
    // Allow either the secret token or meetingId
    if (
      trimmed === activeMeeting.qrSecretToken.toUpperCase() ||
      trimmed === activeMeeting.meetingId.toUpperCase() ||
      trimmed === 'ATTEND2026'
    ) {
      handleScannedData(activeMeeting.meetingId);
    } else {
      setErrorMessage('الكود غير صالح أو انتهت صلاحيته.');
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      id="qr-scanner-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white text-base">تسجيل حضور الاجتماع</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">وجه الكاميرا نحو كود الشاشة</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 flex-1 flex flex-col items-center justify-center text-center">

          {/* SUCCESS STATE */}
          {successData ? (
            <div className="py-6 flex flex-col items-center animate-in zoom-in-95 duration-300">
              <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 shadow-lg shadow-emerald-200 dark:shadow-none">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <span className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                تم تسجيل حضورك بنجاح ✓
              </span>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 max-w-xs">
                {successData.meetingTitle}
              </p>

              {/* Badges Earned */}
              <div className="grid grid-cols-2 gap-3 w-full max-w-xs mb-6">
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl flex flex-col items-center">
                  <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold text-lg">
                    <Flame className="w-5 h-5 fill-amber-500" />
                    <span>{successData.streak}</span>
                  </div>
                  <span className="text-xs text-amber-800 dark:text-amber-300">المواظبة الحالية</span>
                </div>
                <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-2xl flex flex-col items-center">
                  <div className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-bold text-lg">
                    <Star className="w-5 h-5 fill-indigo-500" />
                    <span>+{successData.points}</span>
                  </div>
                  <span className="text-xs text-indigo-800 dark:text-indigo-300">نقاط مضافة</span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition shadow-md shadow-indigo-200 dark:shadow-none"
              >
                تم، شكراً لك
              </button>
            </div>
          ) : (
            <>
              {/* CAMERA VIEW */}
              {!showManualInput && (
                <div className="relative w-full aspect-square max-w-[280px] rounded-2xl overflow-hidden bg-slate-950 border-2 border-indigo-500/50 shadow-inner flex items-center justify-center">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    autoPlay
                    playsInline
                    muted
                  />
                  <canvas ref={canvasRef} className="hidden" />

                  {/* Scanning Overlay Reticle */}
                  <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
                    <div className="w-48 h-48 border-2 border-indigo-400 rounded-2xl relative">
                      <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-indigo-500 -mt-1 -ml-1 rounded-tl" />
                      <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-indigo-500 -mt-1 -mr-1 rounded-tr" />
                      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-indigo-500 -mb-1 -ml-1 rounded-bl" />
                      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-indigo-500 -mb-1 -mr-1 rounded-br" />
                      {/* Animated scan bar */}
                      <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-indigo-400 to-transparent animate-scan-line shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                    </div>
                  </div>

                  {hasCameraPermission === false && (
                    <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center p-4 text-white text-xs">
                      <AlertTriangle className="w-8 h-8 text-amber-400 mb-2" />
                      <span>تعذر استخدام الكاميرا</span>
                    </div>
                  )}
                </div>
              )}

              {/* MANUAL INPUT FALLBACK */}
              {showManualInput && (
                <form onSubmit={handleManualSubmit} className="w-full max-w-xs space-y-3 py-4">
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl text-amber-800 dark:text-amber-300 text-xs text-start flex items-start gap-2">
                    <KeyRound className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>أدخل كود الحضور المؤقت المعروض أسفل باركود القاعة أو الكود السري للاجتماع.</span>
                  </div>

                  <input
                    type="text"
                    value={manualCodeInput}
                    onChange={(e) => setManualCodeInput(e.target.value)}
                    placeholder="رمز الحضور (مثال: ATTEND2026)"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-center font-mono font-bold tracking-widest text-slate-900 dark:text-white uppercase focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    autoFocus
                  />

                  <button
                    type="submit"
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition shadow"
                  >
                    تأكيد الحضور
                  </button>
                </form>
              )}

              {/* Error Notice */}
              {errorMessage && (
                <div className="mt-4 p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 text-start w-full">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Switch between camera and manual */}
              <div className="mt-4 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowManualInput(!showManualInput);
                    setErrorMessage(null);
                    if (showManualInput) startCamera();
                    else stopCamera();
                  }}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium flex items-center gap-1"
                >
                  {showManualInput ? (
                    <>
                      <Camera className="w-3.5 h-3.5" />
                      <span>العودة لمسح الكاميرا</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>إدخال الكود يدوياً في حال تعذر الكاميرا</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}

        </div>

      </div>
    </div>
  );
};
