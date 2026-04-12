
# Quick Reference Card - Meal Token System

## 🚀 START HERE (60 Seconds)

```bash
# 1. Install & Start
pnpm install
pnpm dev

# 2. Open browser
http://localhost:3000

# 3. Login with test account
Email: student1@example.com
Password: password123
Role: Student
```

---

## 👥 Test Accounts (Pre-Loaded in Database)

### Student Account
```
Email:    student1@example.com
Password: password123
Role:     Student
ID:       std-001
Hostel:   Hostel A, Room 101
```

### Staff Account
```
Email:    staff1@example.com
Password: password123
Role:     Staff
ID:       stf-001
Counter:  Counter A (Lunch)
```

### Admin Account
```
Email:    admin@example.com
Password: admin123
Role:     Admin
ID:       adm-001
```

---

## 🎯 Key Features (What You Can Do)

### As a Student:
- ✅ Login with email/password
- ✅ View available meals (Breakfast/Lunch/Dinner)
- ✅ Book tokens by selecting items
- ✅ Receive unique QR code automatically
- ✅ View all your tokens with QR codes
- ✅ Show QR to staff at counter
- ✅ See notification when token used
- ✅ View billing/spending

### As a Staff Member:
- ✅ Login with email/password
- ✅ Open camera-based QR scanner
- ✅ Scan student's QR code automatically
- ✅ Verify token is valid (1-click process)
- ✅ See student name and meal type
- ✅ Mark token as USED
- ✅ View daily scanning history
- ✅ Generate end-of-day reports

### As Admin:
- ✅ Create/manage meals
- ✅ Create menu items
- ✅ Manage staff & counters
- ✅ Manage student accounts
- ✅ View detailed analytics
- ✅ View complete audit logs
- ✅ Generate revenue reports
- ✅ System configuration

---

## 📱 Main Pages/Flows

### Student Flow:
```
Login 
  ↓
Dashboard (see available meals)
  ↓
Click Meal Card
  ↓
Select Items + Click "Book"
  ↓
QR Code Generated ✓
  ↓
My Tokens (see QR code)
  ↓
Show to Staff at Counter
  ↓
Staff Scans → Token Used ✓
```

### Staff Flow:
```
Login
  ↓
Counter Dashboard
  ↓
Click "Scan Token"
  ↓
Camera Opens
  ↓
Student Shows QR
  ↓
Auto Detected & Verified ✓
  ↓
Click "Confirm"
  ↓
Token Marked as USED ✓
```

### Admin Flow:
```
Login
  ↓
Admin Dashboard (Analytics)
  ↓
Create Meal / Manage Items / View Logs
  ↓
Make changes
  ↓
View Reports
```

---

## 🔧 Important Files for Developers

```
Core Logic:
  lib/auth-context.tsx        ← Authentication
  lib/db-service.ts           ← Database operations
  lib/qr-utils.ts             ← QR generation/parsing

API Routes:
  app/api/auth/login          ← Login endpoint
  app/api/tokens              ← Token CRUD
  app/api/verify              ← QR verification
  app/api/qr/generate         ← QR generation
  app/api/qr/scan             ← QR scanning

Components:
  components/qr/qr-generator.tsx   ← QR display
  components/qr/qr-scanner.tsx     ← QR scanning
  components/login-page.tsx        ← Login UI

Database:
  scripts/01-init-database.sql     ← Schema
  scripts/02-seed-data.sql         ← Sample data
```

---

## 📊 Database Tables (Summary)

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `users` | All system users | id, email, password_hash, role |
| `students` | Student info | id, user_id, register_number, hostel |
| `staff` | Staff info | id, user_id, assigned_counter_id |
| `meals` | Available meals | id, type, date, quota, is_open |
| `menu_items` | Food items | id, name, cost, is_active |
| `meal_tokens` | Generated QR tokens | id, student_id, qr_code, status |
| `counters` | Serving stations | id, name, assigned_staff_id |
| `audit_logs` | Activity tracking | id, user_id, action, timestamp |

---

## 🔐 Authentication Flow

```
User enters email + password
         ↓
Backend checks database (users table)
         ↓
Verify password hash (bcryptjs)
         ↓
Generate JWT token
         ↓
Store user info in localStorage
         ↓
Redirect to dashboard ✓
         ↓
API calls include JWT in header
         ↓
Logged in until logout or token expires
```

---

## 🎫 QR Code Format

