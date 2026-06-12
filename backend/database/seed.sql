-- Seed Data for Enterprise Employee Management System
-- Hashed password is for 'password123' using bcrypt ($2a$10$KPVYdM9Jp3P1c8o5aU9NfeV.aGvFk1Xy/v2G/pWpI/q4nB9/217p2)

-- 1. SEED DEPARTMENTS
INSERT INTO departments (id, name, description) VALUES
(1, 'Engineering', 'Core software engineering, UI/UX, QA, and devops team.'),
(2, 'Human Resources', 'Talent acquisition, employee engagement, and payroll management.'),
(3, 'Finance', 'Corporate accounting, financial planning, tax and audits.'),
(4, 'Sales & Marketing', 'Brand management, sales execution, and customer success.')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

-- Reset SERIAL department sequence
SELECT setval('departments_id_seq', (SELECT MAX(id) FROM departments));

-- 2. SEED USERS (Fixed UUIDs for consistency)
INSERT INTO users (id, email, password_hash, role, status) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'admin@company.com', '$2a$10$/04VXb3RA.bhI2hDNYYk4.blwaDQpu.D9qLEmGKadmO6TYNMPvawq', 'admin', 'active'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'hr@company.com', '$2a$10$/04VXb3RA.bhI2hDNYYk4.blwaDQpu.D9qLEmGKadmO6TYNMPvawq', 'hr', 'active'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'manager@company.com', '$2a$10$/04VXb3RA.bhI2hDNYYk4.blwaDQpu.D9qLEmGKadmO6TYNMPvawq', 'manager', 'active'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'employee@company.com', '$2a$10$/04VXb3RA.bhI2hDNYYk4.blwaDQpu.D9qLEmGKadmO6TYNMPvawq', 'employee', 'active')
ON CONFLICT (id) DO NOTHING;

-- 3. SEED EMPLOYEE PROFILES
INSERT INTO employee_profiles (id, user_id, department_id, first_name, last_name, phone, address, salary, designation, joined_date) VALUES
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 1, 'Sarah', 'Kerrigan', '+15550101', '101 Admin Citadel, Sector 4', 150000.00, 'Chief Technology Officer', '2022-01-15'),
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 2, 'Jim', 'Raynor', '+15550202', '204 HR Outpost, Sector 2', 90000.00, 'HR Director', '2023-03-10'),
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 1, 'Artanis', 'Hierarch', '+15550303', '309 Engineering Sanctum', 115000.00, 'Engineering Manager', '2023-06-01'),
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 1, 'Tassadar', 'Executor', '+15550404', '412 Developer Nexus', 80000.00, 'Senior React Developer', '2024-02-18')
ON CONFLICT (id) DO NOTHING;

-- 4. SEED SKILLS
INSERT INTO skills (id, name) VALUES
(1, 'React'),
(2, 'Node.js'),
(3, 'PostgreSQL'),
(4, 'Docker'),
(5, 'Tailwind CSS'),
(6, 'Talent Acquisition'),
(7, 'Financial Auditing')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

SELECT setval('skills_id_seq', (SELECT MAX(id) FROM skills));

-- 5. SEED EMPLOYEE SKILLS
INSERT INTO employee_skills (employee_profile_id, skill_id, proficiency_level) VALUES
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 1, 'expert'),
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 2, 'expert'),
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 4, 'expert'),
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 6, 'expert'),
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 2, 'expert'),
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 3, 'expert'),
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 1, 'expert'),
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 5, 'intermediate')
ON CONFLICT (employee_profile_id, skill_id) DO NOTHING;

-- 6. SEED LEAVE TYPES
INSERT INTO leave_types (id, name, description, default_days) VALUES
(1, 'Casual Leave', 'Short-term personal leave for unexpected events.', 12),
(2, 'Sick Leave', 'Medical leave for self or family members.', 10),
(3, 'Earned Leave', 'Annual vacation leaves earned over time.', 15),
(4, 'Maternity Leave', 'Paid parental leave for mothers.', 90),
(5, 'Paternity Leave', 'Paid parental leave for fathers.', 10)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, default_days = EXCLUDED.default_days;

SELECT setval('leave_types_id_seq', (SELECT MAX(id) FROM leave_types));

-- 7. SEED LEAVE BALANCE (Initialize 2026 Balances)
INSERT INTO leave_balance (employee_profile_id, leave_type_id, total_days, used_days, pending_days, year) VALUES
-- CTO (Sarah Kerrigan)
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 1, 12, 2, 0, 2026),
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 2, 10, 1, 0, 2026),
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 3, 15, 0, 0, 2026),
-- HR (Jim Raynor)
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 1, 12, 1, 1, 2026),
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 2, 10, 0, 0, 2026),
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 3, 15, 4, 0, 2026),
-- Manager (Artanis)
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 1, 12, 0, 0, 2026),
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 2, 10, 2, 0, 2026),
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 3, 15, 2, 1, 2026),
-- Employee (Tassadar)
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 1, 12, 3, 2, 2026),
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 2, 10, 0, 0, 2026),
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 3, 15, 0, 0, 2026)
ON CONFLICT (employee_profile_id, leave_type_id, year) DO NOTHING;

-- 8. SEED ASSETS
INSERT INTO assets (id, name, asset_type, serial_number, status) VALUES
(1, 'MacBook Pro 16 Inch', 'Laptop', 'LAP-MBP-2026-001', 'allocated'),
(2, 'Lenovo ThinkPad X1 Carbon', 'Laptop', 'LAP-TP-2026-002', 'allocated'),
(3, 'Dell UltraSharp 27 Monitor', 'Monitor', 'MON-DELL-27-001', 'allocated'),
(4, 'Logitech MX Master 3 Mouse', 'Mouse', 'MOU-LOGI-MX3-001', 'available'),
(5, 'Corporate Access Badge', 'Access Card', 'ACC-CARD-88291', 'allocated'),
(6, 'Corporate Access Badge 2', 'Access Card', 'ACC-CARD-88292', 'available')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, status = EXCLUDED.status;

SELECT setval('assets_id_seq', (SELECT MAX(id) FROM assets));

-- 9. SEED ASSET ALLOCATIONS
INSERT INTO asset_allocations (asset_id, employee_profile_id, allocated_at, condition_on_allocation) VALUES
(1, 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '2022-01-16 10:00:00', 'Brand new, sealed in box.'),
(2, 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', '2024-02-19 11:30:00', 'Excellent condition, minor scratch on chassis.'),
(3, 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', '2024-02-19 11:35:00', 'Brand new monitor.'),
(5, 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', '2023-06-01 09:00:00', 'Active access badge.')
ON CONFLICT DO NOTHING;
