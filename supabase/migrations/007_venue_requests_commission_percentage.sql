ALTER TABLE public.venue_requests
  ADD COLUMN IF NOT EXISTS commission_percentage DECIMAL(5,2) DEFAULT 0.00;
