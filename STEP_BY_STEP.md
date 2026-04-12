
# 🎯 STEP-BY-STEP COMPLETE WALKTHROUGH

## From Start to Finish - Every Single Step Explained

This guide shows you EXACTLY what to do, exactly when to do it, and what to expect.

---

## PART 1: INITIAL SETUP (5 minutes)

### Step 1: Start the Development Server
```
Location: Terminal
Action: Run this command

$ pnpm dev

Expected output:
  ▲ Next.js 16.0.0
  - Ready in 2.3s
  > Local: http://localhost:3000
  
Success indicator: You see "Ready in X seconds"
```

### Step 2: Open Your Browser
```
Location: Web Browser
Action: Type this URL in address bar

http://localhost:3000

Expected: Login page loads with 3 role buttons
Success indicator: See "Student", "Staff", "Admin" buttons
```

### Step 3: You Should See
```
The Login Page:
  - Title: "Hostel Meal Management System"
  - 3 role selection buttons (Student, Staff, Admin)
  - Email input field
  - Password input field
  - Sign In button
  - "Demo credentials" hint text

If not loading:
  - Check terminal for errors
  - Verify http://localhost:3000 (not https)
  - Try refreshing the page
  - Try different browser
```

---

## PART 2: LOGIN AS STUDENT (3 minutes)

### Step 1: Select Student Role
```
Location: Login page
Action: Click the "Student" button (with GraduationCap icon)

Expected: Button highlights/becomes selected
Visual feedback: Button appears pressed/active
```

### Step 2: Enter Email
```
Location: Email input field
Action: Click the field, then type:

student1@example.com

Expected: Text appears in field
Success: Field shows: student1@example.com
```

### Step 3: Enter Password
```
Location: Password input field
Action: Click the field, then type:

password123

Note: Characters appear as dots (•••••••)
Expected: 11 dots appear (for 11 characters)
```

### Step 4: Click Sign In
```
Location: "Sign In" button
Action: Click the button

Expected: Button shows loading state
Loading indicator: You see spinning Spinner icon
Message: "Signing in..."
```

### Step 5: Wait for Response
```
Time: 1-2 seconds
Action: Wait for server response

Expected sequence:
  1. Loading spinner shows
  2. Page processes
  3. You're redirected to dashboard
  
Success indicator: Dashboard loads with your name
```

### Step 6: You're Now Logged In!
```
You should see:
  - Your name at top: "Welcome, John Doe"
  - Sidebar with navigation options
  - Main content area showing "Upcoming Menus"
  - Cards for Breakfast, Lunch, Dinner meals
  - All your student-specific options

Success: You're on the Student Dashboard!
```

---

## PART 3: BOOK YOUR FIRST MEAL (5 minutes)

### Step 1: Find a Meal to Book
```
Location: "Upcoming Menus" section on dashboard
What you see:
  - 3 meal cards: Breakfast, Lunch, Dinner
  - Each shows: meal type, date, quota ("12/30 booked")
  - Color-coded cards

Action: Click on the "Lunch" card (or any meal)
```

### Step 2: Meal Details Dialog Opens
```
What appears:
  A popup showing:
    - Meal type: "Lunch"
    - Date: "Tomorrow, March 25, 2024"
    - Time: "1:00 PM - 2:00 PM"
    - Menu items list:
      ☐ Samosa (₹20)
      ☐ Biryani (₹75)
      ☐ Dessert (₹25)
    - Total cost: (shows as you select)
    - Quota: "15/30 booked"
```

### Step 3: Select Menu Items
```
Action 1: Click checkbox next to "Samosa"
  Expected: Checkbox becomes checked (✓)
  
Action 2: Click checkbox next to "Biryani"
  Expected: Checkbox becomes checked (✓)
  
Action 3: Click checkbox next to "Dessert"
  Expected: Checkbox becomes checked (✓)

Result: All 3 items selected (3 checkmarks)
```

### Step 4: Check Total Cost
```
Location: Bottom of dialog
What you see:
  - Selected items listed:
    ✓ Samosa (₹20)
    ✓ Biryani (₹75)
    ✓ Dessert (₹25)
  - Total cost: ₹120

Automatic calculation: No manual entry needed
System shows: ₹20 + ₹75 + ₹25 = ₹120
```

### Step 5: Click "Book Token"
```
Location: "Book Token" button (green button at bottom)
Action: Click the button

Expected:
  1. Button shows loading state
  2. Processing: 1-2 seconds
  3. Success message appears: "Token created! ✓"
  4. QR code is generated
  5. Dialog closes automatically
```

