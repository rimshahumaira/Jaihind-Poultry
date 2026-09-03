const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../database');
const { requireRole } = require('../middleware/auth');
const router = express.Router();

const calculateInventory = async (date) => {
  const sales = await db.all('SELECT * FROM sales WHERE date = ?', [date]);
  const purchases = await db.all('SELECT * FROM purchases WHERE date = ?', [date]);

  const totalSold = sales.reduce((sum, s) => sum + s.weight, 0);
  const totalPurchased = purchases.reduce((sum, p) => sum + p.weight, 0);

  const inventory = await db.get('SELECT * FROM inventory WHERE date = ?', [date]);
  const openingStock = inventory ? inventory.opening_stock : 0;

  return {
    date,
    openingStock,
    totalPurchased,
    totalSold,
    closingStock: openingStock + totalPurchased - totalSold
  };
};

router.get('/:date', requireRole(['ADMIN']), async (req, res) => {
  try {
    const inventory = await calculateInventory(req.params.date);
    res.json(inventory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/date/:date', requireRole(['ADMIN']), async (req, res) => {
  try {
    const inventory = await calculateInventory(req.params.date);
    res.json(inventory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/init/:date', requireRole(['ADMIN']), async (req, res) => {
  try {
    const { openingStock } = req.body;
    const id = uuidv4();

    const existing = await db.get('SELECT * FROM inventory WHERE date = ?', [req.params.date]);
    if (existing) {
      await db.run(
        'UPDATE inventory SET opening_stock = ?, updated_at = CURRENT_TIMESTAMP WHERE date = ?',
        [openingStock, req.params.date]
      );
    } else {
      await db.run(
        'INSERT INTO inventory (id, date, opening_stock) VALUES (?, ?, ?)',
        [id, req.params.date, openingStock]
      );
    }

    const inventory = await calculateInventory(req.params.date);
    res.json(inventory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/current/stock', requireRole(['ADMIN']), async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const inventory = await calculateInventory(today);
    res.json(inventory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
