# 🧪 QUICK TESTING CHECKLIST

Use this after implementing the trigger to verify everything works.

## ⚠️ PREREQUISITE

**Before testing:** Have you run the SQL migration?
- [ ] Gone to Supabase → SQL Editor
- [ ] Executed the SQL from `scripts/06-auth-trigger-auto-sync.sql`
- [ ] Got success messages (no errors)

If not, go to **TRIGGER_SETUP_GUIDE.md** → **STEP 1**

---

## 🔴 Test 1: Create Staff (Critical)

**Time: 2 minutes**

### Steps

1. **Start app**
   ```bash
   npm run dev
   ```
   Open: `http://localhost:3000`

2. **Login as admin**
   - Email: `admin@example.com`
   - Password: `Admin@123`

3. **Navigate to Staff Accounts**
   - Click dashboard tabs at top
   - Find and click **Staff Accounts** (or similar admin tab)

4. **Create new staff**
   - Click **+ Add Staff** button
   - Fill form:
     - **Name:** `TRIG-STAFF-001` (make it unique, easier to search)
     - **Email:** `trigger-staff-001@test.local`
     - **Employee #:** `TRIG001`
     - **Password:** Leave empty (uses default `Default@123`)
   - Click **Create Staff**

### ✅ Expected Result

**In browser:**
- Modal closes
- New staff appears in the list below
- Name shows: `TRIG-STAFF-001`
- Status shows: ✅ Active

**In Supabase (check 3 tables):**

1. **Supabase → SQL Editor → Tables → `auth.users`**
   - Search for email: `trigger-staff-001@test.local`
   - ✅ Row exists
   - ✅ `user_metadata` shows: `{ "name": "TRIG-STAFF-001", "role": "staff" }`

2. **Supabase → Tables → `public.users`**
   - Search for email: `trigger-staff-001@test.local`
   - ✅ Row exists (AUTO-CREATED by trigger!)
   - ✅ `id` matches auth.users id
   - ✅ `name` = "TRIG-STAFF-001"
   - ✅ `role` = "staff"
   - ✅ `is_active` = true

3. **Supabase → Tables → `public.staff`**
   - Find row with `employee_number` = "TRIG001"
   - ✅ Row exists
   - ✅ `user_id` matches public.users id

### ❌ If Something's Wrong

| Error | Cause | Fix |
|-------|-------|-----|
| "Created successfully" but not in list | Frontend caching | Refresh page (F5) |
| No public.users row | Trigger didn't fire | Check if SQL ran in Supabase |
| Wrong name in public.users | Metadata not passed | Verify user_metadata in auth.admin.createUser() |
| Type errors in console | TypeScript issue | Run `npm run build` to catch errors |

---

## 🔴 Test 2: Create Student (Critical)

**Time: 2 minutes**

### Option A: Via Admin UI (if available)

1. Navigate to **Student Accounts** tab
2. Click **+ Add Student**
3. Fill:
   - **Name:** `TRIG-STUDENT-001`
   - **Email:** `trigger-student-001@test.local`
   - **Register #:** `REG001`
   - **Hostel:** "Boys"
   - **Room:** "101"
   - **Phone:** "9876543210"
4. Click **Create Student**

### Option B: Via API (curl/Postman)

```bash
curl -X POST http://localhost:3000/api/admin/students \
  -H "Authorization: Bearer <YOUR_ADMIN_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "TRIG-STUDENT-001",
    "email": "trigger-student-001@test.local",
    "registerNumber": "REG001",
    "hostel": "Boys",
    "room": "101",
    "phone": "9876543210"
  }'
```

**Note:** Get admin JWT from localStorage after login:
- Open DevTools → Console
- Paste: `JSON.parse(localStorage.getItem('sb-<project-id>-auth-token')).session.access_token`
- Copy the token value

### ✅ Expected Result

**Response:**
```json
{
  "success": true,
  "student": {
    "user_id": "<uuid>",
    "name": "TRIG-STUDENT-001",
    "email": "trigger-student-001@test.local",
    "registerNumber": "REG001"
  }
}
```

**In Supabase (check 3 tables):**

1. **auth.users**
   - ✅ Row exists with email: `trigger-student-001@test.local`
   - ✅ `user_metadata.role` = "student"

2. **public.users** ← THIS SHOULD AUTO-EXIST (trigger!)
   - ✅ Row exists
   - ✅ `name` = "TRIG-STUDENT-001"
   - ✅ `role` = "student"

3. **public.students**
   - ✅ Row exists with register_number: "REG001"
   - ✅ `user_id` matches public.users.id

---

## 🟡 Test 3: Login with New Account (Recommended)

**Time: 3 minutes**

### Steps

1. **Logout** current admin user (if logged in)
   - Click profile icon (top-right)
   - Click **Logout**

