-- Supabase Database Schema for Shifts Deal Pro
-- Run this in your local Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT CHECK (role IN ('renter', 'owner', 'admin')) DEFAULT 'renter',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Venues table
CREATE TABLE IF NOT EXISTS venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL,
  images TEXT[] DEFAULT ARRAY[]::TEXT[],
  address_street TEXT NOT NULL,
  address_city TEXT NOT NULL,
  address_state TEXT NOT NULL,
  address_pincode TEXT NOT NULL,
  address_country TEXT DEFAULT 'India',
  capacity_min INTEGER NOT NULL,
  capacity_max INTEGER NOT NULL,
  pricing_hourly DECIMAL(10,2) NOT NULL,
  pricing_half_day DECIMAL(10,2),
  pricing_full_day DECIMAL(10,2),
  amenities TEXT[] DEFAULT ARRAY[]::TEXT[],
  availability TEXT DEFAULT 'available',
  rating DECIMAL(3,2) DEFAULT 0.0,
  reviews_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE NOT NULL,
  renter_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  event_name TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_description TEXT,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  attendees INTEGER NOT NULL,
  organization_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  upi_id TEXT NOT NULL,
  special_requirements TEXT,
  kyc_document_type TEXT NOT NULL,
  kyc_document_url TEXT NOT NULL,
  kyc_face_photo_url TEXT NOT NULL,
  contract_data JSONB,
  signature TEXT NOT NULL,
  base_price DECIMAL(10,2),
  platform_fee DECIMAL(10,2),
  subtotal DECIMAL(10,2),
  gst_amount DECIMAL(10,2),
  total_amount DECIMAL(10,2) NOT NULL,
  deposit_amount DECIMAL(10,2) NOT NULL,
  balance_amount DECIMAL(10,2) NOT NULL,
  status TEXT CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')) DEFAULT 'pending',
  payment_status TEXT CHECK (payment_status IN ('pending', 'deposit_paid', 'fully_paid')) DEFAULT 'pending',
  deposit_paid BOOLEAN DEFAULT FALSE,
  deposit_paid_at TIMESTAMP WITH TIME ZONE,
  balance_paid BOOLEAN DEFAULT FALSE,
  balance_paid_at TIMESTAMP WITH TIME ZONE,
  follow_up_sent BOOLEAN DEFAULT FALSE,
  follow_up_sent_at TIMESTAMP WITH TIME ZONE,
  razorpay_payment_id TEXT,
  razorpay_order_id TEXT,
  razorpay_invoice_id TEXT,
  razorpay_invoice_status TEXT,
  razorpay_invoice_url TEXT,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_venues_city ON venues(address_city);
CREATE INDEX IF NOT EXISTS idx_venues_type ON venues(type);
CREATE INDEX IF NOT EXISTS idx_venues_owner ON venues(owner_id);
CREATE INDEX IF NOT EXISTS idx_bookings_venue ON bookings(venue_id);
CREATE INDEX IF NOT EXISTS idx_bookings_renter ON bookings(renter_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

-- Create storage buckets for images
-- Run these in Supabase Storage section or via API
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('venue-images', 'venue-images', true),
  ('kyc-documents', 'kyc-documents', true),
  ('kyc-photos', 'kyc-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for venue images (public read)
CREATE POLICY "Public Access for Venue Images"
ON storage.objects FOR SELECT
USING (bucket_id = 'venue-images');

CREATE POLICY "Authenticated users can upload venue images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'venue-images' AND auth.role() = 'authenticated');

-- Storage policies for KYC documents (public read for owners to view)
CREATE POLICY "Public read for KYC documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'kyc-documents');

CREATE POLICY "Anyone can upload KYC documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'kyc-documents');

CREATE POLICY "Service role can delete KYC documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'kyc-documents');

-- Storage policies for KYC photos (public read for owners to view)
CREATE POLICY "Public read for KYC photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'kyc-photos');

CREATE POLICY "Anyone can upload KYC photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'kyc-photos');

CREATE POLICY "Service role can delete KYC photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'kyc-photos');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to auto-update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_venues_updated_at BEFORE UPDATE ON venues
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view all users" ON users FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON users FOR INSERT
  WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE
  USING (auth.uid() = id);

-- Venues policies
CREATE POLICY "Anyone can view available venues" ON venues FOR SELECT USING (true);
CREATE POLICY "Owners can insert their venues" ON venues FOR INSERT
  WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners can update their venues" ON venues FOR UPDATE
  USING (auth.uid() = owner_id);
CREATE POLICY "Owners can delete their venues" ON venues FOR DELETE
  USING (auth.uid() = owner_id);

-- Bookings policies
CREATE POLICY "Users can view their own bookings" ON bookings FOR SELECT
  USING (auth.uid() = renter_id OR auth.uid() IN (
    SELECT owner_id FROM venues WHERE id = bookings.venue_id
  ));
CREATE POLICY "Renters can create bookings" ON bookings FOR INSERT
  WITH CHECK (auth.uid() = renter_id);
CREATE POLICY "Users can update their own bookings" ON bookings FOR UPDATE
  USING (auth.uid() = renter_id OR auth.uid() IN (
    SELECT owner_id FROM venues WHERE id = bookings.venue_id
  ));
