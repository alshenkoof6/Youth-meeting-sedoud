import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { UserRole } from './types';
import { Header } from './components/common/Header';
import { Navigation } from './components/common/Navigation';
import { QRScannerModal } from './components/youth/QRScannerModal';
import { LoginView } from './components/auth/LoginView';
import { ForceChangePasswordModal } from './components/auth/ForceChangePasswordModal';

// Youth Views
import { YouthHome } from './components/youth/YouthHome';
import { YouthMeetings } from './components/youth/YouthMeetings';
import { YouthActivities } from './components/youth/YouthActivities';
import { YouthRewards } from './components/youth/YouthRewards';
import { YouthProfile } from './components/youth/YouthProfile';

// Admin / Servant Views
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminYouth } from './components/admin/AdminYouth';
import { AdminServants } from './components/admin/AdminServants';
import { AdminMeetings } from './components/admin/AdminMeetings';
import { AdminAttendance } from './components/admin/AdminAttendance';
import { AdminFollowUp } from './components/admin/AdminFollowUp';
import { AdminTrips } from './components/admin/AdminTrips';
import { AdminAnnouncements } from './components/admin/AdminAnnouncements';
import { AdminRewards } from './components/admin/AdminRewards';
import { AdminFeedback } from './components/admin/AdminFeedback';
import { AdminReports } from './components/admin/AdminReports';
import { AdminSettings } from './components/admin/AdminSettings';

// Canteen Views
import { CanteenDashboard } from './components/canteen/CanteenDashboard';
import { CanteenRewards } from './components/canteen/CanteenRewards';

// Unified Modules (Calendar, Birthdays, Audit Logs)
import { UnifiedCalendar } from './components/calendar/UnifiedCalendar';
import { BirthdayDashboard } from './components/birthdays/BirthdayDashboard';
import { AuditLogDashboard } from './components/audit/AuditLogDashboard';

import { ShieldAlert, ArrowRight } from 'lucide-react';

const isAuthorizedForView = (view: string, currentRole: UserRole): boolean => {
  if (view === 'calendar') return true;

  if (currentRole === 'youth') {
    return view.startsWith('youth-') || view === 'calendar';
  }

  if (currentRole === 'canteen_servant') {
    return view.startsWith('canteen-') || view === 'calendar' || view === 'admin-rewards';
  }

  if (currentRole === 'servant') {
    const servantAllowed = [
      'admin-dashboard',
      'admin-youth',
      'admin-meetings',
      'admin-attendance',
      'admin-followup',
      'admin-trips',
      'admin-events',
      'admin-announcements',
      'admin-feedback',
      'birthdays',
      'calendar',
    ];
    return servantAllowed.includes(view);
  }

  if (currentRole === 'admin' || currentRole === 'supervisor') {
    return true;
  }

  return false;
};

const getDefaultViewForRole = (role: UserRole): string => {
  if (role === 'youth') return 'youth-home';
  if (role === 'canteen_servant') return 'canteen-dashboard';
  return 'admin-dashboard';
};

