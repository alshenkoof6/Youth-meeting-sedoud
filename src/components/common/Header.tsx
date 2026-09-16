import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Church, 
  ShieldCheck, 
  LogOut, 
  User, 
  ChevronDown, 
  Flame, 
  Star, 
  CheckCircle2, 
  Coffee, 
  Users, 
  IdCard, 
  Phone,
  LayoutDashboard
} from 'lucide-react';

interface HeaderProps {
  onOpenScan?: () => void;
  activeView: string;
  setActiveView: (view: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenScan, activeView, setActiveView }) => {
  const { currentUser, role, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const getRoleBadge = () => {
    switch (role) {
      case 'admin':
        return {
          title: 'أمانة الخدمة',
          color: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-800',
          dot: 'bg-purple-500',
          icon: ShieldCheck
        };
      case 'canteen_servant':
        return {
          title: 'مسؤول الكانتين',
          color: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800',
          dot: 'bg-amber-500',
          icon: Coffee
        };
      case 'servant':
        return {
          title: 'خادم متابعة',
          color: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800',
          dot: 'bg-blue-500',
          icon: Users
        };
      case 'supervisor':
        return {
          title: 'مشرف قطاع',
          color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
          dot: 'bg-indigo-500',
          icon: ShieldCheck
        };
      default:
        return {
          title: 'شاب',
          color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
          dot: 'bg-emerald-500',
          icon: User
        };
    }
  };

  const roleMeta = getRoleBadge();
  const RoleIcon = roleMeta.icon;

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
                <span className="hidden sm:inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-medium">
                  <CheckCircle2 className="w-3 h-3" />
                  مباشر
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">منصة الحضور الذكي والافتقاد والكانتين</p>
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

          {/* Right Controls: Authenticated User Profile Badge & Logout */}
          <div className="flex items-center gap-3">
            
            <div className="relative">
              <button
                id="user-profile-button"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition shadow-sm text-sm"
              >
                <div className={`w-2.5 h-2.5 rounded-full ${roleMeta.dot}`} />
                <span className="font-medium text-slate-800 dark:text-slate-200 max-w-[130px] truncate">
                  {currentUser?.displayName || 'المستخدم'}
                </span>
                <span className={`text-[11px] px-2 py-0.5 rounded-md border font-medium ${roleMeta.color}`}>
                  {roleMeta.title}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* User Profile Details Menu */}
              {showUserMenu && (
                <div 
                  id="user-profile-dropdown"
                  className="absolute left-0 mt-2 w-72 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-right"
                  dir="rtl"
                >
                  {/* User Details Header */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl mb-2 space-y-2 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                        <RoleIcon className="w-5 h-5" />
                      </div>
                      <div className="overflow-hidden">
                        <span className="font-bold text-sm text-slate-900 dark:text-white block truncate">
                          {currentUser?.displayName}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                          {roleMeta.title}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-xs space-y-1 text-slate-600 dark:text-slate-400">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <IdCard className="w-3.5 h-3.5 text-slate-400" />
                          <span>الكود الكنسي:</span>
                        </span>
                        <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-1.5 py-0.5 rounded text-[11px]">
                          {currentUser?.userCode || '---'}
                        </span>
                      </div>
                      {currentUser?.phoneNumber && (
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span>رقم الهاتف:</span>
                          </span>
                          <span className="font-mono text-[11px]">
                            {currentUser.phoneNumber}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Navigation Links */}
                  <div className="py-1 space-y-1">
                    {role === 'youth' && (
                      <button
                        onClick={() => {
                          setActiveView('youth-profile');
                          setShowUserMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-xl text-xs font-medium transition"
                      >
                        <User className="w-4 h-4 text-indigo-500" />
                        <span>الملف الشخصي والبيانات</span>
                      </button>
                    )}

                    {(role === 'admin' || role === 'servant' || role === 'supervisor') && (
                      <button
                        onClick={() => {
                          setActiveView('admin-dashboard');
                          setShowUserMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-xl text-xs font-medium transition"
                      >
                        <LayoutDashboard className="w-4 h-4 text-indigo-500" />
                        <span>لوحة التحكم الرئيسية للخدمة</span>
                      </button>
                    )}

                    {role === 'canteen_servant' && (
                      <button
                        onClick={() => {
                          setActiveView('canteen-dashboard');
                          setShowUserMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-xl text-xs font-medium transition"
                      >
                        <Coffee className="w-4 h-4 text-amber-500" />
                        <span>لوحة استبدال طلبات الكانتين</span>
                      </button>
                    )}
                  </div>

                  {/* Logout Button */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 mt-1">
                    <button
                      id="logout-button"
                      onClick={async () => {
                        setShowUserMenu(false);
                        await logout();
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl text-xs font-bold transition"
                    >
                      <span className="flex items-center gap-2">
                        <LogOut className="w-4 h-4" />
                        <span>تسجيل الخروج من الحساب</span>
                      </span>
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
