-- Seed data for meal booking system

-- Insert sample users
INSERT INTO users (id, email, password_hash, name, role, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'student1@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36DqxChG', 'John Doe', 'student', true),
('550e8400-e29b-41d4-a716-446655440002', 'student2@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36DqxChG', 'Jane Smith', 'student', true),
('550e8400-e29b-41d4-a716-446655440003', 'student3@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36DqxChG', 'Mike Johnson', 'student', true),
('550e8400-e29b-41d4-a716-446655440011', 'staff1@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36DqxChG', 'Alice Cooper', 'staff', true),
('550e8400-e29b-41d4-a716-446655440012', 'staff2@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36DqxChG', 'Bob Wilson', 'staff', true),
('550e8400-e29b-41d4-a716-446655440021', 'admin@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36DqxChG', 'Admin User', 'admin', true)
ON CONFLICT (email) DO NOTHING;

-- Insert sample students
INSERT INTO students (id, user_id, register_number, hostel, room, phone) VALUES
('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'REG001', 'Hostel A', '101', '9876543210'),
('650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'REG002', 'Hostel B', '202', '9876543211'),
('650e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', 'REG003', 'Hostel A', '103', '9876543212')
ON CONFLICT (register_number) DO NOTHING;

-- Insert sample counters
INSERT INTO counters (id, name, type, is_active) VALUES
('750e8400-e29b-41d4-a716-446655440001', 'Counter 1', 'Breakfast', true),
('750e8400-e29b-41d4-a716-446655440002', 'Counter 2', 'Lunch', true),
('750e8400-e29b-41d4-a716-446655440003', 'Counter 3', 'Dinner', true)
ON CONFLICT DO NOTHING;

-- Insert sample staff with counter assignments
INSERT INTO staff (id, user_id, employee_number) VALUES
('850e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440011', 'EMP001'),
('850e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440012', 'EMP002')
ON CONFLICT (employee_number) DO NOTHING;

UPDATE counters
SET assigned_staff_id = '850e8400-e29b-41d4-a716-446655440001'
WHERE id = '750e8400-e29b-41d4-a716-446655440001';

UPDATE counters
SET assigned_staff_id = '850e8400-e29b-41d4-a716-446655440002'
WHERE id = '750e8400-e29b-41d4-a716-446655440002';

-- Insert sample menu items
INSERT INTO menu_items (id, name, cost, max_quantity, is_active) VALUES
('950e8400-e29b-41d4-a716-446655440001', 'Rice with Dal', 50.00, 1, true),
('950e8400-e29b-41d4-a716-446655440002', 'Roti (2 pieces)', 20.00, 2, true),
('950e8400-e29b-41d4-a716-446655440003', 'Mixed Vegetables', 40.00, 1, true),
('950e8400-e29b-41d4-a716-446655440004', 'Bread and Butter', 30.00, 1, true),
('950e8400-e29b-41d4-a716-446655440005', 'Tea/Coffee', 20.00, 1, true),
('950e8400-e29b-41d4-a716-446655440006', 'Eggs (2)', 25.00, 1, true),
('950e8400-e29b-41d4-a716-446655440007', 'Fruits', 35.00, 1, true),
('950e8400-e29b-41d4-a716-446655440008', 'Salad', 30.00, 1, true),
('950e8400-e29b-41d4-a716-446655440009', 'Chicken Curry', 80.00, 1, true),
('950e8400-e29b-41d4-a716-446655440010', 'Fish Fry', 90.00, 1, true)
ON CONFLICT DO NOTHING;

-- Insert sample meals
INSERT INTO meals (id, type, meal_date, booking_start, booking_end, max_quota, is_open) VALUES
-- Today's meals
('a50e8400-e29b-41d4-a716-446655440001', 'Breakfast', CURRENT_DATE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '2 hours', 100, true),
('a50e8400-e29b-41d4-a716-446655440002', 'Lunch', CURRENT_DATE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '4 hours', 150, true),
('a50e8400-e29b-41d4-a716-446655440003', 'Dinner', CURRENT_DATE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '6 hours', 120, true),

-- Tomorrow's meals
('a50e8400-e29b-41d4-a716-446655440004', 'Breakfast', CURRENT_DATE + INTERVAL '1 day', CURRENT_TIMESTAMP + INTERVAL '1 day', CURRENT_TIMESTAMP + INTERVAL '1 day 2 hours', 100, true),
('a50e8400-e29b-41d4-a716-446655440005', 'Lunch', CURRENT_DATE + INTERVAL '1 day', CURRENT_TIMESTAMP + INTERVAL '1 day', CURRENT_TIMESTAMP + INTERVAL '1 day 4 hours', 150, true),
('a50e8400-e29b-41d4-a716-446655440006', 'Dinner', CURRENT_DATE + INTERVAL '1 day', CURRENT_TIMESTAMP + INTERVAL '1 day', CURRENT_TIMESTAMP + INTERVAL '1 day 6 hours', 120, true)
ON CONFLICT (type, meal_date) DO NOTHING;

-- Insert meal menu items (breakfast items)
INSERT INTO meal_menu_items (meal_id, menu_item_id) VALUES
('a50e8400-e29b-41d4-a716-446655440001', '950e8400-e29b-41d4-a716-446655440004'),
('a50e8400-e29b-41d4-a716-446655440001', '950e8400-e29b-41d4-a716-446655440005'),
('a50e8400-e29b-41d4-a716-446655440001', '950e8400-e29b-41d4-a716-446655440006'),
('a50e8400-e29b-41d4-a716-446655440001', '950e8400-e29b-41d4-a716-446655440007'),

-- Lunch items
('a50e8400-e29b-41d4-a716-446655440002', '950e8400-e29b-41d4-a716-446655440001'),
('a50e8400-e29b-41d4-a716-446655440002', '950e8400-e29b-41d4-a716-446655440002'),
('a50e8400-e29b-41d4-a716-446655440002', '950e8400-e29b-41d4-a716-446655440003'),
('a50e8400-e29b-41d4-a716-446655440002', '950e8400-e29b-41d4-a716-446655440008'),

-- Dinner items
('a50e8400-e29b-41d4-a716-446655440003', '950e8400-e29b-41d4-a716-446655440001'),
('a50e8400-e29b-41d4-a716-446655440003', '950e8400-e29b-41d4-a716-446655440002'),
('a50e8400-e29b-41d4-a716-446655440003', '950e8400-e29b-41d4-a716-446655440009')
ON CONFLICT (meal_id, menu_item_id) DO NOTHING;

-- Create audit log entries
INSERT INTO audit_logs (id, action, user_id, user_role, details) VALUES
(gen_random_uuid(), 'DATABASE_INITIALIZATION', '550e8400-e29b-41d4-a716-446655440021', 'admin', '{"message": "Database initialized with sample data"}');
