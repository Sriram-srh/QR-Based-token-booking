
# Complete User Guide: Meal Token & QR System

## Table of Contents
1. [System Overview](#system-overview)
2. [Getting Started](#getting-started)
3. [Step-by-Step Instructions](#step-by-step-instructions)
4. [User Roles & Workflows](#user-roles--workflows)
5. [Troubleshooting](#troubleshooting)

---

## System Overview

This is a complete meal booking and token verification system with QR code generation and real-time scanning capabilities.

**Key Features:**
- ✅ Multi-role authentication (Student, Staff, Admin)
- ✅ Meal token generation with unique QR codes
- ✅ Real-time QR code scanning and verification
- ✅ Booking management and quotas
- ✅ Complete audit logging
- ✅ Dashboard analytics

**Technology Stack:**
- Frontend: Next.js 16, React, TypeScript
- Database: Supabase PostgreSQL
- Authentication: Custom JWT-based auth
- QR Codes: qrcode.js for generation, jsqr for detection

---

## Getting Started

### Prerequisites
- Node.js 18+ and pnpm
- Supabase account with project set up
- Environment variables configured

### Quick Setup (5 minutes)

```bash
# 1. Clone/Navigate to project
cd Frontend3

# 2. Install dependencies
pnpm install

# 3. Verify environment variables
# Check that these are set in your Supabase project dashboard:
# - SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - SUPABASE_SERVICE_ROLE_KEY

# 4. Start development server
pnpm dev

# 5. Open browser
# Visit: http://localhost:3000
```

**Database is already initialized!** All tables are created and sample data is seeded.

---

## Step-by-Step Instructions

### Phase 1: LOGIN

#### 1.1 - Access Login Page
```
1. Open http://localhost:3000 in your browser
2. You see 3 role options: Student, Staff, Admin
3. Select your role (we'll start with STUDENT)
4. Fill in credentials:
   - Email: student1@example.com
   - Password: password123
5. Click "Sign In"
```

**What happens:**
- System validates credentials against the database
- Creates a session in localStorage
- Redirects to student dashboard

---

### Phase 2: STUDENT WORKFLOW

#### 2.1 - Student Dashboard (After Login)
```
Location: /dashboard

You'll see:
- Welcome message with your name
- 4 main sections:
  a) Upcoming Bookings
  b) Available Meals
  c) My Tokens
  d) Notifications
```

#### 2.2 - View Upcoming Meals
```
Steps:
1. Scroll to "Upcoming Menus" section
2. See all available meals (Breakfast, Lunch, Dinner)
3. Check:
   - Meal date
   - Menu items (what's being served)
   - Booking status
   - Current quota (e.g., "12/30 booked")
```

#### 2.3 - Book a Token (IMPORTANT WORKFLOW)
```
Steps:
1. Click on a meal card
2. System opens meal details dialog
3. Shows:
   - All menu items available
   - Cost per item (e.g., ₹50, ₹75)
   - Total cost calculation
4. Select items you want (checkbox)
5. System auto-calculates total cost
6. Click "Book Token"
7. System generates:
   - Unique QR code (stored in DB)
   - Expiry time (7 days)
   - Token ID
8. See success message
9. Token appears in "My Tokens" section
```

**What's happening in the database:**
- New row in `meal_tokens` table
- QR code stored as text: `TOKEN:{timestamp}:{studentId}:{mealType}`
- Status: "VALID"
- Expiry date: 7 days from now

#### 2.4 - View Your Tokens
```
Steps:
1. Click "My Tokens" section
2. See all your active tokens:
   - Token ID
   - QR Code (displayed as image)
   - Meal type (Breakfast/Lunch/Dinner)
   - Status (VALID/USED/EXPIRED)
   - Expiry date
   - Total cost
3. For each token you can:
   - Download QR code image
   - Share with staff
   - View details
```

#### 2.5 - Use Your Token
```
On the day of meal:

1. Go to "My Tokens" section
2. Find the token for that meal
3. Show QR code to serving staff
4. Staff scans it with their device
5. System verifies:
   - Token is valid
   - Not expired
   - Not already used
   - Student has permission
6. Token status changes from "VALID" → "USED"
7. Serving staff confirms transaction
```

#### 2.6 - View Notifications
```
Steps:
1. Click "Notifications" tab
2. See alerts like:
   - "Token created successfully"
   - "Token expires in 2 days"
   - "Booking closed for Lunch"
3. Mark as read or delete
```

#### 2.7 - View Billing
```
Steps:
1. Click "Billing" section
2. See:
   - Total spent this month
   - All transactions
   - Upcoming charges
3. Download invoice if needed
```

#### 2.8 - Update Profile
```
Steps:
1. Click "Profile" in navigation
2. Edit:
   - Name
   - Email
   - Phone
   - Hostel/Room info
3. Upload photo
4. Click "Save Changes"
```

---

### Phase 3: STAFF WORKFLOW (Verification & Scanning)

#### 3.1 - Staff Login
```
Steps:
1. Go back to http://localhost:3000
2. Select "Staff" role
3. Enter credentials:
   - Email: staff1@example.com
   - Password: password123
4. Click "Sign In"
```

#### 3.2 - Staff Dashboard
```
Location: /dashboard

You'll see:
- Your assigned counter name
- Real-time token scanning interface
- Today's verification stats
- Pending tokens
```

#### 3.3 - Scan QR Codes (MAIN FUNCTION)
```
Steps:
1. Click "Scan Token" button
2. Grant camera permission (browser popup)
3. Camera opens showing live feed
4. Student shows QR code to camera
5. System automatically detects QR code
6. Verification happens instantly:
   - Checks if token is valid
   - Verifies not expired
   - Confirms not already used
   - Validates student info
7. Shows result:
   - ✅ Valid: "Token accepted - Enjoy your meal"
   - ❌ Invalid: "Token expired" or "Already used"
8. Click "Confirm" to mark token as USED
9. Serving can now complete transaction
```

**What happens in database when scanned:**
- Token status: VALID → USED
- `scanned_at`: Updated with current timestamp
- `counter_id`: Updated with staff's counter ID
- New audit log entry created

#### 3.4 - View Verification History
```
Steps:
1. Click "Verification History" tab
2. See all tokens scanned today:
   - Token ID
   - Student name
   - Meal type
   - Time scanned
   - Status
3. Search by student name or token ID
4. Filter by status (USED/PENDING/EXPIRED)
```

#### 3.5 - End of Day Report
```
Steps:
1. Click "Reports" section
2. See:
   - Total tokens scanned today: X
   - Total revenue: ₹XXXX
   - Popular items
   - Any issues/expired tokens
3. Generate and download PDF report
```

---

### Phase 4: ADMIN WORKFLOW

#### 4.1 - Admin Login
```
Steps:
1. Go back to http://localhost:3000
2. Select "Admin" role
3. Enter credentials:
   - Email: admin@example.com
   - Password: password123
4. Click "Sign In"
```

#### 4.2 - Admin Dashboard
```
Location: /dashboard

You see comprehensive analytics:
- Total tokens issued
- Total revenue
- Active students
- System health status
```

#### 4.3 - Manage Meals
```
Steps:
1. Click "Meal Management" section
2. You can:
   a) Create new meal
      - Select date
      - Choose type (Breakfast/Lunch/Dinner)
      - Set quota limit (max students)
      - Set booking open/close times
   
   b) Edit existing meal
      - Change quota
      - Close early if needed
      - View all bookings
   
   c) Delete meal (with warning)
```

#### 4.4 - Manage Menu Items
```
Steps:
1. Click "Menu Items" section
2. Create new item:
   - Name (e.g., "Biryani")
   - Cost (e.g., ₹75)
   - Max quantity per order
   - Set active/inactive
3. Edit existing items
4. View which meals use each item
```

#### 4.5 - Manage Counters
```
Steps:
1. Click "Counter Management"
2. View all serving counters:
   - Counter name
   - Assigned staff
   - Tokens served today
   - Status (Active/Inactive)
3. Add new counter:
   - Name
   - Assign staff member
   - Enable/disable
```

#### 4.6 - Manage Staff Accounts
```
Steps:
1. Click "Staff Accounts"
2. You can:
   a) Create new staff:
      - Name
      - Email
      - Employee number
      - Assign to counter
   
   b) Edit staff info
      - Change counter assignment
      - Update contact info
   
   c) Deactivate/activate staff
```

#### 4.7 - Manage Student Accounts
```
Steps:
1. Click "Student Accounts"
2. View all students:
   - Name
   - Register number
   - Hostel/Room
   - Active tokens
3. Can search and filter
4. View student history:
   - All bookings
   - Tokens used
   - Spending
5. Deactivate problematic students
```

#### 4.8 - View Analytics
```
Steps:
1. Click "Analytics" section
2. See comprehensive data:
   - Revenue charts (daily/weekly/monthly)
   - Popular meals/items
   - Usage by hostel
   - Peak booking times
   - Staff performance
3. Download analytics reports
4. Export data as CSV
```

#### 4.9 - View Audit Logs
```
Steps:
1. Click "Audit Logs"
2. See complete activity log:
   - Who did what (Student A booked meal X)
   - When (timestamp)
   - What changed
   - Status
3. Filter by:
   - Date range
   - User
   - Action type
   - Role
4. Use for security/debugging
```

#### 4.10 - System Settings
```
Steps:
1. Click "Settings" in admin panel
2. Configure:
   a) Token expiry duration (default: 7 days)
   b) Payment settings
   c) Quota defaults
   d) Notification preferences
   e) System-wide messaging
3. Click "Save Settings"
```

---

## User Roles & Workflows

### Student Role
| Task | Page | Steps | Result |
|------|------|-------|--------|
| Login | Login | Email + Password | Access dashboard |
| View meals | Dashboard | Click "Upcoming Menus" | See available meals |
| Book token | Meal Detail | Select items → Click Book | QR generated, token saved |
| View tokens | My Tokens | See all active tokens | Display QR codes |
| Use token | Counter | Show QR to staff | Token marked as USED |
| Check balance | Billing | View spending | See cost breakdown |

### Staff Role
| Task | Page | Steps | Result |
|------|------|-------|--------|
| Login | Login | Email + Password | Access counter interface |
| Scan QR | Scanner | Open camera → Scan | Verify token validity |
| Verify token | Scanner Result | Confirm valid | Mark USED in system |
| View history | Verification History | See scanned tokens | Audit trail |
| Generate report | Reports | Click Generate | PDF with stats |

### Admin Role
| Task | Page | Steps | Result |
|------|------|-------|--------|
| Create meal | Meal Mgmt | Fill form → Save | Available for booking |
| Set quota | Meal Detail | Update limit → Save | Restricts bookings |
| Add staff | Staff Accounts | Create new user | Can login as staff |
| View analytics | Analytics | Select date range | See usage data |
| Manage items | Menu Items | Create/Edit | Used in meals |
| Audit system | Audit Logs | View activity | Track all changes |

---

## Troubleshooting

### Login Issues

**Problem: "Invalid email or password"**
```
Solution:
1. Verify email is correct
2. Check password (case-sensitive)
3. Ensure user exists in database
4. Try one of the test accounts:
   - student1@example.com / password123
   - staff1@example.com / password123
   - admin@example.com / password123
```

**Problem: "Cannot connect to database"**
```
Solution:
1. Check Supabase URL in environment
2. Verify API keys are set
3. Check internet connection
4. Try: pnpm dev (restart dev server)
```

### QR Code Issues

**Problem: "Camera not working"**
```
Solution:
1. Grant camera permission when popup appears
2. Check no other app is using camera
3. Ensure HTTPS or localhost (QR requires secure context)
4. Try different browser (Chrome/Firefox)
5. Check browser console for errors
```

**Problem: "QR code not detected"**
```
Solution:
1. Ensure good lighting
2. Hold QR code steady in frame
3. QR code should be ~10-20cm from camera
4. Try moving camera closer
5. Verify QR code image quality
```

**Problem: "Token not scanning"**
```
Solution:
1. Check token is VALID (not expired/used)
2. Ensure QR code hasn't been rotated
3. Try clicking "Refresh" in scanner
4. Check if token already scanned
5. View token details in admin panel
```

### Database Issues

**Problem: "No tables found"**
```
Solution:
1. Execute: /scripts/01-init-database.sql
2. Wait for Supabase to process
3. Refresh page
```

**Problem: "No test data"**
```
Solution:
1. Execute: /scripts/02-seed-data.sql
2. Test accounts will appear
```

---

## API Reference (For Developers)

### Authentication API
```
POST /api/auth/login
Body: {
  email: "student1@example.com",
  password: "password123",
  userType: "student" | "staff" | "admin"
}
Response: {
  user: {
    id: "uuid",
    email: "string",
    name: "string",
    userType: "student"
  }
}
```

### Token Management API
```
GET /api/tokens
Response: Array of tokens for logged-in student

POST /api/tokens
Body: {
  mealType: "Breakfast",
  items: [{ menuItemId: "uuid", quantity: 1 }]
}
Response: {
  tokenId: "uuid",
  qrCode: "TOKEN:...",
  expiresAt: "2024-03-31T..."
}
```

### Verification API
```
POST /api/verify
Body: { qrCode: "TOKEN:..." }
Response: {
  valid: true,
  student: { name, id },
  mealType: "Lunch",
  message: "Token verified"
}
```

### QR Generation API
```
POST /api/qr/generate
Body: { tokenId: "uuid" }
Response: {
  qrCode: "data:image/png;base64,..."
}
```

---

## Quick Reference

### Important Files
- `lib/auth-context.tsx` - Authentication logic
- `lib/db-service.ts` - Database operations
- `lib/qr-utils.ts` - QR code utilities
- `components/qr/qr-scanner.tsx` - QR scanner component
- `components/qr/qr-generator.tsx` - QR generation

### Important Routes
- `/` - Login
- `/dashboard` - Main dashboard
- `/api/auth/login` - Login endpoint
- `/api/tokens` - Token management
- `/api/verify` - Token verification

### Test Credentials
```
Student:
  Email: student1@example.com
  Password: password123

Staff:
  Email: staff1@example.com
  Password: password123

Admin:
  Email: admin@example.com
  Password: password123
```

### Database Tables
- `users` - All system users
- `students` - Student profiles
- `staff` - Staff profiles
- `meals` - Available meals
- `menu_items` - Meal options
- `meal_tokens` - Generated tokens
- `counters` - Serving stations
- `audit_logs` - Activity tracking

---

## Support & Help

If you encounter issues:

1. Check console for errors: F12 → Console tab
2. Review Supabase dashboard for database status
3. Verify all environment variables are set
4. Check if all SQL scripts have been executed
5. Restart dev server: Ctrl+C then pnpm dev

For more technical details, see:
- `DATABASE_SETUP.md` - Database configuration
- `IMPLEMENTATION_SUMMARY.md` - Full feature list
- `COMMANDS_REFERENCE.md` - All available commands
