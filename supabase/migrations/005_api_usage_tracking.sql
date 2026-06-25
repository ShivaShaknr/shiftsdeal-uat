-- API Usage Tracking Table
-- Tracks usage of external APIs like Mapbox to prevent exceeding free tier limits

CREATE TABLE IF NOT EXISTS public.api_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_name TEXT NOT NULL UNIQUE,
  usage_count INTEGER NOT NULL DEFAULT 0,
  usage_limit INTEGER NOT NULL DEFAULT 25000,
  reset_date TIMESTAMPTZ NOT NULL DEFAULT (date_trunc('month', now()) + interval '1 month'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert initial record for Mapbox
INSERT INTO public.api_usage (api_name, usage_count, usage_limit, reset_date)
VALUES ('mapbox', 0, 25000, date_trunc('month', now()) + interval '1 month')
ON CONFLICT (api_name) DO NOTHING;

-- Function to increment usage and check limit
CREATE OR REPLACE FUNCTION public.increment_api_usage(p_api_name TEXT)
RETURNS TABLE(allowed BOOLEAN, current_count INTEGER, limit_count INTEGER) AS $$
DECLARE
  v_usage_count INTEGER;
  v_usage_limit INTEGER;
  v_reset_date TIMESTAMPTZ;
BEGIN
  -- Get current usage record
  SELECT usage_count, usage_limit, api_usage.reset_date 
  INTO v_usage_count, v_usage_limit, v_reset_date
  FROM public.api_usage 
  WHERE api_name = p_api_name
  FOR UPDATE;
  
  -- If no record exists, create one
  IF NOT FOUND THEN
    INSERT INTO public.api_usage (api_name, usage_count, usage_limit, reset_date)
    VALUES (p_api_name, 1, 25000, date_trunc('month', now()) + interval '1 month')
    RETURNING usage_count, usage_limit INTO v_usage_count, v_usage_limit;
    
    RETURN QUERY SELECT TRUE, v_usage_count, v_usage_limit;
    RETURN;
  END IF;
  
  -- Check if we need to reset (new month)
  IF now() >= v_reset_date THEN
    UPDATE public.api_usage 
    SET usage_count = 1,
        reset_date = date_trunc('month', now()) + interval '1 month',
        updated_at = now()
    WHERE api_name = p_api_name
    RETURNING usage_count INTO v_usage_count;
    
    RETURN QUERY SELECT TRUE, v_usage_count, v_usage_limit;
    RETURN;
  END IF;
  
  -- Check if limit reached
  IF v_usage_count >= v_usage_limit THEN
    RETURN QUERY SELECT FALSE, v_usage_count, v_usage_limit;
    RETURN;
  END IF;
  
  -- Increment usage
  UPDATE public.api_usage 
  SET usage_count = usage_count + 1,
      updated_at = now()
  WHERE api_name = p_api_name
  RETURNING usage_count INTO v_usage_count;
  
  RETURN QUERY SELECT TRUE, v_usage_count, v_usage_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check usage without incrementing
CREATE OR REPLACE FUNCTION public.check_api_usage(p_api_name TEXT)
RETURNS TABLE(allowed BOOLEAN, current_count INTEGER, limit_count INTEGER) AS $$
DECLARE
  v_usage_count INTEGER;
  v_usage_limit INTEGER;
  v_reset_date TIMESTAMPTZ;
BEGIN
  SELECT usage_count, usage_limit, api_usage.reset_date 
  INTO v_usage_count, v_usage_limit, v_reset_date
  FROM public.api_usage 
  WHERE api_name = p_api_name;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT TRUE, 0, 25000;
    RETURN;
  END IF;
  
  -- Check if we need to reset (new month)
  IF now() >= v_reset_date THEN
    RETURN QUERY SELECT TRUE, 0, v_usage_limit;
    RETURN;
  END IF;
  
  RETURN QUERY SELECT (v_usage_count < v_usage_limit), v_usage_count, v_usage_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS
ALTER TABLE public.api_usage ENABLE ROW LEVEL SECURITY;

-- Policy to allow reading (for checking limits)
CREATE POLICY "Allow public read access to api_usage" ON public.api_usage
  FOR SELECT USING (true);

-- Policy to allow the functions to update (via SECURITY DEFINER)
CREATE POLICY "Allow service role to update api_usage" ON public.api_usage
  FOR ALL USING (true);
