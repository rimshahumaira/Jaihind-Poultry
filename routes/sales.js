const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../database');
const { requireRole } = require('../middleware/auth');
const router = express.Router();

const generateBillNumber = async (date) => {
  const year = new Date(date).getFullYear();
  const bills = await db.all(
    `SELECT bill_number FROM sales WHERE date LIKE ? ORDER BY bill_number DESC LIMIT 1`,
    [`${year}%`]
  );

  let nextNumber = 1;
  if (bills.length > 0) {
    const lastBill = bills[0].bill_number;
    const match = lastBill.match(/JHP-(\d+)-(\d+)/);
    if (match && match[1] == year) {
      nextNumber = parseInt(match[2]) + 1;
    }
  }

  return `JHP-${year}-${String(nextNumber).padStart(4, '0')}`;
};

router.post('/', requireRole(['ADMIN', 'SALES_USER']), async (req, res) => {
  try {
    const { date, customer_id, customer_name, cage_lot_number, weight, bird_count, rate, payment_status, notes } = req.body;

    if (!weight || !rate || weight < 0 || rate < 0) {
      return res.status(400).json({ error: 'Invalid weight or rate' });
    }

    const id = uuidv4();
    const bill_number = await generateBillNumber(date);
    const amount = weight * rate;

    await db.run(
      `INSERT INTO sales (id, bill_number, date, customer_id, customer_name, cage_lot_number, weight, bird_count, rate, amount, payment_status, notes, created_by_user_id, created_by_username, created_by_role)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, bill_number, date, customer_id, customer_name, cage_lot_number || null, weight, bird_count || 0, rate, amount, payment_status || 'Pending', notes || null, req.user.id, req.user.username, req.user.role]
    );

    // Update customer stats
    const customer = await db.get('SELECT * FROM customers WHERE id = ?', [customer_id]);
    if (customer) {
      const newTotal = customer.total_quantity + weight;
      const newAmount = customer.total_amount + amount;
      const newOutstanding = customer.outstanding_amount + (payment_status === 'Paid' ? 0 : amount);

      await db.run(
        `UPDATE customers SET total_quantity = ?, total_amount = ?, outstanding_amount = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [newTotal, newAmount, newOutstanding, customer_id]
      );
    }

    res.json({ id, bill_number, amount, payment_status: payment_status || 'Pending' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/', requireRole(['ADMIN', 'SALES_USER']), async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;
    let sql = `SELECT * FROM sales WHERE 1=1`;
    const params = [];

    if (fromDate) {
      sql += ` AND date >= ?`;
      params.push(fromDate);
    }
    if (toDate) {
      sql += ` AND date <= ?`;
      params.push(toDate);
    }

    sql += ` ORDER BY date DESC, bill_number DESC`;

    const sales = await db.all(sql, params);
    res.json(sales);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', requireRole(['ADMIN', 'SALES_USER']), async (req, res) => {
  try {
    const sale = await db.get(`SELECT * FROM sales WHERE id = ?`, [req.params.id]);
    if (!sale) {
      return res.status(404).json({ error: 'Sale not found' });
    }
    res.json(sale);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', requireRole(['ADMIN']), async (req, res) => {
  try {
    const { date, customer_id, customer_name, cage_lot_number, weight, bird_count, rate, payment_status, notes } = req.body;

    if (!weight || !rate || weight < 0 || rate < 0) {
      return res.status(400).json({ error: 'Invalid weight or rate' });
    }

    const oldSale = await db.get('SELECT * FROM sales WHERE id = ?', [req.params.id]);
    if (!oldSale) {
      return res.status(404).json({ error: 'Sale not found' });
    }

    const amount = weight * rate;

    await db.run(
      `UPDATE sales SET date = ?, customer_id = ?, customer_name = ?, cage_lot_number = ?, weight = ?, bird_count = ?, rate = ?, amount = ?, payment_status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [date, customer_id, customer_name, cage_lot_number || null, weight, bird_count || 0, rate, amount, payment_status || 'Pending', notes || null, req.params.id]
    );

    // Update customer stats
    const oldAmount = oldSale.amount;
    const oldWeight = oldSale.weight;
    const oldPaymentStatus = oldSale.payment_status;

    const customer = await db.get('SELECT * FROM customers WHERE id = ?', [customer_id]);
    if (customer) {
      const newTotal = customer.total_quantity - oldWeight + weight;
      const newAmount = customer.total_amount - oldAmount + amount;
      let newOutstanding = customer.outstanding_amount;

      if (oldPaymentStatus === 'Pending') {
        newOutstanding -= oldAmount;
      }
      if (payment_status === 'Pending') {
        newOutstanding += amount;
      }

      await db.run(
        `UPDATE customers SET total_quantity = ?, total_amount = ?, outstanding_amount = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [newTotal, newAmount, newOutstanding, customer_id]
      );
    }

    const sale = await db.get('SELECT * FROM sales WHERE id = ?', [req.params.id]);
    res.json(sale);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', requireRole(['ADMIN']), async (req, res) => {
  try {
    const sale = await db.get('SELECT * FROM sales WHERE id = ?', [req.params.id]);
    if (!sale) {
      return res.status(404).json({ error: 'Sale not found' });
    }

    // Update customer stats
    const customer = await db.get('SELECT * FROM customers WHERE id = ?', [sale.customer_id]);
    if (customer) {
      const newTotal = Math.max(0, customer.total_quantity - sale.weight);
      const newAmount = Math.max(0, customer.total_amount - sale.amount);
      let newOutstanding = customer.outstanding_amount;
      if (sale.payment_status === 'Pending') {
        newOutstanding = Math.max(0, newOutstanding - sale.amount);
      }

      await db.run(
        `UPDATE customers SET total_quantity = ?, total_amount = ?, outstanding_amount = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [newTotal, newAmount, newOutstanding, sale.customer_id]
      );
    }

    await db.run('DELETE FROM sales WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/bill/:billNumber', requireRole(['ADMIN', 'SALES_USER']), async (req, res) => {
  try {
    const sale = await db.get('SELECT * FROM sales WHERE bill_number = ?', [req.params.billNumber]);
    if (!sale) {
      return res.status(404).json({ error: 'Bill not found' });
    }
    res.json(sale);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
