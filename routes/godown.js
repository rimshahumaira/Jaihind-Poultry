const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../database');
const { requireRole } = require('../middleware/auth');
const router = express.Router();

// ==================== CUSTOMERS ====================

router.post('/customers', requireRole(['GODOWN_MANAGER']), async (req, res) => {
  try {
    const { name, phone, address, contact_person, customer_type, default_sale_rate } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Customer name is required' });
    }

    const id = uuidv4();
    await db.run(
      `INSERT INTO godown_customers (id, name, phone, address, contact_person, customer_type, default_sale_rate)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, name, phone || null, address || null, contact_person || null, customer_type || 'RETAIL', default_sale_rate || 0]
    );

    res.json({ id, name, customer_type: customer_type || 'RETAIL' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/customers', requireRole(['GODOWN_MANAGER']), async (req, res) => {
  try {
    const customers = await db.all(
      `SELECT * FROM godown_customers ORDER BY name ASC`
    );
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/customers/:id', requireRole(['GODOWN_MANAGER']), async (req, res) => {
  try {
    const customer = await db.get(
      `SELECT * FROM godown_customers WHERE id = ?`,
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

router.put('/customers/:id', requireRole(['GODOWN_MANAGER']), async (req, res) => {
  try {
    const { name, phone, address, contact_person, customer_type, default_sale_rate } = req.body;

    const customer = await db.get(
      `SELECT * FROM godown_customers WHERE id = ?`,
      [req.params.id]
    );
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    await db.run(
      `UPDATE godown_customers SET name = ?, phone = ?, address = ?, contact_person = ?, customer_type = ?, default_sale_rate = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [name || customer.name, phone || customer.phone, address || customer.address, contact_person || customer.contact_person, customer_type || customer.customer_type, default_sale_rate !== undefined ? default_sale_rate : customer.default_sale_rate, req.params.id]
    );

    res.json({ success: true, id: req.params.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== SALES ====================

const generateGodownBillNumber = async (date) => {
  const year = new Date(date).getFullYear();
  const bills = await db.all(
    `SELECT bill_number FROM godown_sales WHERE date LIKE ? ORDER BY bill_number DESC LIMIT 1`,
    [`${year}%`]
  );

  let nextNumber = 1;
  if (bills.length > 0) {
    const lastBill = bills[0].bill_number;
    const match = lastBill.match(/GODN-(\d+)-(\d+)/);
    if (match && match[1] == year) {
      nextNumber = parseInt(match[2]) + 1;
    }
  }

  return `GODN-${year}-${String(nextNumber).padStart(4, '0')}`;
};

router.post('/sales', requireRole(['GODOWN_MANAGER']), async (req, res) => {
  try {
    const { date, customer_id, customer_name, sale_type, live_bird_weight, live_bird_rate, meat_output_weight, meat_output_rate, item_name, quantity, unit, rate, payment_mode, notes } = req.body;

    if (!date || !customer_id || !customer_name || !sale_type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const id = uuidv4();
    const bill_number = await generateGodownBillNumber(date);

    let total_amount = 0;
    let meat_yield_percent = null;

    // Validate and calculate based on sale type
    if (sale_type === 'RETAIL_LIVE_BIRD') {
      if (!live_bird_weight || !live_bird_rate) {
        return res.status(400).json({ error: 'Live bird weight and rate required for retail sale' });
      }
      total_amount = live_bird_weight * live_bird_rate;
    } else if (sale_type === 'HALAL') {
      if (!live_bird_weight || !live_bird_rate || !meat_output_weight) {
        return res.status(400).json({ error: 'Live bird weight/rate and meat output required for halal sale' });
      }
      // Calculate meat yield percentage automatically
      meat_yield_percent = (meat_output_weight / live_bird_weight) * 100;
      // Total amount is based on meat output
      total_amount = meat_output_weight * (meat_output_rate || live_bird_rate);
    } else if (sale_type === 'HOTEL') {
      if (!quantity || !item_name || !rate) {
        return res.status(400).json({ error: 'Item, quantity and rate required for hotel sale' });
      }
      total_amount = quantity * rate;
    }

    await db.run(
      `INSERT INTO godown_sales (id, bill_number, date, customer_id, customer_name, sale_type, live_bird_weight, live_bird_rate, meat_output_weight, meat_output_rate, meat_yield_percent, item_name, quantity, unit, rate, total_amount, payment_mode, notes, created_by_user_id, created_by_username, created_by_role)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, bill_number, date, customer_id, customer_name, sale_type, live_bird_weight || null, live_bird_rate || null, meat_output_weight || null, meat_output_rate || null, meat_yield_percent, item_name || null, quantity || null, unit || null, rate || null, total_amount, payment_mode || 'Cash', notes || null, req.user.id, req.user.username, req.user.role]
    );

    // Update customer outstanding amount
    const customer = await db.get('SELECT * FROM godown_customers WHERE id = ?', [customer_id]);
    if (customer) {
      const newOutstanding = customer.outstanding_amount + total_amount;
      await db.run(
        `UPDATE godown_customers SET total_amount = total_amount + ?, outstanding_amount = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [total_amount, newOutstanding, customer_id]
      );
    }

    // Update stock based on sale type
    const today = date.split('T')[0];
    const stock = await db.get(`SELECT * FROM godown_stock WHERE date = ?`, [today]);

    if (sale_type === 'RETAIL_LIVE_BIRD') {
      if (stock) {
        await db.run(
          `UPDATE godown_stock SET live_bird_sold = live_bird_sold + ?, live_bird_closing = live_bird_opening + live_bird_purchased - live_bird_processed - (live_bird_sold + ?), updated_at = CURRENT_TIMESTAMP WHERE date = ?`,
          [live_bird_weight, live_bird_weight, today]
        );
      }
    } else if (sale_type === 'HALAL') {
      if (stock) {
        await db.run(
          `UPDATE godown_stock SET live_bird_processed = live_bird_processed + ?, meat_produced = meat_produced + ?, meat_sold = meat_sold + ?, live_bird_closing = live_bird_opening + live_bird_purchased - (live_bird_processed + ?) - live_bird_sold, meat_closing = meat_opening + (meat_produced + ?) - (meat_sold + ?), updated_at = CURRENT_TIMESTAMP WHERE date = ?`,
          [live_bird_weight, meat_output_weight, meat_output_weight, live_bird_weight, meat_output_weight, meat_output_weight, today]
        );
      }
    } else if (sale_type === 'HOTEL') {
      // Hotel sales don't affect stock tracking
    }

    res.json({ id, bill_number, total_amount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/sales', requireRole(['GODOWN_MANAGER']), async (req, res) => {
  try {
    const { fromDate, toDate, sale_type } = req.query;
    let sql = `SELECT * FROM godown_sales WHERE 1=1`;
    const params = [];

    if (fromDate) {
      sql += ` AND date >= ?`;
      params.push(fromDate);
    }
    if (toDate) {
      sql += ` AND date <= ?`;
      params.push(toDate);
    }
    if (sale_type) {
      sql += ` AND sale_type = ?`;
      params.push(sale_type);
    }

    sql += ` ORDER BY date DESC, bill_number DESC`;

    const sales = await db.all(sql, params);
    res.json(sales);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/sales/:id', requireRole(['GODOWN_MANAGER']), async (req, res) => {
  try {
    const sale = await db.get(
      `SELECT * FROM godown_sales WHERE id = ?`,
      [req.params.id]
    );
    if (!sale) {
      return res.status(404).json({ error: 'Sale not found' });
    }
    res.json(sale);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/sales/:id', requireRole(['GODOWN_MANAGER']), async (req, res) => {
  try {
    const { payment_status, amount_paid, notes } = req.body;

    const sale = await db.get(`SELECT * FROM godown_sales WHERE id = ?`, [req.params.id]);
    if (!sale) {
      return res.status(404).json({ error: 'Sale not found' });
    }

    const balance_due = sale.total_amount - (amount_paid || sale.amount_paid);

    await db.run(
      `UPDATE godown_sales SET payment_status = ?, amount_paid = ?, balance_due = ?, notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [payment_status || sale.payment_status, amount_paid !== undefined ? amount_paid : sale.amount_paid, balance_due, notes || sale.notes, req.params.id]
    );

    res.json({ success: true, id: req.params.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== PURCHASES ====================

router.post('/purchases', requireRole(['GODOWN_MANAGER']), async (req, res) => {
  try {
    const { date, purchase_type, main_business_sale_id, supplier_id, supplier_name, bird_type, weight, bird_count, rate, amount, payment_mode, notes } = req.body;

    if (!date || !purchase_type) {
      return res.status(400).json({ error: 'Date and purchase type are required' });
    }

    let purchase_amount = amount;

    // Handle Main Business purchase
    if (purchase_type === 'MAIN_BUSINESS') {
      if (!main_business_sale_id) {
        return res.status(400).json({ error: 'Main business sale ID required' });
      }

      // Get the main business sale to verify and extract rate
      const mainSale = await db.get(`SELECT * FROM sales WHERE id = ?`, [main_business_sale_id]);
      if (!mainSale) {
        return res.status(404).json({ error: 'Main business sale not found' });
      }

      // Enforce equal rate
      if (rate !== mainSale.rate) {
        return res.status(400).json({ error: `Rate must match main business sale rate: ${mainSale.rate}` });
      }

      purchase_amount = weight * rate;
    } else if (purchase_type === 'THIRD_PARTY') {
      if (!supplier_id && !supplier_name) {
        return res.status(400).json({ error: 'Supplier ID or name required' });
      }
      if (!weight || !rate) {
        return res.status(400).json({ error: 'Weight and rate required' });
      }
      purchase_amount = weight * rate;
    }

    const id = uuidv4();
    await db.run(
      `INSERT INTO godown_purchases (id, date, purchase_type, main_business_sale_id, supplier_id, supplier_name, bird_type, weight, bird_count, rate, amount, payment_mode, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, date, purchase_type, main_business_sale_id || null, supplier_id || null, supplier_name || null, bird_type || null, weight || 0, bird_count || 0, rate || 0, purchase_amount, payment_mode || 'Cash', notes || null]
    );

    // Update stock
    const today = date.split('T')[0];
    let stock = await db.get(`SELECT * FROM godown_stock WHERE date = ?`, [today]);

    if (!stock) {
      const stockId = uuidv4();
      await db.run(
        `INSERT INTO godown_stock (id, date, live_bird_opening, live_bird_purchased, live_bird_closing, meat_opening, meat_closing)
         VALUES (?, ?, 0, ?, ?, 0, 0)`,
        [stockId, today, weight || 0, weight || 0]
      );
    } else {
      await db.run(
        `UPDATE godown_stock SET live_bird_purchased = live_bird_purchased + ?, live_bird_closing = live_bird_opening + (live_bird_purchased + ?) - live_bird_processed - live_bird_sold, updated_at = CURRENT_TIMESTAMP WHERE date = ?`,
        [weight || 0, weight || 0, today]
      );
    }

    res.json({ id, amount: purchase_amount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/purchases', requireRole(['GODOWN_MANAGER']), async (req, res) => {
  try {
    const { fromDate, toDate, purchase_type } = req.query;
    let sql = `SELECT * FROM godown_purchases WHERE 1=1`;
    const params = [];

    if (fromDate) {
      sql += ` AND date >= ?`;
      params.push(fromDate);
    }
    if (toDate) {
      sql += ` AND date <= ?`;
      params.push(toDate);
    }
    if (purchase_type) {
      sql += ` AND purchase_type = ?`;
      params.push(purchase_type);
    }

    sql += ` ORDER BY date DESC`;

    const purchases = await db.all(sql, params);
    res.json(purchases);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/purchases/:id', requireRole(['GODOWN_MANAGER']), async (req, res) => {
  try {
    const purchase = await db.get(
      `SELECT * FROM godown_purchases WHERE id = ?`,
      [req.params.id]
    );
    if (!purchase) {
      return res.status(404).json({ error: 'Purchase not found' });
    }
    res.json(purchase);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== STOCK ====================

router.get('/stock', requireRole(['GODOWN_MANAGER']), async (req, res) => {
  try {
    const { date } = req.query;
    let sql = `SELECT * FROM godown_stock WHERE 1=1`;
    const params = [];

    if (date) {
      sql += ` AND date = ?`;
      params.push(date);
    }

    sql += ` ORDER BY date DESC`;

    const stock = await db.all(sql, params);
    res.json(stock);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/stock', requireRole(['GODOWN_MANAGER']), async (req, res) => {
  try {
    const { date, live_bird_opening, meat_opening } = req.body;

    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }

    const id = uuidv4();
    await db.run(
      `INSERT INTO godown_stock (id, date, live_bird_opening, meat_opening)
       VALUES (?, ?, ?, ?)`,
      [id, date, live_bird_opening || 0, meat_opening || 0]
    );

    res.json({ id, date });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== EXPENSES ====================

router.post('/expenses', requireRole(['GODOWN_MANAGER']), async (req, res) => {
  try {
    const { date, category, amount, description } = req.body;

    if (!date || !category || !amount) {
      return res.status(400).json({ error: 'Date, category and amount are required' });
    }

    const id = uuidv4();
    await db.run(
      `INSERT INTO godown_expenses (id, date, category, amount, description)
       VALUES (?, ?, ?, ?, ?)`,
      [id, date, category, amount, description || null]
    );

    res.json({ id, amount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/expenses', requireRole(['GODOWN_MANAGER']), async (req, res) => {
  try {
    const { fromDate, toDate, category } = req.query;
    let sql = `SELECT * FROM godown_expenses WHERE 1=1`;
    const params = [];

    if (fromDate) {
      sql += ` AND date >= ?`;
      params.push(fromDate);
    }
    if (toDate) {
      sql += ` AND date <= ?`;
      params.push(toDate);
    }
    if (category) {
      sql += ` AND category = ?`;
      params.push(category);
    }

    sql += ` ORDER BY date DESC`;

    const expenses = await db.all(sql, params);
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/expenses/:id', requireRole(['GODOWN_MANAGER']), async (req, res) => {
  try {
    const expense = await db.get(`SELECT * FROM godown_expenses WHERE id = ?`, [req.params.id]);
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    await db.run(`DELETE FROM godown_expenses WHERE id = ?`, [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== PAYMENTS ====================

router.post('/payments', requireRole(['GODOWN_MANAGER']), async (req, res) => {
  try {
    const { payment_type, sale_id, customer_id, purchase_id, supplier_id, amount, date, payment_mode, notes } = req.body;

    if (!payment_type || !amount || !date) {
      return res.status(400).json({ error: 'Payment type, amount and date are required' });
    }

    const id = uuidv4();
    await db.run(
      `INSERT INTO godown_payments (id, payment_type, sale_id, customer_id, purchase_id, supplier_id, amount, date, payment_mode, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, payment_type, sale_id || null, customer_id || null, purchase_id || null, supplier_id || null, amount, date, payment_mode || 'Cash', notes || null]
    );

    // Update sale or purchase payment tracking
    if (payment_type === 'CUSTOMER_PAYMENT' && sale_id) {
      const sale = await db.get(`SELECT * FROM godown_sales WHERE id = ?`, [sale_id]);
      if (sale) {
        const newAmountPaid = sale.amount_paid + amount;
        const newBalanceDue = sale.total_amount - newAmountPaid;
        await db.run(
          `UPDATE godown_sales SET amount_paid = ?, balance_due = ?, payment_status = ? WHERE id = ?`,
          [newAmountPaid, newBalanceDue, newBalanceDue <= 0 ? 'Paid' : 'Pending', sale_id]
        );
      }

      // Update customer outstanding
      if (customer_id) {
        await db.run(
          `UPDATE godown_customers SET outstanding_amount = outstanding_amount - ? WHERE id = ?`,
          [amount, customer_id]
        );
      }
    } else if (payment_type === 'SUPPLIER_PAYMENT' && purchase_id) {
      const purchase = await db.get(`SELECT * FROM godown_purchases WHERE id = ?`, [purchase_id]);
      if (purchase) {
        const newAmountPaid = purchase.amount_paid + amount;
        const newOutstanding = purchase.amount - newAmountPaid;
        await db.run(
          `UPDATE godown_purchases SET amount_paid = ?, outstanding_amount = ? WHERE id = ?`,
          [newAmountPaid, newOutstanding, purchase_id]
        );
      }
    }

    res.json({ id, amount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/payments', requireRole(['GODOWN_MANAGER']), async (req, res) => {
  try {
    const { payment_type, fromDate, toDate } = req.query;
    let sql = `SELECT * FROM godown_payments WHERE 1=1`;
    const params = [];

    if (payment_type) {
      sql += ` AND payment_type = ?`;
      params.push(payment_type);
    }
    if (fromDate) {
      sql += ` AND date >= ?`;
      params.push(fromDate);
    }
    if (toDate) {
      sql += ` AND date <= ?`;
      params.push(toDate);
    }

    sql += ` ORDER BY date DESC`;

    const payments = await db.all(sql, params);
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== CUSTOMER LEDGER ====================

router.get('/customers/:id/ledger', requireRole(['GODOWN_MANAGER']), async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;

    // Get customer
    const customer = await db.get(
      `SELECT * FROM godown_customers WHERE id = ?`,
      [req.params.id]
    );
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Get all sales for this customer
    let sql = `SELECT * FROM godown_sales WHERE customer_id = ?`;
    const params = [req.params.id];

    if (fromDate) {
      sql += ` AND date >= ?`;
      params.push(fromDate);
    }
    if (toDate) {
      sql += ` AND date <= ?`;
      params.push(toDate);
    }

    sql += ` ORDER BY date ASC, bill_number ASC`;

    const sales = await db.all(sql, params);

    res.json({
      customer,
      sales,
      totalSales: sales.reduce((sum, s) => sum + s.total_amount, 0),
      totalPaid: sales.reduce((sum, s) => sum + s.amount_paid, 0),
      outstandingBalance: customer.outstanding_amount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== DASHBOARD ====================

router.get('/dashboard', requireRole(['GODOWN_MANAGER']), async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;

    let dateFilter = '';
    const params = [];
    if (fromDate) {
      dateFilter += ` AND date >= ?`;
      params.push(fromDate);
    }
    if (toDate) {
      dateFilter += ` AND date <= ?`;
      params.push(toDate);
    }

    // Total Sales
    const salesResult = await db.get(
      `SELECT SUM(total_amount) as total FROM godown_sales WHERE 1=1${dateFilter}`,
      params
    );
    const totalSales = salesResult?.total || 0;

    // Total Purchases
    const purchasesResult = await db.get(
      `SELECT SUM(amount) as total FROM godown_purchases WHERE 1=1${dateFilter}`,
      params
    );
    const totalPurchases = purchasesResult?.total || 0;

    // Total Expenses
    const expensesResult = await db.get(
      `SELECT SUM(amount) as total FROM godown_expenses WHERE 1=1${dateFilter}`,
      params
    );
    const totalExpenses = expensesResult?.total || 0;

    // Gross Profit
    const grossProfit = totalSales - totalPurchases;

    // Net Profit
    const netProfit = grossProfit - totalExpenses;

    // Sales by type
    const salesByType = await db.all(
      `SELECT sale_type, COUNT(*) as count, SUM(total_amount) as amount FROM godown_sales WHERE 1=1${dateFilter} GROUP BY sale_type`,
      params
    );

    // Current stock
    const latestStock = await db.get(
      `SELECT * FROM godown_stock ORDER BY date DESC LIMIT 1`
    );

    // Outstanding collections
    const outstandingResult = await db.get(
      `SELECT SUM(outstanding_amount) as total FROM godown_customers`
    );
    const outstandingCollections = outstandingResult?.total || 0;

    // Pending payments
    const pendingPaymentsResult = await db.get(
      `SELECT SUM(outstanding_amount) as total FROM godown_purchases WHERE 1=1${dateFilter}`,
      params
    );
    const pendingPayments = pendingPaymentsResult?.total || 0;

    res.json({
      totalSales,
      totalPurchases,
      totalExpenses,
      grossProfit,
      netProfit,
      salesByType,
      stock: latestStock,
      outstandingCollections,
      pendingPayments
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== REPORTS ====================

router.get('/reports/profit', requireRole(['GODOWN_MANAGER']), async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;

    let dateFilter = '';
    const params = [];
    if (fromDate) {
      dateFilter += ` AND date >= ?`;
      params.push(fromDate);
    }
    if (toDate) {
      dateFilter += ` AND date <= ?`;
      params.push(toDate);
    }

    // Get all data
    const salesResult = await db.get(
      `SELECT SUM(total_amount) as total FROM godown_sales WHERE 1=1${dateFilter}`,
      params
    );
    const purchasesResult = await db.get(
      `SELECT SUM(amount) as total FROM godown_purchases WHERE 1=1${dateFilter}`,
      params
    );
    const expensesResult = await db.get(
      `SELECT SUM(amount) as total FROM godown_expenses WHERE 1=1${dateFilter}`,
      params
    );

    const totalSales = salesResult?.total || 0;
    const totalPurchases = purchasesResult?.total || 0;
    const totalExpenses = expensesResult?.total || 0;

    const grossProfit = totalSales - totalPurchases;
    const netProfit = grossProfit - totalExpenses;

    res.json({
      period: { from: fromDate, to: toDate },
      totalSales,
      totalPurchases,
      totalExpenses,
      grossProfit,
      netProfit,
      profitMargin: totalSales > 0 ? ((netProfit / totalSales) * 100).toFixed(2) : 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/reports/inventory', requireRole(['GODOWN_MANAGER']), async (req, res) => {
  try {
    const stock = await db.all(
      `SELECT * FROM godown_stock ORDER BY date DESC`
    );
    res.json(stock);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
