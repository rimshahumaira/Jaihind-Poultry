const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const db = require('./database');
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const salesRoutes = require('./routes/sales');
const purchaseRoutes = require('./routes/purchase');
const customerRoutes = require('./routes/customer');
const supplierRoutes = require('./routes/supplier');
const expenseRoutes = require('./routes/expense');
const inventoryRoutes = require('./routes/inventory');
const reportRoutes = require('./routes/report');

const app = express();

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Initialize database
db.initialize().then(() => {
  console.log('Database initialized successfully');
}).catch(err => {
  console.error('Failed to initialize database:', err);
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/purchase', purchaseRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/supplier', supplierRoutes);
app.use('/api/expense', expenseRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/report', reportRoutes);

// Serve static files from React build
app.use(express.static(path.join(__dirname, 'client/build')));

// Catch-all handler for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

process.on('SIGINT', () => {
  db.close().then(() => {
    console.log('Database closed');
    process.exit(0);
  });
});
