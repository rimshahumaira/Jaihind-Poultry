# 🐔 Jai Hind Poultry - Business Management App

A complete mobile-first web application for poultry wholesale billing, sales, purchase, inventory, and profit management. Built with React (frontend) and Node.js/Express (backend) with SQLite database.

## Features

### 1. Dashboard
- Real-time KPIs for today's business
- Total sales, purchases, expenses tracking
- Gross profit and net profit calculation
- Weighted average purchase/sale rates
- Stock status monitoring
- Selectable date view for historical data

### 2. Sales & Billing
- Quick sale entry for multiple customers
- Automatic bill number generation (JHP-YYYY-XXXX)
- Customer selection with auto-filled default rates
- Automatic total calculation (weight × rate)
- Payment status tracking (Paid/Pending)
- Edit and delete functionality
- Customer ledger tracking

### 3. Purchase Management
- Easy purchase entry from suppliers
- Weighted average calculation for multiple purchases
- Cage/Lot number tracking
- Supplier database
- Purchase history and tracking

### 4. Inventory Management
- Real-time stock calculation
- Opening stock setup for each day
- Stock formula: Opening + Purchases - Sales = Closing
- Low stock warnings
- Negative stock detection

### 5. Expense Tracking
- Categorized expenses: Labour, Fuel, Miscellaneous, Other
- Daily expense summary
- Category-wise breakdown
- Automatic inclusion in profit calculation

### 6. Profit Calculation
- **Gross Profit** = Sales Amount - Purchase Cost
- **Net Profit** = Gross Profit - All Expenses
- **Net Profit Margin %** = (Net Profit / Sales) × 100
- Weighted averages for multiple rates
- Accurate decimal precision (2 places)

### 7. Reports & Export
- Daily comprehensive report
- Export to CSV (Sales, Purchase, Expenses)
- Print-ready format

### 8. Customer Management
- Complete customer database
- Default sale rate per customer
- Outstanding balance tracking
- Customer ledger with transaction history

### 9. Security
- PIN-based authentication
- Initial setup screen
- Data persistence with SQLite

## Installation & Setup

### Prerequisites
- Node.js 14+
- npm or yarn

### Backend Setup
```bash
npm install
npm start          # Production
npm run server:dev # Development
```
Server: http://localhost:5000

### Frontend Setup
```bash
cd client
npm install
npm start   # Development
npm run build # Production
```
Frontend: http://localhost:3000

### Run Both
```bash
npm run dev
```

## API Endpoints Summary

- `POST /api/auth/login` - Login
- `POST /api/auth/setup` - Initial setup
- `GET /api/dashboard/:date` - Daily summary
- `GET/POST/PUT/DELETE /api/sales` - Sales management
- `GET/POST/PUT/DELETE /api/purchase` - Purchase management
- `GET/POST/PUT/DELETE /api/customer` - Customer management
- `GET/POST/PUT/DELETE /api/supplier` - Supplier management
- `GET/POST/PUT/DELETE /api/expense` - Expense management
- `GET /api/inventory/:date` - Stock information
- `GET /api/report/daily/:date` - Daily report

## Key Calculations

### Weight × Rate = Amount
```
110 kg × ₹95/kg = ₹10,450
```

### Weighted Average
```
Total Cost ÷ Total Weight = Average Rate
```

### Stock
```
Opening + Purchases - Sales = Closing
```

### Profit
```
Gross Profit = Sales - Purchase Cost
Net Profit = Gross Profit - Expenses
```

## Database Tables
- users, customers, suppliers
- sales, purchases, expenses
- inventory, payments
- daily_summaries

## Mobile-First Design
- Responsive (320px+)
- Large touch buttons
- Bottom navigation
- Automatic calculations
- Clear currency/quantity formatting

## Future Enhancements
- Multiple users/shops
- GST invoicing
- Barcode scanning
- Thermal printer
- WhatsApp integration
- Monthly accounting
- Android APK/PWA

## Version
1.0.0 - Complete full-stack application
React + Node.js + SQLite | Mobile-First | Production-Ready
