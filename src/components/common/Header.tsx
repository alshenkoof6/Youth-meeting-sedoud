import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Church, 
  UserCheck, 
  ShieldCheck, 
  LogOut, 
  User, 
  ChevronDown, 
  Flame, 
  Star, 
  CheckCircle2,
  Sparkles,
  Coffee,
  Users
} from 'lucide-react';

interface HeaderProps {
  onOpenScan?: () => void;
  activeView: string;
  setActiveView: (view: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenScan, activeView, setActiveView }) => {
  const { currentUser, role, switchUser, allUsers, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Church Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center text-white shadow-md shadow-indigo-200 dark:shadow-none">
              <Church className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">اجتماع الشباب</span>
                <span className="hidden sm:inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                  <CheckCircle2 className="w-3 h-3" />
                  مباشر
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">منصة الحضور الذكي والافتقاد والتفاعل</p>
            </div>
          </div>

          {/* Center Stats (For Youth view) */}
          {currentUser && role === 'youth' && (
            <div className="hidden md:flex items-center gap-4 bg-slate-100 dark:bg-slate-800 px-4 py-1.5 rounded-full text-sm">
              <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold">
                <Flame className="w-4 h-4 fill-amber-500 text-amber-500 animate-pulse" />
                <span>المواظبة: {currentUser.currentStreak} اجتماعات</span>
              </div>
              <div className="h-4 w-[1px] bg-slate-300 dark:bg-slate-700" />
              <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-semibold">
                <Star className="w-4 h-4 fill-indigo-500 text-indigo-500" />
                <span>{currentUser.totalPoints} نقطة</span>
              </div>
            </div>
          )}

          {/* Right Controls: User Switcher & Profile */}
          <div className="flex items-center gap-3">
            
            {/* Quick Demo Role Switcher Dropdown */}
            <div className="relative">
              <button
                id="role-switcher-button"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition shadow-sm text-sm"
              >
                <div className={`w-2.5 h-2.5 rounded-full ${
                  role === 'admin' ? 'bg-purple-500' : role === 'canteen_servant' ? 'bg-amber-500' : role === 'servant' ? 'bg-blue-500' : 'bg-emerald-500'
                }`} />
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {currentUser?.displayName || 'حساب تجريبي'}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                  {role === 'admin' ? 'أمانة الخدمة' : role === 'canteen_servant' ? 'خادم الكانتين' : role === 'servant' ? 'خادم' : 'شاب'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <div 
                  id="role-switcher-dropdown"
                  className="absolute left-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-2.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                >
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700/60 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block mb-0.5">تبديل الحساب لتجربة الأدوار المختلفة:</span>
                    انقر للتبديل الفوري بين واجهات المنظومة
                  </div>

                  {/* 4 Quick Role Switch Pills */}
                  <div className="p-2 border-b border-slate-100 dark:border-slate-700/60">
                    <span className="text-[10px] font-bold text-slate-400 block mb-1.5">تبديل سريع مباشر:</span>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          switchUser('canteen_servant_01');
                          setShowUserMenu(false);
                          setActiveView('canteen-dashboard');
                        }}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition text-start border ${
                          role === 'canteen_servant'
                            ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                            : 'bg-amber-50/80 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 border-amber-200 dark:border-amber-800/60 hover:bg-amber-100'
                        }`}
                      >
                        <Coffee className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">مسؤول الكانتين</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          switchUser('admin_abouna_01');
                          setShowUserMenu(false);
                          setActiveView('admin-dashboard');
                        }}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition text-start border ${
                          role === 'admin'
                            ? 'bg-purple-600 text-white border-purple-700 shadow-xs'
                            : 'bg-purple-50/80 dark:bg-purple-950/30 text-purple-900 dark:text-purple-200 border-purple-200 dark:border-purple-800/60 hover:bg-purple-100'
                        }`}
                      >
                        <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">أمانة الخدمة</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          switchUser('servant_maged_01');
                          setShowUserMenu(false);
                          setActiveView('admin-dashboard');
                        }}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition text-start border ${
                          role === 'servant'
                            ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                            : 'bg-blue-50/80 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-800/60 hover:bg-blue-100'
                        }`}
                      >
                        <Users className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">خادم (خ. ماجد)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          switchUser('user_mina_01');
                          setShowUserMenu(false);
                          setActiveView('youth-home');
                        }}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition text-start border ${
                          role === 'youth' && currentUser?.userId === 'user_mina_01'
                            ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                            : 'bg-emerald-50/80 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100'
                        }`}
                      >
                        <User className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">شاب (مينا عادل)</span>
                      </button>
                    </div>
                  </div>

                  <div className="py-1 max-h-60 overflow-y-auto space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 px-2 block pt-1">جميع الحسابات المسجلة:</span>
                    {(() => {
                      // Order users: admin first, canteen servant second, servants third, youth fourth
                      const rolePriority: Record<string, number> = {
                        admin: 1,
                        canteen_servant: 2,
                        servant: 3,
                        supervisor: 4,
                        youth: 5,
                      };
                      
                      // Ensure canteen_servant_01 is included even if stale array
                      const displayList = [...allUsers];
                      if (!displayList.some(u => u.role === 'canteen_servant' || u.userId === 'canteen_servant_01')) {
                        displayList.unshift({
                          userId: 'canteen_servant_01',
                          userCode: 'CN_000001',
                          displayName: 'ميخائيل رشدي — مسؤول الكانتين',
                          role: 'canteen_servant',
                          phoneNumber: '01239998881',
                          gender: 'male',
                          scheduleType: 'regular',
                          totalAttendances: 50,
                          currentStreak: 25,
                          bestStreak: 25,
                          totalPoints: 100,
                          consecutiveAbsences: 0,
                          followUpStatus: 'regular',
                          createdAt: '2024-01-01',
                          updatedAt: '2026-09-06'
                        });
                      }

                      displayList.sort((a, b) => {
                        const pA = rolePriority[a.role] ?? 99;
                        const pB = rolePriority[b.role] ?? 99;
                        return pA - pB;
                      });

                      return displayList.map((user) => {
                        const isCanteenUser = user.role === 'canteen_servant';
                        const isCurrent = currentUser?.userId === user.userId;

                        return (
                          <button
                            key={user.userId}
                            onClick={() => {
                              switchUser(user.userId);
                              setShowUserMenu(false);
                              if (user.role === 'youth' && activeView !== 'youth-home') {
                                setActiveView('youth-home');
                              } else if (user.role === 'canteen_servant' && !activeView.startsWith('canteen-')) {
                                setActiveView('canteen-dashboard');
                              } else if ((user.role === 'admin' || user.role === 'servant') && !activeView.startsWith('admin-')) {
                                setActiveView('admin-dashboard');
                              }
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-start text-xs transition ${
                              isCurrent 
                                ? isCanteenUser
                                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 font-bold border border-amber-300'
                                  : 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-200 font-semibold' 
                                : isCanteenUser
                                ? 'bg-amber-50/50 dark:bg-amber-950/20 text-slate-800 dark:text-slate-200 hover:bg-amber-100/70 border border-amber-200/50'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-700/40 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              {isCanteenUser ? (
                                <Coffee className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              ) : (
                                <div className={`w-2 h-2 rounded-full shrink-0 ${
                                  user.role === 'admin' ? 'bg-purple-500' : user.role === 'servant' ? 'bg-blue-500' : 'bg-emerald-500'
                                }`} />
                              )}
                              <span className="truncate">{user.displayName}</span>
                            </div>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                              isCanteenUser
                                ? 'bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-200'
                                : user.role === 'admin'
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                                : user.role === 'servant'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                            }`}>
                              {user.role === 'admin' ? 'أمانة الخدمة' : user.role === 'canteen_servant' ? 'مسؤول الكانتين' : user.role === 'servant' ? 'خادم' : 'شاب'}
                            </span>
                          </button>
                        );
                      });
                    })()}
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60">
                    <button
                      onClick={() => {
                        logout();
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl text-xs font-medium transition"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>تسجيل الخروج</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};
