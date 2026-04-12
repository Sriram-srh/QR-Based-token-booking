# Command Reference & Step-by-Step Guide

## 📋 Complete Setup Commands

### Step 1: Initial Setup
```bash
# Install dependencies
pnpm install

# Copy environment template
cp .env.example .env.local

# Edit environment file with your Supabase credentials
nano .env.local
# or
code .env.local
```

### Step 2: Database Setup
**Execute BOTH in Supabase SQL Editor in this order:**

1. **Create Database Schema**
   ```sql
   -- Paste entire content of scripts/01-init-database.sql
   -- This creates all 8 tables with relationships
   ```

2. **Seed Sample Data**
   ```sql
   -- Paste entire content of scripts/02-seed-data.sql
   -- This adds test students, staff, meals, etc.
   ```

### Step 3: Start Development
```bash
# Start development server
pnpm dev

# Application will be at http://localhost:3000
```

---

## 🧪 Testing Commands

### Login with Test Credentials
```
Role: Student
Email: student1@example.com
Password: password123

OR

Role: Staff
Email: staff1@example.com
Password: password123
```

### Test API Endpoints Directly

**Test Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student1@example.com",
    "password": "password123",
    "userType": "student"
  }'
```

**Create Token:**
```bash
curl -X POST http://localhost:3000/api/tokens \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "STUDENT_UUID_FROM_DB",
    "mealType": "Lunch",
    "totalCost": 80
  }'
```

**Verify Token:**
```bash
curl -X POST http://localhost:3000/api/verify \
  -H "Content-Type: application/json" \
  -d '{
    "qrCode": "TOKEN:1234567890:student-id:Lunch",
    "counterId": "COUNTER_UUID_FROM_DB"
  }'
```

---

## 📁 Key File Locations

### Database Files
```
scripts/01-init-database.sql     ← Run FIRST in Supabase
scripts/02-seed-data.sql         ← Run SECOND in Supabase
scripts/00-rls-policies.sql      ← Optional, for production
```

### Configuration
```
.env.example                     ← Copy to .env.local
.env.local                       ← Add your Supabase keys
```

### API Routes
```
app/api/auth/login/route.ts
app/api/tokens/route.ts
app/api/qr/generate/route.ts
app/api/qr/scan/route.ts
app/api/verify/route.ts
```

### Components
```
components/qr/qr-generator.tsx
components/qr/qr-scanner.tsx
components/qr/qr-test.tsx
components/login-page.tsx
```

### Utilities
```
lib/auth-context.tsx
lib/qr-utils.ts
lib/db-service.ts
lib/test-data.ts
```

### Hooks
```
hooks/use-tokens.ts
hooks/use-verify.ts
```

### Documentation
```
DATABASE_SETUP.md
QUICKSTART.md
IMPLEMENTATION_SUMMARY.md
VERIFICATION_CHECKLIST.md
COMPLETED_IMPLEMENTATION.md
COMMANDS_REFERENCE.md           ← This file
```

---

## 🔧 Development Commands

### Start Development Server
```bash
pnpm dev
```

### Build for Production
```bash
pnpm build
```

### Start Production Server
```bash
pnpm start
```

### Run Linting
```bash
pnpm lint
```

### Database Operations (Reference)
```bash
# These are documentation references - execute SQL in Supabase directly
pnpm run db:init    # Shows where to run 01-init-database.sql
pnpm run db:seed    # Shows where to run 02-seed-data.sql
pnpm run db:rls     # Shows where to run 00-rls-policies.sql
```

---

## 🔐 Environment Variables Required

### Create `.env.local`:
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Application Configuration
NEXT_PUBLIC_APP_NAME=Meal Token System
NODE_ENV=development
```

### Where to Find These Values:
1. Go to https://supabase.com
2. Select your project
3. Go to Settings → API
4. Copy:
   - `Project URL` → NEXT_PUBLIC_SUPABASE_URL
   - `anon public` key → NEXT_PUBLIC_SUPABASE_ANON_KEY
   - `service_role` key → SUPABASE_SERVICE_ROLE_KEY

---

## 📊 Database Query Examples

### View All Students (in Supabase SQL Editor)
```sql
SELECT * FROM students;
```

### View All Meal Tokens
```sql
SELECT * FROM meal_tokens;
```

### View Audit Logs
```sql
SELECT * FROM audit_logs ORDER BY created_at DESC;
```

### Find Tokens for a Student
```sql
SELECT * FROM meal_tokens 
WHERE student_id = 'STUDENT_UUID'
ORDER BY created_at DESC;
```

### Check Token Status
```sql
SELECT id, qr_code, status, expires_at, scanned_at
FROM meal_tokens
WHERE qr_code = 'TOKEN:xxx:xxx:Lunch';
```

---

## 🐛 Debugging Commands

### Check Browser Console
```javascript
// These will show if everything is loading correctly
console.log('[v0] Application started');
console.log('[v0] Auth context:', useAuth());
```

### Check Network Tab
1. Open DevTools (F12)
2. Go to Network tab
3. Perform login
4. Look for `/api/auth/login` request
5. Check response for errors

### Check Supabase Logs
1. Go to Supabase dashboard
2. Select your project
3. Go to Logs → SQL
4. See recent database queries

---

## ✅ Verification Steps

