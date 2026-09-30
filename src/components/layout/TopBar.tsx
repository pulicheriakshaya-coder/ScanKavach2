/**
 * @file src/components/layout/TopBar.tsx
 * @description Top navigation bar with status pills, language switcher, theme toggle, and user avatar.
 */

import React from 'react';
import {
  ShieldCheck,
  Cpu,
  Database,
  Globe,
  Sun,
  Moon,
  LogOut,
  User as UserIcon,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Language } from '../../types';
import { t } from '../../lib/i18n';

export const TopBar: React.FC<{ onToggleSidebar?: () => void }> = ({ onToggleSidebar }) => {
  const {
    session,
    lang,
    setLang,
    theme,
    toggleTheme,
    bank,
    modelStatus,
    signOut,
  } = useApp();

  return (
    <header className="h-16 border-b border-slate-700/60 bg-slate-900/90 backdrop-blur px-4 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          aria-label="Toggle Navigation Menu"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-slate-100 text-base tracking-tight">ScanKavach</span>
            <span className="hidden sm:inline-block ml-2 text-xs text-teal-400/80 font-medium">
              Decision Support
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {/* Model Status Pill */}
        <div
          className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-slate-800 border-slate-700 text-slate-300"
          title={`TensorFlow Backend: ${modelStatus.backend}`}
        >
          <Cpu className="w-3.5 h-3.5 text-teal-400" />
          <span>{modelStatus.isModelReady ? 'MobileNet Ready' : 'TF On-Demand'}</span>
        </div>

        {/* Bank Status Pill */}
        <div
          className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
            bank
              ? 'bg-teal-950/40 border-teal-800/60 text-teal-300'
              : 'bg-amber-950/40 border-amber-800/60 text-amber-300'
          }`}
          title={bank ? `Calibrated on ${bank.totalNormals} scans` : 'No calibrated bank active'}
        >
          <Database className="w-3.5 h-3.5" />
          <span>{bank ? `Bank: ${bank.totalNormals} Scans` : 'No Bank Active'}</span>
        </div>

        {/* Language Select */}
        <div className="relative flex items-center">
          <Globe className="w-4 h-4 text-slate-400 absolute left-2 pointer-events-none" />
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as Language)}
            aria-label="Select Language"
            className="pl-8 pr-3 py-1 text-xs bg-slate-800 text-slate-200 border border-slate-700 rounded-lg hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="en">English</option>
            <option value="te">తెలుగు (Telugu)</option>
            <option value="hi">हिन्दी (Hindi)</option>
          </select>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          className="p-1.5 text-slate-400 hover:text-slate-100 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* User Role / Sign Out */}
        {session && (
          <div className="flex items-center gap-2 pl-2 border-l border-slate-700">
            <div className="hidden sm:block text-right">
              <div className="text-xs font-medium text-slate-200">{session.user.name}</div>
              <div className="text-[10px] text-teal-400 font-medium">{session.user.role}</div>
            </div>
            <div className="w-8 h-8 rounded-full bg-teal-600/30 text-teal-300 border border-teal-500/40 flex items-center justify-center">
              <UserIcon className="w-4 h-4" />
            </div>
            <button
              onClick={signOut}
              title={t('signOut', lang)}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500"
              aria-label={t('signOut', lang)}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
