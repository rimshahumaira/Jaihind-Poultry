const express = require('express');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const db = require('../database');
const { verifyToken, requireRole } = require('../middleware/auth');
const router = express.Router();

// Get all users (ADMIN only)
router.get('/', verifyToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const users = await db.all(
      `SELECT id, username, name, role, active, created_at FROM users WHERE business_id = ? ORDER BY created_at DESC`,
      [req.user.business_id]
    );
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single user (ADMIN only or own profile)
router.get('/:id', verifyToken, async (req, res) => {
  try {
    // Users can view their own profile or ADMIN can view anyone
    if (req.user.id !== req.params.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const user = await db.get(
      `SELECT id, username, name, role, active, created_at FROM users WHERE id = ? AND business_id = ?`,
      [req.params.id, req.user.business_id]
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new user (ADMIN only)
router.post('/', verifyToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { username, name, password, role } = req.body;

    if (!username || !name || !password) {
      return res.status(400).json({ error: 'Username, name, and password are required' });
    }

    if (!['ADMIN', 'SALES_USER'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Check if username already exists
    const existingUser = await db.get('SELECT id FROM users WHERE username = ? AND business_id = ?', [username, req.user.business_id]);
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const userId = uuidv4();
    const hashedPassword = await bcrypt.hash(password, 10);

    await db.run(
      `INSERT INTO users (id, business_id, username, name, password, role, active)
       VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [userId, req.user.business_id, username, name, hashedPassword, role]
    );

    const newUser = await db.get(
      `SELECT id, username, name, role, active, created_at FROM users WHERE id = ?`,
      [userId]
    );

    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user (ADMIN only, or user can update their own profile)
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { name, password, role } = req.body;

    // Users can only update their own name/password, ADMINs can update anyone including role
    if (req.user.id !== req.params.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Only ADMIN can change role
    if (role && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Cannot change role' });
    }

    const user = await db.get('SELECT * FROM users WHERE id = ? AND business_id = ?', [req.params.id, req.user.business_id]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let hashedPassword;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const updateFields = [];
    const updateValues = [];

    if (name) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }

    if (hashedPassword) {
      updateFields.push('password = ?');
      updateValues.push(hashedPassword);
    }

    if (role && req.user.role === 'ADMIN') {
      updateFields.push('role = ?');
      updateValues.push(role);
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(req.params.id);

    if (updateFields.length > 1) {
      await db.run(
        `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );
    }

    const updatedUser = await db.get(
      `SELECT id, username, name, role, active, created_at FROM users WHERE id = ?`,
      [req.params.id]
    );

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Disable/enable user (ADMIN only)
router.put('/:id/toggle-active', verifyToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const user = await db.get('SELECT * FROM users WHERE id = ? AND business_id = ?', [req.params.id, req.user.business_id]);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const newActive = user.active === 1 ? 0 : 1;

    await db.run(
      'UPDATE users SET active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newActive, req.params.id]
    );

    const updatedUser = await db.get(
      `SELECT id, username, name, role, active, created_at FROM users WHERE id = ?`,
      [req.params.id]
    );

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reset user password (ADMIN only)
router.post('/:id/reset-password', verifyToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'New password is required' });
    }

    const user = await db.get('SELECT * FROM users WHERE id = ? AND business_id = ?', [req.params.id, req.user.business_id]);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.run(
      'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [hashedPassword, req.params.id]
    );

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