2. **Try login with new staff**
   - Email: `trigger-staff-001@test.local`
   - Password: `Default@123`
   - Click **Login**

3. **Expected: Success** ✅
   - Redirected to dashboard
   - Can see staff dashboard tabs
   - Profile shows: "staff" role

### If Login Fails

| Error | Fix |
|-------|-----|
| "Invalid credentials" | Check email/password are exact |
| "User not found" | Trigger didn't create users row; check Supabase |
| 500 error | Server error; check backend logs |

---

## 🟡 Test 4: Verify Bearer Token (DevTools)

**Time: 1 minute**

### Steps

1. **Login as any user**
2. **Open DevTools** (F12)
3. **Go to Network tab**
4. **Make any API call** (e.g., go to Staff Accounts tab)
5. **Look for API request** (e.g., `/api/admin/staff`)
6. **Click on request**
7. **Go to "Request Headers"**

### ✅ Expected Behavior

Should see:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**NOT:**
- ❌ No Authorization header
- ❌ Empty Bearer token
- ❌ "Bearer null"

---

## 🟢 Test 5: Tab Switching (Session Persistence)

**Time: 2 minutes**

### Steps

1. **Login and go to Admin Dashboard**
2. **Click different tabs** in quick succession:
   - Staff Accounts
   - Student Accounts
   - Meals
   - Counters
   - Audit Logs
3. **Each tab loads without 401 errors**

### ✅ Expected

- Data loads properly
- No "Unauthorized" errors
- No 401 responses in Network tab

### ❌ If It Fails

- Check: Is Bearer token included? (Test 4)
- Check: Is token fresh? (might have expired)
- Check: Is `getAuthHeadersAsync()` being used? (should be)

---

## 🟢 Test 6: Page Reload (Session Survival)

**Time: 2 minutes**

### Steps

1. **Login as student**
2. **Go to: Student Dashboard → Book Token tab**
3. **Press F5 to reload page**

### ✅ Expected

- Page reloads
- User still logged in (session persisted)
- Can see "Book Token" form
- API calls work

### ❌ If User Logged Out After Reload

- Check: Is localStorage persisting session?
- Check: Supabase client configured correctly?

---

## ✅ FINAL VERIFICATION

Run through this checklist:

```
TRIGGER SETUP
[ ] SQL migration executed in Supabase
[ ] app/api/admin/staff/route.ts uses 'user_metadata' in createUser()
[ ] lib/db-service.ts uses 'user_metadata' in createUser()
[ ] npm run build passes with no errors

TEST 1: Staff Creation
[ ] Created TRIG-STAFF-001 via UI
[ ] Appears in admin staff list
[ ] Auto-created in public.users table
[ ] Exists in public.staff table
[ ] Login works with new staff account

TEST 2: Student Creation
[ ] Created TRIG-STUDENT-001 via API
[ ] Auto-created in public.users table
[ ] Exists in public.students table

TEST 3: Bearer Token
[ ] DevTools shows "Authorization: Bearer <token>"
[ ] All API requests include token

TEST 4: Session Persistence
[ ] Tab switching works (no 401 errors)
[ ] Page reload keeps session alive
[ ] Can access protected routes
```

---

## 🎉 All Green?

Congratulations! Your trigger-based auto-sync system is working perfectly.

**What now?**
1. Create a few more test accounts to be sure
2. Test on production (after verifying staging)
3. Document any custom role names if you added them
4. Monitor Supabase logs for any trigger errors (unlikely, but good practice)

---

## 🆘 Troubleshooting

### "Trigger created but users still not auto-created"

1. **Check:** Did you restart your dev server?
   ```bash
   npm run dev
   ```

2. **Check:** SQL command actually executed?
   - Go to Supabase → SQL Editor
   - Create new query
   - Paste: `SELECT * FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created';`
   - Run it
   - Should show 1 result

3. **Check:** Are you passing `user_metadata`?
   - Open `app/api/admin/staff/route.ts`
   - Search: `user_metadata:`
   - Should see: `user_metadata: { role: 'staff', name }`

### "public.users row exists but has wrong data"

1. **Check:** Metadata sent from backend matches what trigger receives
   - Backend should send: `user_metadata: { name: "...", role: "staff" }`
   - Trigger reads: `NEW.raw_user_meta_data->>'name'` and `NEW.raw_user_meta_data->>'role'`

2. **Debug:** Run SQL to see what's in auth.users metadata:
   ```sql
   SELECT id, email, raw_user_meta_data 
   FROM auth.users 
   WHERE email LIKE '%trigger%' 
   LIMIT 1;
   ```

### "Getting type errors after update"

Run:
```bash
npm run build
```

Check error messages, they'll tell you what's wrong. Usually it's:
- Missing variable (userData was removed)
- Wrong property name

---

**Questions?** Check TRIGGER_SETUP_GUIDE.md for detailed explanation.
