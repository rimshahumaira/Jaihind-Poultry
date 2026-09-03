const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../database');
const jwt = require('jsonwebtoken');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// GET business details - public endpoint
router.get('/details', async (req, res) => {
  try {
    const details = await db.get('SELECT * FROM business_details LIMIT 1');
    res.json(details || {});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST business details - admin only
router.post('/details', (req, res, next) => {
  // Verify token and check ADMIN role
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied: insufficient permissions' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    return res.status(401).json({ error: 'Token verification failed' });
  }
}, async (req, res) => {
  try {
    const { business_name, contact_number, alternate_contact, address, gst_number, email } = req.body;

    const existing = await db.get('SELECT id FROM business_details LIMIT 1');

    if (existing) {
      await db.run(
        `UPDATE business_details
         SET business_name = ?, contact_number = ?, alternate_contact = ?, address = ?, gst_number = ?, email = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [business_name, contact_number, alternate_contact, address, gst_number, email, existing.id]
      );
      res.json({ success: true, message: 'Business details updated' });
    } else {
      const id = uuidv4();
      await db.run(
        `INSERT INTO business_details (id, business_name, contact_number, alternate_contact, address, gst_number, email)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, business_name, contact_number, alternate_contact, address, gst_number, email]
      );
      res.json({ success: true, message: 'Business details created' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
