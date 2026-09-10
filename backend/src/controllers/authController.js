/**
 * Auth controller — login and token refresh.
 */

const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const store  = require('../database/memoryStore');

const JWT_SECRET  = process.env.JWT_SECRET || 'ztguard_dev_secret';
const JWT_EXPIRES = '8h';

async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  // Look up user
  const user = store.findUserByEmail(email.toLowerCase().trim());
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Verify password
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Issue JWT
  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );

  // Log the authentication event
  store.createSecurityEvent({
    event_type: 'User Authenticated',
    user_id:    user.id,
    risk_level: 'low',
    details:    `${user.name} authenticated successfully`,
    metadata:   { email: user.email, role: user.role },
  });

  return res.json({
    token,
    user: {
      id:    user.id,
      name:  user.name,
      email: user.email,
      role:  user.role,
    },
  });
}

async function getMe(req, res) {
  const user = store.findUserById(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const { password_hash, ...safe } = user;
  return res.json(safe);
}

module.exports = { login, getMe };