### Step 6: See Your New Token
```
After booking, you're back on dashboard
You now see:
  - New section: "My Tokens" appears (or updates)
  - Shows your new token:
    - Token ID: "abc-123" (unique)
    - QR Code: (visible as square barcode image)
    - Meal Type: "Lunch"
    - Status: "VALID" (green badge)
    - Total Cost: "₹120"
    - Expires: "March 31, 2024" (7 days from now)

Success: Your token with QR code is ready!
```

---

## PART 4: VIEW YOUR QR CODE (2 minutes)

### Step 1: Navigate to "My Tokens"
```
Location: Left sidebar or top navigation
Action: Click "My Tokens"

Alternative: If already there, see it on dashboard
```

### Step 2: See All Your Tokens
```
What you see:
  - List or grid of your tokens
  - Each token shows:
    - Token ID
    - QR Code (as image)
    - Meal Type
    - Status (VALID/USED/EXPIRED)
    - Cost
    - Expiry Date
```

### Step 3: View the QR Code
```
Action: Look at the QR code image for your token

What it looks like:
  - Square barcode pattern
  - Black and white squares
  - About 200x200 pixels
  - Machine readable format

The QR contains:
  TOKEN:1711270800:std-001:Lunch
  (This is the actual data encoded)
```

### Step 4: Download (Optional)
```
If button available:
  Action: Click "Download QR" button
  Result: QR image saves to your computer
  Useful for: Printing, sharing with staff
```

### Step 5: Ready to Use
```
Your token is ready!
Next: Show this QR code to staff member at counter
When: On the meal day (tomorrow)
How: Hold QR code up to their camera
Result: Token gets verified and marked as USED
```

---

## PART 5: LOGOUT (1 minute)

### Step 1: Find Logout
```
Location: Top right corner or settings menu
Action: Click on your profile/avatar or "Logout" button
```

### Step 2: Confirm Logout
```
Action: If prompted, confirm logout
Result: Session ends
You're redirected: Back to login page
Success: You're logged out
```

---

## PART 6: LOGIN AS STAFF MEMBER (3 minutes)

### Step 1: Already at Login Page
```
You're back at: http://localhost:3000

If not:
  - Click logout from previous session
  - Or open new incognito window
  - Or type URL in new tab
```

### Step 2: Select Staff Role
```
Location: Login page
Action: Click the "Staff" button (with UtensilsCrossed icon)

Expected: Button highlights
Visual: Button appears selected/pressed
```

### Step 3: Enter Staff Credentials
```
Email field:
  Type: staff1@example.com

Password field:
  Type: password123

Both from test accounts!
```

### Step 4: Click Sign In
```
Action: Click "Sign In" button

Expected:
  1. Loading state
  2. Verification
  3. Redirect to Staff Dashboard
```

### Step 5: You're on Staff Dashboard
```
You should see:
  - Welcome message: "Welcome, Staff Member"
  - Your assigned counter: "Counter A (Lunch)"
  - Tokens served today: "0"
  - System status: "Active"
  - "Scan Token" button (prominent, blue)

Success: You're logged in as staff!
```

---

## PART 7: SCAN A QR CODE (This is the Cool Part!) (5 minutes)

### Step 1: Click "Scan Token" Button
```
Location: Staff Dashboard (large blue button)
Action: Click "Scan Token"

Expected:
  1. Camera permission popup appears
  2. Browser asks: "Allow camera access?"
  3. You need to click "Allow"
```

### Step 2: Grant Camera Permission
```
Popup says: "This site wants to use your camera"

Action: Click "Allow" button

Permissions: Browser camera access is granted
Result: Camera initializes (takes 1-2 seconds)
```

### Step 3: Camera Opens
```
What you see:
  - Camera feed displayed
  - Real-time video from your camera
  - "Scanning for QR code..." message
  - Crosshair or targeting reticle in center

Ready: System is looking for QR codes now
```

### Step 4: Get a QR Code
```
Now you need to show a QR code to the camera
Two options:

Option A: Use phone/another device
  - Open your student account on phone
  - Go to "My Tokens"
  - Show the QR code to the camera
  - Hold steady, 10-20cm away

Option B: Use a screenshot
  - Print a QR code
  - Or display on another monitor
  - Show to the camera
```

### Step 5: System Detects QR Code
```
When QR code is in frame:
  1. System scans the video
  2. jsqr library detects the pattern
  3. Automatically decodes the QR
  4. No typing needed!
  5. Verification screen appears instantly

You see:
  - Camera closes
  - Verification result shows
  - Details: Student name, meal type
```

