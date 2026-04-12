
# System Workflow Diagrams

## 1. STUDENT WORKFLOW - BOOKING AND USING TOKENS

```
┌─────────────────────────────────────────────────────────────┐
│                    STUDENT FLOW                             │
└─────────────────────────────────────────────────────────────┘

LOGIN
  ↓
  └─ Email: student1@example.com
  └─ Password: password123
  └─ Role: Student
  ↓
STUDENT DASHBOARD
  ├─ Upcoming Bookings
  ├─ Available Meals
  ├─ My Tokens
  └─ Notifications
  ↓
VIEW UPCOMING MENUS
  ├─ See Breakfast (Tomorrow, 8:00 AM)
  ├─ See Lunch (Tomorrow, 1:00 PM)
  ├─ See Dinner (Tomorrow, 7:00 PM)
  └─ Check quota: "15/30 booked"
  ↓
CLICK ON MEAL
  ├─ View menu items
  │  ├─ Samosa (₹20)
  │  ├─ Biryani (₹75)
  │  └─ Dessert (₹25)
  ├─ Select items (checkboxes)
  └─ See total: ₹120
  ↓
CLICK "BOOK TOKEN"
  ├─ System generates unique QR code
  │  └─ TOKEN:1711270800:std-001:Lunch
  ├─ Stores in database
  ├─ Sets expiry: 7 days
  └─ Status: VALID
  ↓
SUCCESS MESSAGE ✓
  └─ "Token created! Token ID: abc-123"
  ↓
TOKEN APPEARS IN "MY TOKENS"
  ├─ Token ID: abc-123
  ├─ Meal Type: Lunch
  ├─ Status: VALID (green)
  ├─ Expires: 31-Mar-2024
  ├─ Total Cost: ₹120
  └─ QR Code: [VISIBLE IMAGE]
  ↓
ON MEAL DAY - GO TO COUNTER
  ├─ Open "My Tokens"
  ├─ Find token for that meal
  └─ Show QR code to staff
  ↓
STAFF SCANS QR CODE
  ├─ Opens camera
  ├─ Detects QR automatically
  └─ Verifies token:
     ├─ Check if VALID
     ├─ Check if not expired
     └─ Check if not already used
  ↓
VERIFICATION RESULT
  ├─ ✓ VALID: Green message "Token accepted"
  └─ ✗ INVALID: Red message with reason
  ↓
STAFF CONFIRMS (if valid)
  ├─ Token status: VALID → USED
  ├─ Update timestamp
  └─ Log in audit
  ↓
STUDENT CAN GET MEAL ✓

```

---

## 2. STAFF WORKFLOW - SCANNING AND VERIFICATION

```
┌─────────────────────────────────────────────────────────────┐
│                    STAFF FLOW                               │
└─────────────────────────────────────────────────────────────┘

LOGIN
  ↓
  └─ Email: staff1@example.com
  └─ Password: password123
  └─ Role: Staff
  ↓
STAFF DASHBOARD
  ├─ Assigned Counter: Counter-A (Lunch)
  ├─ Tokens Served Today: 15
  └─ System Status: Active
  ↓
WAIT FOR STUDENT AT COUNTER
  ├─ Student arrives
  └─ Shows QR code
  ↓
CLICK "SCAN TOKEN" BUTTON
  ├─ Camera permission popup
  ├─ Grant permission
  └─ Camera opens (live feed)
  ↓
STUDENT POSITIONS QR CODE
  ├─ Hold steady in frame
  ├─ Camera focuses
  └─ 5-10cm distance optimal
  ↓
SYSTEM AUTO-DETECTS QR
  └─ NO manual input needed!
     ├─ Extracts: TOKEN:1711270800:std-001:Lunch
     ├─ Parses student ID
     ├─ Identifies meal type
     └─ Checks timestamp
  ↓
VERIFICATION CHECKS
  ├─ Is token in database? ✓
  ├─ Is status VALID? ✓
  ├─ Is NOT expired? ✓
  ├─ Has NOT been used? ✓
  └─ Student match? ✓
  ↓
VERIFICATION RESULT SCREEN
  ├─ IF ALL VALID:
  │  ├─ Green background
  │  ├─ ✓ Token Accepted
  │  ├─ Student: John Doe
  │  ├─ Meal: Lunch
  │  └─ Button: "CONFIRM"
  │
  └─ IF INVALID:
     ├─ Red background
     ├─ ✗ Token Invalid
     ├─ Reason: "Already used"
     └─ Button: "TRY AGAIN"
  ↓
STAFF CLICKS "CONFIRM"
  ├─ Update database:
  │  ├─ Status: VALID → USED
  │  ├─ scanned_at: NOW
  │  ├─ counter_id: Counter-A
  │  └─ staff_id: staff-001
  ├─ Create audit log entry
  └─ Success message
  ↓
STUDENT GETS MEAL ✓
  └─ Staff knows token is legitimate

LATER - VIEW VERIFICATION HISTORY
  ├─ Time: 1:15 PM
  ├─ Student: John Doe (STD-001)
  ├─ Meal: Lunch
  ├─ Status: ✓ Used
  └─ Tokens Today: 15/30 scanned

```

