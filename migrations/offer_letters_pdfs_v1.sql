-- Add PDF paths to offer_letters table
ALTER TABLE offer_letters 
ADD COLUMN offer_letter_url     VARCHAR(555) DEFAULT NULL, -- Path to generated PDF
ADD COLUMN signed_document_url VARCHAR(555) DEFAULT NULL  -- Path to candidate's signed version;