### Step 6: Verification Result Screen
```
You see a screen showing:

✅ Token Valid (if everything is good)
   Student: John Doe
   Student ID: std-001
   Meal Type: Lunch
   Status: VALID
   Cost: ₹120
   
   [Confirm] [Try Again]

OR

❌ Token Invalid (if there's a problem)
   Reason: "Token already used"
   OR "Token expired"
   
   [Try Again]
```

### Step 7: Click "Confirm"
```
Location: "Confirm" button (green)
Action: Click it

Expected:
  1. Database updates
  2. Token status changes: VALID → USED
  3. Timestamp recorded
  4. Success message: "Token accepted! ✓"
  5. Student can now get their meal

Result: Token is marked as USED!
```

### Step 8: Serve the Meal
```
Now the staff member:
  - Knows the token is legitimate
  - Knows the student is John Doe
  - Knows the meal is Lunch
  - Can now serve the meal

Process complete: Token used successfully!
```

---

## PART 8: LOGIN AS ADMIN (2 minutes)

### Step 1: Logout from Staff
```
Action: Click logout
Redirect: Back to login page
```

### Step 2: Select Admin Role
```
Location: Login page
Action: Click "Admin" button (with ShieldCheck icon)

Expected: Button highlights
```

### Step 3: Enter Admin Credentials
```
Email: admin@example.com
Password: admin123

Note: Admin password is "admin123", not "password123"
```

### Step 4: Click Sign In
```
Action: Click "Sign In"

Expected:
  - Loading state
  - Redirect to Admin Dashboard
  - Much more complex interface!
```

### Step 5: Admin Dashboard Loads
```
You see:
  - Welcome: "Admin Dashboard"
  - Analytics section (charts, numbers)
  - Multiple menu options on left:
    ├─ Meal Management
    ├─ Menu Items
    ├─ Staff Accounts
    ├─ Student Accounts
    ├─ Counter Management
    ├─ Analytics
    ├─ Audit Logs
    └─ Settings
  - Real-time stats (tokens issued, revenue, etc.)

Success: You're in the Admin Panel!
```

---

## PART 9: CREATE A NEW MEAL (As Admin) (5 minutes)

### Step 1: Click "Meal Management"
```
Location: Left sidebar
Action: Click "Meal Management"

Expected: Meal management page loads
Shows: List of existing meals
Buttons: "Create New Meal", etc.
```

### Step 2: Click "Create New Meal"
```
Location: Top right (usually a green + button)
Action: Click the button

Expected: Form opens with fields:
  - Meal Type: (dropdown)
  - Date: (date picker)
  - Booking Start: (time picker)
  - Booking End: (time picker)
  - Max Quota: (number input)
  - Is Open: (toggle)
```

### Step 3: Fill in Meal Details
```
Field 1: Meal Type
  Action: Click dropdown, select "Breakfast"
  Result: "Breakfast" selected

Field 2: Date
  Action: Click date picker
  Select: March 26, 2024 (tomorrow)
  Result: Date shows as "26-Mar-2024"

Field 3: Booking Start
  Action: Set to 6:00 AM
  Result: Time shows "06:00"

Field 4: Booking End
  Action: Set to 8:00 AM (day before)
  Result: Time shows "08:00"

Field 5: Max Quota
  Action: Type: 100
  Result: Field shows "100"

Field 6: Is Open
  Action: Toggle to ON (enabled)
  Result: Toggle shows blue/active
```

### Step 4: Click "Create Meal"
```
Location: Submit button at bottom
Action: Click "Create Meal"

Expected:
  1. Loading state
  2. Database insert
  3. Success message: "Meal created! ✓"
  4. Page refreshes
  5. New meal appears in list
```

### Step 5: Meal is Live!
```
Result:
  - Meal now shows in list
  - Students can see it in "Upcoming Menus"
  - Students can book from this meal
  - Booking window is active

Success: New meal created and ready for booking!
```

---

## PART 10: VIEW ANALYTICS (As Admin) (3 minutes)

### Step 1: Click "Analytics"
```
Location: Left sidebar
Action: Click "Analytics"

Expected: Analytics page loads
```

### Step 2: See Charts and Data
```
What appears:
  - Daily Revenue chart (line graph)
  - Popular Items chart (bar graph)
  - Meal Type breakdown (pie chart)
  - Staff Performance (bar chart)
  - Peak Booking Hours (area chart)
  - Key metrics (cards):
    - Total Revenue
    - Total Tokens
    - Active Students
    - Avg Cost per Token
```

