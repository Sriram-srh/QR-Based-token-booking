-- ============================================================================
-- 🔥 PRODUCTION TRIGGER: Auto-sync auth.users → public.users
-- ============================================================================
-- When a new user is created in Supabase Auth (auth.users), this trigger
-- automatically creates a corresponding row in public.users with role and name
-- from user_metadata. No manual inserts needed!
--
-- HOW TO USE:
-- 1. Go to Supabase → SQL Editor
-- 2. Run this entire script
-- 3. Update backend: remove manual users table inserts
-- 4. Test: Create new staff/student and verify auto-creation
-- ============================================================================

-- Step 1: Create the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    true
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Drop existing trigger if it exists (safe cleanup)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Step 3: Create the trigger
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- Step 4: (OPTIONAL) Add foreign key constraint for data integrity
-- This ensures if an auth user is deleted, app user is also deleted
ALTER TABLE public.users
ADD CONSTRAINT users_auth_fk
FOREIGN KEY (id)
REFERENCES auth.users(id)
ON DELETE CASCADE
ON CONFLICT DO NOTHING;

-- ============================================================================
-- ✅ VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify everything is working:

-- Check trigger exists:
-- SELECT trigger_schema, trigger_name, event_object_table
-- FROM information_schema.triggers
-- WHERE event_object_table = 'users' AND trigger_schema = 'public';

-- Check function exists:
-- SELECT routine_name, routine_type
-- FROM information_schema.routines
-- WHERE routine_name = 'handle_new_user' AND routine_schema = 'public';

-- ============================================================================
-- 📋 WHAT THIS ENABLES
-- ============================================================================
-- BEFORE (old code):
--   1. Create auth.users → await createUser()
--   2. Manually insert users table → await users.insert()
--   3. Manually insert staff/students table → await staff.insert()
--
-- AFTER (with trigger):
--   1. Create auth.users → await createUser()  ← triggers handle_new_user()
--   2. Auto-insert users table ✅ (trigger does this!)
--   3. Manually insert staff/students table → await staff.insert()
--
-- Result: Backend code is CLEANER and LESS ERROR-PRONE
-- ============================================================================
