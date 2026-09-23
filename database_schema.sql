-- ========================================================================
-- PRODUCTION DATABASE SCHEMA: SECURE CUSTOMER AUTHENTICATION & VERIFICATION
-- Targets: PostgreSQL 14+ / MySQL 8.0+
-- ========================================================================

-- 1. Customers Table
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    customer_code VARCHAR(32) NOT NULL UNIQUE,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(180) NOT NULL UNIQUE,
    mobile VARCHAR(20) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    mobile_verified SMALLINT DEFAULT 0 NOT NULL, -- 0 = Unverified, 1 = Verified
    account_status VARCHAR(30) DEFAULT 'PENDING_VERIFICATION' NOT NULL, 
    -- Allowed values: 'PENDING_VERIFICATION', 'ACTIVE', 'BLOCKED', 'SUSPENDED'
    two_factor_enabled SMALLINT DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    last_login_at TIMESTAMP WITH TIME ZONE NULL
);

-- Unique & Performance Indexes for Customers
CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_email ON customers(LOWER(email));
CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_mobile ON customers(mobile);
CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_code ON customers(customer_code);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(account_status);

-- 2. OTP Verifications Table
CREATE TABLE IF NOT EXISTS otp_verifications (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    otp_hash VARCHAR(128) NOT NULL,
    purpose VARCHAR(30) NOT NULL, -- 'REGISTRATION', 'LOGIN', 'PASSWORD_RESET'
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    attempts INTEGER DEFAULT 0 NOT NULL,
    max_attempts INTEGER DEFAULT 3 NOT NULL,
    verified_at TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Indexes for OTP Verifications
CREATE INDEX IF NOT EXISTS idx_otp_customer ON otp_verifications(customer_id);
CREATE INDEX IF NOT EXISTS idx_otp_purpose ON otp_verifications(purpose);
CREATE INDEX IF NOT EXISTS idx_otp_expires ON otp_verifications(expires_at);

-- 3. Password Reset Tokens Table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    token_hash VARCHAR(128) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Indexes for Password Reset Tokens
CREATE INDEX IF NOT EXISTS idx_pw_reset_customer ON password_reset_tokens(customer_id);
CREATE INDEX IF NOT EXISTS idx_pw_reset_token ON password_reset_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_pw_reset_expires ON password_reset_tokens(expires_at);

-- 4. Customer Sessions Table (Server-side Session Storage)
CREATE TABLE IF NOT EXISTS customer_sessions (
    id VARCHAR(64) PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    session_token_hash VARCHAR(128) NOT NULL UNIQUE,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_customer ON customer_sessions(customer_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON customer_sessions(expires_at);

-- 5. Audit Security Logs Table
CREATE TABLE IF NOT EXISTS customer_audit_logs (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NULL REFERENCES customers(id) ON DELETE SET NULL,
    action VARCHAR(64) NOT NULL, -- e.g. 'REGISTER', 'MOBILE_VERIFIED', 'LOGIN_SUCCESS', 'LOGIN_FAIL', 'PASSWORD_CHANGE'
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    details TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_customer ON customer_audit_logs(customer_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON customer_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_created ON customer_audit_logs(created_at);
