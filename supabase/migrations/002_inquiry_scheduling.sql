-- Migration 002: Inquiry Scheduling & Unavailable Dates
-- Run this in your Supabase SQL Editor AFTER Migration 001 (inquiries table setup)

-- 1. Add scheduled_date column to inquiries
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS scheduled_date DATE;

-- 2. Create unavailable_dates table (Super Admin managed)
CREATE TABLE IF NOT EXISTS unavailable_dates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  reason TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable RLS on unavailable_dates
ALTER TABLE unavailable_dates ENABLE ROW LEVEL SECURITY;

-- 4. Policies for unavailable_dates

-- Allow anyone to view unavailable dates (needed for landing page date picker)
DROP POLICY IF EXISTS "Allow public to view unavailable_dates" ON unavailable_dates;
CREATE POLICY "Allow public to view unavailable_dates" ON unavailable_dates
  FOR SELECT USING (true);

-- Allow admins to insert unavailable dates
DROP POLICY IF EXISTS "Allow admins to insert unavailable_dates" ON unavailable_dates;
CREATE POLICY "Allow admins to insert unavailable_dates" ON unavailable_dates
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Allow admins to delete unavailable dates
DROP POLICY IF EXISTS "Allow admins to delete unavailable_dates" ON unavailable_dates;
CREATE POLICY "Allow admins to delete unavailable_dates" ON unavailable_dates
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- 5. Enable realtime for unavailable_dates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'unavailable_dates'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE unavailable_dates;
  END IF;
END $$;

COMMENT ON TABLE unavailable_dates IS 'Dates blocked by Super Admin for scheduling';
