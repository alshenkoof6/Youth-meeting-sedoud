import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { dataStore } from '../../services/dataStore';
import { formatArabicDate, formatArabicTime } from '../../lib/utils';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Star, 
  MessageSquare, 
  QrCode,
  Send,
  Sparkles
} from 'lucide-react';
import { Meeting, MeetingFeedback } from '../../types';

interface YouthMeetingsProps {
  onOpenScan: () => void;
}

export const YouthMeetings: React.FC<YouthMeetingsProps> = ({ onOpenScan }) => {
  const { currentUser } = useAuth();
  const [meetings] = useState<Meeting[]>(dataStore.meetings);
  const [feedbackMeeting, setFeedbackMeeting] = useState<Meeting | null>(null);
  const [rating, setRating] = useState<number>(5);
  const [likedText, setLikedText] = useState('');
  const [improveText, setImproveText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // Check which meetings current user attended
  const userAttendances = dataStore.attendance.filter(
    (a) => a.userId === currentUser?.userId
  );
  const attendedMeetingIds = new Set(userAttendances.map((a) => a.meetingId));

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackMeeting) return;

    const feedbackItem: MeetingFeedback = {
      feedbackId: `fb_${Date.now()}`,
      meetingId: feedbackMeeting.meetingId,
      meetingTitle: feedbackMeeting.title,
      rating,
      likedAspects: likedText.trim() || undefined,
      improvements: improveText.trim() || undefined,
      isAnonymous,
      userId: isAnonymous ? undefined : currentUser?.userId,
      userName: isAnonymous ? undefined : currentUser?.displayName,
      submittedAt: new Date().toISOString(),
    };

    await dataStore.submitFeedback(feedbackItem);
    setFeedbackSubmitted(true);
    setTimeout(() => {
      setFeedbackMeeting(null);
      setFeedbackSubmitted(false);
      setLikedText('');
      setImproveText('');
    }, 1800);
  };

  return (
    <div id="youth-meetings-view" className="space-y-6 pb-24 max-w-4xl mx-auto px-4 pt-4">
      
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">جدول الاجتماعات</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            سجل الحضور والمواعيد القادمة وفرصة مشاركة رأيك
          </p>
        </div>

        <button
          onClick={onOpenScan}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow transition"
        >
          <QrCode className="w-4 h-4" />
          <span>تسجيل حضور</span>
        </button>
      </div>

      {/* Meetings List */}
      <div className="space-y-4">
        {meetings.map((meeting) => {
          const hasAttended = attendedMeetingIds.has(meeting.meetingId);
          const isPast = new Date(meeting.date) < new Date(new Date().toISOString().split('T')[0]);
          const isActive = meeting.status === 'active';

          return (
            <div
              key={meeting.meetingId}
              className={`p-5 rounded-3xl border transition bg-white dark:bg-slate-900 ${
                isActive
                  ? 'border-indigo-400 ring-2 ring-indigo-500/20 shadow-md'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {formatArabicDate(meeting.date)}
                  </span>
                  {isActive && (
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 animate-pulse">
                      الاجتماع قائم الآن
                    </span>
                  )}
                </div>

                {/* Status Badge */}
                <div>
                  {hasAttended ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      تم تسجيل حضورك (+{meeting.pointsAwarded || 10} نقطة)
                    </span>
                  ) : isPast ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full bg-slate-100 text-slate-500">
                      لم تسجل حضوراً
                    </span>
                  ) : (
                    <button
                      onClick={onOpenScan}
                      className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      مسح كود الحضور
                    </button>
                  )}
                </div>
              </div>

              {/* Body */}
              <div className="py-3 space-y-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {meeting.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {meeting.description}
                </p>
                {meeting.speaker && (
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
                    المتحدث: {meeting.speaker}
                  </p>
                )}
              </div>

              {/* Footer Meta */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{formatArabicTime(meeting.startTime)} - {formatArabicTime(meeting.endTime)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{meeting.location}</span>
                  </div>
                </div>

                {/* Feedback Button */}
                {hasAttended && (
                  <button
                    onClick={() => setFeedbackMeeting(meeting)}
                    className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>إيه رأيك في اجتماع النهاردة؟</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* FEEDBACK MODAL */}
      {feedbackMeeting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            
            {feedbackSubmitted ? (
              <div className="text-center py-8 space-y-2">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">شكراً لرأيك الصادق!</h3>
                <p className="text-xs text-slate-500">مشاركتك تساعدنا في تطوير وتجديد فقرات الاجتماع دائماً.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitFeedback} className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    إيه رأيك في الاجتماع؟
                  </h3>
                  <button
                    type="button"
                    onClick={() => setFeedbackMeeting(null)}
                    className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                  >
                    إلغاء
                  </button>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {feedbackMeeting.title}
                </p>

                {/* Rating Stars */}
                <div className="flex items-center justify-center gap-2 py-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 transition transform hover:scale-125 focus:outline-none"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= rating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-300 dark:text-slate-700'
                        }`}
                      />
                    </button>
                  ))}
                </div>

                {/* What did you like */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    أكتر حاجة عجبتك في الاجتماع؟
                  </label>
                  <input
                    type="text"
                    value={likedText}
                    onChange={(e) => setLikedText(e.target.value)}
                    placeholder="مثل: كلمة المتحدث، الترانيم، المناقشة..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Suggestions / Improvements */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    مقترحات للتحسين في المرات القادمة:
                  </label>
                  <textarea
                    rows={2}
                    value={improveText}
                    onChange={(e) => setImproveText(e.target.value)}
                    placeholder="موضوعات تحب نسمعها أو أفكار جديدة..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
                  />
                </div>

                {/* Anonymous Toggle */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-slate-600 dark:text-slate-400">إرسال الرأي دون ذكر اسمي (مجهول)</span>
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition"
                >
                  <Send className="w-4 h-4" />
                  <span>إرسال الرأي</span>
                </button>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
