/**
 * @file src/components/layout/Sidebar.tsx
 * @description Collapsible navigation sidebar for all ScanKavach application routes.
 */

import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Database,
  ScanEye,
  Layers,
  LineChart,
  Sliders,
  BrainCircuit,
  HeartPulse,
  Bot,
  FileBadge,
  Info,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { t } from '../../lib/i18n';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}) => {
  const { lang } = useApp();

  const navItems = [
    { to: '/', label: t('navDashboard', lang), icon: LayoutDashboard },
    { to: '/bank', label: t('navBuildBank', lang), icon: Database },
    { to: '/analyze', label: t('navAnalyze', lang), icon: ScanEye },
    { to: '/batch', label: t('navBatch', lang), icon: Layers },
    { to: '/evaluation', label: t('navEvaluation', lang), icon: LineChart },
    { to: '/optimization', label: t('navOptimizationLab', lang), icon: Sliders },
    { to: '/classifier', label: t('navConditionModel', lang), icon: BrainCircuit },
    { to: '/health-hub', label: t('navHealthHub', lang), icon: HeartPulse },
    { to: '/assistant', label: t('navAssistant', lang), icon: Bot },
    { to: '/model-card', label: t('navModelCard', lang), icon: FileBadge },
    { to: '/about', label: t('navAbout', lang), icon: Info },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-40 md:hidden"
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed md:sticky top-0 left-0 z-40 h-screen bg-slate-900 border-r border-slate-700/60 transition-all duration-200 flex flex-col ${
          collapsed ? 'w-20' : 'w-64'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-700/60">
          {!collapsed && (
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Navigation
            </span>
          )}
          <button
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors mx-auto"
          >
            {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1" aria-label="Main Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-teal-600/20 text-teal-400 border border-teal-500/30'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  } ${collapsed ? 'justify-center' : ''}`
                }
                title={collapsed ? item.label : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Client-side guarantee banner */}
        {!collapsed && (
          <div className="p-3 m-3 rounded-lg bg-slate-800/80 border border-slate-700/60 text-[11px] text-slate-400">
            <p className="font-semibold text-teal-400 mb-1">Local Edge Processing</p>
            <p>Medical scans are processed strictly on this device and never leave your browser.</p>
          </div>
        )}
      </aside>
    </>
  );
};
