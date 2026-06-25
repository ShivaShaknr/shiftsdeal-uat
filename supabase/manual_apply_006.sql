-- Manual apply file for Supabase SQL Editor
-- Purpose: secure venue ownership RLS + venue access controls
-- Run this whole file in the Supabase SQL editor.

-- Extend existing venues table with admin onboarding fields.
ALTER TABLE public.venues
  ADD COLUMN IF NOT EXISTS google_maps_link TEXT,
  ADD COLUMN IF NOT EXISTS min_booking_hours INTEGER,
  ADD COLUMN IF NOT EXISTS available_timings TEXT,
  ADD COLUMN IF NOT EXISTS pricing_per_slot DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS rules_restrictions TEXT,
  ADD COLUMN IF NOT EXISTS cancellation_policy TEXT,
  ADD COLUMN IF NOT EXISTS inventory_visibility TEXT DEFAULT 'public',
  ADD COLUMN IF NOT EXISTS booking_slots TEXT,
  ADD COLUMN IF NOT EXISTS blocked_dates TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS videos TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS gst_number TEXT,
  ADD COLUMN IF NOT EXISTS is_disabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;

-- Owner mapping table for future-proof ownership model (multiple owners/venues).
CREATE TABLE IF NOT EXISTS public.venue_ownerships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  owner_email TEXT NOT NULL,
  owner_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  owner_full_name TEXT,
  owner_phone TEXT,
  alternate_phone TEXT,
  business_name TEXT,
  organization_type TEXT,
  pan_gst TEXT,
  internal_notes TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT TRUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (venue_id, owner_email)
);

CREATE INDEX IF NOT EXISTS idx_venue_ownerships_owner_email ON public.venue_ownerships(owner_email);
CREATE INDEX IF NOT EXISTS idx_venue_ownerships_owner_user_id ON public.venue_ownerships(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_venue_ownerships_venue_id ON public.venue_ownerships(venue_id);

DROP TRIGGER IF EXISTS update_venue_ownerships_updated_at ON public.venue_ownerships;
CREATE TRIGGER update_venue_ownerships_updated_at
  BEFORE UPDATE ON public.venue_ownerships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.venue_ownerships ENABLE ROW LEVEL SECURITY;

-- ADMIN FULL ACCESS: Admins can read, create, update, and delete all venue ownership records
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'venue_ownerships'
      AND policyname = 'Admin full access to venue ownerships'
  ) THEN
    CREATE POLICY "Admin full access to venue ownerships" ON public.venue_ownerships
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.users
          WHERE users.id = auth.uid() AND users.role = 'admin'
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.users
          WHERE users.id = auth.uid() AND users.role = 'admin'
        )
      );
  END IF;
END $$;

-- OWNER READ ACCESS: Owners can only read their own venue ownership records
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'venue_ownerships'
      AND policyname = 'Owner read own venue ownership'
  ) THEN
    CREATE POLICY "Owner read own venue ownership" ON public.venue_ownerships
      FOR SELECT
      USING (
        owner_user_id = auth.uid() AND is_active = true
      );
  END IF;
END $$;

-- Enable RLS on venues table if not already enabled
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;

-- ADMIN FULL ACCESS: Admins can read, create, update, delete all venues
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'venues'
      AND policyname = 'Admin full access to venues'
  ) THEN
    CREATE POLICY "Admin full access to venues" ON public.venues
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.users
          WHERE users.id = auth.uid() AND users.role = 'admin'
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.users
          WHERE users.id = auth.uid() AND users.role = 'admin'
        )
      );
  END IF;
END $$;

-- OWNER READ ACCESS: Owners can read venues they are assigned to via venue_ownerships
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'venues'
      AND policyname = 'Owner read own venues'
  ) THEN
    CREATE POLICY "Owner read own venues" ON public.venues
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.venue_ownerships
          WHERE venue_ownerships.venue_id = venues.id
            AND venue_ownerships.owner_user_id = auth.uid()
            AND venue_ownerships.is_active = true
        )
        OR owner_id = auth.uid()
      );
  END IF;
END $$;

-- OWNER UPDATE ACCESS: Owners can update only their own venue details (not ownership structure)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'venues'
      AND policyname = 'Owner update own venues'
  ) THEN
    CREATE POLICY "Owner update own venues" ON public.venues
      FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM public.venue_ownerships
          WHERE venue_ownerships.venue_id = venues.id
            AND venue_ownerships.owner_user_id = auth.uid()
            AND venue_ownerships.is_active = true
        )
        OR owner_id = auth.uid()
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.venue_ownerships
          WHERE venue_ownerships.venue_id = venues.id
            AND venue_ownerships.owner_user_id = auth.uid()
            AND venue_ownerships.is_active = true
        )
        OR owner_id = auth.uid()
      );
  END IF;
END $$;

-- NOTE: Owners deliberately do NOT have DELETE access to venues.
-- Venue lifecycle (archive, disable) is managed by admins through venue_ownerships.is_active
-- and venues columns (is_disabled, is_archived).

-- Backfill existing venues so the mapping table represents current ownership.
INSERT INTO public.venue_ownerships (
  venue_id,
  owner_email,
  owner_user_id,
  owner_full_name,
  is_primary,
  is_active
)
SELECT
  v.id,
  LOWER(u.email),
  u.id,
  u.name,
  TRUE,
  TRUE
FROM public.venues v
JOIN public.users u ON u.id = v.owner_id
WHERE v.owner_id IS NOT NULL
ON CONFLICT (venue_id, owner_email) DO NOTHING;

-- Storage bucket for admin-uploaded venue videos.
INSERT INTO storage.buckets (id, name, public)
VALUES ('venue-videos', 'venue-videos', true)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Public Access for Venue Videos'
  ) THEN
    CREATE POLICY "Public Access for Venue Videos"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'venue-videos');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Authenticated users can upload venue videos'
  ) THEN
    CREATE POLICY "Authenticated users can upload venue videos"
    ON storage.objects FOR INSERT
    WITH CHECK (
      bucket_id = 'venue-videos'
      AND (
        EXISTS (
          SELECT 1 FROM public.users
          WHERE users.id = auth.uid() AND users.role = 'admin'
        )
        OR EXISTS (
          SELECT 1 FROM public.venue_ownerships
          WHERE owner_user_id = auth.uid() AND is_active = true
        )
      )
    );
  END IF;
END $$;
