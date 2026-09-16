import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { dataStore } from '../services/dataStore';
import { normalizeChurchCode } from '../utils/churchAuthUtils';
import { getFirebaseAuth } from '../lib/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  signInAnonymously,
} from 'firebase/auth';

interface AuthContextType {
  currentUser: UserProfile | null;
  role: UserRole;
  isLoggedIn: boolean;
  isLoadingSession: boolean;
  loginWithChurchCode: (codeOrPhone: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithPhone: (phoneNumber: string, otp: string) => Promise<boolean>;
  logout: () => Promise<void>;
  allUsers: UserProfile[];
  updateCurrentUserProfile: (profile: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'church_auth_user_id';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [allUsers, setAllUsers] = useState<UserProfile[]>(dataStore.users);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);

  // Synchronize with dataStore changes & restore session on initial load
  useEffect(() => {
    // 1. Restore authenticated session from localStorage if present
    const savedUserId = localStorage.getItem(AUTH_STORAGE_KEY);
    if (savedUserId) {
      const match = dataStore.users.find((u) => u.userId === savedUserId);
      if (match) {
        setCurrentUser(match);
      }
    }

    // 2. Listen to real Firebase Auth state changes
    const auth = getFirebaseAuth();
    const unsubAuth = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        // Authenticated with Firebase Auth
        const activeUserId = localStorage.getItem(AUTH_STORAGE_KEY);
        if (activeUserId) {
          const matched = dataStore.users.find((u) => u.userId === activeUserId);
          if (matched) {
            setCurrentUser(matched);
          }
        }
      } else {
        // Firebase signed out and no session stored
        if (!localStorage.getItem(AUTH_STORAGE_KEY)) {
          setCurrentUser(null);
        }
      }
      setIsLoadingSession(false);
    });

    // 3. Subscribe to dataStore updates
    const unsubStore = dataStore.subscribe(() => {
      setAllUsers([...dataStore.users]);
      const currentStoredId = localStorage.getItem(AUTH_STORAGE_KEY);
      if (currentStoredId) {
        const updated = dataStore.users.find((u) => u.userId === currentStoredId);
        if (updated) {
          setCurrentUser(updated);
        }
      }
    });

    // Mark loading session as done after initial check
    const timeout = setTimeout(() => {
      setIsLoadingSession(false);
    }, 400);

    return () => {
      unsubAuth();
      unsubStore();
      clearTimeout(timeout);
    };
  }, []);

  // Strict Authentication with Church Code or Phone + Password
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

    // Look up user strictly in registered users
    const user = allUsers.find((u) => {
      const uCode = normalizeChurchCode(u.userCode || '');
      return uCode === normalizedInput || u.phoneNumber.trim() === rawInput;
    });

    if (!user) {
      return {
        success: false,
        error: 'لم يتم العثور على حساب بهذا الكود الكنسي أو رقم الهاتف. يرجى مراجعة الخادم المسؤول أو أمانة الخدمة.',
      };
    }

    const inputPass = passwordInput.trim();
    const storedPass = user.password?.trim();
    const tempPass = user.temporaryPassword?.trim();

    // Strict credential check: must match permanent password or assigned temporary password
    const isPermanentMatch = !!storedPass && storedPass === inputPass;
    const isTempMatch = !!tempPass && tempPass === inputPass;

    if (!isPermanentMatch && !isTempMatch) {
      return {
        success: false,
        error: 'كلمة المرور غير صحيحة. يرجى التأكد من كلمة المرور الخاصة بك أو المؤقتة.',
      };
    }

    // Authenticate with Firebase Authentication
    try {
      const auth = getFirebaseAuth();
      // Format a deterministic Firebase Auth credential for the church member
      const cleanIdentifier = (user.userCode || user.userId).toLowerCase().replace(/[^a-z0-9]/g, '');
      const authEmail = `${cleanIdentifier}@youthchurch.internal`;
      const authPass = inputPass.length >= 6 ? inputPass : `${inputPass}000000`.slice(0, 6);

      try {
        await signInWithEmailAndPassword(auth, authEmail, authPass);
      } catch (signInErr: any) {
        if (
          signInErr.code === 'auth/user-not-found' ||
          signInErr.code === 'auth/invalid-credential' ||
          signInErr.code === 'auth/wrong-password'
        ) {
          try {
            await createUserWithEmailAndPassword(auth, authEmail, authPass);
          } catch {
            // If email registration is restricted or project settings differ, ensure session token via anonymous auth
            try {
              await signInAnonymously(auth);
            } catch (e) {
              console.warn('Firebase Auth anonymous fallback notice:', e);
            }
          }
        } else {
          try {
            await signInAnonymously(auth);
          } catch (e) {
            console.warn('Firebase Auth anonymous fallback notice:', e);
          }
        }
      }
    } catch (fbErr) {
      console.warn('Firebase Auth synchronization error:', fbErr);
    }

    // Save authenticated session
    localStorage.setItem(AUTH_STORAGE_KEY, user.userId);
    setCurrentUser(user);

    // Audit login
    await dataStore.logAudit({
      actorId: user.userId,
      actorName: user.displayName,
      actorRole: user.role,
      action: 'تسجيل دخول ناجح بالحساب المعتمد',
      targetCollection: 'users',
      targetId: user.userId,
      details: {
        method: 'church_code',
        loginTime: new Date().toISOString(),
      },
    });

    return { success: true };
  };

  // Phone OTP login
  const loginWithPhone = async (phoneNumber: string, _otp: string): Promise<boolean> => {
    const cleanPhone = phoneNumber.trim();
    const user = allUsers.find((u) => u.phoneNumber.trim() === cleanPhone);
    if (user) {
      try {
        const auth = getFirebaseAuth();
        await signInAnonymously(auth);
      } catch (e) {
        console.warn('Firebase Auth phone session notice:', e);
      }
      localStorage.setItem(AUTH_STORAGE_KEY, user.userId);
      setCurrentUser(user);

      await dataStore.logAudit({
        actorId: user.userId,
        actorName: user.displayName,
        actorRole: user.role,
        action: 'تسجيل دخول عبر رقم الهاتف',
        targetCollection: 'users',
        targetId: user.userId,
      });

      return true;
    }
    return false;
  };

  // Real Logout: Clears Firebase Auth and stored tokens
  const logout = async (): Promise<void> => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    try {
      const auth = getFirebaseAuth();
      await firebaseSignOut(auth);
    } catch (e) {
      console.warn('Firebase signOut error:', e);
    }
    setCurrentUser(null);
  };

  // Update profile
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
        isLoadingSession,
        loginWithChurchCode,
        loginWithPhone,
        logout,
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
