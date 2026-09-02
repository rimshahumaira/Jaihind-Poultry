const express = require('express');
const db = require('../database');
const router = express.Router();

const formatCurrency = (amount) => {
  return '₹' + (Math.round(amount * 100) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatQuantity = (qty) => {
  return (Math.round(qty * 100) / 100).toString() + ' kg';
};

router.get('/daily/:date', async (req, res) => {
  try {
    const date = req.params.date;
    const sales = await db.all('SELECT * FROM sales WHERE date = ? ORDER BY created_at', [date]);
    const purchases = await db.all('SELECT * FROM purchases WHERE date = ? ORDER BY created_at', [date]);
    const expenses = await db.all('SELECT * FROM expenses WHERE date = ? ORDER BY category', [date]);

    const totalSalesAmount = sales.reduce((sum, s) => sum + s.amount, 0);
    const totalSoldKg = sales.reduce((sum, s) => sum + s.weight, 0);
    const avgSaleRate = totalSoldKg > 0 ? totalSalesAmount / totalSoldKg : 0;

    const totalPurchaseAmount = purchases.reduce((sum, p) => sum + p.amount, 0);
    const totalPurchasedKg = purchases.reduce((sum, p) => sum + p.weight, 0);
    const avgPurchaseRate = totalPurchasedKg > 0 ? totalPurchaseAmount / totalPurchasedKg : 0;

    let labourExpenses = 0;
    let fuelExpenses = 0;
    let miscExpenses = 0;
    let otherExpenses = 0;

    expenses.forEach(e => {
      if (e.category === 'Labour') labourExpenses += e.amount;
      else if (e.category === 'Fuel') fuelExpenses += e.amount;
      else if (e.category === 'Miscellaneous') miscExpenses += e.amount;
      else if (e.category === 'Other') otherExpenses += e.amount;
    });

    const totalExpenses = labourExpenses + fuelExpenses + miscExpenses + otherExpenses;
    const grossProfit = totalSalesAmount - totalPurchaseAmount;
    const netProfit = grossProfit - totalExpenses;
    const netProfitMargin = totalSalesAmount > 0 ? (netProfit / totalSalesAmount) * 100 : 0;

    const customerSales = {};
    sales.forEach(s => {
      if (!customerSales[s.customer_id]) {
        customerSales[s.customer_id] = {
          name: s.customer_name,
          quantity: 0,
          amount: 0,
          rate: 0
        };
      }
      customerSales[s.customer_id].quantity += s.weight;
      customerSales[s.customer_id].amount += s.amount;
    });

    Object.values(customerSales).forEach(cs => {
      cs.rate = cs.quantity > 0 ? Math.round((cs.amount / cs.quantity) * 100) / 100 : 0;
    });

    const report = {
      date,
      business: 'POULTRY TRADER APP',
      purchase: {
        totalKg: Math.round(totalPurchasedKg * 100) / 100,
        totalAmount: Math.round(totalPurchaseAmount * 100) / 100,
        avgRate: Math.round(avgPurchaseRate * 100) / 100,
        purchases
      },
      sales: {
        totalKg: Math.round(totalSoldKg * 100) / 100,
        totalAmount: Math.round(totalSalesAmount * 100) / 100,
        avgRate: Math.round(avgSaleRate * 100) / 100,
        customerSales: Object.values(customerSales),
        sales
      },
      expenses: {
        labour: Math.round(labourExpenses * 100) / 100,
        fuel: Math.round(fuelExpenses * 100) / 100,
        miscellaneous: Math.round(miscExpenses * 100) / 100,
        other: Math.round(otherExpenses * 100) / 100,
        total: Math.round(totalExpenses * 100) / 100,
        details: expenses
      },
      profit: {
        grossProfit: Math.round(grossProfit * 100) / 100,
        totalExpenses: Math.round(totalExpenses * 100) / 100,
        netProfit: Math.round(netProfit * 100) / 100,
        netProfitMargin: Math.round(netProfitMargin * 100) / 100
      }
    };

    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/text-report/:date', async (req, res) => {
  try {
    const date = req.params.date;
    const sales = await db.all('SELECT * FROM sales WHERE date = ? ORDER BY created_at', [date]);
    const purchases = await db.all('SELECT * FROM purchases WHERE date = ? ORDER BY created_at', [date]);
    const expenses = await db.all('SELECT * FROM expenses WHERE date = ? ORDER BY category', [date]);

    const totalSalesAmount = sales.reduce((sum, s) => sum + s.amount, 0);
    const totalSoldKg = sales.reduce((sum, s) => sum + s.weight, 0);
    const avgSaleRate = totalSoldKg > 0 ? totalSalesAmount / totalSoldKg : 0;

    const totalPurchaseAmount = purchases.reduce((sum, p) => sum + p.amount, 0);
    const totalPurchasedKg = purchases.reduce((sum, p) => sum + p.weight, 0);
    const avgPurchaseRate = totalPurchasedKg > 0 ? totalPurchaseAmount / totalPurchasedKg : 0;

    let labourExpenses = 0;
    let fuelExpenses = 0;
    let miscExpenses = 0;
    let otherExpenses = 0;

    expenses.forEach(e => {
      if (e.category === 'Labour') labourExpenses += e.amount;
      else if (e.category === 'Fuel') fuelExpenses += e.amount;
      else if (e.category === 'Miscellaneous') miscExpenses += e.amount;
      else if (e.category === 'Other') otherExpenses += e.amount;
    });

    const totalExpenses = labourExpenses + fuelExpenses + miscExpenses + otherExpenses;
    const grossProfit = totalSalesAmount - totalPurchaseAmount;
    const netProfit = grossProfit - totalExpenses;
    const netProfitMargin = totalSalesAmount > 0 ? (netProfit / totalSalesAmount) * 100 : 0;

    const customerSalesMap = {};
    sales.forEach(s => {
      if (!customerSalesMap[s.customer_name]) {
        customerSalesMap[s.customer_name] = { qty: 0, amount: 0, rate: 0 };
      }
      customerSalesMap[s.customer_name].qty += s.weight;
      customerSalesMap[s.customer_name].amount += s.amount;
      customerSalesMap[s.customer_name].rate = s.rate;
    });

    let report = `POULTRY TRADER APP
${date}

════════════════════════════════════════
PURCHASE

Total Purchased: ${formatQuantity(totalPurchasedKg)}
Purchase Amount: ${formatCurrency(totalPurchaseAmount)}
Avg Purchase Rate: ${formatCurrency(avgPurchaseRate)}/kg

════════════════════════════════════════
SALES

Customer Details:
${Object.entries(customerSalesMap).map(([name, data]) =>
  `  ${name}: ${formatQuantity(data.qty)} @ ${formatCurrency(data.rate)}/kg = ${formatCurrency(data.amount)}`
).join('\n')}

Total Sold: ${formatQuantity(totalSoldKg)}
Total Sales: ${formatCurrency(totalSalesAmount)}
Avg Sale Rate: ${formatCurrency(avgSaleRate)}/kg

════════════════════════════════════════
EXPENSES

Labour: ${formatCurrency(labourExpenses)}
Fuel: ${formatCurrency(fuelExpenses)}
Miscellaneous: ${formatCurrency(miscExpenses)}
Other: ${formatCurrency(otherExpenses)}
─────────────────────────────────────
Total Expenses: ${formatCurrency(totalExpenses)}

════════════════════════════════════════
PROFIT SUMMARY

Gross Profit: ${formatCurrency(grossProfit)}
Net Profit: ${formatCurrency(netProfit)}
Net Profit Margin: ${(Math.round(netProfitMargin * 100) / 100).toFixed(2)}%

════════════════════════════════════════`;

    res.setHeader('Content-Type', 'text/plain');
    res.send(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/export-csv/:type', async (req, res) => {
  try {
    const type = req.params.type;
    const { fromDate, toDate } = req.body;

    let data = [];
    let headers = [];

    if (type === 'sales') {
      headers = ['Bill Number', 'Date', 'Customer', 'Weight (kg)', 'Rate (₹/kg)', 'Amount (₹)', 'Payment Status', 'Notes'];
      data = await db.all(
        `SELECT * FROM sales WHERE date BETWEEN ? AND ? ORDER BY date DESC`,
        [fromDate || '2000-01-01', toDate || new Date().toISOString().split('T')[0]]
      );

      const csv = [headers.join(','), ...data.map(row =>
        `${row.bill_number},${row.date},${row.customer_name},${row.weight},${row.rate},${row.amount},${row.payment_status},"${(row.notes || '').replace(/"/g, '""')}"`
      )].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=sales.csv');
      res.send(csv);

    } else if (type === 'purchases') {
      headers = ['Date', 'Supplier', 'Weight (kg)', 'Rate (₹/kg)', 'Amount (₹)', 'Cage/Lot', 'Notes'];
      data = await db.all(
        `SELECT * FROM purchases WHERE date BETWEEN ? AND ? ORDER BY date DESC`,
        [fromDate || '2000-01-01', toDate || new Date().toISOString().split('T')[0]]
      );

      const csv = [headers.join(','), ...data.map(row =>
        `${row.date},${row.supplier_name},${row.weight},${row.rate},${row.amount},${row.cage_lot_number || ''},"${(row.notes || '').replace(/"/g, '""')}"`
      )].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=purchases.csv');
      res.send(csv);

    } else if (type === 'expenses') {
      headers = ['Date', 'Category', 'Amount (₹)', 'Description'];
      data = await db.all(
        `SELECT * FROM expenses WHERE date BETWEEN ? AND ? ORDER BY date DESC`,
        [fromDate || '2000-01-01', toDate || new Date().toISOString().split('T')[0]]
      );

      const csv = [headers.join(','), ...data.map(row =>
        `${row.date},${row.category},${row.amount},"${(row.description || '').replace(/"/g, '""')}"`
      )].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=expenses.csv');
      res.send(csv);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
