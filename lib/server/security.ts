import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const AUTH_SECRET_STRING =
  process.env.AUTH_SECRET ||
  'smartbill-default-auth-secret-key-production-must-override-2026-strict-safety';
const JWT_SECRET_KEY = new TextEncoder().encode(AUTH_SECRET_STRING);

export const SESSION_COOKIE_NAME = 'smartbill_customer_session';

// =========================================================================
// PASSWORD HASHING (Argon2 / Bcrypt 12 rounds)
// =========================================================================
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash);
  } catch {
    return false;
  }
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): { valid: boolean; error?: string } {
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters long.' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one uppercase letter (A-Z).' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one lowercase letter (a-z).' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one number (0-9).' };
  }
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    return {
      valid: false,
      error: 'Password must contain at least one special character (!@#$%^&*).',
    };
  }
  return { valid: true };
}

// =========================================================================
// SECURE 6-DIGIT OTP & HASHING
// =========================================================================
export function generateSecureOtp(): string {
  // Uses cryptographically secure random integers between 100000 and 999999
  return crypto.randomInt(100000, 1000000).toString();
}

export function hashOtp(otp: string): string {
  return crypto
    .createHmac('sha256', AUTH_SECRET_STRING)
    .update(otp.trim())
    .digest('hex');
}

export function verifyOtp(enteredOtp: string, storedHash: string): boolean {
  try {
    const computed = hashOtp(enteredOtp);
    const a = Buffer.from(computed, 'hex');
    const b = Buffer.from(storedHash, 'hex');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

// =========================================================================
// CRYPTO TOKENS (For password reset & session IDs)
// =========================================================================
export function generateSecureCryptoToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function hashCryptoToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// =========================================================================
// RATE LIMITING & BRUTE FORCE SHIELD
// =========================================================================
interface RateLimitEntry {
  count: number;
  firstAttempt: number;
  lockoutUntil: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Check and record failed login / OTP attempts
 * @param key unique identifier (e.g. `login:${ip}:${email}` or `otp:${ip}:${customerId}`)
 * @param maxAttempts maximum allowed attempts before lockout
 * @param windowMs time window in milliseconds (e.g. 15 minutes)
 * @param lockoutMs duration of lockout in milliseconds
 */
export function checkRateLimit(
  key: string,
  maxAttempts: number = 5,
  windowMs: number = 15 * 60 * 1000,
  lockoutMs: number = 15 * 60 * 1000
): { allowed: boolean; remainingAttempts: number; retryAfterSeconds: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry) {
    return { allowed: true, remainingAttempts: maxAttempts, retryAfterSeconds: 0 };
  }

  // Check if locked out
  if (entry.lockoutUntil > now) {
    const retryAfterSeconds = Math.ceil((entry.lockoutUntil - now) / 1000);
    return { allowed: false, remainingAttempts: 0, retryAfterSeconds };
  }

  // Check if window has expired
  if (now - entry.firstAttempt > windowMs) {
    rateLimitStore.delete(key);
    return { allowed: true, remainingAttempts: maxAttempts, retryAfterSeconds: 0 };
  }

  const remaining = Math.max(0, maxAttempts - entry.count);
  return {
    allowed: entry.count < maxAttempts,
    remainingAttempts: remaining,
    retryAfterSeconds: 0,
  };
}

export function recordFailedAttempt(
  key: string,
  maxAttempts: number = 5,
  windowMs: number = 15 * 60 * 1000,
  lockoutMs: number = 15 * 60 * 1000
): { locked: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  let entry = rateLimitStore.get(key);

  if (!entry || now - entry.firstAttempt > windowMs) {
    entry = { count: 1, firstAttempt: now, lockoutUntil: 0 };
  } else {
    entry.count++;
  }

  if (entry.count >= maxAttempts) {
    entry.lockoutUntil = now + lockoutMs;
    rateLimitStore.set(key, entry);
    return { locked: true, retryAfterSeconds: Math.ceil(lockoutMs / 1000) };
  }

  rateLimitStore.set(key, entry);
  return { locked: false, retryAfterSeconds: 0 };
}

export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key);
}

// Resend OTP throttle (e.g. 60s cooldown)
const otpResendThrottleStore = new Map<string, number>();

export function checkOtpResendCooldown(
  key: string,
  cooldownSeconds: number = 60
): { canResend: boolean; waitSeconds: number } {
  const now = Date.now();
  const lastSent = otpResendThrottleStore.get(key);
  if (!lastSent) return { canResend: true, waitSeconds: 0 };

  const elapsedSeconds = Math.floor((now - lastSent) / 1000);
  if (elapsedSeconds < cooldownSeconds) {
    return { canResend: false, waitSeconds: cooldownSeconds - elapsedSeconds };
  }

  return { canResend: true, waitSeconds: 0 };
}

export function recordOtpResend(key: string): void {
  otpResendThrottleStore.set(key, Date.now());
}

// =========================================================================
// JWT SESSION & SECURE COOKIES
// =========================================================================
export interface CustomerTokenPayload {
  customerId: number;
  customerCode: string;
  email: string;
  mobile: string;
  fullName: string;
  status: string;
  sessionId: string;
}

export async function createSessionJwt(payload: CustomerTokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET_KEY);
}

export async function verifySessionJwt(token: string): Promise<CustomerTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET_KEY);
    return payload as unknown as CustomerTokenPayload;
  } catch {
    return null;
  }
}

/**
 * Helper to get current authenticated customer from request cookies
 */
export async function getAuthenticatedCustomerFromCookies(): Promise<CustomerTokenPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifySessionJwt(token);
  } catch {
    return null;
  }
}
