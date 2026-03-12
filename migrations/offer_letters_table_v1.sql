-- ============================================================
-- Offer Letters Table
-- Purpose: Store generated offer letters sent to candidates
-- ============================================================

CREATE TABLE IF NOT EXISTS offer_letters (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    application_id   INT NOT NULL,
    company_id       INT NOT NULL,

    -- Offer Details
    role             VARCHAR(255)  NOT NULL,
    salary           VARCHAR(100)  NOT NULL,           -- e.g. "150,000 PKR/month"
    joining_date     DATE          NOT NULL,
    additional_notes TEXT          DEFAULT NULL,       -- any extra message from company

    -- Secure token for candidate response link
    response_token   VARCHAR(255)  UNIQUE NOT NULL,    -- UUID based unique token
    token_expires_at DATETIME      NOT NULL,           -- link expiry (default: 7 days)

    -- Candidate Response
    status           ENUM('sent', 'accepted', 'rejected') NOT NULL DEFAULT 'sent',
    responded_at     DATETIME      DEFAULT NULL,       -- when candidate responded

    -- Timestamps
    created_at       TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Foreign Keys
    FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
