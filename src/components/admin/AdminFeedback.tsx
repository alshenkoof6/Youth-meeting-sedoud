import React, { useState } from 'react';
import { dataStore } from '../../services/dataStore';
import { MessageSquare, Star, User, Calendar, Filter } from 'lucide-react';
import { MeetingFeedback } from '../../types';

export const AdminFeedback: React.FC = () => {
  const [feedbacks] = useState<MeetingFeedback[]>(dataStore.feedback);

  const averageRating = feedbacks.length > 0 
    ? (feedbacks.reduce((acc, f) => acc + f.rating, 0) / feedbacks.length).toFixed(1)
    : '5.0';

  return (
    <div id="admin-feedback-view" className="space-y-6 pb-20 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-indigo-600" />
            تقييمات وآراء الشباب في الاجتماعات
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            استطلاعات الرأي مجهولة المصدر والتغذية الراجعة لتطوير الفقرات والموضوعات
          </p>
        </div>

        {/* Average Rating Box */}
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-2xl shadow-sm">
          <div className="flex items-center gap-1 text-amber-400">
            <Star className="w-6 h-6 fill-amber-400" />
            <span className="text-2xl font-black text-slate-900 dark:text-white">{averageRating}</span>
          </div>
          <div className="text-xs text-slate-500">
            <span>متوسط التقييم العام</span>
            <span className="block text-[10px] text-slate-400">من إجمالي {feedbacks.length} تقييم</span>
          </div>
        </div>
      </div>

      {/* Feedbacks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {feedbacks.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border">
            لا توجد تقييمات مسجلة بعد.
          </div>
        ) : (
          feedbacks.map((fb, idx) => (
            <div
              key={fb.feedbackId || `fb_${idx}`}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    {fb.meetingTitle}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {fb.isAnonymous ? 'مشارك مجهول (سرية تامة)' : fb.userName} • {fb.submittedAt.split('T')[0]}
                  </span>
                </div>

                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-3.5 h-3.5 ${
                        s <= fb.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {fb.likedAspects && (
                <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 text-xs text-emerald-900 dark:text-emerald-200">
                  <span className="font-bold block mb-0.5">أكتر حاجة عجبتني:</span>
                  {fb.likedAspects}
                </div>
              )}

              {fb.improvements && (
                <div className="p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/20 text-xs text-indigo-900 dark:text-indigo-200">
                  <span className="font-bold block mb-0.5">مقترحات للتحسين:</span>
                  {fb.improvements}
                </div>
              )}
            </div>
          ))
        )}
      </div>

    </div>
  );
};
