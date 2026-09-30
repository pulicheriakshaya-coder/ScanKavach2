import { describe, it, expect, beforeEach } from 'vitest';
import {
  registerAccount,
  loginAccount,
  continueAsDemoUser,
  getCurrentSession,
  logoutUser,
  recordLoginFailure,
  getLockoutStatus,
  clearLoginFailures,
} from '../../src/lib/auth';
import { generateSaltHex, hashPasswordPbkdf2, verifyPassword } from '../../src/lib/crypto';

describe('Authentication & Web Crypto PBKDF2 Unit Tests', () => {
  beforeEach(() => {
    sessionStorage.clear();
    clearLoginFailures();
  });

  it('generates random 16-byte hex salts', () => {
    const salt1 = generateSaltHex();
    const salt2 = generateSaltHex();
    expect(salt1.length).toBe(32);
    expect(salt2.length).toBe(32);
    expect(salt1).not.toBe(salt2);
  });

  it('hashes and verifies passwords accurately with PBKDF2', async () => {
    const salt = generateSaltHex();
    const hash = await hashPasswordPbkdf2('SecureP@ssw0rd', salt);
    expect(hash.length).toBe(64); // 256 bits = 64 hex chars

    const valid = await verifyPassword('SecureP@ssw0rd', salt, hash);
    expect(valid).toBe(true);

    const invalid = await verifyPassword('WrongPassword', salt, hash);
    expect(invalid).toBe(false);
  });

  it('creates runtime demo user session with no stored password', () => {
    const session = continueAsDemoUser('Clinician');
    expect(session.user.name).toBe('Demo Clinician');
    expect(session.user.role).toBe('Clinician');
    expect(session.expiresAt).toBeGreaterThan(Date.now());

    const current = getCurrentSession();
    expect(current?.user.email).toBe('clinician.demo@scankavach.local');
  });

  it('registers and logs in a new user account', async () => {
    const registered = await registerAccount('Dr. Test', 'dr.test@hospital.org', 'StrongPassword123', 'Clinician');
    expect(registered.user.name).toBe('Dr. Test');

    logoutUser();
    expect(getCurrentSession()).toBeNull();

    const loggedIn = await loginAccount('dr.test@hospital.org', 'StrongPassword123');
    expect(loggedIn.user.email).toBe('dr.test@hospital.org');
  });

  it('locks out user after 5 failed login attempts', () => {
    for (let i = 0; i < 4; i++) {
      const status = recordLoginFailure();
      expect(status.isLocked).toBe(false);
    }
    const lockedStatus = recordLoginFailure();
    expect(lockedStatus.isLocked).toBe(true);
    expect(lockedStatus.remainingSeconds).toBeGreaterThan(0);
  });
});