---

## 3. ADMIN WORKFLOW - MEAL MANAGEMENT

```
┌─────────────────────────────────────────────────────────────┐
│                   ADMIN FLOW                                │
└─────────────────────────────────────────────────────────────┘

LOGIN
  ↓
  └─ Email: admin@example.com
  └─ Password: password123
  └─ Role: Admin
  ↓
ADMIN DASHBOARD
  ├─ Analytics Summary
  │  ├─ Total Revenue: ₹50,000
  │  ├─ Tokens Issued: 500
  │  ├─ Active Students: 200
  │  └─ System Health: ✓ Good
  ├─ Quick Actions
  │  ├─ Create Meal
  │  ├─ Manage Staff
  │  ├─ View Logs
  │  └─ Generate Reports
  └─ Today's Status
     └─ All systems operational
  ↓
═══════════════════════════════════════════════════════════════

SCENARIO 1: CREATE NEW MEAL

  CLICK "MEAL MANAGEMENT"
    ↓
  CLICK "CREATE NEW MEAL"
    ├─ Meal Type: Breakfast / Lunch / Dinner
    ├─ Date: Pick date (calendar)
    ├─ Booking Open: 8:00 AM
    ├─ Booking Close: 7:00 AM (day before)
    ├─ Max Quota: 50 students
    └─ Button: "Create Meal"
    ↓
  MEAL CREATED ✓
    ├─ Status: Open for booking
    ├─ Students can now book
    ├─ Appears in their "Upcoming Menus"
    └─ Countdown: "5 hours until booking closes"

═══════════════════════════════════════════════════════════════

SCENARIO 2: CREATE MENU ITEMS

  CLICK "MENU ITEMS"
    ↓
  CLICK "ADD ITEM"
    ├─ Name: Biryani
    ├─ Cost: ₹75
    ├─ Max Qty per order: 2
    ├─ Mark as Active: ✓
    └─ Button: "Add Item"
    ↓
  ITEM CREATED ✓
    ├─ Now available for selection
    ├─ When students book, they can add this
    ├─ Cost tracked automatically
    └─ Admin can deactivate if unavailable

═══════════════════════════════════════════════════════════════

SCENARIO 3: MANAGE STAFF & COUNTERS

  CLICK "STAFF ACCOUNTS"
    ├─ See all staff members
    ├─ Current: 5 staff active
    └─ Click "Add New Staff"
    ↓
  FILL FORM
    ├─ Name: Ramesh Kumar
    ├─ Email: ramesh@hostel.com
    ├─ Employee #: EMP-105
    ├─ Assign Counter: Counter-B (Lunch)
    ├─ Set Active: ✓
    └─ Button: "Create Staff"
    ↓
  STAFF CREATED ✓
    ├─ Can now login with email
    ├─ Assigned to Counter-B
    ├─ Can scan tokens
    └─ Activity tracked in audit logs

  CLICK "COUNTER MANAGEMENT"
    ├─ See all counters:
    │  ├─ Counter-A (Breakfast): Ramesh
    │  ├─ Counter-B (Lunch): Priya
    │  ├─ Counter-C (Lunch): Ahmed
    │  └─ Counter-D (Dinner): Ravi
    └─ Can activate/deactivate as needed

═══════════════════════════════════════════════════════════════

SCENARIO 4: VIEW ANALYTICS

  CLICK "ANALYTICS"
    ├─ Date Range: Last 30 days
    └─ View Charts:
       ├─ Daily Revenue (line chart)
       │  └─ Shows ₹1000-₹3000 per day
       ├─ Popular Items (bar chart)
       │  ├─ Biryani: 150 orders
       │  ├─ Samosa: 200 orders
       │  └─ Dessert: 120 orders
       ├─ Revenue by Meal Type (pie chart)
       │  ├─ Breakfast: 30%
       │  ├─ Lunch: 45%
       │  └─ Dinner: 25%
       ├─ Peak Booking Hours
       │  └─ 7:30 AM - 8:00 AM (100+ bookings)
       └─ Staff Performance
          ├─ Ramesh: 120 scans
          ├─ Priya: 95 scans
          └─ Ahmed: 110 scans
    ↓
  BUTTON: "DOWNLOAD REPORT"
    └─ PDF generated with graphs
       └─ Can share with hostel management

═══════════════════════════════════════════════════════════════

SCENARIO 5: AUDIT LOGS

  CLICK "AUDIT LOGS"
    ├─ See complete activity log:
    │  ├─ 2024-03-24 14:30:00
    │  │  └─ Student "John Doe" booked Lunch
    │  ├─ 2024-03-24 14:32:00
    │  │  └─ Staff "Ramesh" scanned token (STD-001)
    │  ├─ 2024-03-24 15:15:00
    │  │  └─ Student "Jane Smith" booked Dinner
    │  └─ 2024-03-24 15:45:00
    │     └─ Admin updated Lunch quota to 60
    │
    └─ FILTERS:
       ├─ By Date Range
       ├─ By User/Role
       ├─ By Action Type
       └─ By Status

═══════════════════════════════════════════════════════════════

```