const MainAppContent: React.FC = () => {
  const { currentUser, role, isLoggedIn, isLoadingSession } = useAuth();
  
  const [activeView, setActiveView] = useState<string>(() => {
    if (role === 'youth') return 'youth-home';
    if (role === 'canteen_servant') return 'canteen-dashboard';
    return 'admin-dashboard';
  });

  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Synchronize activeView with role whenever role changes or unauthorized view is targeted
  useEffect(() => {
    if (!currentUser) return;
    if (!isAuthorizedForView(activeView, role)) {
      setActiveView(getDefaultViewForRole(role));
    }
  }, [role, currentUser, activeView]);

  if (isLoadingSession) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm font-bold text-slate-600 dark:text-slate-400">جاري التحقق من الجلسة الآمنة...</p>
      </div>
    );
  }

  if (!isLoggedIn || !currentUser) {
    return <LoginView />;
  }

  const isCurrentViewAuthorized = isAuthorizedForView(activeView, role);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-cairo">
      
      {/* Global Application Header */}
      <Header
        activeView={activeView}
        setActiveView={setActiveView}
        onOpenScan={() => setIsScannerOpen(true)}
      />

      <div className="flex-1 flex flex-col lg:flex-row">
        
        {/* Navigation (Bottom nav for youth on mobile, Sidebar for admin/canteen) */}
        <Navigation
          activeView={activeView}
          setActiveView={setActiveView}
          onOpenScan={() => setIsScannerOpen(true)}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-x-hidden min-h-[calc(100vh-4rem)]">
          
          {!isCurrentViewAuthorized ? (
            <div className="p-8 max-w-lg mx-auto my-12 text-center" dir="rtl">
              <div className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 rounded-3xl p-8 shadow-xl space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto border border-rose-200 dark:border-rose-800">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                  عفواً، هذه الواجهة غير مصرح بها لحسابك
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  حسابك الحالي مسجل برتبة ({role === 'youth' ? 'شاب' : role === 'canteen_servant' ? 'مسؤول الكانتين' : role === 'servant' ? 'خادم' : 'أمانة الخدمة'}). لا تمتلك صلاحية الدخول لهذه الواجهة المخصصة.
                </p>
                <button
                  onClick={() => setActiveView(getDefaultViewForRole(role))}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-sm"
                >
                  <span>العودة إلى واجهتي المصرح بها</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* YOUTH PORTAL VIEWS */}
              {activeView === 'youth-home' && (
                <YouthHome
                  onOpenScan={() => setIsScannerOpen(true)}
                  setActiveView={setActiveView}
                />
              )}

              {activeView === 'youth-meetings' && (
                <YouthMeetings onOpenScan={() => setIsScannerOpen(true)} />
              )}

              {activeView === 'youth-activities' && <YouthActivities />}
              {activeView === 'youth-rewards' && <YouthRewards />}
              {activeView === 'youth-profile' && <YouthProfile />}

              {/* CANTEEN SERVANT VIEWS */}
              {activeView === 'canteen-dashboard' && (
                <CanteenDashboard setActiveView={setActiveView} />
              )}
              {activeView === 'canteen-rewards' && (
                <CanteenRewards setActiveView={setActiveView} />
              )}

              {/* UNIFIED MODULES (CALENDAR, BIRTHDAYS, AUDIT LOGS) */}
              {activeView === 'calendar' && (
                <UnifiedCalendar
                  onNavigateToMeetings={() => setActiveView(role === 'youth' ? 'youth-meetings' : 'admin-meetings')}
                  onNavigateToEvents={() => setActiveView(role === 'youth' ? 'youth-activities' : 'admin-events')}
                  onNavigateToTrips={() => setActiveView('admin-trips')}
                />
              )}

              {activeView === 'birthdays' && <BirthdayDashboard />}
              {activeView === 'audit-logs' && <AuditLogDashboard />}

              {/* ADMIN & SERVANT VIEWS */}
              {activeView === 'admin-dashboard' && (
                <AdminDashboard setActiveView={setActiveView} />
              )}
              {activeView === 'admin-youth' && <AdminYouth />}
              {activeView === 'admin-servants' && <AdminServants />}
              {activeView === 'admin-meetings' && <AdminMeetings />}
              {activeView === 'admin-attendance' && <AdminAttendance />}
              {activeView === 'admin-followup' && <AdminFollowUp />}
              {activeView === 'admin-trips' && <AdminTrips />}
              {activeView === 'admin-events' && <YouthActivities />}
              {activeView === 'admin-announcements' && <AdminAnnouncements />}
              {activeView === 'admin-rewards' && <AdminRewards />}
              {activeView === 'admin-feedback' && <AdminFeedback />}
              {activeView === 'admin-reports' && <AdminReports />}
              {activeView === 'admin-settings' && <AdminSettings />}
            </>
          )}

        </main>
      </div>

      {/* Floating QR Scanner Modal (Available for youth or authorized servants) */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onAttendanceSuccess={(_points, _streak) => {
          // Attendance registered callback
        }}
      />

      {/* Mandatory First-Time Password Change Modal */}
      {currentUser.mustChangePassword && <ForceChangePasswordModal />}

    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
