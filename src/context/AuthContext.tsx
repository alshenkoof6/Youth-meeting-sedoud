import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { dataStore } from '../services/dataStore';
import { normalizeChurchCode } from '../utils/churchAuthUtils';
import { INITIAL_USERS } from '../lib/initialData';

interface AuthContextType {
  currentUser: UserProfile | null;
  role: UserRole;
  isLoggedIn: boolean;
  loginWithChurchCode: (codeOrPhone: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithPhone: (phoneNumber: string, otp: string) => Promise<boolean>;
  logout: () => void;
  switchUser: (userId: string) => void;
  allUsers: UserProfile[];
  updateCurrentUserProfile: (profile: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [allUsers, setAllUsers] = useState<UserProfile[]>(dataStore.users);
  // Default to Youth (Mina Adel) for instant live preview testing
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    return dataStore.users.find((u) => u.userId === 'user_mina_01') || dataStore.users[0] || null;
  });

  useEffect(() => {
    const unsub = dataStore.subscribe(() => {
      setAllUsers([...dataStore.users]);
      if (currentUser) {
        const updated = dataStore.users.find((u) => u.userId === currentUser.userId);
        if (updated) {
          setCurrentUser(updated);
        }
      }
    });
    return unsub;
  }, [currentUser]);

  const loginWithChurchCode = async (
    codeOrPhone: string,
    passwordInput: string
  ): Promise<{ success: boolean; error?: string }> => {
    const rawInput = codeOrPhone.trim();
    if (!rawInput) {
      return { success: false, error: 'يرجى إدخال الكود الكنسي أو رقم الهاتف' };
    }
    if (!passwordInput) {
      return { success: false, error: 'يرجى إدخال كلمة المرور' };
    }

    const normalizedInput = normalizeChurchCode(rawInput);
    
    // Find user by normalized code or phone number
    const user = allUsers.find((u) => {
      const uCode = normalizeChurchCode(u.userCode || '');
      return uCode === normalizedInput || u.phoneNumber.trim() === rawInput;
    });

    if (!user) {
      return {
        success: false,
        error: 'لم يتم العثور على حساب بهذا الكود الكنسي أو رقم الهاتف. يرجى مراجعة الخادم المسؤول.',
      };
    }

    const inputPass = passwordInput.trim();
    const storedPass = user.password?.trim();
    const tempPass = user.temporaryPassword?.trim();

    // Check credentials:
    // 1. Matches permanent password
    // 2. Or matches temporary password
    // 3. Or for default seed users where neither is set, allow demo password or any password
    const isPermanentMatch = storedPass && storedPass === inputPass;
    const isTempMatch = tempPass && tempPass === inputPass;
    const isDemoPass = !storedPass && !tempPass && (inputPass === '123456' || inputPass === 'church123' || inputPass.length >= 4);

    if (isPermanentMatch || isTempMatch || isDemoPass) {
      setCurrentUser(user);
      return { success: true };
    }

    return {
      success: false,
      error: 'كلمة المرور غير صحيحة. يرجى التأكد من كلمة المرور المستلمة أو كلمة مرورك الشخصية.',
    };
  };

  const loginWithPhone = async (phoneNumber: string, _otp: string): Promise<boolean> => {
    // Look up by phone number in dataStore
    const user = allUsers.find((u) => u.phoneNumber === phoneNumber.trim());
    if (user) {
      setCurrentUser(user);
      return true;
    }
    // If new user, create a youth account with clean YT_XXXX code
    const userCode = `YT_${Math.floor(100000 + Math.random() * 900000)}`;
    const newUser: UserProfile = {
      userId: `user_${Date.now()}`,
      userCode,
      displayName: 'مستخدم جديد',
      phoneNumber: phoneNumber.trim(),
      role: 'youth',
      gender: 'male',
      educationStage: 'university',
      scheduleType: 'regular',
      weeklySchedule: {
        sat: 'available',
        sun: 'available',
        mon: 'available',
        tue: 'available',
        wed: 'available',
        thu: 'available',
        fri: 'available',
      },
      totalAttendances: 0,
      currentStreak: 0,
      bestStreak: 0,
      totalPoints: 50, // Welcome gift
      consecutiveAbsences: 0,
      followUpStatus: 'regular',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await dataStore.updateUser(newUser);
    setCurrentUser(newUser);
    return true;
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const switchUser = (userId: string) => {
    let targetId = userId;
    // Handle alias IDs
    if (targetId === 'user_maged_servant') targetId = 'servant_maged_01';
    if (targetId === 'user_father_youhanna') targetId = 'admin_abouna_01';

    let user = allUsers.find((u) => u.userId === targetId);
    if (!user) {
      user = INITIAL_USERS.find((u) => u.userId === targetId);
      if (user) {
        if (!dataStore.users.some((u) => u.userId === user!.userId)) {
          dataStore.users.push(user);
          dataStore.notify();
        }
      }
    }
    if (user) {
      setCurrentUser(user);
    }
  };

  const updateCurrentUserProfile = async (updates: Partial<UserProfile>) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...updates, updatedAt: new Date().toISOString() };
    setCurrentUser(updated);
    await dataStore.updateUser(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role: currentUser?.role || 'youth',
        isLoggedIn: !!currentUser,
        loginWithChurchCode,
        loginWithPhone,
        logout,
        switchUser,
        allUsers,
        updateCurrentUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