---

## 4. QR CODE LIFECYCLE

```
┌─────────────────────────────────────────────────────────────┐
│              QR CODE GENERATION & USAGE                     │
└─────────────────────────────────────────────────────────────┘

STEP 1: GENERATION (Student books meal)
  ├─ Input: Student ID, Meal Type, Timestamp, Cost
  ├─ Algorithm:
  │  └─ Create string: "TOKEN:1711270800:std-001:Lunch"
  ├─ Generate QR Code:
  │  ├─ Use qrcode.js library
  │  ├─ Encode string to PNG image
  │  └─ Base64 encode for storage
  ├─ Store in database:
  │  ├─ Table: meal_tokens
  │  ├─ Fields:
  │  │  ├─ id: uuid
  │  │  ├─ qr_code: "TOKEN:1711270800:std-001:Lunch"
  │  │  ├─ qr_code_image: "data:image/png;base64,..."
  │  │  ├─ status: "VALID"
  │  │  ├─ created_at: now
  │  │  └─ expires_at: now + 7 days
  │  └─ Insert row ✓
  ↓
STEP 2: DISPLAY (Student views token)
  ├─ Student goes to "My Tokens"
  ├─ Fetches from database: meal_tokens where student_id = XXX
  ├─ Displays:
  │  ├─ Token ID
  │  ├─ QR Code Image (from qr_code_image field)
  │  ├─ Meal Type
  │  ├─ Status
  │  └─ Expiry Date
  └─ Can download/screenshot
  ↓
STEP 3: SCANNING (Staff at counter)
  ├─ Student shows QR code
  ├─ Staff clicks "Scan Token"
  ├─ Camera opens
  ├─ Uses jsqr library to detect:
  │  ├─ Recognizes QR pattern
  │  ├─ Decodes to string
  │  └─ Extracts: "TOKEN:1711270800:std-001:Lunch"
  ├─ No manual typing needed!
  └─ System processes automatically
  ↓
STEP 4: VERIFICATION (Server-side)
  ├─ Receive: "TOKEN:1711270800:std-001:Lunch"
  ├─ Query database:
  │  └─ SELECT * FROM meal_tokens WHERE qr_code = ...
  ├─ Validation checks:
  │  ├─ ✓ Token exists
  │  ├─ ✓ Status is "VALID"
  │  ├─ ✓ Expiry date is future
  │  ├─ ✓ Not already scanned
  │  └─ ✓ Timestamp matches
  ├─ Return result:
  │  ├─ valid: true/false
  │  ├─ student: { name, id, hostel }
  │  ├─ mealType: "Lunch"
  │  └─ message: "Token verified"
  └─ Send to staff interface
  ↓
STEP 5: CONFIRMATION (Staff confirms)
  ├─ See verification result
  ├─ If valid: Click "CONFIRM"
  ├─ Update database:
  │  ├─ UPDATE meal_tokens
  │  ├─ SET status = "USED"
  │  ├─ SET scanned_at = now()
  │  ├─ SET counter_id = staff_counter
  │  └─ WHERE id = token_id
  ├─ Create audit log:
  │  ├─ user_id: staff-001
  │  ├─ action: "token_used"
  │  ├─ details: { student, meal, time }
  │  └─ timestamp: now
  └─ Show success ✓
  ↓
STEP 6: TOKEN EXPIRATION
  ├─ Cron job (runs every hour):
  │  └─ UPDATE meal_tokens
  │     SET status = "EXPIRED"
  │     WHERE expires_at < now()
  │     AND status = "VALID"
  ├─ Student's token becomes EXPIRED (red)
  └─ Can no longer be used
  ↓
FINAL STATE (in database):
  ├─ Status: "USED" (or "EXPIRED")
  ├─ scanned_at: 2024-03-24 13:30:00
  ├─ counter_id: counter-b
  └─ Logged and tracked ✓

```

