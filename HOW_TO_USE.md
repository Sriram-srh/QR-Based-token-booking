# HOW TO USE - SmartMeal QR System

Complete step-by-step instructions from login to all features.

---

## 🚀 STARTING THE APPLICATION

### Step 1: Run the Server
```bash
pnpm dev
```

### Step 2: Open in Browser
Navigate to: `http://localhost:3000`

You will see the **Login Screen** with three role options.

---

## 📋 LOGIN INSTRUCTIONS

### Step 1: Select Your Role
Click on one of three role cards:
- **Student** - Book meals, view QR codes
- **Serving Staff** - Scan QR codes at counter
- **Admin** - Manage system

### Step 2: Enter Credentials
After selecting role, you'll see two fields:

#### Test Account Credentials:

**Option A: Login as Student**
```
Email: student1@example.com
Password: password123
Role: Student (select first)
```

**Option B: Login as Staff**
```
Email: staff1@example.com
Password: password123
Role: Serving Staff (select first)
```

**Option C: Login as Admin**
```
Email: admin@example.com
Password: admin123
Role: Admin (select first)
```

### Step 3: Click "Sign In"
- Wait for loading spinner to complete
- You will be automatically logged in
- Dashboard will load

---

## 👨‍🎓 STUDENT WORKFLOWS

### STUDENT DASHBOARD

#### Screen Overview:
- **Left Sidebar**: Navigation menu
- **Main Content**: Quick stats and buttons
- **Top Bar**: User info and logout

#### Available Options on Dashboard:
1. **Book Token** - Create new meal token
2. **My Tokens** - View existing tokens & QR codes
3. **Upcoming Menus** - See next meals available
4. **Billing** - Check payment status
5. **Notifications** - View system messages
6. **Profile** - Update personal info
7. **Logout** - Exit system

---

### WORKFLOW 1: BOOK A MEAL TOKEN

#### Step 1: Click "Book Token"
- Navigates to meal booking page
- Shows available meals: Breakfast, Lunch, Dinner

#### Step 2: Select Meal Type
- Click on desired meal (Breakfast/Lunch/Dinner)
- Page shows items available for that meal

#### Step 3: Choose Items
- See list of items with prices:
  - Quantity selector (+ / - buttons)
  - Individual item cost
  - Add to selection

#### Step 4: Review Cart
- Total items selected
- Total cost calculation
- "Book Token" button at bottom

#### Step 5: Confirm Booking
- Click "Book Token" button
- System generates unique QR code
- Automatic timestamp recorded
- Token status: VALID

#### Step 6: See Success Message
- Confirmation popup appears
- Option to view token immediately
- Redirects to "My Tokens" page

---

### WORKFLOW 2: VIEW YOUR TOKENS

#### Step 1: Click "My Tokens"
Shows all your tokens in a table with columns:

| Column | Meaning |
|--------|---------|
| Date & Time | When token was created |
| Meal Type | Breakfast/Lunch/Dinner |
| Items | What you ordered |
| Total Cost | How much it costs |
| Status | VALID/USED/EXPIRED |
| Actions | View QR / Delete |

#### Step 2: View QR Code
- Click "View QR" button for any token
- Popup opens with:
  - Large QR code (scannable)
  - Unique token ID
  - Meal type
  - Expiration date
  - Download option

#### Step 3: Show QR to Staff
- Display on your phone/screen
- Staff scans with their device
- Token automatically marked as USED
- You get confirmation

#### Step 4: Delete Token (if needed)
- Click trash icon
- Confirmation dialog appears
- Token removed from system

---

### WORKFLOW 3: CHECK UPCOMING MENUS

#### Step 1: Click "Upcoming Menus"
Shows calendar of future meals

#### View Information:
- Date of meal
- Items available
- Individual prices
- Total for that day

#### Step 2: Plan Your Meals
- Browse next 7+ days
- See what's available
- Plan your diet

---

### WORKFLOW 4: CHECK BILLING

