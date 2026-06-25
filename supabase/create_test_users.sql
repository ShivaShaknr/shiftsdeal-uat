-- Create a test owner in Supabase Auth
-- Run this in Supabase Studio SQL Editor

-- First, create the auth user with a known password
-- Password: owner123 (this is the bcrypt hash for it)
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  created_at,
  updated_at,
  role,
  aud
)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'owner@shiftsdeal.com',
  crypt('owner123', gen_salt('bf')),
  NOW(),
  '{"name": "Venue Owner", "role": "owner"}'::jsonb,
  NOW(),
  NOW(),
  'authenticated',
  'authenticated'
)
ON CONFLICT (id) DO UPDATE SET
  encrypted_password = crypt('owner123', gen_salt('bf')),
  updated_at = NOW();

-- Also create a test renter
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  created_at,
  updated_at,
  role,
  aud
)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000000',
  'renter@shiftsdeal.com',
  crypt('renter123', gen_salt('bf')),
  NOW(),
  '{"name": "Test Renter", "role": "renter"}'::jsonb,
  NOW(),
  NOW(),
  'authenticated',
  'authenticated'
)
ON CONFLICT (id) DO UPDATE SET
  encrypted_password = crypt('renter123', gen_salt('bf')),
  updated_at = NOW();

-- Add users to public.users table
INSERT INTO public.users (id, email, name, role)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'owner@shiftsdeal.com', 'Venue Owner', 'owner'),
  ('00000000-0000-0000-0000-000000000002', 'renter@shiftsdeal.com', 'Test Renter', 'renter')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role;

-- Update venues to use the correct owner_id
UPDATE venues SET owner_id = '00000000-0000-0000-0000-000000000001';

SELECT 'Test accounts created!' as message;
SELECT '  Owner: owner@shiftsdeal.com / owner123' as credentials;
SELECT '  Renter: renter@shiftsdeal.com / renter123' as credentials;
