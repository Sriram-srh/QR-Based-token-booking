# Quick Start Guide - 5 Minutes to Working System

## Step 1: Environment Setup (1 min)

```bash
# Copy example env file
cp .env.example .env.local

# Edit .env.local and add your Supabase credentials:
# NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
# SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## Step 2: Install Dependencies (1 min)

```bash
pnpm install
```

## Step 3: Database Setup (2 mins)

1. **Go to Supabase SQL Editor** in your project dashboard
2. **Copy entire content** of `scripts/01-init-database.sql`
3. **Paste & Execute** in Supabase SQL Editor
4. **Wait for completion** (should complete in seconds)
5. **Repeat** for `scripts/02-seed-data.sql`

✅ **Done!** Your database is now ready with sample data.

## Step 4: Start Application (1 min)

```bash
pnpm dev
# Open http://localhost:3000
```

## Test Immediately

Use these credentials to login:

### Student
- **Email**: `student1@example.com`
- **Password**: `password123`

### Staff
- **Email**: `staff1@example.com`
- **Password**: `password123`

---

## What to Test

### As Student (2 minutes)
1. Login with student credentials
2. Click "Book Token"
3. Select meal type (Lunch, Breakfast, or Dinner)
4. Click "Create Token"
5. **See QR code** generated and displayed
6. Click menu or "My Tokens" to see your QR codes

### As Staff (3 minutes)
1. Login with staff credentials
2. Click "Verification" or "Scan QR"
3. **Allow camera access** when prompted
4. Point camera at QR code from student's screen
5. **Token automatically verified** and marked as USED
6. See confirmation message

---

## Verify Everything Works

✅ **Database**: Check if tables exist in Supabase
✅ **Login**: Sign in successfully with test credentials
✅ **QR Generation**: See QR code in student interface
✅ **QR Scanning**: Scan QR with staff interface
✅ **Verification**: Token marked as USED after scan

---

## Common Issues & Quick Fixes

| Issue | Solution |
|-------|----------|
| "Invalid email or password" | Use credentials from above, ensure 02-seed-data.sql was executed |
| Database error | Copy entire SQL file content exactly, paste in Supabase SQL Editor |
| Camera not working | Use HTTPS or localhost, check browser permissions |
| QR not scanning | Ensure good lighting, hold camera steady, 20-30cm from QR |
| Module not found | Run `pnpm install` again, clear `.next` folder |

---

## File Locations

- **Database Setup**: `scripts/01-init-database.sql` & `scripts/02-seed-data.sql`
- **Detailed Guide**: `DATABASE_SETUP.md`
- **Full Summary**: `IMPLEMENTATION_SUMMARY.md`
- **Environment**: `.env.local` (create from `.env.example`)

---

## Next Steps After Testing

1. **Customize** - Update logos, colors, app name
2. **Add Users** - Create real student/staff accounts
3. **Configure** - Adjust meal times and prices
4. **Deploy** - Push to Vercel with Supabase integration
5. **Scale** - Add more features like analytics, notifications

---

## Need More Help?

- Full database setup guide: See `DATABASE_SETUP.md`
- API documentation: See `IMPLEMENTATION_SUMMARY.md`
- Code explanation: Check comments in `lib/qr-utils.ts`
- Testing utilities: Review `components/qr/qr-test.tsx`

---

## Success Indicators

You'll know it's working when you see:
- ✅ Student dashboard with "Book Token" button
- ✅ Generated QR code displays on screen
- ✅ Staff can scan QR with camera
- ✅ Token status changes from "VALID" to "USED"
- ✅ No errors in browser console

**Congratulations! Your meal token system is now live! 🎉**