#### Step 1: Click "Billing"
Shows payment summary

#### Information Displayed:
- Total spent (month/year)
- Pending payments
- Payment history
- Due dates
- Account balance

#### Step 2: Make Payment (if needed)
- Click "Pay Now" button
- Redirected to payment gateway
- Follow payment instructions

---

### WORKFLOW 5: VIEW NOTIFICATIONS

#### Step 1: Click "Notifications"
Shows all system messages

#### Message Types:
- Token status updates
- Meal availability alerts
- Payment reminders
- System announcements

#### Step 2: Clear Notifications
- Click individual message to read
- Click "Clear All" to remove all
- Marked as read

---

### WORKFLOW 6: UPDATE PROFILE

#### Step 1: Click "Profile"
Shows your personal information

#### Editable Fields:
- Name
- Email
- Phone
- Hostel Room Number
- Dietary Preferences

#### Step 2: Edit Information
- Click "Edit" button
- Modify any field
- Click "Save"
- Confirmation message appears

---

## 👨‍🍳 STAFF WORKFLOWS

### STAFF VERIFICATION SCREEN

#### Screen Overview:
- **Camera View**: Shows live camera feed
- **Instructions**: "Point camera at QR code"
- **Detected Data**: Shows scanned info
- **Confirm Button**: Approve meal service

---

### WORKFLOW 1: SCAN QR CODE

#### Step 1: Open Camera
- Click "Start Scanner" button
- Grant camera permission (browser will ask)
- Camera feed appears

#### Step 2: Position QR Code
- Student shows QR code
- Point device camera at QR
- Keep steady for 1-2 seconds
- System auto-detects (no typing needed!)

#### Step 3: System Auto-Reads
When QR detected, you'll see:
```
Student ID: std-001
Name: Student One
Meal Type: Lunch
Items: 3 items selected
Total Cost: ₹150
```

#### Step 4: Verify Information
- Check if student matches
- Check if meal type is correct
- Check if items look right

#### Step 5: Click "Confirm"
- Token status changes to USED
- System records timestamp
- Popup confirmation appears
- Ready to scan next QR

#### Step 6: Handle Issues
If something seems wrong:
- Don't click "Confirm"
- Cancel scan
- Ask student to check
- Try scanning again

---

### WORKFLOW 2: RESOLVE SCANNING ISSUES

#### Issue: QR Not Detected
**Solution:**
1. Ensure good lighting
2. Hold camera steady
3. Move closer/farther away
4. Try different angle
5. Ask student to adjust QR position

#### Issue: Wrong Student
**Solution:**
1. Don't confirm
2. Cancel scan
3. Ask student to verify they're using correct QR
4. Rescan

#### Issue: Camera Not Working
**Solution:**
1. Click "Reset Camera"
2. Grant permissions again
3. Try different browser (Chrome recommended)
4. Restart application

---

### WORKFLOW 3: VIEW SCAN HISTORY

#### Step 1: Click "Verified History"
- Shows all scans from today
- Chronological order (newest first)

#### Information:
- Student name
- Meal type
- Time scanned
- Items count
- Status: VERIFIED

#### Step 2: Download Report
- Click "Export Report"
- PDF downloaded
- Contains full day's data

---

## 👨‍💼 ADMIN WORKFLOWS

### ADMIN DASHBOARD

#### Screen Overview:
- **Left Sidebar**: Admin navigation
- **Main Area**: Key statistics & quick actions
- **Cards**: Show system status

#### Available Sections:
1. **Meals** - Create/edit meals
2. **Counters** - Manage serving counters
3. **Students** - Manage student accounts
4. **Staff** - Manage staff accounts
5. **Payments** - Control payment settings
6. **Analytics** - View system statistics
7. **Logs** - Audit all actions
8. **Settings** - Configure system

---

### WORKFLOW 1: CREATE NEW MEAL

#### Step 1: Click "Meals"
Shows list of existing meals

