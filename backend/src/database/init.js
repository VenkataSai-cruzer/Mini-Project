/**
 * PostgreSQL database initializer.
 * Run with: node src/database/init.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const fs   = require('fs');
const path = require('path');
const { query } = require('./db');

async function init() {
  console.log('[DB Init] Reading schema...');
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');

  console.log('[DB Init] Applying schema...');
  await query(schema);

  console.log('[DB Init] Schema applied successfully.');
  process.exit(0);
}

init().catch((err) => {
  console.error('[DB Init] Failed:', err.message);
  process.exit(1);
});
