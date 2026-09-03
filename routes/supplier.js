const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../database');
const { requireRole } = require('../middleware/auth');
const router = express.Router();

router.post('/', requireRole(['ADMIN']), async (req, res) => {
  try {
    const { name, phone } = req.body;
    const id = uuidv4();

    await db.run(
      `INSERT INTO suppliers (id, name, phone)
       VALUES (?, ?, ?)`,
      [id, name, phone || null]
    );

    res.json({ id, name, phone });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/', requireRole(['ADMIN']), async (req, res) => {
  try {
    const suppliers = await db.all(
      `SELECT * FROM suppliers ORDER BY name`
    );
    res.json(suppliers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', requireRole(['ADMIN']), async (req, res) => {
  try {
    const supplier = await db.get(
      `SELECT * FROM suppliers WHERE id = ?`,
      [req.params.id]
    );
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }
    res.json(supplier);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', requireRole(['ADMIN']), async (req, res) => {
  try {
    const { name, phone } = req.body;
    await db.run(
      `UPDATE suppliers SET name = ?, phone = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [name, phone || null, req.params.id]
    );
    const supplier = await db.get('SELECT * FROM suppliers WHERE id = ?', [req.params.id]);
    res.json(supplier);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', requireRole(['ADMIN']), async (req, res) => {
  try {
    await db.run('DELETE FROM suppliers WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
