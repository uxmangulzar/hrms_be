-- Jobs Table
CREATE TABLE IF NOT EXISTS jobs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    role_title VARCHAR(255) NOT NULL,
    budget VARCHAR(100),
    skills JSON, -- Storing as array of strings in JSON format
    location VARCHAR(255),
    experience VARCHAR(100),
    work_mode ENUM('remote', 'onsite', 'hybrid') DEFAULT 'onsite',
    assessment_format ENUM('1-stage', '2-stage', '3-stage') DEFAULT '1-stage',
    stage_mode ENUM('same_session', 'multi_stage') DEFAULT 'same_session',
    form_weight INT DEFAULT 0,
    video_weight INT DEFAULT 0,
    technical_weight INT DEFAULT 0,
    status ENUM('active', 'inactive', 'draft', 'closed') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
