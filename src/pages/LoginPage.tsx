/**
 * @file src/pages/LoginPage.tsx
 * @description Instant rendering split-layout login with PBKDF2 Web Crypto auth and demo session.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ShieldCheck,
  Eye,
  EyeOff,
  UserCheck,
  AlertTriangle,
  Lock,
  Mail,
  User as UserIcon,
} from 'lucide-react';
import {
  loginAccount,
  registerAccount,
  continueAsDemoUser,
  getLockoutStatus,
} from '../lib/auth';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setSession } = useApp();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>('Clinician');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [lockoutSecs, setLockoutSecs] = useState<number>(() => getLockoutStatus().remainingSeconds);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutSecs <= 0) return;
    const interval = setInterval(() => {
      const status = getLockoutStatus();
      setLockoutSecs(status.remainingSeconds);
      if (status.remainingSeconds <= 0) {
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutSecs]);

  const redirectTarget = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  const handleDemoSignIn = () => {
    const demoSession = continueAsDemoUser('Clinician');
    setSession(demoSession);
    navigate(redirectTarget, { replace: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === 'signup' && password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signin') {
        const session = await loginAccount(email, password);
        setSession(session);
        navigate(redirectTarget, { replace: true });
      } else {
        const session = await registerAccount(name, email, password, role);
        setSession(session);
        navigate(redirectTarget, { replace: true });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed.';
      setError(msg);
      setLockoutSecs(getLockoutStatus().remainingSeconds);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-400 mb-4 shadow-lg shadow-teal-950/50">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-100">
          ScanKavach
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Your shield for safer medical image screening
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900 border border-slate-800 py-8 px-4 shadow-2xl rounded-2xl sm:px-10">
          {/* Tabs */}
          <div className="flex border-b border-slate-800 mb-6">
            <button
              onClick={() => { setMode('signin'); setError(null); }}
              className={`flex-1 pb-3 text-sm font-medium border-b-2 transition-colors ${
                mode === 'signin'
                  ? 'border-teal-500 text-teal-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign in
            </button>
            <button
              onClick={() => { setMode('signup'); setError(null); }}
              className={`flex-1 pb-3 text-sm font-medium border-b-2 transition-colors ${
                mode === 'signup'
                  ? 'border-teal-500 text-teal-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Create account
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {lockoutSecs > 0 && (
            <div className="mb-4 p-3 rounded-lg bg-amber-950/40 border border-amber-800/60 text-xs text-amber-300 flex items-center gap-2">
              <Lock className="w-4 h-4 flex-shrink-0" />
              <span>Account locked due to failed attempts. Try again in {lockoutSecs}s.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Dr. Akshaya Rao"
                    className="w-full pl-9 pr-3 py-2 bg-slate-800 text-slate-100 text-sm border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="clinician@hospital.org"
                  className="w-full pl-9 pr-3 py-2 bg-slate-800 text-slate-100 text-sm border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2 bg-slate-800 text-slate-100 text-sm border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {mode === 'signup' && (
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Must be 8 or more characters
                </span>
              )}
            </div>

            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Professional Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 bg-slate-800 text-slate-100 text-sm border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="Clinician">Clinician (Doctor / Pulmonologist)</option>
                  <option value="Radiology Technician">Radiology Technician</option>
                  <option value="Student/Researcher">Student / Researcher</option>
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || lockoutSecs > 0}
              className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-medium text-sm rounded-lg shadow-md transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {loading ? 'Processing...' : mode === 'signin' ? 'Sign in' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-slate-900 px-2 text-slate-500">Or continue without account</span>
              </div>
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={handleDemoSignIn}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 border border-slate-700 hover:border-teal-500/50 hover:bg-slate-800/80 text-teal-400 font-medium text-sm rounded-lg transition-colors"
              >
                <UserCheck className="w-4 h-4" />
                Continue as demo user
              </button>
            </div>
          </div>

          <p className="mt-6 text-center text-[11px] text-slate-500">
            Accounts are stored on this device only (demo authentication).
          </p>
        </div>
      </div>
    </div>
  );
};
