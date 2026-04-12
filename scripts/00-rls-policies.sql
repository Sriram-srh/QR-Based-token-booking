-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own data" ON users FOR SELECT
  USING (auth.uid()::text = id::text);

-- Students policies
CREATE POLICY "Students can view their own data" ON students FOR SELECT
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Students can update their own data" ON students FOR UPDATE
  USING (auth.uid()::text = user_id::text);

-- Staff policies
CREATE POLICY "Staff can view their own data" ON staff FOR SELECT
  USING (auth.uid()::text = user_id::text);

-- Meals policies (public read)
CREATE POLICY "Meals are viewable by all authenticated users" ON meals FOR SELECT
  USING (true);

-- Meal items policies (public read)
CREATE POLICY "Meal items are viewable by all authenticated users" ON meal_items FOR SELECT
  USING (true);

-- Meal tokens policies
CREATE POLICY "Students can view their own tokens" ON meal_tokens FOR SELECT
  USING (student_id IN (
    SELECT id FROM students WHERE user_id = auth.uid()::text
  ));

-- Counters policies
CREATE POLICY "Staff can view counters" ON counters FOR SELECT
  USING (true);

-- Audit logs policies
CREATE POLICY "Audit logs are internal only" ON audit_logs FOR SELECT
  USING (false);

CREATE POLICY "System can insert audit logs" ON audit_logs FOR INSERT
  WITH CHECK (true);
