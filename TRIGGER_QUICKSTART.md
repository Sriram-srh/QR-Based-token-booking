# ⚡ 5-MINUTE QUICK START: Trigger Setup

**Goal:** Get PostgreSQL trigger working in 5 minutes.

---

## 🟢 Step 1: Copy SQL (1 min)

1. Open file: [scripts/06-auth-trigger-auto-sync.sql](scripts/06-auth-trigger-auto-sync.sql)
2. Select ALL (Ctrl+A)
3. Copy (Ctrl+C)

---

## 🟢 Step 2: Run in Supabase (2 min)

1. Go to: https://app.supabase.com
2. Select your project
3. Click **SQL Editor** (left sidebar)
4. Click **New Query** (blue button)
5. Paste SQL (Ctrl+V)
6. Click **RUN** (top-right, blue button)

### Expected Output
```
✓ CREATE FUNCTION
✓ DROP TRIGGER
✓ CREATE TRIGGER
✓ ALTER TABLE
```

✅ **SUCCESS** - Trigger is live!

---

## 🟢 Step 3: Test it (2 min)

### Create Test Staff

1. Go to Admin Dashboard
2. Click **Staff Accounts** tab
3. Click **+ Add Staff**
4. Fill:
   - Name: `TEST-STAFF`
   - Email: `test-staff@example.com`
   - Employee #: `TEST001`
5. Click **Create**

### Verify in Supabase

1. Go to Supabase → **Tables**
2. Click **public.users**
3. Search for `test-staff@example.com`
4. ✅ Should see row with:
   - `name` = "TEST-STAFF"
   - `role` = "staff"

✅ **SUCCESS** - Auto-sync is working!

---

## 📋 What You Got

| What | Before | After |
|-----|--------|-------|
| Manual inserts | Yes (error-prone) | No (automatic)✅ |
| Code lines | 110+ | 91 (-19 lines) |
| Consistency | Manual | Automatic ✅ |
| Production-ready | ✅ | ✅✅ |

---

## 🆘 Troubleshooting

### "SQL gives error"
- Go to Supabase → SQL Editor → History
- See what failed
- Try running just the function part first

### "No row in public.users"
- Refresh page
- Check email is exact match
- Verify trigger exists:
  ```sql
  SELECT * FROM information_schema.triggers 
  WHERE trigger_name = 'on_auth_user_created';
  ```

### "Build error"
```bash
npm run build
```

If errors, they'll tell you what's wrong.

---

## 📚 Full Documentation

Need more details?
- **Setup:** [TRIGGER_SETUP_GUIDE.md](TRIGGER_SETUP_GUIDE.md)
- **Testing:** [TRIGGER_TESTING_GUIDE.md](TRIGGER_TESTING_GUIDE.md)
- **Architecture:** [TRIGGER_ARCHITECTURE_DIAGRAM.md](TRIGGER_ARCHITECTURE_DIAGRAM.md)

---

**That's it! 🎉 Your trigger is live.**

Next: Create a staff account and watch it auto-sync across 3 tables!
