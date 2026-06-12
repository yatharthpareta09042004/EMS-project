-- PostgreSQL Database Schema for Enterprise Employee Management System

-- Enable pgcrypto for UUID generation if needed, though gen_random_uuid() is built-in for PG 13+
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- DROP TABLES IF EXISTS TO PREVENT CONFLICTS ON FRESH DB INITS
DROP VIEW IF EXISTS v_asset_details CASCADE;
DROP VIEW IF EXISTS v_leave_summary CASCADE;
DROP VIEW IF EXISTS v_employee_details CASCADE;

DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS asset_history CASCADE;
DROP TABLE IF EXISTS asset_allocations CASCADE;
DROP TABLE IF EXISTS assets CASCADE;
DROP TABLE IF EXISTS approval_history CASCADE;
DROP TABLE IF EXISTS leave_applications CASCADE;
DROP TABLE IF EXISTS leave_balance CASCADE;
DROP TABLE IF EXISTS leave_types CASCADE;
DROP TABLE IF EXISTS employee_skills CASCADE;
DROP TABLE IF EXISTS skills CASCADE;
DROP TABLE IF EXISTS employee_images CASCADE;
DROP TABLE IF EXISTS employee_profiles CASCADE;
DROP TABLE IF EXISTS departments CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. USERS TABLE
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'hr', 'manager', 'employee')),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. DEPARTMENTS TABLE
CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. EMPLOYEE PROFILES TABLE
CREATE TABLE employee_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    department_id INT REFERENCES departments(id) ON DELETE SET NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    salary DECIMAL(12, 2) NOT NULL DEFAULT 0.00 CHECK (salary >= 0),
    designation VARCHAR(100) NOT NULL,
    joined_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. EMPLOYEE IMAGES TABLE (FOR PHOTO, RESUME, CERTIFICATES, AADHAR)
CREATE TABLE employee_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_profile_id UUID NOT NULL REFERENCES employee_profiles(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('profile_photo', 'resume', 'certificates', 'aadhar_card')),
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    file_size INT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. SKILLS TABLE
CREATE TABLE skills (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
);

-- 6. EMPLOYEE SKILLS TABLE (MANY TO MANY)
CREATE TABLE employee_skills (
    employee_profile_id UUID REFERENCES employee_profiles(id) ON DELETE CASCADE,
    skill_id INT REFERENCES skills(id) ON DELETE CASCADE,
    proficiency_level VARCHAR(50) NOT NULL CHECK (proficiency_level IN ('beginner', 'intermediate', 'expert')),
    PRIMARY KEY (employee_profile_id, skill_id)
);

-- 7. LEAVE TYPES TABLE
CREATE TABLE leave_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    default_days INT NOT NULL DEFAULT 0 CHECK (default_days >= 0)
);

-- 8. LEAVE BALANCE TABLE
CREATE TABLE leave_balance (
    id SERIAL PRIMARY KEY,
    employee_profile_id UUID REFERENCES employee_profiles(id) ON DELETE CASCADE,
    leave_type_id INT REFERENCES leave_types(id) ON DELETE CASCADE,
    total_days INT NOT NULL DEFAULT 0 CHECK (total_days >= 0),
    used_days INT NOT NULL DEFAULT 0 CHECK (used_days >= 0),
    pending_days INT NOT NULL DEFAULT 0 CHECK (pending_days >= 0),
    year INT NOT NULL,
    UNIQUE (employee_profile_id, leave_type_id, year)
);

-- 9. LEAVE APPLICATIONS TABLE
CREATE TABLE leave_applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_profile_id UUID REFERENCES employee_profiles(id) ON DELETE CASCADE,
    leave_type_id INT REFERENCES leave_types(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending_manager' CHECK (status IN ('pending_manager', 'pending_hr', 'approved', 'rejected')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_dates CHECK (end_date >= start_date)
);

