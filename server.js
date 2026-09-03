const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const path = require('path');
const db = require('./database');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const dashboardRoutes = require('./routes/dashboard');
const salesRoutes = require('./routes/sales');
const purchaseRoutes = require('./routes/purchase');
const customerRoutes = require('./routes/customer');
const supplierRoutes = require('./routes/supplier');
const expenseRoutes = require('./routes/expense');
const inventoryRoutes = require('./routes/inventory');
const reportRoutes = require('./routes/report');
const backupRoutes = require('./routes/backup');
const businessRoutes = require('./routes/business');
const { verifyToken } = require('./middleware/auth');

const app = express();

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(fileUpload({ limits: { fileSize: 100 * 1024 * 1024 } }));

// Initialize database
db.initialize().then(() => {
  console.log('Database initialized successfully');
}).catch(err => {
  console.error('Failed to initialize database:', err);
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/dashboard', verifyToken, dashboardRoutes);
app.use('/api/sales', verifyToken, salesRoutes);
app.use('/api/purchase', verifyToken, purchaseRoutes);
app.use('/api/customer', verifyToken, customerRoutes);
app.use('/api/supplier', verifyToken, supplierRoutes);
app.use('/api/expense', verifyToken, expenseRoutes);
app.use('/api/inventory', verifyToken, inventoryRoutes);
app.use('/api/report', verifyToken, reportRoutes);
app.use('/api/backup', verifyToken, backupRoutes);
app.use('/api/business', businessRoutes);

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