#### Step 2: Click "Add New Meal"
Form appears with fields:
- Meal Name (e.g., "Lunch")
- Meal Type (Breakfast/Lunch/Dinner)
- Description
- Available From (date/time)
- Available Until (date/time)

#### Step 3: Fill Form
- Enter meal details
- Set time window

#### Step 4: Click "Create Meal"
- New meal added to system
- Appears in list
- Students can book from it

---

### WORKFLOW 2: MANAGE MENU ITEMS

#### Step 1: Click "Meals" → Select Meal
Shows items for that meal

#### Step 2: View Current Items
Table shows:
- Item name
- Price
- Quantity in stock
- Actions (Edit/Delete)

#### Step 3: Add New Item
- Click "Add Item" button
- Form appears:
  - Item name
  - Description
  - Price (₹)
  - Available quantity
  - Dietary info

#### Step 4: Save Item
- Click "Add" button
- Item appears in list
- Students can select it

#### Step 5: Edit Item
- Click edit icon
- Modify any field
- Save changes

#### Step 6: Delete Item
- Click trash icon
- Confirmation dialog
- Item removed

---

### WORKFLOW 3: MANAGE COUNTERS

#### Step 1: Click "Counters"
Shows all serving counters

#### Information:
- Counter name
- Location
- Staff assigned
- Status

#### Step 2: Create New Counter
- Click "Add Counter"
- Form:
  - Counter name
  - Location
  - Capacity
- Click "Create"

#### Step 3: Assign Staff
- Click counter
- Click "Assign Staff"
- Select from staff list
- Confirm

---

### WORKFLOW 4: MANAGE STUDENTS

#### Step 1: Click "Students"
Shows all student accounts

#### Information:
- Student ID
- Name
- Email
- Room Number
- Status (Active/Inactive)
- Tokens Created

#### Step 2: View Student Details
- Click student name
- See:
  - All tokens created
  - Billing history
  - Activity timeline

#### Step 3: Deactivate Student
- Click "Deactivate" button
- Student can't login
- Existing tokens still valid

#### Step 4: Reactivate Student
- Click "Activate" button
- Student can login again

---

### WORKFLOW 5: MANAGE STAFF

#### Step 1: Click "Staff"
Shows all staff accounts

#### Information:
- Staff ID
- Name
- Email
- Counter assigned
- Status

#### Step 2: Create New Staff
- Click "Add Staff"
- Form:
  - Name
  - Email
  - Password
  - Counter assignment
- Click "Create"

#### Step 3: Edit Staff
- Click staff name
- Modify details
- Save changes

#### Step 4: Reset Password
- Click staff → "Reset Password"
- New temporary password sent via email

---

### WORKFLOW 6: VIEW ANALYTICS

#### Step 1: Click "Analytics"
Shows system statistics

#### Displayed Metrics:
- **Total Tokens Created** (today/week/month)
- **Tokens Used** (scanned at counter)
- **Revenue** (total meal costs)
- **Popular Items** (most ordered)
- **Peak Hours** (busiest times)
- **Active Students** (logged in today)

#### Step 2: Filter by Date
- Select date range
- Charts update automatically
- Download reports

#### Step 3: View Charts
- Line graph: Tokens over time
- Bar chart: Items ordered
- Pie chart: Meal type distribution

---

### WORKFLOW 7: VIEW AUDIT LOGS

#### Step 1: Click "Logs"
Shows all system activities

#### Log Information:
- Timestamp
- User
- Action (login/create/delete/verify)
- Resource (meal/token/user)
- Status (success/error)

#### Step 2: Search Logs
- Filter by:
  - User
  - Action type
  - Date range
  - Status

#### Step 3: Export Logs
- Click "Export"
- Choose format (PDF/CSV/Excel)
- Download

---

### WORKFLOW 8: SYSTEM SETTINGS

#### Step 1: Click "Settings"
Shows configuration options

