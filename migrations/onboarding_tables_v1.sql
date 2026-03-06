CREATE TABLE IF NOT EXISTS plans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    features TEXT,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
-- Add onboarding columns to companies
ALTER TABLE companies ADD COLUMN plan_id INT;
ALTER TABLE companies ADD COLUMN onboarding_step ENUM('plan_selection', 'wizard_setup', 'completed') DEFAULT 'plan_selection';
ALTER TABLE companies ADD COLUMN onboarding_completed_at TIMESTAMP NULL;
ALTER TABLE companies ADD CONSTRAINT fk_company_plan FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE SET NULL;
-- Departments Table
CREATE TABLE IF NOT EXISTS departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
-- Custom Roles Table
CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    permissions JSON,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
-- Working Hours / Shifts
CREATE TABLE IF NOT EXISTS working_hours (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    shift_name VARCHAR(100) DEFAULT 'Standard',
    day_of_week ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    grace_period_minutes INT DEFAULT 0,
    is_off_day BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
-- Leave Rules
CREATE TABLE IF NOT EXISTS leave_rules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    leave_type VARCHAR(100) NOT NULL, -- e.g., Sick, Casual, Annual
    count_per_year INT NOT NULL,
    is_paid BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
-- Late & Warning Rules/Thresholds
CREATE TABLE IF NOT EXISTS company_rules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    rule_type ENUM('late_rule', 'warning_threshold', 'interview_weight', 'ai_config') NOT NULL,
    rule_key VARCHAR(100) NOT NULL,
    rule_value JSON NOT NULL,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
-- Initial Plans data
INSERT IGNORE INTO plans (name, price, features) VALUES 
('Basic', 0.00, '{"max_employees": 10, "ai_features": false}'),
('Standard', 49.99, '{"max_employees": 50, "ai_features": true}'),
('Enterprise', 199.99, '{"max_employees": "unlimited", "ai_features": true}');
