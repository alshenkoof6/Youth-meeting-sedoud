import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { dataStore } from '../../services/dataStore';
import { Megaphone, Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Announcement } from '../../types';

export const AdminAnnouncements: React.FC = () => {
  const { currentUser } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>(dataStore.announcements);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [priority, setPriority] = useState<'normal' | 'urgent'>('normal');
  const [notice, setNotice] = useState<string | null>(null);

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;

    const item: Announcement = {
      announcementId: `anc_${Date.now()}`,
      title: title.trim(),
      body: body.trim(),
      priority,
      status: 'active',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    };

    await dataStore.createAnnouncement(item);
    setAnnouncements([...dataStore.announcements]);
    setTitle('');
    setBody('');
    setNotice('تم نشر الإعلان بنجاح للشباب');
    setTimeout(() => setNotice(null), 3000);
  };

  const handleDeleteAnnouncement = async (id: string) => {
    await dataStore.deleteAnnouncement(id);
    setAnnouncements(announcements.filter((a) => a.announcementId !== id));
  };

  return (
    <div id="admin-announcements-view" className="space-y-6 pb-20 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Megaphone className="w-6 h-6 text-indigo-600" />
          لوحة الإعلانات والتنبيهات
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          نشر الإعلانات الهامة والتنبيهات العاجلة التي تظهر فوراً في الشاشة الرئيسية للشباب
        </p>
      </div>

      {notice && (
        <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{notice}</span>
        </div>
      )}

      {/* Grid: Create Form + Active Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Create Form */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
          <h2 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <Plus className="w-4 h-4 text-indigo-600" />
            نشر إعلان جديد
          </h2>

          <form onSubmit={handleCreateAnnouncement} className="space-y-3 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">عنوان الإعلان</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: تقديم ميعاد الاجتماع نصف ساعة"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">درجة الأهمية</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
              >
                <option value="normal">عادي</option>
                <option value="urgent">عاجل وهام (يظهر بتمييز أحمر)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">نص الإعلان والتفاصيل</label>
              <textarea
                rows={4}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="اكتب التفاصيل الكاملة..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 resize-none focus:outline-none"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition shadow"
            >
              نشر الإعلان الآن
            </button>
          </form>
        </div>

        {/* Announcements List */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="font-bold text-base text-slate-900 dark:text-white">
            الإعلانات النشطة حالياً ({announcements.length})
          </h2>

          <div className="space-y-3">
            {announcements.map((anc, idx) => (
              <div
                key={anc.announcementId || `anc_${idx}`}
                className={`p-5 rounded-3xl border transition flex items-start justify-between gap-4 ${
                  anc.priority === 'urgent'
                    ? 'bg-rose-50/70 border-rose-200 dark:bg-rose-950/30 dark:border-rose-900'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    {anc.priority === 'urgent' && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-600 text-white font-bold">
                        عاجل
                      </span>
                    )}
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">{anc.title}</h3>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {anc.body}
                  </p>
                  <span className="text-[10px] text-slate-400 block pt-1">
                    تاريخ النشر: {anc.createdAt ? anc.createdAt.split('T')[0] : (anc.publishedAt || 'اليوم')}
                  </span>
                </div>

                <button
                  onClick={() => handleDeleteAnnouncement(anc.announcementId)}
                  className="text-slate-400 hover:text-rose-600 p-2 rounded-xl hover:bg-rose-50 transition"
                  title="حذف الإعلان"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
