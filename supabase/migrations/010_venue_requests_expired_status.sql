-- Add 'expired' to venue_requests.status allowed values

ALTER TABLE venue_requests DROP CONSTRAINT IF EXISTS venue_requests_status_check;

ALTER TABLE venue_requests
  ADD CONSTRAINT venue_requests_status_check
  CHECK (status IN ('pending', 'approved', 'rejected', 'expired'));
