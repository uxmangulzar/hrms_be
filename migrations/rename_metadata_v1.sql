-- Rename form_responses to metadata in applications table
ALTER TABLE applications CHANGE COLUMN form_responses metadata JSON;