-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'staff', 'admin')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create students table
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  register_number VARCHAR(50) UNIQUE NOT NULL,
  hostel VARCHAR(100),
  room VARCHAR(50),
  photo_url TEXT,
  phone VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create staff table
CREATE TABLE IF NOT EXISTS staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  employee_number VARCHAR(50) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create counters table
CREATE TABLE IF NOT EXISTS counters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  tokens_served INTEGER DEFAULT 0,
  assigned_staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create menu items table
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  cost DECIMAL(10, 2) NOT NULL,
  max_quantity INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create meals table
CREATE TABLE IF NOT EXISTS meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(20) NOT NULL CHECK (type IN ('Breakfast', 'Lunch', 'Dinner')),
  meal_date DATE NOT NULL,
  booking_start TIMESTAMP WITH TIME ZONE NOT NULL,
  booking_end TIMESTAMP WITH TIME ZONE NOT NULL,
  max_quota INTEGER NOT NULL,
  booked_count INTEGER DEFAULT 0,
  is_open BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(type, meal_date)
);

-- Create meal menu junction table (many-to-many)
CREATE TABLE IF NOT EXISTS meal_menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id UUID NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  quantity_limit INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(meal_id, menu_item_id)
);

ALTER TABLE meal_menu_items ADD COLUMN IF NOT EXISTS quantity_limit INTEGER;

-- Create meal tokens table
CREATE TABLE IF NOT EXISTS meal_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  meal_type VARCHAR(20) NOT NULL CHECK (meal_type IN ('Breakfast', 'Lunch', 'Dinner')),
  status VARCHAR(20) NOT NULL CHECK (status IN ('VALID', 'USED', 'EXPIRED', 'CANCELLED')) DEFAULT 'VALID',
  qr_code TEXT NOT NULL UNIQUE,
  backup_code VARCHAR(16) UNIQUE,
  qr_code_image TEXT,
  total_cost DECIMAL(10, 2) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  scanned_at TIMESTAMP WITH TIME ZONE,
  counter_id UUID REFERENCES counters(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create meal token items table (booked items for each token)
CREATE TABLE IF NOT EXISTS meal_token_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id UUID NOT NULL REFERENCES meal_tokens(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  cost DECIMAL(10, 2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create pre-bookings table
CREATE TABLE IF NOT EXISTS pre_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  meal_date DATE NOT NULL,
  meal_type VARCHAR(20) NOT NULL CHECK (meal_type IN ('Breakfast', 'Lunch', 'Dinner')),
  status VARCHAR(20) NOT NULL CHECK (status IN ('PENDING', 'ACTIVE', 'SERVED', 'CANCELLED')) DEFAULT 'PENDING',
  total_cost DECIMAL(10, 2) NOT NULL,
  qr_token_id UUID REFERENCES meal_tokens(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create pre-booking items table
CREATE TABLE IF NOT EXISTS pre_booking_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pre_booking_id UUID NOT NULL REFERENCES pre_bookings(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  cost DECIMAL(10, 2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action VARCHAR(255) NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_role VARCHAR(20),
  details JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_students_user_id ON students(user_id);
CREATE INDEX idx_students_register_number ON students(register_number);
CREATE INDEX idx_staff_user_id ON staff(user_id);
CREATE INDEX idx_meals_date ON meals(meal_date);
CREATE INDEX idx_meals_type_date ON meals(type, meal_date);
CREATE INDEX idx_meal_tokens_student ON meal_tokens(student_id);
CREATE INDEX idx_meal_tokens_status ON meal_tokens(status);
CREATE INDEX idx_meal_tokens_qr ON meal_tokens(qr_code);
CREATE INDEX idx_meal_tokens_backup_code ON meal_tokens(backup_code);
CREATE INDEX idx_meal_tokens_expires ON meal_tokens(expires_at);
CREATE INDEX idx_pre_bookings_student ON pre_bookings(student_id);
CREATE INDEX idx_pre_bookings_date ON pre_bookings(meal_date);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON staff FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_counters_updated_at BEFORE UPDATE ON counters FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON menu_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_meals_updated_at BEFORE UPDATE ON meals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_meal_tokens_updated_at BEFORE UPDATE ON meal_tokens FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pre_bookings_updated_at BEFORE UPDATE ON pre_bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
