# 🔧 MEAL TOGGLE DEBUG & FIX GUIDE

## 🎯 What Was Fixed

✅ **API Error Logging** - Now shows REAL database errors instead of `{}`
✅ **Toggle Endpoint** - Only updates `is_open` column (simplified, no extra fields)
✅ **Frontend Logging** - Console shows detailed status of each toggle attempt
✅ **State Refresh** - Local state updates after successful toggle

---

## 🚨 TEST PLAN (DO THIS EXACTLY)

### STEP 1: Open Browser DevTools Console

1. Login as admin
2. Right-click → **Inspect** → **Console tab**
3. Keep this open while testing
4. Look for logs starting with `[meal-management]` and `[api/meals/`

---

### STEP 2: Try Toggling a Meal OFF

1. Go to **Admin → Meal Management**
2. Click the toggle switch on any meal → Turn it OFF
3. **Check Console** - you should see:

```
[meal-management] Toggling meal-1 from true to false
[meal-management] ✅ Toggle success, refreshing: { success: true, data: {...} }
```

**If you see ❌ instead:**
```
[meal-management] ❌ Toggle failed: { status: 500, response: {...error details...} }
[api/meals/meal-1] DB ERROR (CRITICAL): { code: "??", message: "??", ... }
```

4. **COPY the error** and follow **SOLUTION SECTION** below

---

### STEP 3: Check Database

If toggle succeeds, verify in Supabase:

1. Go to [Supabase Dashboard](https://supabase.com)
2. Select your project
3. Go to **SQL Editor** → **New Query**
4. Run:

```sql
SELECT id, type, meal_date, is_open FROM meals LIMIT 5;
```

5. Check if `is_open` column changed for the meal you toggled

---

### STEP 4: Student View

1. Login as **different student**
2. Go to **Upcoming Menus**
3. Refresh page (or wait 30 seconds for auto-refresh)
4. Find the meal you toggled OFF
5. Should see `"Closed for Booking"` button (disabled)

---

## 🔍 DEBUGGING: MOST LIKELY CAUSES

### Cause #1: Missing `SUPABASE_SERVICE_ROLE_KEY`

**Symptom:**
```
DB ERROR: Missing Supabase server environment variables
```

**Fix:**
1. Go to Supabase Dashboard → Project Settings
2. Copy **Service Role Key** (secret, not anon key)
3. Add to your `.env.local`:
```
SUPABASE_SERVICE_ROLE_KEY=eyJ...yourkey...
```
4. Restart dev server: `npm run dev`

---

### Cause #2: RLS Policy Blocking Update

**Symptom:**
```
DB ERROR: message: "42501" or "new row violates row-level security policy"
```

**Fix - Add RLS Policy for Meals Update:**

Run this in Supabase SQL Editor:

```sql
-- Allow admins to update meals
CREATE POLICY "Admins can update meals" ON meals FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Or simpler: Allow service role (admin client) to bypass
-- (Service role always bypasses RLS, so this should work)
```

---

### Cause #3: Column Name Mismatch

**Symptom:**
```
DB ERROR: column "isOpen" does not exist
```

**Fix:**
Database uses snake_case: `is_open` (not `isOpen`)
- API is already using `is_open` ✅
- If error says different column, DB schema might be different

---

### Cause #4: Type Mismatch

**Symptom:**
```
DB ERROR: column "is_open" is of type boolean but expression is of type text
```

**Fix:**
Ensure you're sending boolean (not string):
```typescript
// ✅ CORRECT
{ is_open: true }    // boolean

// ❌ WRONG
{ is_open: "true" }  // string
```

---

## 📊 EXPECTED BEHAVIOR AFTER FIX

| Action | Frontend Console | Browser | Database |
|--------|-----------------|---------|----------|
| Click toggle OFF | `✅ Toggle success` | Button disabled | `is_open = false` |
| Click toggle ON | `✅ Toggle success` | Button enabled | `is_open = true` |
| Student refreshes | Shows "Closed" | Disabled button | Sees change |

---

## 🧪 LIVE ENDPOINT TEST

If console shows no logs, test API directly:

**Open PowerShell and run:**

```powershell
# Replace MEAL_ID with actual meal ID from database
$mealId = "your-meal-id"
$response = Invoke-WebRequest -Uri "http://localhost:3000/api/meals/$mealId" `
  -Method PATCH `
  -Headers @{ "Content-Type" = "application/json" } `
  -Body (ConvertTo-Json @{ is_open = $false })

$response.Content | ConvertFrom-Json
```

**Should return:**
```json
{
  "success": true,
  "data": {
    "id": "meal-id",
    "is_open": false,
    "..."
  }
}
```

---

## 📋 CHECKLIST BEFORE SUBMITTING ERROR

- [ ] `.env.local` has `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Dev server restarted after env change
- [ ] Console shows `[meal-management]` logs
- [ ] Toggled a meal and waited for response
- [ ] Copied exact error from console
- [ ] Checked Supabase SQL: `SELECT * FROM meals WHERE id = '...';`
- [ ] Verified RLS policy exists (or service role should bypass)

---

## 🎯 NEXT STEPS

**If toggle works:**
1. Test student view refreshes ✅
2. Test admin edits meal info ✅
3. Test quota updates ✅

**If toggle fails:**
1. Copy exact error from console
2. Check `.env.local` for service role key
3. Run SQL query to verify meals table exists
4. Check Supabase RLS policies

---

## 💻 ADMIN PANEL TEST SEQUENCE

```
1. Admin opens Meal Management
   ↓
2. Admin toggles a meal OFF
   → Console should show: ✅ Toggle success
   ↓
3. Admin opens in another tab as Student
   ↓
4. Student goes to Upcoming Menus
   → Meal should be visible
   → Button should say "Closed for Booking"
   → Button should be DISABLED
   ↓
5. Student tries to click button
   → Nothing happens (disabled) ✅
   ↓
6. Admin toggles meal back ON
   → Console should show: ✅ Toggle success
   ↓
7. Student refreshes (or waits 30s)
   → Button should change to "Pre-book Now"
   → Button should be ENABLED ✅
```

---

## 🚀 QUICK VERIFICATION (2 minutes)

```
Admin: Toggle meal OFF
  ↓
Check console for: [meal-management] ✅ Toggle success
  ↓
Student: Refresh Upcoming Menus
  ↓
See: Closed meal with disabled button ✅
  ↓
SUCCESS! ✅ System working
```

---

**Once this is working, the rest of the system (edit meal info, quota management, etc.) will also work!**
