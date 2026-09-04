const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Database path configuration
// Priority: DATABASE_PATH env var > HOME-based persistent path > current directory
const getDatabasePath = () => {
  // 1. Check if DATABASE_PATH environment variable is set (for Hostinger production)
  if (process.env.DATABASE_PATH) {
    const envPath = process.env.DATABASE_PATH;
    const dir = path.dirname(envPath);

    // Ensure directory exists
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    return envPath;
  }

  // 2. For production without explicit env var: try HOME/.poultry_db (persistent Hostinger path)
  if (process.env.NODE_ENV === 'production' && process.env.HOME) {
    const persistentDir = path.join(process.env.HOME, '.poultry_app_data');
    if (!fs.existsSync(persistentDir)) {
      fs.mkdirSync(persistentDir, { recursive: true });
    }
    return path.join(persistentDir, 'poultry.db');
  }

  // 3. Default: use current directory (for local development)
  return path.join(__dirname, 'poultry.db');
};

const dbPath = getDatabasePath();

console.log('\n=== DATABASE CONFIGURATION ===');
console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('Database Path:', dbPath);
console.log('Database Exists:', fs.existsSync(dbPath));
if (fs.existsSync(dbPath)) {
  const stats = fs.statSync(dbPath);
  console.log('Database Size:', stats.size, 'bytes');
  console.log('Last Modified:', stats.mtime);
}
console.log('==============================\n');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error('Error opening database:', err);
  else console.log('✓ Connected to SQLite database at:', dbPath);
});

const dbAsync = {
  initialize: async () => {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        // Users table (updated schema with role support)
        db.run(`
          CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            business_id TEXT NOT NULL DEFAULT 'default',
            username TEXT,
            name TEXT,
            password TEXT,
            pin TEXT,
            role TEXT DEFAULT 'ADMIN',
            active INTEGER DEFAULT 1,
            business_name TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `, (err) => {
          if (err && !err.message.includes('already exists')) reject(err);
        });

        // Add new columns to existing users table if it doesn't have them
        db.all(`PRAGMA table_info(users)`, (err, columns) => {
          if (!err && columns) {
            const columnNames = columns.map(c => c.name);

            // Add business_id column
            if (!columnNames.includes('business_id')) {
              db.run(`ALTER TABLE users ADD COLUMN business_id TEXT NOT NULL DEFAULT 'default'`, (err) => {
                if (!err) console.log('Added business_id column to users table');
              });
            }

            // Add username column
            if (!columnNames.includes('username')) {
              db.run(`ALTER TABLE users ADD COLUMN username TEXT`, (err) => {
                if (err) {
                  console.error('Error adding username column:', err.message);
                } else {
                  console.log('Added username column to users table');
                }
              });
            }

            // Add name column
            if (!columnNames.includes('name')) {
              db.run(`ALTER TABLE users ADD COLUMN name TEXT`, (err) => {
                if (!err) console.log('Added name column to users table');
              });
            }

            // Add password column
            if (!columnNames.includes('password')) {
              db.run(`ALTER TABLE users ADD COLUMN password TEXT`, (err) => {
                if (!err) console.log('Added password column to users table');
              });
            }

            // Add role column
            if (!columnNames.includes('role')) {
              db.run(`ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'ADMIN'`, (err) => {
                if (!err) console.log('Added role column to users table');
              });
            }

            // Add active column
            if (!columnNames.includes('active')) {
              db.run(`ALTER TABLE users ADD COLUMN active INTEGER DEFAULT 1`, (err) => {
                if (!err) console.log('Added active column to users table');
              });
            }

            // Add updated_at column
            if (!columnNames.includes('updated_at')) {
              db.run(`ALTER TABLE users ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP`, (err) => {
                if (!err) console.log('Added updated_at column to users table');
              });
            }
          }
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

        // Business details table
        db.run(`
          CREATE TABLE IF NOT EXISTS business_details (
            id TEXT PRIMARY KEY,
            business_name TEXT,
            contact_number TEXT,
            alternate_contact TEXT,
            address TEXT,
            gst_number TEXT,
            email TEXT,
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

// Export database module with path information
module.exports = {
  ...dbAsync,
  dbPath,
  getDatabasePath
};
