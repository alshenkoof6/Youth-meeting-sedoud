import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Home,
  Calendar,
  Compass,
  Award,
  User,
  QrCode,
  LayoutDashboard,
  Users,
  UserCheck,
  ClipboardCheck,
  HeartHandshake,
  Bus,
  Sparkles,
  Megaphone,
  Gift,
  MessageSquare,
  FileSpreadsheet,
  Settings,
  Flame,
  Coffee,
  ScanLine
} from 'lucide-react';

interface NavigationProps {
  activeView: string;
  setActiveView: (view: string) => void;
  onOpenScan: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeView,
  setActiveView,
  onOpenScan,
}) => {
  const { role } = useAuth();
  const isYouth = role === 'youth';
  const isCanteen = role === 'canteen_servant';

  // CANTEEN SERVANT NAVIGATION
  if (isCanteen) {
    const canteenNavItems = [
      { id: 'canteen-dashboard', label: 'مكتب الصرف والتحقق', icon: ScanLine },
      { id: 'canteen-rewards', label: 'المخزون والمنتجات', icon: Coffee },
      { id: 'admin-rewards', label: 'سجل المكافآت العام', icon: Gift },
    ];

    return (
      <>
        {/* Desktop Sidebar for Canteen */}
        <aside
          id="canteen-sidebar"
          className="hidden lg:flex flex-col w-64 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 min-h-[calc(100vh-4rem)] p-4 shrink-0"
        >
          <div className="mb-4 px-3 py-2 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-900/60">
            <span className="text-xs font-bold text-amber-900 dark:text-amber-300 block">
              خدمة كانتين الاجتماع
            </span>
            <span className="text-[11px] text-amber-700 dark:text-amber-400">فحص وصرف قسائم الشباب</span>
          </div>

          <div className="space-y-1 overflow-y-auto flex-1 pr-1">
            {canteenNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;

              return (
                <button
                  key={item.id}
                  id={`sidebar-${item.id}`}
                  onClick={() => setActiveView(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition text-start ${
                    isActive
                      ? 'bg-amber-600 text-white shadow-sm shadow-amber-200 dark:shadow-none'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="pt-4 mt-auto border-t border-slate-200 dark:border-slate-800">
            <button
              id="preview-youth-portal-btn"
              onClick={() => setActiveView('youth-home')}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-slate-200 text-slate-700 dark:border-slate-800 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold transition"
            >
              <Home className="w-3.5 h-3.5" />
              <span>معاينة بوابة الشباب</span>
            </button>
          </div>
        </aside>

        {/* Mobile Horizontal Pill Bar for Canteen */}
        <div
          id="canteen-mobile-subnav"
          className="lg:hidden flex items-center gap-2 overflow-x-auto p-2 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-xs sticky top-16 z-20 no-scrollbar"
        >
          {canteenNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition ${
                activeView === item.id
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </>
    );
  }

  // YOUTH BOTTOM NAVIGATION
  if (isYouth) {
    const navItems = [
      { id: 'youth-home', label: 'الرئيسية', icon: Home },
      { id: 'youth-meetings', label: 'الاجتماعات', icon: Calendar },
      { id: 'scan-trigger', label: 'حضور', icon: QrCode, isSpecial: true },
      { id: 'youth-activities', label: 'الأنشطة', icon: Compass },
      { id: 'youth-rewards', label: 'المكافآت', icon: Award },
    ];

    return (
      <>
        {/* Mobile & Tablet Bottom Navigation Bar */}
        <nav 
          id="youth-bottom-navigation"
          aria-label="التنقل الرئيسي للشباب"
          className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] pb-safe"
        >
          <div className="max-w-md mx-auto flex items-center justify-around h-16 px-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;

              if (item.isSpecial) {
                return (
                  <button
                    key={item.id}
                    id="mobile-scan-qr-btn"
                    onClick={onOpenScan}
                    aria-label="تسجيل حضور الاجتماع بالكاميرا"
                    className="flex flex-col items-center justify-center -mt-6 group focus:outline-none"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 text-white flex items-center justify-center shadow-lg shadow-indigo-300 dark:shadow-indigo-900/50 group-active:scale-95 transition transform">
                      <QrCode className="w-7 h-7" />
                    </div>
                    <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-400 mt-1">سجّل حضورك</span>
                  </button>
                );
              }

              return (
                <button
                  key={item.id}
                  id={`nav-item-${item.id}`}
                  onClick={() => setActiveView(item.id)}
                  className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-colors ${
                    isActive
                      ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                  <span className="text-[11px] mt-1">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </>
    );
  }

  // ADMIN & SERVANT SIDEBAR NAVIGATION
  const adminNavItems = [
    { id: 'admin-dashboard', label: 'لوحة المؤشرات', icon: LayoutDashboard },
    { id: 'admin-youth', label: 'الشباب والمخدومين', icon: Users },
    { id: 'admin-servants', label: 'الخدام وتوزيع الخدمة', icon: UserCheck },
    { id: 'admin-meetings', label: 'الاجتماعات وكود العرض', icon: Calendar },
    { id: 'admin-attendance', label: 'سجل الحضور المباشر', icon: ClipboardCheck },
    { id: 'admin-followup', label: 'الافتقاد والغياب', icon: HeartHandshake, badge: 'مهم' },
    { id: 'admin-trips', label: 'الرحلات والحجوزات', icon: Bus },
    { id: 'admin-events', label: 'الأنشطة والأيام الروحية', icon: Sparkles },
    { id: 'admin-announcements', label: 'الإعلانات واللوحة', icon: Megaphone },
    { id: 'admin-rewards', label: 'المكافآت والنقاط', icon: Gift },
    { id: 'admin-feedback', label: 'تقييمات وآراء الشباب', icon: MessageSquare },
    { id: 'admin-reports', label: 'التقارير وتصدير البيانات', icon: FileSpreadsheet },
    ...(role === 'admin' ? [{ id: 'admin-settings', label: 'إعدادات وسجل التدقيق', icon: Settings }] : []),
  ];

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside 
        id="admin-sidebar"
        className="hidden lg:flex flex-col w-64 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 min-h-[calc(100vh-4rem)] p-4 shrink-0"
      >
        <div className="mb-4 px-3 py-2 bg-indigo-50/70 dark:bg-indigo-950/40 rounded-xl border border-indigo-100 dark:border-indigo-900/60">
          <span className="text-xs font-bold text-indigo-900 dark:text-indigo-300 block">
            {role === 'admin' ? 'بوابة أمانة الاجتماع' : 'بوابة الخادم والمتابعة'}
          </span>
          <span className="text-[11px] text-indigo-700 dark:text-indigo-400">إدارة الخدمة والافتقاد الفعال</span>
        </div>

        <div className="space-y-1 overflow-y-auto flex-1 pr-1">
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;

            return (
              <button
                key={item.id}
                id={`sidebar-${item.id}`}
                onClick={() => setActiveView(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition text-start ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200 dark:shadow-none'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Quick View as Youth button for servants/admins */}
        <div className="pt-4 mt-auto border-t border-slate-200 dark:border-slate-800">
          <button
            id="preview-youth-portal-btn"
            onClick={() => setActiveView('youth-home')}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-indigo-200 text-indigo-700 dark:border-indigo-800 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-xs font-semibold transition"
          >
            <Home className="w-3.5 h-3.5" />
            <span>عرض بوابة الشباب (الموبايل)</span>
          </button>
        </div>
      </aside>

      {/* Mobile Horizontal Pill Bar for Admins/Servants on smaller screens */}
      <div 
        id="admin-mobile-subnav"
        className="lg:hidden flex items-center gap-2 overflow-x-auto p-2 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-xs sticky top-16 z-20 no-scrollbar"
      >
        {adminNavItems.slice(0, 6).map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id)}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition ${
              activeView === item.id
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </>
  );
};
