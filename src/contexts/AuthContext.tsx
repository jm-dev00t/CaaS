// 사용자 인증 상태 및 데모 모드를 관리하는 Context Provider
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  profile: any | null;
  loading: boolean;
  isDemoMode: boolean;
  enterDemoMode: (role?: string) => void;
  logout: () => void;
  updateProfile: (data: any) => Promise<void>;
}

const DEMO_PROFILES: Record<string, { uid: string; email: string; displayName: string; role: string; organization: string }> = {
  researcher: {
    uid: 'demo-researcher-id',
    email: 'researcher@audit-system.com',
    displayName: '데모 연구원',
    role: 'researcher',
    organization: '국가연구개발사업단',
  },
  finance_officer: {
    uid: 'demo-finance-id',
    email: 'finance@audit-system.com',
    displayName: '데모 감사자',
    role: 'finance_officer',
    organization: '국가연구개발사업단',
  },
  admin: {
    uid: 'demo-admin-id',
    email: 'admin@audit-system.com',
    displayName: '데모 관리자',
    role: 'admin',
    organization: '국가연구개발사업단',
  },
};

const makeDemoUser = (profile: typeof DEMO_PROFILES[string]) =>
  ({ uid: profile.uid, email: profile.email, displayName: profile.displayName, photoURL: null }) as unknown as User;

const AuthContext = createContext<AuthContextType>({
  user: null, profile: null, loading: true,
  isDemoMode: false,
  enterDemoMode: () => {},
  logout: () => {},
  updateProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(() =>
    sessionStorage.getItem('demoMode') === 'true'
  );
  const [demoRole, setDemoRole] = useState(() =>
    sessionStorage.getItem('demoRole') || 'admin'
  );

  const enterDemoMode = (role = 'admin') => {
    sessionStorage.setItem('demoMode', 'true');
    sessionStorage.setItem('demoRole', role);
    setDemoRole(role);
    setDemoMode(true);
  };

  const logout = () => {
    if (demoMode) {
      sessionStorage.removeItem('demoMode');
      sessionStorage.removeItem('demoRole');
      setDemoMode(false);
    } else {
      auth.signOut();
    }
  };

  const updateProfile = async (data: any) => {
    if (demoMode) return;
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, { ...profile, ...data }, { merge: true });
    setProfile((prev: any) => ({ ...prev, ...data }));
  };

  useEffect(() => {
    if (demoMode) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setProfile(userSnap.data());
        } else {
          const newProfile = {
            uid: firebaseUser.uid, email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            role: 'researcher', organization: 'Default Organization',
          };
          await setDoc(userRef, newProfile);
          setProfile(newProfile);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [demoMode]);

  const demoProfile = DEMO_PROFILES[demoRole] ?? DEMO_PROFILES.admin;
  const effectiveUser = demoMode ? makeDemoUser(demoProfile) : user;
  const effectiveProfile = demoMode ? demoProfile : profile;
  const effectiveLoading = demoMode ? false : loading;

  return (
    <AuthContext.Provider value={{
      user: effectiveUser, profile: effectiveProfile, loading: effectiveLoading,
      isDemoMode: demoMode, enterDemoMode, logout, updateProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
