const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'poultry.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error('Error opening database:', err);
  else console.log('Connected to SQLite database');
});

const dbAsync = {
  initialize: async () => {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        // Users table
        db.run(`
          CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            pin TEXT NOT NULL,
            business_name TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `, (err) => {
          if (err && !err.message.includes('already exists')) reject(err);
        });

        // Customers table
        db.run(`
          CREATE TABLE IF NOT EXISTS customers (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            phone TEXT,
            default_sale_rate REAL DEFAULT 0,
            total_quantity REAL DEFAULT 0,
            total_amount REAL DEFAULT 0,
            outstanding_amount REAL DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `, (err) => {
          if (err && !err.message.includes('already exists')) reject(err);
        });

        // Suppliers table
        db.run(`
          CREATE TABLE IF NOT EXISTS suppliers (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            phone TEXT,
            total_quantity REAL DEFAULT 0,
            total_amount REAL DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `, (err) => {
          if (err && !err.message.includes('already exists')) reject(err);
        });

        // Sales table
        db.run(`
          CREATE TABLE IF NOT EXISTS sales (
            id TEXT PRIMARY KEY,
            bill_number TEXT UNIQUE NOT NULL,
            date DATE NOT NULL,
            customer_id TEXT NOT NULL,
            customer_name TEXT NOT NULL,
            cage_lot_number TEXT,
            weight REAL NOT NULL,
            bird_count INTEGER DEFAULT 0,
            rate REAL NOT NULL,
            amount REAL NOT NULL,
            payment_status TEXT DEFAULT 'Pending',
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (customer_id) REFERENCES customers(id)
          )
        `, (err) => {
          if (err && !err.message.includes('already exists')) reject(err);
        });

        // Add bird_count column to sales if it doesn't exist
        db.run(`PRAGMA table_info(sales)`, (err, columns) => {
          if (!err && columns) {
            db.all(`PRAGMA table_info(sales)`, (err, columns) => {
              if (columns && !columns.some(c => c.name === 'bird_count')) {
                db.run(`ALTER TABLE sales ADD COLUMN bird_count INTEGER DEFAULT 0`, (err) => {
                  if (!err) console.log('Added bird_count column to sales table');
                });
              }
            });
          }
        });

        // Purchases table
        db.run(`
          CREATE TABLE IF NOT EXISTS purchases (
            id TEXT PRIMARY KEY,
            date DATE NOT NULL,
            supplier_id TEXT,
            supplier_name TEXT NOT NULL,
            weight REAL NOT NULL,
            bird_count INTEGER DEFAULT 0,
            rate REAL NOT NULL,
            amount REAL NOT NULL,
            cage_lot_number TEXT,
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
          )
        `, (err) => {
          if (err && !err.message.includes('already exists')) reject(err);
        });

        // Add bird_count column to purchases if it doesn't exist
        db.run(`PRAGMA table_info(purchases)`, (err, columns) => {
          if (!err && columns) {
            db.all(`PRAGMA table_info(purchases)`, (err, columns) => {
              if (columns && !columns.some(c => c.name === 'bird_count')) {
                db.run(`ALTER TABLE purchases ADD COLUMN bird_count INTEGER DEFAULT 0`, (err) => {
                  if (!err) console.log('Added bird_count column to purchases table');
                });
              }
            });
          }
        });

        // Expenses table
        db.run(`
          CREATE TABLE IF NOT EXISTS expenses (
            id TEXT PRIMARY KEY,
            date DATE NOT NULL,
            category TEXT NOT NULL,
            amount REAL NOT NULL,
            description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `, (err) => {
          if (err && !err.message.includes('already exists')) reject(err);
        });

        // Inventory table (for tracking opening stock)
        db.run(`
          CREATE TABLE IF NOT EXISTS inventory (
            id TEXT PRIMARY KEY,
            date DATE NOT NULL UNIQUE,
            opening_stock REAL DEFAULT 0,
            total_purchased REAL DEFAULT 0,
            total_sold REAL DEFAULT 0,
            closing_stock REAL DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `, (err) => {
          if (err && !err.message.includes('already exists')) reject(err);
        });

        // Payments table (for tracking partial/full payments)
        db.run(`
          CREATE TABLE IF NOT EXISTS payments (
            id TEXT PRIMARY KEY,
            sale_id TEXT,
            customer_id TEXT NOT NULL,
            amount REAL NOT NULL,
            date DATE NOT NULL,
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (sale_id) REFERENCES sales(id),
            FOREIGN KEY (customer_id) REFERENCES customers(id)
          )
        `, (err) => {
          if (err && !err.message.includes('already exists')) reject(err);
        });

        // Alter payments table to add notes column if it doesn't exist
        db.run(`
          PRAGMA table_info(payments);
        `, (err, columns) => {
          if (!err) {
            db.all(`PRAGMA table_info(payments)`, (err, columns) => {
              if (columns && !columns.some(c => c.name === 'notes')) {
                db.run(`ALTER TABLE payments ADD COLUMN notes TEXT`, (err) => {
                  if (err && !err.message.includes('already exists') && !err.message.includes('duplicate')) {
                    console.log('Added notes column to payments table');
                  }
                });
              }
            });
          }
        });

        // Daily summaries table
        db.run(`
          CREATE TABLE IF NOT EXISTS daily_summaries (
            id TEXT PRIMARY KEY,
            date DATE NOT NULL UNIQUE,
            total_sales REAL DEFAULT 0,
            total_purchases REAL DEFAULT 0,
            total_sold_kg REAL DEFAULT 0,
            total_purchased_kg REAL DEFAULT 0,
            avg_purchase_rate REAL DEFAULT 0,
            avg_sale_rate REAL DEFAULT 0,
            labour_expenses REAL DEFAULT 0,
            fuel_expenses REAL DEFAULT 0,
            misc_expenses REAL DEFAULT 0,
            other_expenses REAL DEFAULT 0,
            gross_profit REAL DEFAULT 0,
            net_profit REAL DEFAULT 0,
            net_profit_margin REAL DEFAULT 0,
            closing_stock REAL DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `, (err) => {
          if (err && !err.message.includes('already exists')) reject(err);
        });

        db.run(`CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(date)`, (err) => {
          if (err) reject(err);
        });

        db.run(`CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_id)`, (err) => {
          if (err) reject(err);
        });

        db.run(`CREATE INDEX IF NOT EXISTS idx_purchases_date ON purchases(date)`, (err) => {
          if (err) reject(err);
        });

        db.run(`CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date)`, (err) => {
          if (err) reject(err);
        });

        db.run(`CREATE INDEX IF NOT EXISTS idx_inventory_date ON inventory(date)`, (err) => {
          if (err) reject(err);
        });

        setTimeout(resolve, 500);
      });
    });
  },

  run: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
      });
    });
  },

  get: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  all: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  },

  close: () => {
    return new Promise((resolve, reject) => {
      db.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
};

module.exports = dbAsync;
