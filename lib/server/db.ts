import fs from 'fs';
import path from 'path';

export type AccountStatus = 'PENDING_VERIFICATION' | 'ACTIVE' | 'BLOCKED' | 'SUSPENDED';
export type OtpPurpose = 'REGISTRATION' | 'LOGIN' | 'PASSWORD_RESET';

export interface CustomerRecord {
  id: number;
  customer_code: string;
  full_name: string;
  email: string;
  mobile: string;
  password_hash: string;
  mobile_verified: number; // 0 or 1
  account_status: AccountStatus;
  two_factor_enabled: number; // 0 or 1
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
}

export interface OtpRecord {
  id: number;
  customer_id: number;
  otp_hash: string;
  purpose: OtpPurpose;
  expires_at: string;
  attempts: number;
  max_attempts: number;
  verified_at: string | null;
  created_at: string;
}

export interface PasswordResetRecord {
  id: number;
  customer_id: number;
  token_hash: string;
  expires_at: string;
  used_at: string | null;
  created_at: string;
}

export interface SessionRecord {
  id: string;
  customer_id: number;
  session_token_hash: string;
  ip_address?: string;
  user_agent?: string;
  expires_at: string;
  last_activity: string;
  created_at: string;
}

export interface AuditLogRecord {
  id: number;
  customer_id: number | null;
  action: string;
  ip_address?: string;
  user_agent?: string;
  details?: string;
  created_at: string;
}

interface DatabaseSchema {
  sequences: {
    customer_id: number;
    customer_code_seq: number;
    otp_id: number;
    reset_id: number;
    audit_id: number;
  };
  customers: CustomerRecord[];
  otp_verifications: OtpRecord[];
  password_reset_tokens: PasswordResetRecord[];
  sessions: SessionRecord[];
  audit_logs: AuditLogRecord[];
}

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'app_database.json');

// Memory cache of DB for fast queries
let dbCache: DatabaseSchema | null = null;
let writeQueue: Promise<void> = Promise.resolve();

function getInitialDatabase(): DatabaseSchema {
  return {
    sequences: {
      customer_id: 100,
      customer_code_seq: 1,
      otp_id: 1,
      reset_id: 1,
      audit_id: 1,
    },
    customers: [],
    otp_verifications: [],
    password_reset_tokens: [],
    sessions: [],
    audit_logs: [],
  };
}

/**
 * Ensure database file exists and load it into memory
 */
function loadDatabaseSync(): DatabaseSchema {
  if (dbCache) return dbCache;

  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      dbCache = JSON.parse(raw) as DatabaseSchema;
      return dbCache;
    }
  } catch (err) {
    console.error('Failed to read database file, initializing default:', err);
  }

  const initial = getInitialDatabase();
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to initialize database file:', err);
  }
  dbCache = initial;
  return dbCache;
}

/**
 * Persist database to disk atomically
 */
async function persistDatabaseAsync(): Promise<void> {
  writeQueue = writeQueue.then(async () => {
    if (!dbCache) return;
    try {
      if (!fs.existsSync(DB_DIR)) {
        await fs.promises.mkdir(DB_DIR, { recursive: true });
      }
      const tmpFile = `${DB_FILE}.tmp.${Date.now()}`;
      await fs.promises.writeFile(tmpFile, JSON.stringify(dbCache, null, 2), 'utf-8');
      await fs.promises.rename(tmpFile, DB_FILE);
    } catch (err) {
      console.error('Failed to write database file atomically:', err);
    }
  });
  return writeQueue;
}