```
Format: TOKEN:{timestamp}:{studentId}:{mealType}

Example:
TOKEN:1711270800:std-001:Lunch

Breakdown:
  TOKEN        → Always starts with "TOKEN"
  1711270800   → Unix timestamp (when created)
  std-001      → Student ID
  Lunch        → Meal type (Breakfast/Lunch/Dinner)

Storage:
  1. As text string in database
  2. As PNG base64 image (for display)
  3. Can be encoded in QR code
```

---

## 📝 Common Tasks (How-To)

### Create a Meal (Admin)
```
1. Login as admin
2. Click "Meal Management"
3. Click "Create New Meal"
4. Select type: Lunch
5. Pick date: Tomorrow
6. Set quota: 50 students
7. Set booking times
8. Click "Create"
→ Now students can book!
```

### Book a Token (Student)
```
1. Login as student
2. Click "Upcoming Menus"
3. See "Lunch - Tomorrow"
4. Click the meal card
5. Dialog opens showing items:
   - Samosa (₹20) - select
   - Biryani (₹75) - select
   - Dessert (₹25) - select
6. Total shows: ₹120
7. Click "Book Token"
→ QR code generated! Shows in "My Tokens"
```

### Verify a Token (Staff)
```
1. Login as staff
2. Student arrives with QR code
3. Click "Scan Token"
4. Grant camera permission
5. Point camera at QR code
6. System auto-detects (no manual input!)
7. Shows: "Valid ✓" with student name
8. Click "Confirm"
→ Token marked as USED, staff can serve meal
```

### View Analytics (Admin)
```
1. Login as admin
2. Click "Analytics"
3. See charts:
   - Daily revenue (line)
   - Popular items (bar)
   - Meal breakdown (pie)
4. Download PDF report
→ Can share with hostel management
```

---

## 🐛 Quick Troubleshooting

### Issue: Can't login
```
Solution:
✓ Check email spelling
✓ Check password (case-sensitive)
✓ Try: student1@example.com / password123
✓ Verify database connected (check console)
```

### Issue: QR camera not working
```
Solution:
✓ Grant camera permission (allow popup)
✓ Check no other app using camera
✓ Try different browser
✓ Restart dev server: pnpm dev
```

### Issue: QR not detected
```
Solution:
✓ Better lighting needed
✓ Hold QR steady, 10-20cm from camera
✓ Try clicking "Refresh"
✓ Check QR code image quality
✓ Try scanning in landscape mode
```

### Issue: No test data in database
```
Solution:
✓ Execute: /scripts/02-seed-data.sql in Supabase
✓ Refresh page
✓ Login with test accounts
```

---

## 📞 Support Reference

### Environment Variables
```
SUPABASE_URL              ← Database URL
NEXT_PUBLIC_SUPABASE_ANON_KEY  ← Public key
SUPABASE_SERVICE_ROLE_KEY      ← Server key
```

### Important URLs
```
http://localhost:3000     ← Main app
Supabase Dashboard        ← Database admin
Console F12              ← Browser errors
```

### Database Errors?
```
1. Check Supabase dashboard
2. Run: /scripts/01-init-database.sql
3. Run: /scripts/02-seed-data.sql
4. Restart dev server
```

---

## 🎓 Learning Path

**New to the system?**
1. Read: This file (you are here!)
2. Login as student → Book meal → View QR
3. Login as staff → Scan QR code
4. Login as admin → Create meal
5. Read: COMPLETE_USER_GUIDE.md (detailed)
6. Read: WORKFLOW_DIAGRAM.md (visual flows)

**Want to modify code?**
1. Understand: lib/db-service.ts
2. Understand: lib/qr-utils.ts
3. Check: app/api/ routes
4. Modify components as needed
5. Test with different roles

**Want to deploy?**
1. Set environment variables in Vercel
2. Push to GitHub
3. Deploy via Vercel dashboard
4. Verify database connection

---

## ⚡ Performance Tips

- QR scanning is instant (jsqr optimized)
- Database queries are indexed
- API responses cached where possible
- Images lazy-loaded
- Use chrome for best QR detection

---

## 📚 Documentation Map

| File | Purpose | Read Time |
|------|---------|----------|
| QUICK_REFERENCE.md | This file | 5 min |
| COMPLETE_USER_GUIDE.md | Step-by-step everything | 30 min |
| WORKFLOW_DIAGRAM.md | Visual flows with examples | 20 min |
| DATABASE_SETUP.md | Technical database info | 15 min |
| IMPLEMENTATION_SUMMARY.md | Feature checklist | 10 min |

---

**You're all set! 🎉**

Start by opening http://localhost:3000 and logging in with:
- Email: student1@example.com
- Password: password123
