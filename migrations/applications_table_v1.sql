-- Applications/Candidates Table
CREATE TABLE IF NOT EXISTS applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    job_id INT NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    location VARCHAR(255),
    resume_url VARCHAR(555), -- Path to the uploaded file
    resume_metadata JSON,    -- For parsed resume information (skills, AI scores, etc.)
    status ENUM('applied', 'screening', 'shortlisted', 'interview_scheduled', 'rejected', 'hired') DEFAULT 'applied',
    form_score DECIMAL(5, 2) DEFAULT 0.00,
    video_score DECIMAL(5, 2) DEFAULT 0.00,
    technical_score DECIMAL(5, 2) DEFAULT 0.00,
    overall_score DECIMAL(5, 2) DEFAULT 0.00,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS form_responses JSON AFTER resume_metadata;