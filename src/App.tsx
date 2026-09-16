import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
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

const MainAppContent: React.FC = () => {
  const { currentUser, role, isLoggedIn } = useAuth();
  
  // Default view based on role
  const [activeView, setActiveView] = useState<string>(() => {
    if (role === 'youth') return 'youth-home';
    if (role === 'canteen_servant') return 'canteen-dashboard';
    return 'admin-dashboard';
  });

  const [isScannerOpen, setIsScannerOpen] = useState(false);

  if (!isLoggedIn || !currentUser) {
    return <LoginView />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-cairo">
      
      {/* Global Application Header */}
      <Header
        activeView={activeView}
        setActiveView={setActiveView}
        onOpenScan={() => setIsScannerOpen(true)}
      />

      <div className="flex-1 flex flex-col lg:flex-row">
        
        {/* Navigation (Bottom nav for youth on mobile, Sidebar for admin) */}
        <Navigation
          activeView={activeView}
          setActiveView={setActiveView}
          onOpenScan={() => setIsScannerOpen(true)}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-x-hidden min-h-[calc(100vh-4rem)]">
          
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

        </main>
      </div>

      {/* Floating QR Scanner Modal (Available anytime from anywhere) */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onAttendanceSuccess={(points, streak) => {
          // Success callback
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