-- 10. APPROVAL HISTORY TABLE
CREATE TABLE approval_history (
    id SERIAL PRIMARY KEY,
    leave_application_id UUID REFERENCES leave_applications(id) ON DELETE CASCADE,
    approver_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL CHECK (action IN ('manager_approved', 'manager_rejected', 'hr_approved', 'hr_rejected')),
    comments TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. ASSETS TABLE
CREATE TABLE assets (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    asset_type VARCHAR(50) NOT NULL CHECK (asset_type IN ('Laptop', 'Monitor', 'Mouse', 'ID Card', 'Access Card')),
    serial_number VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'available' CHECK (status IN ('available', 'allocated', 'under_repair', 'retired')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. ASSET ALLOCATIONS TABLE
CREATE TABLE asset_allocations (
    id SERIAL PRIMARY KEY,
    asset_id INT REFERENCES assets(id) ON DELETE CASCADE,
    employee_profile_id UUID REFERENCES employee_profiles(id) ON DELETE CASCADE,
    allocated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    returned_at TIMESTAMP,
    condition_on_allocation TEXT NOT NULL,
    condition_on_return TEXT,
    CONSTRAINT check_returned CHECK (returned_at IS NULL OR returned_at >= allocated_at)
);

-- 13. ASSET HISTORY TABLE
CREATE TABLE asset_history (
    id SERIAL PRIMARY KEY,
    asset_id INT REFERENCES assets(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('create', 'allocate', 'return', 'update_status')),
    description TEXT NOT NULL,
    performed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 14. NOTIFICATIONS TABLE
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    reference_id UUID,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 15. AUDIT LOGS TABLE
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('CREATE', 'UPDATE', 'DELETE')),
    table_name VARCHAR(100) NOT NULL,
    old_data JSONB,
    new_data JSONB,
    ip_address VARCHAR(50),
    user_agent VARCHAR(255),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- INDEXES FOR DATABASE OPTIMIZATION
-- ==========================================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_employee_profiles_names ON employee_profiles(first_name, last_name);
CREATE INDEX idx_employee_profiles_dept ON employee_profiles(department_id);
CREATE INDEX idx_leave_apps_profile ON leave_applications(employee_profile_id);
CREATE INDEX idx_leave_apps_status ON leave_applications(status);
CREATE INDEX idx_asset_alloc_profile ON asset_allocations(employee_profile_id);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);

-- ==========================================
-- VIEWS FOR COMPLEX AGGREGATIONS
-- ==========================================

-- View 1: Detailed Employee Profiles with department, user account info, and active indicators
CREATE OR REPLACE VIEW v_employee_details AS
SELECT 
    ep.id AS employee_profile_id,
    ep.user_id,
    u.email,
    u.role,
    u.status AS account_status,
    ep.first_name,
    ep.last_name,
    (ep.first_name || ' ' || ep.last_name) AS full_name,
    ep.phone,
    ep.address,
    ep.salary,
    ep.designation,
    ep.joined_date,
    d.id AS department_id,
    d.name AS department_name,
    (SELECT json_agg(json_build_object('skill_id', s.id, 'skill_name', s.name, 'proficiency', es.proficiency_level))
     FROM employee_skills es
     JOIN skills s ON es.skill_id = s.id
     WHERE es.employee_profile_id = ep.id) AS skills,
    (SELECT count(aa.id) FROM asset_allocations aa WHERE aa.employee_profile_id = ep.id AND aa.returned_at IS NULL) AS active_assets_count
FROM employee_profiles ep
JOIN users u ON ep.user_id = u.id
LEFT JOIN departments d ON ep.department_id = d.id;

-- View 2: Detailed Leave Request View
CREATE OR REPLACE VIEW v_leave_summary AS
SELECT 
    la.id AS leave_application_id,
    la.employee_profile_id,
    (ep.first_name || ' ' || ep.last_name) AS employee_name,
    d.name AS department_name,
    la.leave_type_id,
    lt.name AS leave_type_name,
    la.start_date,
    la.end_date,
    (la.end_date - la.start_date + 1) AS requested_days,
    la.reason,
    la.status,
    la.created_at,
    la.updated_at
FROM leave_applications la
JOIN employee_profiles ep ON la.employee_profile_id = ep.id
JOIN leave_types lt ON la.leave_type_id = lt.id
LEFT JOIN departments d ON ep.department_id = d.id;

-- View 3: Detailed Asset Overview
CREATE OR REPLACE VIEW v_asset_details AS
SELECT 
    a.id AS asset_id,
    a.name AS asset_name,
    a.asset_type,
    a.serial_number,
    a.status AS asset_status,
    aa.id AS allocation_id,
    aa.employee_profile_id,
    (ep.first_name || ' ' || ep.last_name) AS allocated_to_name,
    aa.allocated_at,
    aa.returned_at,
    aa.condition_on_allocation,
    aa.condition_on_return
FROM assets a
LEFT JOIN asset_allocations aa ON a.id = aa.asset_id AND aa.returned_at IS NULL
LEFT JOIN employee_profiles ep ON aa.employee_profile_id = ep.id;
