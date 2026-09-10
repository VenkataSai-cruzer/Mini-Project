-- ZTGuard Database Schema
-- Run this file against your PostgreSQL instance to initialize the database

CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(100) NOT NULL,
  email       VARCHAR(150) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role        VARCHAR(50) NOT NULL DEFAULT 'student',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS devices (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  device_name   VARCHAR(100) NOT NULL,
  device_status VARCHAR(50) NOT NULL DEFAULT 'registered', -- registered | unknown | blocked
  trust_level   VARCHAR(50) NOT NULL DEFAULT 'trusted',    -- trusted | untrusted
  last_seen     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS resources (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             VARCHAR(150) NOT NULL,
  sensitivity_level VARCHAR(50) NOT NULL DEFAULT 'normal', -- normal | sensitive
  required_role    VARCHAR(50) NOT NULL DEFAULT 'student',
  description      TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS access_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
  device_id       UUID REFERENCES devices(id) ON DELETE SET NULL,
  resource_id     UUID REFERENCES resources(id) ON DELETE SET NULL,
  context_type    VARCHAR(50) NOT NULL DEFAULT 'normal',  -- normal | unusual
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  risk_score      INTEGER NOT NULL DEFAULT 0,
  risk_level      VARCHAR(20) NOT NULL DEFAULT 'low',     -- low | medium | high
  decision        VARCHAR(50) NOT NULL DEFAULT 'granted', -- granted | verification_required | blocked
  risk_factors    JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS security_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type  VARCHAR(100) NOT NULL,
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  risk_level  VARCHAR(20),
  details     TEXT,
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS incidents (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_code      VARCHAR(20) UNIQUE NOT NULL,
  user_id            UUID REFERENCES users(id) ON DELETE SET NULL,
  resource_id        UUID REFERENCES resources(id) ON DELETE SET NULL,
  access_request_id  UUID REFERENCES access_requests(id) ON DELETE SET NULL,
  severity           VARCHAR(20) NOT NULL DEFAULT 'high',  -- low | medium | high | critical
  risk_score         INTEGER NOT NULL DEFAULT 0,
  status             VARCHAR(30) NOT NULL DEFAULT 'open',  -- open | investigating | resolved
  decision           VARCHAR(50) NOT NULL,
  reasons            JSONB,
  recommended_action TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS incident_timeline (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
  action      VARCHAR(100) NOT NULL,
  description TEXT,
  actor       VARCHAR(100) DEFAULT 'system',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_access_requests_user ON access_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_user ON security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_created ON security_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_severity ON incidents(severity);
CREATE INDEX IF NOT EXISTS idx_incident_timeline_incident ON incident_timeline(incident_id);
