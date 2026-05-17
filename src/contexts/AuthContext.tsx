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
  enterDemoMode: () => void;
  updateProfile: (data: any) => Promise<void>;
}

const DEMO_USER = {
  uid: 'demo-user-id',
  email: 'demo@audit-system.com',
  displayName: '데모 감사자',
  photoURL: null,
} as unknown as User;

const DEMO_PROFILE = {
  uid: 'demo-user-id',
  email: 'demo@audit-system.com',
  displayName: '데모 감사자',
  role: 'auditor',
  organization: '국가연구개발사업단',
};

const AuthContext = createContext<AuthContextType>({
  user: null, profile: null, loading: true,
  isDemoMode: false,
  enterDemoMode: () => {},
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

  const enterDemoMode = () => {
    sessionStorage.setItem('demoMode', 'true');
    setDemoMode(true);
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

  const effectiveUser = demoMode ? DEMO_USER : user;
  const effectiveProfile = demoMode ? DEMO_PROFILE : profile;
  const effectiveLoading = demoMode ? false : loading;

  return (
    <AuthContext.Provider value={{
      user: effectiveUser, profile: effectiveProfile, loading: effectiveLoading,
      isDemoMode: demoMode, enterDemoMode, updateProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
