const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../database');
const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { pin } = req.body;
    if (!pin) {
      return res.status(400).json({ error: 'PIN is required' });
    }

    const user = await db.get('SELECT * FROM users WHERE pin = ?', [pin]);

    if (user) {
      return res.json({
        success: true,
        user: { id: user.id, business_name: user.business_name }
      });
    }

    return res.status(401).json({ error: 'Invalid PIN' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/setup', async (req, res) => {
  try {
    const { pin, business_name } = req.body;
    if (!pin || !business_name) {
      return res.status(400).json({ error: 'PIN and business name are required' });
    }

    const existingUser = await db.get('SELECT * FROM users LIMIT 1');
    if (existingUser) {
      return res.status(400).json({ error: 'Business already configured' });
    }

    const userId = uuidv4();
    await db.run(
      'INSERT INTO users (id, pin, business_name) VALUES (?, ?, ?)',
      [userId, pin, business_name]
    );

    res.json({
      success: true,
      user: { id: userId, business_name }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/check-setup', async (req, res) => {
  try {
    const user = await db.get('SELECT * FROM users LIMIT 1');
    res.json({ isConfigured: !!user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
