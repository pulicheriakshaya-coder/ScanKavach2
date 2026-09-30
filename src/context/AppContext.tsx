/**
 * @file src/context/AppContext.tsx
 * @description Centralized React state context for authentication, language, theme, and models.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getCurrentSession, logoutUser } from '../lib/auth';
import { loadReferenceBank } from '../lib/memoryBank';
import { loadClassifierModel, SerializedClassifier } from '../lib/classifier';
import { getModelStatus } from '../lib/tfLoader';
import { Language, ReferenceBank, UserSession } from '../types';

interface AppContextType {
  session: UserSession | null;
  setSession: (s: UserSession | null) => void;
  lang: Language;
  setLang: (l: Language) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  bank: ReferenceBank | null;
  refreshBank: () => Promise<void>;
  classifier: SerializedClassifier | null;
  refreshClassifier: () => Promise<void>;
  modelStatus: { isTfLoaded: boolean; isModelReady: boolean; backend: string };
  checkModelStatus: () => void;
  signOut: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<UserSession | null>(() => getCurrentSession());
  const [lang, setLangState] = useState<Language>(() => {
    return (localStorage.getItem('scankavach_lang') as Language) || 'en';
  });
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [bank, setBank] = useState<ReferenceBank | null>(null);
  const [classifier, setClassifier] = useState<SerializedClassifier | null>(null);
  const [modelStatus, setModelStatus] = useState(getModelStatus());

  const setLang = (l: Language) => {
    setLangState(l);
    try {
      localStorage.setItem('scankavach_lang', l);
      document.documentElement.lang = l;
    } catch {
      // In-memory
    }
  };

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      if (next === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return next;
    });
  };

  const refreshBank = async () => {
    try {
      const b = await loadReferenceBank();
      setBank(b);
    } catch {
      setBank(null);
    }
  };

  const refreshClassifier = async () => {
    try {
      const c = await loadClassifierModel();
      setClassifier(c);
    } catch {
      setClassifier(null);
    }
  };

  const checkModelStatus = () => {
    setModelStatus(getModelStatus());
  };

  const signOut = () => {
    logoutUser();
    setSession(null);
  };

  useEffect(() => {
    document.documentElement.lang = lang;
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    }
    refreshBank();
    refreshClassifier();
  }, []);

  return (
    <AppContext.Provider
      value={{
        session,
        setSession,
        lang,
        setLang,
        theme,
        toggleTheme,
        bank,
        refreshBank,
        classifier,
        refreshClassifier,
        modelStatus,
        checkModelStatus,
        signOut,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