export const db = {
  /**
   * Generates the next sequential unique Customer Code (e.g. CUS-2026-000001)
   */
  generateCustomerCode(): string {
    const data = loadDatabaseSync();
    const currentYear = new Date().getFullYear();
    const seq = data.sequences.customer_code_seq++;
    const code = `CUS-${currentYear}-${String(seq).padStart(6, '0')}`;
    void persistDatabaseAsync();
    return code;
  },

  // ==========================================
  // CUSTOMER OPERATIONS
  // ==========================================
  findCustomerByEmail(email: string): CustomerRecord | null {
    const data = loadDatabaseSync();
    const normalized = email.toLowerCase().trim();
    return data.customers.find((c) => c.email.toLowerCase() === normalized) || null;
  },

  findCustomerByMobile(mobile: string): CustomerRecord | null {
    const data = loadDatabaseSync();
    const normalized = mobile.replace(/[^0-9]/g, '').slice(-10);
    return (
      data.customers.find((c) => c.mobile.replace(/[^0-9]/g, '').slice(-10) === normalized) || null
    );
  },

  findCustomerById(id: number): CustomerRecord | null {
    const data = loadDatabaseSync();
    return data.customers.find((c) => c.id === id) || null;
  },

  findCustomerByCode(code: string): CustomerRecord | null {
    const data = loadDatabaseSync();
    const normalized = code.trim().toUpperCase();
    return data.customers.find((c) => c.customer_code.toUpperCase() === normalized) || null;
  },

  async createCustomer(data: {
    full_name: string;
    email: string;
    mobile: string;
    password_hash: string;
  }): Promise<CustomerRecord> {
    const database = loadDatabaseSync();

    const normalizedEmail = data.email.toLowerCase().trim();
    const normalizedMobile = data.mobile.replace(/[^0-9]/g, '').slice(-10);

    // Enforce unique constraints
    if (database.customers.some((c) => c.email.toLowerCase() === normalizedEmail)) {
      throw new Error('An account with this email address already exists.');
    }

    if (
      database.customers.some((c) => c.mobile.replace(/[^0-9]/g, '').slice(-10) === normalizedMobile)
    ) {
      throw new Error('An account with this mobile number already exists.');
    }

    const newId = ++database.sequences.customer_id;
    const now = new Date().toISOString();

    const newCustomer: CustomerRecord = {
      id: newId,
      customer_code: `PENDING-${newId}`, // Assigned permanently upon mobile verification
      full_name: data.full_name.trim(),
      email: normalizedEmail,
      mobile: normalizedMobile,
      password_hash: data.password_hash,
      mobile_verified: 0,
      account_status: 'PENDING_VERIFICATION',
      two_factor_enabled: 0,
      created_at: now,
      updated_at: now,
      last_login_at: null,
    };

    database.customers.push(newCustomer);
    await persistDatabaseAsync();
    return newCustomer;
  },

  async updateCustomer(
    id: number,
    updates: Partial<Omit<CustomerRecord, 'id' | 'created_at'>>
  ): Promise<CustomerRecord> {
    const database = loadDatabaseSync();
    const index = database.customers.findIndex((c) => c.id === id);
    if (index === -1) {
      throw new Error('Customer not found');
    }

    const existing = database.customers[index];
    const updated: CustomerRecord = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    database.customers[index] = updated;
    await persistDatabaseAsync();
    return updated;
  },

  getAllCustomers(query?: string, status?: string): CustomerRecord[] {
    const database = loadDatabaseSync();
    let result = [...database.customers];

    if (status && status !== 'ALL') {
      result = result.filter((c) => c.account_status === status);
    }

    if (query && query.trim()) {
      const q = query.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.full_name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.mobile.includes(q) ||
          c.customer_code.toLowerCase().includes(q)
      );
    }

    // Sort descending by created_at
    result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return result;
  },

  // ==========================================
  // OTP VERIFICATIONS
  // ==========================================
  async createOtpRecord(params: {
    customer_id: number;
    otp_hash: string;
    purpose: OtpPurpose;
    expires_in_minutes?: number;
    max_attempts?: number;
  }): Promise<OtpRecord> {
    const database = loadDatabaseSync();
    const newId = ++database.sequences.otp_id;
    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + (params.expires_in_minutes || 10) * 60 * 1000
    ).toISOString();

    // Invalidate previous active unverified OTPs for this customer & purpose
    database.otp_verifications.forEach((otp) => {
      if (otp.customer_id === params.customer_id && otp.purpose === params.purpose && !otp.verified_at) {
        otp.expires_at = now.toISOString(); // expired
      }
    });

    const newOtp: OtpRecord = {
      id: newId,
      customer_id: params.customer_id,
      otp_hash: params.otp_hash,
      purpose: params.purpose,
      expires_at: expiresAt,
      attempts: 0,
      max_attempts: params.max_attempts || 3,
      verified_at: null,
      created_at: now.toISOString(),
    };

    database.otp_verifications.push(newOtp);
    await persistDatabaseAsync();
    return newOtp;
  },

  findActiveOtp(customer_id: number, purpose: OtpPurpose): OtpRecord | null {
    const database = loadDatabaseSync();
    const now = new Date().getTime();

    // Find the latest active OTP
    const otps = database.otp_verifications.filter(
      (o) =>
        o.customer_id === customer_id &&
        o.purpose === purpose &&
        !o.verified_at &&
        new Date(o.expires_at).getTime() > now &&
        o.attempts < o.max_attempts
    );

    if (otps.length === 0) return null;
    return otps[otps.length - 1];
  },

  async incrementOtpAttempts(otpId: number): Promise<number> {
    const database = loadDatabaseSync();
    const otp = database.otp_verifications.find((o) => o.id === otpId);
    if (!otp) return 0;
    otp.attempts++;
    await persistDatabaseAsync();
    return otp.attempts;
  },

  async markOtpVerified(otpId: number): Promise<void> {
    const database = loadDatabaseSync();
    const otp = database.otp_verifications.find((o) => o.id === otpId);
    if (otp) {
      otp.verified_at = new Date().toISOString();
      await persistDatabaseAsync();
    }
  },

  // ==========================================
  // PASSWORD RESET TOKENS
  // ==========================================
  async createPasswordResetToken(
    customer_id: number,
    token_hash: string,
    expires_in_minutes: number = 15
  ): Promise<PasswordResetRecord> {
    const database = loadDatabaseSync();
    const newId = ++database.sequences.reset_id;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + expires_in_minutes * 60 * 1000).toISOString();

    // Invalidate previous tokens
    database.password_reset_tokens.forEach((t) => {
      if (t.customer_id === customer_id && !t.used_at) {
        t.expires_at = now.toISOString();
      }
    });

    const record: PasswordResetRecord = {
      id: newId,
      customer_id,
      token_hash,
      expires_at: expiresAt,
      used_at: null,
      created_at: now.toISOString(),
    };

    database.password_reset_tokens.push(record);
    await persistDatabaseAsync();
    return record;
  },

  findValidResetToken(token_hash: string): PasswordResetRecord | null {
    const database = loadDatabaseSync();
    const now = new Date().getTime();
    return (
      database.password_reset_tokens.find(
        (t) => t.token_hash === token_hash && !t.used_at && new Date(t.expires_at).getTime() > now
      ) || null
    );
  },

  async markResetTokenUsed(tokenId: number): Promise<void> {
    const database = loadDatabaseSync();
    const token = database.password_reset_tokens.find((t) => t.id === tokenId);
    if (token) {
      token.used_at = new Date().toISOString();
      await persistDatabaseAsync();
    }
  },

  // ==========================================
  // SERVER-SIDE SESSIONS
  // ==========================================
  async createSession(params: {
    id: string;
    customer_id: number;
    session_token_hash: string;
    expires_at: string;
    ip_address?: string;
    user_agent?: string;
  }): Promise<SessionRecord> {
    const database = loadDatabaseSync();
    const now = new Date().toISOString();

    // Clean up expired sessions periodically
    const currentTime = new Date().getTime();
    database.sessions = database.sessions.filter((s) => new Date(s.expires_at).getTime() > currentTime);

    const session: SessionRecord = {
      id: params.id,
      customer_id: params.customer_id,
      session_token_hash: params.session_token_hash,
      ip_address: params.ip_address,
      user_agent: params.user_agent,
      expires_at: params.expires_at,
      last_activity: now,
      created_at: now,
    };

    database.sessions.push(session);
    await persistDatabaseAsync();
    return session;
  },

  findValidSession(session_token_hash: string): SessionRecord | null {
    const database = loadDatabaseSync();
    const now = new Date().getTime();
    const session = database.sessions.find(
      (s) => s.session_token_hash === session_token_hash && new Date(s.expires_at).getTime() > now
    );
    return session || null;
  },

  async touchSession(session_token_hash: string): Promise<void> {
    const database = loadDatabaseSync();
    const session = database.sessions.find((s) => s.session_token_hash === session_token_hash);
    if (session) {
      session.last_activity = new Date().toISOString();
      await persistDatabaseAsync();
    }
  },

  async deleteSession(session_token_hash: string): Promise<void> {
    const database = loadDatabaseSync();
    database.sessions = database.sessions.filter((s) => s.session_token_hash !== session_token_hash);
    await persistDatabaseAsync();
  },

  async deleteCustomerSessions(customer_id: number): Promise<void> {
    const database = loadDatabaseSync();
    database.sessions = database.sessions.filter((s) => s.customer_id !== customer_id);
    await persistDatabaseAsync();
  },

  // ==========================================
  // AUDIT LOGS
  // ==========================================
  async createAuditLog(params: {
    customer_id: number | null;
    action: string;
    ip_address?: string;
    user_agent?: string;
    details?: string;
  }): Promise<AuditLogRecord> {
    const database = loadDatabaseSync();
    const newId = ++database.sequences.audit_id;

    const log: AuditLogRecord = {
      id: newId,
      customer_id: params.customer_id,
      action: params.action,
      ip_address: params.ip_address,
      user_agent: params.user_agent,
      details: params.details,
      created_at: new Date().toISOString(),
    };

    database.audit_logs.push(log);
    // Keep max 2000 logs
    if (database.audit_logs.length > 2000) {
      database.audit_logs = database.audit_logs.slice(-2000);
    }
    await persistDatabaseAsync();
    return log;
  },

  getRecentAuditLogs(customerId?: number, limit: number = 50): AuditLogRecord[] {
    const database = loadDatabaseSync();
    let list = database.audit_logs;
    if (customerId !== undefined) {
      list = list.filter((l) => l.customer_id === customerId);
    }
    return list.slice(-limit).reverse();
  },
};