### Step 3: Filter Data (Optional)
```
You can:
  - Select date range (calendar)
  - Filter by meal type
  - Filter by counter
  - Filter by time period

Action: Click on different filters
Result: Charts update automatically
```

### Step 4: Generate Report (Optional)
```
Location: "Download Report" button
Action: Click button

Result:
  - PDF file generated
  - Contains all charts and data
  - Downloads to your computer
  - Ready to share with management
```

---

## PART 11: VIEW AUDIT LOGS (As Admin) (3 minutes)

### Step 1: Click "Audit Logs"
```
Location: Left sidebar
Action: Click "Audit Logs"

Expected: Audit logs page loads
Shows: Table with all activities
```

### Step 2: See Activity Log
```
You see columns:
  - Timestamp: When action happened
  - User: Who did it
  - Role: Student/Staff/Admin
  - Action: What they did
  - Details: Additional info
  - Status: Success/failure

Entries show:
  "2024-03-24 14:30 | Student | John Doe | Booked meal | Lunch"
  "2024-03-24 14:32 | Staff | Ramesh | Verified token | std-001"
  "2024-03-24 15:15 | Admin | Admin User | Created meal | Breakfast"
  ... and so on
```

### Step 3: Search and Filter
```
You can:
  - Search by date range
  - Filter by user
  - Filter by role
  - Filter by action type
  - Filter by status

Action: Click on filter fields
Result: Table updates to show filtered results
```

### Step 4: Export (Optional)
```
Location: "Export to CSV" button (if available)
Action: Click button

Result:
  - CSV file downloads
  - Opens in Excel/Sheets
  - Great for archiving
```

---

## SUMMARY OF COMPLETE FLOW

```
START → Login as Student
        ↓
      Book a Meal
        ↓
      Get QR Code
        ↓
      Logout
        ↓
        Login as Staff
        ↓
      Scan QR Code (from phone/other device)
        ↓
      Verify Token
        ↓
      Logout
        ↓
      Login as Admin
        ↓
      Create New Meal
        ↓
      View Analytics
        ↓
      View Audit Logs
        ↓
      END (You've used the entire system!)
```

---

## TIMING SUMMARY

| Step | Activity | Time |
|------|----------|------|
| 1-3 | Setup & Login | 5 min |
| 4-6 | Book Meal | 5 min |
| 7 | View QR | 2 min |
| 8 | Logout | 1 min |
| 9-11 | Staff Login & Scan | 8 min |
| 12-14 | Admin Login | 2 min |
| 15-16 | Create Meal | 5 min |
| 17-19 | View Analytics | 3 min |
| 20-22 | View Logs | 3 min |
| **TOTAL** | **Complete Experience** | **~34 min** |

---

## TROUBLESHOOTING THIS WALKTHROUGH

### Problem: Page not loading
```
Solution:
1. Check: pnpm dev is running
2. Check: http://localhost:3000 (no https)
3. Try: Refresh the page (F5)
4. Try: Different browser
```

### Problem: Can't login
```
Solution:
1. Check: Email spelling
2. Check: Password (must match exactly)
3. Try: student1@example.com / password123
4. Check: Browser console (F12) for errors
```

### Problem: Can't scan QR
```
Solution:
1. Grant camera permission when asked
2. Better lighting needed
3. Hold QR steady, 10-20cm away
4. Try: Landscape mode
5. Try: Different browser (Chrome best)
```

### Problem: QR code not detected
```
Solution:
1. Move camera closer (5-10cm)
2. Better lighting
3. Steady positioning (don't move)
4. Try: Different QR code
5. Check: Camera permissions granted
```

---

## NEXT STEPS AFTER WALKTHROUGH

1. **Explore More**: Try features not in this walkthrough
2. **Test All Roles**: Thoroughly test Student, Staff, Admin
3. **Create More Data**: Add more students, meals, items
4. **Test Edge Cases**: Try expired tokens, duplicate scans
5. **Read Documentation**: Learn about advanced features
6. **Deploy**: Set up production environment
7. **Train Users**: Show real users the system

---

## YOU DID IT! 🎉

You've now used the entire system from start to finish!

- ✅ Logged in as student
- ✅ Booked a meal
- ✅ Generated a QR code
- ✅ Logged in as staff
- ✅ Scanned a QR code
- ✅ Verified a token
- ✅ Logged in as admin
- ✅ Created a meal
- ✅ Viewed analytics
- ✅ Reviewed audit logs

**You understand the complete system!**

For more details, read:
- COMPLETE_USER_GUIDE.md
- WORKFLOW_DIAGRAM.md
- QUICK_REFERENCE.md
