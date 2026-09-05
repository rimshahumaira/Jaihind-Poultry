const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../database');
const { requireRole } = require('../middleware/auth');
const router = express.Router();

router.post('/', requireRole(['ADMIN']), async (req, res) => {
  try {
    const { name, phone, default_sale_rate } = req.body;
    const id = uuidv4();

    await db.run(
      `INSERT INTO customers (id, name, phone, default_sale_rate)
       VALUES (?, ?, ?, ?)`,
      [id, name, phone || null, default_sale_rate || 0]
    );

    res.json({ id, name, phone, default_sale_rate: default_sale_rate || 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/', requireRole(['ADMIN', 'SALES_USER']), async (req, res) => {
  try {
    const customers = await db.all(
      `SELECT * FROM customers ORDER BY name`
    );
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', requireRole(['ADMIN', 'SALES_USER']), async (req, res) => {
  try {
    const customer = await db.get(
      `SELECT * FROM customers WHERE id = ?`,
      [req.params.id]
    );
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', requireRole(['ADMIN']), async (req, res) => {
  try {
    const { name, phone, default_sale_rate } = req.body;
    await db.run(
      `UPDATE customers SET name = ?, phone = ?, default_sale_rate = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [name, phone || null, default_sale_rate || 0, req.params.id]
    );
    const customer = await db.get('SELECT * FROM customers WHERE id = ?', [req.params.id]);
    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', requireRole(['ADMIN']), async (req, res) => {
  try {
    await db.run('DELETE FROM customers WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id/ledger', requireRole(['ADMIN', 'SALES_USER']), async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;
    let salesSql = `SELECT * FROM sales WHERE customer_id = ?`;
    let paymentsSql = `SELECT * FROM payments WHERE customer_id = ?`;
    const salesParams = [req.params.id];
    const paymentsParams = [req.params.id];

    if (fromDate) {
      salesSql += ` AND date >= ?`;
      paymentsSql += ` AND date >= ?`;
      salesParams.push(fromDate);
      paymentsParams.push(fromDate);
    }
    if (toDate) {
      salesSql += ` AND date <= ?`;
      paymentsSql += ` AND date <= ?`;
      salesParams.push(toDate);
      paymentsParams.push(toDate);
    }

    salesSql += ` ORDER BY date ASC`;
    paymentsSql += ` ORDER BY date ASC`;

    const sales = await db.all(salesSql, salesParams);
    const payments = await db.all(paymentsSql, paymentsParams);

    const customer = await db.get('SELECT * FROM customers WHERE id = ?', [req.params.id]);

    res.json({
      customer,
      sales,
      payments,
      totalQuantity: sales.reduce((sum, s) => sum + s.weight, 0),
      totalAmount: sales.reduce((sum, s) => sum + s.amount, 0),
      totalPaid: payments.reduce((sum, p) => sum + p.amount, 0),
      outstandingBalance: customer.outstanding_amount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/pay', async (req, res) => {
  try {
    const { amount, saleId, notes, payment_date, payment_mode } = req.body;
    const paymentId = uuidv4();
    const paymentReceivedDate = payment_date || new Date().toISOString().split('T')[0];
    const mode = payment_mode || 'Cash';

    // Insert payment record (sale_id can be NULL for general payments)
    await db.run(
      `INSERT INTO payments (id, sale_id, customer_id, amount, date, notes, payment_mode)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [paymentId, saleId || null, req.params.id, amount, paymentReceivedDate, notes || null, mode]
    );

    // Update customer outstanding amount
    const customer = await db.get('SELECT * FROM customers WHERE id = ?', [req.params.id]);
    const newOutstanding = Math.max(0, customer.outstanding_amount - amount);
    await db.run(
      'UPDATE customers SET outstanding_amount = ? WHERE id = ?',
      [newOutstanding, req.params.id]
    );

    res.json({ success: true, paymentId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
