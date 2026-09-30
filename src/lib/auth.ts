/**
 * @file src/lib/auth.ts
 * @description Authentication service with Web Crypto PBKDF2, session tracking and lockout.
 */

import {
  MAX_LOGIN_ATTEMPTS,
  LOGIN_LOCKOUT_SECONDS,
  SESSION_DURATION_HOURS,
} from '../config';
import { UserAccount, UserRole, UserSession } from '../types';
import { generateSaltHex, hashPasswordPbkdf2, verifyPassword } from './crypto';
import {
  getStorageItem,
  setStorageItem,
  getSessionItem,
  setSessionItem,
  removeSessionItem,
} from './storage';

const ACCOUNTS_KEY = 'accounts';
const SESSION_KEY = 'session';
const FAILURES_KEY = 'login_failures';

interface FailureRecord {
  count: number;
  lockedUntil: number;
}

/**
 * Gets the current failure and lockout status.
 * @returns FailureRecord with count and lockedUntil timestamp.
 */
export function getLockoutStatus(): { isLocked: boolean; remainingSeconds: number } {
  const record = getSessionItem<FailureRecord>(FAILURES_KEY);
  if (!record || !record.lockedUntil) {
    return { isLocked: false, remainingSeconds: 0 };
  }
  const remaining = Math.max(0, Math.ceil((record.lockedUntil - Date.now()) / 1000));
  if (remaining === 0) {
    removeSessionItem(FAILURES_KEY);
    return { isLocked: false, remainingSeconds: 0 };
  }
  return { isLocked: true, remainingSeconds: remaining };
}

/**
 * Records a failed login attempt and applies a lockout if threshold is exceeded.
 */
export function recordLoginFailure(): { isLocked: boolean; remainingSeconds: number } {
  const current = getSessionItem<FailureRecord>(FAILURES_KEY) || { count: 0, lockedUntil: 0 };
  current.count += 1;
  if (current.count >= MAX_LOGIN_ATTEMPTS) {
    current.lockedUntil = Date.now() + LOGIN_LOCKOUT_SECONDS * 1000;
  }
  setSessionItem(FAILURES_KEY, current);
  return getLockoutStatus();
}

/**
 * Clears failed login counter upon successful authentication.
 */
export function clearLoginFailures(): void {
  removeSessionItem(FAILURES_KEY);
}

/**
 * Retrieves the list of registered user accounts.
 * @returns Array of UserAccount objects.
 */
export async function getAccounts(): Promise<UserAccount[]> {
  return (await getStorageItem<UserAccount[]>(ACCOUNTS_KEY)) || [];
}

/**
 * Registers a new user account with hashed password.
 * @param name - Full user name.
 * @param email - User email address.
 * @param password - Plaintext password (8+ characters).
 * @param role - Clinician, Radiology Technician, or Student/Researcher.
 */
export async function registerAccount(
  name: string,
  email: string,
  password: string,
  role: UserRole
): Promise<UserSession> {
  const accounts = await getAccounts();
  const lowerEmail = email.trim().toLowerCase();
  if (accounts.some((a) => a.email.toLowerCase() === lowerEmail)) {
    throw new Error('An account with this email already exists on this device.');
  }

  const saltHex = generateSaltHex();
  const hashHex = await hashPasswordPbkdf2(password, saltHex);
  const newAccount: UserAccount = {
    id: `usr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: name.trim(),
    email: lowerEmail,
    role,
    saltHex,
    hashHex,
    createdAt: Date.now(),
  };

  accounts.push(newAccount);
  await setStorageItem(ACCOUNTS_KEY, accounts);

  const session: UserSession = {
    user: {
      id: newAccount.id,
      name: newAccount.name,
      email: newAccount.email,
      role: newAccount.role,
    },
    expiresAt: Date.now() + SESSION_DURATION_HOURS * 3600 * 1000,
    token: `tok_${Math.random().toString(36).slice(2)}`,
  };

  setSessionItem(SESSION_KEY, session);
  clearLoginFailures();
  return session;
}

/**
 * Authenticates an existing user with email and password.
 * @param email - User email.
 * @param password - Plaintext password.
 */
export async function loginAccount(email: string, password: string): Promise<UserSession> {
  const lockout = getLockoutStatus();
  if (lockout.isLocked) {
    throw new Error(`Account locked for ${lockout.remainingSeconds}s due to too many attempts.`);
  }

  const accounts = await getAccounts();
  const lowerEmail = email.trim().toLowerCase();
  const account = accounts.find((a) => a.email.toLowerCase() === lowerEmail);

  if (!account) {
    recordLoginFailure();
    throw new Error('Invalid email or password.');
  }

  const isValid = await verifyPassword(password, account.saltHex, account.hashHex);
  if (!isValid) {
    recordLoginFailure();
    throw new Error('Invalid email or password.');
  }

  const session: UserSession = {
    user: {
      id: account.id,
      name: account.name,
      email: account.email,
      role: account.role,
    },
    expiresAt: Date.now() + SESSION_DURATION_HOURS * 3600 * 1000,
    token: `tok_${Math.random().toString(36).slice(2)}`,
  };

  setSessionItem(SESSION_KEY, session);
  clearLoginFailures();
  return session;
}

/**
 * Continues as a demo user session at runtime with no stored password.
 */
export function continueAsDemoUser(role: UserRole = 'Clinician'): UserSession {
  const session: UserSession = {
    user: {
      id: 'demo_user_01',
      name: 'Demo Clinician',
      email: 'clinician.demo@scankavach.local',
      role,
    },
    expiresAt: Date.now() + SESSION_DURATION_HOURS * 3600 * 1000,
    token: `demo_${Date.now()}`,
  };

  setSessionItem(SESSION_KEY, session);
  clearLoginFailures();
  return session;
}

/**
 * Gets the current active session if not expired.
 * @returns Active UserSession or null.
 */
export function getCurrentSession(): UserSession | null {
  const session = getSessionItem<UserSession>(SESSION_KEY);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    removeSessionItem(SESSION_KEY);
    return null;
  }
  return session;
}

/**
 * Ends the user session.
 */
export function logoutUser(): void {
  removeSessionItem(SESSION_KEY);
}
