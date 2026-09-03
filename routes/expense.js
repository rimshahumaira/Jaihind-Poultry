const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../database');
const { requireRole } = require('../middleware/auth');
const router = express.Router();

router.post('/', requireRole(['ADMIN']), async (req, res) => {
  try {
    const { date, category, amount, description } = req.body;

    if (!amount || amount < 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const validCategories = ['Labour', 'Fuel', 'Miscellaneous', 'Other'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: 'Invalid category' });
    }

    const id = uuidv4();

    await db.run(
      `INSERT INTO expenses (id, date, category, amount, description)
       VALUES (?, ?, ?, ?, ?)`,
      [id, date, category, amount, description || null]
    );

    res.json({ id, date, category, amount, description });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/', requireRole(['ADMIN']), async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;
    let sql = `SELECT * FROM expenses WHERE 1=1`;
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

    const expenses = await db.all(sql, params);
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', requireRole(['ADMIN']), async (req, res) => {
  try {
    const expense = await db.get(`SELECT * FROM expenses WHERE id = ?`, [req.params.id]);
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    res.json(expense);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', requireRole(['ADMIN']), async (req, res) => {
  try {
    const { date, category, amount, description } = req.body;

    if (!amount || amount < 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const validCategories = ['Labour', 'Fuel', 'Miscellaneous', 'Other'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: 'Invalid category' });
    }

    await db.run(
      `UPDATE expenses SET date = ?, category = ?, amount = ?, description = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [date, category, amount, description || null, req.params.id]
    );

    const expense = await db.get('SELECT * FROM expenses WHERE id = ?', [req.params.id]);
    res.json(expense);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', requireRole(['ADMIN']), async (req, res) => {
  try {
    await db.run('DELETE FROM expenses WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/daily/:date', requireRole(['ADMIN']), async (req, res) => {
  try {
    const expenses = await db.all(
      `SELECT * FROM expenses WHERE date = ? ORDER BY category`,
      [req.params.date]
    );

    const categoryTotals = {
      Labour: 0,
      Fuel: 0,
      Miscellaneous: 0,
      Other: 0
    };

    let totalExpenses = 0;
    expenses.forEach(e => {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
      totalExpenses += e.amount;
    });

    res.json({
      expenses,
      categoryTotals,
      totalExpenses
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