#### Available Settings:
- **Token Expiration** (days)
- **Max Meals Per Day** (limit)
- **Payment Gateway** (settings)
- **Notification Preferences**
- **System Maintenance** (on/off)
- **Backup Schedule**

#### Step 2: Modify Settings
- Click field
- Change value
- Click "Save"
- Confirmation message

---

## 🔒 LOGOUT

### From Any Screen:

#### Step 1: Click Profile Icon
- Top right corner of screen
- Dropdown menu appears

#### Step 2: Click "Logout"
- Session ends
- Redirected to login page
- All data saved

---

## ⚡ QUICK TIPS & SHORTCUTS

### For Students:
- Bookmark "My Tokens" for quick access
- Set notification reminders for meals
- Plan 7 days ahead
- Download QR code if phone is slow

### For Staff:
- Keep camera clean for better QR detection
- Ensure good lighting at counter
- Report suspicious tokens
- Take breaks between scanning

### For Admin:
- Check analytics daily
- Review audit logs weekly
- Update menus monthly
- Backup system weekly

---

## 🆘 TROUBLESHOOTING

### Login Issues

**Problem: "User not found"**
- Check spelling of email
- Verify you selected correct role
- Ensure account exists
- Contact admin if needed

**Problem: "Invalid password"**
- Check caps lock is off
- Verify password is correct
- Click "Forgot Password" (if available)
- Contact admin to reset

### QR Code Issues

**Problem: QR code not scanning**
- Ensure good lighting
- Hold camera steady
- Move camera closer
- Clean camera lens
- Try again slowly

**Problem: Wrong student scanned**
- Don't confirm
- Ask student to verify QR
- Delete if wrong
- Scan correct one

### Other Issues

**Problem: Page not loading**
- Refresh browser (F5 or Cmd+R)
- Clear browser cache
- Try different browser
- Check internet connection

**Problem: Can't upload profile picture**
- Ensure image is < 5MB
- Use JPG/PNG format
- Check file permissions
- Try different image

---

## 📞 SUPPORT

If you encounter issues not listed above:

1. Note the error message
2. Screenshot the issue
3. Check system logs
4. Contact admin with details

Admin Email: admin@example.com

---

## 🎯 COMMON SCENARIOS

### Scenario 1: Student Books Lunch
1. Login as student
2. Click "Book Token"
3. Select "Lunch"
4. Add items (Rice, Dal, Vegetables)
5. Click "Book Token"
6. QR code generated
7. Go to dining hall
8. Show QR to staff
9. Staff scans
10. Token marked USED
11. Enjoy meal!

### Scenario 2: Staff Manages Multiple Counters
1. Login as staff
2. See assigned counter
3. Students come with QRs
4. Point camera at each QR
5. Review student info
6. Click "Confirm"
7. Token marked USED
8. Next student
9. Repeat all day

### Scenario 3: Admin Adds New Meal
1. Login as admin
2. Click "Meals"
3. Click "Add New Meal"
4. Enter meal details
5. Click "Create Meal"
6. Click meal to add items
7. Add items with prices
8. Save
9. Students can now book
10. Monitor analytics

---

## ✅ CHECKLIST - FIRST TIME SETUP

- [ ] Application running on http://localhost:3000
- [ ] Can see login page with 3 role options
- [ ] Can login as student (student1@example.com)
- [ ] Dashboard loads with student menu
- [ ] Can click "Book Token"
- [ ] Can select meal and items
- [ ] Can click "Book Token" and see QR
- [ ] Can logout
- [ ] Can login as staff (staff1@example.com)
- [ ] Can see scanner screen
- [ ] Can logout
- [ ] Can login as admin (admin@example.com)
- [ ] Can see admin dashboard
- [ ] Can access all admin sections
- [ ] Ready to use!

---

## 🎉 YOU'RE ALL SET!

Your SmartMeal QR system is fully functional. Follow the workflows above for any task you need to accomplish.

**Happy meal booking! 🍽️**
