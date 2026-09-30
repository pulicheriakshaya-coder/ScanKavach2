/**
 * @file src/components/layout/AppLayout.tsx
 * @description Main application shell providing responsive layout, skip link, and safety disclaimer banner.
 */

import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { useApp } from '../../context/AppContext';
import { t } from '../../lib/i18n';
import { ShieldAlert } from 'lucide-react';

export const AppLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { lang } = useApp();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Accessible skip link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-teal-600 focus:text-white focus:rounded-md shadow-lg"
      >
        Skip to main content
      </a>

      <div className="flex flex-1">
        <Sidebar
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(!collapsed)}
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
        />

        <div className="flex-1 flex flex-col min-w-0">
          <TopBar onToggleSidebar={() => setMobileOpen(true)} />

          {/* Universal Safety Disclaimer Bar */}
          <div className="bg-amber-950/40 border-b border-amber-800/40 px-4 py-2 flex items-center justify-center gap-2 text-xs text-amber-200/90 text-center">
            <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>{t('safetyDisclaimer', lang)}</span>
          </div>

          <main id="main-content" className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto outline-none">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};