---

## 5. DATA FLOW IN SYSTEM

```
┌────────────────────────────────────────────────────────────┐
│              COMPLETE DATA FLOW                            │
└────────────────────────────────────────────────────────────┘

STUDENT BOOKS MEAL:
  
  Frontend (React)
    ├─ Student fills: meal selection, items
    ├─ Click "Book Token"
    └─ Send request to server
           ↓
  Backend (Next.js API)
    ├─ Receive POST /api/tokens
    ├─ Validate student (from JWT)
    ├─ Check quota (SELECT COUNT(*) FROM meal_tokens)
    ├─ Call db-service.ts:
    │  └─ generateToken(studentId, mealType, items)
    ├─ Generate QR:
    │  ├─ Create string: TOKEN:ts:studentId:mealType
    │  ├─ Call qr-utils.ts:
    │  │  └─ generateQRCode(string)
    │  │     └─ Returns: PNG base64 image
    │  └─ qrcode.js library converts to PNG
    ├─ Insert into database:
    │  └─ INSERT INTO meal_tokens (...)
    │     VALUES (uuid, studentId, mealType, status, qr_code, ...)
    └─ Return: { tokenId, qrCode, expiresAt }
           ↓
  Database (Supabase)
    ├─ New row created in meal_tokens
    ├─ Status: "VALID"
    ├─ QR stored as text + base64 image
    ├─ Expires_at: 7 days from now
    └─ Audit log: "Student X booked meal Y"
           ↓
  Frontend (React)
    ├─ Show success message
    ├─ Display QR code image
    ├─ Token appears in "My Tokens"
    └─ Student can now screenshot/download
        

STAFF SCANS QRCODE:

  Staff Interface (React)
    ├─ Click "Scan Token"
    ├─ Open camera permission
    ├─ Live video feed starts
    └─ Setup jsqr listener:
           ↓
  Camera & jsqr Library
    ├─ Continuously scan video frames
    ├─ Detect QR pattern
    ├─ Decode: "TOKEN:1711270800:std-001:Lunch"
    └─ Stop scanning, show result
           ↓
  Frontend (React)
    ├─ Extract QR data
    ├─ Send POST /api/verify
    └─ Body: { qrCode: "TOKEN:..." }
           ↓
  Backend (Next.js API)
    ├─ Receive POST /api/verify
    ├─ Parse QR string:
    │  ├─ Extract timestamp
    │  ├─ Extract studentId
    │  └─ Extract mealType
    ├─ Query database:
    │  └─ SELECT * FROM meal_tokens
    │     WHERE qr_code = "TOKEN:..."
    ├─ Validation:
    │  ├─ Check status (must be VALID)
    │  ├─ Check expires_at > now
    │  ├─ Check scanned_at is NULL
    │  └─ Verify student exists
    ├─ Join with students table:
    │  └─ Get student name, hostel, etc
    └─ Return: {
           valid: true/false,
           student: { name, id, hostel },
           message: "Token verified"
       }
           ↓
  Frontend (React)
    ├─ Show verification result
    ├─ If valid:
    │  └─ Green message + "Confirm" button
    ├─ If invalid:
    │  └─ Red message + "Try Again" button
    └─ Staff clicks based on result
           ↓
  If Staff Clicks "Confirm":
    ├─ Send POST /api/verify/confirm
    ├─ Body: { tokenId, counterId, staffId }
    └─ Backend updates database:
           ↓
  Database Update (SQL):
    ├─ UPDATE meal_tokens
    ├─ SET status = "USED"
    ├─ SET scanned_at = now()
    ├─ SET counter_id = $1
    ├─ WHERE id = $2
    └─ INSERT INTO audit_logs (...)
       VALUES (staffId, "token_used", ...)
           ↓
  Frontend Shows Success:
    ├─ "Token accepted! ✓"
    ├─ Student can get meal
    └─ Token no longer available


DATA IN DATABASE (Final State):

  meal_tokens table:
  ┌─────────────────────────────────────────────────────────┐
  │ id  │ student_id │ status│ qr_code    │scanned_at   │...│
  ├─────┼────────────┼───────┼────────────┼─────────────┤...│
  │ #1  │ std-001    │ USED  │ TOKEN:...  │ 2024-03-24..│...│
  │ #2  │ std-002    │ VALID │ TOKEN:...  │ NULL        │...│
  │ #3  │ std-001    │EXPIRED│ TOKEN:...  │ NULL        │...│
  └─────────────────────────────────────────────────────────┘

  audit_logs table:
  ┌──────────────────────────────────────────────────────────┐
  │ user_id│ action        │ timestamp     │ details        │
  ├────────┼───────────────┼───────────────┼────────────────┤
  │std-001 │ token_booked  │ 2024-03-24... │ {meal: Lunch} │
  │stf-001 │ token_verified│ 2024-03-24... │ {std-001}    │
  │adm-001 │ meal_created  │ 2024-03-24... │ {date: ..}   │
  └──────────────────────────────────────────────────────────┘

```

