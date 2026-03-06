-- Assessment Schedules / Sessions Table
CREATE TABLE IF NOT EXISTS assessment_schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    application_id INT NOT NULL,
    job_id INT NOT NULL,
    company_id INT NOT NULL,
    questions_id INT NOT NULL,
    
    scheduled_at DATETIME NOT NULL, -- When the link becomes accessible
    expires_at DATETIME NOT NULL,   -- When the link expires
    duration_minutes INT NOT NULL,  -- Total time allowed for the test once started (e.g., 30 mins)
    
    started_at DATETIME NULL,       -- When candidate actually clicks "Start"
    completed_at DATETIME NULL,     -- When candidate submits answers
    
    interview_details TEXT NULL,    -- Any additional info for scheduling
    status ENUM('scheduled', 'started', 'completed', 'expired') DEFAULT 'scheduled',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (questions_id) REFERENCES assessment_questions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
