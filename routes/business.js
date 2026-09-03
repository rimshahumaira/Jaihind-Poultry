const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../database');
const { requireRole } = require('../middleware/auth');
const router = express.Router();

router.get('/details', async (req, res) => {
  try {
    const details = await db.get('SELECT * FROM business_details LIMIT 1');
    res.json(details || {});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/details', requireRole(['ADMIN']), async (req, res) => {
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