---

## 6. ERROR HANDLING FLOW

```
SCENARIO: STUDENT SCANS EXPIRED TOKEN

  Staff scans QR code
    ↓
  System queries database
    ├─ Token found ✓
    ├─ Status check: VALID? NO! → EXPIRED
    └─ expires_at: 2024-03-15 (yesterday)
    ↓
  Validation fails
    ├─ valid: false
    ├─ message: "This token has expired"
    └─ reason: "Validity period ended"
    ↓
  Frontend shows ERROR
    ├─ Red background
    ├─ ✗ Token Expired
    ├─ Message: "This token expired on 15-Mar-2024"
    └─ Button: "Try with different token"
    ↓
  Staff cannot confirm
    └─ Student needs to book a new token


SCENARIO: TOKEN ALREADY USED

  Staff tries to scan same token twice
    ↓
  First scan: VALID → marked as USED ✓
    ↓
  Second scan: Status check
    ├─ Token found ✓
    ├─ Status: USED (not VALID)
    └─ Validation fails
    ↓
  Frontend shows ERROR
    ├─ Red background
    ├─ ✗ Token Already Used
    ├─ Message: "This token was already used on 24-Mar 13:30"
    └─ Cannot confirm again
    ↓
  Staff knows this is duplicate attempt


SCENARIO: INVALID QR CODE

  Staff scans something that's not a token QR
    ↓
  jsqr detects QR pattern
    ├─ Decodes: "Random data"
    └─ Not a TOKEN format
    ↓
  Backend validation
    ├─ Parse fails (doesn't start with "TOKEN:")
    ├─ valid: false
    ├─ message: "Invalid QR code format"
    └─ student: null
    ↓
  Frontend shows ERROR
    ├─ Red background
    ├─ ✗ Invalid QR Code
    ├─ Message: "This doesn't appear to be a meal token"
    └─ Button: "Try again"

```

---

This system is fully automated with zero manual data entry for QR codes!
