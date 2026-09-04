const express = require('express');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const db = require('../database');
const { verifyToken, requireRole, generateToken } = require('../middleware/auth');
const router = express.Router();

// Login with PIN (backward compatibility) or username/password
router.post('/login', async (req, res) => {
  try {
    const { pin, username, password } = req.body;

    let user;

    // Try PIN login first (backward compatibility)
    if (pin) {
      user = await db.get('SELECT * FROM users WHERE (pin = ? OR password = ?) AND active = 1', [pin, pin]);
    }
    // Try username/password login
    else if (username && password) {
      user = await db.get('SELECT * FROM users WHERE username = ? AND active = 1', [username]);

      if (user && user.password) {
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }
      } else if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        business_name: user.business_name
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Initial setup (create first admin user) - only works when users table is empty
router.post('/setup', async (req, res) => {
  try {
    const { pin, business_name, username, password, name } = req.body;

    // Check if any user already exists - setup is only allowed on empty users table
    const existingUser = await db.get('SELECT COUNT(*) as count FROM users');
    if (existingUser && existingUser.count > 0) {
      return res.status(403).json({ error: 'Setup not allowed: system already configured' });
    }

    if (!name) {
      return res.status(400).json({ error: 'Admin name is required' });
    }

    if (!pin && !password) {
      return res.status(400).json({ error: 'PIN or password is required' });
    }

    const userId = uuidv4();
    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

    await db.run(
      `INSERT INTO users (id, business_id, username, name, password, pin, role, active, business_name)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, 'default', username || 'admin', name || 'Administrator', hashedPassword, pin, 'ADMIN', 1, business_name]
    );

    const token = generateToken({
      id: userId,
      username: username || 'admin',
      name: name || 'Administrator',
      role: 'ADMIN',
      business_id: 'default'
    });

    res.json({
      success: true,
      token,
      user: {
        id: userId,
        username: username || 'admin',
        name: name || 'Administrator',
        role: 'ADMIN',
        business_name
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check setup - also returns user count and database info
router.get('/check-setup', async (req, res) => {
  try {
    const userCountResult = await db.get('SELECT COUNT(*) as count FROM users');
    const userCount = userCountResult?.count || 0;

    res.json({
      isConfigured: userCount > 0,
      userCount: userCount
    });
  } catch (error) {
    console.error('[Auth] Check setup error:', error.message);
    res.status(500).json({ error: error.message, isConfigured: false });
  }
});

// Get current user info (from token)
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await db.get('SELECT id, username, name, role, active FROM users WHERE id = ?', [req.user.id]);
    if (!user || !user.active) {
      return res.status(401).json({ error: 'User not found or disabled' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
