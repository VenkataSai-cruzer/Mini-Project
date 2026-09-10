/**
 * PostgreSQL seed script.
 * Run with: node src/database/seed.js
 * Seeds the demo user, devices, and resources into PostgreSQL.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const bcrypt = require('bcryptjs');
const { query } = require('./db');

const DEMO_USER_ID        = 'a0000000-0000-0000-0000-000000000001';
const TRUSTED_DEVICE_ID   = 'b0000000-0000-0000-0000-000000000001';
const RESOURCE_PORTAL_ID  = 'c0000000-0000-0000-0000-000000000001';
const RESOURCE_RECORDS_ID = 'c0000000-0000-0000-0000-000000000002';

async function seed() {
  console.log('[Seed] Hashing demo password...');
  const passwordHash = await bcrypt.hash('ZTGuard2024!', 10);

  console.log('[Seed] Inserting demo user...');
  await query(`
    INSERT INTO users (id, name, email, password_hash, role)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (id) DO NOTHING
  `, [DEMO_USER_ID, 'Demo Student', 'demo@ztguard.edu', passwordHash, 'student']);

  console.log('[Seed] Inserting trusted device...');
  await query(`
    INSERT INTO devices (id, user_id, device_name, device_status, trust_level)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (id) DO NOTHING
  `, [TRUSTED_DEVICE_ID, DEMO_USER_ID, 'Student Laptop (Registered)', 'registered', 'trusted']);

  console.log('[Seed] Inserting resources...');
  await query(`
    INSERT INTO resources (id, name, sensitivity_level, required_role, description)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (id) DO NOTHING
  `, [RESOURCE_PORTAL_ID, 'Student Portal', 'normal', 'student', 'Standard student course and schedule portal.']);

  await query(`
    INSERT INTO resources (id, name, sensitivity_level, required_role, description)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (id) DO NOTHING
  `, [RESOURCE_RECORDS_ID, 'Sensitive Academic Records', 'sensitive', 'student', 'Confidential academic transcripts and financial records.']);

  console.log('[Seed] Complete.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('[Seed] Failed:', err.message);
  process.exit(1);
});
