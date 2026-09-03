const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../database');
const { requireRole } = require('../middleware/auth');
const router = express.Router();

const calculateDailySummary = async (date) => {
  const sales = await db.all('SELECT * FROM sales WHERE date = ?', [date]);
  const purchases = await db.all('SELECT * FROM purchases WHERE date = ?', [date]);
  const expenses = await db.all('SELECT * FROM expenses WHERE date = ?', [date]);

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

  const inventory = await db.get('SELECT * FROM inventory WHERE date = ?', [date]);
  const openingStock = inventory ? inventory.opening_stock : 0;
  const closingStock = openingStock + totalPurchasedKg - totalSoldKg;

  const COGS = totalPurchaseAmount;
  const grossProfit = totalSalesAmount - COGS;
  const netProfit = grossProfit - totalExpenses;
  const netProfitMargin = totalSalesAmount > 0 ? (netProfit / totalSalesAmount) * 100 : 0;

  return {
    date,
    totalSalesAmount: Math.round(totalSalesAmount * 100) / 100,
    totalPurchaseAmount: Math.round(totalPurchaseAmount * 100) / 100,
    totalSoldKg: Math.round(totalSoldKg * 100) / 100,
    totalPurchasedKg: Math.round(totalPurchasedKg * 100) / 100,
    avgSaleRate: Math.round(avgSaleRate * 100) / 100,
    avgPurchaseRate: Math.round(avgPurchaseRate * 100) / 100,
    labourExpenses: Math.round(labourExpenses * 100) / 100,
    fuelExpenses: Math.round(fuelExpenses * 100) / 100,
    miscExpenses: Math.round(miscExpenses * 100) / 100,
    otherExpenses: Math.round(otherExpenses * 100) / 100,
    totalExpenses: Math.round(totalExpenses * 100) / 100,
    openingStock: Math.round(openingStock * 100) / 100,
    closingStock: Math.round(closingStock * 100) / 100,
    grossProfit: Math.round(grossProfit * 100) / 100,
    netProfit: Math.round(netProfit * 100) / 100,
    netProfitMargin: Math.round(netProfitMargin * 100) / 100,
    salesCount: sales.length,
    purchaseCount: purchases.length,
    expenseCount: expenses.length
  };
};

router.get('/:date', requireRole(['ADMIN']), async (req, res) => {
  try {
    const summary = await calculateDailySummary(req.params.date);
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/date/:date', requireRole(['ADMIN']), async (req, res) => {
  try {
    const summary = await calculateDailySummary(req.params.date);
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/', requireRole(['ADMIN']), async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const summary = await calculateDailySummary(today);
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/summary', requireRole(['ADMIN']), async (req, res) => {
  try {
    const { date } = req.body;
    const summary = await calculateDailySummary(date);

    const id = uuidv4();
    const existing = await db.get('SELECT * FROM daily_summaries WHERE date = ?', [date]);

    if (existing) {
      await db.run(
        `UPDATE daily_summaries SET
         total_sales = ?, total_purchases = ?, total_sold_kg = ?, total_purchased_kg = ?,
         avg_purchase_rate = ?, avg_sale_rate = ?, labour_expenses = ?, fuel_expenses = ?,
         misc_expenses = ?, other_expenses = ?, gross_profit = ?, net_profit = ?,
         net_profit_margin = ?, closing_stock = ?, updated_at = CURRENT_TIMESTAMP
         WHERE date = ?`,
        [
          summary.totalSalesAmount, summary.totalPurchaseAmount, summary.totalSoldKg, summary.totalPurchasedKg,
          summary.avgPurchaseRate, summary.avgSaleRate, summary.labourExpenses, summary.fuelExpenses,
          summary.miscExpenses, summary.otherExpenses, summary.grossProfit, summary.netProfit,
          summary.netProfitMargin, summary.closingStock, date
        ]
      );
    } else {
      await db.run(
        `INSERT INTO daily_summaries (id, date, total_sales, total_purchases, total_sold_kg, total_purchased_kg, avg_purchase_rate, avg_sale_rate, labour_expenses, fuel_expenses, misc_expenses, other_expenses, gross_profit, net_profit, net_profit_margin, closing_stock)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id, date, summary.totalSalesAmount, summary.totalPurchaseAmount, summary.totalSoldKg, summary.totalPurchasedKg,
          summary.avgPurchaseRate, summary.avgSaleRate, summary.labourExpenses, summary.fuelExpenses,
          summary.miscExpenses, summary.otherExpenses, summary.grossProfit, summary.netProfit,
          summary.netProfitMargin, summary.closingStock
        ]
      );
    }

    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
