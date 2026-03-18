-- Create Interviews Table to track Zoom meetings and recordings
CREATE TABLE IF NOT EXISTS interviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    application_id INT NOT NULL,
    company_id INT NOT NULL,
    zoom_meeting_id VARCHAR(100) UNIQUE NOT NULL, -- Used to map Webhook events
    topic VARCHAR(255),
    start_time DATETIME,
    duration INT, -- Duration in minutes
    join_url TEXT,
    start_url TEXT, -- Host link for the interviewer
    recording_url TEXT DEFAULT NULL, -- Populated via Zoom Webhook (recording.completed)
    transcript_url TEXT DEFAULT NULL, -- Populated via Zoom Webhook
    status ENUM('scheduled', 'completed', 'cancelled') DEFAULT 'scheduled',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
