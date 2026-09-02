# Setup & Deployment Guide - Jai Hind Poultry

## Local Development Setup

### 1. Prerequisites Check
```bash
node --version  # Should be 14 or higher
npm --version   # Should be 6 or higher
```

### 2. Clone and Install
```bash
cd Jaihind-Poultry
npm install
cd client && npm install && cd ..
```

### 3. Running Locally

**Option A: Development Mode (both services with auto-reload)**
```bash
npm run dev
```
- Backend: http://localhost:5000
- Frontend: http://localhost:3000

**Option B: Manual Separate Terminals**

Terminal 1 - Backend:
```bash
npm run server:dev
```

Terminal 2 - Frontend:
```bash
cd client
npm start
```

### 4. Initial Configuration
1. Open http://localhost:3000
2. Setup screen will appear
3. Enter business name (e.g., "Jai Hind Poultry")
4. Create 4-6 digit PIN (e.g., 1234)
5. Confirm PIN
6. Click "Setup Business"

### 5. First Login
- PIN: (the one you created above)
- You'll see the Dashboard

## Production Deployment

### Build for Production
```bash
npm run build
```
This creates:
- `/client/build` - Static frontend files
- Backend ready on port 5000

### Deploy Options

#### Option 1: Docker (Recommended)
Create `Dockerfile`:
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t jai-hind-poultry .
docker run -p 5000:5000 jai-hind-poultry
```

#### Option 2: Node Server (Heroku, Railway, etc.)
```bash
npm install --production
npm start
```

#### Option 3: Split Deployment
- Frontend: Deploy `/client/build` to Vercel/Netlify
- Backend: Deploy to Heroku/Railway/AWS
- Update API URL in frontend config

### Environment Variables
Create `.env` file if needed:
```
PORT=5000
NODE_ENV=production
DB_PATH=./poultry.db
```

## Database Backup

### Backup SQLite Database
```bash
# Stop the application
# Copy the database file
cp poultry.db backups/poultry_$(date +%Y%m%d_%H%M%S).db
```

### Restore from Backup
```bash
# Stop the application
# Restore the database
cp backups/poultry_backup.db poultry.db
# Start the application
```

## Troubleshooting

### Port 5000 Already in Use
```bash
# Find process using port 5000
lsof -i :5000
# Kill process
kill -9 <PID>
```

### Port 3000 Already in Use (React)
```bash
# Use different port
PORT=3001 npm start
```

### Database Locked
- Ensure only one instance is running
- Delete `poultry.db-journal` file if it exists

### API Connection Error
- Verify backend is running: http://localhost:5000
- Check CORS settings in server.js
- Verify API URL in React config

### Installation Issues
```bash
# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## Performance Optimization

### Production Checklist
- [ ] Use `npm run build` for frontend
- [ ] Set NODE_ENV=production
- [ ] Enable gzip compression in Express
- [ ] Use database connection pooling
- [ ] Add API rate limiting
- [ ] Enable HTTPS
- [ ] Add authentication headers

### Database Optimization
```sql
-- Check existing indexes
PRAGMA index_list(sales);

-- Add indexes if missing
CREATE INDEX idx_sales_date ON sales(date);
CREATE INDEX idx_sales_customer ON sales(customer_id);
CREATE INDEX idx_purchases_date ON purchases(date);
CREATE INDEX idx_expenses_date ON expenses(date);
```

## Monitoring

### Check Application Health
```bash
# Backend health check
curl http://localhost:5000/api/auth/check-setup

# View database size
ls -lh poultry.db
```

### Logs
- Backend logs appear in terminal
- Frontend logs in browser console (F12)
- Database errors written to SQLite error log

## Backup Strategy

### Daily Backups
```bash
#!/bin/bash
# backup.sh - Run daily via cron
DATE=$(date +%Y%m%d_%H%M%S)
cp /path/to/poultry.db /backups/poultry_$DATE.db
```

### Weekly Full Backup
```bash
# Include code + database + config
tar -czf backup_$(date +%Y%m%d).tar.gz \
  poultry.db \
  routes/ \
  client/src/ \
  .env
```

## Scaling Considerations

### Multiple Shops
- Add `shop_id` to all tables
- Modify queries to filter by shop
- Update authentication to store shop context

### Multi-User Support
- Add `user_id` to relevant tables
- Implement role-based access control (RBAC)
- Add audit logging

### API Rate Limiting
```javascript
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);
```

## Security Hardening

### Enable HTTPS
```javascript
const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('path/to/key.pem'),
  cert: fs.readFileSync('path/to/cert.pem')
};

https.createServer(options, app).listen(5000);
```

### Input Validation
All routes use validation, but add more if extending:
```javascript
const { body, validationResult } = require('express-validator');

app.post('/api/sales', [
  body('weight').isFloat({ min: 0 }),
  body('rate').isFloat({ min: 0 }),
  body('customer_name').notEmpty()
], handleRequest);
```

### SQL Injection Prevention
- All queries use parameterized statements ✓
- Never concatenate user input in SQL queries ✓

## Mobile Installation

### Progressive Web App (PWA)
1. Add manifest.json to `client/public/`
2. Register service worker
3. Users can "Install" from browser menu

### Android APK
Use tools like:
- React Native + Expo
- Apache Cordova
- Capacitor

## Support & Maintenance

### Version Updates
- Backup database before updates
- Test in development first
- Keep Node.js updated

### Common Updates
```bash
# Update dependencies
npm update

# Security audit
npm audit
npm audit fix
```

### Reporting Issues
- Check logs: `tail -f /var/log/app.log`
- Review database integrity
- Verify recent changes

---

**Last Updated**: Version 1.0.0
Ready for production deployment