### 1. Database Connected
```bash
# Check in Supabase Dashboard
# Tables → See 8 tables listed:
# - users
# - students
# - staff
# - meals
# - meal_items
# - meal_tokens
# - counters
# - audit_logs
```

### 2. Sample Data Exists
```bash
# Execute in Supabase SQL Editor:
SELECT COUNT(*) FROM users;      -- Should be 6
SELECT COUNT(*) FROM students;   -- Should be 3
SELECT COUNT(*) FROM staff;      -- Should be 2
SELECT COUNT(*) FROM meals;      -- Should be 3
```

### 3. Application Starts
```bash
pnpm dev
# Should see: ▲ Next.js 15.x
# Should see: - Local: http://localhost:3000
```

### 4. Login Works
```bash
# Visit http://localhost:3000
# Use: student1@example.com / password123
# Should see: Student dashboard
```

### 5. Create Token Works
```bash
# Click "Book Token"
# Select meal type
# Should see: QR code generated
```

### 6. Scan Works
```bash
# Login as staff: staff1@example.com / password123
# Go to verification
# Allow camera
# Point at QR code
# Should see: Token verified message
```

---

## 🚀 Deployment Commands

### Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Or push to GitHub, link to Vercel for auto-deployment
git push origin main
```

### Check Deployment Status
```bash
# Vercel CLI
vercel --prod

# Or visit your Vercel dashboard
# https://vercel.com/dashboard
```

---

## 🔄 Common Workflows

### Add New Student (Manual)

1. **In Supabase SQL Editor:**
```sql
-- Create user
INSERT INTO users (email, password_hash, name, user_type)
VALUES ('newstudent@example.com', '$2a$10$...hashedpassword...', 'Student Name', 'student')
RETURNING id;

-- Copy the returned id and use it below

-- Create student profile
INSERT INTO students (user_id, roll_number, batch_year, hostel_name, balance)
VALUES ('user-uuid-here', 'ROLL12345', 2024, 'Hostel A', 1000);
```

### Create Meal Token (via UI)
1. Login as student
2. Click "Book Token"
3. Select meal type
4. Click "Create Token"
5. QR code appears immediately

### Verify Token (via Camera)
1. Login as staff
2. Click "Verification" or "Scan"
3. Allow camera
4. Point at QR code
5. Token automatically verified

---

## 📱 Mobile Testing

### Test on Mobile Device
```bash
# Get your computer's IP
ipconfig getifaddr en0  # macOS
ipconfig               # Windows

# Run dev server with accessible host
pnpm dev --host

# Visit from mobile:
http://YOUR_IP:3000
```

### Test Camera on Mobile
1. Login as staff on mobile
2. Go to verification screen
3. Tap "Start Camera"
4. Point camera at QR
5. Should scan automatically

---

## 🔍 Logging & Debugging

### Enable Debug Logging
Add to any component:
```javascript
console.log('[v0] Message here:', data)
```

### View Audit Logs
```sql
-- In Supabase SQL Editor
SELECT * FROM audit_logs 
ORDER BY created_at DESC 
LIMIT 10;
```

### Check Token Status
```sql
SELECT 
  id,
  qr_code,
  status,
  created_at,
  expires_at,
  scanned_at
FROM meal_tokens
ORDER BY created_at DESC;
```

---

## 📈 Performance Testing

### Test QR Generation Speed
```bash
# Create multiple tokens and measure time
# Check browser Network tab → /api/tokens
# Should complete in <500ms
```

### Test QR Scanning Speed
```bash
# Open verification screen
# Scan multiple QR codes
# Check browser Network tab → /api/verify
# Should complete in <300ms per scan
```

---

## 🔐 Security Checklist

### Before Production:
```bash
# 1. Set proper environment variables
# ✓ All keys in .env.local

# 2. Run RLS policies
# ✓ Execute 00-rls-policies.sql in Supabase

# 3. Enable HTTPS
# ✓ Use Vercel auto-HTTPS or configure manually

# 4. Update password hashing
# ✓ Currently using bcryptjs with default rounds

# 5. Configure CORS
# ✓ Add your domain to Supabase allowed origins

# 6. Set up backups
# ✓ Enable automated backups in Supabase

# 7. Monitor logs
# ✓ Set up log monitoring/alerting
```

---

## 📞 Quick Reference Card

| Task | Command |
|------|---------|
| Install dependencies | `pnpm install` |
| Start dev server | `pnpm dev` |
| Build for production | `pnpm build` |
| View in browser | `http://localhost:3000` |
| Run linting | `pnpm lint` |
| Create .env.local | `cp .env.example .env.local` |
| Setup database | Execute `.sql` files in Supabase |
| Test login | Use `student1@example.com` / `password123` |
| Check database | Go to Supabase → Tables |
| View logs | Supabase → Logs → SQL |
| Deploy | `vercel` or push to GitHub |

---

## ✨ You're All Set!

Run these commands in order:

```bash
# 1. Setup
cp .env.example .env.local
pnpm install

# 2. Add Supabase credentials to .env.local

# 3. Create database (in Supabase SQL Editor):
# - Execute scripts/01-init-database.sql
# - Execute scripts/02-seed-data.sql

# 4. Start
pnpm dev

# 5. Test
# - Visit http://localhost:3000
# - Login: student1@example.com / password123
# - Create token
# - Switch to staff and scan

**Done! System is ready to use! 🎉**
