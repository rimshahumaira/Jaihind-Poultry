const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../database');
const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { date, supplier_id, supplier_name, weight, rate, cage_lot_number, notes } = req.body;

    if (!weight || !rate || weight < 0 || rate < 0) {
      return res.status(400).json({ error: 'Invalid weight or rate' });
    }

    const id = uuidv4();
    const amount = weight * rate;

    await db.run(
      `INSERT INTO purchases (id, date, supplier_id, supplier_name, weight, rate, amount, cage_lot_number, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, date, supplier_id || null, supplier_name, weight, rate, amount, cage_lot_number || null, notes || null]
    );

    // Update supplier stats
    if (supplier_id) {
      const supplier = await db.get('SELECT * FROM suppliers WHERE id = ?', [supplier_id]);
      if (supplier) {
        await db.run(
          `UPDATE suppliers SET total_quantity = total_quantity + ?, total_amount = total_amount + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
          [weight, amount, supplier_id]
        );
      }
    }

    res.json({ id, amount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;
    let sql = `SELECT * FROM purchases WHERE 1=1`;
    const params = [];

    if (fromDate) {
      sql += ` AND date >= ?`;
      params.push(fromDate);
    }
    if (toDate) {
      sql += ` AND date <= ?`;
      params.push(toDate);
    }

    sql += ` ORDER BY date DESC`;

    const purchases = await db.all(sql, params);
    res.json(purchases);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const purchase = await db.get(`SELECT * FROM purchases WHERE id = ?`, [req.params.id]);
    if (!purchase) {
      return res.status(404).json({ error: 'Purchase not found' });
    }
    res.json(purchase);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { date, supplier_id, supplier_name, weight, rate, cage_lot_number, notes } = req.body;

    if (!weight || !rate || weight < 0 || rate < 0) {
      return res.status(400).json({ error: 'Invalid weight or rate' });
    }

    const oldPurchase = await db.get('SELECT * FROM purchases WHERE id = ?', [req.params.id]);
    if (!oldPurchase) {
      return res.status(404).json({ error: 'Purchase not found' });
    }

    const amount = weight * rate;

    await db.run(
      `UPDATE purchases SET date = ?, supplier_id = ?, supplier_name = ?, weight = ?, rate = ?, amount = ?, cage_lot_number = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [date, supplier_id || null, supplier_name, weight, rate, amount, cage_lot_number || null, notes || null, req.params.id]
    );

    // Update supplier stats
    if (oldPurchase.supplier_id) {
      await db.run(
        `UPDATE suppliers SET total_quantity = total_quantity - ?, total_amount = total_amount - ? WHERE id = ?`,
        [oldPurchase.weight, oldPurchase.amount, oldPurchase.supplier_id]
      );
    }

    if (supplier_id) {
      await db.run(
        `UPDATE suppliers SET total_quantity = total_quantity + ?, total_amount = total_amount + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [weight, amount, supplier_id]
      );
    }

    const purchase = await db.get('SELECT * FROM purchases WHERE id = ?', [req.params.id]);
    res.json(purchase);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const purchase = await db.get('SELECT * FROM purchases WHERE id = ?', [req.params.id]);
    if (!purchase) {
      return res.status(404).json({ error: 'Purchase not found' });
    }

    // Update supplier stats
    if (purchase.supplier_id) {
      await db.run(
        `UPDATE suppliers SET total_quantity = total_quantity - ?, total_amount = total_amount - ? WHERE id = ?`,
        [purchase.weight, purchase.amount, purchase.supplier_id]
      );
    }

    await db.run('DELETE FROM purchases WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/stats/daily', async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }

    const purchases = await db.all(
      `SELECT * FROM purchases WHERE date = ? ORDER BY created_at`,
      [date]
    );

    const totalWeight = purchases.reduce((sum, p) => sum + p.weight, 0);
    const totalAmount = purchases.reduce((sum, p) => sum + p.amount, 0);
    const avgRate = totalWeight > 0 ? totalAmount / totalWeight : 0;

    res.json({
      totalWeight,
      totalAmount,
      avgRate: Math.round(avgRate * 100) / 100,
      purchaseCount: purchases.length,
      purchases
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
