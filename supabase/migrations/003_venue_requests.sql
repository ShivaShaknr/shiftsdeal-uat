-- Venue Requests Table for pending venue submissions
-- Run this in your local Supabase SQL editor

-- Venue requests table (pending venues awaiting admin approval)
CREATE TABLE IF NOT EXISTS venue_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  
  -- Basic Info
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  capacity_min INTEGER NOT NULL,
  capacity_max INTEGER NOT NULL,
  
  -- Location
  address_street TEXT NOT NULL,
  address_city TEXT NOT NULL,
  address_state TEXT NOT NULL,
  address_pincode TEXT NOT NULL,
  address_country TEXT DEFAULT 'India',
  
  -- Photos
  images TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Pricing
  pricing_hourly DECIMAL(10,2) NOT NULL,
  pricing_half_day DECIMAL(10,2),
  pricing_full_day DECIMAL(10,2),
  security_deposit DECIMAL(10,2),
  
  -- Amenities & Rules
  amenities TEXT[] DEFAULT ARRAY[]::TEXT[],
  rules TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Request Status
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  admin_notes TEXT,
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_venue_requests_owner ON venue_requests(owner_id);
CREATE INDEX IF NOT EXISTS idx_venue_requests_status ON venue_requests(status);
CREATE INDEX IF NOT EXISTS idx_venue_requests_created ON venue_requests(created_at);

-- Trigger for updated_at
CREATE TRIGGER update_venue_requests_updated_at BEFORE UPDATE ON venue_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS policies
ALTER TABLE venue_requests ENABLE ROW LEVEL SECURITY;

-- Owners can view their own requests
CREATE POLICY "Owners can view their venue requests" ON venue_requests FOR SELECT
  USING ((select auth.uid()) = owner_id);

-- Owners can create requests
CREATE POLICY "Owners can create venue requests" ON venue_requests FOR INSERT
  WITH CHECK ((select auth.uid()) = owner_id);

-- Owners can update pending requests
CREATE POLICY "Owners can update pending requests" ON venue_requests FOR UPDATE
  USING ((select auth.uid()) = owner_id AND status = 'pending');
