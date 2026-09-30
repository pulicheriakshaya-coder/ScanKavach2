/**
 * @file src/App.tsx
 * @description Root application component with HashRouter, lazy routes, Suspense, and error recovery.
 */

import React, { Suspense, lazy, useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { ShieldCheck, RotateCcw } from 'lucide-react';

const LoginPage = lazy(() =>
  import('./pages/LoginPage').then((m) => ({ default: m.LoginPage }))
);
const DashboardPage = lazy(() =>
  import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage }))
);
const BuildBankPage = lazy(() =>
  import('./pages/BuildBankPage').then((m) => ({ default: m.BuildBankPage }))
);
const AnalyzePage = lazy(() =>
  import('./pages/AnalyzePage').then((m) => ({ default: m.AnalyzePage }))
);
const BatchPage = lazy(() =>
  import('./pages/BatchPage').then((m) => ({ default: m.BatchPage }))
);
const EvaluationPage = lazy(() =>
  import('./pages/EvaluationPage').then((m) => ({ default: m.EvaluationPage }))
);
const OptimizationLabPage = lazy(() =>
  import('./pages/OptimizationLabPage').then((m) => ({ default: m.OptimizationLabPage }))
);
const ConditionModelPage = lazy(() =>
  import('./pages/ConditionModelPage').then((m) => ({ default: m.ConditionModelPage }))
);
const HealthHubPage = lazy(() =>
  import('./pages/HealthHubPage').then((m) => ({ default: m.HealthHubPage }))
);
const AssistantPage = lazy(() =>
  import('./pages/AssistantPage').then((m) => ({ default: m.AssistantPage }))
);
const ModelCardPage = lazy(() =>
  import('./pages/ModelCardPage').then((m) => ({ default: m.ModelCardPage }))
);
const AboutPage = lazy(() =>
  import('./pages/AboutPage').then((m) => ({ default: m.AboutPage }))
);

const PageFallback: React.FC = () => (
  <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-center text-slate-400">
    <div className="w-10 h-10 border-3 border-teal-500 border-t-transparent rounded-full animate-spin mb-4" />
    <span className="text-xs font-medium text-slate-300">Loading ScanKavach view...</span>
  </div>
);

export default function App() {
  const [globalError, setGlobalError] = useState<string | null>(null);

  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      console.error('Unhandled runtime error:', event.error);
      setGlobalError(event.message || 'An unexpected error occurred in ScanKavach.');
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      const reason = event.reason instanceof Error ? event.reason.message : String(event.reason);
      setGlobalError(reason || 'An asynchronous operation encountered an error.');
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  if (globalError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 p-6">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center shadow-2xl">
          <div className="w-12 h-12 bg-rose-500/20 text-rose-400 rounded-full flex items-center justify-center mx-auto mb-3">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-white mb-1">ScanKavach Runtime Notice</h2>
          <p className="text-xs text-slate-400 mb-6">{globalError}</p>
          <button
            onClick={() => {
              setGlobalError(null);
              window.location.reload();
            }}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            <RotateCcw className="w-4 h-4" /> Reload ScanKavach
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <AppProvider>
        <HashRouter>
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<DashboardPage />} />
                <Route path="bank" element={<BuildBankPage />} />
                <Route path="analyze" element={<AnalyzePage />} />
                <Route path="batch" element={<BatchPage />} />
                <Route path="evaluation" element={<EvaluationPage />} />
                <Route path="optimization" element={<OptimizationLabPage />} />
                <Route path="classifier" element={<ConditionModelPage />} />
                <Route path="health-hub" element={<HealthHubPage />} />
                <Route path="assistant" element={<AssistantPage />} />
                <Route path="model-card" element={<ModelCardPage />} />
                <Route path="about" element={<AboutPage />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </HashRouter>
      </AppProvider>
    </ErrorBoundary>
  );
}
